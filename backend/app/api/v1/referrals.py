from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ...core.database import get_db
from ...models.user import User
from ...services.auth import get_current_active_user
import random
import string

router = APIRouter()

@router.get("/code")
def get_referral_code(
    current_user: User = Depends(get_current_active_user)
):
    # Generate referral code based on user ID
    code = f"PROP{current_user.id:06d}"
    return {"referral_code": code}

@router.get("/stats")
def get_referral_stats(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Mock referral stats - in real app, track referrals in database
    return {
        "total_referrals": 0,
        "total_earnings": 0,
        "referrals": []
    }