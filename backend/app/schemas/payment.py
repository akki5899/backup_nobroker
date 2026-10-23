from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from enum import Enum

class PaymentStatusEnum(str, Enum):
    PENDING = "pending"
    SUCCESS = "success"
    FAILED = "failed"
    REFUNDED = "refunded"

class PaymentTypeEnum(str, Enum):
    LISTING_FEE = "listing_fee"
    PREMIUM_UPGRADE = "premium_upgrade"
    SUBSCRIPTION = "subscription"
    LEAD_UNLOCK = "lead_unlock"
    TOKEN_ADVANCE = "token_advance"

class OrderCreateRequest(BaseModel):
    amount: float = Field(..., gt=0, description="Amount in INR (not paise, we will multiply by 100 on the backend)")
    payment_type: PaymentTypeEnum
    reference_id: Optional[int] = None
    metadata_json: Optional[Dict[str, Any]] = None

class OrderResponse(BaseModel):
    order_id: str
    amount: float
    currency: str = "INR"
    receipt: str
    key_id: str

class VerifyPaymentRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str

class VerifyPaymentResponse(BaseModel):
    success: bool
    message: str
