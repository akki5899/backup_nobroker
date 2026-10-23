from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..core.database import Base
import enum

class PropertyType(enum.Enum):
    APARTMENT = "apartment"
    HOUSE = "house"
    VILLA = "villa"
    BUILDER_FLOOR = "builder_floor"
    STUDIO = "studio"
    FARMHOUSE = "farmhouse"
    SERVICED_APARTMENT = "serviced_apartment"
    PG = "pg"
    HOSTEL = "hostel"
    OFFICE = "office"
    RETAIL = "retail"
    WAREHOUSE = "warehouse"
    LAND = "land"
    PLOT = "plot"
    COMMERCIAL_LAND = "commercial_land"
    OTHER = "other"

class ListingType(enum.Enum):
    RENT = "rent"
    SALE = "sale"

class Property(Base):
    __tablename__ = "properties"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    property_type = Column(Enum(PropertyType), nullable=False)
    listing_type = Column(Enum(ListingType), nullable=False)
    price = Column(Float, nullable=False)
    deposit = Column(Float)
    area = Column(Float)
    bedrooms = Column(Integer)
    bathrooms = Column(Integer)
    floor = Column(Integer)
    total_floors = Column(Integer)
    age = Column(Integer)
    furnished = Column(Boolean, default=False)
    parking = Column(Boolean, default=False)
    balcony = Column(Boolean, default=False)
    gym = Column(Boolean, default=False)
    swimming_pool = Column(Boolean, default=False)

    # Common amenities (previously referenced by the frontend but missing as columns)
    lift = Column(Boolean, default=False)
    security = Column(Boolean, default=False)
    power_backup = Column(Boolean, default=False)
    club_house = Column(Boolean, default=False)
    garden = Column(Boolean, default=False)
    children_play_area = Column(Boolean, default=False)
    intercom = Column(Boolean, default=False)
    visitor_parking = Column(Boolean, default=False)

    # Extended amenities (F23) — for filtering + display
    mini_theatre = Column(Boolean, default=False)
    library_reading_room = Column(Boolean, default=False)
    community_hall = Column(Boolean, default=False)
    pet_park = Column(Boolean, default=False)
    ev_charging = Column(Boolean, default=False)
    rainwater_harvesting = Column(Boolean, default=False)
    solar_panels = Column(Boolean, default=False)
    maintenance_staff = Column(Boolean, default=False)
    cctv_surveillance = Column(Boolean, default=False)
    fire_safety = Column(Boolean, default=False)
    badminton_squash_court = Column(Boolean, default=False)
    sauna_steam_room = Column(Boolean, default=False)
    indoor_games_room = Column(Boolean, default=False)
    yoga_meditation_room = Column(Boolean, default=False)
    jogging_track = Column(Boolean, default=False)
    outdoor_fitness_area = Column(Boolean, default=False)

    # Connectivity — nearby infrastructure (homepage "Connectivity Matters" tiles).
    # Each flags that the named infrastructure is conveniently close to the property.
    near_metro = Column(Boolean, default=False)
    near_bus = Column(Boolean, default=False)
    near_highway = Column(Boolean, default=False)
    near_schools = Column(Boolean, default=False)
    near_hospitals = Column(Boolean, default=False)
    near_airport = Column(Boolean, default=False)
    near_it_hubs = Column(Boolean, default=False)
    near_malls = Column(Boolean, default=False)

    # Location
    address = Column(Text, nullable=False)
    city = Column(String(255), nullable=False, index=True)
    state = Column(String(255), nullable=False)
    pincode = Column(String(255), nullable=False)
    latitude = Column(Float)
    longitude = Column(Float)
    
    # Curated collection flags (homepage / listing "Quick Filters")
    is_luxury = Column(Boolean, default=False)
    gated_community = Column(Boolean, default=False)

    # Status
    is_active = Column(Boolean, default=True)
    is_featured = Column(Boolean, default=False)
    views = Column(Integer, default=0)

    # Admin moderation: every new listing starts as "pending" and is hidden from
    # public search (is_active=False) until an admin approves or rejects it.
    # Values: "pending" | "approved" | "rejected".
    moderation_status = Column(String(20), default="pending", nullable=False, index=True)
    
    # Relationships
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    owner = relationship("User", back_populates="properties")
    images = relationship("PropertyImage", back_populates="property", cascade="all, delete-orphan")
    videos = relationship("PropertyVideo", back_populates="property", cascade="all, delete-orphan")
    inquiries = relationship("Inquiry", back_populates="property", cascade="all, delete-orphan")