#!/bin/bash
# Mavin Services Shutdown Script
# Stops: ASR (Docker), TTS, Backend Webserver, Frontend
# Kills all processes on service ports

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_DIR="$SCRIPT_DIR/.pids"

# Port numbers
FRONTEND_PORTS="3000 3001 3002 3003"
BACKEND_PORT="8002"
ASR_PORT="10095"
TTS_PORTS="5001 5002"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[i]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[!]${NC} $1"
}

# Function to kill processes on a specific port
kill_port() {
    local port=$1
    local pids=$(lsof -ti :$port 2>/dev/null || true)

    if [ -n "$pids" ]; then
        echo "$pids" | xargs kill -9 2>/dev/null || true
        print_status "Killed processes on port $port"
    fi
}

echo "======================================"
echo "  Mavin Services Shutdown"
echo "======================================"
echo ""

# 1. Stop Frontend Web Application
print_info "Stopping Frontend Web Application..."

if [ -f "$PID_DIR/frontend.pid" ]; then
    FRONTEND_PID=$(cat "$PID_DIR/frontend.pid")
    if ps -p $FRONTEND_PID > /dev/null 2>&1; then
        kill $FRONTEND_PID 2>/dev/null || true
        sleep 2

        # Force kill if still running
        if ps -p $FRONTEND_PID > /dev/null 2>&1; then
            kill -9 $FRONTEND_PID 2>/dev/null || true
        fi

        print_status "Frontend stopped (PID: $FRONTEND_PID)"
    else
        print_warn "Frontend not running (stale PID)"
    fi
    rm -f "$PID_DIR/frontend.pid"
else
    print_warn "Frontend PID file not found"

    # Try to find and kill by process name
    FRONTEND_PIDS=$(pgrep -f "vite.*--host" || true)
    if [ -n "$FRONTEND_PIDS" ]; then
        echo "$FRONTEND_PIDS" | xargs kill 2>/dev/null || true
        print_status "Frontend processes stopped"
    fi
fi

# Kill all processes on frontend ports
for port in $FRONTEND_PORTS; do
    kill_port $port
done

# 2. Stop Backend Webserver
print_info "Stopping Backend Webserver..."

if [ -f "$PID_DIR/backend.pid" ]; then
    BACKEND_PID=$(cat "$PID_DIR/backend.pid")
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        kill $BACKEND_PID 2>/dev/null || true
        sleep 2

        # Force kill if still running
        if ps -p $BACKEND_PID > /dev/null 2>&1; then
            kill -9 $BACKEND_PID 2>/dev/null || true
        fi

        print_status "Backend webserver stopped (PID: $BACKEND_PID)"
    else
        print_warn "Backend webserver not running (stale PID)"
    fi
    rm -f "$PID_DIR/backend.pid"
else
    print_warn "Backend webserver PID file not found"

    # Try to find and kill by process name
    BACKEND_PIDS=$(pgrep -f "tsx watch src/index.ts" || true)
    if [ -n "$BACKEND_PIDS" ]; then
        echo "$BACKEND_PIDS" | xargs kill 2>/dev/null || true
        print_status "Backend webserver processes stopped"
    fi
fi

# Kill all processes on backend port
kill_port $BACKEND_PORT

# 3. Stop TTS Service
print_info "Stopping TTS Service..."

if [ -f "$PID_DIR/tts.pid" ]; then
    TTS_PID=$(cat "$PID_DIR/tts.pid")
    if ps -p $TTS_PID > /dev/null 2>&1; then
        kill $TTS_PID 2>/dev/null || true
        sleep 1

        # Force kill if still running
        if ps -p $TTS_PID > /dev/null 2>&1; then
            kill -9 $TTS_PID 2>/dev/null || true
        fi

        print_status "TTS service stopped (PID: $TTS_PID)"
    else
        print_warn "TTS service not running (stale PID)"
    fi
    rm -f "$PID_DIR/tts.pid"
else
    print_warn "TTS service PID file not found"

    # Try to find and kill by process name
    TTS_PIDS=$(pgrep -f "mt_litetts_ws_server.py" || true)
    if [ -n "$TTS_PIDS" ]; then
        echo "$TTS_PIDS" | xargs kill 2>/dev/null || true
        print_status "TTS service processes stopped"
    fi
fi

# Kill all processes on TTS ports
for port in $TTS_PORTS; do
    kill_port $port
done

# 4. Stop ASR Docker Container
print_info "Stopping ASR Docker Container..."

if docker ps | grep -q "local_asr_server"; then
    docker stop local_asr_server
    print_status "ASR container stopped"
else
    print_warn "ASR container not running"
fi

echo ""
echo "======================================"
echo "  All Services Stopped!"
echo "======================================"
echo ""
echo "Ports Cleaned:"
echo "  Frontend: $FRONTEND_PORTS"
echo "  Backend:  $BACKEND_PORT"
echo "  TTS:      $TTS_PORTS"
echo "  ASR:      $ASR_PORT (Docker)"
echo ""
echo "Notes:"
echo "  - All processes on service ports killed"
echo "  - ASR container is stopped but not removed"
echo "  - To remove container: docker rm local_asr_server"
echo "  - To restart: ./start-services.sh"
echo "======================================"
