import logging

import httpx
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
    if not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciais inválidas.",
            headers={"WWW-Authenticate": "Bearer"},
        )
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


def get_google_authorization_url() -> str:
    return (
        f"{settings.GOOGLE_AUTH_URL}?client_id={settings.GOOGLE_CLIENT_ID}"
        f"&redirect_uri={settings.GOOGLE_REDIRECT_URI}"
        "&response_type=code&scope=openid%20email%20profile"
    )


def exchange_google_code(db: Session, code: str) -> User:
    if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Autenticação Google não configurada.",
        )
    try:
        response = httpx.post(
            settings.GOOGLE_TOKEN_URL,
            data={
                "code": code,
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "redirect_uri": settings.GOOGLE_REDIRECT_URI,
                "grant_type": "authorization_code",
            },
            timeout=15,
        )
        response.raise_for_status()
        id_token = response.json()["id_token"]
    except Exception as exc:
        logger.warning("Troca de código OAuth falhou: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Falha na autenticação com o Google.",
        ) from exc

    claims = verify_google_id_token(id_token)
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
