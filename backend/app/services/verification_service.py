from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.document import Document
from app.models.verification import VerificationEvent
from app.schemas.verification import (
    VerificationInstitutionInfo,
    VerificationResult,
    VerificationSignatureInfo,
)
from app.services import signature_service
from app.services.audit_service import record_audit
from app.utils.hashing import as_utc, canonical_datetime, canonical_json, sha256_hex
from app.utils.identifiers import generate_uuid

ACTION_DOCUMENT_VERIFIED = "DOCUMENT_VERIFIED"

STATUS_VALID = "VALID"
STATUS_REVOKED = "REVOKED"
STATUS_EXPIRED = "EXPIRED"
STATUS_INVALID = "INVALID"

MESSAGES = {
    STATUS_VALID: "Documento autêntico. O conteúdo confere com o emitido pela instituição emissora.",
    STATUS_REVOKED: "Documento revogado pela instituição emissora.",
    STATUS_EXPIRED: "Documento expirado. A sua validade terminou.",
    STATUS_INVALID: "Documento inválido. O conteúdo ou a assinatura não conferem.",
    "NOT_FOUND": "Documento não encontrado. Verifique o código e tente novamente.",
}


def _resolve_result(doc: Document) -> tuple[str, str]:
    if doc.status == STATUS_REVOKED:
        return STATUS_REVOKED, MESSAGES[STATUS_REVOKED]

    canonical = canonical_json(doc.canonical_payload)
    recomputed_hash = sha256_hex(canonical)

    signature_valid = False
    if doc.signature:
        signature_valid = signature_service.verify_signature(
            canonical, doc.signature.signature
        )

    if recomputed_hash != doc.content_hash or not signature_valid:
        return STATUS_INVALID, MESSAGES[STATUS_INVALID]

    expires_at = as_utc(doc.expires_at)
    if expires_at is not None and expires_at < as_utc(datetime.now(timezone.utc)):
        return STATUS_EXPIRED, MESSAGES[STATUS_EXPIRED]

    return STATUS_VALID, MESSAGES[STATUS_VALID]


def verify_by_code(db: Session, code: str) -> VerificationResult:
    doc = db.query(Document).filter(Document.verification_code == code).first()
    if not doc:
        return VerificationResult(
            code=code,
            status=STATUS_INVALID,
            message=MESSAGES["NOT_FOUND"],
            document=None,
            institution=None,
            signature=VerificationSignatureInfo(valid=False),
            verified_at=datetime.now(timezone.utc),
        )

    return _verify_document(db, doc)


def verify_by_document_id(db: Session, document_id: str) -> VerificationResult:
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Documento não encontrado.")
    return _verify_document(db, doc)


def _verify_document(db: Session, doc: Document) -> VerificationResult:
    resolved_status, message = _resolve_result(doc)

    event = VerificationEvent(
        id=generate_uuid(),
        document_id=doc.id,
        verification_code=doc.verification_code,
        result=resolved_status,
    )
    db.add(event)
    record_audit(
        db,
        actor=None,
        action=ACTION_DOCUMENT_VERIFIED,
        entity_type="document",
        entity_id=doc.id,
        details={"result": resolved_status},
    )
    db.commit()

    return VerificationResult(
        code=doc.verification_code,
        status=resolved_status,
        message=message,
        document={
            "number": doc.document_number,
            "type": doc.document_type,
            "title": doc.title,
            "holder_name": doc.holder_name,
            "description": doc.description,
            "issued_at": doc.issued_at,
            "expires_at": doc.expires_at,
            "status": doc.status,
        },
        institution=VerificationInstitutionInfo(
            id=doc.institution.id,
            legal_name=doc.institution.legal_name,
            country=doc.institution.country,
            website=doc.institution.website,
        )
        if doc.institution
        else None,
        signature=VerificationSignatureInfo(
            valid=(resolved_status == STATUS_VALID),
            algorithm=doc.signature.algorithm if doc.signature else None,
        ),
        verified_at=datetime.now(timezone.utc),
    )
