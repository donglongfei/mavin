# Mavin Development Plan: Dual-AI Collaboration

**Version**: 1.0  
**Date**: February 13, 2026  
**Project Manager**: Mark  
**Status**: Active Development

---

## Executive Summary

This development plan organizes the Mavin project for a **dual-AI collaboration model** where two specialized AI agents work in parallel:

- **Manus AI**: Responsible for all frontend UI development (Tracks 1-4)
- **Claude AI**: Responsible for backend AI integration and services (Tracks 5-6)

By dividing responsibilities along the frontend/backend boundary, we enable parallel development while minimizing integration complexity. Each AI works independently on their assigned tracks, coordinating through well-defined API contracts and a shared integration layer.

**Estimated Timeline**: 6-8 weeks with proper coordination  
**Key Success Factor**: Clear interface definitions and regular integration checkpoints

---

## Division of Responsibilities

### Manus AI: Frontend UI Development

**Core Responsibility**: Build the user-facing interface that users see and interact with.

**Assigned Tracks**:
- **Track 1**: Display System (Focus/Companion/Ghost modes)
- **Track 2**: Avatar & Animation (digital human representation)
- **Track 3**: Input Pipeline (voice, text, camera capture)
- **Track 4**: Output Pipeline (TTS, text display, notifications)

**Technology Stack**:
- React 19 + TypeScript
- Tailwind CSS 4
- React Spring (animations)
- Zustand (state management)
- Web APIs (Speech, Camera, Audio)

**Development Environment**: Manus sandbox with webdev tools

---

### Claude AI: Backend AI Integration

**Core Responsibility**: Build the intelligence layer that processes inputs and generates responses.

**Assigned Tracks**:
- **Track 5**: Context Engine (user profiles, calendar, environment sensing)
- **Track 6**: AI Integration (LLM, STT, TTS, image generation, OCR)

**Technology Stack**:
- Node.js + TypeScript
- OpenClaw (AI orchestration)
- External APIs: OpenAI, Anthropic, Whisper, DALL-E, Tesseract
- Database: PostgreSQL or SQLite (for user profiles)

**Development Environment**: Local development or cloud environment with API access

---

## Integration Interface

The two AIs communicate through a **REST API + WebSocket** interface that serves as the contract between frontend and backend.

### API Endpoints (Claude → Manus)

**Base URL**: `http://localhost:3001/api` (development)

#### 1. Conversation API

```
POST /api/chat
Request:
{
  "userId": "string",
  "message": "string",
  "context": {
    "conversationId": "string",
    "displayMode": "focus" | "companion" | "ghost",
    "currentTask": "string"
  }
}

Response:
{
  "messageId": "string",
  "response": "string",
  "suggestedMode": "focus" | "companion" | "ghost" | null,
  "actions": [
    {
      "type": "generate_image" | "set_reminder" | "export_notes",
      "payload": any
    }
  ]
}
```

#### 2. Speech Recognition API

```
POST /api/speech/transcribe
Request: multipart/form-data
{
  "audio": File (Blob),
  "language": "string",
  "mode": "quick" | "accurate"
}

Response:
{
  "transcriptionId": "string",
  "text": "string",
  "confidence": number,
  "language": "string"
}
```

#### 3. Image Generation API

```
POST /api/image/generate
Request:
{
  "prompt": "string",
  "count": number,
  "size": "1024x1024" | "1792x1024" | "1024x1792",
  "style": "vivid" | "natural"
}

Response:
{
  "requestId": "string",
  "images": [
    {
      "id": "string",
      "url": "string",
      "thumbnail": "string"
    }
  ]
}
```

#### 4. Vision API (OCR + Understanding)

```
POST /api/vision/analyze
Request: multipart/form-data
{
  "image": File (Blob),
  "features": ["ocr", "objects", "scene"]
}

Response:
{
  "analysisId": "string",
  "text": "string" | null,
  "objects": Array<{name: string, confidence: number}>,
  "sceneDescription": "string" | null
}
```

#### 5. Context API

```
GET /api/context/current?userId={userId}
Response:
{
  "suggestedMode": "focus" | "companion" | "ghost",
  "suggestedInteraction": "active" | "passive" | "conversational" | "proactive",
  "currentEvent": CalendarEvent | null,
  "environment": {
    "noiseLevel": "quiet" | "moderate" | "noisy",
    "outputPreference": "voice" | "text"
  }
}

POST /api/context/event
Request:
{
  "userId": "string",
  "eventType": "app_changed" | "environment_changed" | "user_action",
  "payload": any
}

Response: { "acknowledged": true }
```

### WebSocket Events (Real-time Communication)

**Connection**: `ws://localhost:3001/ws?userId={userId}`

**Events from Backend to Frontend**:
```typescript
// Mode suggestion
{
  "type": "mode.suggested",
  "payload": {
    "mode": "companion",
    "reason": "Calendar event: Physics 101 starting in 5 minutes"
  }
}

// Proactive message
{
  "type": "message.proactive",
  "payload": {
    "message": "Timmy, you look stuck. Want me to help?",
    "priority": "medium"
  }
}

// Streaming response
{
  "type": "chat.stream",
  "payload": {
    "messageId": "msg-123",
    "chunk": "Here's the explanation...",
    "done": false
  }
}
```

**Events from Frontend to Backend**:
```typescript
// User input activity
{
  "type": "input.activity",
  "payload": {
    "isTyping": true,
    "isSpeaking": false
  }
}

// Display mode changed
{
  "type": "display.mode.changed",
  "payload": {
    "mode": "focus",
    "triggeredBy": "user" | "system"
  }
}
```

---

## Development Phases

### Phase 0: Setup & Prototyping (Week 1)

**Goal**: Establish development environment and validate technical approach.

#### Manus Tasks

- [ ] **M0.1**: Set up monorepo structure in `/home/ubuntu/marvin-poc-ui`
  - Create `packages/display`, `packages/avatar`, `packages/input`, `packages/output`
  - Configure TypeScript, Tailwind, and build tools
  - Set up shared types in `packages/shared`

- [ ] **M0.2**: Create mock API client for backend integration
  - Implement `ApiClient` class with all endpoint methods
  - Use mock responses for development without backend
  - Document expected request/response formats

- [ ] **M0.3**: Build Prototype 1 - Display Mode Transitions
  - Implement basic layouts for Focus/Companion/Ghost
  - Add smooth transition animations
  - Test performance (target: 60fps)

#### Claude Tasks

- [ ] **C0.1**: Set up backend project structure
  - Initialize Node.js + TypeScript project
  - Set up Express server with CORS
  - Configure environment variables for API keys

- [ ] **C0.2**: Implement API endpoints with mock responses
  - Create route handlers for all 5 API endpoints
  - Return mock data for testing
  - Set up WebSocket server

- [ ] **C0.3**: Integrate OpenClaw for AI orchestration
  - Set up OpenClaw configuration
  - Test connection to OpenAI/Anthropic APIs
  - Implement basic conversation flow

#### Integration Checkpoint

- [ ] **I0.1**: Manus connects to Claude's API successfully
- [ ] **I0.2**: Mock conversation flow works end-to-end
- [ ] **I0.3**: WebSocket connection establishes and sends test events

**Deliverable**: Working prototype with mock backend integration

---

### Phase 1: Core UI Components (Week 2-3)

**Goal**: Build all frontend UI components with mock data.

#### Manus Tasks

**Track 1: Display System**

- [ ] **M1.1**: Implement `UniversalShell` component
  - Fixed positioning, responsive breakpoints
  - Z-index management for proper layering

- [ ] **M1.2**: Implement `ModeLayoutManager`
  - Focus Mode layout (30% right panel)
  - Companion Mode layout (150x200px corner widget)
  - Ghost Mode layout (80px orb)

- [ ] **M1.3**: Implement `TransitionAnimationSystem`
  - All 6 transition animations (Focus↔Companion↔Ghost)
  - Performance optimization (GPU acceleration)
  - Responsive behavior on mobile

- [ ] **M1.4**: Set up Zustand store for global state
  - Define `GlobalState` schema
  - Implement state actions (setDisplayMode, etc.)
  - Add persistence (localStorage)

**Track 2: Avatar & Animation**

- [ ] **M2.1**: Implement `Avatar` component
  - Load avatar images for all states (idle/listening/thinking/speaking)
  - Responsive sizing based on Display Mode
  - State-based rendering logic

- [ ] **M2.2**: Implement `AnimationController`
  - State transition logic with timing
  - Breathing animation for idle state
  - Waveform animation for listening state

- [ ] **M2.3**: Implement gesture library
  - Create 5 core gestures (nod, shake, thumbsUp, pointUp, shrug)
  - Gesture playback system
  - Event emission on gesture completion

- [ ] **M2.4**: Implement skin system
  - Create 3 skin variants (professional, cartoon, minimal)
  - Skin switching logic
  - Asset loading with fallbacks

**Track 3: Input Pipeline**

- [ ] **M3.1**: Implement `VoiceInputManager`
  - Web Speech API integration
  - Push-to-talk and continuous listening modes
  - Volume level detection for waveform visualization

- [ ] **M3.2**: Implement `TextInputManager`
  - Multi-line input field with auto-expand
  - Markdown formatting shortcuts
  - Smart suggestion display

- [ ] **M3.3**: Implement `CameraInputManager`
  - Camera access with permissions handling
  - Live preview component
  - Snapshot capture functionality

- [ ] **M3.4**: Implement `InputCoordinator`
  - Conflict resolution between input types
  - Input event normalization
  - Send normalized events to backend via API

**Track 4: Output Pipeline**

- [ ] **M4.1**: Implement `VoiceOutputManager`
  - Browser TTS integration
  - Voice configuration (rate, pitch, volume)
  - Word-level timing events for lip-sync

- [ ] **M4.2**: Implement `TextDisplayManager`
  - Chat message bubbles with markdown rendering
  - Notification bubbles (info/hint/alert)
  - Overlay text for transcription display

- [ ] **M4.3**: Implement `NotificationManager`
  - Notification queue with priority handling
  - Auto-dismiss timers
  - Stacking and positioning logic

- [ ] **M4.4**: Implement `ContentPresenter`
  - Image gallery (2x2 grid)
  - Lightbox for full-screen viewing
  - Export functionality

#### Integration Checkpoint

- [ ] **I1.1**: All UI components render correctly with mock data
- [ ] **I1.2**: State management works across all components
- [ ] **I1.3**: Input events are captured and logged
- [ ] **I1.4**: Output displays correctly in all Display Modes

**Deliverable**: Complete UI with mock backend

---

### Phase 2: Backend AI Services (Week 2-3, parallel with Phase 1)

**Goal**: Build all backend AI integration services.

#### Claude Tasks

**Track 6: AI Integration**

- [ ] **C6.1**: Implement `LanguageModelInterface`
  - OpenAI GPT-4 integration
  - Anthropic Claude integration
  - Conversation context management
  - Streaming response support

- [ ] **C6.2**: Implement system prompt templates
  - Leo (student) prompt
  - Sarah (artist) prompt
  - Timmy (child) prompt
  - Dynamic prompt generation based on context

- [ ] **C6.3**: Implement `SpeechRecognitionService`
  - OpenAI Whisper API integration
  - Audio format conversion (if needed)
  - Language detection
  - Transcription caching

- [ ] **C6.4**: Implement `ImageGenerationService`
  - DALL-E 3 integration
  - Prompt enhancement (use LLM to expand user prompts)
  - Image variation generation
  - Image refinement logic

- [ ] **C6.5**: Implement `VisionService`
  - Tesseract.js for OCR
  - OpenAI Vision API for scene understanding
  - Object detection
  - Result caching

- [ ] **C6.6**: Implement `AIServiceCoordinator`
  - Request routing logic
  - Retry with exponential backoff
  - Fallback to alternative services
  - Cost tracking and optimization
  - Response caching (Redis or in-memory)

**Track 5: Context Engine**

- [ ] **C5.1**: Implement `UserProfileManager`
  - Database schema for user profiles
  - CRUD operations
  - Session recording
  - Preference learning algorithm

- [ ] **C5.2**: Implement `CalendarIntegration`
  - Google Calendar OAuth flow
  - Event fetching and parsing
  - Event type classification
  - Proactive notification scheduling

- [ ] **C5.3**: Implement `ApplicationMonitor`
  - Receive application change events from frontend
  - Application categorization
  - Mode suggestion logic

- [ ] **C5.4**: Implement `EnvironmentalSensor`
  - Receive environment data from frontend
  - Noise level classification
  - Output modality decision (voice vs text)

- [ ] **C5.5**: Implement `DecisionEngine`
  - Mode decision algorithm
  - Confidence scoring
  - User override tracking
  - Learning from corrections

#### Integration Checkpoint

- [ ] **I2.1**: All API endpoints return real AI responses
- [ ] **I2.2**: Conversation maintains context across multiple turns
- [ ] **I2.3**: Image generation produces quality results
- [ ] **I2.4**: OCR accurately extracts text from images
- [ ] **I2.5**: Context Engine suggests correct modes for test scenarios

**Deliverable**: Fully functional backend services

---

### Phase 3: Integration & Testing (Week 4-5)

**Goal**: Connect frontend and backend, test end-to-end flows.

#### Manus Tasks

- [ ] **M3.1**: Replace mock API client with real backend calls
  - Update `ApiClient` to use actual backend URL
  - Handle loading states and errors
  - Implement retry logic

- [ ] **M3.2**: Implement WebSocket event handlers
  - Subscribe to backend events
  - Update UI based on mode suggestions
  - Display proactive messages

- [ ] **M3.3**: Implement lip-sync for avatar
  - Use word timing events from `VoiceOutputManager`
  - Sync avatar mouth animation with speech
  - Test timing accuracy

- [ ] **M3.4**: Add error handling and loading states
  - Show loading indicators during API calls
  - Display error messages gracefully
  - Implement offline mode (queue requests)

- [ ] **M3.5**: Optimize performance
  - Lazy load components
  - Implement virtual scrolling for chat history
  - Reduce bundle size

#### Claude Tasks

- [ ] **C3.1**: Deploy backend to staging environment
  - Set up hosting (Railway, Render, or AWS)
  - Configure environment variables
  - Set up HTTPS and CORS

- [ ] **C3.2**: Implement rate limiting and security
  - API rate limiting per user
  - Input validation and sanitization
  - Authentication (if needed)

- [ ] **C3.3**: Add logging and monitoring
  - Request/response logging
  - Error tracking (Sentry or similar)
  - Performance metrics

- [ ] **C3.4**: Optimize AI service costs
  - Implement aggressive caching
  - Use cheaper models for simple queries
  - Batch requests where possible

#### Joint Tasks (Both AIs)

- [ ] **J3.1**: Test Leo scenario end-to-end
  - Start lecture recording
  - Transcribe in real-time
  - Detect keyword and show definition
  - Ask question and receive explanation

- [ ] **J3.2**: Test Sarah scenario end-to-end
  - Request image generation
  - Generate 4 variations
  - Refine selected image
  - Export to application

- [ ] **J3.3**: Test Timmy scenario end-to-end
  - Show homework via camera
  - OCR extracts problem
  - Socratic dialogue guides to solution
  - Celebrate success with animation

- [ ] **J3.4**: Test mode switching
  - Calendar event triggers mode change
  - Application change triggers mode change
  - User override works correctly

- [ ] **J3.5**: Performance testing
  - Measure end-to-end latency
  - Test with slow network conditions
  - Verify 60fps animations

#### Integration Checkpoint

- [ ] **I3.1**: All three scenarios work end-to-end
- [ ] **I3.2**: Mode switching is automatic and accurate
- [ ] **I3.3**: Performance meets targets (see Success Metrics)
- [ ] **I3.4**: Error handling works gracefully

**Deliverable**: Fully integrated Mavin system

---

### Phase 4: Polish & Optimization (Week 6)

**Goal**: Refine UX, fix bugs, optimize performance.

#### Manus Tasks

- [ ] **M4.1**: UX polish
  - Smooth out animation timing
  - Improve visual feedback for interactions
  - Add micro-interactions (button hover effects, etc.)

- [ ] **M4.2**: Accessibility improvements
  - Keyboard navigation for all features
  - Screen reader support
  - Sufficient color contrast

- [ ] **M4.3**: Mobile optimization
  - Test on various screen sizes
  - Optimize touch interactions
  - Reduce mobile data usage

- [ ] **M4.4**: Documentation
  - User guide for each scenario
  - Troubleshooting common issues
  - FAQ

#### Claude Tasks

- [ ] **C4.1**: Fine-tune AI responses
  - Adjust system prompts based on testing
  - Improve context retention
  - Reduce hallucinations

- [ ] **C4.2**: Cost optimization
  - Analyze API usage patterns
  - Implement more aggressive caching
  - Use cheaper models where appropriate

- [ ] **C4.3**: Monitoring setup
  - Set up dashboards for key metrics
  - Configure alerts for errors
  - Track user satisfaction

- [ ] **C4.4**: API documentation
  - Document all endpoints with examples
  - Create Postman collection
  - Write integration guide for future developers

#### Joint Tasks

- [ ] **J4.1**: Bug bash
  - Test all features systematically
  - Fix critical bugs
  - Prioritize remaining issues

- [ ] **J4.2**: User testing
  - Recruit test users for each scenario
  - Observe usage and collect feedback
  - Iterate based on feedback

**Deliverable**: Production-ready Mavin v1.0

---

### Phase 5: Deployment & Launch (Week 7-8)

**Goal**: Deploy to production and launch.

#### Manus Tasks

- [ ] **M5.1**: Production build
  - Optimize bundle size
  - Enable production mode
  - Test production build locally

- [ ] **M5.2**: Deploy frontend
  - Use Manus built-in hosting
  - Configure custom domain (if needed)
  - Set up analytics

- [ ] **M5.3**: Create demo video
  - Record all three scenarios
  - Add voiceover explaining features
  - Publish on project page

#### Claude Tasks

- [ ] **C5.1**: Production deployment
  - Deploy backend to production environment
  - Configure auto-scaling
  - Set up database backups

- [ ] **C5.2**: Security audit
  - Review API security
  - Check for exposed secrets
  - Implement additional security measures if needed

- [ ] **C5.3**: Set up monitoring
  - Configure uptime monitoring
  - Set up error alerts
  - Create performance dashboard

#### Joint Tasks

- [ ] **J5.1**: Smoke testing in production
  - Test all critical paths
  - Verify API connectivity
  - Check performance under load

- [ ] **J5.2**: Launch announcement
  - Prepare launch materials
  - Share with stakeholders
  - Collect initial feedback

**Deliverable**: Mavin v1.0 live in production

---

## Coordination Protocols

### Daily Sync

**Format**: Asynchronous status update (via shared document or chat)

**Template**:
```
Date: [Date]
AI: [Manus/Claude]

✅ Completed Today:
- [Task ID]: [Brief description]

🚧 In Progress:
- [Task ID]: [Brief description] - [% complete]

🚫 Blocked:
- [Task ID]: [Blocker description] - Needs: [What's needed to unblock]

📅 Plan for Tomorrow:
- [Task ID]: [Brief description]
```

### Weekly Integration Meeting

**Format**: Synchronous discussion (Mark coordinates)

**Agenda**:
1. Demo completed features
2. Test integration points
3. Resolve API contract issues
4. Adjust timeline if needed
5. Plan next week's priorities

### Issue Tracking

**Tool**: GitHub Issues in `donglongfei/mavin` repository

**Labels**:
- `manus`: Tasks for Manus AI
- `claude`: Tasks for Claude AI
- `integration`: Tasks requiring both AIs
- `bug`: Bug reports
- `enhancement`: Feature requests
- `blocked`: Blocked tasks

**Workflow**:
1. Create issue for each task
2. Assign to appropriate AI (via label)
3. Update status in issue comments
4. Close when complete

### API Contract Changes

**Process**:
1. Proposing AI creates GitHub issue with `api-change` label
2. Describe proposed change and rationale
3. Other AI reviews and approves/requests changes
4. Update API documentation
5. Implement change in both frontend and backend
6. Test integration

**Rule**: Never break existing API contracts without coordination

---

## Success Metrics

### Technical Metrics

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Display mode transition FPS | 60fps | Chrome DevTools Performance tab |
| Voice input latency | <500ms | Timestamp difference (speech end → transcription) |
| AI response latency | <2s | Timestamp difference (user input → AI response) |
| End-to-end latency | <3s | Timestamp difference (user speaks → Mavin responds) |
| Memory usage | <200MB | Chrome Task Manager |
| Bundle size | <2MB | Webpack Bundle Analyzer |
| API error rate | <1% | Backend logs |
| Uptime | >99% | Uptime monitoring service |

### Quality Metrics

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Voice transcription accuracy | >90% | Manual review of 100 samples |
| OCR accuracy | >85% | Manual review of 50 samples |
| Context mode prediction accuracy | >80% | User acceptance rate after 1 week |
| Image generation relevance | >90% | User satisfaction survey |
| Bug count (critical) | 0 | GitHub Issues |
| Bug count (non-critical) | <10 | GitHub Issues |

### User Experience Metrics

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Task completion rate | >95% | User testing observations |
| User satisfaction (SUS score) | >80 | Post-testing survey |
| Time to first successful interaction | <30s | User testing observations |
| Mode override rate | <20% | Analytics (% of suggestions rejected) |

---

## Risk Management

### Technical Risks

| Risk | Probability | Impact | Owner | Mitigation |
|------|------------|--------|-------|------------|
| Web Speech API accuracy insufficient | Medium | High | Manus | Fall back to Whisper API, implement noise cancellation |
| Avatar animations cause performance issues | Low | Medium | Manus | Use CSS transforms only, implement frame skipping |
| AI API costs exceed budget | Medium | High | Claude | Implement aggressive caching, use cheaper models |
| Context Engine predictions inaccurate | High | Medium | Claude | Allow easy user override, learn from corrections |
| Integration issues between frontend/backend | Medium | High | Both | Early integration testing, clear API contracts |

### Schedule Risks

| Risk | Probability | Impact | Owner | Mitigation |
|------|------------|--------|-------|------------|
| Manus and Claude progress at different speeds | High | Medium | Mark | Buffer tasks, reassign priorities weekly |
| API contract changes mid-development | Medium | High | Both | Version APIs, maintain backward compatibility |
| External API changes (OpenAI, etc.) | Low | Medium | Claude | Monitor changelogs, maintain abstraction layer |
| Integration takes longer than expected | High | High | Both | Schedule integration time explicitly, start early |

### Coordination Risks

| Risk | Probability | Impact | Owner | Mitigation |
|------|------------|--------|-------|------------|
| Miscommunication about requirements | Medium | High | Mark | Clear written specifications, regular sync |
| Conflicting assumptions about API behavior | Medium | High | Both | Document API contracts explicitly, test early |
| Blocked waiting for other AI | Medium | Medium | Both | Identify dependencies early, communicate blockers immediately |

---

## Task Summary

### Manus AI Task Count

| Phase | Task Count | Estimated Hours |
|-------|-----------|----------------|
| Phase 0: Setup & Prototyping | 3 | 16 |
| Phase 1: Core UI Components | 16 | 80 |
| Phase 3: Integration & Testing | 5 | 24 |
| Phase 4: Polish & Optimization | 4 | 16 |
| Phase 5: Deployment & Launch | 3 | 8 |
| **Total** | **31** | **144** |

### Claude AI Task Count

| Phase | Task Count | Estimated Hours |
|-------|-----------|----------------|
| Phase 0: Setup & Prototyping | 3 | 16 |
| Phase 2: Backend AI Services | 11 | 88 |
| Phase 3: Integration & Testing | 4 | 20 |
| Phase 4: Polish & Optimization | 4 | 16 |
| Phase 5: Deployment & Launch | 3 | 12 |
| **Total** | **25** | **152** |

### Joint Tasks

| Phase | Task Count | Estimated Hours |
|-------|-----------|----------------|
| Phase 0: Setup & Prototyping | 3 | 8 |
| Phase 3: Integration & Testing | 5 | 40 |
| Phase 4: Polish & Optimization | 2 | 16 |
| Phase 5: Deployment & Launch | 2 | 8 |
| **Total** | **12** | **72** |

**Grand Total**: 68 tasks, ~368 hours (~9 weeks at 40 hours/week)

---

## Getting Started

### For Manus AI

1. **Read the specifications**:
   - `UX_SPECIFICATION.md` - Understand user scenarios
   - `SYSTEM_DESIGN.md` - Understand system architecture
   - This document - Understand your tasks

2. **Set up development environment**:
   - Start with Phase 0 tasks (M0.1, M0.2, M0.3)
   - Create mock API client for independent development
   - Build Prototype 1 to validate approach

3. **Begin Phase 1 development**:
   - Work through Track 1-4 tasks sequentially
   - Test each component with mock data
   - Document any API contract questions in GitHub Issues

4. **Coordinate with Claude**:
   - Post daily status updates
   - Attend weekly integration meetings
   - Raise blockers immediately

### For Claude AI

1. **Read the specifications**:
   - `UX_SPECIFICATION.md` - Understand user scenarios
   - `SYSTEM_DESIGN.md` - Understand system architecture
   - This document - Understand your tasks

2. **Set up development environment**:
   - Start with Phase 0 tasks (C0.1, C0.2, C0.3)
   - Set up OpenClaw and test API connections
   - Implement mock API endpoints for Manus to develop against

3. **Begin Phase 2 development**:
   - Work through Track 5-6 tasks
   - Test each service independently
   - Document API contracts clearly

4. **Coordinate with Manus**:
   - Post daily status updates
   - Attend weekly integration meetings
   - Raise blockers immediately

### For Mark (Project Manager)

1. **Set up coordination infrastructure**:
   - Create GitHub Issues for all tasks
   - Set up shared status document
   - Schedule weekly integration meetings

2. **Monitor progress**:
   - Review daily status updates
   - Track task completion in GitHub
   - Identify and resolve blockers

3. **Facilitate integration**:
   - Ensure both AIs understand API contracts
   - Mediate any disagreements about requirements
   - Adjust timeline based on progress

4. **Quality assurance**:
   - Test integrated features weekly
   - Collect user feedback
   - Prioritize bug fixes

---

## Appendix: Quick Reference

### Key Files

- `UX_SPECIFICATION.md` - User experience requirements
- `SYSTEM_DESIGN.md` - Technical architecture
- `DEVELOPMENT_PLAN.md` - This document
- `packages/shared/types.ts` - Shared TypeScript types
- `packages/shared/api-client.ts` - API client (Manus)
- `backend/routes/` - API route handlers (Claude)

### Key Commands

**Manus (in sandbox)**:
```bash
cd /home/ubuntu/marvin-poc-ui
pnpm install
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm check        # TypeScript type checking
```

**Claude (local/cloud)**:
```bash
cd backend
npm install
npm run dev       # Start development server
npm run build     # Build for production
npm test          # Run tests
```

### Contact & Support

- **Project Manager**: Mark
- **Repository**: https://github.com/donglongfei/mavin
- **Issue Tracker**: https://github.com/donglongfei/mavin/issues

---

**Document Version**: 1.0  
**Last Updated**: February 13, 2026  
**Next Review**: End of Phase 0 (Week 1)
