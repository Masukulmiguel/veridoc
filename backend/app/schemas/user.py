from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    email: EmailStr
    role: str
    status: str
    institution_id: str
    created_at: datetime


class CreateUserRequest(BaseModel):
    name: str = Field(min_length=3, max_length=255)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    role: str = Field(default="ISSUER", pattern="^(ADMIN|ISSUER|VIEWER)$")


class UpdateUserRequest(BaseModel):
    name: str | None = Field(default=None, min_length=3, max_length=255)
    role: str | None = Field(default=None, pattern="^(ADMIN|ISSUER|VIEWER)$")
    status: str | None = Field(default=None, pattern="^(ACTIVE|SUSPENDED)$")
    password: str | None = Field(default=None, min_length=8, max_length=128)
