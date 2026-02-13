#!/bin/bash
set -e

echo "🚀 Starting Mavin Development Environment"

# Start Qdrant if not running
if ! curl -s http://localhost:6333/health > /dev/null 2>&1; then
  echo "📊 Starting Qdrant..."
  cd infra && docker-compose up -d qdrant && cd ..
  echo "⏳ Waiting for Qdrant to be ready..."
  sleep 3
else
  echo "✅ Qdrant already running"
fi

# Create logs directory
mkdir -p logs

# Start agent service
echo "🤖 Starting Agent Service..."
cd services/agent-service
uvicorn main:app --port 8001 --reload > ../../logs/agent.log 2>&1 &
AGENT_PID=$!
cd ../..

# Start backend API
echo "🔧 Starting Backend API..."
cd services/api
uvicorn app.main:app --port 8000 --reload > ../../logs/api.log 2>&1 &
API_PID=$!
cd ../..

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 3

# Start frontend
echo "🎨 Starting Frontend..."
cd apps/web
pnpm dev > ../../logs/web.log 2>&1 &
WEB_PID=$!
cd ../..

echo ""
echo "✅ All services started!"
echo ""
echo "📊 Services:"
echo "  - Frontend:      http://localhost:3000"
echo "  - Backend API:   http://localhost:8000"
echo "  - API Docs:      http://localhost:8000/docs"
echo "  - Agent Service: http://localhost:8001"
echo "  - Qdrant:        http://localhost:6333/dashboard"
echo ""
echo "📝 Logs:"
echo "  - tail -f logs/web.log"
echo "  - tail -f logs/api.log"
echo "  - tail -f logs/agent.log"
echo ""
echo "Press Ctrl+C to stop all services"

trap "echo ''; echo '🛑 Stopping services...'; kill $WEB_PID $API_PID $AGENT_PID 2>/dev/null; exit" INT

wait
