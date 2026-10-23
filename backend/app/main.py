from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .api.v1 import auth, properties, users, inquiries, notifications, wishlist, contacts, rewards, referrals, timeline, visits, agreements, chatbot, admin, payments
from .api.v1 import chat as chat_api
from .core.database import engine
from .core.config import settings
from .core.schema_sync import sync_schema
from .models import user, property, property_image, property_video, inquiry, chat, lead, subscription, otp, notification, wishlist as wishlist_model, visits_agreements, chat_lead, payment, admin_audit_log
import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create tables
user.Base.metadata.create_all(bind=engine)
property.Base.metadata.create_all(bind=engine)
property_image.Base.metadata.create_all(bind=engine)
property_video.Base.metadata.create_all(bind=engine)
inquiry.Base.metadata.create_all(bind=engine)
chat.Base.metadata.create_all(bind=engine)
lead.Base.metadata.create_all(bind=engine)
subscription.Base.metadata.create_all(bind=engine)
otp.Base.metadata.create_all(bind=engine)
notification.Base.metadata.create_all(bind=engine)
wishlist_model.Base.metadata.create_all(bind=engine)
visits_agreements.Base.metadata.create_all(bind=engine)
payment.Base.metadata.create_all(bind=engine)
admin_audit_log.Base.metadata.create_all(bind=engine)

# Reconcile columns added to models after their tables were first created.
# create_all() never alters existing tables, so this backfills missing columns
# (e.g. amenity/connectivity flags) on long-lived databases like Render's.
sync_schema(engine)

app = FastAPI(
    title="PropDirect API", 
    version="1.0.0", 
    description="Direct property marketplace API"
)

# CORS middleware
# In development, allow all origins to avoid CORS issues
if settings.environment == "development":
    origins = ["*"]
else:
    origins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "https://nobroker-replica-raghu.onrender.com"
    ]
    # Add configured allowed origins
    if hasattr(settings, 'allowed_origins_list'):
        origins.extend(settings.allowed_origins_list)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files
# Ensure the upload directory exists
os.makedirs(settings.upload_dir, exist_ok=True)
# Mount the 'uploads' directory under the '/api/v1' prefix
app.mount("/api/v1/uploads", StaticFiles(directory=settings.upload_dir), name="uploads")


# Routes
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(properties.router, prefix="/api/v1/properties", tags=["properties"])
app.include_router(users.router, prefix="/api/v1/users", tags=["users"])
app.include_router(inquiries.router, prefix="/api/v1/inquiries", tags=["inquiries"])
app.include_router(notifications.router, prefix="/api/v1/notifications", tags=["notifications"])
app.include_router(wishlist.router, prefix="/api/v1/wishlist", tags=["wishlist"])
app.include_router(contacts.router, prefix="/api/v1/contacts", tags=["contacts"])
app.include_router(rewards.router, prefix="/api/v1/rewards", tags=["rewards"])
app.include_router(referrals.router, prefix="/api/v1/referrals", tags=["referrals"])
app.include_router(timeline.router, prefix="/api/v1/timeline", tags=["timeline"])
app.include_router(visits.router, prefix="/api/v1/visits", tags=["visits"])
app.include_router(agreements.router, prefix="/api/v1/agreements", tags=["agreements"])
app.include_router(chatbot.router, prefix="/api/v1/chatbot", tags=["chatbot"])
app.include_router(chat_api.router, prefix="/api/v1/chats", tags=["chat"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["admin"])
app.include_router(payments.router, prefix="/api/v1/payments", tags=["payments"])

@app.get("/")
def read_root():
    return {"message": "PropDirect API - Discover Your Perfect Space", "version": "1.0.0"}

@app.get("/health")
def health_check():
    return {"status": "healthy", "environment": settings.environment}