# Image Generation Service

DALL-E 3 integration for AI-powered image generation with prompt enhancement and local storage.

## Overview

The Image Generation Service provides text-to-image generation using OpenAI's DALL-E 3. It includes automatic prompt enhancement using GPT-4, style variations, local image storage, and cost tracking.

## Features

✅ **DALL-E 3 Integration** - State-of-the-art image generation
✅ **Prompt Enhancement** - Use GPT-4 to expand and improve prompts
✅ **Multiple Sizes** - 1024x1024, 1792x1024, 1024x1792
✅ **Quality Options** - Standard and HD
✅ **Style Variations** - Vivid and Natural styles
✅ **Local Storage** - Automatic image download and storage
✅ **Cost Tracking** - Real-time cost calculation
✅ **Image Management** - List and delete stored images

## Supported Options

### Sizes
- **1024x1024** - Square (default)
- **1792x1024** - Landscape
- **1024x1792** - Portrait

### Quality
- **standard** - Standard quality (default)
- **hd** - High definition

### Styles
- **vivid** - Hyper-real and dramatic (default)
- **natural** - More natural, less hyper-real

## API Endpoints

### Generate Image
```bash
POST /api/image/generate
Content-Type: application/json

{
  "prompt": "A serene mountain landscape at sunset",
  "size": "1024x1024",
  "quality": "standard"
}
```

**Response:**
```json
{
  "imageUrl": "https://oaidalleapiprodscus.blob.core.windows.net/...",
  "revisedPrompt": "A serene mountain landscape at sunset with golden light..."
}
```

### Generate with Enhanced Prompt
```bash
POST /api/image/generate-enhanced
Content-Type: application/json

{
  "prompt": "sunset mountain",
  "size": "1792x1024",
  "quality": "hd",
  "style": "vivid"
}
```

**Response:**
```json
{
  "imageUrl": "https://...",
  "revisedPrompt": "DALL-E's revised prompt",
  "originalPrompt": "sunset mountain",
  "enhancedPrompt": "A breathtaking mountain landscape at golden hour...",
  "size": "1792x1024",
  "quality": "hd",
  "style": "vivid",
  "processingTime": 8500,
  "cost": 0.12
}
```

### Generate Style Variations
```bash
POST /api/image/variations
Content-Type: application/json

{
  "prompt": "A futuristic city",
  "size": "1024x1024",
  "quality": "standard"
}
```

**Response:**
```json
{
  "variations": [
    {
      "imageUrl": "https://...",
      "style": "vivid",
      "revisedPrompt": "...",
      "cost": 0.04
    },
    {
      "imageUrl": "https://...",
      "style": "natural",
      "revisedPrompt": "...",
      "cost": 0.04
    }
  ],
  "totalCost": 0.08
}
```

### List Stored Images
```bash
GET /api/image/stored
```

**Response:**
```json
{
  "images": [
    {
      "filename": "1770964123456_sunset_mountain.png",
      "path": "/path/to/storage/images/...",
      "size": 1234567,
      "createdAt": "2026-02-13T06:00:00.000Z"
    }
  ],
  "count": 1
}
```

### Delete Stored Image
```bash
DELETE /api/image/stored/:filename
```

### Get Service Info
```bash
GET /api/image/info
```

**Response:**
```json
{
  "sizes": ["1024x1024", "1792x1024", "1024x1792"],
  "qualities": ["standard", "hd"],
  "styles": ["vivid", "natural"],
  "models": ["dall-e-3"],
  "storageDir": "/path/to/storage/images"
}
```

## Usage Examples

### Basic Image Generation
```typescript
import { imageGeneration } from './services/ImageGenerationService';

const result = await imageGeneration.generate({
  prompt: 'A serene mountain landscape at sunset',
  size: '1024x1024',
  quality: 'standard',
  style: 'vivid',
  saveLocally: true
});

console.log(result.imageUrl);
console.log(`Cost: $${result.cost}`);
```

### Enhanced Prompt Generation
```typescript
const result = await imageGeneration.generateEnhanced(
  'sunset mountain',
  {
    size: '1792x1024',
    quality: 'hd',
    saveLocally: true
  }
);

console.log('Original:', result.originalPrompt);
console.log('Enhanced:', result.enhancedPrompt);
console.log('DALL-E Revised:', result.revisedPrompt);
```

### Generate Style Variations
```typescript
const variations = await imageGeneration.generateVariations(
  'A futuristic city',
  {
    size: '1024x1024',
    quality: 'standard'
  }
);

console.log(`Generated ${variations.length} variations`);
variations.forEach(v => {
  console.log(`${v.style}: ${v.imageUrl}`);
});
```

### Using cURL
```bash
# Basic generation
curl -X POST http://localhost:8002/api/image/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt":"A serene mountain landscape","size":"1024x1024"}'

# Enhanced generation
curl -X POST http://localhost:8002/api/image/generate-enhanced \
  -H "Content-Type: application/json" \
  -d '{"prompt":"sunset mountain","quality":"hd"}'

# Generate variations
curl -X POST http://localhost:8002/api/image/variations \
  -H "Content-Type: application/json" \
  -d '{"prompt":"futuristic city"}'

# List stored images
curl http://localhost:8002/api/image/stored

# Get service info
curl http://localhost:8002/api/image/info
```

## Prompt Enhancement

The service can automatically enhance prompts using GPT-4 to make them more detailed and visually descriptive.

**Original Prompt:**
```
sunset mountain
```

**Enhanced Prompt:**
```
A breathtaking mountain landscape at golden hour, with snow-capped peaks
bathed in warm orange and pink light from the setting sun, dramatic clouds
in the sky, alpine meadow in foreground, photorealistic style
```

**Enhancement Process:**
1. User provides simple prompt
2. GPT-4 expands it with visual details
3. DALL-E 3 generates from enhanced prompt
4. Returns both original and enhanced versions

## Pricing

DALL-E 3 pricing (per image):

| Size | Standard | HD |
|------|----------|-----|
| 1024x1024 | $0.04 | $0.08 |
| 1792x1024 | $0.08 | $0.12 |
| 1024x1792 | $0.08 | $0.12 |

**Cost Tracking:**
```typescript
const result = await imageGeneration.generate({...});
console.log(`Generation cost: $${result.cost}`);
```

## Local Storage

Images are automatically downloaded and stored locally when `saveLocally: true`.

**Storage Location:** `backend/storage/images/`

**Filename Format:** `{timestamp}_{sanitized_prompt}.png`

**Example:** `1770964123456_sunset_mountain.png`

**Management:**
```typescript
// List stored images
const images = await imageGeneration.listStoredImages();

// Delete image
await imageGeneration.deleteStoredImage('filename.png');

// Get storage directory
const dir = imageGeneration.getStorageDir();
```

## Error Handling

| Error | Description |
|-------|-------------|
| `Prompt cannot be empty` | No prompt provided |
| `Prompt too long` | Exceeds 4000 characters |
| `Unsupported size` | Invalid size parameter |
| `Unsupported quality` | Invalid quality parameter |
| `Unsupported style` | Invalid style parameter |
| `OpenAI client not initialized` | API key not configured |
| `Image generation failed` | DALL-E API error |

## Configuration

Set environment variables in `.env`:

```bash
# OpenAI API Key (required)
OPENAI_API_KEY=sk-...

# Optional: Storage directory
IMAGE_STORAGE_DIR=./storage/images
```

## Performance

| Metric | Value |
|--------|-------|
| Average Generation Time | 8-15 seconds |
| Prompt Enhancement Time | 2-3 seconds |
| Image Download Time | 1-2 seconds |
| Total (with enhancement) | 11-20 seconds |

## Best Practices

### 1. Use Prompt Enhancement for Simple Prompts
```typescript
// Good for simple prompts
const result = await imageGeneration.generateEnhanced('sunset');

// Not needed for detailed prompts
const result = await imageGeneration.generate({
  prompt: 'A detailed mountain landscape with...',
  enhancePrompt: false
});
```

### 2. Choose Appropriate Size
```typescript
// Square for social media
size: '1024x1024'

// Landscape for banners
size: '1792x1024'

// Portrait for mobile
size: '1024x1792'
```

### 3. Use HD Quality Selectively
```typescript
// Standard for drafts/iterations
quality: 'standard'  // $0.04

// HD for final production
quality: 'hd'  // $0.08
```

### 4. Generate Variations for Options
```typescript
// Get both vivid and natural styles
const variations = await imageGeneration.generateVariations(prompt);
// User can choose preferred style
```

## Architecture

```
ImageGenerationService
├── OpenAI DALL-E 3 Client
├── Prompt Enhancement
│   └── GPT-4 Integration
├── Image Generation
│   ├── Size validation
│   ├── Quality selection
│   └── Style selection
├── Local Storage
│   ├── Download manager
│   ├── File naming
│   └── Storage management
└── Cost Calculator
```

## Advanced Features

### Prompt Enhancement System Prompt
The service uses a specialized system prompt for GPT-4:
- Focus on visual details (colors, lighting, composition)
- Artistic style and medium
- Mood and atmosphere
- Specific elements and arrangement
- Keep under 400 characters

### Automatic Image Download
Images are downloaded via HTTPS and saved with:
- Timestamp prefix
- Sanitized prompt (first 50 chars)
- PNG format
- Organized in storage directory

### Cost Optimization
- Track cost per generation
- Choose standard vs HD based on use case
- Use smaller sizes for iterations
- Cache generated images locally

## Testing

```bash
# Test basic generation
curl -X POST http://localhost:8002/api/image/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt":"test image"}'

# Test enhanced generation
curl -X POST http://localhost:8002/api/image/generate-enhanced \
  -H "Content-Type: application/json" \
  -d '{"prompt":"sunset"}'

# Test variations
curl -X POST http://localhost:8002/api/image/variations \
  -H "Content-Type: application/json" \
  -d '{"prompt":"city"}'

# List stored images
curl http://localhost:8002/api/image/stored

# Get service info
curl http://localhost:8002/api/image/info
```

## Future Enhancements

- [ ] Image editing (DALL-E edit endpoint)
- [ ] Image variations from existing images
- [ ] Batch generation
- [ ] S3/cloud storage integration
- [ ] Image compression
- [ ] Thumbnail generation
- [ ] Metadata tagging
- [ ] Search stored images
- [ ] Image gallery UI
- [ ] Prompt templates library

## Troubleshooting

### Issue: "OpenAI client not initialized"
**Solution:** Set `OPENAI_API_KEY` in `.env` file

### Issue: Generation takes too long
**Solution:**
- Use standard quality instead of HD
- Avoid prompt enhancement for detailed prompts
- Check network connection

### Issue: Storage directory not found
**Solution:** Service creates it automatically, check permissions

### Issue: High costs
**Solution:**
- Use standard quality ($0.04 vs $0.08)
- Use 1024x1024 size ($0.04 vs $0.08)
- Avoid generating multiple variations
- Cache and reuse generated images

## Security

- API keys stored in environment variables
- Prompt validation (length, content)
- File system access restricted to storage directory
- Sanitized filenames prevent path traversal
- No user-uploaded images processed (generation only)
