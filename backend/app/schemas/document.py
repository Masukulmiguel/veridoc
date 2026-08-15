from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class DocumentField(BaseModel):
    label: str = Field(min_length=1, max_length=255)
    value: str = Field(min_length=1, max_length=2000)


class InstitutionRef(BaseModel):
    id: str
    name: str


class SignatureInfo(BaseModel):
    algorithm: str
    value: str
    signed_by: str
    signed_at: datetime


class HistoryEntry(BaseModel):
    id: str
    action: str
    actor_name: str
    created_at: datetime


class DocumentCreate(BaseModel):
    document_type: str = Field(min_length=2, max_length=40)
    title: str = Field(min_length=3, max_length=255)
    holder_name: str = Field(min_length=2, max_length=255)
    description: str | None = Field(default=None, max_length=2000)
    fields: list[DocumentField] = Field(default_factory=list, max_length=50)
    expires_at: datetime | None = None


class DocumentOut(BaseModel):
    id: str
    number: str
    type: str
    title: str
    holder_name: str
    description: str | None
    status: str
    issued_at: datetime
    expires_at: datetime | None
    revoked_at: datetime | None
    revoked_reason: str | None
    verification_code: str
    content_hash: str
    institution: InstitutionRef
    signature: SignatureInfo | None
    verification_count: int
    fields: list[DocumentField]
    history: list[HistoryEntry]
    created_at: datetime


class DocumentListItem(BaseModel):
    id: str
    number: str
    type: str
    title: str
    holder_name: str
    status: str
    issued_at: datetime
    expires_at: datetime | None
    verification_count: int


class PaginatedDocuments(BaseModel):
    items: list[DocumentListItem]
    total: int
    page: int
    page_size: int
    pages: int


class RevokeRequest(BaseModel):
    reason: str = Field(min_length=3, max_length=2000)
