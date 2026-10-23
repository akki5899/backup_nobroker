from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ...core.database import get_db
from ...models.user import User
from ...models.property import Property
from ...schemas.user import UserResponse, UserUpdate
from ...schemas.property import PropertyResponse
from ...services.auth import get_current_active_user
import os

router = APIRouter()

@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_active_user)):
    return current_user

@router.put("/me", response_model=UserResponse)
def update_current_user(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    for field, value in user_update.dict(exclude_unset=True).items():
        setattr(current_user, field, value)
    
    db.commit()
    db.refresh(current_user)
    return current_user

@router.delete("/me")
def delete_current_user(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Delete associated property images from filesystem
    for property in current_user.properties:
        for image in property.images:
            if os.path.exists(image.image_url):
                os.remove(image.image_url)
    
    db.delete(current_user)
    db.commit()
    return {"message": "Account deleted successfully"}

@router.get("/my-properties", response_model=List[PropertyResponse])
def get_my_properties(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    properties = db.query(Property).filter(Property.owner_id == current_user.id).all()
    return properties