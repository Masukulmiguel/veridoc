from urllib.parse import urlencode

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.config import settings
from app.core.database import get_db
from app.models.user import User
from app.schemas.auth import (
    GoogleLoginRequest,
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    TokenResponse,
)
from app.schemas.user import UserOut
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=201)
def register(payload: RegisterRequest, db: Session = Depends(get_db)) -> TokenResponse:
    user = auth_service.register(db, payload)
    return auth_service.issue_tokens(user, db)


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    user = auth_service.authenticate(db, payload)
    return auth_service.issue_tokens(user, db)


@router.post("/refresh", response_model=TokenResponse)
def refresh(payload: RefreshRequest, db: Session = Depends(get_db)) -> TokenResponse:
    return auth_service.refresh_tokens(db, payload.refresh_token)


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)) -> User:
    return user


@router.post("/google", response_model=TokenResponse)
def google_login(payload: GoogleLoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    claims = auth_service.verify_google_id_token(payload.id_token)
    user = auth_service.login_or_create_google(db, claims)
    return auth_service.issue_tokens(user, db)


@router.get("/google", include_in_schema=False)
def google_authorize() -> RedirectResponse:
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Autenticação Google não configurada.",
        )
    return RedirectResponse(auth_service.get_google_authorization_url())


@router.get("/google/callback", include_in_schema=False)
def google_callback(code: str = Query(...), db: Session = Depends(get_db)) -> RedirectResponse:
    user = auth_service.exchange_google_code(db, code)
    access_token = auth_service.create_access_token(user.id)
    refresh_token = auth_service.create_refresh_token(user.id)
    params = urlencode(
        {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        }
    )
    frontend_url = settings.FRONTEND_URL.rstrip("/")
    return RedirectResponse(f"{frontend_url}/login?oauth=success&{params}")
