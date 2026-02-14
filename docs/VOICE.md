# Mavin Voice Services

**Complete Guide to Voice Conversation in Mavin**

**Last Updated**: 2026-02-14

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Architecture](#architecture)
3. [Services](#services)
4. [API Reference](#api-reference)
5. [Frontend Integration](#frontend-integration)
6. [Configuration](#configuration)
7. [Troubleshooting](#troubleshooting)
8. [Migration Notes](#migration-notes)

---

## Quick Start

### Installation

```bash
# Install Python dependencies
pip install faster-whisper piper-tts

# Optional: MT LiteTTS for premium Chinese TTS
pip install mt-litetts
```

### Environment Setup

Create `.env` file:

```bash
# AI Integration (required for voice conversations)
OPENAI_API_KEY=sk-your-key-here
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

### Start Services

```bash
# Backend
cd backend
pnpm install
pnpm dev

# Frontend
cd apps/web/client
pnpm dev
```

### Test Voice

1. **Check Status:**
   ```bash
   curl http://localhost:8002/api/voice/status
   ```

2. **Test TTS:**
   ```bash
   curl -X POST http://localhost:8002/api/voice/tts \
     -H "Content-Type: application/json" \
     -d '{"text":"Hello, world!"}'
   ```

3. **Test ASR:**
   ```bash
   curl -X POST http://localhost:8002/api/voice/asr \
     -F "audio=@test.wav"
   ```

---

## Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Mavin Voice System                    │
│                                                          │
│  User Audio → ASR → Text → AI → Text → TTS → Audio     │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │         LocalVoiceService (Coordinator)            │ │
│  │                                                     │ │
│  │  ┌──────────────┐         ┌──────────────┐       │ │
│  │  │  LocalASR    │         │  LocalTTS    │       │ │
│  │  │ (Faster-     │         │  (Piper TTS) │       │ │
│  │  │  Whisper)    │         │              │       │ │
│  │  └──────────────┘         └──────────────┘       │ │
│  └────────────────────────────────────────────────────┘ │
│                           ↓                              │
│                    OpenClaw (AI)                         │
│                  GPT-4 / Claude                          │
└─────────────────────────────────────────────────────────┘
```

### Service Tiers

**Tier 1: Default (Cross-platform)**
- ASR: Faster-Whisper (MUSA/CUDA/CPU auto-fallback)
- TTS: Piper TTS (CPU-efficient)
- Best for: Development, offline, multi-platform

**Tier 2: Optional Production**
- ASR: FunASR Docker (Chinese, WebSocket streaming)
- TTS: MT LiteTTS (Premium MUSA voice)
- Best for: Production Chinese, high quality

**Tier 3: AI Integration**
- Chat: OpenClaw → GPT-4 / Claude
- Required for conversation

### Conversation Flow

```
1. User clicks avatar
   ↓
2. Browser records audio (Web Audio API)
   ↓
3. Audio → ASR → Transcribed text
   ↓
4. Text displayed in chat
   ↓
5. Text → OpenClaw → AI Response
   ↓
6. AI response displayed in chat
   ↓
7. AI response → TTS → Audio
   ↓
8. Audio plays through speakers
   ↓
9. Avatar returns to idle
```

---

## Services

### 1. Faster-Whisper ASR (Default)

**Technology**: OpenAI Whisper optimized with CTranslate2

**Features**:
- 99+ languages
- Multiple model sizes (tiny to large)
- MUSA/CUDA/CPU auto-fallback
- Word-level timestamps
- 4x faster than original Whisper

**Location**: `backend/src/services/LocalASRService.ts`

**Models**:

| Model | Size | VRAM | Speed | Accuracy |
|-------|------|------|-------|----------|
| tiny | 39MB | 1GB | ⚡⚡⚡ | ⭐⭐ |
| base | 74MB | 1GB | ⚡⚡ | ⭐⭐⭐ (Default) |
| small | 244MB | 2GB | ⚡ | ⭐⭐⭐⭐ |
| medium | 769MB | 5GB | 🐌 | ⭐⭐⭐⭐⭐ |
| large | 1.5GB | 10GB | 🐌🐌 | ⭐⭐⭐⭐⭐ |

**Usage**:
```typescript
import { localVoice } from './services/LocalVoiceService';

const result = await localVoice.speechToText('/path/to/audio.wav', {
  model: 'base',
  language: 'en'  // Optional: auto-detect if omitted
});

console.log(result.text);         // Transcribed text
console.log(result.device);       // 'musa', 'cuda', or 'cpu'
console.log(result.processingTime); // Seconds
```

### 2. Piper TTS (Default)

**Technology**: Neural TTS optimized for CPU

**Features**:
- Fast CPU inference (1-2s)
- Multiple voices/languages
- High-quality neural synthesis
- No GPU required
- Offline operation

**Location**: `backend/src/services/LocalTTSService.ts`

**Voices**:

| Voice | Language | Gender | Quality |
|-------|----------|--------|---------|
| en_US-lessac-medium | English (US) | Male | Medium (Default) |
| en_US-amy-medium | English (US) | Female | Medium |
| en_GB-alan-medium | English (UK) | Male | Medium |
| zh_CN-huayan-medium | Chinese | Female | Medium |

**Usage**:
```typescript
const result = await localVoice.textToSpeech('Hello, world!', {
  voice: 'en_US-lessac-medium',
  speed: 1.0
});

console.log(result.audioUrl);  // '/audio/tts_xyz.wav'
console.log(result.audioPath); // Full path
```

### 3. MT LiteTTS (Optional Premium)

**Technology**: Moore Threads Premium TTS

**Features**:
- Premium 程小可 (Cheng Xiaoke) voice
- MUSA GPU acceleration
- High-quality Chinese synthesis
- On-device processing (no API)

**Installation**:
```bash
pip install mt-litetts
```

**Usage**:
```typescript
import { mtLiteTTS } from './services/MTLiteTTSService';

const result = await mtLiteTTS.synthesize('你好，世界');

console.log(result.audioUrl);  // '/audio/tts_mt_xyz.wav'
console.log(result.voice);     // 'cheng-xiaoke'
console.log(result.backend);   // 'MUSA' or 'CPU'
```

### 4. FunASR Docker (Optional Production)

**Technology**: Alibaba DAMO Academy Production ASR

**Features**:
- 2-pass architecture (real-time + offline)
- Optimized for Chinese (Paraformer)
- WebSocket streaming
- VAD, punctuation, ITN

**Setup**: See [SERVICES.md](./SERVICES.md#funasr-docker-service)

---

## API Reference

### Endpoints

All endpoints are under `/api/voice`:

#### GET /status

Get service availability.

**Response**:
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

#### POST /asr

Speech-to-Text transcription.

**Request**:
```
Content-Type: multipart/form-data

audio: <file>
model: base (optional)
language: en (optional)
```

**Response**:
```json
{
  "success": true,
  "result": {
    "text": "Hello, how are you?",
    "segments": [...],
    "language": "en",
    "duration": 2.5,
    "device": "cuda",
    "processingTime": 0.8
  }
}
```

#### POST /tts

Text-to-Speech synthesis.

**Request**:
```json
{
  "text": "Hello, world!",
  "voice": "en_US-lessac-medium",
  "speed": 1.0
}
```

**Response**:
```json
{
  "success": true,
  "result": {
    "audioUrl": "/audio/tts_abc123.wav",
    "audioPath": "/backend/public/audio/tts_abc123.wav",
    "duration": 1.2,
    "processingTime": 0.5
  }
}
```

#### POST /conversation

Full voice conversation turn.

**Request**:
```
Content-Type: multipart/form-data

audio: <file>
model: claude (gpt-4 | claude)
conversationId: conv_123 (optional)
asrModel: base (optional)
ttsVoice: en_US-lessac-medium (optional)
```

**Response**:
```json
{
  "success": true,
  "result": {
    "userText": "What's the weather?",
    "aiText": "I don't have access to real-time weather...",
    "aiAudioUrl": "/audio/tts_xyz789.wav",
    "totalTime": 3.5
  }
}
```

---

## Frontend Integration

### VoiceConversation Service

**File**: `apps/web/client/src/services/voiceConversation.ts`

**Features**:
- Audio recording (Web Audio API)
- ASR transcription
- Chat integration with context
- TTS synthesis
- Audio playback

**Basic Usage**:
```typescript
import { VoiceConversation } from '@/services/voiceConversation';

const voiceConv = new VoiceConversation({
  conversationId: 'conv_123',
  onStateChange: (state) => {
    // 'idle' | 'listening' | 'thinking' | 'speaking'
    setAvatarState(state);
  },
  onTranscript: (text) => {
    addMessage({ role: 'user', content: text });
  },
  onResponse: (text) => {
    addMessage({ role: 'assistant', content: text });
  },
  onError: (error) => {
    console.error(error);
  }
});

// Start listening
await voiceConv.startListening();

// Stop and process
voiceConv.stopListening();

// Cleanup
voiceConv.cleanup();
```

### DigitalAvatar Component

**File**: `apps/web/client/src/components/DigitalAvatar.tsx`

**States**:

| State | Visual | Description |
|-------|--------|-------------|
| idle | Cyan glow, breathing | Ready |
| listening | Orange pulse, waveform | Recording |
| thinking | Cyan animated dots | Processing |
| speaking | Purple waveform | Playing response |

**Usage**:
```typescript
<DigitalAvatar
  state={avatarState}
  onVoiceClick={handleVoiceClick}
/>
```

### Integration Example

```typescript
function ChatComponent() {
  const [avatarState, setAvatarState] = useState('idle');
  const voiceRef = useRef<VoiceConversation | null>(null);

  useEffect(() => {
    voiceRef.current = new VoiceConversation({
      conversationId: 'main',
      onStateChange: setAvatarState,
      onTranscript: (text) => addMessage('user', text),
      onResponse: (text) => addMessage('assistant', text),
      onError: (err) => showError(err)
    });

    return () => voiceRef.current?.cleanup();
  }, []);

  const handleVoiceClick = async () => {
    if (avatarState === 'listening') {
      voiceRef.current?.stopListening();
    } else {
      await voiceRef.current?.startListening();
    }
  };

  return (
    <div>
      <DigitalAvatar
        state={avatarState}
        onVoiceClick={handleVoiceClick}
      />
      <ChatMessages messages={messages} />
    </div>
  );
}
```

### Browser Requirements

**Required APIs**:
- Web Audio API
- MediaDevices API
- Fetch API

**Supported Browsers**:
- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Edge 79+
- ✅ Safari 14+
- ❌ IE 11

**Audio Formats**:
- Recording: WebM with Opus
- Playback: WAV

---

## Configuration

### Environment Variables

```bash
# Voice service configuration (optional)
VOICE_ASR_MODEL=base           # Default ASR model
VOICE_TTS_VOICE=en_US-lessac-medium  # Default TTS voice
VOICE_CLEANUP_INTERVAL=3600000 # Cleanup old files (ms)

# FunASR Docker (optional)
FUNASR_WSS_URL=wss://localhost:10095

# AI integration (required for conversation)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

### Backend Initialization

In `backend/src/index.ts`:

```typescript
import { localVoice } from './services/LocalVoiceService';

// Initialize on startup
await localVoice.initialize();

// Start cleanup loop (optional)
setInterval(async () => {
  await localVoice.cleanup(3600000); // 1 hour
}, 600000); // Every 10 minutes
```

### Model Cache Locations

```
~/.cache/huggingface/hub/     # Faster-Whisper models
~/.local/share/piper-tts/     # Piper TTS voices
/workspace/models/            # FunASR (Docker only)
```

---

## Troubleshooting

### ASR Issues

**Problem**: "faster-whisper not installed"

**Solution**:
```bash
pip install faster-whisper
```

**Problem**: Slow transcription on CPU

**Solutions**:
- Use smaller model: `model: 'tiny'` or `'base'`
- Install CUDA/MUSA for GPU acceleration

**Problem**: Wrong language detected

**Solution**:
- Force language: `language: 'en'` or `'zh'`

### TTS Issues

**Problem**: "piper not found"

**Solutions**:
```bash
# Option 1: Python package
pip install piper-tts

# Option 2: Binary
# Download from: https://github.com/rhasspy/piper/releases
```

**Problem**: Voice not available

**Solutions**:
- Check: `localTTS.getAvailableVoices()`
- Download: `piper --download en_US-lessac-medium`

### Frontend Issues

**Problem**: "Microphone not working"

**Solutions**:
1. Check browser permissions
2. Ensure HTTPS or localhost
3. Verify no other app using mic

**Problem**: "No speech detected"

**Solutions**:
1. Speak louder/closer to mic
2. Check mic volume in settings
3. Ensure recording >1 second

**Problem**: OpenClaw errors

**Solution**:
```bash
# Test OpenClaw
curl http://localhost:8002/api/test/openclaw
```

### Performance Issues

**Expected Timings** (with GPU):

| Stage | Time |
|-------|------|
| Recording | User-controlled |
| ASR (base) | ~0.8s (10s audio) |
| Chat (Claude) | ~2-5s |
| TTS (Piper) | ~0.5-1s |
| **Total** | **~3-7s** |

**Optimization**:
- Use `base` model (best balance)
- Use MUSA/CUDA GPU when available
- Keep audio clips short (<30s)

---

## Migration Notes

### From MooER to Faster-Whisper (2026-02-14)

**What Changed**:
- ❌ Removed: MooER-MTL-80K models (19GB)
- ✅ Added: Faster-Whisper (auto-download)
- ✅ Better cross-platform support
- ✅ Auto GPU fallback (MUSA→CUDA→CPU)

**Benefits**:
- Easier deployment
- No large model downloads
- Works on any platform
- Better community support

**Breaking Changes**:
- None - API remains backward compatible

**Service Mapping**:

| Old | New | Status |
|-----|-----|--------|
| MooER ASR | Faster-Whisper | ✅ Active |
| MUSA TTS | Piper TTS | ✅ Active |
| - | MT LiteTTS | 🔧 Optional |
| - | FunASR Docker | 🔧 Optional |

### Code Migration

**Old**:
```typescript
import { musaVoice } from './services/MUSAVoiceService';
await musaVoice.initialize();
```

**New**:
```typescript
import { localVoice } from './services/LocalVoiceService';
await localVoice.initialize();
```

**Note**: Same API interface, no other changes needed.

---

## Performance Benchmarks

### ASR (Faster-Whisper)

| Model | Device | 10s Audio | RTF* |
|-------|--------|-----------|------|
| tiny | CPU | 2.5s | 0.25 |
| base | CPU | 3.8s | 0.38 |
| base | CUDA | 0.8s | 0.08 |
| medium | CUDA | 1.2s | 0.12 |

*RTF = Real-Time Factor (<1.0 = faster than real-time)

### TTS (Piper)

| Voice | Text | Time | Quality |
|-------|------|------|---------|
| en_US-lessac | 10 words | 0.5s | High |
| zh_CN-huayan | 20 chars | 0.8s | Medium |

---

## Code Examples

### Simple ASR

```typescript
const result = await localVoice.speechToText('/path/to/audio.wav');
console.log('Transcription:', result.text);
console.log('Language:', result.language);
```

### Simple TTS

```typescript
const result = await localVoice.textToSpeech('Hello, world!');
console.log('Audio URL:', result.audioUrl);
```

### Full Conversation

```typescript
import { localVoice } from './services/LocalVoiceService';
import { openClawService } from './services/openclaw';

const result = await localVoice.conversationTurn(
  '/tmp/user_audio.wav',
  async (userText) => {
    const response = await openClawService.chat(
      userText,
      'session_123',
      'claude'
    );
    return response.content;
  }
);

console.log('User:', result.userText);
console.log('AI:', result.aiText);
console.log('Audio:', result.aiAudioUrl);
```

### Multi-language

```typescript
// Chinese conversation
const result = await localVoice.conversationTurn(
  '/tmp/chinese_audio.wav',
  async (text) => { /* AI chat */ return response; },
  {
    asrOptions: { model: 'medium', language: 'zh' },
    ttsOptions: { voice: 'zh_CN-huayan-medium' }
  }
);
```

---

## References

- [Faster-Whisper](https://github.com/guillaumekln/faster-whisper)
- [Piper TTS](https://github.com/rhasspy/piper)
- [MT LiteTTS](https://developer.mthreads.com/)
- [FunASR](https://github.com/alibaba-damo-academy/FunASR)
- [Service Management](./SERVICES.md)

---

**Documentation Version**: 2.0

**Status**: ✅ Production Ready

**Last Updated**: 2026-02-14
