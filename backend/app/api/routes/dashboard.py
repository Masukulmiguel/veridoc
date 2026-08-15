from fastapi import APIRouter, Depends
from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.document import Document
from app.models.user import User
from app.services import document_service

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("")
def dashboard(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    stats = document_service.dashboard_stats(db, user.institution_id)
    recent = (
        db.query(Document)
        .filter(Document.institution_id == user.institution_id)
        .order_by(desc(Document.created_at))
        .limit(5)
        .all()
    )
    stats["recent_documents"] = [
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
        for item in recent
    ]
    return stats
