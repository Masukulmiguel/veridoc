from fastapi import APIRouter, Depends, Query
from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.api.deps import require_admin
from app.core.database import get_db
from app.models.audit import AuditLog
from app.models.user import User

router = APIRouter(prefix="/audit", tags=["audit"])


@router.get("")
def list_audit(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    action: str | None = None,
    entity_type: str | None = None,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
) -> dict:
    query = (
        db.query(AuditLog)
        .join(User, AuditLog.actor_id == User.id)
        .filter(User.institution_id == admin.institution_id)
    )
    if action:
        query = query.filter(AuditLog.action == action)
    if entity_type:
        query = query.filter(AuditLog.entity_type == entity_type)

    total = query.count()
    pages = max(1, (total + page_size - 1) // page_size)
    page = min(max(page, 1), pages)
    items = (
        query.order_by(desc(AuditLog.created_at))
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return {
        "items": [
            {
                "id": entry.id,
                "actor_id": entry.actor_id,
                "actor_name": entry.actor_name,
                "action": entry.action,
                "entity_type": entry.entity_type,
                "entity_id": entry.entity_id,
                "metadata": entry.details,
                "created_at": entry.created_at,
            }
            for entry in items
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": pages,
    }
