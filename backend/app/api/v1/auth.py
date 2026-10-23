from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import timedelta
from ...core.database import get_db
from ...core.security import verify_password, get_password_hash, create_access_token
from ...models.user import User, UserType
from ...schemas.user import UserCreate, UserResponse, Token
from ...schemas.otp import SendOTPRequest, VerifyOTPRequest, OTPResponse
from ...services.otp import create_otp, verify_otp, send_email_otp, send_sms_otp
from ...services.email import send_welcome_email, send_login_alert_email
from ...models.otp import OTPType
from ...core.config import settings
import logging
import time
import requests
import random
router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/check-user")
def check_user(email: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == email).first()
    if user:
        return {"exists": True, "email": user.email, "id": user.id}
    return {"exists": False}

@router.post("/register", response_model=UserResponse)
def register(user: UserCreate, db: Session = Depends(get_db)):
    try:
        logger.info(f"Registering user: {user.dict()}")
        # Validate input
        if not user.phone:
            raise HTTPException(status_code=400, detail="Phone number is required")
            
        # Use placeholder if email is empty or not provided
        if not user.email:
            user.email = f"{user.phone}@propdirect.placeholder.com"
            
        # Enforce uniqueness for BOTH email and mobile number.
        # A single combined message is returned so the frontend can surface
        # the "Login / Forgot Password" affordances regardless of which field clashed.
        DUPLICATE_DETAIL = "User already registered with this Email ID or Mobile Number."

        existing_user = db.query(User).filter(User.email == user.email).first()
        if existing_user:
            logger.warning(f"Email already registered: {user.email}")
            raise HTTPException(status_code=409, detail=DUPLICATE_DETAIL)

        existing_user = db.query(User).filter(User.phone == user.phone).first()
        if existing_user:
            logger.warning(f"Phone already registered: {user.phone}")
            raise HTTPException(status_code=409, detail=DUPLICATE_DETAIL)
        
        # Create new user
        hashed_password = get_password_hash(user.password)
        
        # Handle user_type conversion if it's a string
        user_type_val = user.user_type
        if isinstance(user_type_val, str):
            try:
                user_type_val = UserType(user_type_val.lower())
            except ValueError:
                # If invalid enum value, default to BUYER or raise error
                # For now, let's try to be permissive or default
                logger.warning(f"Invalid user_type: {user_type_val}, defaulting to BUYER")
                user_type_val = UserType.BUYER

        db_user = User(
            email=user.email,
            phone=user.phone,
            full_name=user.full_name,
            user_type=user_type_val,
            hashed_password=hashed_password
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)

        logger.info(f"User registered: {user.email}")

        # Send a styled welcome / signup-notification email (best-effort).
        # Skip placeholder emails generated for phone-only signups.
        if db_user.email and not db_user.email.endswith("@propdirect.placeholder.com"):
            try:
                send_welcome_email(db_user.email, db_user.full_name or "")
            except Exception as e:
                logger.error(f"Failed to send welcome email to {db_user.email}: {e}")

        return db_user
        
    except HTTPException as e:
        logger.error(f"Registration failed with HTTPException: {e.detail}")
        db.rollback()
        raise
    except Exception as e:
        logger.error(f"Registration error: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Registration failed")

# In-memory OTP store for login/verification
otp_store = {}
# Rate Limiting Store
rate_limit_store = {}

@router.post("/send-otp")
def send_otp_endpoint(request: SendOTPRequest, db: Session = Depends(get_db)):
    if not request.phone:
        raise HTTPException(status_code=400, detail="Phone number is required")
        
    # Rate Limiting by phone number: Max 5 requests per 5 minutes
    now = int(time.time())
    if request.phone in rate_limit_store:
        history = rate_limit_store[request.phone]
        # Filter out old attempts (> 300 seconds)
        recent_attempts = [t for t in history if now - t < 300]
        if len(recent_attempts) >= 5:
            raise HTTPException(status_code=429, detail="Too many OTP requests. Please try again after 5 minutes.")
        recent_attempts.append(now)
        rate_limit_store[request.phone] = recent_attempts
    else:
        rate_limit_store[request.phone] = [now]
        
    user = db.query(User).filter(User.phone == request.phone).first()
    if not user:
        raise HTTPException(status_code=404, detail="No account found with this mobile number")

    # Generate a random 6-digit OTP and store as string for consistent comparison.
    # (The hardcoded "123456" test value has been removed.)
    otp_code = str(random.randint(100000, 999999))
    otp_store[request.phone] = {
        "otp": otp_code,  # Always stored as string
        "expires_at": int(time.time()) + 300,
        "attempts": 0
    }

    logger.info(f"Generated OTP for {request.phone}: {otp_code}")
    print(f"=====================================")
    print(f"OTP for {request.phone}: {otp_code}")
    print(f"=====================================")

    # Deliver OTP via EMAIL as well (in addition to SMS below).
    # Skip placeholder emails generated for phone-only signups.
    user_email = (user.email or "")
    if user_email and not user_email.endswith("@propdirect.placeholder.com"):
        try:
            send_email_otp(user_email, otp_code, purpose="sign-in")
        except Exception as e:
            logger.error(f"Failed to send OTP email to {user_email}: {e}")

    try:
        import os
        url = "https://www.fast2sms.com/dev/bulkV2"
        api_key = os.environ.get("FAST2SMS_API_KEY", "RurZoCXAVpyl5iGh86qfE0M9Hek43UxFadQmJLwvTIPOgnKDN1fwAy31bU6pQFonY0BusZCkO4vLrxPz")
        
        headers = {
            "authorization": api_key,
            "Content-Type": "application/json"
        }
        payload = {
            "route": "otp",
            "variables_values": otp_code,
            "schedule_time": "",
            "numbers": request.phone
        }
        
        
        # Actively send the SMS
        logger.info(f"Dispatching Fast2SMS API request for phone: {request.phone}")
        # Added a 5-second timeout so it fails fast rather than hanging indefinitely
        response = requests.post(url, json=payload, headers=headers, timeout=5)
        
        # Fast2SMS often returns a successful HTTP status with a semantic JSON error
        # "return": False means it failed internally without raising an HTTP error.
        resp_data = response.json()
        
        print(f"=====================================")
        print(f"Fast2SMS API Status Code: {response.status_code}")
        print(f"Fast2SMS API Response: {resp_data}")
        print(f"=====================================")
        logger.info(f"Fast2SMS API Response: {resp_data}")
        
        if not resp_data.get("return", True):
            logger.warning(f"Fast2SMS API Warning: {resp_data.get('message', 'Unknown Error')}")
            
    except requests.exceptions.Timeout:
        logger.error(f"Fast2SMS API Request Timed Out completely.")
        print("Note: Network request timed out. You can still use the logged OTP to test.")
    except Exception as e:
        logger.error(f"Failed to send OTP SMS: {e}")
        print(f"Note: Network request failed. You can still use the logged OTP to test.")

    response_payload = {
        "message": "OTP processed (check backend logs if SMS delayed)",
        "success": True,
    }

    # DEV CONVENIENCE: when no SMS subscription is active, surface the OTP in the
    # API response so the flow is fully usable without a real SMS gateway.
    # This is gated to development so it never leaks codes in production.
    if settings.environment == "development":
        response_payload["dev_otp"] = otp_code
        response_payload["dev_mode"] = True

    return response_payload

@router.post("/verify-otp")
def verify_otp_endpoint(request: VerifyOTPRequest, db: Session = Depends(get_db)):
    if not request.phone or not request.otp:
        raise HTTPException(status_code=400, detail="Phone and OTP are required")
        
    if request.phone not in otp_store:
        raise HTTPException(status_code=400, detail="OTP session not found or expired")
        
    store_data = otp_store[request.phone]
    
    if int(time.time()) > store_data["expires_at"]:
        del otp_store[request.phone]
        raise HTTPException(status_code=400, detail="OTP has expired")
        
    if store_data["otp"] != request.otp:
        store_data["attempts"] += 1
        if store_data["attempts"] >= 3:
            del otp_store[request.phone]
            raise HTTPException(status_code=400, detail="Maximum error attempts reached")
        raise HTTPException(status_code=400, detail="Invalid OTP code entered")
        
    del otp_store[request.phone]
    
    user = db.query(User).filter(User.phone == request.phone).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Was this account already verified before now? If so, this OTP cycle is a
    # returning *login* (send a login alert). A first-time verification is part
    # of signup, which already triggered the welcome email — so we skip the
    # alert there to avoid double-emailing.
    was_already_verified = bool(user.is_verified)

    # The OTP is delivered to BOTH the registered phone and email, so a successful
    # verification confirms both channels (B7 — account verification).
    user.phone_verified = True
    user.is_verified = True
    user_email = user.email or ""
    if user_email and not user_email.endswith("@propdirect.placeholder.com"):
        user.email_verified = True
    db.commit()

    # Login notification (best-effort) for returning sign-ins only.
    if was_already_verified and user_email and not user_email.endswith("@propdirect.placeholder.com"):
        try:
            send_login_alert_email(user_email, user.full_name or "")
        except Exception as e:
            logger.error(f"Failed to send login alert email to {user_email}: {e}")

    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": user.email, "user_id": user.id}, 
        expires_delta=access_token_expires
    )
    
    user_type_val = user.user_type.value if hasattr(user.user_type, 'value') else str(user.user_type)
    
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "phone": user.phone,
            "full_name": user.full_name,
            "user_type": user_type_val
        },
        "message": "Verification successful",
        "success": True
    }


class AdminLoginRequest(BaseModel):
    username: str
    password: str

@router.post("/admin-login")
def admin_login(request: AdminLoginRequest):
    """Authenticate the admin against credentials configured in settings/.env.

    Returns a JWT whose subject is settings.admin_email; get_current_admin
    (in api/v1/admin.py) authorises admin routes by checking that subject.
    """
    if request.username != settings.admin_username or request.password != settings.admin_password:
        raise HTTPException(status_code=401, detail="Invalid admin credentials")

    # Give the admin a longer-lived session than the default 30 min.
    access_token = create_access_token(
        data={"sub": settings.admin_email, "is_admin": True},
        expires_delta=timedelta(hours=12),
    )
    return {
        "success": True,
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "email": settings.admin_email,
            "full_name": "Administrator",
            "user_type": "admin",
        },
    }


# =====================================================================
# B6 — Forgot / Reset Password (via registered email OR phone using OTP)
# B7 — Email verification (verification code emailed at registration)
# =====================================================================

# Dedicated in-memory stores keyed by user id so email and phone map to the
# same account regardless of which channel the user chose.
reset_otp_store = {}        # user_id -> {"otp", "expires_at", "attempts"}
email_verify_store = {}     # user_id -> {"otp", "expires_at", "attempts"}


def _generate_and_deliver(user: User, channel: str, store: dict, subject_kind: str):
    """Generate a 6-digit OTP, store it under the user's id, and deliver it via
    the requested channel (email/phone). Falls back to backend logs.
    channel: 'email' | 'phone' | 'both'
    """
    otp_code = str(random.randint(100000, 999999))
    store[user.id] = {
        "otp": otp_code,
        "expires_at": int(time.time()) + 300,
        "attempts": 0,
    }
    logger.info(f"[{subject_kind}] OTP for user {user.id}: {otp_code}")
    print("=====================================")
    print(f"[{subject_kind}] OTP for user {user.id} ({user.email} / {user.phone}): {otp_code}")
    print("=====================================")

    user_email = user.email or ""
    is_placeholder = user_email.endswith("@propdirect.placeholder.com")

    # Email delivery
    if channel in ("email", "both") and user_email and not is_placeholder:
        try:
            send_email_otp(user_email, otp_code)
        except Exception as e:
            logger.error(f"Failed to send {subject_kind} email: {e}")

    # SMS delivery (best-effort; uses same Fast2SMS gateway)
    if channel in ("phone", "both") and user.phone:
        try:
            send_sms_otp(user.phone, otp_code)
        except Exception as e:
            logger.error(f"Failed to send {subject_kind} SMS: {e}")

    return otp_code


def _validate_otp(store: dict, user_id: int, otp: str):
    """Validate an OTP from a store. Raises HTTPException on failure; clears on success."""
    if user_id not in store:
        raise HTTPException(status_code=400, detail="OTP session not found or expired. Please request a new code.")
    data = store[user_id]
    if int(time.time()) > data["expires_at"]:
        del store[user_id]
        raise HTTPException(status_code=400, detail="OTP has expired. Please request a new code.")
    if data["otp"] != str(otp):
        data["attempts"] += 1
        if data["attempts"] >= 3:
            del store[user_id]
            raise HTTPException(status_code=400, detail="Maximum attempts reached. Please request a new code.")
        raise HTTPException(status_code=400, detail="Invalid OTP code entered.")
    del store[user_id]


class ForgotPasswordRequest(BaseModel):
    identifier: str  # registered email OR phone number


class ResetPasswordRequest(BaseModel):
    identifier: str
    otp: str
    new_password: str


def _find_user_by_identifier(db: Session, identifier: str) -> User | None:
    identifier = (identifier or "").strip()
    if not identifier:
        return None
    # Try email first, then phone — email↔phone mapping resolves to one account.
    user = db.query(User).filter(User.email == identifier).first()
    if not user:
        user = db.query(User).filter(User.phone == identifier).first()
    return user


@router.post("/forgot-password")
def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Send a password-reset OTP to the user's registered email and/or phone."""
    user = _find_user_by_identifier(db, request.identifier)

    # Avoid user enumeration: respond success even if no account matched.
    if not user:
        logger.info(f"Forgot-password requested for unknown identifier: {request.identifier}")
        return {"message": "If an account exists, a reset code has been sent.", "success": True}

    _generate_and_deliver(user, channel="both", store=reset_otp_store, subject_kind="PASSWORD_RESET")
    return {"message": "A password reset code has been sent to your registered email and phone.", "success": True}


@router.post("/reset-password")
def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Verify the reset OTP and set a new password."""
    user = _find_user_by_identifier(db, request.identifier)
    if not user:
        raise HTTPException(status_code=404, detail="Account not found.")

    if not request.new_password or len(request.new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters.")

    _validate_otp(reset_otp_store, user.id, request.otp)

    user.hashed_password = get_password_hash(request.new_password)
    db.commit()
    logger.info(f"Password reset successful for user {user.id}")
    return {"message": "Password reset successful. You can now log in.", "success": True}


class SendEmailVerificationRequest(BaseModel):
    email: str


class VerifyEmailRequest(BaseModel):
    email: str
    otp: str


@router.post("/send-email-verification")
def send_email_verification(request: SendEmailVerificationRequest, db: Session = Depends(get_db)):
    """Send (or resend) an email verification code to a registered user."""
    user = db.query(User).filter(User.email == request.email.strip()).first()
    if not user:
        raise HTTPException(status_code=404, detail="No account found with this email.")
    if user.email_verified:
        return {"message": "Email already verified.", "success": True, "already_verified": True}

    _generate_and_deliver(user, channel="email", store=email_verify_store, subject_kind="EMAIL_VERIFY")
    return {"message": "A verification code has been sent to your email.", "success": True}


@router.post("/verify-email")
def verify_email(request: VerifyEmailRequest, db: Session = Depends(get_db)):
    """Confirm a user's email using the verification code."""
    user = db.query(User).filter(User.email == request.email.strip()).first()
    if not user:
        raise HTTPException(status_code=404, detail="No account found with this email.")

    _validate_otp(email_verify_store, user.id, request.otp)

    user.email_verified = True
    # Mark the account verified once at least one channel is confirmed.
    user.is_verified = True
    db.commit()
    logger.info(f"Email verified for user {user.id}")
    return {"message": "Email verified successfully.", "success": True}