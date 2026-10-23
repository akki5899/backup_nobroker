"""
Seed ~55 realistic South-India property listings into the database.

WHY DIRECT DB (not the REST API): the app's login is OTP-only -- there is no
password->token endpoint to authenticate a scripted client against
POST /api/v1/properties. So this script talks to Postgres directly, but it does
so through the app's OWN SQLAlchemy models (Property, User, PropertyImage) and
the app's password hasher, so enum serialization, column defaults and the
owner's credentials match exactly what the running app expects.

USAGE
-----
    cd backend
    # Point at the external Render DB (overrides whatever is in .env):
    #   PowerShell:  $env:DATABASE_URL = "postgresql://...".
    #   bash:        export DATABASE_URL="postgresql://..."
    python seed_south_india.py

    # Optional flags:
    #   --count 60          how many listings to create (default 55)
    #   --wipe              delete listings previously created by this script
    #                       (matched by the seed owner) before inserting
    #   --database-url URL  pass the connection string directly instead of env

The seeded listings are all owned by a single "seed owner" account:
    email:    seed.owner@rightvillanest.com
    password: SeedOwner@123
    phone:    +91 90000 00000
You can log into the app UI as this owner (via OTP flow) to manage them, or just
browse them publicly.
"""

import argparse
import os
import random
import sys

# Allow `python seed_south_india.py` from the backend/ dir to import `app.*`.
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


def _apply_database_url(cli_url: str | None) -> None:
    """Make sure settings.database_url points at the target DB before we import
    the app's engine (which reads settings at import time)."""
    url = cli_url or os.environ.get("DATABASE_URL")
    if url:
        # Render sometimes hands out postgres:// -- SQLAlchemy wants postgresql://
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql://", 1)
        # Prefer the psycopg (v3) driver if psycopg2 isn't available, since the
        # bare postgresql:// dialect defaults to psycopg2.
        if url.startswith("postgresql://"):
            try:
                import psycopg2  # noqa: F401
            except ModuleNotFoundError:
                try:
                    import psycopg  # noqa: F401  (psycopg v3)
                    url = url.replace("postgresql://", "postgresql+psycopg://", 1)
                except ModuleNotFoundError:
                    pass
        os.environ["DATABASE_URL"] = url


def main() -> int:
    parser = argparse.ArgumentParser(description="Seed South-India property listings.")
    parser.add_argument("--count", type=int, default=55, help="number of listings (default 55)")
    parser.add_argument("--wipe", action="store_true", help="remove this script's previously seeded listings first")
    parser.add_argument("--database-url", default=None, help="DB connection string (else uses $DATABASE_URL or .env)")
    args = parser.parse_args()

    _apply_database_url(args.database_url)

    # Imported AFTER the env is set so the engine binds to the right DB.
    from app.core.database import SessionLocal, engine
    from app.core.config import settings
    from app.core.security import get_password_hash
    from app.models.user import User, UserType
    from app.models.property import Property, PropertyType, ListingType
    from app.models.property_image import PropertyImage

    # Import EVERY model the way app/main.py does, so SQLAlchemy can resolve all
    # relationship() targets (Property -> PropertyVideo, Inquiry, ...). Without
    # this the mapper fails to configure with "failed to locate a name".
    from app.models import (  # noqa: F401  (import side effects register mappers)
        user, property, property_image, property_video, inquiry, chat, lead,
        subscription, otp, notification, wishlist, visits_agreements,
        chat_lead, payment,
    )
    User.metadata.create_all(bind=engine)
    Property.metadata.create_all(bind=engine)
    PropertyImage.metadata.create_all(bind=engine)

    target = settings.database_url
    safe_target = target.split("@")[-1] if "@" in target else target
    print(f"-> Target DB: ...@{safe_target}")
    if target.startswith("sqlite"):
        print("  WARNING: this is a local SQLite DB, not the Render Postgres. "
              "Set DATABASE_URL if you meant the remote DB.")

    db = SessionLocal()
    try:
        # ── 1. Seed owner ────────────────────────────────────────────────
        SEED_EMAIL = "seed.owner@rightvillanest.com"
        owner = db.query(User).filter(User.email == SEED_EMAIL).first()
        if not owner:
            owner = User(
                email=SEED_EMAIL,
                phone="+919000000000",
                full_name="RightVillaNest Listings",
                user_type=UserType.OWNER,
                hashed_password=get_password_hash("SeedOwner@123"),
                is_active=True,
                is_verified=True,
                phone_verified=True,
                email_verified=True,
            )
            db.add(owner)
            db.commit()
            db.refresh(owner)
            print(f"-> Created seed owner (id={owner.id}, {SEED_EMAIL})")
        else:
            print(f"-> Reusing seed owner (id={owner.id})")

        # ── 2. Optional wipe of prior seed data ──────────────────────────
        if args.wipe:
            old = db.query(Property).filter(Property.owner_id == owner.id).all()
            for p in old:
                db.delete(p)  # cascade removes images/videos/inquiries
            db.commit()
            print(f"-> Wiped {len(old)} previously seeded listings")

        # ── 3. Build & insert listings ───────────────────────────────────
        listings = build_listings(
            args.count,
            PropertyType=PropertyType,
            ListingType=ListingType,
        )
        created = 0
        for spec in listings:
            image_urls = spec.pop("_images")
            prop = Property(owner_id=owner.id, is_active=True, **spec)
            db.add(prop)
            db.flush()  # get prop.id for images
            for i, url in enumerate(image_urls):
                db.add(PropertyImage(property_id=prop.id, image_url=url, is_primary=(i == 0)))
            created += 1
        db.commit()
        print(f"[OK] Inserted {created} South-India listings (owner_id={owner.id})")

        total = db.query(Property).count()
        print(f"  Total properties now in DB: {total}")
        return 0
    except Exception as exc:  # pragma: no cover
        db.rollback()
        print(f"[X] Seeding failed: {exc}")
        raise
    finally:
        db.close()


# ─────────────────────────────────────────────────────────────────────────────
# Data generation
# ─────────────────────────────────────────────────────────────────────────────

# Real South-India localities with approximate lat/lng so map view works.
# (city, state, [(locality, pincode, lat, lng), ...])
CITIES = [
    ("Bengaluru", "Karnataka", [
        ("Koramangala", "560034", 12.9352, 77.6245),
        ("Indiranagar", "560038", 12.9719, 77.6412),
        ("Whitefield", "560066", 12.9698, 77.7500),
        ("HSR Layout", "560102", 12.9116, 77.6389),
        ("Jayanagar", "560011", 12.9250, 77.5938),
        ("Electronic City", "560100", 12.8452, 77.6602),
        ("Marathahalli", "560037", 12.9591, 77.6974),
        ("Hebbal", "560024", 13.0358, 77.5970),
    ]),
    ("Hyderabad", "Telangana", [
        ("Gachibowli", "500032", 17.4401, 78.3489),
        ("Madhapur", "500081", 17.4486, 78.3908),
        ("Kondapur", "500084", 17.4615, 78.3640),
        ("Banjara Hills", "500034", 17.4156, 78.4347),
        ("Jubilee Hills", "500033", 17.4239, 78.4738),
        ("Kukatpally", "500072", 17.4948, 78.3996),
        ("Gowlidoddy", "500075", 17.4012, 78.3470),
    ]),
    ("Chennai", "Tamil Nadu", [
        ("Adyar", "600020", 13.0012, 80.2565),
        ("Velachery", "600042", 12.9755, 80.2207),
        ("OMR Thoraipakkam", "600097", 12.9404, 80.2337),
        ("Anna Nagar", "600040", 13.0850, 80.2101),
        ("T. Nagar", "600017", 13.0418, 80.2341),
        ("Porur", "600116", 13.0382, 80.1565),
    ]),
    ("Kochi", "Kerala", [
        ("Kakkanad", "682030", 10.0159, 76.3419),
        ("Edappally", "682024", 10.0250, 76.3080),
        ("Marine Drive", "682031", 9.9816, 76.2772),
        ("Vyttila", "682019", 9.9669, 76.3185),
    ]),
    ("Coimbatore", "Tamil Nadu", [
        ("RS Puram", "641002", 11.0069, 76.9498),
        ("Saibaba Colony", "641011", 11.0299, 76.9460),
        ("Peelamedu", "641004", 11.0235, 77.0027),
    ]),
    ("Mysuru", "Karnataka", [
        ("Vijayanagar", "570017", 12.3094, 76.6160),
        ("Gokulam", "570002", 12.3210, 76.6390),
    ]),
    ("Visakhapatnam", "Andhra Pradesh", [
        ("MVP Colony", "530017", 17.7400, 83.3340),
        ("Madhurawada", "530048", 17.8200, 83.3600),
    ]),
    ("Thiruvananthapuram", "Kerala", [
        ("Technopark Kazhakkoottam", "695582", 8.5570, 76.8810),
        ("Pattom", "695004", 8.5160, 76.9460),
    ]),
    ("Mangaluru", "Karnataka", [
        ("Kadri", "575002", 12.8920, 74.8560),
    ]),
    ("Vijayawada", "Andhra Pradesh", [
        ("Benz Circle", "520010", 16.4970, 80.6560),
    ]),
]

# Unsplash photo IDs verified to exist (real-estate / interiors).
IMAGE_IDS = [
    "photo-1568605114967-8130f3a36994",  # modern house exterior
    "photo-1570129477492-45c003edd2be",  # suburban home
    "photo-1512917774080-9991f1c4c750",  # white modern house
    "photo-1600596542815-ffad4c1539a9",  # contemporary home
    "photo-1600585154340-be6161a56a0c",  # bright living room
    "photo-1600607687939-ce8a6c25118c",  # living room interior
    "photo-1600566753086-00f18fb6b3ea",  # bedroom
    "photo-1600210492486-724fe5c67fb0",  # apartment building
    "photo-1605276374104-dee2a0ed3cd6",  # luxury villa
    "photo-1564013799919-ab600027ffc6",  # house with pool
    "photo-1493809842364-78817add7ffb",  # cozy interior
    "photo-1502672260266-1c1ef2d93688",  # minimal apartment
    "photo-1522708323590-d24dbb6b0267",  # modern kitchen-living
    "photo-1560448204-e02f11c3d0e2",     # apartment interior
    "photo-1502005229762-cf1b2da7c5d6",  # studio apartment
]


def _img(idx: int) -> str:
    return (
        f"https://images.unsplash.com/{IMAGE_IDS[idx % len(IMAGE_IDS)]}"
        "?auto=format&fit=crop&w=1200&q=70"
    )


RENT_TITLES = [
    "{bhk} BHK {ptype} for rent in {loc}",
    "Spacious {bhk} BHK {ptype} in {loc}, {city}",
    "Well-maintained {bhk} BHK {ptype} near {loc}",
    "Semi-furnished {bhk} BHK {ptype} in {loc}",
]
SALE_TITLES = [
    "{bhk} BHK {ptype} for sale in {loc}",
    "Premium {bhk} BHK {ptype} in {loc}, {city}",
    "Ready-to-move {bhk} BHK {ptype} at {loc}",
    "{bhk} BHK {ptype} with modern amenities in {loc}",
]

DESCRIPTIONS = [
    "A thoughtfully designed home in one of {city}'s most sought-after neighbourhoods. "
    "Close to {loc}'s tech parks, schools and shopping, with excellent connectivity.",
    "Bright, airy and well-ventilated {ptype} in {loc}. Vastu-compliant layout, premium "
    "fittings, and a vibrant gated community with round-the-clock security.",
    "Located in the heart of {loc}, {city} -- walking distance to metro/bus, hospitals "
    "and malls. Ideal for families and working professionals alike.",
    "Modern {ptype} offering the perfect blend of comfort and convenience in {loc}. "
    "Spacious rooms, abundant natural light and quality construction throughout.",
]

# amenity column groups
BASIC_AMENITIES = [
    "lift", "security", "power_backup", "parking", "balcony",
    "intercom", "cctv_surveillance", "fire_safety", "visitor_parking",
]
PREMIUM_AMENITIES = [
    "gym", "swimming_pool", "club_house", "garden", "children_play_area",
    "ev_charging", "rainwater_harvesting", "solar_panels", "maintenance_staff",
    "indoor_games_room", "jogging_track", "yoga_meditation_room",
]
CONNECTIVITY = [
    "near_metro", "near_bus", "near_highway", "near_schools",
    "near_hospitals", "near_airport", "near_it_hubs", "near_malls",
]

PTYPE_LABELS = {
    "APARTMENT": "Apartment",
    "VILLA": "Villa",
    "HOUSE": "Independent House",
    "BUILDER_FLOOR": "Builder Floor",
    "STUDIO": "Studio",
}


def build_listings(count, *, PropertyType, ListingType):
    """Return a list of dicts ready to splat into Property(**spec).
    Each carries a private `_images` list consumed by the caller."""
    rng = random.Random(2026)  # deterministic output across runs
    residential = ["APARTMENT", "VILLA", "HOUSE", "BUILDER_FLOOR", "STUDIO"]
    listings = []

    for n in range(count):
        city, state, localities = rng.choice(CITIES)
        loc, pincode, lat, lng = rng.choice(localities)
        # jitter coordinates a little so markers don't stack
        lat += rng.uniform(-0.012, 0.012)
        lng += rng.uniform(-0.012, 0.012)

        ptype_key = rng.choice(residential)
        ptype_label = PTYPE_LABELS[ptype_key]
        listing = "RENT" if rng.random() < 0.55 else "SALE"

        if ptype_key == "STUDIO":
            bedrooms = 1
        else:
            bedrooms = rng.choice([1, 2, 2, 3, 3, 4])
        bathrooms = max(1, bedrooms - rng.choice([0, 0, 1]))
        area = {1: (450, 750), 2: (850, 1250), 3: (1250, 1900), 4: (1900, 3200)}[bedrooms]
        area_val = float(rng.randint(*area))

        # Pricing tuned to be realistic for South-India metros.
        if listing == "RENT":
            base = {1: 14000, 2: 24000, 3: 38000, 4: 60000}[bedrooms]
            price = float(int(base * rng.uniform(0.8, 1.6) / 500) * 500)
            deposit = float(int(price * rng.choice([2, 3, 6]) / 1000) * 1000)
        else:
            per_sqft = rng.randint(5500, 12000)
            price = float(int(area_val * per_sqft / 50000) * 50000)
            deposit = None

        is_luxury = listing == "SALE" and price > 18000000 or bedrooms >= 4 and rng.random() < 0.5
        gated = rng.random() < 0.6

        title_tpl = rng.choice(RENT_TITLES if listing == "RENT" else SALE_TITLES)
        title = title_tpl.format(bhk=bedrooms, ptype=ptype_label, loc=loc, city=city)
        desc = rng.choice(DESCRIPTIONS).format(city=city, loc=loc, ptype=ptype_label.lower())

        # amenity flags
        flags = {}
        for a in rng.sample(BASIC_AMENITIES, k=rng.randint(4, len(BASIC_AMENITIES))):
            flags[a] = True
        for a in rng.sample(PREMIUM_AMENITIES, k=rng.randint(2, 7)):
            flags[a] = True
        for c in rng.sample(CONNECTIVITY, k=rng.randint(3, 6)):
            flags[c] = True

        total_floors = rng.choice([3, 5, 8, 12, 15, 20])
        floor = rng.randint(0, total_floors)

        n_imgs = rng.randint(2, 4)
        start = rng.randint(0, len(IMAGE_IDS) - 1)
        images = [_img(start + i) for i in range(n_imgs)]

        spec = {
            "title": title,
            "description": desc,
            "property_type": PropertyType[ptype_key],
            "listing_type": ListingType[listing],
            "price": price,
            "deposit": deposit,
            "area": area_val,
            "bedrooms": bedrooms,
            "bathrooms": bathrooms,
            "floor": floor,
            "total_floors": total_floors,
            "age": rng.choice([0, 1, 1, 2, 3, 5, 8, 10]),
            "furnished": rng.random() < 0.45,
            "is_luxury": bool(is_luxury),
            "gated_community": bool(gated),
            "is_featured": rng.random() < 0.2,
            "views": rng.randint(0, 850),
            "address": f"{loc}, {city}",
            "city": city,
            "state": state,
            "pincode": pincode,
            "latitude": round(lat, 6),
            "longitude": round(lng, 6),
            "_images": images,
            **flags,
        }
        listings.append(spec)

    return listings


if __name__ == "__main__":
    raise SystemExit(main())
