from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc
from ...core.database import get_db
from ...models.user import User
from ...services.auth import get_current_active_user

router = APIRouter()

@router.get("/activities")
def get_user_timeline(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    activities = []
    
    # Get user's inquiries
    from ...models.inquiry import Inquiry
    from ...models.property import Property
    
    inquiries = db.query(Inquiry).join(Property).filter(
        Inquiry.user_id == current_user.id
    ).order_by(desc(Inquiry.created_at)).limit(20).all()
    
    for inquiry in inquiries:
        activities.append({
            "id": f"inquiry_{inquiry.id}",
            "type": "contact",
            "title": "Contacted Property Owner",
            "description": f"You contacted the owner of {inquiry.property.title}",
            "timestamp": inquiry.created_at.isoformat() if inquiry.created_at else None
        })
    
    # Get user's properties if owner
    if current_user.user_type in ['owner', 'agent', 'builder']:
        properties = db.query(Property).filter(
            Property.owner_id == current_user.id
        ).order_by(desc(Property.created_at)).limit(10).all()
        
        for prop in properties:
            activities.append({
                "id": f"property_{prop.id}",
                "type": "listing",
                "title": "Property Listed",
                "description": f"You listed {prop.title}",
                "timestamp": prop.created_at.isoformat() if prop.created_at else None
            })
    
    # Sort by timestamp
    activities.sort(key=lambda x: x["timestamp"] or "", reverse=True)
    
    return {"activities": activities[:20]}