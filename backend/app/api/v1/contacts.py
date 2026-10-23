from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ...core.database import get_db
from ...models.user import User
from ...services.auth import get_current_active_user

router = APIRouter()

@router.get("/my-contacts")
def get_my_contacts(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Get inquiries made by current user to find contacted owners
    from ...models.inquiry import Inquiry
    from ...models.property import Property
    
    contacts = db.query(Inquiry).join(Property).join(User, Property.owner_id == User.id).filter(
        Inquiry.user_id == current_user.id
    ).all()
    
    contact_list = []
    seen_owners = set()
    
    for inquiry in contacts:
        if inquiry.property.owner_id not in seen_owners:
            contact_list.append({
                "id": inquiry.property.owner.id,
                "name": inquiry.property.owner.full_name,
                "property_title": inquiry.property.title,
                "contact_date": inquiry.created_at.isoformat() if inquiry.created_at else None
            })
            seen_owners.add(inquiry.property.owner_id)
    
    return {"contacts": contact_list}