# MooER ASR Daemon Setup

## Overview

The MooER ASR service runs as a **persistent daemon** that:
- Loads the MooER-MTL-80K model once at startup (7B parameters, ~2GB)
- Keeps the model in memory for fast subsequent requests
- Provides HTTP API on port 5001
- Uses MUSA GPU for inference

## Architecture

```
Frontend (Port 3003)
    ↓
Backend API (Port 8002)
    ↓
MooER Daemon (Port 5001) [MUSA GPU]
    ↓
MooER-MTL-80K Model (loaded in memory)
```

## Daemon Management

### Start the daemon:
```bash
cd /home/mt/mavin/backend/python
./mooer_daemon.sh start
```

**First run**: Model will download (~2GB) and load (5-10 minutes)
**Subsequent runs**: Model loads from cache (faster)

### Check status:
```bash
./mooer_daemon.sh status
```

### View logs:
```bash
./mooer_daemon.sh logs
# or
tail -f /tmp/mooer_daemon.log
```

### Stop the daemon:
```bash
./mooer_daemon.sh stop
```

### Restart the daemon:
```bash
./mooer_daemon.sh restart
```

## Current Status

**MooER Daemon**: Loading (check with `./mooer_daemon.sh status`)
**Backend**: Running on port 8002
**Frontend**: Running on port 3003
**MT LiteTTS**: MUSA GPU acceleration enabled

## Testing Voice Conversation

1. **Wait for MooER to load** (5-10 minutes first time):
   ```bash
   cd /home/mt/mavin/backend/python
   ./mooer_daemon.sh status
   ```

   When ready, you'll see: `Status: {"status":"ready","ready":true}`

2. **Test voice conversation** at http://localhost:3003:
   - Click digital avatar
   - Speak (Chinese or English)
   - MooER transcribes your speech (fast after initial load)
   - MT LiteTTS generates audio response with MUSA GPU
   - Audio plays back

## API Endpoints

### Health Check
```bash
curl http://localhost:5001/health
```

Response when ready:
```json
{
  "status": "ready",
  "ready": true,
  "device": "musa",
  "model": "MooER-MTL-80K"
}
```

### Transcribe Audio
```bash
curl -X POST http://localhost:5001/transcribe \
  -F "audio=@recording.webm"
```

Response:
```json
{
  "success": true,
  "text": "transcribed text here",
  "language": "auto",
  "device": "musa",
  "processing_time": 0.5
}
```

## Performance

- **First request**: 5-10 minutes (model loading)
- **Subsequent requests**: 0.5-2 seconds (model in memory)
- **MUSA GPU**: Full acceleration for inference
- **Memory usage**: ~1-2GB for loaded model

## Troubleshooting

### Check if daemon is running:
```bash
ps aux | grep mooer_daemon.py
```

### Check daemon logs:
```bash
tail -100 /tmp/mooer_daemon.log
```

### Restart if stuck:
```bash
cd /home/mt/mavin/backend/python
./mooer_daemon.sh restart
```

### Manual start (debug mode):
```bash
cd /home/mt/mavin/backend/python
python3 mooer_daemon.py
```

## Files

- `mooer_daemon.py` - Flask HTTP server with MooER model
- `mooer_daemon.sh` - Daemon control script
- `/tmp/mooer_daemon.log` - Daemon logs
- `/tmp/mooer_daemon.pid` - Process ID file

## Environment Variables

- `MOOER_PORT` - Daemon port (default: 5001)
- `MOOER_DAEMON_URL` - Backend uses this (default: http://localhost:5001)
