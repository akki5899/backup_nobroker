from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ...core.database import get_db
from ...models.user import User
from ...services.auth import get_current_active_user

router = APIRouter()

@router.get("/points")
def get_user_points(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Simple points calculation based on user activities
    points = 0
    
    # Points for properties listed
    from ...models.property import Property
    properties_count = db.query(Property).filter(Property.owner_id == current_user.id).count()
    points += properties_count * 100
    
    # Points for inquiries made
    from ...models.inquiry import Inquiry
    inquiries_count = db.query(Inquiry).filter(Inquiry.user_id == current_user.id).count()
    points += inquiries_count * 50
    
    return {"points": points}

@router.get("/available")
def get_available_rewards():
    rewards = [
        {"id": 1, "title": "Premium Listing", "description": "Feature your property for 30 days", "points": 500},
        {"id": 2, "title": "Priority Support", "description": "Get priority customer support", "points": 300},
        {"id": 3, "title": "Property Verification", "description": "Free property verification service", "points": 200}
    ]
    return {"rewards": rewards}