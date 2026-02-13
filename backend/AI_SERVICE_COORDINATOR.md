# AI Service Coordinator

Orchestrates multiple AI services for complex multi-modal workflows and intelligent task routing.

## Overview

The AI Service Coordinator provides a unified interface for orchestrating all AI services (Language Models, Prompts, Speech Recognition, Image Generation, Vision) into complex workflows. It enables multi-modal interactions, intelligent service routing, and workflow management.

## Features

✅ **Multi-Modal Processing** - Combine text, audio, and image inputs
✅ **Workflow Management** - Create, track, and complete complex workflows
✅ **Service Orchestration** - Coordinate between 5 AI services
✅ **Context Management** - Maintain context across service calls
✅ **Cost Tracking** - Aggregate costs across all services
✅ **Intelligent Routing** - Automatically route to appropriate services
✅ **Pre-built Workflows** - Common patterns ready to use

## Integrated Services

1. **LanguageModelInterface** - GPT-4, Claude for text generation
2. **PromptManager** - Persona-based system prompts
3. **SpeechRecognitionService** - Whisper for audio transcription
4. **ImageGenerationService** - DALL-E 3 for image generation
5. **VisionService** - GPT-4 Vision for image analysis

## API Endpoints

### Multi-Modal Processing
```bash
POST /api/ai/multi-modal
Content-Type: multipart/form-data

text: "What's in this image?"
image: [file]
audio: [file]
persona: "leo"
model: "gpt-4-turbo"
```

**Response:**
```json
{
  "transcription": "Describe this photo",
  "imageAnalysis": {
    "description": "A mountain landscape at sunset",
    "objects": ["mountain", "sky", "trees"]
  },
  "response": "This image shows a beautiful mountain...",
  "model": "gpt-4-turbo",
  "processingTime": 8500,
  "totalCost": 0.045,
  "success": true
}
```

### Chat with Image
```bash
POST /api/ai/chat-with-image
Content-Type: multipart/form-data

image: [file]
message: "What's happening in this image?"
imageDetail: "high"
model: "gpt-4-turbo"
```

**Response:**
```json
{
  "response": "In this image, I can see...",
  "imageDescription": "A bustling city street...",
  "model": "gpt-4-turbo",
  "processingTime": 3500,
  "cost": 0.025
}
```

### Generate from Conversation
```bash
POST /api/ai/generate-from-conversation
Content-Type: application/json

{
  "conversationId": "conv_123",
  "additionalPrompt": "Make it more colorful"
}
```

**Response:**
```json
{
  "imageUrl": "https://...",
  "originalPrompt": "Based on conversation...",
  "enhancedPrompt": "A vibrant scene with...",
  "revisedPrompt": "DALL-E's interpretation...",
  "processingTime": 12000,
  "cost": 0.08
}
```

### Voice to Image
```bash
POST /api/ai/voice-to-image
Content-Type: multipart/form-data

audio: [file]
language: "en"
size: "1024x1024"
quality: "standard"
style: "vivid"
```

**Response:**
```json
{
  "transcription": "A sunset over mountains",
  "imageUrl": "https://...",
  "enhancedPrompt": "A breathtaking sunset...",
  "revisedPrompt": "DALL-E's version...",
  "processingTime": 15000,
  "cost": 0.046
}
```

### Image to Image
```bash
POST /api/ai/image-to-image
Content-Type: multipart/form-data

image: [file]
instruction: "Make it look like a painting"
size: "1024x1024"
quality: "hd"
```

**Response:**
```json
{
  "sourceDescription": "A photograph of mountains",
  "newImageUrl": "https://...",
  "enhancedPrompt": "An oil painting of mountains...",
  "revisedPrompt": "DALL-E's interpretation...",
  "processingTime": 18000,
  "cost": 0.11
}
```

### Workflow Management

#### Create Workflow
```bash
POST /api/ai/workflow/create
Content-Type: application/json

{
  "workflowId": "wf_123",
  "type": "multi-modal"
}
```

#### Get Workflow State
```bash
GET /api/ai/workflow/:id
```

**Response:**
```json
{
  "id": "wf_123",
  "type": "multi-modal",
  "steps": [
    {
      "service": "speech",
      "action": "transcribe",
      "cost": 0.006,
      "processingTime": 2500
    }
  ],
  "context": {},
  "createdAt": 1770964123456,
  "totalCost": 0.006
}
```

#### Complete Workflow
```bash
POST /api/ai/workflow/:id/complete
```

**Response:**
```json
{
  "workflowId": "wf_123",
  "type": "multi-modal",
  "totalSteps": 3,
  "totalCost": 0.045,
  "duration": 12500,
  "services": ["speech", "vision", "language-model"]
}
```

### Service Status
```bash
GET /api/ai/status
```

**Response:**
```json
{
  "languageModel": {
    "available": true,
    "models": ["gpt-4", "gpt-4-turbo", "gpt-3.5-turbo", "claude-3-5-sonnet-20241022"]
  },
  "promptManager": {
    "available": true,
    "personas": ["leo", "sarah", "timmy"]
  },
  "speechRecognition": {
    "available": true,
    "formats": ["mp3", "mp4", "mpeg", "mpga", "m4a", "wav", "webm"],
    "maxFileSize": 26214400
  },
  "imageGeneration": {
    "available": true,
    "sizes": ["1024x1024", "1792x1024", "1024x1792"],
    "qualities": ["standard", "hd"],
    "styles": ["vivid", "natural"],
    "models": ["dall-e-3"]
  },
  "vision": {
    "available": true,
    "formats": ["jpg", "jpeg", "png", "gif", "webp"],
    "maxImageSize": 20971520
  },
  "activeWorkflows": 0
}
```

### Coordinator Stats
```bash
GET /api/ai/stats
```

**Response:**
```json
{
  "activeWorkflows": 2,
  "totalCost": 0.125,
  "totalSteps": 8,
  "workflowTTL": 3600000
}
```

### Clear Expired Workflows
```bash
DELETE /api/ai/workflows/expired
```

## Usage Examples

### Multi-Modal Request (TypeScript)
```typescript
import { aiCoordinator } from './services/AIServiceCoordinator';

const result = await aiCoordinator.processMultiModal({
  text: "What's in this image?",
  image: imageBuffer,
  audio: audioBuffer,
  persona: 'leo',
  model: 'gpt-4-turbo',
  imageDetail: 'high',
  audioLanguage: 'en'
});

console.log('Transcription:', result.transcription);
console.log('Image:', result.imageAnalysis?.description);
console.log('Response:', result.response);
console.log('Total cost:', result.totalCost);
```

### Chat with Image
```typescript
const result = await aiCoordinator.chatWithImage(
  imageBuffer,
  "What's happening here?",
  {
    imageDetail: 'high',
    model: 'gpt-4-turbo',
    conversationId: 'conv_123'
  }
);

console.log('Description:', result.imageDescription);
console.log('Response:', result.response);
```

### Voice to Image Workflow
```typescript
const result = await aiCoordinator.voiceToImage(audioBuffer, {
  language: 'en',
  size: '1024x1024',
  quality: 'hd',
  style: 'vivid'
});

console.log('You said:', result.transcription);
console.log('Generated:', result.imageUrl);
```

### Image to Image Transformation
```typescript
const result = await aiCoordinator.imageToImage(
  sourceImage,
  "Make it look like a watercolor painting",
  {
    size: '1024x1024',
    quality: 'hd',
    style: 'natural'
  }
);

console.log('Original:', result.sourceDescription);
console.log('New image:', result.newImageUrl);
```

### Using cURL

#### Multi-Modal Request
```bash
curl -X POST http://localhost:8002/api/ai/multi-modal \
  -F "text=What's in this image?" \
  -F "image=@photo.jpg" \
  -F "audio=@voice.mp3" \
  -F "persona=leo" \
  -F "model=gpt-4-turbo"
```

#### Chat with Image
```bash
curl -X POST http://localhost:8002/api/ai/chat-with-image \
  -F "image=@photo.jpg" \
  -F "message=What's happening here?" \
  -F "imageDetail=high"
```

#### Voice to Image
```bash
curl -X POST http://localhost:8002/api/ai/voice-to-image \
  -F "audio=@voice.mp3" \
  -F "language=en" \
  -F "size=1024x1024" \
  -F "quality=hd"
```

#### Image to Image
```bash
curl -X POST http://localhost:8002/api/ai/image-to-image \
  -F "image=@photo.jpg" \
  -F "instruction=Make it look like a painting" \
  -F "quality=hd"
```

#### Get Service Status
```bash
curl http://localhost:8002/api/ai/status
```

#### Get Stats
```bash
curl http://localhost:8002/api/ai/stats
```

## Workflow Types

### Multi-Modal
Combines text, audio, and image inputs for comprehensive processing.

**Use Cases:**
- Voice + image question answering
- Audio transcription + image analysis + chat
- Multi-sensory AI interactions

### Chat with Image
Analyze image and answer questions about it.

**Use Cases:**
- Image Q&A
- Visual assistance
- Photo analysis

### Voice to Image
Generate images from voice descriptions.

**Use Cases:**
- Hands-free image creation
- Voice-driven design
- Accessibility features

### Image to Image
Transform images based on instructions.

**Use Cases:**
- Style transfer
- Image editing
- Creative variations

### Conversation to Image
Generate images from conversation context.

**Use Cases:**
- Visualize discussions
- Create illustrations from chat
- Context-aware image generation

## Cost Tracking

The coordinator aggregates costs from all services:

```typescript
const result = await aiCoordinator.processMultiModal({...});
console.log(`Total cost: $${result.totalCost}`);

// Breakdown:
// - Speech transcription: $0.006
// - Image analysis: $0.015
// - Chat completion: $0.024
// Total: $0.045
```

## Workflow Management

### Creating Workflows
```typescript
// Create workflow
aiCoordinator.createWorkflow('wf_123', 'multi-modal');

// Add steps manually
aiCoordinator.addWorkflowStep('wf_123', {
  service: 'speech',
  action: 'transcribe',
  input: audioBuffer,
  output: transcription,
  cost: 0.006,
  processingTime: 2500
});

// Get workflow state
const workflow = aiCoordinator.getWorkflow('wf_123');

// Complete workflow
const summary = aiCoordinator.completeWorkflow('wf_123');
```

### Workflow TTL
Workflows expire after 1 hour (3600000ms) to prevent memory leaks.

```typescript
// Clear expired workflows manually
const cleared = aiCoordinator.clearExpiredWorkflows();
console.log(`Cleared ${cleared} expired workflows`);
```

## Performance

| Operation | Average Time | Cost Range |
|-----------|--------------|------------|
| Multi-modal (all 3) | 8-15 seconds | $0.04-$0.08 |
| Chat with image | 3-5 seconds | $0.02-$0.04 |
| Voice to image | 12-18 seconds | $0.04-$0.12 |
| Image to image | 15-20 seconds | $0.08-$0.15 |
| Conversation to image | 10-15 seconds | $0.06-$0.10 |

## Best Practices

### 1. Use Appropriate Detail Levels
```typescript
// Low detail for quick analysis
imageDetail: 'low'

// High detail for important images
imageDetail: 'high'

// Auto for balanced approach
imageDetail: 'auto'
```

### 2. Choose Right Quality
```typescript
// Standard for drafts
quality: 'standard'  // $0.04

// HD for production
quality: 'hd'  // $0.08
```

### 3. Leverage Personas
```typescript
// Use appropriate persona for context
persona: 'leo'    // Student/professional
persona: 'sarah'  // Creative/artistic
persona: 'timmy'  // Child-friendly
```

### 4. Manage Workflows
```typescript
// Create workflow for complex operations
aiCoordinator.createWorkflow('wf_123', 'multi-modal');

// Track steps and costs
// Complete when done to free memory
aiCoordinator.completeWorkflow('wf_123');
```

## Architecture

```
AIServiceCoordinator
├── Multi-Modal Processing
│   ├── Audio → Speech Recognition
│   ├── Image → Vision Analysis
│   └── Text → Language Model
├── Workflow Management
│   ├── Workflow creation
│   ├── Step tracking
│   ├── Context management
│   └── Cost aggregation
├── Pre-built Workflows
│   ├── Chat with image
│   ├── Voice to image
│   ├── Image to image
│   └── Conversation to image
└── Service Status
    ├── Health checks
    ├── Capability reporting
    └── Statistics
```

## Error Handling

| Error | Description |
|-------|-------------|
| `Multi-modal processing failed` | One or more services failed |
| `Chat with image failed` | Image analysis or chat failed |
| `Generate from conversation failed` | No conversation context or generation failed |
| `Voice to image failed` | Transcription or generation failed |
| `Image to image failed` | Analysis or generation failed |
| `Workflow not found` | Invalid workflow ID or expired |

## Configuration

All services are configured via their respective environment variables:

```bash
# OpenAI (for GPT, DALL-E, Whisper, Vision)
OPENAI_API_KEY=sk-...

# Anthropic (for Claude)
ANTHROPIC_API_KEY=sk-ant-...
```

## Testing

```bash
# Test service status
curl http://localhost:8002/api/ai/status

# Test stats
curl http://localhost:8002/api/ai/stats

# Test multi-modal
curl -X POST http://localhost:8002/api/ai/multi-modal \
  -F "text=Hello" \
  -F "image=@test.jpg"

# Test chat with image
curl -X POST http://localhost:8002/api/ai/chat-with-image \
  -F "image=@test.jpg" \
  -F "message=What is this?"

# Test voice to image
curl -X POST http://localhost:8002/api/ai/voice-to-image \
  -F "audio=@test.mp3"

# Test image to image
curl -X POST http://localhost:8002/api/ai/image-to-image \
  -F "image=@test.jpg" \
  -F "instruction=Make it artistic"
```

## Future Enhancements

- [ ] Video processing workflows
- [ ] Batch processing
- [ ] Workflow templates library
- [ ] Advanced routing logic
- [ ] Service fallbacks
- [ ] Rate limiting per service
- [ ] Workflow persistence (Redis)
- [ ] Webhook notifications
- [ ] Streaming multi-modal responses
- [ ] Custom workflow builder

## Troubleshooting

### Issue: "Service not available"
**Solution:** Check individual service status and API keys

### Issue: High costs
**Solution:**
- Use lower quality settings
- Enable caching in individual services
- Use appropriate detail levels
- Batch similar requests

### Issue: Slow processing
**Solution:**
- Use lower detail levels
- Reduce image sizes
- Use standard quality instead of HD
- Check network connection

## Security

- All API keys stored in environment variables
- File size limits enforced (25MB)
- Input validation on all endpoints
- No persistent storage of user data
- Workflow TTL prevents memory leaks

## Integration Examples

### React Frontend
```typescript
const analyzeMultiModal = async (text: string, image: File, audio: File) => {
  const formData = new FormData();
  formData.append('text', text);
  formData.append('image', image);
  formData.append('audio', audio);
  formData.append('persona', 'leo');

  const response = await fetch('/api/ai/multi-modal', {
    method: 'POST',
    body: formData
  });

  return await response.json();
};
```

### Python
```python
import requests

files = {
    'image': open('photo.jpg', 'rb'),
    'audio': open('voice.mp3', 'rb')
}
data = {
    'text': 'What is this?',
    'persona': 'leo'
}

response = requests.post(
    'http://localhost:8002/api/ai/multi-modal',
    files=files,
    data=data
)
print(response.json())
```
