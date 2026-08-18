from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.limiter import limiter
from app.schemas.verification import VerificationResult
from app.services import verification_service

router = APIRouter(prefix="/verify", tags=["verification"])


@router.get("/{code}", response_model=VerificationResult)
@limiter.limit("30/minute")
def verify_by_code(request: Request, code: str, db: Session = Depends(get_db)) -> VerificationResult:
    return verification_service.verify_by_code(db, code)


@router.get("", response_model=VerificationResult)
@limiter.limit("30/minute")
def verify_by_query(
    request: Request,
    code: str | None = Query(None, max_length=32),
    document_id: str | None = Query(None, max_length=36),
    db: Session = Depends(get_db),
) -> VerificationResult:
    if document_id:
        return verification_service.verify_by_document_id(db, document_id)
    if code:
        return verification_service.verify_by_code(db, code)
    raise HTTPException(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        detail="Forneça um código de verificação ou um ID de documento.",
    )
