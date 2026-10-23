"""Real-time-ish 1:1 messaging between a property's prospective buyer/tenant and its owner.

A conversation (`Chat`) is scoped to a single property and the (buyer, owner)
pair, so each interested user has exactly one thread per property. Messages
(`ChatMessage`) persist, carry an `is_read` flag, and every inbound message
creates an in-app notification for the recipient.

Endpoints (mounted at /api/v1/chats):
  GET  /                       -> my conversations (last message, unread, counterparty)
  GET  /unread-count           -> total unread messages across my conversations
  POST /start                  -> get-or-create the conversation for a property
  GET  /{chat_id}/messages     -> full thread (marks the other side's messages read)
  POST /{chat_id}/messages     -> send a message (persists + notifies recipient)
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func
from pydantic import BaseModel
from typing import Optional
from ...core.database import get_db
from ...models.chat import Chat, ChatMessage
from ...models.property import Property
from ...models.user import User
from ...services.auth import get_current_active_user
from ...services.notifications import create_notification

router = APIRouter()


# --------------------------------------------------------------------------- #
# Serialization
# --------------------------------------------------------------------------- #
def _counterparty(chat: Chat, me_id: int) -> int:
    """The other participant's user id."""
    return chat.owner_id if chat.buyer_id == me_id else chat.buyer_id


def _serialize_message(m: ChatMessage, me_id: int) -> dict:
    return {
        "id": m.id,
        "chat_id": m.chat_id,
        "sender_id": m.sender_id,
        "message": m.message,
        "is_read": m.is_read,
        "is_mine": m.sender_id == me_id,
        "created_at": m.created_at,
    }


def _serialize_conversation(db: Session, chat: Chat, me_id: int) -> dict:
    other_id = _counterparty(chat, me_id)
    other = db.query(User).filter(User.id == other_id).first()
    prop = db.query(Property).filter(Property.id == chat.property_id).first()

    last = (
        db.query(ChatMessage)
        .filter(ChatMessage.chat_id == chat.id)
        .order_by(ChatMessage.created_at.desc())
        .first()
    )
    unread = (
        db.query(ChatMessage)
        .filter(
            ChatMessage.chat_id == chat.id,
            ChatMessage.sender_id != me_id,
            ChatMessage.is_read == False,
        )
        .count()
    )

    return {
        "id": chat.id,
        "property_id": chat.property_id,
        "property_title": prop.title if prop else f"Property #{chat.property_id}",
        "counterparty_id": other_id,
        "counterparty_name": (other.full_name if other else "User") or "User",
        "counterparty_phone": (other.phone if other else "") or "",
        "role": "owner" if chat.owner_id == me_id else "buyer",
        "last_message": last.message if last else "",
        "last_message_at": last.created_at if last else chat.created_at,
        "unread": unread,
    }


# --------------------------------------------------------------------------- #
# Conversations
# --------------------------------------------------------------------------- #
@router.get("/")
def list_conversations(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """All conversations I'm part of (as buyer or owner), most-recent first."""
    chats = (
        db.query(Chat)
        .filter(or_(Chat.buyer_id == current_user.id, Chat.owner_id == current_user.id))
        .all()
    )
    convos = [_serialize_conversation(db, c, current_user.id) for c in chats]
    # Sort by last activity (newest first); handles None timestamps defensively.
    convos.sort(key=lambda c: (c["last_message_at"] is not None, c["last_message_at"]), reverse=True)
    return convos


@router.get("/unread-count")
def unread_count(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Total unread messages addressed to me across every conversation."""
    my_chat_ids = [
        c.id for c in db.query(Chat.id)
        .filter(or_(Chat.buyer_id == current_user.id, Chat.owner_id == current_user.id))
        .all()
    ]
    if not my_chat_ids:
        return {"unread": 0}
    count = (
        db.query(ChatMessage)
        .filter(
            ChatMessage.chat_id.in_(my_chat_ids),
            ChatMessage.sender_id != current_user.id,
            ChatMessage.is_read == False,
        )
        .count()
    )
    return {"unread": count}


class StartChatRequest(BaseModel):
    property_id: int
    message: Optional[str] = None  # optional opening message


@router.post("/start")
def start_conversation(
    request: StartChatRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Get-or-create the conversation between me and a property's owner.

    The current user is always the buyer side; the property's owner is the other
    side. Owners cannot start a chat about their own listing. If an opening
    message is supplied it is sent immediately and the owner is notified.
    """
    prop = db.query(Property).filter(Property.id == request.property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    if prop.owner_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot start a chat on your own property")

    chat = (
        db.query(Chat)
        .filter(
            Chat.property_id == request.property_id,
            Chat.buyer_id == current_user.id,
            Chat.owner_id == prop.owner_id,
        )
        .first()
    )
    if not chat:
        chat = Chat(
            property_id=request.property_id,
            buyer_id=current_user.id,
            owner_id=prop.owner_id,
        )
        db.add(chat)
        db.commit()
        db.refresh(chat)

    if request.message and request.message.strip():
        _persist_and_notify(db, chat, current_user, request.message.strip(), prop)

    return _serialize_conversation(db, chat, current_user.id)


# --------------------------------------------------------------------------- #
# Messages
# --------------------------------------------------------------------------- #
def _get_my_chat(db: Session, chat_id: int, me_id: int) -> Chat:
    chat = db.query(Chat).filter(Chat.id == chat_id).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Conversation not found")
    if me_id not in (chat.buyer_id, chat.owner_id):
        raise HTTPException(status_code=403, detail="Not a participant in this conversation")
    return chat


@router.get("/{chat_id}/messages")
def get_messages(
    chat_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Return the full thread and mark messages from the other party as read."""
    chat = _get_my_chat(db, chat_id, current_user.id)

    # Mark the counterparty's unread messages as read (I'm viewing them now).
    db.query(ChatMessage).filter(
        ChatMessage.chat_id == chat_id,
        ChatMessage.sender_id != current_user.id,
        ChatMessage.is_read == False,
    ).update({"is_read": True})
    db.commit()

    messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.chat_id == chat_id)
        .order_by(ChatMessage.created_at.asc())
        .all()
    )
    return {
        "conversation": _serialize_conversation(db, chat, current_user.id),
        "messages": [_serialize_message(m, current_user.id) for m in messages],
    }


class SendMessageRequest(BaseModel):
    message: str


def _persist_and_notify(db: Session, chat: Chat, sender: User, text: str, prop: Optional[Property]) -> ChatMessage:
    """Save a message and notify the recipient. Shared by /start and /messages."""
    msg = ChatMessage(chat_id=chat.id, sender_id=sender.id, message=text, is_read=False)
    db.add(msg)
    db.commit()
    db.refresh(msg)

    recipient_id = _counterparty(chat, sender.id)
    title = prop.title if prop else f"Property #{chat.property_id}"
    preview = text if len(text) <= 80 else text[:77] + "…"
    create_notification(
        db,
        user_id=recipient_id,
        title=f"New message from {sender.full_name or 'a user'}",
        message=f"Re: {title} — {preview}",
        type="message",
    )
    return msg


@router.post("/{chat_id}/messages")
def send_message(
    chat_id: int,
    request: SendMessageRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Send a message in a conversation I'm part of; notifies the recipient."""
    if not request.message or not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")
    chat = _get_my_chat(db, chat_id, current_user.id)
    prop = db.query(Property).filter(Property.id == chat.property_id).first()
    msg = _persist_and_notify(db, chat, current_user, request.message.strip(), prop)
    return _serialize_message(msg, current_user.id)
