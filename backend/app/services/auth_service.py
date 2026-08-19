import logging
from datetime import datetime, timedelta, timezone

import httpx
import jwt
from authlib.jose import JsonWebToken
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.models.audit import AuditLog
from app.models.institution import Institution
from app.models.user import User
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse
from app.services.audit_service import record_audit
from app.utils.identifiers import generate_uuid

logger = logging.getLogger(__name__)

ACTION_USER_CREATED = "USER_CREATED"
ACTION_LOGIN = "LOGIN"

MAX_FAILED_ATTEMPTS = 5
LOCKOUT_MINUTES = 15
RESET_TOKEN_EXPIRE_MINUTES = 30


def register(db: Session, payload: RegisterRequest) -> User:
    if not payload.accept_terms:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="É necessário aceitar os termos e condições.",
        )

    existing = db.query(User).filter(User.email == payload.email.lower()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Já existe uma conta com este e-mail.",
        )

    institution = Institution(
        id=generate_uuid(),
        legal_name=payload.institution_name,
        tax_id=payload.tax_id,
        email=payload.email.lower(),
        country="AO",
    )
    db.add(institution)

    user = User(
        id=generate_uuid(),
        institution_id=institution.id,
        name=payload.name,
        email=payload.email.lower(),
        password_hash=hash_password(payload.password),
        role="ADMIN",
    )
    db.add(user)
    record_audit(
        db,
        actor=user,
        action=ACTION_USER_CREATED,
        entity_type="user",
        entity_id=user.id,
        details={"institution_id": institution.id},
    )
    db.commit()
    db.refresh(user)
    return user


def authenticate(db: Session, payload: LoginRequest) -> User:
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if not user or not user.password_hash:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciais inválidas.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    now = datetime.now(timezone.utc)
    if user.locked_until and user.locked_until > now:
        remaining = int((user.locked_until - now).total_seconds() / 60) + 1
        raise HTTPException(
            status_code=status.HTTP_423_LOCKED,
            detail=f"Conta bloqueada. Tente novamente em {remaining} minuto(s).",
        )

    if not verify_password(payload.password, user.password_hash):
        user.failed_login_attempts += 1
        if user.failed_login_attempts >= MAX_FAILED_ATTEMPTS:
            user.locked_until = now + timedelta(minutes=LOCKOUT_MINUTES)
            user.failed_login_attempts = 0
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_423_LOCKED,
                detail=f"Conta bloqueada após {MAX_FAILED_ATTEMPTS} tentativas. Tente novamente em {LOCKOUT_MINUTES} minutos.",
            )
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciais inválidas.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user.failed_login_attempts = 0
    user.locked_until = None
    db.commit()

    if user.status != "ACTIVE":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Conta suspensa. Contacte o administrador da instituição.",
        )
    return user


def issue_tokens(user: User, db: Session) -> TokenResponse:
    record_audit(
        db,
        actor=user,
        action=ACTION_LOGIN,
        entity_type="user",
        entity_id=user.id,
    )
    db.commit()
    return TokenResponse(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=user,
    )


def refresh_tokens(db: Session, refresh_token: str) -> TokenResponse:
    payload = decode_token(refresh_token, expected_type="refresh")
    user = db.get(User, payload["sub"])
    if not user or user.status != "ACTIVE":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Conta inválida ou suspensa.",
        )
    return TokenResponse(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=user,
    )


def verify_google_id_token(id_token: str) -> dict:
    try:
        response = httpx.get(settings.GOOGLE_JWKS_URL, timeout=10)
        response.raise_for_status()
        jwks = response.json()
        jwt_engine = JsonWebToken()
        claims = jwt_engine.decode(
            id_token,
            jwks,
            claims_options={
                "iss": {
                    "essential": True,
                    "values": ["https://accounts.google.com", "accounts.google.com"],
                },
                "exp": {"essential": True},
            },
        )
    except Exception as exc:
        logger.warning("Falha ao validar id_token do Google: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token do Google inválido ou expirado.",
        ) from exc

    if claims.get("aud") != settings.GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="O token do Google não pertence a esta aplicação.",
        )
    return claims


def login_or_create_google(db: Session, claims: dict) -> User:
    email = (claims.get("email") or "").lower()
    google_id = claims.get("sub")
    if not email or not google_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="O perfil do Google não contém e-mail válido.",
        )

    user = db.query(User).filter(User.email == email).first()
    if user:
        user.google_id = user.google_id or google_id
        db.commit()
        db.refresh(user)
        return user

    institution = Institution(
        id=generate_uuid(),
        legal_name="Instituição Google",
        email=email,
        country="AO",
    )
    db.add(institution)
    user = User(
        id=generate_uuid(),
        institution_id=institution.id,
        name=claims.get("name") or "Utilizador Google",
        email=email,
        google_id=google_id,
        role="ADMIN",
    )
    db.add(user)
    record_audit(
        db,
        actor=user,
        action=ACTION_USER_CREATED,
        entity_type="user",
        entity_id=user.id,
        details={"via": "google"},
    )
    db.commit()
    db.refresh(user)
    return user


def get_google_authorization_url(redirect_uri: str | None = None) -> str:
    uri = redirect_uri or settings.GOOGLE_REDIRECT_URI
    return (
        f"{settings.GOOGLE_AUTH_URL}?client_id={settings.GOOGLE_CLIENT_ID}"
        f"&redirect_uri={uri}"
        "&response_type=code&scope=openid%20email%20profile"
    )


def exchange_google_code(db: Session, code: str, redirect_uri: str | None = None) -> User:
    if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Autenticação Google não configurada.",
        )
    uri = redirect_uri or settings.GOOGLE_REDIRECT_URI
    try:
        token_response = httpx.post(
            settings.GOOGLE_TOKEN_URL,
            data={
                "code": code,
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "redirect_uri": uri,
                "grant_type": "authorization_code",
            },
            timeout=15,
        )
        if token_response.status_code != 200:
            logger.error(
                "Google token exchange failed [%s]: %s",
                token_response.status_code,
                token_response.text,
            )
        token_response.raise_for_status()
        token_data = token_response.json()
        access_token = token_data.get("access_token")
    except Exception as exc:
        logger.warning("Troca de código OAuth falhou: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Falha na autenticação com o Google.",
        ) from exc

    # Buscar dados do utilizador com o access_token
    try:
        userinfo_response = httpx.get(
            settings.GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=10,
        )
        userinfo_response.raise_for_status()
        claims = userinfo_response.json()
    except Exception as exc:
        logger.warning("Falha ao buscar userinfo do Google: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Falha ao obter dados do perfil Google.",
        ) from exc

    return login_or_create_google(db, claims)


def to_public_user(user: User) -> dict:
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "status": user.status,
        "institution_id": user.institution_id,
        "created_at": user.created_at,
    }


def _create_reset_token(user_id: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_id,
        "type": "reset",
        "iat": now,
        "exp": now + timedelta(minutes=RESET_TOKEN_EXPIRE_MINUTES),
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def _decode_reset_token(token: str) -> str:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de recuperação expirado.",
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de recuperação inválido.",
        )
    if payload.get("type") != "reset":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido.",
        )
    return payload["sub"]


def forgot_password(db: Session, email: str) -> dict:
    user = db.query(User).filter(User.email == email.lower()).first()
    if not user:
        return {"message": "Se o e-mail existir, receberá um link de recuperação."}

    reset_token = _create_reset_token(user.id)

    record_audit(
        db,
        actor=user,
        action="PASSWORD_RESET_REQUESTED",
        entity_type="user",
        entity_id=user.id,
    )
    db.commit()

    logger.info("Token de recuperação para %s: %s", email, reset_token)

    return {
        "message": "Se o e-mail existir, receberá um link de recuperação.",
        "reset_token": reset_token,
    }


def reset_password(db: Session, token: str, new_password: str) -> dict:
    user_id = _decode_reset_token(token)
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utilizador não encontrado.",
        )

    user.password_hash = hash_password(new_password)
    user.failed_login_attempts = 0
    user.locked_until = None

    record_audit(
        db,
        actor=user,
        action="PASSWORD_RESET",
        entity_type="user",
        entity_id=user.id,
    )
    db.commit()

    return {"message": "Password alterada com sucesso."}
