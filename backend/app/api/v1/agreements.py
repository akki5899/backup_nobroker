from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ...core.database import get_db
from ...models.user import User
from ...services.auth import get_current_active_user

router = APIRouter()

@router.get("/my-agreements")
def get_my_agreements(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    try:
        from ...models.visits_agreements import RentalAgreement
        from ...models.property import Property
        
        agreements = db.query(RentalAgreement).join(Property).filter(
            RentalAgreement.tenant_id == current_user.id
        ).all()
        
        agreement_list = []
        for agreement in agreements:
            agreement_list.append({
                "id": agreement.id,
                "property_title": agreement.property.title,
                "rent": agreement.rent_amount,
                "start_date": agreement.start_date.strftime("%Y-%m-%d"),
                "end_date": agreement.end_date.strftime("%Y-%m-%d"),
                "status": agreement.status,
                "agreement_url": agreement.agreement_url
            })
        
        return {"agreements": agreement_list}
    except Exception as e:
        return {"agreements": []}