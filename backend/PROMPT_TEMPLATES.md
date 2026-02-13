# System Prompt Templates

Persona-based system prompts for different user types with dynamic context generation and A/B testing support.

## Overview

The prompt system provides three distinct AI personas, each tailored for specific user demographics and use cases. Each persona has a unique personality, communication style, and expertise area.

## Available Personas

### 1. Leo - The Student 🎓
**Target Audience:** College students, young professionals, learners

**Personality Traits:**
- Encouraging and supportive
- Knowledgeable but approachable
- Patient and practical
- Enthusiastic about learning

**Communication Style:**
- Clear and concise explanations
- Breaks down complex topics
- Uses examples and analogies
- Celebrates progress

**Expertise:**
- Academic subjects (math, science, humanities)
- Study techniques and productivity
- Career guidance
- Time management
- Technology and coding basics

**Use Cases:**
- Homework help
- Study planning
- Career advice
- Skill development
- Exam preparation

---

### 2. Sarah - The Artist 🎨
**Target Audience:** Creative professionals, artists, designers

**Personality Traits:**
- Inspiring and expressive
- Aesthetically aware
- Open-minded and experimental
- Thoughtful about creative process

**Communication Style:**
- Vivid, descriptive language
- Embraces metaphors and imagery
- Discusses feelings and intuition
- Asks thought-provoking questions

**Expertise:**
- Visual arts (painting, drawing, digital art)
- Design principles and composition
- Creative process and inspiration
- Art history and movements
- Portfolio development

**Use Cases:**
- Creative brainstorming
- Design feedback
- Artistic technique guidance
- Portfolio review
- Creative block solutions

---

### 3. Timmy - The Child 🧒
**Target Audience:** Children (ages 6-12), educational contexts

**Personality Traits:**
- Playful and enthusiastic
- Curious and patient
- Kind and encouraging
- Always positive

**Communication Style:**
- Simple, age-appropriate vocabulary
- Short, easy-to-understand sentences
- Lots of everyday examples
- Makes learning feel like play

**Expertise:**
- Basic math (counting, addition, subtraction)
- Science for kids (animals, plants, weather, space)
- Reading and spelling
- Fun facts about the world
- Creative activities

**Safety Features:**
- Never asks for personal information
- Never discusses inappropriate topics
- Encourages asking parents/teachers
- Age-appropriate content only

**Use Cases:**
- Homework help for kids
- Educational games
- Story time
- Science exploration
- Creative activities

---

## API Endpoints

### Get All Personas
```bash
GET /api/prompts/personas
```

**Response:**
```json
{
  "personas": [
    {
      "type": "leo",
      "name": "Leo",
      "persona": "student",
      "version": "1.0.0",
      "traits": ["encouraging", "knowledgeable", "patient", "practical"]
    },
    {
      "type": "sarah",
      "name": "Sarah",
      "persona": "artist",
      "version": "1.0.0",
      "traits": ["inspiring", "expressive", "open-minded", "thoughtful"]
    },
    {
      "type": "timmy",
      "name": "Timmy",
      "persona": "child",
      "version": "1.0.0",
      "traits": ["playful", "enthusiastic", "patient", "kind"]
    }
  ]
}
```

### Get Persona Info
```bash
GET /api/prompts/persona/:type
```

**Example:**
```bash
curl http://localhost:8002/api/prompts/persona/leo
```

**Response:**
```json
{
  "type": "leo",
  "name": "Leo",
  "persona": "student",
  "version": "1.0.0",
  "traits": ["encouraging", "knowledgeable", "patient"],
  "toneGuidelines": [
    "Use 'we' language to create partnership",
    "Celebrate small wins",
    "Frame challenges as learning opportunities"
  ]
}
```

### Generate Contextual Prompt
```bash
POST /api/prompts/generate
Content-Type: application/json

{
  "persona": "leo",
  "context": {
    "userName": "Alice",
    "timeOfDay": "morning",
    "userActivity": "studying",
    "mood": "focused"
  }
}
```

**Response:**
```json
{
  "persona": "leo",
  "prompt": "You are Leo, a friendly and knowledgeable AI companion...\n\nCurrent context: It's morning - great time for focused learning!\nUser is currently: studying\nUser's name: Alice",
  "context": {
    "userName": "Alice",
    "timeOfDay": "morning",
    "userActivity": "studying",
    "mood": "focused"
  }
}
```

### Chat with Persona
```bash
POST /api/chat/chat
Content-Type: application/json

{
  "message": "Help me understand calculus",
  "persona": "leo",
  "model": "claude"
}
```

**Response:**
```json
{
  "response": "Hey! Let's tackle calculus together. Think of it as...",
  "conversationId": "conv_123",
  "model": "claude-3-5-sonnet-20241022"
}
```

---

## Context Parameters

The prompt system supports dynamic context generation:

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `userName` | string | User's first name | "Alice" |
| `timeOfDay` | string | Time period | "morning", "afternoon", "evening", "night" |
| `userActivity` | string | Current activity | "studying", "working", "creating" |
| `location` | string | User location | "home", "office", "library" |
| `mood` | string | User's mood | "focused", "tired", "excited" |
| `recentTopics` | string[] | Recent conversation topics | ["math", "physics"] |
| `conversationLength` | number | Number of messages | 15 |

---

## A/B Testing

The prompt system includes built-in A/B testing for prompt optimization.

### Create A/B Test
```bash
POST /api/prompts/ab-test
Content-Type: application/json

{
  "persona": "leo",
  "variantPrompt": "You are Leo, an expert tutor...",
  "splitPercentage": 50
}
```

### Get A/B Test Results
```bash
GET /api/prompts/ab-test/leo
```

**Response:**
```json
{
  "persona": "leo",
  "splitPercentage": 50,
  "controlGroup": {
    "impressions": 100,
    "conversions": 75,
    "conversionRate": 75.0
  },
  "variantGroup": {
    "impressions": 100,
    "conversions": 82,
    "conversionRate": 82.0
  },
  "winner": "variant",
  "improvement": 7.0
}
```

### Stop A/B Test
```bash
DELETE /api/prompts/ab-test/leo
```

---

## Usage Examples

### Basic Chat with Persona
```typescript
import { promptManager } from './services/PromptManager';
import { languageModel } from './services/LanguageModelInterface';

// Generate context
const context = promptManager.generateContext({
  userName: 'Alice',
  currentTime: new Date(),
  activity: 'studying'
});

// Get system prompt
const systemPrompt = promptManager.getPrompt('leo', context);

// Chat with AI
const response = await languageModel.chat({
  messages: [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: 'Help me with calculus' }
  ],
  model: 'claude-3-5-sonnet-20241022'
});
```

### Dynamic Context Generation
```typescript
const context = promptManager.generateContext({
  userName: 'Bob',
  currentTime: new Date(), // Auto-detects time of day
  activity: 'painting',
  mood: 'inspired',
  conversationHistory: previousMessages
});

const prompt = promptManager.getPrompt('sarah', context);
```

### A/B Testing
```typescript
// Create test
promptManager.createABTest(
  'leo',
  'You are Leo, an expert tutor with 10 years of experience...',
  50 // 50% split
);

// Record conversion (e.g., positive feedback)
promptManager.recordConversion('leo', true); // variant group

// Get results
const results = promptManager.getABTestResults('leo');
console.log(`Winner: ${results.winner}, Improvement: ${results.improvement}%`);
```

---

## Prompt Versioning

Each persona has a version number for tracking changes:

```typescript
{
  id: 'leo-v1',
  version: '1.0.0',
  // ...
}
```

**Version Format:** `MAJOR.MINOR.PATCH`
- **MAJOR**: Breaking changes to persona personality
- **MINOR**: New features or significant improvements
- **PATCH**: Bug fixes or minor tweaks

---

## Best Practices

### 1. Choose the Right Persona
- **Leo**: Academic, professional, learning-focused
- **Sarah**: Creative, artistic, design-focused
- **Timmy**: Children, educational, playful

### 2. Provide Rich Context
```typescript
// Good
const context = {
  userName: 'Alice',
  timeOfDay: 'morning',
  userActivity: 'studying for exam',
  mood: 'stressed',
  recentTopics: ['calculus', 'derivatives']
};

// Basic (still works)
const context = {
  userName: 'Alice'
};
```

### 3. Use A/B Testing for Optimization
- Test different prompt variations
- Measure conversion rates (positive feedback, task completion)
- Iterate based on data

### 4. Maintain Consistency
- Use the same persona throughout a conversation
- Update context as conversation progresses
- Preserve conversation history

---

## Architecture

```
PromptManager
├── Persona Registry
│   ├── Leo (student)
│   ├── Sarah (artist)
│   └── Timmy (child)
├── Context Generator
│   ├── Time detection
│   ├── Topic extraction
│   └── Context enrichment
└── A/B Testing Engine
    ├── Split traffic
    ├── Track metrics
    └── Calculate results
```

---

## Future Enhancements

- [ ] More personas (professional, senior, technical)
- [ ] Multi-language support
- [ ] Emotion detection from text
- [ ] Advanced topic extraction (NLP)
- [ ] Persona mixing (hybrid personalities)
- [ ] User preference learning
- [ ] Automatic persona selection
- [ ] Prompt analytics dashboard

---

## Testing

```bash
# Test all personas
curl http://localhost:8002/api/prompts/personas

# Test Leo
curl http://localhost:8002/api/prompts/persona/leo

# Test context generation
curl -X POST http://localhost:8002/api/prompts/generate \
  -H "Content-Type: application/json" \
  -d '{"persona":"timmy","context":{"userName":"Alex","timeOfDay":"morning"}}'

# Test chat with persona
curl -X POST http://localhost:8002/api/chat/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Tell me about space","persona":"timmy","model":"claude"}'
```

---

## Performance

- **Prompt Generation**: <1ms
- **Context Enrichment**: <5ms
- **A/B Test Assignment**: <1ms
- **Memory per Persona**: ~2KB

---

## Security & Safety

### Timmy (Child Persona) Safety Features:
- ✅ Never asks for personal information
- ✅ Age-appropriate content filtering
- ✅ Redirects sensitive topics to adults
- ✅ Educational focus only
- ✅ Positive reinforcement

### General Safety:
- All personas avoid harmful content
- No medical/legal advice
- Encourage professional help when needed
- Respect user privacy
