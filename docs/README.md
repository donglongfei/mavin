# Mavin - Unified AI Companion

A unified monorepo combining the beautiful cyberpunk UI from mavin-aibook-poc with the powerful backend infrastructure from mavin-os.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React + Vite)                  │
│              Cyberpunk 3-Pane UI + Digital Avatar           │
│                     Port: 3000                              │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP/REST
┌────────────────────▼────────────────────────────────────────┐
│                Backend API (FastAPI)                        │
│          Agent Execution + Memory Management                │
│                     Port: 8000                              │
└─────────┬──────────────────────────┬────────────────────────┘
          │                          │
          │ HTTP                     │ HTTP
          ▼                          ▼
┌─────────────────────┐    ┌──────────────────────┐
│  Agent Service      │    │  Qdrant Vector DB    │
│  (OpenClaw Wrapper) │    │  (Semantic Memory)   │
│  Port: 8001         │    │  Port: 6333          │
└─────────────────────┘    └──────────────────────┘
```

## Features

### Frontend (apps/web)
- **Cyberpunk 3-Pane Layout**: Context Manager, Dynamic Workspace, AI Copilot
- **Digital Avatar**: 4 animated states (idle, speaking, thinking, listening)
- **Three View Modes**: Timeline, Canvas, Notebook
- **Real-time Chat**: Connected to backend AI agent
- **Smart Widgets**: Audio player, action items, deep dive cards

### Backend (services/api)
- **Agent Execution**: OpenClaw integration for AI tasks
- **Vector Memory**: Qdrant-based semantic memory storage
- **REST API**: Comprehensive endpoints for agent and memory operations
- **Session Management**: Persistent agent sessions

### Agent Service (services/agent-service)
- **OpenClaw Wrapper**: Subprocess execution of OpenClaw CLI
- **Session Persistence**: Maintains conversation context
- **Health Monitoring**: Status and version checks

## Quick Start

### Prerequisites

- Node.js 22+
- pnpm 10+
- Python 3.8+
- Docker (for Qdrant)
- OpenClaw CLI installed at `/home/mt/npm-global/bin/openclaw-wrapper`

### Installation

```bash
# 1. Install dependencies
cd /home/mt/mavin
pnpm install

# 2. Install Python dependencies
cd services/api
pip3 install -r requirements.txt

cd ../agent-service
pip3 install -r requirements.txt

# 3. Set up environment
cd /home/mt/mavin
cp .env.example .env
# Edit .env if needed

# 4. Start Qdrant (requires Docker permissions)
# Option A: With docker-compose
cd infra
docker compose up -d qdrant

# Option B: Direct docker run
docker run -d --name mavin-qdrant \
  -p 6333:6333 -p 6334:6334 \
  -v mavin_qdrant_storage:/qdrant/storage \
  qdrant/qdrant:latest
```

### Running Services

#### Option 1: Use the dev script (recommended)
```bash
cd /home/mt/mavin
./scripts/dev.sh
```

#### Option 2: Start services manually

**Terminal 1 - Agent Service:**
```bash
cd /home/mt/mavin/services/agent-service
uvicorn main:app --port 8001 --reload
```

**Terminal 2 - Backend API:**
```bash
cd /home/mt/mavin/services/api
uvicorn app.main:app --port 8000 --reload
```

**Terminal 3 - Frontend:**
```bash
cd /home/mt/mavin/apps/web
pnpm dev
```

### Access Points

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Agent Service**: http://localhost:8001
- **Qdrant Dashboard**: http://localhost:6333/dashboard

## Project Structure

```
mavin/
├── apps/
│   └── web/                    # React frontend
│       ├── client/
│       │   ├── src/
│       │   │   ├── components/ # UI components
│       │   │   ├── lib/        # API client
│       │   │   └── pages/      # Page components
│       │   └── public/         # Static assets
│       ├── package.json
│       └── vite.config.ts
│
├── services/
│   ├── api/                    # FastAPI backend
│   │   ├── app/
│   │   │   ├── api/routes/    # Endpoints
│   │   │   ├── core/          # Config
│   │   │   ├── models/        # Pydantic models
│   │   │   ├── services/      # Business logic
│   │   │   └── main.py
│   │   └── requirements.txt
│   │
│   └── agent-service/          # OpenClaw wrapper
│       ├── main.py
│       └── requirements.txt
│
├── packages/
│   └── types/                  # Shared TypeScript types
│       └── src/
│           ├── agent.ts
│           ├── memory.ts
│           └── api.ts
│
├── infra/
│   └── docker-compose.yml      # Docker orchestration
│
├── scripts/
│   ├── dev.sh                  # Start all services
│   └── setup.sh                # Initial setup
│
├── package.json                # Root workspace
├── pnpm-workspace.yaml         # Workspace config
└── .env                        # Environment variables
```

## API Endpoints

### Agent Operations
- `POST /api/agent/execute` - Execute AI agent task
- `GET /api/agent/status` - Get agent service status

### Memory Operations
- `POST /api/memory/store` - Store memory
- `POST /api/memory/search` - Search memories
- `GET /api/memory/stats` - Get memory statistics

### Health
- `GET /api/health` - Health check
- `GET /api/ready` - Readiness check

## Development

### Frontend Development
```bash
cd apps/web
pnpm dev          # Start dev server
pnpm build        # Build for production
pnpm check        # TypeScript check
pnpm format       # Format code
```

### Backend Development
```bash
cd services/api
uvicorn app.main:app --reload  # Start with hot reload
```

### Adding Dependencies

**Frontend:**
```bash
cd apps/web
pnpm add <package>
```

**Root:**
```bash
cd /home/mt/mavin
pnpm add -w <package>
```

## Testing

### Test Agent Execution
```bash
curl -X POST http://localhost:8000/api/agent/execute \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Hello, who are you?","context":{}}'
```

### Test Memory Storage
```bash
curl -X POST http://localhost:8000/api/memory/store \
  -H "Content-Type: application/json" \
  -d '{"content":"Test memory","metadata":{"source":"test"}}'
```

### Test Memory Search
```bash
curl -X POST http://localhost:8000/api/memory/search \
  -H "Content-Type: application/json" \
  -d '{"query":"test","limit":5}'
```

## Environment Variables

See `.env.example` for all available configuration options.

Key variables:
- `VITE_API_URL` - Frontend API URL (default: http://localhost:8000)
- `QDRANT_HOST` - Qdrant host (default: localhost)
- `AGENT_SERVICE_URL` - Agent service URL (default: http://localhost:8001)
- `OPENCLAW_PATH` - Path to OpenClaw CLI

## Troubleshooting

### Frontend can't connect to backend
- Check that backend is running on port 8000
- Check CORS settings in `services/api/app/main.py`
- Verify `VITE_API_URL` in `.env`

### Agent execution fails
- Check that OpenClaw is installed: `openclaw --version`
- Verify `OPENCLAW_PATH` in `.env`
- Check agent service logs

### Qdrant connection fails
- Ensure Qdrant is running: `curl http://localhost:6333/health`
- Check Docker container: `docker ps | grep qdrant`
- Verify `QDRANT_HOST` and `QDRANT_PORT` in `.env`

### Docker permission denied
- Add user to docker group: `sudo usermod -aG docker $USER`
- Or run Qdrant with sudo (not recommended for production)

## License

MIT

## Credits

- Frontend UI: mavin-aibook-poc
- Backend Infrastructure: mavin-os
- AI Engine: OpenClaw + Kimi K2.5
