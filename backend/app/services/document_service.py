import re
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import desc, or_
from sqlalchemy.orm import Session

from app.models.audit import AuditLog
from app.models.document import Document
from app.models.institution import Institution
from app.models.user import User
from app.models.verification import VerificationEvent
from app.schemas.document import DocumentCreate, PaginatedDocuments
from app.services import signature_service
from app.services.audit_service import record_audit
from app.utils.hashing import canonical_datetime, canonical_json, sha256_hex
from app.utils.identifiers import generate_document_number, generate_uuid, generate_verification_code

ACTION_DOCUMENT_CREATED = "DOCUMENT_CREATED"
ACTION_DOCUMENT_SIGNED = "DOCUMENT_SIGNED"
ACTION_DOCUMENT_REVOKED = "DOCUMENT_REVOKED"


def create_document(db: Session, current_user: User, payload: DocumentCreate) -> Document:
    institution = db.get(Institution, current_user.institution_id)
    if not institution:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Instituição não encontrada.")

    fields = [field.model_dump() for field in payload.fields]
    issued_at = datetime.now(timezone.utc)
    document_number = generate_document_number(
        institution_short=_short_name(institution.legal_name)
    )

    canonical = canonical_json(
        {
            "institution_id": institution.id,
            "document_number": document_number,
            "document_type": payload.document_type,
            "title": payload.title,
            "holder_name": payload.holder_name,
            "issued_at": canonical_datetime(issued_at),
            "extra_data": fields,
        }
    )
    content_hash = sha256_hex(canonical)
    signature_value = signature_service.sign_bytes(canonical)

    verification_code = generate_verification_code()
    while db.query(Document).filter(Document.verification_code == verification_code).first():
        verification_code = generate_verification_code()

    doc = Document(
        id=generate_uuid(),
        institution_id=institution.id,
        document_number=document_number,
        document_type=payload.document_type,
        title=payload.title,
        holder_name=payload.holder_name,
        description=payload.description,
        content_hash=content_hash,
        verification_code=verification_code,
        status="VALID",
        extra_data=fields,
        issued_at=issued_at,
        expires_at=_to_utc(payload.expires_at),
    )
    db.add(doc)
    db.flush()

    from app.models.signature import DocumentSignature

    signature = DocumentSignature(
        id=generate_uuid(),
        document_id=doc.id,
        algorithm=signature_service.ALGORITHM,
        signature=signature_value,
        public_key_reference=f"institution:{institution.id}",
        signed_by=current_user.name,
    )
    db.add(signature)

    record_audit(
        db,
        actor=current_user,
        action=ACTION_DOCUMENT_CREATED,
        entity_type="document",
        entity_id=doc.id,
        details={"number": doc.document_number},
    )
    record_audit(
        db,
        actor=current_user,
        action=ACTION_DOCUMENT_SIGNED,
        entity_type="document",
        entity_id=doc.id,
        details={"algorithm": signature.algorithm},
    )
    db.commit()
    db.refresh(doc)
    return doc


def list_documents(
    db: Session,
    *,
    institution_id: str,
    page: int = 1,
    page_size: int = 10,
    status_filter: str | None = None,
    document_type: str | None = None,
    search: str | None = None,
) -> PaginatedDocuments:
    query = db.query(Document).filter(Document.institution_id == institution_id)
    if status_filter:
        query = query.filter(Document.status == status_filter.upper())
    if document_type:
        query = query.filter(Document.document_type == document_type)
    if search:
        term = f"%{search}%"
        query = query.filter(
            or_(
                Document.title.ilike(term),
                Document.holder_name.ilike(term),
                Document.document_number.ilike(term),
            )
        )

    total = query.count()
    pages = max(1, (total + page_size - 1) // page_size)
    page = min(max(page, 1), pages)
    items = (
        query.order_by(desc(Document.created_at))
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return PaginatedDocuments(
        items=[
            {
                "id": item.id,
                "number": item.document_number,
                "type": item.document_type,
                "title": item.title,
                "holder_name": item.holder_name,
                "status": item.status,
                "issued_at": item.issued_at,
                "expires_at": item.expires_at,
                "verification_count": item.verification_count,
            }
            for item in items
        ],
        total=total,
        page=page,
        page_size=page_size,
        pages=pages,
    )


def get_document(db: Session, document_id: str, institution_id: str) -> Document:
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc or doc.institution_id != institution_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Documento não encontrado.")
    return doc


def revoke_document(db: Session, current_user: User, doc: Document, reason: str) -> Document:
    if doc.status == "REVOKED":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Documento já revogado.")

    doc.status = "REVOKED"
    doc.revoked_at = datetime.now(timezone.utc)
    doc.revoked_reason = reason
    record_audit(
        db,
        actor=current_user,
        action=ACTION_DOCUMENT_REVOKED,
        entity_type="document",
        entity_id=doc.id,
        details={"reason": reason},
    )
    db.commit()
    db.refresh(doc)
    return doc


def dashboard_stats(db: Session, institution_id: str) -> dict:
    total = db.query(Document).filter(Document.institution_id == institution_id).count()
    valid = (
        db.query(Document)
        .filter(Document.institution_id == institution_id, Document.status == "VALID")
        .count()
    )
    revoked = (
        db.query(Document)
        .filter(Document.institution_id == institution_id, Document.status == "REVOKED")
        .count()
    )
    recent_audit = (
        db.query(AuditLog)
        .join(User, AuditLog.actor_id == User.id)
        .filter(User.institution_id == institution_id)
        .order_by(desc(AuditLog.created_at))
        .limit(8)
        .all()
    )
    activity = [
        {
            "id": entry.id,
            "action": entry.action,
            "actor_name": entry.actor_name,
            "created_at": entry.created_at,
        }
        for entry in recent_audit
    ]
    return {
        "total_documents": total,
        "valid_documents": valid,
        "revoked_documents": revoked,
        "total_verifications": _count_verifications(db, institution_id),
        "recent_activity": activity,
        "recent_audit": activity,
    }


def _count_verifications(db: Session, institution_id: str) -> int:
    from sqlalchemy import func

    return (
        db.query(func.count(Document.id))
        .join(VerificationEvent, VerificationEvent.document_id == Document.id)
        .filter(Document.institution_id == institution_id)
        .scalar()
        or 0
    )


def _short_name(legal_name: str) -> str:
    words = re.sub(r"[^A-Za-z0-9 ]", "", legal_name).upper().split()
    if not words:
        return "INST"
    return "".join(word[0] for word in words[:4]) or "INST"


def _to_utc(value):
    from app.utils.hashing import as_utc

    return as_utc(value)
