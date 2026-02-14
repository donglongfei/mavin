# MT LiteTTS Streaming Service - Quick Start

**Status**: ✅ Implemented and Tested

## Features

1. **Auto-play Mode** - Returns audio buffer for immediate playback (no file saved)
2. **Complete Synthesis** - Returns both buffer and saves file
3. **Streaming Mode** - WebSocket-based chunk streaming (for future use)
4. **Automatic Cleanup** - Removes old audio files

## Installation

```bash
# Install dependencies
cd backend
pnpm install

# Python dependencies already installed:
# - mt-litetts
# - torch
# - pypinyin
# - scipy
```

## Usage

### Method 1: Auto-play (Recommended)

**Returns audio buffer without saving file**

```typescript
import { mtLiteTTSStreaming } from './services/MTLiteTTSStreamingService';

// Initialize
await mtLiteTTSStreaming.initialize();

// Synthesize to buffer (auto-play ready)
const { audio, result } = await mtLiteTTSStreaming.synthesizeToBuffer('你好世界');

// Send to browser for auto-play
res.set('Content-Type', 'audio/wav').send(audio);
```

### Method 2: Complete Synthesis

**Returns buffer AND saves file**

```typescript
const result = await mtLiteTTSStreaming.synthesize('你好世界');

// Access audio buffer
const buffer = result.audioBuffer;

// Or use saved file
const audioUrl = result.audioUrl; // '/audio/tts_mt_stream_xxx.wav'
```

### Method 3: Streaming (Advanced)

**For WebSocket real-time streaming**

```typescript
// Start WebSocket server
await mtLiteTTSStreaming.startWebSocketServer();

// Stream chunks as they're ready
for await (const chunk of await mtLiteTTSStreaming.synthesizeStreaming(text, 50)) {
  console.log(`Chunk ${chunk.chunkIndex + 1}/${chunk.totalChunks}`);
  console.log(`Audio: ${chunk.audioBuffer.length} bytes`);

  // Send chunk to client
  ws.send(chunk.audioBuffer);
}
```

## Test Results

✅ All tests passed successfully:

```
Test 1: Complete Mode Synthesis
   - Text: 25 chars
   - Output: 676KB audio buffer
   - Time: 8.9s (includes model loading)
   - Processing: 1.6s

Test 2: Auto-play Mode
   - Text: 10 chars
   - Output: 404KB audio buffer
   - Time: 8.7s
   - Ready for immediate playback: YES

Test 3: Long Text (111 chars)
   - Output: 3.7MB audio buffer
   - Time: 10.7s
   - Speed: 10.4 chars/sec
```

## HTTP API Example

Add to your Express routes:

```typescript
import { mtLiteTTSStreaming } from './services/MTLiteTTSStreamingService';

// Auto-play endpoint (no file saved)
app.post('/api/tts/speak', async (req, res) => {
  const { text } = req.body;

  const { audio } = await mtLiteTTSStreaming.synthesizeToBuffer(text);

  res.set('Content-Type', 'audio/wav');
  res.send(audio);
});

// With file endpoint
app.post('/api/tts/synthesize', async (req, res) => {
  const { text } = req.body;

  const result = await mtLiteTTSStreaming.synthesize(text);

  res.json({
    success: true,
    audioUrl: result.audioUrl,
    audioBuffer: result.audioBuffer.toString('base64'),
    duration: result.totalTime
  });
});
```

## Browser Integration

```typescript
// Frontend: Auto-play TTS
async function playTTS(text: string) {
  const response = await fetch('/api/tts/speak', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  });

  const audioBlob = await response.blob();
  const audioUrl = URL.createObjectURL(audioBlob);

  const audio = new Audio(audioUrl);
  audio.play();
}

// Usage
playTTS('你好世界'); // Plays immediately
```

## Service Info

```typescript
const info = mtLiteTTSStreaming.getInfo();
// {
//   name: 'MT LiteTTS Streaming',
//   voice: 'cheng-xiaoke',
//   displayName: '程小可 (Cheng Xiaoke)',
//   language: 'zh-CN',
//   model: 'mt_litetts_v4d',
//   streaming: true
// }
```

## File Cleanup

```typescript
// Cleanup files older than 1 hour
await mtLiteTTSStreaming.cleanupOldFiles(3600000);

// Cleanup all files
await mtLiteTTSStreaming.cleanupOldFiles(0);
```

## Performance Tips

1. **First call is slow** - Model loads on first synthesis (~8s)
2. **Subsequent calls are fast** - Model stays in memory (~1-2s)
3. **Use auto-play mode** - Saves disk I/O when file isn't needed
4. **Long text** - Automatically splits and processes efficiently

## Files Created

- ✅ `MTLiteTTSStreamingService.ts` - TypeScript service
- ✅ `mt_litetts_streaming.py` - Python streaming implementation
- ✅ `mt_litetts_ws_server.py` - WebSocket server (optional)
- ✅ `test_mt_streaming.py` - Python test client
- ✅ `test-mt-litetts-streaming.ts` - Complete test suite
- ✅ `__tests__/MTLiteTTSStreaming.test.ts` - Jest unit tests

## Next Steps

1. ✅ Service implemented and tested
2. 🔲 Add HTTP routes to backend
3. 🔲 Integrate with voice conversation flow
4. 🔲 Add browser auto-play UI
5. 🔲 Test WebSocket streaming mode (optional)

## Troubleshooting

**Model loading is slow**
- Normal on first call (8-10s)
- Model stays in memory after first call
- Subsequent calls are much faster (1-2s)

**Memory usage**
- Model uses ~2GB RAM when loaded
- Consider using separate process for production

**Audio quality**
- Using 程小可 (Cheng Xiaoke) premium voice
- Sample rate: 22050 Hz
- Format: WAV (16-bit PCM)

---

**Documentation**: `docs/VOICE.md`
**Test Script**: `backend/test-mt-litetts-streaming.ts`
**Run Tests**: `cd backend && pnpm exec tsx test-mt-litetts-streaming.ts`
