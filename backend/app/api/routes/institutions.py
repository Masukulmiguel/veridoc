import base64
import re

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_admin
from app.core.database import get_db
from app.models.institution import Institution
from app.models.user import User
from app.schemas.institution import InstitutionOut, InstitutionUpdate
from app.services.audit_service import record_audit

router = APIRouter(prefix="/institutions", tags=["institutions"])

MAX_LOGO_BYTES = 500 * 1024  # 500 KB
ALLOWED_MIME = {"image/png", "image/jpeg", "image/svg+xml"}


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


@router.post("/me/logo", response_model=InstitutionOut)
async def upload_institution_logo(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
) -> Institution:
    institution = db.get(Institution, admin.institution_id)
    if not institution:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Instituição não encontrada.")

    if file.content_type not in ALLOWED_MIME:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Formato não suportado. Use: PNG, JPG ou SVG.",
        )

    contents = await file.read()
    if len(contents) > MAX_LOGO_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ficheiro demasiado grande. Máximo: 500 KB.",
        )

    b64 = base64.b64encode(contents).decode("ascii")
    institution.logo = f"data:{file.content_type};base64,{b64}"

    record_audit(
        db,
        actor=admin,
        action="INSTITUTION_UPDATED",
        entity_type="institution",
        entity_id=institution.id,
        details={"fields": ["logo"]},
    )
    db.commit()
    db.refresh(institution)
    return institution


@router.delete("/me/logo", response_model=InstitutionOut)
def delete_institution_logo(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
) -> Institution:
    institution = db.get(Institution, admin.institution_id)
    if not institution:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Instituição não encontrada.")

    institution.logo = None

    record_audit(
        db,
        actor=admin,
        action="INSTITUTION_UPDATED",
        entity_type="institution",
        entity_id=institution.id,
        details={"fields": ["logo"]},
    )
    db.commit()
    db.refresh(institution)
    return institution


@router.get("/{institution_id}/logo")
def get_institution_logo(
    institution_id: str,
    db: Session = Depends(get_db),
) -> Response:
    institution = db.get(Institution, institution_id)
    if not institution or not institution.logo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Logotipo não encontrado.")

    match = re.match(r"^data:([^;]+);base64,(.+)$", institution.logo, re.DOTALL)
    if not match:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Formato de logotipo inválido.")

    media_type = match.group(1)
    raw = base64.b64decode(match.group(2))
    return Response(content=raw, media_type=media_type, headers={"Cache-Control": "public, max-age=3600"})
