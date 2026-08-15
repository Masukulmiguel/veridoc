from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import require_admin
from app.core.database import get_db
from app.models.institution import Institution
from app.models.user import User
from app.schemas.institution import InstitutionOut, InstitutionUpdate
from app.services.audit_service import record_audit

router = APIRouter(prefix="/institutions", tags=["institutions"])


@router.get("/me", response_model=InstitutionOut)
def get_my_institution(
    db: Session = Depends(get_db),
    user: User = Depends(require_admin),
) -> Institution:
    institution = db.get(Institution, user.institution_id)
    if not institution:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Instituição não encontrada.")
    return institution


@router.put("/me", response_model=InstitutionOut)
def update_my_institution(
    payload: InstitutionUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
) -> Institution:
    institution = db.get(Institution, admin.institution_id)
    if not institution:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Instituição não encontrada.")

    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(institution, field, value)

    record_audit(
        db,
        actor=admin,
        action="INSTITUTION_UPDATED",
        entity_type="institution",
        entity_id=institution.id,
        details={"fields": list(updates.keys())},
    )
    db.commit()
    db.refresh(institution)
    return institution
