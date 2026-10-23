from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from ..core.database import Base


class ChatLead(Base):
    __tablename__ = "chat_leads"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=True)
    requirement = Column(Text, nullable=True)
    source = Column(String(50), default="chatbot")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
