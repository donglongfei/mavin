# Centralized Service Configuration - Summary

## What I Created

I've implemented a **centralized configuration system** that eliminates hardcoded endpoints throughout your codebase. All services, ports, and URLs are now managed from a single source of truth.

## File Structure

```
mavin/
├── config/
│   ├── services.json              # Master configuration file
│   └── services.schema.json       # JSON schema for validation
├── shared/
│   └── config.ts                  # TypeScript configuration loader (backend)
├── apps/web/client/src/config/
│   └── api.ts                     # Frontend API configuration
├── scripts/
│   └── load-config.sh             # Bash configuration loader
├── docs/
│   └── CONFIGURATION.md           # Complete documentation
├── start-services.sh              # Updated to use centralized config
└── stop-services.sh               # Updated to use centralized config
```

## Benefits

### ✅ Single Source of Truth
- **One file** (`config/services.json`) defines all endpoints
- No more scattered hardcoded values
- Easy to see all service configurations at a glance

### ✅ No Mismatches
- Backend reads from config: `getServiceConfig('asr').url`
- Frontend reads from config: `api.voice.asr()`
- Scripts read from config: `$ASR_URL`
- **All always in sync!**

### ✅ Easy to Change
Want to change ASR port from 10095 to 10096?
1. Edit `config/services.json`: Change port to `10096`
2. Restart services: `./stop-services.sh && ./start-services.sh`
3. Done! Backend, frontend, and scripts all use the new port

### ✅ Type Safe
- TypeScript interfaces generated from config
- Auto-complete in VS Code
- Compile-time checks

## Configuration File

`config/services.json` contains:

```json
{
  "services": {
    "frontend": { "port": 3000, "url": "http://localhost:3000", ... },
    "backend": { "port": 8002, "url": "http://localhost:8002", ... },
    "asr": { "port": 10095, "url": "wss://localhost:10095", ... },
    "tts": { "ports": { "primary": 5001, "fallback": [5002] }, ... },
    "openclaw": { "command": "openclaw", ... }
  },
  "api": {
    "baseUrl": "http://localhost:8002",
    "endpoints": {
      "health": "/health",
      "voice": {
        "asr": "/api/voice/asr",
        "tts": "/api/voice/tts",
        ...
      }
    }
  },
  "paths": {
    "logs": "logs",
    "pids": ".pids",
    ...
  }
}
```

## How to Use

### Backend (TypeScript)

```typescript
import { getServiceConfig, getApiUrl } from '../shared/config.js';

// Get service URL
const asrUrl = getServiceConfig('asr').url; // wss://localhost:10095

// Get API endpoint
const endpoint = getApiUrl('voice.asr'); // http://localhost:8002/api/voice/asr
```

### Frontend (TypeScript)

```typescript
import api from '@/config/api';

// Use typed API client
fetch(api.voice.asr())  // http://localhost:8002/api/voice/asr
fetch(api.voice.status())  // http://localhost:8002/api/voice/status
```

### Shell Scripts

```bash
#!/bin/bash
source ./scripts/load-config.sh

# Use environment variables
echo "Backend port: $BACKEND_PORT"
echo "ASR container: $ASR_CONTAINER"
echo "Logs dir: $LOGS_DIR"

docker start "$ASR_CONTAINER"
```

## Updated Files

### Backend
- ✅ `backend/src/utils/config.ts` - Now loads from centralized config
- ✅ `backend/src/services/FunASRService.ts` - Uses config for URL and SSL
- ✅ `backend/src/services/ServiceManager.ts` - Uses config for container name

### Frontend
- ✅ `apps/web/client/src/config/api.ts` - Typed API client

### Scripts
- ✅ `start-services.sh` - Uses config variables
- ✅ `stop-services.sh` - Uses config variables
- ✅ `scripts/load-config.sh` - Configuration loader

## Example: Changing ASR Port

**Before (had to update 5+ files):**
```bash
# backend/src/services/FunASRService.ts
private wsUrl = 'wss://localhost:10095';

# backend/src/services/ServiceManager.ts
wsUrl: 'wss://localhost:10095',

# start-services.sh
-p 10095:10095

# frontend API calls
fetch('http://localhost:8002/api/voice/asr')
```

**After (update 1 file):**
```json
// config/services.json
{
  "services": {
    "asr": {
      "port": 10096,  // Changed!
      "url": "wss://localhost:10096"
    }
  }
}
```

All code automatically uses the new port!

## Testing

```bash
# Test config loader
./scripts/load-config.sh

# View loaded configuration
./scripts/load-config.sh print_config

# Test backend
cd backend && node -e "import('./src/utils/config.js').then(c => console.log(c.config.port))"

# Start services with new config
./start-services.sh
```

## Documentation

See `docs/CONFIGURATION.md` for complete documentation including:
- Full API reference
- Environment variable overrides
- Migration guide from hardcoded values
- Troubleshooting
- JSON schema validation

## Next Steps

1. All existing hardcoded endpoints are now centralized
2. Future services should be added to `config/services.json`
3. Use helper functions to access configuration
4. Never hardcode URLs/ports in code again!

## Files Created

1. `config/services.json` - Master configuration
2. `config/services.schema.json` - JSON schema
3. `shared/config.ts` - TypeScript loader
4. `apps/web/client/src/config/api.ts` - Frontend API config
5. `scripts/load-config.sh` - Bash loader
6. `docs/CONFIGURATION.md` - Complete documentation
7. `docs/CONFIGURATION_SUMMARY.md` - This file
