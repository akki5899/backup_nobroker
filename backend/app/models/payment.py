from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..core.database import Base
import enum

class PaymentStatus(enum.Enum):
    PENDING = "pending"
    SUCCESS = "success"
    FAILED = "failed"
    REFUNDED = "refunded"

class PaymentType(enum.Enum):
    LISTING_FEE = "listing_fee"
    PREMIUM_UPGRADE = "premium_upgrade"
    SUBSCRIPTION = "subscription"
    LEAD_UNLOCK = "lead_unlock"
    TOKEN_ADVANCE = "token_advance"

class Payment(Base):
    __tablename__ = "payments"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Razorpay details
    razorpay_order_id = Column(String(255), unique=True, index=True, nullable=False)
    razorpay_payment_id = Column(String(255), unique=True, index=True, nullable=True)
    razorpay_signature = Column(String(255), nullable=True)
    
    amount = Column(Float, nullable=False)
    currency = Column(String(10), default="INR")
    status = Column(Enum(PaymentStatus), default=PaymentStatus.PENDING)
    payment_type = Column(Enum(PaymentType), nullable=False)
    
    # Context (e.g., Which property or which subscription plan)
    reference_id = Column(Integer, nullable=True) # Could be property_id, subscription_id
    metadata_json = Column(Text, nullable=True) # Store extra JSON details
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    user = relationship("User")
