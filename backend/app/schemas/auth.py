from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    name: str = Field(min_length=3, max_length=255)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    institution_name: str = Field(min_length=3, max_length=255)
    tax_id: str | None = Field(default=None, max_length=50)
    accept_terms: bool


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class GoogleLoginRequest(BaseModel):
    id_token: str = Field(min_length=20)


class RefreshRequest(BaseModel):
    refresh_token: str = Field(min_length=20)


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "Bearer"
    expires_in: int
    user: "UserOut"


from app.schemas.user import UserOut  # noqa: E402

TokenResponse.model_rebuild()
