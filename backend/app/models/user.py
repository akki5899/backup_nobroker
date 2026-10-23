from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum, Index
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..core.database import Base
import enum

class UserType(enum.Enum):
    OWNER = "owner"
    TENANT = "tenant"
    BUYER = "buyer"
    AGENT = "agent"
    BUILDER = "builder"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    phone = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    user_type = Column(Enum(UserType), nullable=False, index=True)
    is_active = Column(Boolean, default=True, index=True)
    is_verified = Column(Boolean, default=False)
    email_verified = Column(Boolean, default=False)
    phone_verified = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    properties = relationship("Property", back_populates="owner")
    inquiries = relationship("Inquiry", back_populates="user")
    
    # Composite indexes for better query performance
    __table_args__ = (
        Index('idx_user_email_active', 'email', 'is_active'),
        Index('idx_user_phone_active', 'phone', 'is_active'),
        Index('idx_user_type_active', 'user_type', 'is_active'),
        Index('idx_user_created_type', 'created_at', 'user_type'),
    )