from sqlalchemy import Column, Integer, String, DateTime, Boolean, Enum
from sqlalchemy.sql import func
from ..core.database import Base
import enum

class OTPType(enum.Enum):
    EMAIL = "email"
    PHONE = "phone"

class OTP(Base):
    __tablename__ = "otps"
    
    id = Column(Integer, primary_key=True, index=True)
    identifier = Column(String(255), nullable=False)  # email or phone
    otp_code = Column(String(6), nullable=False)
    otp_type = Column(Enum(OTPType), nullable=False)
    is_used = Column(Boolean, default=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())