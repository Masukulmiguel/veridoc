from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.schemas.auth import _PASSWORD_PATTERN


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    email: EmailStr
    role: str
    status: str
    institution_id: str
    created_at: datetime
    updated_at: datetime


class CreateUserRequest(BaseModel):
    name: str = Field(min_length=3, max_length=255)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    role: str = Field(default="ISSUER", pattern="^(ADMIN|ISSUER|VIEWER)$")

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        if not _PASSWORD_PATTERN.match(v):
            raise ValueError(
                "A password deve conter pelo menos: 1 maiúscula, 1 minúscula, 1 número e 1 caractere especial (!@#$%^&*()-_+=)."
            )
        return v


class UpdateUserRequest(BaseModel):
    name: str | None = Field(default=None, min_length=3, max_length=255)
    role: str | None = Field(default=None, pattern="^(ADMIN|ISSUER|VIEWER)$")
    status: str | None = Field(default=None, pattern="^(ACTIVE|SUSPENDED)$")
    password: str | None = Field(default=None, min_length=8, max_length=128)

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v: str | None) -> str | None:
        if v is not None and not _PASSWORD_PATTERN.match(v):
            raise ValueError(
                "A password deve conter pelo menos: 1 maiúscula, 1 minúscula, 1 número e 1 caractere especial (!@#$%^&*()-_+=)."
            )
        return v
