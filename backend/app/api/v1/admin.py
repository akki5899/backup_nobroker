"""Admin control-center API.

Single shared admin login (see config.admin_*). Every endpoint is guarded by
`get_current_admin`, which validates that the JWT subject equals the configured
admin email. Every state-changing action is recorded to the AdminAuditLog so the
"Audit Log" tab in the dashboard shows a full history.

Surface area (grouped by the dashboard tab that consumes it):
  Overview    -> /stats, /analytics/growth
  Review      -> /properties/pending, approve, reject, bulk-approve, bulk-reject
  Users       -> /users (search), /users/{id}, suspend, activate, verify, edit, delete
  Properties  -> /properties (search), feature, activate, edit, delete
  Revenue     -> /payments, /analytics/revenue, /subscriptions
  Engagement  -> /leads, /visits, /agreements, /inquiries
  Broadcast   -> /broadcast
  Audit Log   -> /audit-logs
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, or_, cast, Date
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timedelta
from ...core.database import get_db
from ...core.config import settings
from ...core.security import get_password_hash
from ...models.user import User, UserType
from ...models.property import Property
from ...models.inquiry import Inquiry
from ...models.payment import Payment, PaymentStatus
from ...models.subscription import Subscription, SubscriptionStatus
from ...models.lead import Lead
from ...models.visits_agreements import PropertyVisit, RentalAgreement
from ...models.notification import Notification
from ...models.admin_audit_log import AdminAuditLog
from ...services.auth import verify_token, security
from ...services.email import send_property_listed_email, send_property_rejected_email
from ...services.notifications import create_notification
from fastapi.security import HTTPAuthorizationCredentials
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


def get_current_admin(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    email = verify_token(token)
    if email != settings.admin_email:
        raise HTTPException(status_code=403, detail="Not authorized as admin")
    return {"email": email, "is_admin": True}


# --------------------------------------------------------------------------- #
# Audit logging
# --------------------------------------------------------------------------- #
def _audit(
    db: Session,
    admin: dict,
    action: str,
    target_type: Optional[str] = None,
    target_id: Optional[int] = None,
    detail: str = "",
) -> None:
    """Record an admin action. Best-effort: never block the action if logging fails."""
    try:
        db.add(AdminAuditLog(
            actor=admin.get("email", "admin"),
            action=action,
            target_type=target_type,
            target_id=target_id,
            detail=detail or "",
        ))
        db.commit()
    except Exception:  # pragma: no cover - logging must not break the operation
        logger.exception("Failed to write audit log for %s", action)
        db.rollback()


# --------------------------------------------------------------------------- #
# Serializers
# --------------------------------------------------------------------------- #
def _serialize_property(p: Property) -> dict:
    return {
        "id": p.id,
        "title": p.title,
        "owner_id": p.owner_id,
        "city": p.city,
        "address": p.address,
        "listing_type": str(p.listing_type.value if hasattr(p.listing_type, "value") else p.listing_type),
        "property_type": str(p.property_type.value if hasattr(p.property_type, "value") else p.property_type),
        "price": p.price,
        "bedrooms": p.bedrooms,
        "bathrooms": p.bathrooms,
        "area": p.area,
        "isActive": p.is_active,
        "is_featured": p.is_featured,
        "is_luxury": p.is_luxury,
        "views": p.views,
        "moderation_status": p.moderation_status,
        "created_at": p.created_at,
    }


def _serialize_user(u: User) -> dict:
    return {
        "id": u.id,
        "email": u.email,
        "phone": u.phone,
        "full_name": u.full_name,
        "user_type": u.user_type.value if hasattr(u.user_type, "value") else str(u.user_type),
        "is_active": u.is_active,
        "is_verified": u.is_verified,
        "email_verified": u.email_verified,
        "phone_verified": u.phone_verified,
        "created_at": u.created_at,
    }


def _serialize_payment(p: Payment) -> dict:
    return {
        "id": p.id,
        "user_id": p.user_id,
        "amount": p.amount,
        "currency": p.currency,
        "status": p.status.value if hasattr(p.status, "value") else str(p.status),
        "payment_type": p.payment_type.value if hasattr(p.payment_type, "value") else str(p.payment_type),
        "razorpay_order_id": p.razorpay_order_id,
        "razorpay_payment_id": p.razorpay_payment_id,
        "reference_id": p.reference_id,
        "created_at": p.created_at,
    }


# --------------------------------------------------------------------------- #
# Overview / dashboard stats
# --------------------------------------------------------------------------- #
@router.get("/stats")
def get_admin_stats(db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    """High-level KPIs for the Overview tab."""
    now = datetime.utcnow()
    last_30 = now - timedelta(days=30)

    users_count = db.query(User).count()
    properties_count = db.query(Property).count()
    inquiries_count = db.query(Inquiry).count()
    pending_count = db.query(Property).filter(Property.moderation_status == "pending").count()

    active_listings = db.query(Property).filter(Property.is_active == True).count()
    suspended_users = db.query(User).filter(User.is_active == False).count()

    # Revenue from successful payments.
    total_revenue = (
        db.query(func.coalesce(func.sum(Payment.amount), 0.0))
        .filter(Payment.status == PaymentStatus.SUCCESS)
        .scalar()
        or 0.0
    )
    revenue_30d = (
        db.query(func.coalesce(func.sum(Payment.amount), 0.0))
        .filter(Payment.status == PaymentStatus.SUCCESS, Payment.created_at >= last_30)
        .scalar()
        or 0.0
    )

    new_users_30d = db.query(User).filter(User.created_at >= last_30).count()
    new_listings_30d = db.query(Property).filter(Property.created_at >= last_30).count()

    active_subscriptions = (
        db.query(Subscription).filter(Subscription.status == SubscriptionStatus.ACTIVE).count()
    )
    leads_count = db.query(Lead).count()
    visits_count = db.query(PropertyVisit).count()
    agreements_count = db.query(RentalAgreement).count()

    return {
        "users": users_count,
        "properties": properties_count,
        "inquiries": inquiries_count,
        "pending": pending_count,
        "active_listings": active_listings,
        "suspended_users": suspended_users,
        "total_revenue": round(float(total_revenue), 2),
        "revenue_30d": round(float(revenue_30d), 2),
        "new_users_30d": new_users_30d,
        "new_listings_30d": new_listings_30d,
        "active_subscriptions": active_subscriptions,
        "leads": leads_count,
        "visits": visits_count,
        "agreements": agreements_count,
    }


@router.get("/analytics/growth")
def get_growth_analytics(
    days: int = Query(30, ge=7, le=180),
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin),
):
    """Daily counts of new users and new listings over the window (for charts)."""
    start = datetime.utcnow() - timedelta(days=days)

    def _series(model):
        rows = (
            db.query(cast(model.created_at, Date).label("d"), func.count().label("c"))
            .filter(model.created_at >= start)
            .group_by("d")
            .all()
        )
        return {str(r.d): r.c for r in rows}

    users_by_day = _series(User)
    props_by_day = _series(Property)

    out = []
    for i in range(days):
        day = (start + timedelta(days=i)).date()
        key = str(day)
        out.append({
            "date": key,
            "users": users_by_day.get(key, 0),
            "properties": props_by_day.get(key, 0),
        })
    return out


@router.get("/analytics/revenue")
def get_revenue_analytics(
    days: int = Query(30, ge=7, le=365),
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin),
):
    """Revenue breakdown for the Revenue tab: daily totals + split by payment type."""
    start = datetime.utcnow() - timedelta(days=days)
    successful = db.query(Payment).filter(
        Payment.status == PaymentStatus.SUCCESS, Payment.created_at >= start
    )

    daily_rows = (
        db.query(cast(Payment.created_at, Date).label("d"), func.coalesce(func.sum(Payment.amount), 0.0).label("amt"))
        .filter(Payment.status == PaymentStatus.SUCCESS, Payment.created_at >= start)
        .group_by("d")
        .all()
    )
    by_day_map = {str(r.d): float(r.amt or 0) for r in daily_rows}
    daily = []
    for i in range(days):
        key = str((start + timedelta(days=i)).date())
        daily.append({"date": key, "amount": round(by_day_map.get(key, 0.0), 2)})

    type_rows = (
        db.query(Payment.payment_type, func.coalesce(func.sum(Payment.amount), 0.0).label("amt"), func.count().label("c"))
        .filter(Payment.status == PaymentStatus.SUCCESS, Payment.created_at >= start)
        .group_by(Payment.payment_type)
        .all()
    )
    by_type = [
        {
            "type": (t.payment_type.value if hasattr(t.payment_type, "value") else str(t.payment_type)),
            "amount": round(float(t.amt or 0), 2),
            "count": t.c,
        }
        for t in type_rows
    ]

    return {
        "total": round(float(successful.with_entities(func.coalesce(func.sum(Payment.amount), 0.0)).scalar() or 0), 2),
        "transactions": successful.count(),
        "daily": daily,
        "by_type": by_type,
    }


# --------------------------------------------------------------------------- #
# Users
# --------------------------------------------------------------------------- #
@router.get("/users")
def get_all_users(
    search: Optional[str] = Query(None, description="Match name / email / phone"),
    user_type: Optional[str] = Query(None),
    status: Optional[str] = Query(None, description="active | suspended"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin),
):
    q = db.query(User)
    if search:
        like = f"%{search.strip()}%"
        q = q.filter(or_(User.full_name.ilike(like), User.email.ilike(like), User.phone.ilike(like)))
    if user_type:
        q = q.filter(User.user_type == user_type)
    if status == "active":
        q = q.filter(User.is_active == True)
    elif status == "suspended":
        q = q.filter(User.is_active == False)

    total = q.count()
    users = q.order_by(User.created_at.desc()).offset(offset).limit(limit).all()
    return {"total": total, "items": [_serialize_user(u) for u in users]}


@router.get("/users/{user_id}")
def get_user_detail(user_id: int, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    """Full 360° view of a user: profile + their listings, leads, payments."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    properties = db.query(Property).filter(Property.owner_id == user_id).order_by(Property.created_at.desc()).all()
    payments = db.query(Payment).filter(Payment.user_id == user_id).order_by(Payment.created_at.desc()).all()
    leads = db.query(Lead).filter(Lead.owner_id == user_id).count()
    total_spent = (
        db.query(func.coalesce(func.sum(Payment.amount), 0.0))
        .filter(Payment.user_id == user_id, Payment.status == PaymentStatus.SUCCESS)
        .scalar()
        or 0.0
    )

    return {
        "user": _serialize_user(user),
        "properties": [_serialize_property(p) for p in properties],
        "payments": [_serialize_payment(p) for p in payments],
        "stats": {
            "properties": len(properties),
            "leads_received": leads,
            "total_spent": round(float(total_spent), 2),
        },
    }


class UserEditRequest(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    user_type: Optional[str] = None


@router.put("/users/{user_id}")
def edit_user(
    user_id: int,
    request: UserEditRequest,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    changed = []
    if request.full_name is not None:
        user.full_name = request.full_name
        changed.append("full_name")
    if request.email is not None:
        user.email = request.email
        changed.append("email")
    if request.phone is not None:
        user.phone = request.phone
        changed.append("phone")
    if request.user_type is not None:
        try:
            user.user_type = UserType(request.user_type)
            changed.append("user_type")
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid user_type: {request.user_type}")

    db.commit()
    db.refresh(user)
    _audit(db, admin, "user.edit", "user", user_id, f"Updated: {', '.join(changed) or 'nothing'}")
    return {"message": "User updated", "user": _serialize_user(user)}


@router.post("/users/{user_id}/suspend")
def suspend_user(user_id: int, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    """Suspend a user (is_active=False) and hide all their listings from public search."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = False
    # Pull their live listings out of public search while suspended.
    db.query(Property).filter(Property.owner_id == user_id).update({"is_active": False})
    db.commit()
    _audit(db, admin, "user.suspend", "user", user_id, "User suspended; listings hidden")
    return {"message": "User suspended", "user": _serialize_user(user)}


@router.post("/users/{user_id}/activate")
def activate_user(user_id: int, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    """Reactivate a suspended user. Their previously-approved listings go live again."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = True
    db.query(Property).filter(
        Property.owner_id == user_id, Property.moderation_status == "approved"
    ).update({"is_active": True})
    db.commit()
    _audit(db, admin, "user.activate", "user", user_id, "User reactivated; approved listings restored")
    return {"message": "User activated", "user": _serialize_user(user)}


@router.post("/users/{user_id}/verify")
def verify_user(user_id: int, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    """Mark a user as verified (trust badge)."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_verified = True
    db.commit()
    _audit(db, admin, "user.verify", "user", user_id, "User marked verified")
    return {"message": "User verified", "user": _serialize_user(user)}


class ResetPasswordRequest(BaseModel):
    new_password: str


@router.post("/users/{user_id}/reset-password")
def admin_reset_password(
    user_id: int,
    request: ResetPasswordRequest,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin),
):
    """Force-set a user's password (support flow)."""
    if not request.new_password or len(request.new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.hashed_password = get_password_hash(request.new_password)
    db.commit()
    _audit(db, admin, "user.reset_password", "user", user_id, "Password reset by admin")
    return {"message": "Password reset successfully"}


@router.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    email = user.email
    db.delete(user)
    db.commit()
    _audit(db, admin, "user.delete", "user", user_id, f"Deleted user {email}")
    return {"message": "User deleted successfully"}


# --------------------------------------------------------------------------- #
# Properties
# --------------------------------------------------------------------------- #
@router.get("/properties")
def get_all_properties(
    search: Optional[str] = Query(None, description="Match title / city / address"),
    moderation_status: Optional[str] = Query(None),
    listing_type: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin),
):
    q = db.query(Property)
    if search:
        like = f"%{search.strip()}%"
        q = q.filter(or_(Property.title.ilike(like), Property.city.ilike(like), Property.address.ilike(like)))
    if moderation_status:
        q = q.filter(Property.moderation_status == moderation_status)
    if listing_type:
        q = q.filter(Property.listing_type == listing_type)

    total = q.count()
    properties = q.order_by(Property.created_at.desc()).offset(offset).limit(limit).all()
    return {"total": total, "items": [_serialize_property(p) for p in properties]}


@router.get("/properties/pending")
def get_pending_properties(db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    """Listings awaiting admin moderation (newest first)."""
    properties = (
        db.query(Property)
        .filter(Property.moderation_status == "pending")
        .order_by(Property.created_at.desc())
        .all()
    )
    return [_serialize_property(p) for p in properties]


def _notify_owner(db: Session, prop: Property, approved: bool, reason: str = "") -> None:
    """Notify the listing owner about an approve/reject decision (in-app + email)."""
    owner = db.query(User).filter(User.id == prop.owner_id).first()

    # In-app notification (bell) — independent of email configuration.
    if owner:
        if approved:
            create_notification(
                db, user_id=owner.id,
                title="Listing approved 🎉",
                message=f"Your listing '{prop.title or 'property'}' is now live and visible in search.",
                type="listing",
            )
        else:
            reason_txt = f" Reason: {reason}" if reason else ""
            create_notification(
                db, user_id=owner.id,
                title="Listing needs changes",
                message=f"Your listing '{prop.title or 'property'}' wasn't approved.{reason_txt}",
                type="listing",
            )

    owner_email = (owner.email if owner else "") or ""
    if not owner_email or owner_email.endswith("@propdirect.placeholder.com"):
        return
    location = ", ".join(p for p in [prop.address, prop.city] if p)
    listing_type_val = (
        prop.listing_type.value if hasattr(prop.listing_type, "value") else str(prop.listing_type or "")
    )
    try:
        if approved:
            send_property_listed_email(
                to_email=owner_email,
                owner_name=owner.full_name or "",
                property_title=prop.title or "",
                property_location=location,
                listing_type=listing_type_val,
                price=prop.price,
            )
        else:
            send_property_rejected_email(
                to_email=owner_email,
                owner_name=owner.full_name or "",
                property_title=prop.title or "",
                property_location=location,
                reason=reason,
            )
    except Exception as e:
        logger.error(f"Failed to send moderation email to {owner_email}: {e}")


def _approve(db: Session, prop: Property) -> None:
    prop.moderation_status = "approved"
    prop.is_active = True


def _reject(db: Session, prop: Property) -> None:
    prop.moderation_status = "rejected"
    prop.is_active = False


@router.post("/properties/{property_id}/approve")
def approve_property(property_id: int, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    """Approve a listing: make it visible in public search and notify the owner."""
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    _approve(db, prop)
    db.commit()
    db.refresh(prop)
    _notify_owner(db, prop, approved=True)
    _audit(db, admin, "property.approve", "property", property_id, prop.title or "")
    return {"message": "Property approved", "property": _serialize_property(prop)}


class RejectRequest(BaseModel):
    reason: Optional[str] = None


@router.post("/properties/{property_id}/reject")
def reject_property(
    property_id: int,
    request: RejectRequest = RejectRequest(),
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin),
):
    """Reject a listing: keep it hidden from public search and notify the owner."""
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    _reject(db, prop)
    db.commit()
    db.refresh(prop)
    _notify_owner(db, prop, approved=False, reason=(request.reason or ""))
    _audit(db, admin, "property.reject", "property", property_id, (request.reason or "no reason given"))
    return {"message": "Property rejected", "property": _serialize_property(prop)}


class BulkIdsRequest(BaseModel):
    ids: List[int]
    reason: Optional[str] = None


@router.post("/properties/bulk-approve")
def bulk_approve(request: BulkIdsRequest, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    props = db.query(Property).filter(Property.id.in_(request.ids)).all()
    for p in props:
        _approve(db, p)
    db.commit()
    for p in props:
        _notify_owner(db, p, approved=True)
    _audit(db, admin, "property.bulk_approve", "property", None, f"Approved {len(props)} listings: {request.ids}")
    return {"message": f"Approved {len(props)} listings", "count": len(props)}


@router.post("/properties/bulk-reject")
def bulk_reject(request: BulkIdsRequest, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    props = db.query(Property).filter(Property.id.in_(request.ids)).all()
    for p in props:
        _reject(db, p)
    db.commit()
    for p in props:
        _notify_owner(db, p, approved=False, reason=(request.reason or ""))
    _audit(db, admin, "property.bulk_reject", "property", None, f"Rejected {len(props)} listings: {request.ids}")
    return {"message": f"Rejected {len(props)} listings", "count": len(props)}


@router.post("/properties/{property_id}/feature")
def toggle_feature(property_id: int, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    """Toggle the 'featured' flag that promotes a listing on the homepage."""
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    prop.is_featured = not bool(prop.is_featured)
    db.commit()
    db.refresh(prop)
    _audit(db, admin, "property.feature", "property", property_id, f"is_featured={prop.is_featured}")
    return {"message": "Feature toggled", "property": _serialize_property(prop)}


@router.post("/properties/{property_id}/toggle-active")
def toggle_active(property_id: int, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    """Manually show/hide a listing from public search without changing moderation status."""
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    prop.is_active = not bool(prop.is_active)
    db.commit()
    db.refresh(prop)
    _audit(db, admin, "property.toggle_active", "property", property_id, f"is_active={prop.is_active}")
    return {"message": "Active state toggled", "property": _serialize_property(prop)}


@router.delete("/properties/{property_id}")
def delete_property(property_id: int, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    title = prop.title
    db.delete(prop)
    db.commit()
    _audit(db, admin, "property.delete", "property", property_id, f"Deleted '{title}'")
    return {"message": "Property deleted successfully"}


# --------------------------------------------------------------------------- #
# Revenue: payments + subscriptions
# --------------------------------------------------------------------------- #
@router.get("/payments")
def get_payments(
    status: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin),
):
    q = db.query(Payment)
    if status:
        q = q.filter(Payment.status == status)
    total = q.count()
    payments = q.order_by(Payment.created_at.desc()).offset(offset).limit(limit).all()
    return {"total": total, "items": [_serialize_payment(p) for p in payments]}


@router.get("/subscriptions")
def get_subscriptions(db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    subs = db.query(Subscription).order_by(Subscription.created_at.desc()).all()
    return [{
        "id": s.id,
        "user_id": s.user_id,
        "subscription_type": s.subscription_type.value if hasattr(s.subscription_type, "value") else str(s.subscription_type),
        "status": s.status.value if hasattr(s.status, "value") else str(s.status),
        "amount": s.amount,
        "start_date": s.start_date,
        "end_date": s.end_date,
        "created_at": s.created_at,
    } for s in subs]


# --------------------------------------------------------------------------- #
# Engagement: leads, visits, agreements, inquiries
# --------------------------------------------------------------------------- #
@router.get("/leads")
def get_all_leads(db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    leads = db.query(Lead).order_by(Lead.created_at.desc()).limit(300).all()
    return [{
        "id": l.id,
        "property_id": l.property_id,
        "user_id": l.user_id,
        "owner_id": l.owner_id,
        "phone": l.phone,
        "email": l.email,
        "status": l.status.value if hasattr(l.status, "value") else str(l.status),
        "is_active": l.is_active,
        "created_at": l.created_at,
    } for l in leads]


@router.get("/visits")
def get_all_visits(db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    visits = db.query(PropertyVisit).order_by(PropertyVisit.created_at.desc()).limit(300).all()
    return [{
        "id": v.id,
        "property_id": v.property_id,
        "user_id": v.user_id,
        "visit_date": v.visit_date,
        "status": v.status,
        "notes": v.notes,
        "created_at": v.created_at,
    } for v in visits]


@router.get("/agreements")
def get_all_agreements(db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    agreements = db.query(RentalAgreement).order_by(RentalAgreement.created_at.desc()).limit(300).all()
    return [{
        "id": a.id,
        "property_id": a.property_id,
        "tenant_id": a.tenant_id,
        "owner_id": a.owner_id,
        "rent_amount": a.rent_amount,
        "deposit_amount": a.deposit_amount,
        "start_date": a.start_date,
        "end_date": a.end_date,
        "status": a.status,
        "created_at": a.created_at,
    } for a in agreements]


@router.get("/inquiries")
def get_all_inquiries(db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    inquiries = db.query(Inquiry).order_by(Inquiry.created_at.desc()).all()
    return [{
        "id": i.id,
        "property_id": i.property_id,
        "user_id": i.user_id,
        "message": i.message,
        "status": i.status.value if hasattr(i.status, "value") else str(i.status),
        "created_at": i.created_at
    } for i in inquiries]


# --------------------------------------------------------------------------- #
# Broadcast notifications
# --------------------------------------------------------------------------- #
class BroadcastRequest(BaseModel):
    title: str
    message: str
    audience: str = "all"   # all | owner | tenant | buyer | agent | builder


@router.post("/broadcast")
def broadcast_notification(
    request: BroadcastRequest,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin),
):
    """Push an in-app notification to every user (or a user-type segment)."""
    if not request.title.strip() or not request.message.strip():
        raise HTTPException(status_code=400, detail="Title and message are required")

    q = db.query(User.id).filter(User.is_active == True)
    if request.audience and request.audience != "all":
        try:
            q = q.filter(User.user_type == UserType(request.audience))
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid audience: {request.audience}")

    user_ids = [row.id for row in q.all()]
    for uid in user_ids:
        db.add(Notification(
            user_id=uid,
            title=request.title.strip(),
            message=request.message.strip(),
            type="system",
            is_read=False,
        ))
    db.commit()
    _audit(db, admin, "broadcast", "notification", None,
           f"'{request.title}' -> {len(user_ids)} users (audience={request.audience})")
    return {"message": f"Notification sent to {len(user_ids)} users", "count": len(user_ids)}


# --------------------------------------------------------------------------- #
# Audit log
# --------------------------------------------------------------------------- #
@router.get("/audit-logs")
def get_audit_logs(
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin),
):
    q = db.query(AdminAuditLog)
    total = q.count()
    logs = q.order_by(AdminAuditLog.created_at.desc()).offset(offset).limit(limit).all()
    return {
        "total": total,
        "items": [{
            "id": l.id,
            "actor": l.actor,
            "action": l.action,
            "target_type": l.target_type,
            "target_id": l.target_id,
            "detail": l.detail,
            "created_at": l.created_at,
        } for l in logs],
    }
