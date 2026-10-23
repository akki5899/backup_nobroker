"""In-app notification helpers.

Centralises writing rows to the `notifications` table so inquiries, chat, and
admin moderation all create notifications the same way. Every helper is
best-effort: a failure to notify must never break the action that triggered it
(sending a message, approving a listing, etc.), so exceptions are swallowed and
logged.

`type` is a free-form string the frontend uses to pick an icon. Conventional
values: "inquiry", "message", "listing", "system".
"""
import logging
from typing import Iterable, Optional

from sqlalchemy.orm import Session

from ..models.notification import Notification

logger = logging.getLogger(__name__)


def create_notification(
    db: Session,
    user_id: int,
    title: str,
    message: str,
    type: str = "system",
    *,
    commit: bool = True,
) -> Optional[Notification]:
    """Create a single notification for one user. Returns the row, or None on failure.

    Pass commit=False to batch several inserts under one commit by the caller.
    """
    try:
        notif = Notification(
            user_id=user_id,
            title=title[:255],
            message=message,
            type=type,
            is_read=False,
        )
        db.add(notif)
        if commit:
            db.commit()
            db.refresh(notif)
        return notif
    except Exception:  # pragma: no cover - notifications must not break the caller
        logger.exception("Failed to create notification for user %s", user_id)
        if commit:
            db.rollback()
        return None


def notify_many(
    db: Session,
    user_ids: Iterable[int],
    title: str,
    message: str,
    type: str = "system",
) -> int:
    """Create the same notification for many users in one commit. Returns count created."""
    count = 0
    try:
        for uid in user_ids:
            db.add(Notification(
                user_id=uid,
                title=title[:255],
                message=message,
                type=type,
                is_read=False,
            ))
            count += 1
        db.commit()
        return count
    except Exception:  # pragma: no cover
        logger.exception("Failed to create batch notifications")
        db.rollback()
        return 0
