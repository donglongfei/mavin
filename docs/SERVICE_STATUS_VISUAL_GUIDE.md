# Service Status UI - Visual Guide

## UI Layout Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              MAVIN UI LAYOUT                                 │
├─────────────┬──────────────────────────────┬────────────────────────────────┤
│             │                              │                                │
│  LEFT PANE  │       MIDDLE PANE            │         RIGHT PANE             │
│             │                              │                                │
│ ┌─────────┐ │                              │  ┌──────────────────────────┐  │
│ │ 📁  ⚙️  │ │                              │  │ 🟢🟢🟢 [↻]             │  │
│ └─────────┘ │                              │  │ MAVIN AI                 │  │
│             │                              │  │ Your Digital Companion   │  │
│   Projects  │                              │  └──────────────────────────┘  │
│     or      │                              │                                │
│  Services   │                              │     (Compact Status Here)      │
│             │                              │                                │
│             │                              │                                │
│             │                              │                                │
│ (Full Panel)│                              │                                │
│             │                              │                                │
└─────────────┴──────────────────────────────┴────────────────────────────────┘
```

---

## Right Pane: Compact Status (Always Visible)

**Location**: Top-right header, next to "MAVIN AI"

```
┌────────────────────────────────────────────────────┐
│  [Avatar Image]                                    │
├────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────┐ │
│  │  [✓] MAVIN AI              🟢 🟢 🟢  [↻]  │ │
│  │  Your Digital Companion                      │ │
│  └──────────────────────────────────────────────┘ │
├────────────────────────────────────────────────────┤
│                                                    │
│  User: Hi, how are you?                           │
│                                                    │
│  AI: I'm doing well! How can I help?              │
│                                                    │
└────────────────────────────────────────────────────┘
```

**Interactive Features**:
- Hover over dots to see tooltip
- Click refresh button to update

**Tooltip Example** (when hovering over first dot):
```
┌────────────────────────┐
│ 💬 OpenClaw AI         │
│ Status: healthy        │
│ Uptime: 5m 23s         │
│                        │
│ Providers:             │
│ • OpenAI (GPT-4)       │
│ • Anthropic (Claude)   │
└────────────────────────┘
```

---

## Left Pane: Full Status Panel (Click Settings Icon)

**Location**: Left sidebar, toggle between Projects and Services

### Step 1: Default View (Projects)
```
┌───────────────────────┐
│  M  MAVIN    📁  ⚙️  │  ← Click ⚙️ for services
├───────────────────────┤
│  [🔴 START CAPTURE]   │
│                       │
│  🔍 Search...         │
├───────────────────────┤
│  📁 Studies           │
│    📚 Physics 101     │
│    📄 History Notes   │
│                       │
│  📁 Creative          │
│    🎨 Sci-Fi Novel    │
└───────────────────────┘
```

### Step 2: Services View (After clicking ⚙️)
```
┌───────────────────────────────┐
│  M  MAVIN    📁  ⚙️          │  ← ⚙️ is highlighted
├───────────────────────────────┤
│  🖥️ Service Status      [↻] │
│  Backend Health Monitor      │
├───────────────────────────────┤
│  System Health:  ✅ HEALTHY  │
│                              │
│  Total: 3    Healthy: 3      │
│  Degraded: 0    Error: 0     │
├───────────────────────────────┤
│  ┌─────────────────────────┐ │
│  │ ✅ OpenClaw AI          │ │
│  │    HEALTHY         [▼]  │ │
│  └─────────────────────────┘ │
│                              │
│  ┌─────────────────────────┐ │
│  │ ✅ MT LiteTTS           │ │
│  │    HEALTHY         [▼]  │ │
│  └─────────────────────────┘ │
│                              │
│  ┌─────────────────────────┐ │
│  │ ✅ FunASR               │ │
│  │    HEALTHY         [▼]  │ │
│  └─────────────────────────┘ │
├───────────────────────────────┤
│  Last updated: 14:23:45      │
└───────────────────────────────┘
```

### Step 3: Expanded Service Card
```
┌─────────────────────────────────┐
│  ┌───────────────────────────┐  │
│  │ ✅ OpenClaw AI            │  │
│  │    HEALTHY           [▲]  │  │
│  ├───────────────────────────┤  │
│  │ Type: AI                  │  │
│  │ Uptime: ⏱️ 5m 23s         │  │
│  │ Last Check: 14:23:45      │  │
│  ├───────────────────────────┤  │
│  │ Details:                  │  │
│  │ • openai: true            │  │
│  │ • claude: true            │  │
│  │ • providers:              │  │
│  │   - OpenAI (GPT-4)        │  │
│  │   - Anthropic (Claude)    │  │
│  ├───────────────────────────┤  │
│  │  [🔄 Restart Service]     │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
```

---

## Status Indicators

### Status Dot Colors

```
🟢  Healthy      - All systems operational
🟡  Degraded     - Partial functionality (e.g., 1 of 2 providers)
🔴  Error        - Service failed to start
⚪  Unavailable  - Service not running (e.g., Docker stopped)
🔵  Starting     - Service is initializing (animated pulse)
```

### Service Types

```
💬  AI (OpenClaw)     - Chat AI integration
🎤  TTS (MT LiteTTS)  - Text-to-Speech
🎙️  ASR (FunASR)      - Speech Recognition
```

---

## Interactive Examples

### Example 1: All Services Healthy

**Compact View**:
```
🟢 🟢 🟢  [↻]
```

**Full Panel**:
```
System Health: ✅ HEALTHY

✅ OpenClaw AI    - HEALTHY
✅ MT LiteTTS     - HEALTHY
✅ FunASR         - HEALTHY
```

### Example 2: One Service Error

**Compact View**:
```
🟢 🟢 🔴  [↻]
      ↑
  FunASR Error
```

**Tooltip on Red Dot**:
```
┌─────────────────────────────────┐
│ 🎙️ FunASR                      │
│ Status: error                   │
│                                 │
│ ❌ Error:                       │
│ Docker permission denied.       │
│ Run: sudo usermod -aG docker... │
└─────────────────────────────────┘
```

**Full Panel**:
```
System Health: ❌ ERROR

✅ OpenClaw AI    - HEALTHY
✅ MT LiteTTS     - HEALTHY
❌ FunASR         - ERROR
   Error: Docker permission denied
   [🔄 Restart Service]
```

### Example 3: Degraded Service

**Compact View**:
```
🟡 🟢 🟢  [↻]
↑
OpenClaw Degraded
```

**Tooltip**:
```
┌─────────────────────────────────┐
│ 💬 OpenClaw AI                  │
│ Status: degraded                │
│                                 │
│ ⚠️ Only 1 provider working:     │
│ • openai: ❌ false              │
│ • claude: ✅ true               │
└─────────────────────────────────┘
```

---

## User Flows

### Flow 1: Check Service Status Quickly

1. Look at right pane header
2. See 3 green dots → All good! ✅
3. Continue working

### Flow 2: Investigate Service Error

1. Notice red dot in right pane header
2. Hover over dot → See error tooltip
3. Click Settings (⚙️) in left pane
4. See full error details
5. Click "Restart Service"
6. Watch status change: 🔴 → 🔵 → 🟢
7. Click Projects (📁) to return

### Flow 3: Monitor Service Health

1. Click Settings (⚙️) in left pane
2. View overall system health
3. Expand service cards for details
4. Check uptime counters
5. Verify metadata (providers, models, etc.)
6. Auto-refresh keeps info current

---

## Responsive Behavior

### Large Screens
- All panels visible
- Compact status in right pane
- Full panel available in left pane
- No scrolling needed for 3 services

### Small Screens
- Panels resize gracefully
- Compact status remains visible
- Full panel scrollable
- Service cards stack vertically

---

## Keyboard Shortcuts (Future Enhancement)

```
⌘ + K          - Open global search
⌘ + Shift + S  - Toggle service status
⌘ + R          - Refresh service status
Esc            - Close service panel
```

---

## Animation & Transitions

### Status Dot Updates
- Fade transition when changing color (300ms)
- Pulse animation for "starting" state
- Smooth color shift for degraded → healthy

### Panel Transitions
- Slide in/out when toggling (200ms)
- Expand/collapse cards (150ms)
- Fade in tooltips (100ms)

### Refresh Animation
- Refresh button spins during fetch
- Dots pulse briefly on update
- Success indicator flash

---

## Accessibility

- ✅ Screen reader support (ARIA labels)
- ✅ Keyboard navigation
- ✅ High contrast mode compatible
- ✅ Focus indicators on interactive elements
- ✅ Meaningful color coding + text labels

---

**Visual Guide Complete!**

For implementation details, see `SERVICE_STATUS_UI.md`
