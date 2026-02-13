/**
 * Shared TypeScript types for Mavin project
 * Used across all packages (display, avatar, input, output)
 */

// ============================================================================
// Display System Types
// ============================================================================

export type DisplayMode = 'focus' | 'companion' | 'ghost';

export interface DisplayState {
  currentMode: DisplayMode;
  isTransitioning: boolean;
  position: { x: number; y: number };
  dimensions: { width: number; height: number };
}

export interface TransitionConfig {
  duration: number; // milliseconds
  easing: string; // CSS easing function
}

// ============================================================================
// Avatar Types
// ============================================================================

export type AvatarState = 'idle' | 'listening' | 'thinking' | 'speaking';
export type EmotionName = 'neutral' | 'happy' | 'concerned' | 'excited';
export type SkinName = 'professional' | 'cartoon' | 'minimal';
export type GestureName = 'nod' | 'shake' | 'thumbsUp' | 'pointUp' | 'shrug';

export interface AvatarStateInfo {
  state: AvatarState;
  emotion: EmotionName;
  skin: SkinName;
}

// ============================================================================
// Input Types
// ============================================================================

export type InputType = 'voice' | 'text' | 'camera';
export type VoiceInputMode = 'push-to-talk' | 'continuous' | 'whisper';

export interface InputEvent {
  id: string;
  timestamp: number;
  type: InputType;
  content: string | Blob;
  metadata: {
    confidence?: number;
    language?: string;
    duration?: number;
    resolution?: { width: number; height: number };
  };
}

export interface VoiceInputConfig {
  mode: VoiceInputMode;
  language: string;
  interimResults: boolean;
  maxAlternatives: number;
}

export interface CameraConfig {
  resolution: 'low' | 'medium' | 'high';
  facingMode: 'user' | 'environment';
  frameRate: number;
}

// ============================================================================
// Output Types
// ============================================================================

export type OutputFormat = 'chat' | 'bubble' | 'overlay';
export type NotificationPriority = 'info' | 'hint' | 'alert';

export interface VoiceOutputConfig {
  voice: string;
  rate: number; // 0.5 - 2.0
  pitch: number; // 0.5 - 2.0
  volume: number; // 0.0 - 1.0
  language: string;
}

export interface TextDisplayConfig {
  format: OutputFormat;
  markdown: boolean;
  syntaxHighlight: boolean;
  autoDismiss?: number;
}

export interface Notification {
  id: string;
  type: NotificationPriority;
  title?: string;
  message: string;
  action?: { label: string; callback: () => void };
  autoDismiss?: number;
}

export interface ContentItem {
  id: string;
  type: 'image' | 'document' | 'visualization';
  url: string | Blob;
  metadata: {
    title?: string;
    description?: string;
    createdAt: number;
  };
}

// ============================================================================
// Context Types
// ============================================================================

export type InteractionMode = 'active' | 'passive' | 'conversational' | 'proactive';
export type UserRole = 'student' | 'artist' | 'professional' | 'child';

export interface UserProfile {
  userId: string;
  role: UserRole;
  preferences: {
    defaultDisplayMode: DisplayMode;
    defaultVoice: string;
    outputModality: 'voice' | 'text' | 'auto';
    notificationFrequency: 'high' | 'medium' | 'low';
    avatarSkin: SkinName;
  };
}

export interface CalendarEvent {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  description?: string;
  eventType?: 'class' | 'meeting' | 'work' | 'personal';
}

export interface ApplicationInfo {
  name: string;
  category: string;
  windowTitle: string;
  isFocused: boolean;
}

export interface EnvironmentInfo {
  noiseLevel: number; // decibels
  lightLevel: number; // lux
  faceCount: number;
  classification: 'quiet' | 'moderate' | 'noisy';
}

export interface Context {
  currentUser: UserProfile;
  currentEvent: CalendarEvent | null;
  currentApp: ApplicationInfo | null;
  environment: EnvironmentInfo;
  userOverride?: DisplayMode;
}

// ============================================================================
// API Types (Backend Integration)
// ============================================================================

export interface ChatRequest {
  userId: string;
  message: string;
  context: {
    conversationId: string;
    displayMode: DisplayMode;
    currentTask: string;
  };
}

export interface ChatResponse {
  messageId: string;
  response: string;
  suggestedMode: DisplayMode | null;
  actions: Array<{
    type: 'generate_image' | 'set_reminder' | 'export_notes';
    payload: any;
  }>;
}

export interface TranscriptionRequest {
  audio: Blob;
  language: string;
  mode: 'quick' | 'accurate';
}

export interface TranscriptionResponse {
  transcriptionId: string;
  text: string;
  confidence: number;
  language: string;
}

export interface ImageGenerationRequest {
  prompt: string;
  count: number;
  size: '1024x1024' | '1792x1024' | '1024x1792';
  style: 'vivid' | 'natural';
}

export interface ImageGenerationResponse {
  requestId: string;
  images: Array<{
    id: string;
    url: string;
    thumbnail: string;
  }>;
}

export interface VisionAnalysisRequest {
  image: Blob;
  features: Array<'ocr' | 'objects' | 'scene'>;
}

export interface VisionAnalysisResponse {
  analysisId: string;
  text: string | null;
  objects: Array<{ name: string; confidence: number }>;
  sceneDescription: string | null;
}

export interface ContextResponse {
  suggestedMode: DisplayMode;
  suggestedInteraction: InteractionMode;
  currentEvent: CalendarEvent | null;
  environment: {
    noiseLevel: 'quiet' | 'moderate' | 'noisy';
    outputPreference: 'voice' | 'text';
  };
}

// ============================================================================
// WebSocket Event Types
// ============================================================================

export type WebSocketEventType =
  | 'mode.suggested'
  | 'message.proactive'
  | 'chat.stream'
  | 'input.activity'
  | 'display.mode.changed';

export interface WebSocketEvent {
  type: WebSocketEventType;
  payload: any;
}

// ============================================================================
// Global State Types
// ============================================================================

export interface GlobalState {
  display: DisplayState;
  avatar: AvatarStateInfo;
  input: {
    isListening: boolean;
    isCameraActive: boolean;
    lastInputTimestamp: number;
  };
  output: {
    isSpeaking: boolean;
    currentMessage: string | null;
    notificationQueue: Notification[];
  };
  context: {
    currentUser: UserProfile;
    currentEvent: CalendarEvent | null;
    currentApp: ApplicationInfo | null;
    environment: EnvironmentInfo;
  };
  ai: {
    conversationId: string;
    pendingRequests: number;
  };
}

// ============================================================================
// Utility Types
// ============================================================================

export type Unsubscribe = () => void;
export type EventHandler<T = any> = (event: T) => void;
