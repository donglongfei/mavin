# Local Voice Service Setup Guide

## Overview

Mavin's Local Voice Service provides:
- **ASR (Automatic Speech Recognition)** using Faster-Whisper
- **TTS (Text-to-Speech)** using Piper TTS
- **MUSA GPU Support** with automatic fallback to CPU

## Prerequisites

- Python 3.8 or higher
- Node.js 18 or higher
- MUSA GPU (optional - Moore Threads GPU)
- 4GB+ disk space for models

## Installation

### Step 1: Install Python Dependencies

```bash
cd backend/python

# For CPU-only (works on all systems)
pip install -r requirements.txt

# For MUSA GPU (Moore Threads GPU)
pip install torch-musa  # Follow MUSA installation guide
pip install -r requirements.txt

# For NVIDIA CUDA GPU
# Install PyTorch with CUDA from: https://pytorch.org/get-started/locally/
# Then install requirements:
pip install -r requirements.txt
```

### Step 2: Verify Installation

```bash
# Test ASR
python3 local_asr.py --help

# Test TTS
python3 local_tts.py --help

# Check available devices
python3 -c "import torch; print('CUDA available:', torch.cuda.is_available())"
```

### Step 3: Download Models

Models are downloaded automatically on first use, but you can pre-download:

#### ASR Models (Whisper)
Models are downloaded to `~/.cache/whisper/`:
- `tiny` - 75MB (fastest, lowest quality)
- `base` - 145MB (good balance) **← Default**
- `small` - 488MB (better quality)
- `medium` - 1.5GB (high quality)
- `large-v3` - 3GB (best quality, slower)

#### TTS Models (Piper)
Models are downloaded to `~/.local/share/piper/voices/`:
- English (US): `en_US-lessac-medium` **← Default**
- English (GB): `en_GB-alan-medium`
- Chinese: `zh_CN-huayan-medium`

Models download automatically on first use.

## MUSA GPU Support

### What is MUSA?

MUSA is Moore Threads' GPU architecture. To use it:

1. Install MUSA drivers and toolkit
2. Install `torch-musa`: `pip install torch-musa`
3. The service will automatically detect and use MUSA GPU

### Check MUSA Support

```python
import torch_musa
print("MUSA available:", torch_musa.is_available())
print("MUSA devices:", torch_musa.device_count())
```

### Fallback Behavior

If MUSA is not available, the service automatically falls back to:
1. NVIDIA CUDA GPU (if available)
2. CPU (always available)

The service will log which device is being used.

## API Endpoints

### 1. Service Status

```bash
GET /api/voice/status
```

Returns:
```json
{
  "success": true,
  "status": {
    "asr": {
      "available": true,
      "models": ["tiny", "base", "small", "medium", "large"]
    },
    "tts": {
      "available": true,
      "voices": [...]
    }
  }
}
```

### 2. Speech-to-Text (ASR)

```bash
POST /api/voice/asr
Content-Type: multipart/form-data

audio: <audio file>
model: "base"  # optional: tiny, base, small, medium, large
language: "en" # optional: en, zh, ja, etc.
```

Returns:
```json
{
  "success": true,
  "result": {
    "text": "Hello, how are you?",
    "language": "en",
    "device": "cpu",
    "processingTime": 0.5
  }
}
```

### 3. Text-to-Speech (TTS)

```bash
POST /api/voice/tts
Content-Type: application/json

{
  "text": "Hello, this is a test.",
  "voice": "en_US-lessac-medium",  # optional
  "speed": 1.0                      # optional: 0.5 - 2.0
}
```

Returns:
```json
{
  "success": true,
  "result": {
    "audioUrl": "/audio/tts_abc123.wav",
    "fileSize": 12345,
    "processingTime": 0.3
  }
}
```

### 4. Full Conversation Turn

Send audio, get AI response as audio:

```bash
POST /api/voice/conversation
Content-Type: multipart/form-data

audio: <audio file>
conversationId: "conv_123"  # optional
model: "claude"             # optional: claude, gpt-4
asrModel: "base"           # optional
voice: "en_US-lessac-medium"  # optional
```

Returns:
```json
{
  "success": true,
  "result": {
    "conversationId": "conv_123",
    "userText": "What is the weather?",
    "aiText": "I don't have access to real-time weather...",
    "aiAudioUrl": "/audio/tts_xyz789.wav",
    "totalTime": 2.5
  }
}
```

## Testing

### Test ASR

```bash
# Record audio or use existing file
curl -X POST http://localhost:8002/api/voice/asr \
  -F "audio=@test.mp3" \
  -F "model=base"
```

### Test TTS

```bash
curl -X POST http://localhost:8002/api/voice/tts \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello world"}'
```

### Test Full Conversation

```bash
curl -X POST http://localhost:8002/api/voice/conversation \
  -F "audio=@question.mp3" \
  -F "model=claude"
```

## Performance

### ASR (Whisper)

| Model  | Size  | CPU Time* | MUSA/CUDA Time* |
|--------|-------|-----------|-----------------|
| tiny   | 75MB  | ~1s       | ~0.3s          |
| base   | 145MB | ~2s       | ~0.5s          |
| small  | 488MB | ~5s       | ~1s            |
| medium | 1.5GB | ~12s      | ~2s            |
| large  | 3GB   | ~30s      | ~5s            |

*For 10-second audio clip

### TTS (Piper)

- Very fast on CPU (~0.3-0.5s for typical sentence)
- Real-time capable
- Low memory usage (~100MB)

## Troubleshooting

### "Module 'faster_whisper' not found"

```bash
pip install faster-whisper
```

### "Module 'piper' not found"

```bash
pip install piper-tts
```

### TTS Model Download Fails

Download manually:
```bash
cd ~/.local/share/piper/voices
wget https://huggingface.co/rhasspy/piper-voices/resolve/main/en_US/lessac/medium/en_US-lessac-medium.onnx
wget https://huggingface.co/rhasspy/piper-voices/resolve/main/en_US/lessac/medium/en_US-lessac-medium.onnx.json
```

### MUSA GPU Not Detected

```bash
# Check MUSA installation
python3 -c "import torch_musa; print(torch_musa.is_available())"

# Check drivers
lsmod | grep musa
```

### Service Initialization Fails

Check logs:
```bash
tail -f /tmp/backend.log
```

The service will gracefully degrade to available features.

## Model Storage Locations

- Whisper models: `~/.cache/whisper/`
- Piper models: `~/.local/share/piper/voices/`
- Temp audio files: `/tmp/mavin-uploads/`
- Generated audio: `backend/public/audio/`

## Cleanup

Old audio files are automatically cleaned up after 1 hour. Manual cleanup:

```bash
curl -X POST http://localhost:8002/api/voice/cleanup
```

## Advanced Configuration

### Custom Model Paths

Edit `backend/src/services/LocalASRService.ts` and `LocalTTSService.ts` to customize model paths.

### Custom Voices

Download more voices from:
https://github.com/rhasspy/piper/blob/master/VOICES.md

Place in `~/.local/share/piper/voices/`

### GPU Memory Optimization

For MUSA/CUDA, use smaller models if GPU memory is limited:
- ASR: Use `tiny` or `base` model
- TTS: Use `low` quality voices

## Architecture

```
User Audio
    ↓
[LocalASRService] → faster-whisper → MUSA/CUDA/CPU
    ↓
User Text
    ↓
[OpenClawService] → AI Model (Claude/GPT-4)
    ↓
AI Text
    ↓
[LocalTTSService] → piper-tts → CPU
    ↓
AI Audio
```

## Production Deployment

For production:
1. Pre-download all models
2. Use PM2 or Docker for process management
3. Set up log rotation
4. Configure audio file cleanup cron job
5. Use NGINX for serving static audio files
6. Monitor GPU memory usage

## License

- Faster-Whisper: MIT License
- Piper TTS: MIT License
- Whisper Models: OpenAI License

## Support

For issues:
1. Check logs: `tail -f /tmp/backend.log`
2. Test Python scripts directly: `python3 backend/python/local_asr.py`
3. Verify dependencies: `pip list | grep -E "faster-whisper|piper"`
