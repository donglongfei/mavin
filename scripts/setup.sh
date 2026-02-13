#!/bin/bash
set -e

echo "🔧 Setting up Mavin Development Environment"

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 22+"
    exit 1
fi

if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm not found. Please install pnpm 10+"
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Please install Docker"
    exit 1
fi

if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 not found. Please install Python 3.8+"
    exit 1
fi

echo "✅ All prerequisites found"

# Copy environment file
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "⚠️  Please review and update .env file with your configuration"
fi

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd apps/web
pnpm install
cd ../..

# Install Python dependencies
echo "🐍 Installing Python dependencies..."
cd services/api
pip3 install -r requirements.txt
cd ../..

cd services/agent-service
pip3 install -r requirements.txt
cd ../..

# Start Qdrant
echo "🐳 Starting Qdrant with Docker..."
cd infra
docker-compose up -d qdrant
cd ..

echo ""
echo "✅ Setup complete!"
echo ""
echo "To start development:"
echo "  ./scripts/dev.sh"
echo ""
