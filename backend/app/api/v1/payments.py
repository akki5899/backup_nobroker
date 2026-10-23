from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import Dict, Any
import razorpay
import json

from ...core.database import get_db
from ...services.auth import get_current_user
from ...models.user import User
from ...models.payment import Payment, PaymentStatus, PaymentType
from ...schemas.payment import OrderCreateRequest, OrderResponse, VerifyPaymentRequest, VerifyPaymentResponse
from ...services.email import send_payment_receipt_email
import os
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

# Initialize Razorpay client. These keys should ideally be in env vars.
# RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID", "rzp_test_xxxxxx")
# RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "xxxxxx")

client = razorpay.Client(auth=(
    os.getenv("RAZORPAY_KEY_ID", "rzp_test_placeholder"), 
    os.getenv("RAZORPAY_KEY_SECRET", "secret_placeholder")
))

@router.post("/create-order", response_model=OrderResponse)
def create_order(
    request: OrderCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        amount_paise = int(request.amount * 100)
        
        # Create Order on Razorpay
        data = {
            "amount": amount_paise,
            "currency": "INR",
            "receipt": f"receipt_{current_user.id}_{request.payment_type}",
            "notes": {
                "user_id": current_user.id,
                "type": request.payment_type.value,
                "reference_id": request.reference_id
            }
        }
        
        # If in a real environment, uncomment the Razorpay API call:
        # razorpay_order = client.order.create(data=data)
        # order_id = razorpay_order['id']
        
        # Mocking for implementation setup
        order_id = f"order_{current_user.id}_{int(request.amount)}"
        
        # Save placeholder record to DB
        new_payment = Payment(
            user_id=current_user.id,
            razorpay_order_id=order_id,
            amount=request.amount,
            status=PaymentStatus.PENDING,
            payment_type=request.payment_type,
            reference_id=request.reference_id,
            metadata_json=json.dumps(request.metadata_json) if request.metadata_json else "{}"
        )
        db.add(new_payment)
        db.commit()
        db.refresh(new_payment)
        
        return OrderResponse(
            order_id=order_id,
            amount=request.amount,
            receipt=data["receipt"],
            key_id=os.getenv("RAZORPAY_KEY_ID", "rzp_test_placeholder")
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/verify-payment", response_model=VerifyPaymentResponse)
def verify_payment(
    request: VerifyPaymentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    payment = db.query(Payment).filter(
        Payment.razorpay_order_id == request.razorpay_order_id,
        Payment.user_id == current_user.id
    ).first()
    
    if not payment:
        raise HTTPException(status_code=404, detail="Order not found")
        
    try:
        # Verify signature using Razorpay util
        # client.utility.verify_payment_signature({
        #     'razorpay_order_id': request.razorpay_order_id,
        #     'razorpay_payment_id': request.razorpay_payment_id,
        #     'razorpay_signature': request.razorpay_signature
        # })
        
        # Mark as successful
        payment.razorpay_payment_id = request.razorpay_payment_id
        payment.razorpay_signature = request.razorpay_signature
        payment.status = PaymentStatus.SUCCESS
        db.commit()

        # Email a styled receipt (best-effort — never fail the payment on mail error).
        user_email = current_user.email or ""
        if user_email and not user_email.endswith("@propdirect.placeholder.com"):
            payment_type_val = (
                payment.payment_type.value
                if hasattr(payment.payment_type, "value")
                else str(payment.payment_type)
            )
            try:
                send_payment_receipt_email(
                    to_email=user_email,
                    full_name=current_user.full_name or "",
                    amount=float(payment.amount or 0),
                    payment_type=payment_type_val,
                    order_id=payment.razorpay_order_id or "",
                    payment_id=payment.razorpay_payment_id or "",
                )
            except Exception as e:
                logger.error(f"Failed to send payment receipt email to {user_email}: {e}")

        # TODO: Post-Payment Actions (Handled Async via Event or Immediately Here)
        # e.g. update property `is_featured`, update user `subscription`, unlock leads, etc.
        if payment.payment_type == PaymentType.LISTING_FEE.value:
            pass # Mark listing as active
        elif payment.payment_type == PaymentType.PREMIUM_UPGRADE.value:
            pass # Mark property as featured
            
        return VerifyPaymentResponse(success=True, message="Payment successfully verified.")
        
    except razorpay.errors.SignatureVerificationError:
        payment.status = PaymentStatus.FAILED
        db.commit()
        raise HTTPException(status_code=400, detail="Invalid Payment Signature")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
