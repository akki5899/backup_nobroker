#!/bin/bash

echo "🚀 Setting up NoBroker Backend..."

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Copy environment file
if [ ! -f .env ]; then
    cp .env.example .env
    echo "📝 Created .env file - please configure your database settings"
fi

# Create uploads directory
mkdir -p uploads/properties

echo "✅ Backend setup complete!"
echo ""
echo "Next steps:"
echo "1. Configure your .env file with database settings"
echo "2. Start MySQL database"
echo "3. Run migrations: alembic upgrade head"
echo "4. Start server: python run.py"
echo ""
echo "Or use Docker Compose:"
echo "docker-compose up -d"