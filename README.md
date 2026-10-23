# NoBroker Clone - Complete Real Estate Platform

A full-stack real estate platform similar to NoBroker with zero brokerage property listings.

## 🚀 Features

### Core Functionality
- **Zero Brokerage**: Direct owner-tenant/buyer connections
- **Property Management**: Complete CRUD operations for properties
- **Advanced Search**: Multi-filter property search and discovery
- **User Authentication**: JWT-based secure authentication
- **Image Management**: Property image upload and gallery
- **Inquiry System**: Direct communication between users and owners
- **Responsive Design**: Mobile-first, fully responsive interface

### User Types
- **Property Owners**: List and manage properties
- **Tenants**: Search for rental properties
- **Buyers**: Search for properties to purchase

## 🛠 Tech Stack

### Backend
- **Framework**: FastAPI (Python)
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Authentication**: JWT tokens
- **File Storage**: Local filesystem (cloud-ready)
- **API Documentation**: Auto-generated with Swagger/OpenAPI

### Frontend
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Hooks
- **HTTP Client**: Axios

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Database Migrations**: Alembic
- **Development**: Hot reload for both frontend and backend

## 📁 Project Structure

```
nobroker/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── api/v1/         # API endpoints
│   │   ├── core/           # Configuration & database
│   │   ├── models/         # SQLAlchemy models
│   │   ├── schemas/        # Pydantic schemas
│   │   ├── services/       # Business logic
│   │   └── utils/          # Utilities
│   ├── alembic/            # Database migrations
│   ├── requirements.txt    # Python dependencies
│   └── docker-compose.yml  # Development services
│
└── frontend/               # Next.js frontend
    ├── src/
    │   ├── app/           # Next.js pages (App Router)
    │   ├── components/    # Reusable components
    │   ├── hooks/         # Custom React hooks
    │   ├── lib/           # API client & utilities
    │   └── types/         # TypeScript definitions
    └── package.json       # Node.js dependencies
```

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 15+
- Docker (optional)

### Option 1: Docker Setup (Recommended)

1. **Clone and setup backend**:
```bash
cd backend
cp .env.example .env
# Edit .env with your settings
docker-compose up -d
```

2. **Setup frontend**:
```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

### Option 2: Manual Setup

1. **Backend Setup**:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\\Scripts\\activate
pip install -r requirements.txt
cp .env.example .env
# Configure your .env file
alembic upgrade head
python run.py
```

2. **Frontend Setup**:
```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

## 🌐 Access Points

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Database**: localhost:5432 (if using Docker)

## 📊 Database Schema

### Core Models
- **Users**: Authentication and user profiles
- **Properties**: Property listings with full details
- **PropertyImages**: Image management for properties
- **Inquiries**: Communication between users and owners

### Key Relationships
- User → Properties (One-to-Many)
- Property → PropertyImages (One-to-Many)
- User → Inquiries (One-to-Many)
- Property → Inquiries (One-to-Many)

## 🔧 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login

### Properties
- `GET /api/v1/properties/` - Search properties
- `POST /api/v1/properties/` - Create property
- `GET /api/v1/properties/{id}` - Get property details
- `PUT /api/v1/properties/{id}` - Update property
- `POST /api/v1/properties/{id}/images` - Upload images

### Users
- `GET /api/v1/users/me` - Get user profile
- `PUT /api/v1/users/me` - Update profile
- `GET /api/v1/users/my-properties` - Get user's properties

### Inquiries
- `POST /api/v1/inquiries/` - Create inquiry
- `GET /api/v1/inquiries/my-inquiries` - Get user inquiries
- `GET /api/v1/inquiries/property-inquiries` - Get property inquiries

## 🎨 Frontend Pages

- **Homepage**: Hero section with search and featured properties
- **Properties**: Advanced search and property listings
- **Property Details**: Detailed view with image gallery and inquiry form
- **Authentication**: Login and registration pages
- **Dashboard**: User dashboard with properties and inquiries
- **Post Property**: Property creation form with image upload

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- CORS configuration
- Input validation with Pydantic
- SQL injection prevention with SQLAlchemy
- File upload validation

## 🚀 Production Deployment

### Backend
- Use environment variables for configuration
- Set up proper database with connection pooling
- Configure file storage (AWS S3, etc.)
- Set up monitoring and logging
- Use HTTPS with proper SSL certificates

### Frontend
- Build optimized production bundle
- Configure CDN for static assets
- Set up proper environment variables
- Enable caching strategies

## 📈 Scalability Considerations

- **Database**: Implement read replicas and indexing
- **Caching**: Add Redis for session and data caching
- **File Storage**: Move to cloud storage (AWS S3, etc.)
- **Search**: Implement Elasticsearch for advanced search
- **API**: Add rate limiting and API versioning
- **Monitoring**: Add application monitoring and logging

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Check the API documentation at `/docs`
- Review the README files in backend and frontend directories
- Create an issue for bugs or feature requests

---
