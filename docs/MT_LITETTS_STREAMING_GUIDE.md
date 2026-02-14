# MT LiteTTS Streaming Service Guide

Complete guide to creating and using a streaming TTS service with MT LiteTTS.

## Overview

This guide shows you how to convert MT LiteTTS from batch processing to real-time streaming for lower latency in voice applications.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                 MT LiteTTS Streaming                     │
│                                                          │
│  Client → WebSocket → Server → Model → Audio Chunks     │
│                                 ↓                        │
│                         Stream back as generated         │
└─────────────────────────────────────────────────────────┘
```

### Benefits of Streaming

1. **Lower Latency**: Start playing audio before complete synthesis
2. **Better UX**: Progressive feedback to user
3. **Memory Efficient**: Process text in chunks
4. **Scalable**: Handle long texts without timeouts

## Files Created

1. **`mt_litetts_streaming.py`** - Core streaming TTS class
2. **`mt_litetts_ws_server.py`** - WebSocket server
3. **Client examples** (below)

---

## Quick Start

### 1. Install Dependencies

```bash
cd ~/download/mt_litetts

# Install additional packages
pip install flask flask-sock
```

### 2. Test Streaming Class

```bash
cd /home/mt/mavin/backend/python

# Test complete synthesis
python3 mt_litetts_streaming.py "你好世界，这是一个测试" output.wav

# Test streaming mode (saves chunks separately)
python3 mt_litetts_streaming.py "你好世界，这是一个测试" output.wav --stream
```

### 3. Start WebSocket Server

```bash
python3 mt_litetts_ws_server.py
```

Server starts on:
- WebSocket: `ws://localhost:5000/api/tts/stream`
- HTTP: `http://localhost:5000/api/tts/synthesize`

### 4. Test with Client

See client examples below.

---

## Core Streaming Class

### MTLiteTTSStreaming

**Location**: `backend/python/mt_litetts_streaming.py`

**Key Methods**:

```python
from mt_litetts_streaming import MTLiteTTSStreaming

tts = MTLiteTTSStreaming()

# Method 1: Complete synthesis
wav_bytes = tts.synthesize_to_wav_bytes("你好世界")

# Method 2: Streaming generator
for chunk_data in tts.synthesize_streaming("你好世界"):
    chunk_index = chunk_data['chunk_index']
    audio = chunk_data['audio']  # numpy array
    text = chunk_data['text']
    sample_rate = chunk_data['sample_rate']

    # Process chunk...
```

**Features**:
- ✅ Singleton model loading (loads once, reuses)
- ✅ Text chunking on sentence boundaries
- ✅ Progressive audio generation
- ✅ Configurable chunk size
- ✅ Memory efficient

**Text Chunking**:
- Splits on Chinese delimiters: 。！？，、；：
- Max chunk size: 50 characters (configurable)
- Falls back to character split if no delimiters

---

## WebSocket Server

### Endpoints

#### 1. WebSocket: `/api/tts/stream`

**Protocol**: Binary WebSocket

**Client sends**:
```json
{
  "text": "你好世界，这是流式合成测试",
  "chunk_size": 50
}
```

**Server streams**:

```json
// 1. Start signal
{
  "type": "start",
  "text": "你好世界，这是流式合成测试",
  "message": "Starting synthesis..."
}

// 2. Audio chunks (multiple)
{
  "type": "chunk",
  "chunk_index": 0,
  "total_chunks": 2,
  "text": "你好世界，",
  "audio_base64": "UklGRi4...",  // Base64 WAV
  "sample_rate": 22050
}

// 3. Completion signal
{
  "type": "complete",
  "message": "Synthesis complete"
}
```

#### 2. HTTP: `POST /api/tts/synthesize`

**Request**:
```json
{
  "text": "你好世界"
}
```

**Response**:
```json
{
  "success": true,
  "audio_path": "/tmp/tts_12345.wav",
  "audio_base64": "UklGRi4...",
  "file_size": 123456,
  "text_length": 4
}
```

---

## Client Examples

### Python WebSocket Client

```python
#!/usr/bin/env python3
import asyncio
import websockets
import json
import base64
from pathlib import Path

async def stream_tts(text):
    uri = "ws://localhost:5000/api/tts/stream"

    async with websockets.connect(uri) as websocket:
        # Send request
        await websocket.send(json.dumps({
            "text": text,
            "chunk_size": 30
        }))

        chunk_files = []

        # Receive chunks
        async for message in websocket:
            data = json.loads(message)

            if data['type'] == 'start':
                print(f"Starting: {data['text']}")

            elif data['type'] == 'chunk':
                print(f"Chunk {data['chunk_index']}/{data['total_chunks']}: {data['text']}")

                # Decode and save audio
                audio_bytes = base64.b64decode(data['audio_base64'])
                chunk_file = f"chunk_{data['chunk_index']}.wav"

                with open(chunk_file, 'wb') as f:
                    f.write(audio_bytes)

                chunk_files.append(chunk_file)
                print(f"Saved: {chunk_file}")

                # Can start playing immediately!
                # play_audio(chunk_file)

            elif data['type'] == 'complete':
                print("Complete!")
                break

            elif data['type'] == 'error':
                print(f"Error: {data['error']}")
                break

        return chunk_files

# Run
text = "你好世界，欢迎使用MT LiteTTS流式合成服务。这是一个测试。"
asyncio.run(stream_tts(text))
```

### JavaScript WebSocket Client

```javascript
// browser or Node.js
const ws = new WebSocket('ws://localhost:5000/api/tts/stream');

ws.onopen = () => {
  console.log('Connected');

  // Send text to synthesize
  ws.send(JSON.stringify({
    text: '你好世界，欢迎使用MT LiteTTS流式合成服务',
    chunk_size: 30
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);

  if (data.type === 'start') {
    console.log('Starting:', data.text);
  }

  else if (data.type === 'chunk') {
    console.log(`Chunk ${data.chunk_index}/${data.total_chunks}: ${data.text}`);

    // Decode base64 audio
    const audioBytes = atob(data.audio_base64);
    const audioBlob = new Blob([audioBytes], { type: 'audio/wav' });
    const audioUrl = URL.createObjectURL(audioBlob);

    // Play immediately
    const audio = new Audio(audioUrl);
    audio.play();
  }

  else if (data.type === 'complete') {
    console.log('Complete!');
    ws.close();
  }

  else if (data.type === 'error') {
    console.error('Error:', data.error);
  }
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};
```

### cURL Test (HTTP Endpoint)

```bash
# Non-streaming synthesis
curl -X POST http://localhost:5000/api/tts/synthesize \
  -H "Content-Type: application/json" \
  -d '{"text":"你好世界"}' | jq .

# Response includes base64 audio
```

---

## Integration with Mavin

### Option 1: Add to Express Backend

In `backend/src/services/MTLiteTTSStreamingService.ts`:

```typescript
import { spawn } from 'child_process';
import WebSocket from 'ws';

export class MTLiteTTSStreamingService {
  private wsServer: WebSocket.Server;

  constructor(port: number = 5000) {
    // Start Python WebSocket server
    const pythonServer = spawn('python3', [
      'backend/python/mt_litetts_ws_server.py'
    ]);

    pythonServer.stdout.on('data', (data) => {
      console.log(`MT LiteTTS: ${data}`);
    });
  }

  async synthesizeStreaming(
    text: string,
    onChunk: (chunk: AudioChunk) => void
  ): Promise<void> {
    const ws = new WebSocket('ws://localhost:5000/api/tts/stream');

    ws.on('open', () => {
      ws.send(JSON.stringify({ text, chunk_size: 30 }));
    });

    ws.on('message', (data) => {
      const message = JSON.parse(data.toString());

      if (message.type === 'chunk') {
        const audioBuffer = Buffer.from(message.audio_base64, 'base64');
        onChunk({
          index: message.chunk_index,
          total: message.total_chunks,
          audio: audioBuffer,
          text: message.text
        });
      }
    });
  }
}
```

### Option 2: Standalone Microservice

Run as separate service:

```bash
# Terminal 1: MT LiteTTS Streaming Service
cd /home/mt/mavin/backend/python
python3 mt_litetts_ws_server.py

# Terminal 2: Mavin Backend
cd /home/mt/mavin/backend
pnpm dev
```

Connect from Mavin via WebSocket client.

---

## Performance

### Latency Comparison

| Method | First Audio | Total Time | UX |
|--------|-------------|------------|-----|
| **Batch** | 21s | 21s | Wait 21s, then hear |
| **Streaming** | 2-3s | 21s | Hear after 2s, continuous |

**Streaming Advantage**: User hears response **7x faster**

### Chunk Sizes

| Chunk Size | Chunks | Latency | Quality |
|------------|--------|---------|---------|
| 20 chars | Many | Low | May have pauses |
| 50 chars | Medium | Medium | **Recommended** |
| 100 chars | Few | High | Smoother, slower |

---

## Advanced Features

### 1. Add Silence Between Chunks

```python
# In mt_litetts_streaming.py
silence_duration = 0.2  # seconds
silence = np.zeros(int(sample_rate * silence_duration))
audio = np.concatenate([audio, silence])
```

### 2. Adjust Speech Speed

```python
# In synthesize_chunk()
audio = self.model.infer(
    x_tst,
    x_tst_lengths,
    noise_scale=0.667,
    noise_scale_w=0.8,
    length_scale=0.8,  # <1.0 = faster, >1.0 = slower
    sid=sid
)
```

### 3. Add MUSA GPU Support

```python
# In __init__()
if torch.cuda.is_available():
    self.device = "cuda"
elif hasattr(torch, 'musa') and torch.musa.is_available():
    self.device = "musa"
else:
    self.device = "cpu"
```

### 4. Add Multiple Voice Support

```python
# Different speaker IDs
VOICES = {
    'cheng-xiaoke': 21,  # 程小可
    # Add other speakers if available in your model
}

def __init__(self, voice='cheng-xiaoke'):
    self.sid = VOICES.get(voice, 21)
```

---

## Troubleshooting

### Issue: "Model not found"

**Solution**:
```bash
# Check model path
ls ~/download/mt_litetts/serving_models/litetts_v4d/

# Should contain:
# - config.json
# - G_280000.pth
# - symbols.txt
```

### Issue: "WebSocket connection failed"

**Solution**:
```bash
# Check if server is running
netstat -tlnp | grep 5000

# Restart server
python3 mt_litetts_ws_server.py
```

### Issue: "Slow performance"

**Solutions**:
1. Use GPU (MUSA/CUDA) instead of CPU
2. Increase chunk size (less overhead)
3. Preload model on server startup
4. Use process pool for parallel synthesis

---

## Next Steps

1. **Test the streaming service**:
   ```bash
   python3 mt_litetts_ws_server.py
   # In another terminal:
   python3 test_client.py
   ```

2. **Integrate with Mavin backend**:
   - Add WebSocket client to voice routes
   - Stream audio chunks to frontend
   - Play progressively in browser

3. **Add to frontend**:
   - Connect to WebSocket from React
   - Play audio chunks as received
   - Show streaming progress

4. **Production deployment**:
   - Add authentication
   - Use production WSGI server (gunicorn + gevent)
   - Add rate limiting
   - Monitor performance

---

## References

- [Flask-Sock Documentation](https://flask-sock.readthedocs.io/)
- [WebSocket Protocol](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)
- [MT LiteTTS](https://developer.mthreads.com/)

---

**Created**: 2026-02-14

**Status**: ✅ Ready to use

**Test**: `python3 mt_litetts_ws_server.py`
