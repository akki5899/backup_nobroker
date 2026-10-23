#!/bin/bash

echo "🏠 Setting up NoBroker Clone - Complete Real Estate Platform"
echo "============================================================"

# Check if Docker is installed
if command -v docker &> /dev/null; then
    echo "✅ Docker found"
    DOCKER_AVAILABLE=true
else
    echo "❌ Docker not found - will use manual setup"
    DOCKER_AVAILABLE=false
fi

# Check if Node.js is installed
if command -v node &> /dev/null; then
    echo "✅ Node.js found ($(node --version))"
    NODE_AVAILABLE=true
else
    echo "❌ Node.js not found - please install Node.js 18+"
    NODE_AVAILABLE=false
fi

# Check if Python is installed
if command -v python3 &> /dev/null; then
    echo "✅ Python found ($(python3 --version))"
    PYTHON_AVAILABLE=true
else
    echo "❌ Python not found - please install Python 3.11+"
    PYTHON_AVAILABLE=false
fi

echo ""
echo "🚀 Setup Options:"
echo "1. Docker Setup (Recommended)"
echo "2. Manual Setup"
echo ""

read -p "Choose setup option (1 or 2): " SETUP_OPTION

if [ "$SETUP_OPTION" = "1" ] && [ "$DOCKER_AVAILABLE" = true ]; then
    echo ""
    echo "🐳 Setting up with Docker..."
    
    # Backend setup
    echo "📦 Setting up backend..."
    cd backend
    
    if [ ! -f .env ]; then
        cp .env.example .env
        echo "📝 Created backend .env file - please configure database settings"
    fi
    
    echo "🚀 Starting backend services with Docker..."
    docker-compose up -d
    
    echo "⏳ Waiting for database to be ready..."
    sleep 10
    
    echo "🔄 Running database migrations..."
    docker-compose exec api alembic upgrade head
    
    cd ..
    
    # Frontend setup
    if [ "$NODE_AVAILABLE" = true ]; then
        echo "📦 Setting up frontend..."
        cd frontend
        
        if [ ! -f .env.local ]; then
            cp .env.local.example .env.local
            echo "📝 Created frontend .env.local file"
        fi
        
        echo "📥 Installing frontend dependencies..."
        npm install
        
        echo "🚀 Starting frontend development server..."
        npm run dev &
        
        cd ..
    fi
    
elif [ "$SETUP_OPTION" = "2" ]; then
    echo ""
    echo "🔧 Manual Setup..."
    
    # Backend setup
    if [ "$PYTHON_AVAILABLE" = true ]; then
        echo "📦 Setting up backend..."
        cd backend
        
        echo "🐍 Creating Python virtual environment..."
        python3 -m venv venv
        source venv/bin/activate
        
        echo "📥 Installing Python dependencies..."
        pip install --upgrade pip
        pip install -r requirements.txt
        
        if [ ! -f .env ]; then
            cp .env.example .env
            echo "📝 Created backend .env file - please configure database settings"
        fi
        
        mkdir -p uploads/properties
        
        echo "⚠️  Please configure your PostgreSQL database and update .env file"
        echo "⚠️  Then run: alembic upgrade head"
        echo "⚠️  Then run: python run.py"
        
        cd ..
    fi
    
    # Frontend setup
    if [ "$NODE_AVAILABLE" = true ]; then
        echo "📦 Setting up frontend..."
        cd frontend
        
        if [ ! -f .env.local ]; then
            cp .env.local.example .env.local
            echo "📝 Created frontend .env.local file"
        fi
        
        echo "📥 Installing frontend dependencies..."
        npm install
        
        echo "🚀 Frontend ready! Run 'npm run dev' to start"
        
        cd ..
    fi
    
else
    echo "❌ Invalid option or missing dependencies"
    exit 1
fi

echo ""
echo "🎉 Setup Complete!"
echo "=================="
echo ""
echo "📍 Access Points:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:8000"
echo "   API Docs: http://localhost:8000/docs"
echo ""
echo "📚 Next Steps:"
echo "   1. Configure database settings in backend/.env"
echo "   2. Run database migrations if not using Docker"
echo "   3. Start both frontend and backend servers"
echo "   4. Visit http://localhost:3000 to see your NoBroker clone!"
echo ""
echo "🆘 Need help? Check the README.md files in backend/ and frontend/ directories"