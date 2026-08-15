from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_issuer
from app.core.database import get_db
from app.models.document import Document
from app.models.user import User
from app.schemas.document import (
    DocumentCreate,
    DocumentOut,
    PaginatedDocuments,
    RevokeRequest,
)
from app.services import document_service, pdf_service, qr_service
from app.services.audit_service import document_history

router = APIRouter(prefix="/documents", tags=["documents"])


def _to_out(doc: Document, db: Session) -> dict:
    return {
        "id": doc.id,
        "number": doc.document_number,
        "type": doc.document_type,
        "title": doc.title,
        "holder_name": doc.holder_name,
        "description": doc.description,
        "status": doc.status,
        "issued_at": doc.issued_at,
        "expires_at": doc.expires_at,
        "revoked_at": doc.revoked_at,
        "revoked_reason": doc.revoked_reason,
        "verification_code": doc.verification_code,
        "content_hash": doc.content_hash,
        "institution": {"id": doc.institution.id, "name": doc.institution.legal_name},
        "signature": (
            {
                "algorithm": doc.signature.algorithm,
                "value": doc.signature.signature,
                "signed_by": doc.signature.signed_by,
                "signed_at": doc.signature.created_at,
            }
            if doc.signature
            else None
        ),
        "verification_count": doc.verification_count,
        "fields": doc.extra_data or [],
        "history": document_history(db, doc.id),
        "created_at": doc.created_at,
    }


@router.get("", response_model=PaginatedDocuments)
def list_documents(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    status: str | None = Query(None, pattern="^(VALID|REVOKED|EXPIRED|INVALID|PENDING)$"),
    document_type: str | None = None,
    search: str | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> PaginatedDocuments:
    return document_service.list_documents(
        db,
        institution_id=user.institution_id,
        page=page,
        page_size=page_size,
        status_filter=status,
        document_type=document_type,
        search=search,
    )


@router.post("", response_model=DocumentOut, status_code=status.HTTP_201_CREATED)
def create_document(
    payload: DocumentCreate,
    db: Session = Depends(get_db),
    issuer: User = Depends(require_issuer),
) -> dict:
    doc = document_service.create_document(db, issuer, payload)
    return _to_out(doc, db)


@router.get("/{document_id}", response_model=DocumentOut)
def get_document(
    document_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    doc = document_service.get_document(db, document_id, user.institution_id)
    return _to_out(doc, db)


@router.post("/{document_id}/revoke", response_model=DocumentOut)
def revoke_document(
    document_id: str,
    payload: RevokeRequest,
    db: Session = Depends(get_db),
    issuer: User = Depends(require_issuer),
) -> dict:
    doc = document_service.get_document(db, document_id, issuer.institution_id)
    revoked = document_service.revoke_document(db, issuer, doc, payload.reason)
    return _to_out(revoked, db)


@router.get("/{document_id}/qrcode", response_class=Response)
def document_qrcode(
    document_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Response:
    doc = document_service.get_document(db, document_id, user.institution_id)
    return Response(
        content=qr_service.generate_qr_png(doc.verification_code),
        media_type="image/png",
        headers={"Cache-Control": "no-store"},
    )


@router.get("/{document_id}/pdf", response_class=Response)
def document_pdf(
    document_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Response:
    doc = document_service.get_document(db, document_id, user.institution_id)
    qr_png = qr_service.generate_qr_png(doc.verification_code)
    pdf_buffer = pdf_service.generate_document_pdf(doc, doc.institution, qr_png)
    return Response(
        content=pdf_buffer.getvalue(),
        media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="{doc.document_number}.pdf"'},
    )

