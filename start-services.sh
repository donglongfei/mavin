#!/bin/bash
# Mavin Services Startup Script
# Starts: ASR (Docker), TTS, Backend Webserver, OpenClaw

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Load centralized configuration
source "$SCRIPT_DIR/scripts/load-config.sh"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Create necessary directories
mkdir -p "$LOGS_DIR" "$PIDS_DIR"

# Function to print colored output
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

# Function to check if a service is running
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function to wait for a port to be available
wait_for_port() {
    local port=$1
    local service=$2
    local timeout=${3:-30}
    local elapsed=0

    print_info "Waiting for $service (port $port) to be ready..."

    while [ $elapsed -lt $timeout ]; do
        if check_port $port; then
            print_status "$service is ready on port $port"
            return 0
        fi
        sleep 1
        elapsed=$((elapsed + 1))
    done

    print_error "$service failed to start within ${timeout}s"
    return 1
}

echo "======================================"
echo "  Mavin Services Startup"
echo "======================================"
echo ""

# 1. Start ASR Docker Container
print_info "Starting ASR Docker Container..."

# Check if container exists
if ! docker ps -a | grep -q "local_asr_server"; then
    print_warn "ASR container not found. Loading image..."

    ASR_IMAGE="$SCRIPT_DIR/infra/docker/m1000_local_asr_server.tar"
    if [ -f "$ASR_IMAGE" ]; then
        docker load -i "$ASR_IMAGE"
        print_status "ASR image loaded"

        # Create and start container
        docker run -d \
            --name local_asr_server \
            -p 10095:10095 \
            -v /data:/data \
            sh-harbor.mthreads.com/mt-ai/local_asr_server:1.0 \
            bash -c "sleep infinity"
        print_status "ASR container created"
    else
        print_error "ASR image not found at: $ASR_IMAGE"
        print_info "Please place the image at infra/docker/m1000_local_asr_server.tar"
        exit 1
    fi
else
    # Container exists, start it if not running
    if ! docker ps | grep -q "local_asr_server"; then
        docker start local_asr_server
        sleep 2
        print_status "ASR container started"
    else
        print_status "ASR container already running"
    fi
fi

# Execute the funasr service inside the container
print_info "Starting FunASR service inside container..."

docker exec -d local_asr_server bash -c "
    /workspace/FunASR/runtime/websocket/build/bin/funasr-wss-server-2pass \
        --certfile /workspace/FunASR/runtime/ssl_key/server.crt \
        --decoder-thread-num 4 \
        --io-thread-num 1 \
        --itn-dir /workspace/models/thuduj12/fst_itn_zh \
        --keyfile /workspace/FunASR/runtime/ssl_key/server.key \
        --lm-dir /workspace/models/damo/speech_ngram_lm_zh-cn-ai-wesp-fst \
        --model-dir /workspace/models/damo/speech_paraformer-large-vad-punc_asr_nat-zh-cn-16k-common-vocab8404-onnx \
        --model-thread-num 1 \
        --online-model-dir /workspace/models/damo/speech_paraformer-large_asr_nat-zh-cn-16k-common-vocab8404-online-onnx \
        --port 10095 \
        --punc-dir /workspace/models/damo/punc_ct-transformer_zh-cn-common-vad_realtime-vocab272727-onnx \
        --vad-dir /workspace/models/damo/speech_fsmn_vad_zh-cn-16k-common-onnx \
    > /workspace/logs/funasr.log 2>&1
"

# Wait for ASR service to be ready
wait_for_port 10095 "ASR" 15 || print_warn "ASR service might still be initializing"

# 2. Start TTS Service (MT-LiteTTS)
print_info "Starting TTS Service (MT-LiteTTS)..."

if [ -f "$SCRIPT_DIR/backend/python/mt_litetts_ws_server.py" ]; then
    cd "$SCRIPT_DIR/backend/python"
    nohup python3 mt_litetts_ws_server.py > "$LOGS_DIR/tts.log" 2>&1 &
    TTS_PID=$!
    echo $TTS_PID > "$PIDS_DIR/tts.pid"
    cd "$SCRIPT_DIR"
    print_status "TTS service started (PID: $TTS_PID)"

    # Wait for TTS to be ready (assuming it runs on port 5002)
    # Note: Adjust port if different
    sleep 2
else
    print_warn "TTS service script not found, skipping"
fi

# 3. Check OpenClaw (CLI tool, no daemon needed)
print_info "Checking OpenClaw..."

if command -v openclaw &> /dev/null; then
    print_status "OpenClaw CLI available: $(openclaw --version 2>&1 | head -1 || echo 'installed')"
else
    print_warn "OpenClaw CLI not found in PATH"
    print_info "Make sure OpenClaw is installed and accessible"
fi

# 4. Start Backend Webserver
print_info "Starting Backend Webserver..."

cd "$SCRIPT_DIR/backend"

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    print_info "Installing backend dependencies..."
    pnpm install
fi

# Start backend in development mode
nohup pnpm dev > "$LOGS_DIR/backend.log" 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > "$PIDS_DIR/backend.pid"

cd "$SCRIPT_DIR"
print_status "Backend webserver started (PID: $BACKEND_PID)"

# Wait for backend to be ready
wait_for_port 8002 "Backend" 30

# 5. Start Frontend Web Application
print_info "Starting Frontend Web Application..."

cd "$SCRIPT_DIR/apps/web"

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    print_info "Installing frontend dependencies..."
    pnpm install
fi

# Start frontend in development mode
nohup pnpm dev > "$LOGS_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > "$PIDS_DIR/frontend.pid"

cd "$SCRIPT_DIR"
print_status "Frontend started (PID: $FRONTEND_PID)"

# Wait for frontend to be ready
wait_for_port 3000 "Frontend" 30

echo ""
echo "======================================"
echo "  All Services Started!"
echo "======================================"
echo ""
echo "Service Status:"
echo "  ASR (FunASR):     ws://localhost:10095"
echo "  TTS (MT-LiteTTS): Running"
echo "  OpenClaw:         CLI available"
echo "  Backend API:      http://localhost:8002"
echo "  Frontend Web:     http://localhost:3000"
echo ""
echo "Logs:"
echo "  ASR:      docker logs local_asr_server"
echo "  TTS:      tail -f $LOGS_DIR/tts.log"
echo "  Backend:  tail -f $LOGS_DIR/backend.log"
echo "  Frontend: tail -f $LOGS_DIR/frontend.log"
echo ""
echo "Management:"
echo "  Stop all:  ./stop-services.sh"
echo "  Status:    ./status-services.sh"
echo "======================================"
