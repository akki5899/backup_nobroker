from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from ..models.property import PropertyType, ListingType

class PropertyImageResponse(BaseModel):
    id: int
    image_url: str
    is_primary: bool

    class Config:
        from_attributes = True

class PropertyVideoResponse(BaseModel):
    id: int
    video_url: str

    class Config:
        from_attributes = True

class PropertyBase(BaseModel):
    title: Optional[str] = None  # Make title optional with auto-generation fallback
    description: Optional[str] = None
    property_type: PropertyType
    listing_type: ListingType
    price: float
    deposit: Optional[float] = None
    area: Optional[float] = None
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    floor: Optional[int] = None
    total_floors: Optional[int] = None
    age: Optional[int] = None
    furnished: bool = False
    parking: bool = False
    balcony: bool = False
    gym: bool = False
    swimming_pool: bool = False
    # Common amenities
    lift: bool = False
    security: bool = False
    power_backup: bool = False
    club_house: bool = False
    garden: bool = False
    children_play_area: bool = False
    intercom: bool = False
    visitor_parking: bool = False
    # Extended amenities (F23)
    mini_theatre: bool = False
    library_reading_room: bool = False
    community_hall: bool = False
    pet_park: bool = False
    ev_charging: bool = False
    rainwater_harvesting: bool = False
    solar_panels: bool = False
    maintenance_staff: bool = False
    cctv_surveillance: bool = False
    fire_safety: bool = False
    badminton_squash_court: bool = False
    sauna_steam_room: bool = False
    indoor_games_room: bool = False
    yoga_meditation_room: bool = False
    jogging_track: bool = False
    outdoor_fitness_area: bool = False
    # Connectivity — nearby infrastructure
    near_metro: bool = False
    near_bus: bool = False
    near_highway: bool = False
    near_schools: bool = False
    near_hospitals: bool = False
    near_airport: bool = False
    near_it_hubs: bool = False
    near_malls: bool = False
    # Curated collection flags (listing "Quick Filters")
    is_luxury: bool = False
    gated_community: bool = False
    address: str
    city: str
    state: str
    pincode: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class PropertyCreate(PropertyBase):
    pass

class PropertyUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    deposit: Optional[float] = None
    is_active: Optional[bool] = None

class PropertyResponse(PropertyBase):
    id: int
    is_active: bool
    is_featured: bool
    moderation_status: Optional[str] = None  # "pending" | "approved" | "rejected"
    views: int
    owner_id: int
    created_at: datetime
    images: List[PropertyImageResponse] = []
    videos: List[PropertyVideoResponse] = []

    class Config:
        from_attributes = True

class PropertySearch(BaseModel):
    city: Optional[str] = None
    property_type: Optional[PropertyType] = None
    listing_type: Optional[ListingType] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    bedrooms: Optional[int] = None
    furnished: Optional[bool] = None
    page: int = 1
    limit: int = 20