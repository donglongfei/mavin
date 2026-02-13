# Vision Service

GPT-4 Vision API integration for AI-powered image analysis with multiple analysis types and caching.

## Overview

The Vision Service provides comprehensive image analysis using OpenAI's GPT-4 Vision API. It supports multiple analysis types including general description, object detection, OCR, face detection, and scene analysis with automatic caching and cost tracking.

## Features

✅ **GPT-4 Vision Integration** - State-of-the-art image understanding
✅ **Multiple Analysis Types** - General, description, objects, OCR, faces, scene
✅ **Flexible Input** - Base64, Buffer, file path, or URL
✅ **In-Memory Caching** - 1-hour TTL to reduce costs
✅ **Cost Tracking** - Real-time cost calculation per analysis
✅ **Multiple Formats** - JPG, JPEG, PNG, GIF, WebP
✅ **Detail Levels** - Low, high, or auto detail
✅ **File Upload Support** - Multipart form-data with multer

## Supported Analysis Types

### General
Default analysis with custom prompt support

### Description
Detailed description including setting, colors, mood, and notable details

### Objects
List all visible objects in the image

### OCR (Text Extraction)
Extract all text visible in the image

### Faces
Detect and describe faces with age, gender, expression, position

### Scene
Analyze scene context including setting, mood, colors, lighting

## API Endpoints

### Analyze Image (Base64)
```bash
POST /api/vision/analyze
Content-Type: application/json

{
  "image": "base64_encoded_image_data",
  "prompt": "What do you see in this image?"
}
```

**Response:**
```json
{
  "description": "A serene mountain landscape...",
  "objects": ["mountain", "sky", "trees"],
  "text": null
}
```

### Analyze Image File
```bash
POST /api/vision/analyze-file
Content-Type: multipart/form-data

image: [file]
analysisType: "general"
prompt: "Describe this image"
detail: "auto"
```

**Response:**
```json
{
  "description": "...",
  "objects": [],
  "model": "gpt-4-vision-preview",
  "processingTime": 2500,
  "cost": 0.015,
  "cached": false
}
```

### Get Description
```bash
POST /api/vision/describe
Content-Type: multipart/form-data

image: [file]
detail: "high"
```

**Response:**
```json
{
  "description": "A detailed description of the image..."
}
```

### Detect Objects
```bash
POST /api/vision/objects
Content-Type: multipart/form-data

image: [file]
```

**Response:**
```json
{
  "objects": ["car", "tree", "person", "building"],
  "count": 4
}
```

### Extract Text (OCR)
```bash
POST /api/vision/ocr
Content-Type: multipart/form-data

image: [file]
```

**Response:**
```json
{
  "text": "Extracted text from the image...",
  "length": 145
}
```

### Detect Faces
```bash
POST /api/vision/faces
Content-Type: multipart/form-data

image: [file]
```

**Response:**
```json
{
  "faces": [
    {
      "age": "30-35",
      "gender": "female",
      "expression": "smiling",
      "position": "center"
    }
  ],
  "count": 1
}
```

### Analyze Scene
```bash
POST /api/vision/scene
Content-Type: multipart/form-data

image: [file]
```

**Response:**
```json
{
  "description": "A bustling city street...",
  "setting": "outdoor, urban",
  "mood": "energetic, busy",
  "colors": ["gray", "blue", "yellow"],
  "lighting": "natural daylight"
}
```

### Get Service Info
```bash
GET /api/vision/info
```

**Response:**
```json
{
  "supportedFormats": ["jpg", "jpeg", "png", "gif", "webp"],
  "maxImageSize": 20971520,
  "maxImageSizeMB": "20.00",
  "cacheStats": {
    "totalEntries": 5,
    "validEntries": 5,
    "expiredEntries": 0,
    "cacheTTL": 3600000
  }
}
```

### Clear Cache
```bash
DELETE /api/vision/cache
```

**Response:**
```json
{
  "message": "Cache cleared successfully"
}
```

## Usage Examples

### Basic Image Analysis
```typescript
import { visionService } from './services/VisionService';

const result = await visionService.analyze(imageBuffer, {
  analysisType: 'general',
  prompt: 'What is happening in this image?',
  detail: 'auto',
  useCache: true
});

console.log(result.description);
console.log(`Cost: $${result.cost}`);
```

### Get Description
```typescript
const description = await visionService.describe(imageBuffer, 'high');
console.log(description);
```

### Detect Objects
```typescript
const objects = await visionService.detectObjects(imageBuffer);
console.log(`Found ${objects.length} objects:`, objects);
```

### Extract Text (OCR)
```typescript
const text = await visionService.extractText(imageBuffer);
console.log('Extracted text:', text);
```

### Detect Faces
```typescript
const faces = await visionService.detectFaces(imageBuffer);
faces.forEach(face => {
  console.log(`${face.gender}, ${face.age}, ${face.expression}`);
});
```

### Analyze Scene
```typescript
const scene = await visionService.analyzeScene(imageBuffer);
console.log('Setting:', scene.setting);
console.log('Mood:', scene.mood);
console.log('Colors:', scene.colors);
console.log('Lighting:', scene.lighting);
```

### Using cURL
```bash
# Analyze with base64
curl -X POST http://localhost:8002/api/vision/analyze \
  -H "Content-Type: application/json" \
  -d '{"image":"'$(base64 -w 0 image.jpg)'","prompt":"Describe this"}'

# Analyze file
curl -X POST http://localhost:8002/api/vision/analyze-file \
  -F "image=@photo.jpg" \
  -F "analysisType=general" \
  -F "detail=high"

# Get description
curl -X POST http://localhost:8002/api/vision/describe \
  -F "image=@photo.jpg" \
  -F "detail=high"

# Detect objects
curl -X POST http://localhost:8002/api/vision/objects \
  -F "image=@photo.jpg"

# Extract text
curl -X POST http://localhost:8002/api/vision/ocr \
  -F "image=@document.jpg"

# Detect faces
curl -X POST http://localhost:8002/api/vision/faces \
  -F "image=@portrait.jpg"

# Analyze scene
curl -X POST http://localhost:8002/api/vision/scene \
  -F "image=@landscape.jpg"

# Get service info
curl http://localhost:8002/api/vision/info

# Clear cache
curl -X DELETE http://localhost:8002/api/vision/cache
```

## Detail Levels

### Low
- Faster processing
- Lower cost
- Basic understanding
- 512px image resolution

### High
- Detailed analysis
- Higher cost
- Better accuracy
- 2048px image resolution

### Auto (Default)
- Automatically chooses based on image
- Balanced cost/quality
- Recommended for most use cases

## Pricing

GPT-4 Vision pricing (approximate per image):

| Detail Level | Cost per Image |
|--------------|----------------|
| Low | $0.01 |
| High | $0.03 |
| Auto | $0.01-0.03 |

**Cost Tracking:**
```typescript
const result = await visionService.analyze(image, options);
console.log(`Analysis cost: $${result.cost}`);
```

## Caching

The service implements in-memory caching to reduce costs and improve performance.

**Cache Key:** Generated from image hash + analysis type + detail level

**Cache TTL:** 1 hour (3600000ms)

**Cache Stats:**
```typescript
const stats = visionService.getCacheStats();
console.log(`Valid entries: ${stats.validEntries}`);
console.log(`Expired entries: ${stats.expiredEntries}`);
```

**Clear Cache:**
```typescript
visionService.clearCache();
```

## Image Validation

### Supported Formats
- JPG / JPEG
- PNG
- GIF
- WebP

### Size Limits
- Maximum: 20MB
- Recommended: Under 5MB for faster processing

### Input Types
- **Buffer**: Direct image data
- **Base64**: Encoded string
- **File Path**: Local file system path
- **URL**: HTTP/HTTPS image URL

## Error Handling

| Error | Description |
|-------|-------------|
| `OpenAI client not initialized` | API key not configured |
| `Image data is required` | No image provided |
| `Image too large` | Exceeds 20MB limit |
| `Image is empty` | Zero-byte image |
| `Vision analysis failed` | API error |

## Configuration

Set environment variables in `.env`:

```bash
# OpenAI API Key (required)
OPENAI_API_KEY=sk-...
```

## Performance

| Metric | Value |
|--------|-------|
| Average Analysis Time | 2-5 seconds |
| Cache Hit Response | <100ms |
| Max Image Size | 20MB |
| Cache TTL | 1 hour |
| Max Cache Entries | 100 |

## Best Practices

### 1. Use Appropriate Detail Level
```typescript
// Low for quick scans
detail: 'low'

// High for detailed analysis
detail: 'high'

// Auto for balanced approach
detail: 'auto'
```

### 2. Enable Caching
```typescript
// Enable caching (default)
useCache: true

// Disable for real-time analysis
useCache: false
```

### 3. Choose Right Analysis Type
```typescript
// General for custom prompts
analysisType: 'general'

// Specific types for structured output
analysisType: 'objects'  // Returns array
analysisType: 'ocr'      // Returns text
analysisType: 'faces'    // Returns structured data
```

### 4. Optimize Image Size
```typescript
// Compress images before analysis
// Recommended: 1-2MB for best balance
// Maximum: 20MB
```

## Architecture

```
VisionService
├── OpenAI GPT-4 Vision Client
├── Image Validation
│   ├── Format check
│   ├── Size validation
│   └── Content validation
├── Image Preparation
│   ├── Buffer handling
│   ├── Base64 encoding
│   ├── File reading
│   └── URL support
├── Analysis Engine
│   ├── Prompt building
│   ├── API calls
│   └── Response parsing
├── Caching System
│   ├── Key generation
│   ├── TTL management
│   └── Cleanup
└── Cost Calculator
```

## Advanced Features

### Custom Prompts
```typescript
const result = await visionService.analyze(image, {
  analysisType: 'general',
  prompt: 'Identify all safety hazards in this construction site'
});
```

### Conversation Context
```typescript
// Analyze multiple images in context
const result1 = await visionService.analyze(image1, {
  prompt: 'What is this?'
});

const result2 = await visionService.analyze(image2, {
  prompt: 'How does this compare to the previous image?'
});
```

### Batch Analysis
```typescript
const images = [image1, image2, image3];
const results = await Promise.all(
  images.map(img => visionService.analyze(img, options))
);
```

## Testing

```bash
# Test basic analysis
curl -X POST http://localhost:8002/api/vision/analyze-file \
  -F "image=@test.jpg" \
  -F "analysisType=general"

# Test object detection
curl -X POST http://localhost:8002/api/vision/objects \
  -F "image=@test.jpg"

# Test OCR
curl -X POST http://localhost:8002/api/vision/ocr \
  -F "image=@document.jpg"

# Test face detection
curl -X POST http://localhost:8002/api/vision/faces \
  -F "image=@portrait.jpg"

# Test scene analysis
curl -X POST http://localhost:8002/api/vision/scene \
  -F "image=@landscape.jpg"

# Get service info
curl http://localhost:8002/api/vision/info

# Clear cache
curl -X DELETE http://localhost:8002/api/vision/cache
```

## Future Enhancements

- [ ] Video frame analysis
- [ ] Batch processing
- [ ] Image comparison
- [ ] Custom model fine-tuning
- [ ] Cloud storage integration
- [ ] Webhook notifications
- [ ] Analysis history
- [ ] Export results to JSON/CSV
- [ ] Multi-language OCR
- [ ] Advanced face recognition

## Troubleshooting

### Issue: "OpenAI client not initialized"
**Solution:** Set `OPENAI_API_KEY` in `.env` file

### Issue: Analysis takes too long
**Solution:**
- Use 'low' detail level
- Reduce image size
- Check network connection

### Issue: Cache not working
**Solution:**
- Check cache stats with `/api/vision/info`
- Verify `useCache: true` in options
- Clear cache if entries are expired

### Issue: High costs
**Solution:**
- Enable caching
- Use 'low' detail level
- Reduce image size
- Batch similar analyses

## Security

- API keys stored in environment variables
- Image validation (size, format)
- No persistent storage of images
- Sanitized error messages
- Rate limiting recommended for production

## Integration Examples

### With Express.js
```typescript
app.post('/analyze', upload.single('image'), async (req, res) => {
  const result = await visionService.analyze(req.file.buffer, {
    analysisType: req.body.type || 'general'
  });
  res.json(result);
});
```

### With React Frontend
```typescript
const analyzeImage = async (file: File) => {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('analysisType', 'general');

  const response = await fetch('/api/vision/analyze-file', {
    method: 'POST',
    body: formData
  });

  return await response.json();
};
```

### With Python
```python
import requests

with open('image.jpg', 'rb') as f:
    files = {'image': f}
    data = {'analysisType': 'general'}
    response = requests.post(
        'http://localhost:8002/api/vision/analyze-file',
        files=files,
        data=data
    )
    print(response.json())
```
