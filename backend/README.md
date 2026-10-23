# NoBroker Clone Backend

A FastAPI-based backend for a real estate platform similar to NoBroker.

## Features

- User authentication (JWT-based)
- Property listings (CRUD operations)
- Image upload for properties
- Property search and filtering
- Inquiry management
- User profiles

## Tech Stack

- **Framework**: FastAPI
- **Database**: MySQL
- **ORM**: SQLAlchemy
- **Authentication**: JWT
- **File Storage**: Local filesystem
- **Caching**: Redis (optional)

## Setup

### Using Docker Compose (Recommended)

1. Copy environment variables:
```bash
cp .env.example .env
```

2. Start services:
```bash
docker-compose up -d
```

3. Run migrations:
```bash
docker-compose exec api alembic upgrade head
```

### Manual Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set up MySQL database and update `.env`

3. Run migrations:
```bash
alembic upgrade head
```

4. Start the server:
```bash
python run.py
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user

### Properties
- `GET /api/v1/properties/` - Search properties
- `POST /api/v1/properties/` - Create property
- `GET /api/v1/properties/{id}` - Get property details
- `PUT /api/v1/properties/{id}` - Update property
- `POST /api/v1/properties/{id}/images` - Upload property images

### Users
- `GET /api/v1/users/me` - Get current user profile
- `PUT /api/v1/users/me` - Update current user
- `GET /api/v1/users/my-properties` - Get user's properties

### Inquiries
- `POST /api/v1/inquiries/` - Create inquiry
- `GET /api/v1/inquiries/my-inquiries` - Get user's inquiries
- `GET /api/v1/inquiries/property-inquiries` - Get inquiries for user's properties

## Database Schema

- **Users**: User accounts with authentication
- **Properties**: Property listings with details
- **PropertyImages**: Images associated with properties
- **Inquiries**: User inquiries about properties

## Development

Access API documentation at: http://localhost:8000/docs