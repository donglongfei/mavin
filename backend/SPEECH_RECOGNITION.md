# Speech Recognition Service

OpenAI Whisper API integration for audio transcription with caching and validation.

## Overview

The Speech Recognition Service provides audio-to-text transcription using OpenAI's Whisper API. It includes automatic language detection, format validation, in-memory caching, and comprehensive error handling.

## Features

✅ **OpenAI Whisper Integration** - State-of-the-art speech recognition
✅ **Multiple Audio Formats** - MP3, MP4, WAV, M4A, WebM, MPEG, MPGA
✅ **Automatic Language Detection** - Supports 50+ languages
✅ **In-Memory Caching** - 1-hour TTL for faster repeated transcriptions
✅ **File Validation** - Size and format checking
✅ **Confidence Scoring** - Estimated transcription confidence
✅ **Error Handling** - Comprehensive error messages
✅ **Cost Tracking** - Processing time monitoring

## Supported Audio Formats

- **MP3** (.mp3)
- **MP4** (.mp4)
- **MPEG** (.mpeg, .mpga)
- **M4A** (.m4a)
- **WAV** (.wav)
- **WebM** (.webm)

**Max File Size:** 25MB (Whisper API limit)

## API Endpoints

### Transcribe Audio (Base64)
```bash
POST /api/speech/transcribe
Content-Type: application/json

{
  "audio": "base64_encoded_audio_data",
  "language": "en"  // optional, auto-detect if not provided
}
```

**Response:**
```json
{
  "text": "This is the transcribed text",
  "language": "en",
  "confidence": 0.95
}
```

### Transcribe Audio File (Multipart)
```bash
POST /api/speech/transcribe-file
Content-Type: multipart/form-data

audio: [audio file]
language: en  // optional
prompt: "Optional context to guide transcription"  // optional
```

**Response:**
```json
{
  "text": "This is the transcribed text",
  "language": "en",
  "confidence": 0.95,
  "duration": 45.2,
  "processingTime": 3200,
  "cached": false
}
```

### Get Service Info
```bash
GET /api/speech/info
```

**Response:**
```json
{
  "supportedFormats": ["mp3", "mp4", "mpeg", "mpga", "m4a", "wav", "webm"],
  "maxFileSize": 26214400,
  "maxFileSizeMB": "25.00",
  "cacheStats": {
    "totalEntries": 15,
    "validEntries": 12,
    "expiredEntries": 3,
    "cacheTTL": 3600000
  }
}
```

### Clear Cache
```bash
DELETE /api/speech/cache
```

**Response:**
```json
{
  "message": "Cache cleared successfully"
}
```

## Usage Examples

### Basic Transcription (Base64)
```typescript
import { speechRecognition } from './services/SpeechRecognitionService';

// Read audio file
const audioBuffer = fs.readFileSync('audio.mp3');
const base64Audio = audioBuffer.toString('base64');

// Transcribe
const result = await speechRecognition.transcribe(audioBuffer, {
  language: 'en',
  useCache: true
});

console.log(result.text);
// Output: "Hello, this is a test recording"
```

### Transcription with Auto Language Detection
```typescript
const result = await speechRecognition.transcribeAuto(audioBuffer);

console.log(`Detected language: ${result.language}`);
console.log(`Text: ${result.text}`);
console.log(`Confidence: ${result.confidence}`);
```

### Transcription with Context Prompt
```typescript
const result = await speechRecognition.transcribe(audioBuffer, {
  language: 'en',
  prompt: 'This is a technical discussion about AI and machine learning.',
  temperature: 0
});
```

### File Upload (Express Route)
```typescript
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });

app.post('/upload', upload.single('audio'), async (req, res) => {
  const result = await speechRecognition.transcribe(req.file.buffer, {
    language: 'auto'
  });

  res.json(result);
});
```

### Using cURL
```bash
# Transcribe with base64
curl -X POST http://localhost:8002/api/speech/transcribe \
  -H "Content-Type: application/json" \
  -d '{"audio":"'$(base64 -w 0 audio.mp3)'","language":"en"}'

# Transcribe file upload
curl -X POST http://localhost:8002/api/speech/transcribe-file \
  -F "audio=@audio.mp3" \
  -F "language=en"

# Get service info
curl http://localhost:8002/api/speech/info

# Clear cache
curl -X DELETE http://localhost:8002/api/speech/cache
```

## Supported Languages

Whisper supports 50+ languages including:

| Language | Code | Language | Code |
|----------|------|----------|------|
| English | en | Spanish | es |
| Chinese | zh | French | fr |
| German | de | Japanese | ja |
| Korean | ko | Russian | ru |
| Portuguese | pt | Italian | it |
| Arabic | ar | Hindi | hi |

**Auto-detection:** Set `language` to `undefined` or `"auto"` for automatic detection.

## Caching

The service includes in-memory caching to improve performance and reduce API costs.

**Cache Key:** Generated from audio content + language + model
**TTL:** 1 hour (3600000ms)
**Max Entries:** 100 (LRU eviction)

**Cache Stats:**
```typescript
const stats = speechRecognition.getCacheStats();
console.log(stats);
// {
//   totalEntries: 15,
//   validEntries: 12,
//   expiredEntries: 3,
//   cacheTTL: 3600000
// }
```

**Clear Cache:**
```typescript
speechRecognition.clearCache();
```

## Error Handling

The service provides detailed error messages:

| Error | Description |
|-------|-------------|
| `Audio file too large` | File exceeds 25MB limit |
| `Audio file is empty` | File has 0 bytes |
| `Unsupported audio format` | Format not in supported list |
| `OpenAI client not initialized` | API key not configured |
| `Speech recognition failed` | Whisper API error |

**Example Error Response:**
```json
{
  "error": "Audio file too large: 30.5MB (max 25MB)"
}
```

## Validation

### File Size Validation
- **Max:** 25MB (Whisper API limit)
- **Min:** > 0 bytes

### Format Validation
- Checks file extension
- Validates against supported formats list

### Content Validation
- Ensures audio data is not empty
- Validates base64 encoding (for base64 input)

## Performance

| Metric | Value |
|--------|-------|
| Average Processing Time | 2-5 seconds |
| Cache Hit Latency | <10ms |
| Cache Miss Latency | 2-5 seconds |
| Max File Size | 25MB |
| Cache TTL | 1 hour |

## Cost Tracking

The service tracks processing time for each transcription:

```typescript
const result = await speechRecognition.transcribe(audioBuffer);
console.log(`Processing time: ${result.processingTime}ms`);
```

**Whisper API Pricing:**
- $0.006 per minute of audio

## Configuration

Set environment variables in `.env`:

```bash
# OpenAI API Key (required)
OPENAI_API_KEY=sk-...

# Optional: Override default model
OPENAI_WHISPER_MODEL=whisper-1
```

## Advanced Options

### Temperature Control
```typescript
const result = await speechRecognition.transcribe(audioBuffer, {
  temperature: 0  // 0 = deterministic, 1 = creative
});
```

### Context Prompts
Provide context to improve accuracy:
```typescript
const result = await speechRecognition.transcribe(audioBuffer, {
  prompt: "This is a medical consultation discussing symptoms and treatment."
});
```

### Response Formats
```typescript
const result = await speechRecognition.transcribe(audioBuffer, {
  responseFormat: 'json'  // 'json' | 'text' | 'srt' | 'vtt' | 'verbose_json'
});
```

## Architecture

```
SpeechRecognitionService
├── OpenAI Whisper Client
├── Validation Layer
│   ├── File size check
│   ├── Format validation
│   └── Content validation
├── Caching Layer
│   ├── In-memory Map
│   ├── TTL management
│   └── LRU eviction
└── Processing Layer
    ├── File preparation
    ├── API call
    ├── Language detection
    └── Confidence estimation
```

## Best Practices

### 1. Use Caching
```typescript
// Good - uses cache
const result = await speechRecognition.transcribe(audio, { useCache: true });

// Skip cache only when needed
const result = await speechRecognition.transcribe(audio, { useCache: false });
```

### 2. Specify Language When Known
```typescript
// Better performance
const result = await speechRecognition.transcribe(audio, { language: 'en' });

// Auto-detect only when necessary
const result = await speechRecognition.transcribeAuto(audio);
```

### 3. Provide Context Prompts
```typescript
// Improves accuracy for domain-specific content
const result = await speechRecognition.transcribe(audio, {
  prompt: "Technical discussion about React hooks and state management"
});
```

### 4. Handle Errors Gracefully
```typescript
try {
  const result = await speechRecognition.transcribe(audio);
} catch (error) {
  if (error.message.includes('too large')) {
    // Handle file size error
  } else if (error.message.includes('Unsupported')) {
    // Handle format error
  }
}
```

## Testing

```bash
# Test with sample audio
curl -X POST http://localhost:8002/api/speech/transcribe-file \
  -F "audio=@test-audio.mp3" \
  -F "language=en"

# Check service info
curl http://localhost:8002/api/speech/info

# Clear cache
curl -X DELETE http://localhost:8002/api/speech/cache
```

## Future Enhancements

- [ ] Redis-based caching for distributed systems
- [ ] Streaming transcription support
- [ ] Real-time transcription (WebSocket)
- [ ] Speaker diarization
- [ ] Timestamp generation
- [ ] Custom vocabulary support
- [ ] Batch processing
- [ ] Audio preprocessing (noise reduction)
- [ ] Multi-language detection
- [ ] Cost analytics dashboard

## Troubleshooting

### Issue: "OpenAI client not initialized"
**Solution:** Set `OPENAI_API_KEY` in `.env` file

### Issue: "Audio file too large"
**Solution:** Compress audio or split into smaller chunks

### Issue: "Unsupported audio format"
**Solution:** Convert to supported format (MP3, WAV, M4A, etc.)

### Issue: Low confidence scores
**Solution:**
- Improve audio quality
- Reduce background noise
- Provide context prompt
- Specify correct language

## Security

- API keys stored in environment variables
- File size limits enforced
- Format validation prevents malicious files
- Temporary files cleaned up after processing
- No audio data stored permanently (cache only)
