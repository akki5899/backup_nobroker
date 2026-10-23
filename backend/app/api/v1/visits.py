from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ...core.database import get_db
from ...models.user import User
from ...services.auth import get_current_active_user

router = APIRouter()

@router.get("/my-visits")
def get_my_visits(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    try:
        from ...models.visits_agreements import PropertyVisit
        from ...models.property import Property
        
        visits = db.query(PropertyVisit).join(Property).filter(
            PropertyVisit.user_id == current_user.id
        ).all()
        
        visit_list = []
        for visit in visits:
            visit_list.append({
                "id": visit.id,
                "property_title": visit.property.title,
                "address": visit.property.address,
                "date": visit.visit_date.strftime("%Y-%m-%d"),
                "time": visit.visit_date.strftime("%H:%M"),
                "status": visit.status,
                "notes": visit.notes
            })
        
        return {"visits": visit_list}
    except Exception as e:
        return {"visits": []}