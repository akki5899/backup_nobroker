from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ...core.database import get_db
from ...models.inquiry import Inquiry
from ...models.property import Property
from ...models.user import User
from ...schemas.inquiry import InquiryCreate, InquiryResponse, InquiryUpdate
from ...services.auth import get_current_active_user
from ...services.email import send_inquiry_owner_email, send_inquiry_confirmation_email
from ...services.notifications import create_notification
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


def _placeholder_email(email: str) -> bool:
    """Phone-only signups get a synthetic placeholder email — never mail those."""
    return (not email) or email.endswith("@propdirect.placeholder.com")


def _property_location(prop) -> str:
    """Build a human 'address, city' string from a Property, tolerating missing parts."""
    parts = [getattr(prop, "address", None), getattr(prop, "city", None)]
    return ", ".join(p for p in parts if p)

@router.post("/", response_model=InquiryResponse)
def create_inquiry(
    inquiry: InquiryCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Check if property exists
    property = db.query(Property).filter(Property.id == inquiry.property_id).first()
    if not property:
        raise HTTPException(status_code=404, detail="Property not found")
    
    # Prevent owners from inquiring about their own properties
    if property.owner_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot inquire about your own property")
    
    # Check if user already inquired about this property
    existing_inquiry = db.query(Inquiry).filter(
        Inquiry.property_id == inquiry.property_id,
        Inquiry.user_id == current_user.id
    ).first()
    if existing_inquiry:
        raise HTTPException(status_code=400, detail="You have already inquired about this property")
    
    db_inquiry = Inquiry(**inquiry.dict(), user_id=current_user.id)
    db.add(db_inquiry)
    db.commit()
    db.refresh(db_inquiry)

    # Email notifications (best-effort — never block the inquiry on mail failure).
    location = _property_location(property)
    owner = property.owner

    # In-app notifications (bell). These persist regardless of email config.
    # 1a) Owner gets a "new inquiry" notification.
    if owner:
        preview = (db_inquiry.message or "").strip().split("\n")[0][:80]
        create_notification(
            db,
            user_id=owner.id,
            title=f"New inquiry on {property.title or 'your property'}",
            message=f"{current_user.full_name or 'Someone'} is interested. {preview}",
            type="inquiry",
        )
    # 1b) Sender gets a confirmation notification.
    create_notification(
        db,
        user_id=current_user.id,
        title="Inquiry sent",
        message=f"Your inquiry about {property.title or 'the property'} was delivered to the owner.",
        type="inquiry",
    )

    # 2) Notify the property owner of the new lead via email.
    if owner and not _placeholder_email(owner.email):
        try:
            send_inquiry_owner_email(
                to_email=owner.email,
                owner_name=owner.full_name or "",
                property_title=property.title or "",
                property_location=location,
                inquirer_name=current_user.full_name or "",
                inquirer_phone=current_user.phone or "",
                inquirer_email="" if _placeholder_email(current_user.email) else current_user.email,
                message=db_inquiry.message or "",
            )
        except Exception as e:
            logger.error(f"Failed to send inquiry-owner email to {owner.email}: {e}")

    # 2) Confirm to the inquirer that their enquiry was sent.
    if not _placeholder_email(current_user.email):
        try:
            send_inquiry_confirmation_email(
                to_email=current_user.email,
                inquirer_name=current_user.full_name or "",
                property_title=property.title or "",
                property_location=location,
                owner_name=owner.full_name if owner else "",
            )
        except Exception as e:
            logger.error(f"Failed to send inquiry-confirmation email to {current_user.email}: {e}")

    return db_inquiry

@router.get("/my-inquiries", response_model=List[InquiryResponse])
def get_my_inquiries(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    inquiries = db.query(Inquiry).filter(Inquiry.user_id == current_user.id).all()
    return inquiries

@router.get("/property-inquiries", response_model=List[InquiryResponse])
def get_property_inquiries(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Get inquiries for properties owned by current user
    inquiries = db.query(Inquiry).join(Property).filter(
        Property.owner_id == current_user.id
    ).all()
    return inquiries

@router.delete("/bulk")
def bulk_delete_inquiries(
    inquiry_ids: List[int],
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    inquiries = db.query(Inquiry).filter(
        Inquiry.id.in_(inquiry_ids),
        Inquiry.user_id == current_user.id
    ).all()
    
    if not inquiries:
        raise HTTPException(status_code=404, detail="No inquiries found")
    
    deleted_count = len(inquiries)
    for inquiry in inquiries:
        db.delete(inquiry)
    
    db.commit()
    return {"message": f"{deleted_count} inquiries deleted successfully"}

@router.delete("/{inquiry_id}")
def delete_inquiry(
    inquiry_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    inquiry = db.query(Inquiry).filter(
        Inquiry.id == inquiry_id,
        Inquiry.user_id == current_user.id
    ).first()
    
    if not inquiry:
        raise HTTPException(status_code=404, detail="Inquiry not found")
    
    db.delete(inquiry)
    db.commit()
    return {"message": "Inquiry deleted successfully"}

@router.put("/{inquiry_id}", response_model=InquiryResponse)
def update_inquiry(
    inquiry_id: int,
    inquiry_update: InquiryUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    inquiry = db.query(Inquiry).join(Property).filter(
        Inquiry.id == inquiry_id,
        Property.owner_id == current_user.id
    ).first()
    
    if not inquiry:
        raise HTTPException(status_code=404, detail="Inquiry not found")
    
    for field, value in inquiry_update.dict(exclude_unset=True).items():
        setattr(inquiry, field, value)
    
    db.commit()
    db.refresh(inquiry)
    return inquiry