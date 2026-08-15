from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.document import Document


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class DocumentSignature(Base):
    __tablename__ = "document_signatures"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    document_id: Mapped[str] = mapped_column(
        ForeignKey("documents.id", ondelete="CASCADE"), unique=True, index=True
    )
    algorithm: Mapped[str] = mapped_column(String(40))
    signature: Mapped[str] = mapped_column(Text)
    public_key_reference: Mapped[str | None] = mapped_column(String(255), nullable=True)
    signed_by: Mapped[str] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    document: Mapped["Document"] = relationship(back_populates="signature")
