# Mavin Voice Backend Services

**Complete guide to Mavin's voice services infrastructure**

**Last Updated**: 2026-02-14

---

## Overview

Mavin's voice backend consists of three core services, all managed internally:

| Service | Purpose | Type | Health Check |
|---------|---------|------|--------------|
| **OpenClaw** | AI Chat (GPT-4/Claude) | CLI Tool | API test |
| **MT LiteTTS** | Text-to-Speech (程小可) | Python/MUSA | Module check |
| **FunASR** | Speech Recognition (Chinese) | Docker | WebSocket |

All services are:
- ✅ Managed by Mavin ServiceManager
- ✅ Auto-started on backend initialization
- ✅ Health monitored every 60 seconds
- ✅ Logged to centralized service logs
- ✅ Status displayed in UI

---

## 1. OpenClaw (AI Chat)

### Overview
Unified AI orchestration CLI that provides a single interface to multiple LLM providers.

### Features
- Multi-provider support (OpenAI GPT-4, Anthropic Claude)
- Session management with conversation context
- Local execution (no third-party orchestrators)
- JSON output for easy parsing

### Installation

```bash
# Check if installed
which openclaw

# If not installed, follow OpenClaw installation guide
```

### Configuration

Environment variables (`.env`):
```bash
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

### Health Status

The ServiceManager automatically checks:
- ✅ OpenClaw CLI availability
- ✅ OpenAI API connection
- ✅ Anthropic API connection

**Status levels**:
- `healthy`: Both providers working
- `degraded`: One provider working
- `error`: No providers available

### Manual Test

```bash
# Test OpenClaw
openclaw agent --local --json -m "test"

# Via Mavin API
curl http://localhost:8002/api/services/openclaw
```

---

## 2. MT LiteTTS (Text-to-Speech)

### Overview
Premium Chinese TTS with 程小可 (Cheng Xiaoke) voice, powered by Moore Threads MUSA GPU.

### Features
- Streaming synthesis for low latency
- Auto-play mode (returns buffer without saving file)
- MUSA GPU acceleration
- High-quality 22050Hz WAV output

### Installation

```bash
pip install mt-litetts
```

### Models
Located in `~/download/mt_litetts/serving_models/litetts_v4d/`

### Health Status

ServiceManager checks:
- ✅ Python module importable
- ✅ Model files accessible
- ✅ Service initialization successful

### Manual Test

```bash
# Test Python script
cd backend/python
python3 mt_litetts_streaming.py "你好世界" /tmp/test.wav

# Via Mavin API
curl http://localhost:8002/api/services/mt-litetts
```

### Usage

See `docs/MT_LITETTS_STREAMING.md` for detailed usage guide.

---

## 3. FunASR (Speech Recognition)

### Overview
Production-grade ASR from Alibaba DAMO Academy, optimized for Chinese.

### Features
- 2-pass architecture (real-time + offline)
- Paraformer model optimized for Mandarin
- WebSocket streaming interface
- VAD, punctuation, and ITN support

### Container

**Name**: `funasr-runtime-8*A800-80G-1`
**Port**: 10095 (WebSocket over SSL)

### Auto-Start

ServiceManager automatically:
1. Checks if Docker container exists
2. Starts container if not running
3. Waits for service to be ready
4. Tests WebSocket connection

### Health Status

ServiceManager monitors:
- ✅ Docker container running
- ✅ WebSocket connection successful
- ✅ Port 10095 accessible

### Manual Control

```bash
# Start container
docker start funasr-runtime-8*A800-80G-1

# Stop container
docker stop funasr-runtime-8*A800-80G-1

# Check status
docker ps | grep funasr

# View logs
docker logs -f funasr-runtime-8*A800-80G-1
```

### Configuration

**WebSocket URL**: `wss://localhost:10095`

**Models Used**:
- Offline ASR: `speech_paraformer-large-vad-punc_asr_nat-zh-cn-16k-common-vocab8404-onnx`
- Online ASR: `speech_paraformer-large_asr_nat-zh-cn-16k-common-vocab8404-online-onnx`
- VAD: `speech_fsmn_vad_zh-cn-16k-common-onnx`
- Punctuation: `punc_ct-transformer_zh-cn-common-vad_realtime-vocab272727-onnx`
- ITN: `fst_itn_zh`
- Language Model: `speech_ngram_lm_zh-cn-ai-wesp-fst`

**Models location**: `/workspace/models/`

### Manual Test

```bash
# Test WebSocket connection
curl http://localhost:8002/api/services/funasr
```

---

## Service Management

### ServiceManager

Located at: `backend/src/services/ServiceManager.ts`

**Features**:
- Initializes all services on backend startup
- Periodic health checks (60s interval)
- Centralized logging
- Auto-restart capabilities
- Status reporting for UI

### API Endpoints

All endpoints are under `/api/services`:

#### GET `/api/services/health`
Get overall system health and all service statuses.

**Response**:
```json
{
  "overall": "healthy",
  "services": [...],
  "timestamp": "2026-02-14T...",
  "stats": {
    "total": 3,
    "healthy": 3,
    "degraded": 0,
    "error": 0,
    "unavailable": 0
  }
}
```

#### GET `/api/services`
Get all service statuses.

#### GET `/api/services/:name`
Get specific service status.

**Example**: `GET /api/services/openclaw`

#### POST `/api/services/:name/restart`
Restart a specific service.

**Example**: `POST /api/services/funasr/restart`

#### GET `/api/services/:name/logs`
Get logs for a specific service.

**Query params**: `?count=100`

#### GET `/api/services/logs/all`
Get all service logs.

#### DELETE `/api/services/logs`
Clear all logs.

### Service Status Schema

```typescript
interface ServiceHealth {
  name: string;              // Service ID
  displayName: string;       // Human-readable name
  status: string;            // 'healthy' | 'degraded' | 'error' | 'unavailable' | 'starting'
  type: string;              // 'ai' | 'tts' | 'asr'
  lastCheck: Date;           // Last health check time
  error?: string;            // Error message if failed
  metadata?: object;         // Service-specific data
  uptime?: number;           // Uptime in seconds
  startTime?: Date;          // Service start time
}
```

---

## Startup Sequence

When Mavin backend starts:

```
1. ServiceManager.initialize()
   ↓
2. Initialize services in parallel:
   - Check OpenClaw CLI → Test OpenAI/Claude APIs
   - Initialize MT LiteTTS → Load model
   - Check FunASR Docker → Start if needed → Test WebSocket
   ↓
3. Display status summary in console
   ↓
4. Start Express server
   ↓
5. Begin health check loop (every 60s)
```

### Console Output Example

```
============================================================
Initializing Mavin Voice Backend Services...
============================================================
[OPENCLAW] Initializing OpenClaw service...
[MT-LITETTS] Initializing MT LiteTTS Streaming...
[FUNASR] Checking FunASR Docker service...
[OPENCLAW] OpenClaw ready (OpenAI: true, Claude: true)
[MT-LITETTS] MT LiteTTS ready (cheng-xiaoke)
[FUNASR] FunASR service ready

Service Status Summary:
  Total Services: 3
  ✓ Healthy: 3
  ⚠ Degraded: 0
  ✗ Error: 0
  - Unavailable: 0
  Overall: HEALTHY

  ✓ OpenClaw AI: healthy
  ✓ MT LiteTTS: healthy
  ✓ FunASR: healthy

============================================================
✓ Mavin Backend running on port 8002
  Environment: development
  CORS origin: http://localhost:5173
  Service API: http://localhost:8002/api/services/health
============================================================
```

---

## Logging

### Centralized Logs

All service logs are stored in memory (max 1000 entries) and accessible via API.

**Log Entry Schema**:
```typescript
interface ServiceLog {
  timestamp: Date;
  service: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  details?: any;
}
```

### Access Logs

```bash
# Get all logs
curl http://localhost:8002/api/services/logs/all?count=200

# Get logs for specific service
curl http://localhost:8002/api/services/openclaw/logs?count=50
```

---

## UI Integration

### Service Status Display

The UI displays service status in real-time.

**Location**: Check the header or settings panel for service indicators.

**Colors**:
- 🟢 Green: Healthy
- 🟡 Yellow: Degraded
- 🔴 Red: Error
- ⚪ Gray: Unavailable
- 🔵 Blue: Starting

### Implementation

See `apps/web/client/src/components/ServiceStatus.tsx` for the status display component.

The UI polls `/api/services/health` every 30 seconds to update the display.

---

## Troubleshooting

### OpenClaw Issues

**Problem**: "openclaw: command not found"

**Solution**:
```bash
# Install OpenClaw
# Follow OpenClaw installation guide

# Verify installation
which openclaw
```

**Problem**: API key errors

**Solution**:
```bash
# Check .env file
cat backend/.env | grep API_KEY

# Test keys directly
export OPENAI_API_KEY=sk-...
export ANTHROPIC_API_KEY=sk-ant-...
openclaw agent --local -m "test"
```

### MT LiteTTS Issues

**Problem**: "mt-litetts not installed"

**Solution**:
```bash
pip install mt-litetts

# Verify
python3 -c "import mt_litetts; print('OK')"
```

**Problem**: Model not found

**Solution**:
```bash
# Check model directory
ls ~/download/mt_litetts/serving_models/litetts_v4d/

# Should contain:
# - config.json
# - G_280000.pth
# - symbols.txt
```

### FunASR Issues

**Problem**: Container not found

**Solution**:
```bash
# List all containers
docker ps -a | grep funasr

# If container doesn't exist, it needs to be created
# Contact system administrator
```

**Problem**: WebSocket connection failed

**Solution**:
```bash
# Check if container is running
docker ps | grep funasr

# If not running, start it
docker start funasr-runtime-8*A800-80G-1

# Check container logs
docker logs -f funasr-runtime-8*A800-80G-1

# Test port
nc -zv localhost 10095
```

---

## Performance

### Typical Startup Times

- OpenClaw: ~2-5 seconds (API test)
- MT LiteTTS: ~8-10 seconds (first synthesis, model loading)
- FunASR: ~3-5 seconds (if container already running)

**Total startup**: ~10-15 seconds

### Runtime Performance

- OpenClaw: 2-5s per chat request
- MT LiteTTS: 1-2s per synthesis (after model loaded)
- FunASR: Real-time streaming (< 1s latency)

---

## References

- ServiceManager: `backend/src/services/ServiceManager.ts`
- API Routes: `backend/src/routes/services.ts`
- MT LiteTTS Guide: `docs/MT_LITETTS_STREAMING.md`
- Voice Guide: `docs/VOICE.md`

---

**Service Manager Status**: ✅ Production Ready

**Last Updated**: 2026-02-14
