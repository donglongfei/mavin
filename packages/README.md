# Mavin Packages

This directory contains the modular packages that make up the Mavin frontend application.

## Package Structure

```
packages/
├── shared/          # Shared types, utilities, and API client
├── display/         # Display System (Focus/Companion/Ghost modes)
├── avatar/          # Avatar & Animation (digital human)
├── input/           # Input Pipeline (voice, text, camera)
└── output/          # Output Pipeline (TTS, text display, notifications)
```

## Package Descriptions

### `@mavin/shared`
**Purpose**: Shared TypeScript types, utilities, and API client used across all packages.

**Exports**:
- `types.ts` - All TypeScript interfaces and types
- `utils.ts` - Common utility functions
- `api-client.ts` - Backend API client (created in M0.2)

**Usage**:
```typescript
import { DisplayMode, generateId, ApiClient } from '@mavin/shared';
```

### `@mavin/display`
**Purpose**: Display System that manages the three display modes and transitions.

**Components** (to be created in Phase 1):
- `UniversalShell` - Fixed positioning container
- `ModeLayoutManager` - Layout logic for each mode
- `TransitionAnimationSystem` - Smooth transitions between modes

**Responsibilities**:
- Render appropriate layout based on current DisplayMode
- Handle mode transitions with animations
- Manage responsive behavior

### `@mavin/avatar`
**Purpose**: Avatar & Animation system for the digital human representation.

**Components** (to be created in Phase 1):
- `Avatar` - Main avatar component
- `AnimationController` - State-based animation logic
- `gestures/` - Gesture library (nod, shake, thumbsUp, etc.)
- `skins/` - Avatar skin variants (professional, cartoon, minimal)

**Responsibilities**:
- Render avatar based on current state (idle/listening/thinking/speaking)
- Play animations and gestures
- Support multiple skins

### `@mavin/input`
**Purpose**: Input Pipeline that handles voice, text, and camera inputs.

**Components** (to be created in Phase 1):
- `VoiceInputManager` - Web Speech API integration
- `TextInputManager` - Text input with markdown support
- `CameraInputManager` - Camera access and capture
- `InputCoordinator` - Conflict resolution and event normalization

**Responsibilities**:
- Capture user input from multiple sources
- Normalize input events
- Send events to backend via API

### `@mavin/output`
**Purpose**: Output Pipeline that handles voice, text, and visual outputs.

**Components** (to be created in Phase 1):
- `VoiceOutputManager` - TTS integration
- `TextDisplayManager` - Chat bubbles and markdown rendering
- `NotificationManager` - Notification queue and display
- `ContentPresenter` - Image gallery and content display

**Responsibilities**:
- Display AI responses in appropriate format
- Manage notification queue
- Present generated content (images, documents)

## Development Guidelines

### Importing Between Packages

All packages can import from `@mavin/shared`:
```typescript
import { DisplayMode, ApiClient } from '@mavin/shared';
```

Packages should NOT import from each other (except `shared`). Communication between packages should happen through:
1. **Global state** (Zustand store in `shared`)
2. **Event bus** (to be created in `shared`)
3. **Props** (when components are composed)

### TypeScript Configuration

Each package uses the root `tsconfig.json` with path aliases:
```json
{
  "compilerOptions": {
    "paths": {
      "@mavin/shared": ["./packages/shared"],
      "@mavin/display": ["./packages/display"],
      "@mavin/avatar": ["./packages/avatar"],
      "@mavin/input": ["./packages/input"],
      "@mavin/output": ["./packages/output"]
    }
  }
}
```

### Testing

Each package will have its own tests:
```
packages/
├── display/
│   ├── __tests__/
│   └── components/
```

Run tests for all packages:
```bash
pnpm test
```

## Current Status

- [x] `@mavin/shared` - Types, utils, and package structure created
- [ ] `@mavin/shared` - API client (M0.2)
- [ ] `@mavin/display` - Components (Phase 1)
- [ ] `@mavin/avatar` - Components (Phase 1)
- [ ] `@mavin/input` - Components (Phase 1)
- [ ] `@mavin/output` - Components (Phase 1)

## Next Steps

1. Complete M0.2: Create API client in `@mavin/shared`
2. Complete M0.3: Build prototype using `@mavin/display`
3. Phase 1: Implement all package components
