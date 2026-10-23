from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ...core.database import get_db
from ...models.wishlist import Wishlist
from ...models.property import Property
from ...services.auth import get_current_active_user
from ...models.user import User

router = APIRouter()

@router.get("/")
def get_wishlist(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    wishlists = db.query(Wishlist).filter(
        Wishlist.user_id == current_user.id
    ).all()
    
    # Get properties for each wishlist item
    result = []
    for w in wishlists:
        property = db.query(Property).filter(Property.id == w.property_id).first()
        if property:
            result.append({
                "id": w.id,
                "property": {
                    "id": property.id,
                    "title": property.title,
                    "price": property.price,
                    "city": property.city,
                    "property_type": property.property_type,
                    "listing_type": property.listing_type
                },
                "created_at": w.created_at
            })
    
    return result

@router.post("/{property_id}")
def add_to_wishlist(
    property_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Check if property exists
    property = db.query(Property).filter(Property.id == property_id).first()
    if not property:
        raise HTTPException(status_code=404, detail="Property not found")
    
    # Check if already in wishlist
    existing = db.query(Wishlist).filter(
        Wishlist.user_id == current_user.id,
        Wishlist.property_id == property_id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Property already in wishlist")
    
    # Add to wishlist
    wishlist = Wishlist(user_id=current_user.id, property_id=property_id)
    db.add(wishlist)
    db.commit()
    
    return {"message": "Property added to wishlist"}

@router.delete("/{property_id}")
def remove_from_wishlist(
    property_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    wishlist = db.query(Wishlist).filter(
        Wishlist.user_id == current_user.id,
        Wishlist.property_id == property_id
    ).first()
    
    if not wishlist:
        raise HTTPException(status_code=404, detail="Property not in wishlist")
    
    db.delete(wishlist)
    db.commit()
    
    return {"message": "Property removed from wishlist"}

@router.get("/check/{property_id}")
def check_wishlist_status(
    property_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    exists = db.query(Wishlist).filter(
        Wishlist.user_id == current_user.id,
        Wishlist.property_id == property_id
    ).first() is not None
    
    return {"is_favorited": exists}