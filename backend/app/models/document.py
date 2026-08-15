from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import JSON, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.institution import Institution
    from app.models.signature import DocumentSignature
    from app.models.verification import VerificationEvent


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Document(Base):
    __tablename__ = "documents"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    institution_id: Mapped[str] = mapped_column(
        ForeignKey("institutions.id", ondelete="CASCADE"), index=True
    )
    document_number: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    document_type: Mapped[str] = mapped_column(String(40), index=True)
    title: Mapped[str] = mapped_column(String(255))
    holder_name: Mapped[str] = mapped_column(String(255), index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    content_hash: Mapped[str] = mapped_column(String(64), index=True)
    verification_code: Mapped[str] = mapped_column(String(32), unique=True, index=True)
    status: Mapped[str] = mapped_column(String(20), default="PENDING", index=True)
    extra_data: Mapped[list | dict | None] = mapped_column(JSON, nullable=True)
    issued_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    revoked_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow
    )

    institution: Mapped["Institution"] = relationship(back_populates="documents")
    signature: Mapped["DocumentSignature | None"] = relationship(
        back_populates="document", uselist=False, cascade="all, delete-orphan"
    )
    verification_events: Mapped[list["VerificationEvent"]] = relationship(
        back_populates="document", cascade="all, delete-orphan"
    )

    @property
    def verification_count(self) -> int:
        return len(self.verification_events)

    @property
    def canonical_payload(self) -> dict:
        from app.utils.hashing import canonical_datetime

        return {
            "institution_id": self.institution_id,
            "document_number": self.document_number,
            "document_type": self.document_type,
            "title": self.title,
            "holder_name": self.holder_name,
            "issued_at": canonical_datetime(self.issued_at),
            "extra_data": self.extra_data,
        }
