from typing import Any

from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.models.audit import AuditLog
from app.models.user import User
from app.utils.identifiers import generate_uuid


def record_audit(
    db: Session,
    *,
    actor: User | None,
    action: str,
    entity_type: str,
    entity_id: str,
    details: dict[str, Any] | None = None,
) -> AuditLog:
    entry = AuditLog(
        id=generate_uuid(),
        actor_id=actor.id if actor else None,
        actor_name=actor.name if actor else "anónimo",
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        details=details,
    )
    db.add(entry)
    return entry


def document_history(db: Session, document_id: str) -> list[dict[str, Any]]:
    entries = (
        db.query(AuditLog)
        .filter(AuditLog.entity_type == "document", AuditLog.entity_id == document_id)
        .order_by(desc(AuditLog.created_at))
        .limit(100)
        .all()
    )
    return [
        {
            "id": entry.id,
            "action": entry.action,
            "actor_name": entry.actor_name,
            "created_at": entry.created_at,
        }
        for entry in entries
    ]
