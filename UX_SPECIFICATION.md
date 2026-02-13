# Mavin Universal UI: UX Specification Document

**Version**: 1.0  
**Date**: February 13, 2026  
**Author**: Manus AI  
**Status**: Draft for Review

---

## Executive Summary

This document defines the user experience specification for Mavin, a universal AI companion that adapts to multiple user scenarios through a single, flexible interface. Rather than building separate applications for students, artists, and children, Mavin employs an adaptive architecture that responds to context, user preferences, and task requirements.

The core innovation lies in **three orthogonal systems** that combine to create scenario-specific experiences: Display Modes control visual presentation, Interaction Modes govern behavioral patterns, and the Context Engine orchestrates automatic adaptation. This architecture enables Mavin to serve as a quiet note-taker during Leo's physics lecture, transform into Sarah's creative muse for character design, and become Timmy's patient homework tutor—all through the same underlying interface.

---

## Design Philosophy

### The Companion Paradigm

Mavin is not a tool that users operate; it is a **digital companion** that works alongside them. This fundamental shift in perspective drives every design decision:

**Traditional AI Assistant**:
- User issues commands
- AI executes tasks
- Interaction is transactional
- Interface is static

**Mavin as Companion**:
- User collaborates with AI
- AI anticipates needs
- Interaction is conversational
- Interface adapts to context

This paradigm manifests in three core principles that guide the universal UI design.

### Principle 1: Adaptive Presence

Mavin adjusts its visual prominence based on the user's current need for attention. During Leo's lecture, Mavin shrinks to a corner to avoid distraction. When Sarah needs creative inspiration, Mavin expands to full screen as the focal point. When Timmy struggles with homework, Mavin appears with a friendly, approachable demeanor.

The interface does not force users to manually configure these states. Instead, the Context Engine detects the situation and automatically selects the appropriate Display Mode. Users can override these decisions, but the default behavior should feel intuitive and unobtrusive.

### Principle 2: Multimodal Fluidity

Users should interact with Mavin through whatever modality feels natural in the moment. Leo whispers questions during class to avoid disturbing others. Sarah speaks freely while pacing around her studio. Timmy holds his notebook up to the camera because typing is difficult for an eight-year-old.

The interface seamlessly blends voice, text, vision, and gesture inputs without requiring users to explicitly switch modes. Mavin listens when users speak, reads when they show something to the camera, and responds through the most appropriate output channel—whether that is a whispered text bubble, a spoken explanation, or a generated image.

### Principle 3: Contextual Intelligence

Mavin understands not just what users say, but also where they are, what they are doing, and what they might need next. When Leo's calendar shows "Physics 101," Mavin prepares to take lecture notes. When Sarah opens Photoshop, Mavin shifts to Ghost Mode to avoid obstructing the canvas. When Timmy's camera detects a math textbook, Mavin activates OCR and prepares to offer homework guidance.

This contextual awareness reduces cognitive load by eliminating the need for users to constantly instruct Mavin on how to behave. The interface should feel like working with someone who already knows you, rather than a system that requires constant configuration.

---

## Universal UI Architecture

### Three-Layer System

The universal UI consists of three independent but coordinated layers. Each layer addresses a distinct aspect of the user experience, and their combination produces the scenario-specific behaviors described in the UX stories.

```
┌─────────────────────────────────────────────────────────┐
│                    Universal Shell                       │
│         (Persistent container managing all layers)       │
└─────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│ Display Mode │   │ Interaction  │   │   Context    │
│    Layer     │   │  Mode Layer  │   │    Engine    │
│              │   │              │   │              │
│ Visual       │   │ Behavioral   │   │ Situational  │
│ Presentation │   │ Patterns     │   │ Awareness    │
└──────────────┘   └──────────────┘   └──────────────┘
```

This separation of concerns enables flexibility. Display Modes can change without affecting Interaction Modes, and the Context Engine can adjust both layers independently based on environmental signals. The Universal Shell provides a consistent container that persists across all transitions, maintaining continuity even as the interface transforms.

---

## Layer 1: Display Modes

Display Modes control how Mavin appears on screen. The three modes represent different levels of visual prominence, allowing Mavin to occupy the appropriate amount of screen real estate for the current task.

### Focus Mode

**Visual Characteristics**: Mavin occupies the right third of the screen, displaying a full-body avatar alongside an interactive chat interface. The avatar is rendered at 400px height, with sufficient detail to convey facial expressions and gestures. Below the avatar, a scrollable chat area shows conversation history, and an input field allows text entry.

**Use Cases**: Focus Mode is appropriate when users need Mavin's full attention or when Mavin needs to present complex information. Sarah uses Focus Mode during creative brainstorming sessions, where Mavin generates and displays multiple image variations. Timmy uses Focus Mode for homework help, where Mavin needs space to show step-by-step explanations.

**Layout Specification**:
```
┌─────────────────────────────────────────────┐
│                                    ┌────────┤
│                                    │ Avatar │
│      Main Content Area             │ 400px  │
│      (User's workspace)            │        │
│                                    ├────────┤
│                                    │ Chat   │
│                                    │ History│
│                                    │        │
│                                    ├────────┤
│                                    │ Input  │
└────────────────────────────────────┴────────┘
     70% width                        30% width
```

**Transition Behavior**: When entering Focus Mode from Companion Mode, the avatar smoothly expands from its corner position to the right panel. The expansion animation takes 300ms and uses an ease-out curve to create a sense of Mavin stepping forward. When exiting Focus Mode, the reverse animation plays, giving the impression that Mavin is stepping back to give the user more workspace.

### Companion Mode

**Visual Characteristics**: Mavin shrinks to a compact widget in the bottom-right corner, measuring 150px wide by 200px tall. Only the avatar's head and shoulders are visible, along with a small status indicator showing the current activity (listening, thinking, idle). The chat interface is hidden, but users can click the widget to expand back to Focus Mode.

**Use Cases**: Companion Mode is ideal for background tasks where Mavin should remain accessible but not intrusive. Leo uses Companion Mode during lectures, where Mavin quietly records and transcribes without occupying valuable screen space. Sarah uses Companion Mode while working in Photoshop, where Mavin monitors progress but stays out of the way.

**Layout Specification**:
```
┌─────────────────────────────────────────────┐
│                                             │
│                                             │
│      Full Screen Workspace                  │
│      (User has maximum space)               │
│                                             │
│                                    ┌────┐   │
│                                    │ 🤖 │   │
│                                    │ ●  │   │ ← Status indicator
└────────────────────────────────────┴────┘───┘
                                    150x200px
```

**Interaction Patterns**: In Companion Mode, Mavin primarily uses notification bubbles to communicate. When Leo asks a question during class, Mavin displays a small text bubble next to the avatar rather than speaking aloud. The bubble appears for 5 seconds before fading, or until the user dismisses it by clicking. This allows Mavin to provide information without disrupting the lecture.

### Ghost Mode

**Visual Characteristics**: Mavin becomes a semi-transparent orb measuring 80px in diameter, positioned in the bottom-right corner. The orb pulses gently to indicate that Mavin is active, but it is deliberately subtle—barely noticeable unless the user looks for it. The avatar's face is not visible; only an abstract representation remains.

**Use Cases**: Ghost Mode is for situations where any visual presence would be distracting. Sarah uses Ghost Mode during deep creative work, where even a small avatar might break her concentration. Leo might use Ghost Mode during exams, where Mavin must remain completely silent but can still record for later review.

**Layout Specification**:
```
┌─────────────────────────────────────────────┐
│                                             │
│      Full Screen Workspace                  │
│      (User has complete focus)              │
│                                             │
│                                         ⚪  │ ← 80px orb
│                                    (30% opacity)
└─────────────────────────────────────────────┘
```

**Activation Behavior**: Ghost Mode is the most passive state. Mavin does not initiate any visual or audio output unless a critical situation arises. If Mavin detects something urgent (e.g., Leo's computer battery is at 5% during an exam), the orb briefly expands and displays a minimal notification. After the user acknowledges the alert, Ghost Mode resumes.

### Mode Transition Matrix

The following table defines the rules for automatic and manual transitions between Display Modes. The Context Engine uses these rules to determine when mode changes should occur.

| Current Mode | Trigger Event | Target Mode | Animation Duration | User Override |
|-------------|--------------|-------------|-------------------|---------------|
| Companion | User clicks avatar | Focus | 300ms | N/A (user initiated) |
| Companion | User says "XiaoMai" | Focus | 300ms | N/A (user initiated) |
| Focus | User clicks minimize button | Companion | 300ms | N/A (user initiated) |
| Focus | User says "Hide" | Companion | 300ms | N/A (user initiated) |
| Companion | User says "Disappear" | Ghost | 200ms | N/A (user initiated) |
| Ghost | User says "XiaoMai" | Focus | 400ms | N/A (user initiated) |
| Ghost | Critical alert detected | Companion (3s) | 200ms | User can dismiss early |
| Focus | Photoshop window gains focus | Ghost | 300ms | User can stay in Focus |
| Companion | Lecture detected in calendar | Companion | N/A | User can switch to Focus |

---

## Layer 2: Interaction Modes

Interaction Modes define how Mavin behaves and responds to user input. Unlike Display Modes, which control visual presentation, Interaction Modes govern the underlying conversational patterns and proactive behaviors.

### Active Listening

**Behavioral Pattern**: Mavin continuously monitors audio input and transcribes everything it hears. This mode is appropriate when users explicitly want to record a conversation, lecture, or meeting. The transcription appears in real-time, either in the main workspace (if Mavin is in Focus Mode) or in a separate overlay (if Mavin is in Companion Mode).

**Visual Feedback**: An animated waveform appears near Mavin's avatar, pulsing in sync with detected audio. A small red dot indicates that recording is active. If transcription confidence is low (e.g., due to background noise), the waveform turns yellow as a warning.

**Use Case Example**: Leo starts his physics lecture by saying, "XiaoMai, start a new session." Mavin enters Active Listening mode and begins transcribing the professor's words. The transcript scrolls in the center of the screen, with timestamps on the left margin. When the professor mentions "Bernoulli's Principle," Mavin automatically highlights the phrase in cyan, indicating it as a key concept.

### Passive Monitoring

**Behavioral Pattern**: Mavin listens in the background but does not transcribe everything. Instead, it waits for specific trigger phrases or keywords before responding. This mode reduces cognitive load by filtering out irrelevant information and only surfacing what matters.

**Trigger Detection**: The Context Engine maintains a dynamic list of keywords based on the current task. During Leo's physics lecture, keywords might include "homework," "exam," "question," and domain-specific terms like "Bernoulli," "entropy," or "momentum." When Mavin detects a trigger, it briefly activates to provide relevant information.

**Use Case Example**: The professor says, "This will be on the exam next week." Mavin detects the keyword "exam" and displays a small notification bubble: "Noted: Exam on [topic] scheduled for [date]." Leo does not need to manually tag this information; Mavin captures it automatically.

### Conversational

**Behavioral Pattern**: Mavin engages in multi-turn dialogue, waiting for the user to speak before responding. This mode feels like a natural conversation, with Mavin maintaining context across multiple exchanges. Mavin uses verbal and non-verbal cues (nodding, eye contact, gestures) to signal understanding and engagement.

**Turn-Taking Protocol**: Mavin waits 1.5 seconds after the user stops speaking before responding, allowing for natural pauses. If the user interrupts Mavin mid-response, Mavin immediately stops and listens. This mimics human conversation norms and prevents the awkward overlap that occurs in many voice assistants.

**Use Case Example**: Sarah says, "XiaoMai, I need inspiration. Think 'Cyberpunk' but... ancient Egypt." Mavin responds, "Interesting mix. Do you mean neon pyramids? Or high-tech pharaoh armor?" Sarah clarifies, "The armor. Gold and circuitry." Mavin nods and begins generating images. The conversation flows naturally, with Mavin asking clarifying questions rather than making assumptions.

### Proactive

**Behavioral Pattern**: Mavin initiates interactions without being prompted. This mode is appropriate when Mavin detects a problem, identifies an opportunity, or notices that the user might need help. Proactive behaviors must be carefully calibrated to avoid becoming annoying; Mavin should intervene only when the benefit clearly outweighs the interruption.

**Intervention Criteria**: Mavin uses a confidence threshold to determine whether to intervene. If confidence is above 80%, Mavin speaks up immediately. If confidence is between 50-80%, Mavin displays a subtle visual cue (e.g., raising a hand) and waits for the user to acknowledge. If confidence is below 50%, Mavin remains silent but logs the observation for later review.

**Use Case Example**: Timmy stares at his math homework for 30 seconds without writing anything. Mavin detects the pause and says, "Timmy, you look stuck. Want me to help with that problem?" Timmy nods, and Mavin switches to Conversational mode to provide step-by-step guidance.

### Interaction Mode Selection

The Context Engine automatically selects the appropriate Interaction Mode based on the current situation. The following table shows the mapping between scenarios and modes.

| Scenario | Display Mode | Interaction Mode | Input Modality | Output Modality |
|----------|-------------|-----------------|----------------|-----------------|
| Leo: Lecture recording | Companion | Passive Monitoring | Microphone (far-field) | Text bubble (silent) |
| Leo: Asking question | Focus | Conversational | Voice (whisper) | Text bubble |
| Sarah: Creative brainstorm | Focus | Conversational | Voice (normal volume) | Voice + Images |
| Sarah: Working in Photoshop | Ghost | Passive Monitoring | None | None (unless urgent) |
| Timmy: Homework help | Focus | Conversational + Proactive | Voice + Camera | Voice + Animation |
| Timmy: Stuck on problem | Focus | Proactive → Conversational | Voice + Camera | Voice + Animation |

---

## Layer 3: Context Engine

The Context Engine is the intelligence layer that orchestrates the other two layers. It continuously monitors environmental signals, user behavior, and task context to determine the optimal Display Mode and Interaction Mode for the current situation.

### Input Signals

The Context Engine processes multiple streams of information to build a real-time understanding of the user's context.

**User Profile**: Each user has a persistent profile that stores preferences, role (student, artist, professional, child), and historical patterns. Leo's profile indicates that he prefers text-based output during class hours and voice output at home. Sarah's profile shows that she works best with minimal interruptions. Timmy's profile flags that he needs patient, encouraging guidance.

**Calendar Integration**: Mavin syncs with the user's calendar to anticipate upcoming activities. When Leo's calendar shows "Physics 101 Lecture" at 10:00 AM, Mavin automatically prepares to enter Companion Mode with Passive Monitoring. When Sarah's calendar blocks off "Deep Work" time, Mavin defaults to Ghost Mode.

**Application Detection**: The Context Engine monitors which applications are in focus. When Photoshop is active, Mavin assumes Sarah is in creative mode and minimizes its presence. When a PDF reader is open, Mavin prepares to assist with note-taking. When a web browser is active, Mavin offers to summarize articles or answer questions about the content.

**Environmental Sensors**: Mavin uses the device's microphone and camera to detect environmental conditions. High ambient noise suggests a public space, prompting Mavin to use text output instead of voice. Low light conditions trigger a darker UI theme. Detection of multiple faces in the camera view indicates a group setting, where Mavin should be more conservative about speaking aloud.

**Behavioral Patterns**: The Context Engine learns from user behavior over time. If Leo consistently switches to Focus Mode during study sessions, Mavin will proactively suggest Focus Mode when it detects study-related activities. If Sarah always dismisses notifications while painting, Mavin will reduce notification frequency during similar tasks.

### Decision Logic

The Context Engine uses a rule-based system combined with learned preferences to make mode selection decisions. The following flowchart illustrates the decision process for Display Mode selection.

```
User opens Mavin
    │
    ├─→ Check calendar
    │   ├─→ Scheduled event found?
    │   │   ├─→ Event type: "Class" → Companion Mode
    │   │   ├─→ Event type: "Deep Work" → Ghost Mode
    │   │   └─→ Event type: "Meeting" → Focus Mode
    │   └─→ No event → Continue
    │
    ├─→ Check active application
    │   ├─→ Creative app (Photoshop, Illustrator) → Ghost Mode
    │   ├─→ Note-taking app (Notion, Obsidian) → Companion Mode
    │   └─→ Browser or general app → Continue
    │
    ├─→ Check user profile default
    │   └─→ Use stored preference
    │
    └─→ Fallback: Companion Mode
```

For Interaction Mode selection, the Context Engine considers the current task and user state.

```
User interacts with Mavin
    │
    ├─→ Check interaction history
    │   ├─→ User recently asked question? → Conversational
    │   ├─→ User recently said "record"? → Active Listening
    │   └─→ No recent interaction → Continue
    │
    ├─→ Check task type
    │   ├─→ Task: "Record lecture" → Passive Monitoring
    │   ├─→ Task: "Generate image" → Conversational
    │   ├─→ Task: "Homework help" → Conversational + Proactive
    │   └─→ No explicit task → Continue
    │
    ├─→ Check user state
    │   ├─→ User idle for >30s? → Proactive (offer help)
    │   ├─→ User typing rapidly? → Passive (don't interrupt)
    │   └─→ User speaking? → Conversational
    │
    └─→ Fallback: Conversational
```

### Adaptive Behavior Examples

The following scenarios demonstrate how the Context Engine coordinates Display Modes and Interaction Modes to create seamless experiences.

**Scenario 1: Leo's Morning Lecture**

- **9:55 AM**: Leo opens his laptop. Mavin checks the calendar and sees "Physics 101 - 10:00 AM."
- **Context Decision**: Display Mode → Companion, Interaction Mode → Passive Monitoring
- **10:00 AM**: Lecture begins. Mavin starts transcribing in the background.
- **10:15 AM**: Professor mentions "Bernoulli's Principle." Mavin detects the keyword and displays a brief definition in a text bubble.
- **Context Decision**: Brief switch to Proactive (3 seconds), then back to Passive Monitoring
- **10:45 AM**: Leo whispers, "XiaoMai, what was that principle again?"
- **Context Decision**: Display Mode → Focus (user initiated), Interaction Mode → Conversational
- **10:46 AM**: Mavin provides detailed explanation. Leo says, "Thanks, hide now."
- **Context Decision**: Display Mode → Companion, Interaction Mode → Passive Monitoring

**Scenario 2: Sarah's Creative Session**

- **2:00 PM**: Sarah opens Photoshop. Mavin detects the application and switches to Ghost Mode.
- **Context Decision**: Display Mode → Ghost, Interaction Mode → Passive Monitoring
- **3:30 PM**: Sarah says, "XiaoMai, I need inspiration."
- **Context Decision**: Display Mode → Focus (user initiated), Interaction Mode → Conversational
- **3:35 PM**: Mavin generates four character designs. Sarah selects one and says, "Put that in Photoshop."
- **Context Decision**: Mavin exports the image, opens it in Photoshop, then returns to Ghost Mode
- **3:36 PM**: Sarah continues painting. Mavin remains in Ghost Mode until the next explicit request.

**Scenario 3: Timmy's Homework Struggle**

- **4:00 PM**: Timmy opens his math homework. Mavin detects the textbook via camera and switches to Focus Mode.
- **Context Decision**: Display Mode → Focus, Interaction Mode → Conversational
- **4:05 PM**: Timmy stares at a problem for 30 seconds without writing.
- **Context Decision**: Interaction Mode → Proactive. Mavin says, "Timmy, you look stuck. Want me to help?"
- **4:06 PM**: Timmy holds the notebook up to the camera. Mavin reads the problem via OCR.
- **Context Decision**: Interaction Mode → Conversational (Socratic method). Mavin asks guiding questions instead of giving answers.
- **4:15 PM**: Timmy solves the problem. Mavin says, "Great job!" and displays a star animation.
- **Context Decision**: Interaction Mode → Conversational (positive reinforcement)

---

## Component Library

The universal UI is built from a set of reusable components that adapt to different modes and contexts. These components ensure visual consistency while allowing flexibility for scenario-specific customization.

### Mavin Avatar Component

**Purpose**: The avatar is the visual embodiment of Mavin. It conveys emotional state, activity status, and provides a focal point for user attention.

**States**:
- **Idle**: Gentle breathing animation, eyes blinking occasionally, neutral expression
- **Listening**: Eyes focused on user, subtle head tilt, waveform animation near mouth
- **Thinking**: Eyes looking upward, hand near chin, pulsing glow effect
- **Speaking**: Mouth moving in sync with audio output, expressive gestures

**Sizing**:
- Focus Mode: 400px height (full body visible)
- Companion Mode: 150px height (head and shoulders only)
- Ghost Mode: 80px diameter (abstract orb, no facial features)

**Customization**: Users can select from multiple avatar styles. The default "Professional" style uses realistic rendering with subtle cyberpunk accents. The "Cartoon" style (for children like Timmy) uses simplified shapes and exaggerated expressions. The "Minimal" style reduces the avatar to geometric shapes for users who prefer a less anthropomorphic interface.

### Context Panel Component

**Purpose**: The Context Panel displays task-relevant information alongside the avatar. Its content adapts based on the current scenario.

**Leo (Student) Configuration**:
- **Top Section**: Current lecture title and timestamp
- **Middle Section**: Scrollable list of captured notes with keyword highlights
- **Bottom Section**: Quick actions - "Review," "Quiz Me," "Export Notes"

**Sarah (Artist) Configuration**:
- **Top Section**: Current project name
- **Middle Section**: Gallery of recently generated images
- **Bottom Section**: Quick actions - "Generate More," "Open in App," "Save to Library"

**Timmy (Child) Configuration**:
- **Top Section**: Homework progress bar with star rewards
- **Middle Section**: Current problem being solved
- **Bottom Section**: Quick actions - "Hint," "Show Example," "Next Problem"

**Responsive Behavior**: The Context Panel is only visible in Focus Mode. In Companion and Ghost Modes, the panel is hidden to save screen space. When transitioning to Focus Mode, the panel slides in from the right with a 200ms animation.

### Notification Bubble Component

**Purpose**: Notification bubbles allow Mavin to communicate without requiring full Focus Mode. They appear near the avatar and automatically dismiss after a few seconds.

**Types**:
- **Info** (Blue): General information, low priority. Example: "Lecture recording started."
- **Hint** (Yellow): Suggestions or tips, medium priority. Example: "The professor just mentioned a key concept."
- **Alert** (Red): Important warnings, high priority. Example: "Battery low - save your work."

**Positioning**: Bubbles appear 20px to the left of the avatar, aligned with the avatar's head. If multiple bubbles are active, they stack vertically with 10px spacing.

**Interaction**: Users can click a bubble to expand it into a full explanation (transitions to Focus Mode). Users can also swipe a bubble to dismiss it early. If the user ignores a bubble, it fades out after 5 seconds (Info), 10 seconds (Hint), or remains until acknowledged (Alert).

### Multimodal Input Component

**Purpose**: The input component supports text, voice, and visual input through a unified interface.

**Text Input**: A standard text field appears at the bottom of the Focus Mode panel. Users can type questions or commands. The field expands vertically as users type longer messages.

**Voice Input**: A microphone button appears to the left of the text field. Users can click and hold to speak (push-to-talk), or toggle continuous listening. A waveform animation provides visual feedback during voice input.

**Visual Input**: A camera button appears to the right of the text field. Clicking it activates the device's camera, allowing users to show objects, documents, or their surroundings to Mavin. A live preview appears in the Context Panel, and users can tap to capture a snapshot.

**Smart Suggestions**: Below the input field, Mavin displays contextual suggestions based on the current task. During Leo's lecture, suggestions might include "Summarize this section" or "Explain [keyword]." During Sarah's creative session, suggestions might include "Generate variations" or "Change color palette."

---

## Scenario Implementation Guide

This section maps each UX story to specific UI components and system behaviors, providing a blueprint for implementation.

### Leo (Student) Scenario

**UX Story Step 1**: "Leo opens his AIBook in the lecture hall. XiaoMai is sleeping. Leo taps the spacebar."

- **Implementation**:
  - Display Mode: Ghost (screen saver state)
  - Interaction Mode: None (sleeping)
  - Trigger: Spacebar press
  - Animation: Avatar fades in from Ghost to Companion Mode (400ms)
  - Audio: Soft chime to indicate wake-up

**UX Story Step 2**: "XiaoMai: 'Good morning, Leo. Are we starting Physics 101?'"

- **Implementation**:
  - Display Mode: Companion
  - Interaction Mode: Conversational
  - Context Engine: Checks calendar, detects "Physics 101" at current time
  - Output: Voice (if environment is quiet) or text bubble (if noisy)
  - Avatar State: Idle → Speaking

**UX Story Step 3**: "Leo: 'Yes, start a new session. The professor is strict, so keep quiet.'"

- **Implementation**:
  - Input: Voice (captured via microphone)
  - Context Engine: Parses "keep quiet" as instruction to use text-only output
  - Interaction Mode: Switches to Passive Monitoring
  - Display Mode: Remains in Companion
  - Avatar State: Speaking → Listening → Idle

**UX Story Step 4**: "XiaoMai shrinks to the bottom right corner. The screen displays a live transcript."

- **Implementation**:
  - Display Mode: Companion (already active)
  - Interaction Mode: Active Listening
  - UI Change: Transcript overlay appears in center of screen (semi-transparent background)
  - Avatar State: Idle with small waveform indicator

**UX Story Step 5**: "The professor mentions 'Bernoulli's Principle' without explaining it."

- **Implementation**:
  - Context Engine: Detects keyword "Bernoulli's Principle" in transcript
  - Interaction Mode: Briefly switches to Proactive
  - Notification: Info bubble appears next to avatar with definition
  - Bubble Content: "Bernoulli's Principle: Pressure decreases as fluid velocity increases. [Expand]"
  - Auto-dismiss: 10 seconds (or until user clicks)

**UX Story Step 6**: "Class ends. Leo: 'Stop.'"

- **Implementation**:
  - Input: Voice command "Stop"
  - Interaction Mode: Switches from Active Listening to Conversational
  - Display Mode: Transitions from Companion to Focus (300ms animation)
  - Context Panel: Displays lecture summary with three highlighted topics
  - Avatar State: Idle → Speaking
  - Output: "Lecture captured. I've highlighted three topics you might need to review later. Do you want a quiz now, or should I archive this for tonight?"

### Sarah (Artist) Scenario

**UX Story Step 1**: "Sarah is pacing around the room. The AIBook is on the desk. Sarah: 'XiaoMai, I need inspiration.'"

- **Implementation**:
  - Display Mode: Companion (default when application is idle)
  - Interaction Mode: Conversational (triggered by voice input)
  - Display Transition: Companion → Focus (300ms)
  - Avatar State: Idle → Listening → Thinking
  - Context Engine: Detects creative task from phrase "need inspiration"

**UX Story Step 2**: "XiaoMai: 'Interesting mix. Do you mean neon pyramids? Or high-tech pharaoh armor?'"

- **Implementation**:
  - Interaction Mode: Conversational (clarifying question)
  - Avatar State: Thinking → Speaking
  - Output: Voice (normal volume, since environment is private)
  - Avatar Gesture: Thoughtful expression, hand gestures to emphasize options

**UX Story Step 3**: "Sarah: 'The armor. Gold and circuitry.' XiaoMai: 'Give me a second...'"

- **Implementation**:
  - Input: Voice command
  - Interaction Mode: Conversational → Processing
  - Avatar State: Speaking → Thinking (casting spell gesture)
  - Context Panel: Shows loading animation with text "Generating images..."
  - Backend: Calls image generation API with prompt "cyberpunk ancient Egyptian pharaoh armor, gold and circuitry"

**UX Story Step 4**: "Four images fade onto the screen behind her."

- **Implementation**:
  - Display: Context Panel expands to show 2x2 grid of generated images
  - Animation: Images fade in sequentially (100ms delay between each)
  - Avatar State: Thinking → Idle (satisfied expression)
  - Interaction Mode: Conversational (awaiting feedback)

**UX Story Step 5**: "Sarah: 'The second one is cool, but make it darker.'"

- **Implementation**:
  - Input: Voice command
  - Context Engine: Parses "second one" as reference to image #2, "darker" as modification instruction
  - Interaction Mode: Conversational → Processing
  - UI Change: Images #1, #3, #4 fade out; image #2 remains and pulses to indicate selection
  - Avatar Gesture: Swipes hand to dismiss unselected images
  - Backend: Regenerates image #2 with adjusted parameters (darker tone, increased contrast)

**UX Story Step 6**: "Sarah: 'Perfect. Put that in Photoshop.'"

- **Implementation**:
  - Input: Voice command
  - Context Engine: Detects application integration request
  - Backend: Exports selected image to temporary file, launches Photoshop via system API, opens file
  - Display Mode: Focus → Ghost (300ms transition)
  - Interaction Mode: Conversational → Passive Monitoring
  - Avatar State: Idle → Shrinking animation
  - Notification: Brief confirmation bubble - "Opened in Photoshop"

### Timmy (Child) Scenario

**UX Story Step 1**: "Timmy looks frustrated. Timmy: 'XiaoMai! I don't get this fraction problem.'"

- **Implementation**:
  - Display Mode: Companion (default during homework time)
  - Interaction Mode: Conversational (triggered by voice input)
  - Display Transition: Companion → Focus (300ms)
  - Avatar Style: Switches to "Cartoon" skin (if not already active)
  - Avatar State: Idle → Listening → Speaking
  - Output: "Don't worry, Timmy. Show me the book."

**UX Story Step 2**: "Timmy holds his notebook up to the camera."

- **Implementation**:
  - Input: Camera feed activated automatically (Context Engine detects camera motion)
  - UI Change: Camera preview appears in Context Panel
  - Avatar State: Speaking → Listening (eyes focus on camera feed)
  - Avatar Animation: Squints slightly to indicate "reading"
  - Backend: OCR processes camera frame, extracts text "3/4 + 1/8"
  - Context Engine: Identifies problem type (adding fractions with different denominators)

**UX Story Step 3**: "XiaoMai: 'Ah, adding fractions with different denominators. Okay, look at the bottom numbers. 4 and 8. Which one is bigger?'"

- **Implementation**:
  - Interaction Mode: Conversational (Socratic method)
  - Avatar State: Listening → Speaking
  - Output: Voice (encouraging tone)
  - Context Panel: Displays the problem "3/4 + 1/8" with denominators highlighted in yellow
  - Pedagogical Strategy: Ask guiding question instead of providing answer

**UX Story Step 4**: "Timmy: '8?' XiaoMai: Smiles and gives a thumbs up. 'Right! Can we turn the 4 into an 8? What do we multiply by?'"

- **Implementation**:
  - Input: Voice response "8"
  - Context Engine: Validates answer (correct)
  - Avatar State: Speaking → Celebrating (thumbs up gesture, smile)
  - Animation: Star particle effect around avatar (positive reinforcement)
  - Output: Voice (enthusiastic tone)
  - Context Panel: Updates to show "4 × ? = 8"
  - Interaction Mode: Conversational (next step in Socratic method)

---

## Technical Implementation Roadmap

### Phase 1: Core Architecture (2 weeks)

**Objectives**:
- Implement three Display Modes with smooth transitions
- Build state management system for mode coordination
- Create Universal Shell container

**Deliverables**:
- Display Mode components (Focus, Companion, Ghost)
- Mode transition animations (CSS + React Spring)
- Global state store (Zustand or Context API)
- Mode switching logic with manual triggers

**Success Criteria**:
- Users can manually switch between all three Display Modes
- Transitions are smooth (no jank, consistent timing)
- Avatar scales appropriately in each mode
- Layout remains responsive across screen sizes

### Phase 2: Interaction Modes (3 weeks)

**Objectives**:
- Integrate voice input/output (Web Speech API)
- Implement Active Listening and Passive Monitoring
- Build Notification Bubble system

**Deliverables**:
- Voice input component with push-to-talk and continuous modes
- Voice output with text-to-speech (browser native or external API)
- Transcript display with real-time updates
- Notification Bubble component with three priority levels
- Keyword detection for Passive Monitoring

**Success Criteria**:
- Users can speak to Mavin and receive voice responses
- Transcription accuracy >90% in quiet environments
- Passive Monitoring correctly triggers on predefined keywords
- Notification bubbles appear, stack, and dismiss correctly

### Phase 3: Multimodal Input (3 weeks)

**Objectives**:
- Add camera integration for visual input
- Implement OCR for text recognition
- Build image understanding pipeline

**Deliverables**:
- Camera access component with live preview
- Screenshot capture functionality
- OCR integration (Tesseract.js or cloud API)
- Image analysis integration (OpenAI Vision or Google Cloud Vision)
- Visual input display in Context Panel

**Success Criteria**:
- Users can show objects/documents to camera
- OCR correctly extracts text from images (>85% accuracy)
- Image understanding provides relevant descriptions
- Camera feed does not cause performance issues

### Phase 4: Context Engine (4 weeks)

**Objectives**:
- Build user profile system
- Implement calendar integration
- Add application detection
- Create environmental sensing

**Deliverables**:
- User profile database with preferences and history
- Calendar sync (Google Calendar, Outlook, iCal)
- Application focus detection (Electron API or browser extension)
- Ambient noise detection (Web Audio API)
- Automatic mode selection logic

**Success Criteria**:
- Context Engine correctly predicts Display Mode based on calendar
- Application detection triggers appropriate mode changes
- Environmental sensing adjusts output modality (voice vs. text)
- User preferences override automatic decisions when specified

### Phase 5: Scenario Optimization (2 weeks)

**Objectives**:
- Implement scenario-specific features
- Fine-tune Context Engine rules
- Add customization options

**Deliverables**:
- Leo scenario: Note highlighting, keyword extraction, quiz generation
- Sarah scenario: Image generation integration, Photoshop export
- Timmy scenario: Cartoon avatar skin, Socratic dialogue patterns, reward animations
- User settings panel for manual customization

**Success Criteria**:
- Each scenario feels distinct despite using the same UI framework
- Context Engine correctly identifies scenarios from user behavior
- Customization options allow users to override defaults
- Performance remains smooth with all features enabled

---

## Design Decisions and Rationale

### Why Three Display Modes?

The decision to use exactly three Display Modes (Focus, Companion, Ghost) emerged from analyzing the spectrum of user attention. More modes would add complexity without meaningful benefit; fewer modes would lack the flexibility needed for diverse scenarios.

**Focus Mode** represents high attention—the user is actively collaborating with Mavin. **Companion Mode** represents medium attention—the user is aware of Mavin but focused on another task. **Ghost Mode** represents minimal attention—the user wants Mavin present but nearly invisible. These three levels cover the practical range of human-AI interaction patterns.

### Why Separate Display and Interaction Modes?

Display Modes and Interaction Modes are orthogonal concerns. A user might want Mavin in Companion Mode (small visual presence) while using Conversational interaction (active dialogue). Separating these layers allows for 12 possible combinations (3 Display × 4 Interaction), providing flexibility without overwhelming complexity.

This separation also simplifies implementation. Display Mode changes are primarily CSS transformations, while Interaction Mode changes involve behavioral logic. Keeping them independent allows parallel development and easier testing.

### Why Automatic Mode Selection?

Manual mode selection creates cognitive overhead. Users must remember which mode is appropriate for each situation and explicitly switch modes throughout the day. Automatic mode selection eliminates this burden by having the Context Engine make intelligent defaults.

However, automatic selection must never feel restrictive. Users can always override the Context Engine's decisions through voice commands or UI controls. The goal is to provide sensible defaults that work 90% of the time, reducing the need for manual intervention while preserving user agency.

### Why Voice as Primary Input?

Voice input aligns with the companion paradigm. People speak to companions; they type to tools. Voice also enables hands-free interaction, which is essential for scenarios like Leo's lecture recording (where typing would be disruptive) or Sarah's creative work (where hands are busy with a stylus).

Text input remains available as a fallback for situations where voice is impractical (noisy environments, privacy concerns, speech disabilities). The interface should feel equally natural with either modality.

### Why Anthropomorphic Avatar?

The avatar serves multiple purposes beyond aesthetics. First, it provides a focal point for user attention—a clear target for gaze and gestures. Second, it enables non-verbal communication through facial expressions and body language. Third, it creates emotional connection, which research shows increases user trust and engagement.

The avatar must strike a balance between realism and stylization. Too realistic risks the "uncanny valley" effect; too abstract loses emotional expressiveness. The current design uses stylized human features with subtle cyberpunk accents, aiming for approachability without attempting photorealism.

---

## Open Questions and Future Considerations

### Personalization Depth

How much should Mavin adapt to individual users? The current design allows for user profiles with stored preferences, but future iterations could go further—learning speech patterns, predicting needs based on historical behavior, or even adjusting personality traits to match user preferences.

However, excessive personalization risks creating a "filter bubble" where Mavin only reinforces existing patterns. There is value in occasionally challenging users or exposing them to new approaches. The optimal balance between adaptation and novelty remains an open research question.

### Multi-User Scenarios

The current specification assumes single-user interaction. What happens when multiple people are present? Should Mavin recognize individual voices and maintain separate contexts? Should it mediate group conversations? These questions become important for family or classroom settings.

One possible approach: Mavin could detect multiple speakers and switch to a "group mode" where it acts as a facilitator rather than a personal companion. This would require different interaction patterns and UI adjustments.

### Privacy and Data Retention

Mavin continuously monitors audio, video, and application activity to provide contextual assistance. This raises significant privacy concerns. Users must have clear visibility into what data is collected, how long it is retained, and who has access.

The current design assumes local processing where possible (e.g., on-device speech recognition) and explicit user consent for cloud-based services. Future iterations should explore differential privacy techniques and user-controlled data deletion.

### Cross-Device Continuity

Should Mavin's context persist across devices? If Leo starts a lecture recording on his laptop, should he be able to continue reviewing notes on his phone? This would require cloud synchronization and cross-platform UI adaptation.

The challenge is maintaining the companion feeling across devices. Mavin should feel like the same entity, not separate instances. This might require a persistent identity system and careful design of transition moments (e.g., "I see you've switched to your phone. Should I continue where we left off?").

---

## Conclusion

This specification defines a universal UI framework that adapts to diverse user scenarios through three coordinated systems: Display Modes, Interaction Modes, and the Context Engine. By separating visual presentation from behavioral patterns and situational awareness, the architecture achieves flexibility without sacrificing consistency.

The key innovation is **adaptive presence**—Mavin adjusts its visibility, communication style, and proactive behavior based on what users need in each moment. Leo gets a quiet note-taker during lectures. Sarah gets an enthusiastic creative partner during brainstorming. Timmy gets a patient tutor during homework. All three experiences emerge from the same underlying interface.

Implementation will proceed in five phases over approximately 14 weeks, building from core architecture through multimodal input and contextual intelligence. The roadmap prioritizes foundational systems first, ensuring that scenario-specific features can be added incrementally without requiring architectural changes.

The ultimate goal is for Mavin to feel less like software and more like a companion—someone who understands context, anticipates needs, and adapts to the situation without being told. This specification provides the blueprint for making that vision a reality.

---

**Next Steps**: Review this specification with stakeholders, prioritize features based on user research, and begin Phase 1 implementation.

**Document Version**: 1.0  
**Last Updated**: February 13, 2026  
**Author**: Manus AI
