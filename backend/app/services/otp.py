import random
import string
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from ..models.otp import OTP, OTPType
from ..core.config import settings

def generate_otp() -> str:
    """Generate 6-digit OTP"""
    return ''.join(random.choices(string.digits, k=6))

def create_otp(db: Session, identifier: str, otp_type: OTPType) -> str:
    """Create and store OTP"""
    # Delete existing OTPs for this identifier
    db.query(OTP).filter(
        OTP.identifier == identifier,
        OTP.otp_type == otp_type,
        OTP.is_used == False
    ).delete()
    
    otp_code = generate_otp()
    expires_at = datetime.utcnow() + timedelta(minutes=10)
    
    otp = OTP(
        identifier=identifier,
        otp_code=otp_code,
        otp_type=otp_type,
        expires_at=expires_at
    )
    db.add(otp)
    db.commit()
    
    return otp_code

def verify_otp(db: Session, identifier: str, otp_code: str, otp_type: OTPType) -> bool:
    """Verify OTP"""
    otp = db.query(OTP).filter(
        OTP.identifier == identifier,
        OTP.otp_code == otp_code,
        OTP.otp_type == otp_type,
        OTP.is_used == False,
        OTP.expires_at > datetime.utcnow()
    ).first()
    
    if otp:
        otp.is_used = True
        db.commit()
        return True
    return False

def _email_configured() -> bool:
    """Return True only when real SMTP credentials are present (not placeholders)."""
    user = (settings.email_user or "").strip()
    pwd = (settings.email_password or "").strip()
    if not user or not pwd:
        return False
    # Treat the shipped placeholder values as "not configured"
    placeholders = {"your-email@gmail.com", "your-app-password"}
    if user in placeholders or pwd in placeholders:
        return False
    return True

def send_email_otp(email: str, otp: str, purpose: str = "verification") -> bool:
    """Send a styled OTP email.

    Delegates to the centralised, branded email service. Returns True if the
    OTP was either sent or logged (dev fallback) so the flow is never blocked.
    """
    if not email:
        return False
    # Imported lazily to avoid any circular-import surprises at module load.
    from .email import send_otp_email
    return send_otp_email(email, otp, purpose=purpose)

def send_sms_otp(phone: str, otp: str):
    """Send OTP via SMS (mock implementation)"""
    # In production, integrate with SMS service like Twilio, AWS SNS, etc.
    print(f"SMS OTP to {phone}: {otp}")
    return True