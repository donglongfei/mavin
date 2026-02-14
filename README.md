# Mavin - AI-Powered Learning Assistant

Mavin is a full-stack AI-powered learning assistant with a cyberpunk-themed interface, featuring voice interaction, contextual awareness, and multi-modal AI capabilities.

## Quick Start

```bash
# Install dependencies
pnpm install

# Start backend
cd backend
pnpm dev

# Start frontend (in another terminal)
cd apps/web
pnpm dev
```

## Features

- 🎨 **Cyberpunk UI** - Glassmorphic design with neon accents
- 🤖 **AI Chat** - Integration with Claude/GPT-4 via OpenClaw
- 🎤 **Voice Interaction** - Local ASR (MooER) and TTS with MUSA GPU support
- 📝 **Context Management** - Track and organize your learning context
- 🖼️ **Multi-modal** - Vision and image generation capabilities
- ⚡ **Real-time** - Resizable panels and smooth interactions

## Documentation

All documentation is in the [`docs/`](./docs) folder:

### Getting Started
- [Quick Start Guide](./docs/QUICK_START.md) - Get up and running quickly
- [System Design](./docs/SYSTEM_DESIGN.md) - Architecture overview
- [Development Plan](./docs/DEVELOPMENT_PLAN.md) - Roadmap and tasks

### Voice Services
- [MUSA Voice Guide](./docs/MUSA_VOICE_GUIDE.md) - MUSA-native ASR/TTS setup
- [MUSA Voice Summary](./docs/MUSA_VOICE_SUMMARY.md) - Quick overview
- [Voice Implementation](./docs/VOICE_IMPLEMENTATION.md) - Implementation details
- [Voice Setup](./docs/VOICE_SETUP.md) - Complete setup guide
- [Voice Quickstart](./docs/VOICE_QUICKSTART.md) - Quick start for voice

### Development
- [Skills](./docs/SKILLS.md) - Reusable patterns and templates
- [Lessons Learned](./docs/LESSONS.md) - Mistakes and how to avoid them
- [Tasks](./docs/TASKS.md) - Task tracking and planning
- [Test Report](./docs/TEST_REPORT.md) - Testing documentation

### UI/UX
- [UX Specification](./docs/UX_SPECIFICATION.md) - Design specifications
- [UI Architecture](./docs/UNIVERSAL_UI_ARCHITECTURE.md) - UI structure

### Other
- [Notes](./docs/NOTES.md) - Development notes
- [OpenClaw Integration Fix](./docs/OPENCLAW_INTEGRATION_FIX.md) - Integration guide
- [Rename Summary](./docs/RENAME_SUMMARY.md) - Project renaming notes

## Tech Stack

- **Frontend**: React, TypeScript, Vite, TailwindCSS
- **Backend**: Node.js, Express, TypeScript
- **AI**: OpenClaw (Claude/GPT-4), MooER ASR
- **Voice**: MUSA GPU-accelerated (Moore Threads)
- **Database**: TBD
- **Deployment**: TBD

## Hardware Requirements

- **GPU**: Moore Threads S3000/S4000 (MUSA) or NVIDIA (CUDA) or CPU fallback
- **RAM**: 8GB+ recommended
- **Storage**: 5GB+ for models

## Project Structure

```
mavin/
├── apps/
│   └── web/              # Frontend application
├── backend/              # Backend API
│   ├── src/              # Source code
│   ├── python/           # Python services (ASR/TTS)
│   └── public/           # Static files
├── packages/
│   └── shared/           # Shared code between frontend/backend
└── docs/                 # Documentation
```

## License

[License TBD]

## Contributing

[Contributing guidelines TBD]

## Support

For issues and questions, please check the [documentation](./docs) or open an issue.
