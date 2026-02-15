# Mavin Services Management

This directory contains scripts to manage all Mavin services (ASR, TTS, OpenClaw, and Backend).

## Quick Start

### Run Tests
```bash
./test-services.sh
```

### Start All Services
```bash
./start-services.sh
```

### Stop All Services
```bash
./stop-services.sh
```

## Services Overview

| Service | Type | Port | Description |
|---------|------|------|-------------|
| **ASR** | Docker Container | 10095 | FunASR WebSocket Server (Speech Recognition) |
| **TTS** | Python Service | - | MT-LiteTTS WebSocket Server (Text-to-Speech) |
| **OpenClaw** | CLI Tool | - | AI Orchestration CLI |
| **Backend** | Node.js/Express | 8002 | Main API Server |

## Service Details

### 1. ASR (Automatic Speech Recognition)

**Container**: `local_asr_server`
**Image**: `sh-harbor.mthreads.com/mt-ai/local_asr_server:1.0`
**Port**: `10095` (WebSocket)

The ASR service runs inside a Docker container using FunASR. The container is automatically:
- Started if stopped
- Created if it doesn't exist
- The FunASR service is launched inside the container

**Manual Control**:
```bash
# Start container
docker start local_asr_server

# Stop container
docker stop local_asr_server

# View logs
docker logs local_asr_server

# Access container shell
docker exec -it local_asr_server bash
```

### 2. TTS (Text-to-Speech)

**Script**: `backend/python/mt_litetts_ws_server.py`
**Logs**: `logs/tts.log`

Runs MT-LiteTTS WebSocket server for text-to-speech synthesis.

**Manual Control**:
```bash
# Start
cd backend/python
python3 mt_litetts_ws_server.py &

# Stop
pkill -f mt_litetts_ws_server.py

# View logs
tail -f logs/tts.log
```

### 3. OpenClaw

**Type**: CLI Tool
**No Daemon**: OpenClaw is a command-line tool, not a service.

It's invoked on-demand by the backend when needed.

**Check Installation**:
```bash
openclaw --version
```

### 4. Backend Webserver

**Framework**: Express (Node.js + TypeScript)
**Port**: `8002`
**Command**: `pnpm dev` (development mode)
**Logs**: `logs/backend.log`

The main API server that coordinates all services.

**Manual Control**:
```bash
# Start
cd backend
pnpm dev

# Stop
pkill -f "tsx watch src/index.ts"

# View logs
tail -f logs/backend.log
```

## Logs

All service logs are stored in the `logs/` directory:

```bash
# View all logs in real-time
tail -f logs/*.log

# View specific service logs
tail -f logs/backend.log
tail -f logs/tts.log

# ASR logs (Docker)
docker logs -f local_asr_server
```

## Troubleshooting

### Port Already in Use

If you get "port already in use" errors:

```bash
# Check what's using port 8002 (backend)
lsof -i :8002

# Check what's using port 10095 (ASR)
lsof -i :10095

# Kill process on specific port
kill -9 $(lsof -t -i:8002)
```

### ASR Container Issues

```bash
# Check container status
docker ps -a | grep local_asr_server

# View container logs
docker logs local_asr_server

# Restart container
docker restart local_asr_server

# Remove and recreate container
docker rm local_asr_server
./start-services.sh
```

### Backend Won't Start

```bash
# Check Node.js version
node --version

# Reinstall dependencies
cd backend
rm -rf node_modules
pnpm install

# Check for TypeScript errors
pnpm type-check
```

### TTS Service Issues

```bash
# Check Python dependencies
pip3 list | grep -i tts

# View TTS logs
tail -f logs/tts.log

# Restart TTS
pkill -f mt_litetts_ws_server.py
cd backend/python
python3 mt_litetts_ws_server.py &
```

## Directory Structure

```
mavin/
├── start-services.sh      # Start all services
├── stop-services.sh       # Stop all services
├── test-services.sh       # Unit tests
├── logs/                  # Service logs
│   ├── backend.log
│   └── tts.log
├── .pids/                 # Process ID files
│   ├── backend.pid
│   └── tts.pid
├── backend/
│   ├── src/index.ts       # Backend entry point
│   └── python/            # Python services
│       ├── mt_litetts_ws_server.py
│       └── ...
└── infra/
    └── docker/
        └── m1000_local_asr_server.tar  # ASR Docker image
```

## Important Notes

### Fixed Command Issues

Your original commands had some issues:

❌ **Incorrect**: `docker start -ai local_asr_server`
✅ **Correct**: `docker start local_asr_server` (detached mode)

The `-ai` flags mean:
- `-a`: Attach to container's STDOUT/STDERR (blocks terminal)
- `-i`: Keep STDIN open (interactive mode)

For daemon services, you should use detached mode (no flags) so the container runs in the background.

### The FunASR Command

The long FunASR command is automatically executed inside the container by the start script:

```bash
docker exec -d local_asr_server bash -c "
    /workspace/FunASR/runtime/websocket/build/bin/funasr-wss-server-2pass \
        --port 10095 \
        --model-dir /workspace/models/... \
        # ... other parameters
"
```

The `-d` flag runs the command in detached mode inside the container.

### Safety Features

The scripts are designed with safety in mind:
- **No automatic shutdown**: Scripts will never log you out or shut down your PC
- **Graceful cleanup**: Processes are stopped gracefully with SIGTERM, then SIGKILL if needed
- **PID tracking**: Process IDs are stored in `.pids/` for reliable service management
- **Error handling**: Scripts use `set -e` to stop on errors
- **Status checks**: Scripts verify services are running before attempting to stop them

## API Endpoints

Once all services are running:

- **Backend Health**: http://localhost:8002/health
- **Service Status**: http://localhost:8002/api/services/health
- **ASR WebSocket**: ws://localhost:10095

## Development

### Running in Development Mode

All services are started in development mode by default:
- Backend: `pnpm dev` (auto-reload with tsx)
- TTS: Direct Python execution
- ASR: Production container

### Testing Changes

1. Stop services: `./stop-services.sh`
2. Make your changes
3. Run tests: `./test-services.sh`
4. Start services: `./start-services.sh`
5. Check logs: `tail -f logs/*.log`

## Production Deployment

For production, you should:

1. Build the backend: `cd backend && pnpm build`
2. Use production startup: `cd backend && node dist/index.js`
3. Set up systemd services or PM2 for process management
4. Configure reverse proxy (nginx/caddy)
5. Set up proper logging and monitoring

## License

MIT
