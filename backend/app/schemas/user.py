from pydantic import BaseModel, EmailStr
from typing import Optional, Union
from datetime import datetime
from ..models.user import UserType

class UserBase(BaseModel):
    email: Optional[EmailStr] = None
    phone: str
    full_name: str
    user_type: Union[UserType, str] # Allow string input for user_type

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None

class UserResponse(UserBase):
    id: int
    is_active: bool
    is_verified: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None