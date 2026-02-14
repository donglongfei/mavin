# Centralized Service Configuration

## Overview

All service endpoints, ports, and paths are now centralized in a single configuration file: `config/services.json`

This prevents configuration mismatches between:
- Backend code
- Frontend code
- Service management scripts (start/stop)
- Tests

## Configuration Files

### Main Configuration
- **config/services.json** - Master configuration file
- **config/services.schema.json** - JSON schema for validation

### Code Modules
- **shared/config.ts** - TypeScript configuration loader (backend)
- **apps/web/client/src/config/api.ts** - Frontend API configuration
- **scripts/load-config.sh** - Bash script configuration loader

## Configuration Structure

```json
{
  "version": "1.0.0",
  "services": {
    "frontend": { port, url, directory, ... },
    "backend": { port, url, directory, cors, ... },
    "asr": { port, url, container, ssl, ... },
    "tts": { ports, script, ... },
    "openclaw": { command, ... }
  },
  "api": {
    "baseUrl": "http://localhost:8002",
    "endpoints": {
      "health": "/health",
      "voice": {
        "asr": "/api/voice/asr",
        "tts": "/api/voice/tts",
        ...
      },
      ...
    }
  },
  "paths": {
    "logs": "logs",
    "pids": ".pids",
    ...
  }
}
```

## Usage

### Backend (TypeScript)

```typescript
import { servicesConfig, getServiceConfig, getApiUrl } from '../shared/config.js';

// Get service configuration
const asrConfig = getServiceConfig('asr');
console.log(asrConfig.url); // wss://localhost:10095

// Get API endpoint URL
const asrEndpoint = getApiUrl('voice.asr');
console.log(asrEndpoint); // http://localhost:8002/api/voice/asr

// Direct access
const port = servicesConfig.services.backend.port; // 8002
```

### Frontend (TypeScript)

```typescript
import api from '@/config/api';

// Get API URLs
const asrUrl = api.voice.asr(); // http://localhost:8002/api/voice/asr
const healthUrl = api.health(); // http://localhost:8002/health

// Make API calls
fetch(api.voice.status())
  .then(res => res.json())
  .then(data => console.log(data));
```

### Shell Scripts

```bash
#!/bin/bash
source "$(dirname "$0")/load-config.sh"

# Use configuration variables
echo "Starting backend on port $BACKEND_PORT"
echo "Frontend URL: $FRONTEND_URL"
echo "ASR container: $ASR_CONTAINER"
echo "Logs directory: $LOGS_DIR"

# Start service
docker start "$ASR_CONTAINER"
```

## Available Variables

### Shell Scripts (after sourcing load-config.sh)

**Frontend:**
- `$FRONTEND_PORT` - Primary port (3000)
- `$FRONTEND_PORTS` - Fallback ports (3001 3002 3003)
- `$FRONTEND_ALL_PORTS` - All ports
- `$FRONTEND_DIR` - Directory (apps/web)
- `$FRONTEND_URL` - URL (http://localhost:3000)

**Backend:**
- `$BACKEND_PORT` - Port (8002)
- `$BACKEND_DIR` - Directory (backend)
- `$BACKEND_URL` - URL (http://localhost:8002)
- `$BACKEND_CORS_ORIGINS` - CORS origins

**ASR:**
- `$ASR_PORT` - Port (10095)
- `$ASR_CONTAINER` - Container name (local_asr_server)
- `$ASR_IMAGE` - Docker image
- `$ASR_IMAGE_PATH` - Image file path
- `$ASR_URL` - WebSocket URL (wss://localhost:10095)

**TTS:**
- `$TTS_PORT` - Primary port (5001)
- `$TTS_PORTS` - Fallback ports (5002)
- `$TTS_ALL_PORTS` - All ports
- `$TTS_SCRIPT` - Python script path

**Paths:**
- `$LOGS_DIR` - Logs directory (logs)
- `$PIDS_DIR` - PID files directory (.pids)
- `$UPLOADS_DIR` - Uploads directory
- `$AUDIO_DIR` - Audio files directory

**API Endpoints:**
- `$API_BASE_URL` - Base URL (http://localhost:8002)
- `$API_VOICE_ASR` - ASR endpoint (/api/voice/asr)
- `$API_VOICE_TTS` - TTS endpoint (/api/voice/tts)
- `$API_VOICE_STATUS` - Voice status endpoint
- `$API_HEALTH` - Health check endpoint
- `$API_SERVICES_HEALTH` - Services health endpoint

## Modifying Configuration

### 1. Edit config/services.json

```json
{
  "services": {
    "backend": {
      "port": 9000,  // Change port
      "url": "http://localhost:9000"  // Update URL
    }
  }
}
```

### 2. No Code Changes Needed!

All services will automatically use the new configuration:
- Backend will start on port 9000
- Frontend will connect to port 9000
- Scripts will manage port 9000

### 3. Restart Services

```bash
./stop-services.sh
./start-services.sh
```

## Benefits

✅ **Single Source of Truth** - One file controls all endpoints
✅ **No Mismatches** - Backend and frontend always in sync
✅ **Easy to Change** - Update one place, affects everything
✅ **Type Safe** - TypeScript types generated from config
✅ **Documented** - JSON schema provides validation and IntelliSense
✅ **Testable** - Tests use same configuration as production

## Validation

The configuration has a JSON schema for validation:

```bash
# Install JSON schema validator
npm install -g ajv-cli

# Validate configuration
ajv validate -s config/services.schema.json -d config/services.json
```

## Environment Variables

You can still override configuration with environment variables:

```bash
# Override backend port
PORT=9000 pnpm dev

# Override CORS origins
CORS_ORIGIN="http://localhost:4000,http://localhost:5000" pnpm dev
```

Environment variables take precedence over `services.json`.

## Migration Guide

### Old Code (Hardcoded)

```typescript
// ❌ Before
const API_URL = 'http://localhost:8002';
const ASR_ENDPOINT = '/api/voice/asr';
fetch(`${API_URL}${ASR_ENDPOINT}`);
```

### New Code (Centralized)

```typescript
// ✅ After
import api from '@/config/api';
fetch(api.voice.asr());
```

### Old Script (Hardcoded)

```bash
# ❌ Before
BACKEND_PORT=8002
docker start local_asr_server
```

### New Script (Centralized)

```bash
# ✅ After
source ./scripts/load-config.sh
docker start "$ASR_CONTAINER"
```

## Troubleshooting

### "jq: command not found"

Install jq for JSON parsing in bash:

```bash
# Ubuntu/Debian
sudo apt-get install jq

# macOS
brew install jq
```

### Configuration not loading

Check file exists:
```bash
ls -la config/services.json
cat config/services.json | jq .
```

### TypeScript import errors

Rebuild TypeScript:
```bash
cd backend
pnpm build
```

## See Also

- `config/services.json` - Master configuration
- `config/services.schema.json` - JSON schema
- `shared/config.ts` - TypeScript loader
- `scripts/load-config.sh` - Bash loader
