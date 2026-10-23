import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.core.database import get_db, Base
from app.models.user import User, UserType
from app.models.property import Property
from app.models.inquiry import Inquiry
from app.core.security import create_access_token, get_password_hash

# Test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="session")
def client():
    Base.metadata.create_all(bind=engine)
    with TestClient(app) as c:
        yield c
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def db_session():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

@pytest.fixture
def test_user(db_session):
    # Create proper bcrypt hash for 'password123'
    hashed_password = get_password_hash("password123")
    user = User(
        email="test@example.com",
        full_name="Test User",
        phone="1234567890",
        hashed_password=hashed_password,
        user_type=UserType.OWNER  # Use enum directly, OWNER can create properties
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user

@pytest.fixture
def test_tenant(db_session):
    # Create proper bcrypt hash for 'password123'
    hashed_password = get_password_hash("password123")
    user = User(
        email="tenant@example.com",
        full_name="Test Tenant",
        phone="9876543210",
        hashed_password=hashed_password,
        user_type=UserType.TENANT
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user

@pytest.fixture
def auth_headers(test_user):
    token = create_access_token(data={"sub": test_user.email})
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def test_property(db_session, test_user):
    property = Property(
        title="Test Property",
        description="Test Description",
        property_type="apartment",
        listing_type="rent",
        price=50000,
        bedrooms=2,
        bathrooms=2,
        area=1000,
        address="Test Address",
        city="Test City",
        state="Test State",
        pincode="123456",
        latitude=28.6139,
        longitude=77.2090,
        owner_id=test_user.id
    )
    db_session.add(property)
    db_session.commit()
    db_session.refresh(property)
    return property