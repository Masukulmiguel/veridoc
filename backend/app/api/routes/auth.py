from urllib.parse import urlencode

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.config import settings
from app.core.database import get_db
from app.core.limiter import limiter
from app.models.user import User
from app.schemas.auth import (
    ForgotPasswordRequest,
    GoogleLoginRequest,
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    ResetPasswordRequest,
    TokenResponse,
)
from app.schemas.user import UserOut
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=201)
@limiter.limit("5/minute")
def register(request: Request, payload: RegisterRequest, db: Session = Depends(get_db)) -> TokenResponse:
    user = auth_service.register(db, payload)
    return auth_service.issue_tokens(user, db)


@router.post("/login", response_model=TokenResponse)
@limiter.limit("10/minute")
def login(request: Request, payload: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    user = auth_service.authenticate(db, payload)
    return auth_service.issue_tokens(user, db)


@router.post("/refresh", response_model=TokenResponse)
@limiter.limit("20/minute")
def refresh(request: Request, payload: RefreshRequest, db: Session = Depends(get_db)) -> TokenResponse:
    return auth_service.refresh_tokens(db, payload.refresh_token)


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)) -> User:
    return user


@router.post("/google", response_model=TokenResponse)
@limiter.limit("10/minute")
def google_login(request: Request, payload: GoogleLoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    claims = auth_service.verify_google_id_token(payload.id_token)
    user = auth_service.login_or_create_google(db, claims)
    return auth_service.issue_tokens(user, db)


@router.get("/google", include_in_schema=False)
def google_authorize(request: Request) -> RedirectResponse:
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Autenticação Google não configurada.",
        )
    dynamic_redirect = f"{settings.FRONTEND_URL}/api/auth/google/callback"
    return RedirectResponse(auth_service.get_google_authorization_url(dynamic_redirect))


@router.get("/google/callback", include_in_schema=False)
def google_callback(request: Request, code: str = Query(...), db: Session = Depends(get_db)) -> RedirectResponse:
    dynamic_redirect = f"{settings.FRONTEND_URL}/api/auth/google/callback"
    user = auth_service.exchange_google_code(db, code, dynamic_redirect)
    token_response = auth_service.issue_tokens(user, db)
    params = urlencode(
        {
            "access_token": token_response.access_token,
            "refresh_token": token_response.refresh_token,
            "expires_in": token_response.expires_in,
        }
    )
    return RedirectResponse(f"{settings.FRONTEND_URL}/login?oauth=success&{params}")


@router.post("/forgot-password")
@limiter.limit("5/minute")
def forgot_password(request: Request, payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    return auth_service.forgot_password(db, payload.email)


@router.post("/reset-password")
@limiter.limit("3/minute")
def reset_password(request: Request, payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    return auth_service.reset_password(db, payload.token, payload.new_password)
