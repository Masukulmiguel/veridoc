from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class VerificationSignatureInfo(BaseModel):
    valid: bool
    algorithm: str | None = None


class VerificationInstitutionInfo(BaseModel):
    id: str
    legal_name: str
    country: str | None = None
    website: str | None = None


class VerificationDocumentInfo(BaseModel):
    number: str
    type: str
    title: str
    holder_name: str
    description: str | None = None
    issued_at: datetime
    expires_at: datetime | None = None
    status: str


class VerificationResult(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    code: str
    status: str
    message: str
    document: Optional["VerificationDocumentInfo"] = None
    institution: VerificationInstitutionInfo | None = None
    signature: VerificationSignatureInfo
    verified_at: datetime


VerificationResult.model_rebuild()
