import re

from pydantic import BaseModel, EmailStr, Field, field_validator


_PASSWORD_PATTERN = re.compile(r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+=\[\]{};':\"\\|,.<>/?]).{8,128}$")


class RegisterRequest(BaseModel):
    name: str = Field(min_length=3, max_length=255)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    institution_name: str = Field(min_length=3, max_length=255)
    tax_id: str | None = Field(default=None, max_length=50)
    accept_terms: bool

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        if not _PASSWORD_PATTERN.match(v):
            raise ValueError(
                "A password deve conter pelo menos: 1 maiúscula, 1 minúscula, 1 número e 1 caractere especial (!@#$%^&*()-_+=)."
            )
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class GoogleLoginRequest(BaseModel):
    id_token: str = Field(min_length=20)


class RefreshRequest(BaseModel):
    refresh_token: str = Field(min_length=20)


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str = Field(min_length=20)
    new_password: str = Field(min_length=8, max_length=128)

    @field_validator("new_password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        if not _PASSWORD_PATTERN.match(v):
            raise ValueError(
                "A password deve conter pelo menos: 1 maiúscula, 1 minúscula, 1 número e 1 caractere especial (!@#$%^&*()-_+=)."
            )
        return v


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "Bearer"
    expires_in: int
    user: "UserOut"


from app.schemas.user import UserOut  # noqa: E402

TokenResponse.model_rebuild()
