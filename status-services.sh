#!/bin/bash
# Mavin Services Status Checker

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_DIR="$SCRIPT_DIR/.pids"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_header() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  Mavin Services Status${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

print_service_status() {
    local name=$1
    local status=$2
    local info=$3

    if [ "$status" = "running" ]; then
        echo -e "  ${GREEN}●${NC} $name: ${GREEN}Running${NC} $info"
    elif [ "$status" = "stopped" ]; then
        echo -e "  ${RED}●${NC} $name: ${RED}Stopped${NC} $info"
    elif [ "$status" = "warning" ]; then
        echo -e "  ${YELLOW}●${NC} $name: ${YELLOW}Warning${NC} $info"
    else
        echo -e "  ${YELLOW}●${NC} $name: ${YELLOW}Unknown${NC} $info"
    fi
}

check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

print_header

# 1. Check ASR Docker Container
echo -e "${BLUE}ASR Service (Docker)${NC}"
if docker ps | grep -q "local_asr_server"; then
    # Check if FunASR service is listening on port
    if check_port 10095; then
        print_service_status "Container" "running" "(port 10095 active)"
    else
        print_service_status "Container" "warning" "(container running, but service not ready)"
    fi
else
    if docker ps -a | grep -q "local_asr_server"; then
        print_service_status "Container" "stopped" ""
    else
        print_service_status "Container" "stopped" "(container does not exist)"
    fi
fi

# 2. Check TTS Service
echo ""
echo -e "${BLUE}TTS Service (Python)${NC}"
if [ -f "$PID_DIR/tts.pid" ]; then
    TTS_PID=$(cat "$PID_DIR/tts.pid")
    if ps -p $TTS_PID > /dev/null 2>&1; then
        print_service_status "MT-LiteTTS" "running" "(PID: $TTS_PID)"
    else
        print_service_status "MT-LiteTTS" "stopped" "(stale PID file)"
    fi
else
    # Try to find by process name
    TTS_PIDS=$(pgrep -f "mt_litetts_ws_server.py" || true)
    if [ -n "$TTS_PIDS" ]; then
        print_service_status "MT-LiteTTS" "running" "(PID: $TTS_PIDS, no PID file)"
    else
        print_service_status "MT-LiteTTS" "stopped" ""
    fi
fi

# 3. Check OpenClaw
echo ""
echo -e "${BLUE}OpenClaw (CLI Tool)${NC}"
if command -v openclaw &> /dev/null; then
    VERSION=$(openclaw --version 2>&1 | head -1 || echo "unknown")
    print_service_status "OpenClaw CLI" "running" "($VERSION)"
else
    print_service_status "OpenClaw CLI" "warning" "(not found in PATH)"
fi

# 4. Check Backend Webserver
echo ""
echo -e "${BLUE}Backend Webserver (Node.js)${NC}"
if [ -f "$PID_DIR/backend.pid" ]; then
    BACKEND_PID=$(cat "$PID_DIR/backend.pid")
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        if check_port 8002; then
            # Try to get health status
            HEALTH=$(curl -s http://localhost:8002/health 2>/dev/null || echo "")
            if [ -n "$HEALTH" ]; then
                print_service_status "Express API" "running" "(PID: $BACKEND_PID, port 8002, healthy)"
            else
                print_service_status "Express API" "warning" "(PID: $BACKEND_PID, port 8002, not responding)"
            fi
        else
            print_service_status "Express API" "warning" "(PID: $BACKEND_PID, but port 8002 not listening)"
        fi
    else
        print_service_status "Express API" "stopped" "(stale PID file)"
    fi
else
    # Try to find by process name
    BACKEND_PIDS=$(pgrep -f "tsx watch src/index.ts" || true)
    if [ -n "$BACKEND_PIDS" ]; then
        print_service_status "Express API" "running" "(PID: $BACKEND_PIDS, no PID file)"
    else
        if check_port 8002; then
            print_service_status "Express API" "warning" "(port 8002 in use, but process not found)"
        else
            print_service_status "Express API" "stopped" ""
        fi
    fi
fi

# 5. Check Frontend Web Application
echo ""
echo -e "${BLUE}Frontend Web (React + Vite)${NC}"
if [ -f "$PID_DIR/frontend.pid" ]; then
    FRONTEND_PID=$(cat "$PID_DIR/frontend.pid")
    if ps -p $FRONTEND_PID > /dev/null 2>&1; then
        if check_port 3000; then
            print_service_status "Vite Dev Server" "running" "(PID: $FRONTEND_PID, port 3000)"
        else
            print_service_status "Vite Dev Server" "warning" "(PID: $FRONTEND_PID, but port 3000 not listening)"
        fi
    else
        print_service_status "Vite Dev Server" "stopped" "(stale PID file)"
    fi
else
    # Try to find by process name
    FRONTEND_PIDS=$(pgrep -f "vite.*--host" || true)
    if [ -n "$FRONTEND_PIDS" ]; then
        print_service_status "Vite Dev Server" "running" "(PID: $FRONTEND_PIDS, no PID file)"
    else
        if check_port 3000; then
            print_service_status "Vite Dev Server" "warning" "(port 3000 in use, but process not found)"
        else
            print_service_status "Vite Dev Server" "stopped" ""
        fi
    fi
fi

# Print summary
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Quick Actions:"
echo "  Start all:  ./start-services.sh"
echo "  Stop all:   ./stop-services.sh"
echo "  Run tests:  ./test-services.sh"
echo ""
echo "Service Logs:"
echo "  ASR:      docker logs -f local_asr_server"
echo "  TTS:      tail -f logs/tts.log"
echo "  Backend:  tail -f logs/backend.log"
echo "  Frontend: tail -f logs/frontend.log"
echo ""
echo "Endpoints:"
echo "  Frontend:   http://localhost:3000"
echo "  Backend:    http://localhost:8002/health"
echo "  ASR:        ws://localhost:10095"
echo ""
