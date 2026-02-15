# Service Scripts Summary

## Created Files

1. **start-services.sh** - Start all services (ASR, TTS, Backend, OpenClaw check)
2. **stop-services.sh** - Stop all services gracefully
3. **test-services.sh** - Unit tests for service scripts (26 tests)
4. **status-services.sh** - Check current status of all services
5. **SERVICES_README.md** - Complete documentation

## Test Results

✅ **All 26 tests passed (100% pass rate)**

Test coverage:
- Script files existence
- Script executability
- Bash syntax validation
- Docker environment
- Container status
- Directory structure
- Backend environment (Node.js, pnpm, Python3)
- Backend files
- Python service scripts
- OpenClaw integration
- Port availability
- Script helper functions
- ASR Docker image (5.9GB verified)

## Command Corrections

### Your Original Commands

❌ **docker start -ai local_asr_server**
```bash
# Issues:
# - -a flag: Attaches to container output (blocks terminal)
# - -i flag: Keeps STDIN open (interactive mode)
# - Not suitable for daemon services
```

✅ **Corrected:**
```bash
docker start local_asr_server  # Detached mode, runs in background
```

### FunASR Service Command

✅ **Your command is correct**, but needs to run INSIDE the container:
```bash
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
    --vad-dir /workspace/models/damo/speech_fsmn_vad_zh-cn-16k-common-onnx
"
# The -d flag runs the command in detached mode inside the container
```

### Docker Load Command

✅ **Your command is correct:**
```bash
docker load -i infra/docker/m1000_local_asr_server.tar
```
This loads the ASR Docker image (5.9GB) into Docker.

## Usage

### Check Status
```bash
./status-services.sh
```

Output shows:
- ASR Container status (running/stopped)
- TTS Service status (with PID)
- OpenClaw availability
- Backend API status (with port check)

### Run Tests
```bash
./test-services.sh
```

Validates:
- Scripts are properly configured
- Dependencies are installed
- Docker environment is ready
- Ports are available

### Start All Services
```bash
./start-services.sh
```

This will:
1. Start ASR Docker container (or create if doesn't exist)
2. Launch FunASR service inside container
3. Start TTS service (MT-LiteTTS)
4. Verify OpenClaw CLI is available
5. Start Backend webserver (Express)
6. Wait for services to be ready
7. Display service endpoints and log locations

### Stop All Services
```bash
./stop-services.sh
```

This will:
1. Stop Backend webserver gracefully
2. Stop TTS service gracefully
3. Stop ASR Docker container (preserves container for next start)

## Safety Features

✅ **No automatic shutdown or logout**
- Scripts only manage the 4 services (ASR, TTS, OpenClaw, Backend)
- No system-level commands (shutdown, reboot, logout)
- Requires user approval for all actions

✅ **Graceful cleanup**
- Processes stopped with SIGTERM first
- SIGKILL only if process doesn't respond
- PID files tracked in `.pids/` directory
- Stale PIDs automatically cleaned up

✅ **Error handling**
- Scripts use `set -e` (exit on error)
- Service availability checks before operations
- Timeout handling for startup waits
- Clear error messages

## Service Architecture

```
┌─────────────────────────────────────────────┐
│           Mavin Backend (Express)           │
│              Port: 8002                     │
│         (Node.js + TypeScript)              │
└─────────────────────────────────────────────┘
           │         │          │
           │         │          │
           ▼         ▼          ▼
    ┌──────────┐ ┌──────────┐ ┌──────────┐
    │   ASR    │ │   TTS    │ │ OpenClaw │
    │  Docker  │ │  Python  │ │   CLI    │
    │ :10095   │ │          │ │          │
    └──────────┘ └──────────┘ └──────────┘
```

## Current Status

Run `./status-services.sh` to see:
- All services are currently stopped
- OpenClaw CLI is available
- Ready to start with `./start-services.sh`

## Next Steps

1. Run tests: `./test-services.sh`
2. Check status: `./status-services.sh`
3. Start services: `./start-services.sh`
4. Monitor logs: `tail -f logs/*.log`
5. Access backend: http://localhost:8002/health
6. Stop when done: `./stop-services.sh`
