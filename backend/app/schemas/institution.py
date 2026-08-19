from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class InstitutionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    legal_name: str
    tax_id: str | None
    email: EmailStr
    phone: str | None
    address: str | None
    city: str | None
    country: str | None
    website: str | None
    logo: str | None
    status: str
    created_at: datetime


class InstitutionUpdate(BaseModel):
    legal_name: str | None = Field(default=None, min_length=3, max_length=255)
    tax_id: str | None = Field(default=None, max_length=50)
    email: EmailStr | None = None
    phone: str | None = Field(default=None, max_length=50)
    address: str | None = None
    city: str | None = Field(default=None, max_length=120)
    country: str | None = Field(default=None, max_length=120)
    website: str | None = Field(default=None, max_length=255)
