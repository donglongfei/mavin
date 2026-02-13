# Mavin Backend

AI Integration and Context Engine for Mavin.

## Setup

1. Install dependencies:
```bash
pnpm install
```

2. Configure environment:
```bash
cp .env.example .env
# Edit .env with your API keys
```

3. Run development server:
```bash
pnpm dev
```

## Project Structure

```
backend/
├── src/
│   ├── routes/       # API route handlers
│   ├── services/     # Business logic & AI integration
│   ├── utils/        # Helper functions
│   ├── types/        # TypeScript type definitions
│   └── index.ts      # Application entry point
├── package.json
├── tsconfig.json
└── .env.example
```

## API Endpoints

- `POST /api/chat` - Chat with AI
- `POST /api/speech/transcribe` - Speech to text
- `POST /api/image/generate` - Generate images
- `POST /api/vision/analyze` - Analyze images
- `GET /api/context/current` - Get current context
