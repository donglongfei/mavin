# Mavin AIBook - Digital Companion POC

A workspace-centric AI companion interface with three-pane cockpit layout, featuring a 2D digital human avatar with animated states.

## 🎨 Design Philosophy

**Cyberpunk Lab** aesthetic with:
- Deep indigo black background (#0a0e1a)
- Neon cyan (#00f0ff) for AI outputs
- Neon purple (#b24bf3) for user inputs
- Neon orange (#ff6b35) for recording states
- Glassmorphic effects with glow and scan line animations

## 🏗️ Architecture

### Three-Pane Cockpit Layout

1. **Left Pane - Context Manager**
   - Project navigation with category grouping
   - Global search (⌘K)
   - Live recording button with pulse animation

2. **Middle Pane - Dynamic Workspace**
   - Three view modes:
     - **Timeline View**: For students - chronological cards with audio/notes/snapshots
     - **Canvas View**: For artists - infinite whiteboard with draggable elements
     - **Notebook View**: For developers - Markdown editor with AI suggestions

3. **Right Pane - AI Copilot**
   - 2D Digital Avatar with 4 animated states:
     - `idle`: Breathing animation, cyan border
     - `speaking`: Purple border, audio waveform
     - `thinking`: Cyan border, loading dots
     - `listening`: Orange border, ripple effect + waveform
   - Chat interface with message history
   - Voice interaction button

## 🚀 Getting Started

### Prerequisites

- Node.js 22.x
- pnpm 10.x

### Installation

```bash
# Clone the repository
gh repo clone donglongfei/mavin-aibook-poc
cd mavin-aibook-poc

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

The app will be available at `http://localhost:3000`

### Available Scripts

```bash
pnpm dev        # Start development server with HMR
pnpm build      # Build for production
pnpm preview    # Preview production build
pnpm check      # TypeScript type checking
pnpm format     # Format code with Prettier
```

## 📁 Project Structure

```
client/
  public/           # Static assets (served at root)
  src/
    components/     # React components
      views/        # View mode components (Timeline, Canvas, Notebook)
      widgets/      # Smart card widgets (AudioPlayer, ActionItem, DeepDive)
      ui/           # shadcn/ui components
      Layout.tsx    # Three-pane layout wrapper
      LeftPane.tsx  # Context manager
      MiddlePane.tsx # Dynamic workspace
      RightPane.tsx  # AI copilot
      DigitalAvatar.tsx # 2D avatar with animations
      VoiceVisualizer.tsx # Audio waveform component
    pages/          # Page components
    hooks/          # Custom React hooks
    contexts/       # React contexts
    lib/            # Utility functions
    App.tsx         # Routes & top-level layout
    main.tsx        # React entry point
    index.css       # Global styles & design tokens
server/             # Static file server (placeholder)
shared/             # Shared constants
```

## 🎯 Key Features

### Digital Avatar States

The avatar automatically transitions between states based on user interaction:

```typescript
type AvatarState = "idle" | "speaking" | "thinking" | "listening";
```

- **Idle**: Gentle breathing animation, waiting for input
- **Speaking**: AI is responding, shows purple waveform
- **Thinking**: Processing request, displays loading animation
- **Listening**: Voice input active, orange ripple + waveform

### Smart Card Widgets

Pre-built components for common AI interactions:

- **AudioPlayerCard**: Waveform visualization, chapter markers, transcribe button
- **ActionItemCard**: Checkbox list with progress bar and calendar integration
- **DeepDiveCard**: Research progress indicator with source links

### View Modes

Switch between different workspace layouts optimized for different personas:

1. **Timeline View** (Students): Chronological event cards with time markers
2. **Canvas View** (Artists): Draggable mood board with infinite canvas
3. **Notebook View** (Developers): Markdown editor with AI research panel

## 🎨 Customization

### Color Scheme

Edit `client/src/index.css` to customize the color palette:

```css
:root {
  --neon-cyan: oklch(0.85 0.18 195);
  --neon-purple: oklch(0.65 0.25 300);
  --neon-orange: oklch(0.70 0.20 40);
  --background: oklch(0.12 0.03 250);
  /* ... */
}
```

### Typography

Fonts are loaded from Google Fonts in `client/index.html`:

- **JetBrains Mono**: Headings (monospace for tech feel)
- **Inter**: Body text (readable sans-serif)
- **Orbitron**: Emphasis text (futuristic display font)

### Avatar Images

Replace avatar images in `DigitalAvatar.tsx` with your own:

```typescript
const avatarImages = {
  idle: "your-idle-image-url",
  speaking: "your-speaking-image-url",
  thinking: "your-thinking-image-url",
  listening: "your-listening-image-url"
};
```

## 🔧 Tech Stack

- **Framework**: React 19 + Wouter (client-side routing)
- **Styling**: Tailwind CSS 4 + shadcn/ui components
- **Build Tool**: Vite 7
- **Language**: TypeScript 5.6
- **Package Manager**: pnpm 10

## 📝 Development Notes

### Adding New Components

Use shadcn/ui CLI to add pre-built components:

```bash
npx shadcn@latest add [component-name]
```

### State Management

Currently using React's built-in `useState` and `useContext`. For complex state, consider adding Zustand:

```bash
pnpm add zustand
```

### API Integration

To connect real AI services:

1. Upgrade to full-stack with `webdev_add_feature`
2. Add API keys to environment variables
3. Create API routes in `server/` directory
4. Call from frontend using `fetch` or `axios`

## 🚧 Roadmap

- [ ] Web Speech API integration for voice input
- [ ] Real-time audio transcription with Whisper
- [ ] Lip-sync animation based on audio output
- [ ] Drag-and-drop functionality in Canvas View
- [ ] Export/import project data
- [ ] Multi-language support
- [ ] Mobile responsive layout

## 📄 License

MIT

## 🤝 Contributing

This is a POC project. Feel free to fork and customize for your own needs!

---

Built with ❤️ using Manus AI
