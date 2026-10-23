from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..core.database import Base
import enum

class InquiryStatus(enum.Enum):
    PENDING = "pending"
    CONTACTED = "contacted"
    CLOSED = "closed"

class Inquiry(Base):
    __tablename__ = "inquiries"
    
    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    message = Column(Text)
    status = Column(Enum(InquiryStatus), default=InquiryStatus.PENDING)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    property = relationship("Property", back_populates="inquiries")
    user = relationship("User", back_populates="inquiries")