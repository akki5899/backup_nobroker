from sqlalchemy import Column, Integer, String, Text, DateTime, Index
from sqlalchemy.sql import func
from ..core.database import Base


class AdminAuditLog(Base):
    """Immutable record of every state-changing action an admin performs.

    With a single shared admin login there is no per-staff identity, but we
    still record `actor` (the admin email from the JWT) so the trail is
    meaningful if multiple people share the account or roles are added later.
    Each row captures what was done (`action`), to what (`target_type` +
    `target_id`), and a human-readable `detail` (e.g. rejection reason).
    """
    __tablename__ = "admin_audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    actor = Column(String(255), nullable=False, index=True)        # admin email
    action = Column(String(80), nullable=False, index=True)        # e.g. "property.approve"
    target_type = Column(String(40), nullable=True, index=True)    # e.g. "property" | "user"
    target_id = Column(Integer, nullable=True, index=True)
    detail = Column(Text, nullable=True)                           # free-form context
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    __table_args__ = (
        Index("idx_audit_action_created", "action", "created_at"),
        Index("idx_audit_target", "target_type", "target_id"),
    )
