from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from ..models.inquiry import InquiryStatus

class InquiryBase(BaseModel):
    property_id: int
    message: Optional[str] = None

class InquiryCreate(InquiryBase):
    pass

class InquiryResponse(InquiryBase):
    id: int
    user_id: int
    status: InquiryStatus
    created_at: datetime
    
    class Config:
        from_attributes = True

class InquiryUpdate(BaseModel):
    status: Optional[InquiryStatus] = None
    message: Optional[str] = None