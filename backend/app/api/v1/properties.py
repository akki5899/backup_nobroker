from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, func, text
from typing import List, Optional
from ...core.database import get_db
from ...models.property import Property, PropertyType, ListingType
from ...models.property_image import PropertyImage
from ...models.user import User
from ...schemas.property import PropertyCreate, PropertyResponse, PropertyUpdate, PropertySearch
from ...services.auth import get_current_active_user
from ...services.permissions import require_owner
from ...services.email import send_property_listed_email, send_property_submitted_email
import shutil
import os
from uuid import uuid4
from pydantic import BaseModel
from typing import List as ListType
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

class GeofenceSearch(BaseModel):
    coordinates: List[List[float]]  # [[lng, lat], [lng, lat], ...]
    property_type: Optional[str] = None
    listing_type: Optional[str] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None

@router.get("/debug/sample")
def debug_sample_properties(db: Session = Depends(get_db)):
    """Debug endpoint to see sample property data"""
    properties = db.query(Property).limit(5).all()
    sample_data = []
    
    for prop in properties:
        sample_data.append({
            "id": prop.id,
            "title": prop.title,
            "city": prop.city,
            "listing_type": prop.listing_type,
            "listing_type_raw": str(prop.listing_type),
            "property_type": prop.property_type,
            "property_type_raw": str(prop.property_type),
            "price": prop.price,
            "is_active": prop.is_active
        })
    
    return {"sample_properties": sample_data}

@router.get("/debug/count")
def debug_property_count(db: Session = Depends(get_db)):
    """Debug endpoint to check property counts"""
    total = db.query(Property).count()
    active = db.query(Property).filter(Property.is_active == True).count()
    hyderabad = db.query(Property).filter(Property.city.ilike("%hyderabad%")).count()
    rent = db.query(Property).filter(Property.listing_type == ListingType.RENT).count()
    hyderabad_rent = db.query(Property).filter(
        Property.city.ilike("%hyderabad%"),
        Property.listing_type == ListingType.RENT
    ).count()
    
    # Get sample cities
    cities = db.query(Property.city).distinct().limit(10).all()
    city_list = [city[0] for city in cities]
    
    return {
        "total_properties": total,
        "active_properties": active,
        "hyderabad_properties": hyderabad,
        "rent_properties": rent,
        "hyderabad_rent_properties": hyderabad_rent,
        "sample_cities": city_list
    }

@router.post("/radius-search", response_model=List[PropertyResponse])
def search_properties_by_radius(
    lat: float,
    lng: float,
    radius_km: float = 15,
    property_type: Optional[str] = None,
    listing_type: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    bedrooms: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Search properties within radius using Haversine formula"""
    # Validate inputs
    if not (-90 <= lat <= 90) or not (-180 <= lng <= 180):
        raise HTTPException(status_code=400, detail="Invalid coordinates")
    if radius_km <= 0 or radius_km > 100:
        raise HTTPException(status_code=400, detail="Radius must be between 0 and 100 km")
    
    # Calculate bounding box for initial filter (faster than Haversine on all rows)
    lat_delta = radius_km / 111.32  # 1 degree latitude ≈ 111.32 km
    lng_delta = radius_km / (111.32 * abs(func.cos(func.radians(lat))))
    
    query = db.query(Property).filter(
        Property.is_active == True,
        Property.latitude.isnot(None),
        Property.longitude.isnot(None),
        Property.latitude >= lat - lat_delta,
        Property.latitude <= lat + lat_delta,
        Property.longitude >= lng - lng_delta,
        Property.longitude <= lng + lng_delta
    )
    
    # Apply filters
    if property_type:
        try:
            prop_type_enum = PropertyType(property_type.lower())
            query = query.filter(Property.property_type == prop_type_enum)
        except ValueError:
            pass
    
    if listing_type:
        try:
            listing_type_enum = ListingType(listing_type.lower())
            query = query.filter(Property.listing_type == listing_type_enum)
        except ValueError:
            pass
    
    if min_price:
        query = query.filter(Property.price >= min_price)
    if max_price:
        query = query.filter(Property.price <= max_price)
    if bedrooms:
        query = query.filter(Property.bedrooms == bedrooms)
    
    # Get properties and filter by exact distance using Haversine
    properties = query.all()
    
    # Filter by exact distance
    import math
    filtered_properties = []
    for prop in properties:
        if prop.latitude and prop.longitude:
            # Haversine formula
            dlat = math.radians(prop.latitude - lat)
            dlng = math.radians(prop.longitude - lng)
            a = math.sin(dlat/2)**2 + math.cos(math.radians(lat)) * math.cos(math.radians(prop.latitude)) * math.sin(dlng/2)**2
            c = 2 * math.asin(math.sqrt(a))
            distance = 6371 * c  # Earth radius in km
            
            if distance <= radius_km:
                filtered_properties.append(prop)
    
    return filtered_properties

@router.post("/geofence-search", response_model=List[PropertyResponse])
def search_properties_in_geofence(
    search: GeofenceSearch,
    db: Session = Depends(get_db)
):
    """Search properties within a drawn geofence polygon using bounding box"""
    if len(search.coordinates) < 3:
        raise HTTPException(status_code=400, detail="Polygon must have at least 3 points")
    
    # Validate coordinates
    for lng, lat in search.coordinates:
        if not (-180 <= lng <= 180) or not (-90 <= lat <= 90):
            raise HTTPException(status_code=400, detail="Invalid coordinates")
    
    # Calculate bounding box from polygon coordinates
    lngs = [coord[0] for coord in search.coordinates]
    lats = [coord[1] for coord in search.coordinates]
    
    min_lng, max_lng = min(lngs), max(lngs)
    min_lat, max_lat = min(lats), max(lats)
    
    query = db.query(Property).filter(
        Property.is_active == True,
        Property.latitude.isnot(None),
        Property.longitude.isnot(None),
        Property.latitude >= min_lat,
        Property.latitude <= max_lat,
        Property.longitude >= min_lng,
        Property.longitude <= max_lng
    )
    
    # Apply additional filters
    if search.property_type:
        try:
            prop_type_enum = PropertyType(search.property_type.lower())
            query = query.filter(Property.property_type == prop_type_enum)
        except ValueError:
            pass # Ignore invalid property type
    
    if search.listing_type:
        try:
            listing_type_enum = ListingType(search.listing_type.lower())
            query = query.filter(Property.listing_type == listing_type_enum)
        except ValueError:
            pass # Ignore invalid listing type
    
    if search.min_price:
        query = query.filter(Property.price >= search.min_price)
    if search.max_price:
        query = query.filter(Property.price <= search.max_price)
    
    return query.all()

@router.post("", response_model=PropertyResponse)
def create_property(
    property: PropertyCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Validate user role
    allowed_roles = ["owner", "agent", "builder"]
    user_role = current_user.user_type.value if hasattr(current_user.user_type, "value") else str(current_user.user_type)
    if user_role.lower() not in allowed_roles:
        raise HTTPException(status_code=403, detail="Only owners, agents, and builders can post properties")

   # Auto-generate title if not provided
    property_dict = property.dict()
    if not property_dict.get('title'):
        # Generate title from bedrooms and address
        bedrooms = property_dict.get('bedrooms', '')
        address = property_dict.get('address', '')
        if bedrooms and address:
            property_dict['title'] = f"{bedrooms}BHK {address}"
        elif address:
            property_dict['title'] = address
        else:
            property_dict['title'] = f"{property_dict.get('property_type', 'Property').title()} in {property_dict.get('city', 'Unknown')}"

    # New listings are held for admin review: keep them out of public search
    # (is_active=False) until approved from the /admin review queue.
    db_property = Property(
        **property_dict,
        owner_id=current_user.id,
        moderation_status="pending",
        is_active=False,
    )
    db.add(db_property)
    db.commit()
    db.refresh(db_property)

    # Let the owner/agent know their listing was received and is pending review.
    owner_email = current_user.email or ""
    if owner_email and not owner_email.endswith("@propdirect.placeholder.com"):
        location = ", ".join(
            p for p in [getattr(db_property, "address", None), getattr(db_property, "city", None)] if p
        )
        try:
            send_property_submitted_email(
                to_email=owner_email,
                owner_name=current_user.full_name or "",
                property_title=db_property.title or "",
                property_location=location,
            )
        except Exception as e:
            logger.error(f"Failed to send property-submitted email to {owner_email}: {e}")

    return db_property

@router.get("", response_model=List[PropertyResponse])
def search_properties(
    q: Optional[str] = None,
    city: Optional[str] = None,
    property_type: Optional[str] = None,
    listing_type: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    bedrooms: Optional[int] = None,
    bathrooms: Optional[int] = None,
    min_area: Optional[float] = None,
    parking: Optional[bool] = None,
    furnished: Optional[bool] = None,
    amenities: Optional[str] = None,  # comma-separated amenity field names
    connectivity: Optional[str] = None,  # comma-separated connectivity keys (metro, bus, ...)
    is_luxury: Optional[bool] = None,      # "Luxury Collection" quick filter
    gated_community: Optional[bool] = None,  # "Gated Community" quick filter
    newly_built: Optional[bool] = None,    # "Newly Built" quick filter (age <= 1 year)
    age: Optional[int] = None,        # new filter
    total_floors: Optional[int] = None, # new filter
    sort_by: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=1000),
    db: Session = Depends(get_db)
):
    query = db.query(Property).options(joinedload(Property.images)).filter(Property.is_active == True)

    # Amenity filtering (F23) — map frontend title case to backend snake_case
    ALLOWED_AMENITIES = {
        "gym": "gym",
        "pool": "swimming_pool",
        "security": "security",
        "parking": "parking",
        "lift": "lift",
        "power backup": "power_backup",
        "club house": "club_house",
        "garden": "garden",
        "children play area": "children_play_area",
        "visitor parking": "visitor_parking",
        "balcony": "balcony",
        "furnished": "furnished",
        "mini_theatre": "mini_theatre",
        "library_reading_room": "library_reading_room",
        "community_hall": "community_hall",
        "pet_park": "pet_park",
        "ev_charging": "ev_charging",
        "rainwater_harvesting": "rainwater_harvesting",
        "solar_panels": "solar_panels",
        "maintenance_staff": "maintenance_staff",
        "cctv_surveillance": "cctv_surveillance",
        "fire_safety": "fire_safety",
        "badminton_squash_court": "badminton_squash_court",
        "sauna_steam_room": "sauna_steam_room",
        "indoor_games_room": "indoor_games_room",
        "yoga_meditation_room": "yoga_meditation_room",
        "jogging_track": "jogging_track",
        "outdoor_fitness_area": "outdoor_fitness_area",
    }
    
    if amenities:
        for raw in amenities.split(","):
            field = raw.strip()
            # Try to map title case to snake case, otherwise use the raw value
            mapped_field = ALLOWED_AMENITIES.get(field.lower(), field)
            if hasattr(Property, mapped_field):
                query = query.filter(getattr(Property, mapped_field) == True)

    # Connectivity filtering — map homepage tile keys to near_* boolean columns.
    ALLOWED_CONNECTIVITY = {
        "metro": "near_metro",
        "bus": "near_bus",
        "highway": "near_highway",
        "schools": "near_schools",
        "hospitals": "near_hospitals",
        "airport": "near_airport",
        "it hubs": "near_it_hubs",
        "it_hubs": "near_it_hubs",
        "malls": "near_malls",
    }

    if connectivity:
        for raw in connectivity.split(","):
            key = raw.strip().lower()
            mapped_field = ALLOWED_CONNECTIVITY.get(key)
            if mapped_field and hasattr(Property, mapped_field):
                query = query.filter(getattr(Property, mapped_field) == True)

    # Curated collection quick filters.
    if is_luxury:
        query = query.filter(Property.is_luxury == True)
    if gated_community:
        query = query.filter(Property.gated_community == True)
    if newly_built:
        # "Newly Built" = constructed within the last year (age 0 or 1).
        query = query.filter(Property.age.isnot(None), Property.age <= 1)

    # Add debug logging
    logger.info(f"Search filters: q={q}, city={city}, listing_type={listing_type}, property_type={property_type}, age={age}, total_floors={total_floors}")
    
    if q:
        search_term = f"%{q.strip().lower()}%"
        query = query.filter(
            or_(
                func.lower(Property.title).ilike(search_term),
                func.lower(Property.description).ilike(search_term),
                func.lower(Property.city).ilike(search_term),
                func.lower(Property.address).ilike(search_term)
            )
        )
        
    if city:
        query = query.filter(Property.city.ilike(f"%{city.strip()}%"))
    if property_type:
        try:
            prop_type_enum = PropertyType(property_type.lower())
            query = query.filter(Property.property_type == prop_type_enum)
        except ValueError:
            pass # Ignore invalid property type
    if listing_type:
        try:
            listing_type_enum = ListingType(listing_type.lower())
            query = query.filter(Property.listing_type == listing_type_enum)
        except ValueError:
            pass # Ignore invalid listing type
    if min_price:
        query = query.filter(Property.price >= min_price)
    if max_price:
        query = query.filter(Property.price <= max_price)
    if bedrooms:
        query = query.filter(Property.bedrooms == bedrooms)
    if bathrooms:
        query = query.filter(Property.bathrooms >= bathrooms)
    if min_area:
        query = query.filter(Property.area.isnot(None), Property.area >= min_area)
    if parking:
        query = query.filter(Property.parking == True)
    if furnished is not None:
        query = query.filter(Property.furnished == furnished)
    if age is not None:
        query = query.filter(Property.age <= age) # Filter for properties up to the given age
    if total_floors is not None:
        query = query.filter(Property.total_floors >= total_floors) # Filter for properties with at least the given floors
    
    # Sorting
    if sort_by:
        if sort_by == 'newest':
            query = query.order_by(Property.created_at.desc())
        elif sort_by == 'price_low':
            query = query.order_by(Property.price.asc())
        elif sort_by == 'price_high':
            query = query.order_by(Property.price.desc())
        elif sort_by == 'area':
            query = query.order_by(Property.area.desc())
        elif sort_by == 'popular':
            query = query.order_by(Property.views.desc())
    else:
        query = query.order_by(Property.created_at.desc())

    properties = query.offset((page - 1) * limit).limit(limit).all()
    
    return properties

@router.get("/{property_id}", response_model=PropertyResponse)
def get_property(property_id: int, db: Session = Depends(get_db)):
    property = db.query(Property).filter(Property.id == property_id).first()
    if not property:
        raise HTTPException(status_code=404, detail="Property not found")
    
    # Increment views
    property.views += 1
    db.commit()
    
    return property

@router.put("/{property_id}", response_model=PropertyResponse)
def update_property(
    property_id: int,
    property_update: PropertyUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    property = db.query(Property).filter(
        Property.id == property_id,
        Property.owner_id == current_user.id
    ).first()
    if not property:
        raise HTTPException(status_code=404, detail="Property not found or not owned by you")
    
    for field, value in property_update.dict(exclude_unset=True).items():
        setattr(property, field, value)
    
    db.commit()
    db.refresh(property)
    return property

import os
from pathlib import Path

def secure_file_path(base_dir: str, file_path: str) -> str:
    """Validate file path is within base directory"""
    try:
        base = Path(base_dir).resolve()
        target = Path(file_path).resolve()
        
        # Check if target is relative to base
        try:
            target.relative_to(base)
        except ValueError:
            raise ValueError("Invalid file path")
        
        return str(target)
    except Exception as e:
        logger.error(f"Path validation error: {e}")
        # If validation fails, raise an error instead of returning insecure fallback
        raise ValueError("Invalid file path")

@router.delete("/bulk")
def bulk_delete_properties(
    property_ids: ListType[int],
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    properties = db.query(Property).filter(
        Property.id.in_(property_ids),
        Property.owner_id == current_user.id
    ).all()
    
    if not properties:
        raise HTTPException(status_code=404, detail="No properties found")
    
    try:
        deleted_count = 0
        for property in properties:
            # Delete associated images from filesystem with path validation
            for image in property.images:
                try:
                    safe_path = secure_file_path("uploads", image.image_url)
                    if os.path.exists(safe_path):
                        os.remove(safe_path)
                except ValueError:
                    logger.warning(f"Skipping invalid file path: {image.image_url}")
                except Exception as e:
                    logger.warning(f"Filesystem delete failed: {e}")
            db.delete(property)
            deleted_count += 1
        db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f"Bulk delete transaction failed: {e}")
        raise HTTPException(status_code=500, detail="Bulk delete failed, transaction rolled back.")
    
    return {"message": f"{deleted_count} properties deleted successfully"}

@router.delete("/{property_id}")
def delete_property(
    property_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    property = db.query(Property).filter(
        Property.id == property_id,
        Property.owner_id == current_user.id
    ).first()
    if not property:
        raise HTTPException(status_code=404, detail="Property not found or not owned by you")
    
    try:
        # Delete associated images from filesystem
        for image in property.images:
            try:
                if os.path.exists(image.image_url):
                    os.remove(image.image_url)
            except Exception as e:
                logger.warning(f"Failed to delete image file: {e}")
        
        # Delete the property (cascade will handle related records)
        db.delete(property)
        db.commit()
        return {"message": "Property deleted successfully"}
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting property: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{property_id}/images/{image_id}")
def delete_property_image(
    property_id: int,
    image_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    property = db.query(Property).filter(
        Property.id == property_id,
        Property.owner_id == current_user.id
    ).first()
    if not property:
        raise HTTPException(status_code=404, detail="Property not found")
    
    image = db.query(PropertyImage).filter(
        PropertyImage.id == image_id,
        PropertyImage.property_id == property_id
    ).first()
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
    
    # Delete file from filesystem with path validation
    try:
        safe_path = secure_file_path("uploads", image.image_url)
        if os.path.exists(safe_path):
            os.remove(safe_path)
    except ValueError:
        logger.warning(f"Skipping invalid file path: {image.image_url}")
    
    db.delete(image)
    db.commit()
    return {"message": "Image deleted successfully"}

@router.post("/{property_id}/images")
async def upload_property_images(
    property_id: int,
    files: List[UploadFile] = File(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    from ...core.config import settings
    
    property = db.query(Property).filter(
        Property.id == property_id,
        Property.owner_id == current_user.id
    ).first()
    if not property:
        raise HTTPException(status_code=404, detail="Property not found or not owned by you")
    
    os.makedirs("uploads/properties", exist_ok=True)
    uploaded_images = []
    
    allowed_types = ["image/jpeg", "image/png", "image/jpg", "image/webp"]
    
    for file in files:
        # Validate file size
        if getattr(file, "size", 0) and file.size > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail=f"File {file.filename} too large")
        
        # Validate content type
        if file.content_type not in allowed_types:
            continue
        
        # Read file content for validation (read only first chunk to prevent memory exhaustion)
        content = await file.read(2048)
        await file.seek(0)  # Reset file pointer
        
        # We removed python-magic validation as libmagic might not be installed on all systems.
        # Fallback entirely to content-type header and extension.
        
        # Validate file extension
        if not file.filename:
            continue
        
        file_extension = file.filename.split(".")[-1].lower()
        # if file_extension not in settings.allowed_extensions_list:
        #     continue
            
        # Generate secure filename
        filename = f"{uuid4()}.{file_extension}"
        file_path = f"uploads/properties/{filename}"
        
        # Validate final path
        try:
            safe_path = secure_file_path("uploads", file_path)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid file path")
        
        with open(safe_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        db_image = PropertyImage(
            property_id=property_id,
            image_url=file_path,
            is_primary=len(uploaded_images) == 0
        )
        db.add(db_image)
        uploaded_images.append(filename)

    db.commit()
    return {"uploaded_files": uploaded_images}


# Maximum allowed video size (100 MB) and accepted formats (F22).
MAX_VIDEO_SIZE = 100 * 1024 * 1024
ALLOWED_VIDEO_TYPES = ["video/mp4", "video/quicktime"]  # mp4, mov
ALLOWED_VIDEO_EXTENSIONS = ["mp4", "mov"]


@router.post("/{property_id}/videos")
async def upload_property_videos(
    property_id: int,
    files: List[UploadFile] = File(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Upload property videos (MP4/MOV, max 100MB each)."""
    from ...models.property_video import PropertyVideo

    property = db.query(Property).filter(
        Property.id == property_id,
        Property.owner_id == current_user.id
    ).first()
    if not property:
        raise HTTPException(status_code=404, detail="Property not found or not owned by you")

    os.makedirs("uploads/videos", exist_ok=True)
    uploaded_videos = []

    for file in files:
        # Validate content type
        if file.content_type not in ALLOWED_VIDEO_TYPES:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid video format for {file.filename}. Only MP4 and MOV are allowed."
            )

        # Validate extension
        if not file.filename:
            continue
        file_extension = file.filename.split(".")[-1].lower()
        if file_extension not in ALLOWED_VIDEO_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid video extension for {file.filename}. Only .mp4 and .mov are allowed."
            )

        # Stream to disk while enforcing the size limit (avoids loading whole file in memory).
        filename = f"{uuid4()}.{file_extension}"
        file_path = f"uploads/videos/{filename}"
        try:
            safe_path = secure_file_path("uploads", file_path)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid file path")

        total = 0
        with open(safe_path, "wb") as buffer:
            while True:
                chunk = await file.read(1024 * 1024)  # 1MB chunks
                if not chunk:
                    break
                total += len(chunk)
                if total > MAX_VIDEO_SIZE:
                    buffer.close()
                    try:
                        os.remove(safe_path)
                    except OSError:
                        pass
                    raise HTTPException(
                        status_code=400,
                        detail=f"Video {file.filename} exceeds the 100MB size limit."
                    )
                buffer.write(chunk)

        db_video = PropertyVideo(property_id=property_id, video_url=file_path)
        db.add(db_video)
        uploaded_videos.append(filename)

    db.commit()
    return {"uploaded_files": uploaded_videos}