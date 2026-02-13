/**
 * Global State Store using Zustand
 * Manages application-wide state for Mavin
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  DisplayMode,
  DisplayState,
  AvatarState,
  AvatarStateInfo,
  UserProfile,
  CalendarEvent,
  ApplicationInfo,
  EnvironmentInfo,
  Notification,
} from './types';

// ============================================================================
// State Interface
// ============================================================================

interface MavinState {
  // Display state
  display: DisplayState;
  setDisplayMode: (mode: DisplayMode) => void;
  setTransitioning: (isTransitioning: boolean) => void;

  // Avatar state
  avatar: AvatarStateInfo;
  setAvatarState: (state: AvatarState) => void;
  setAvatarEmotion: (emotion: string) => void;
  setAvatarSkin: (skin: string) => void;

  // Input state
  input: {
    isListening: boolean;
    isCameraActive: boolean;
    lastInputTimestamp: number;
  };
  setListening: (isListening: boolean) => void;
  setCameraActive: (isActive: boolean) => void;
  updateLastInputTimestamp: () => void;

  // Output state
  output: {
    isSpeaking: boolean;
    currentMessage: string | null;
    notificationQueue: Notification[];
  };
  setSpeaking: (isSpeaking: boolean) => void;
  setCurrentMessage: (message: string | null) => void;
  addNotification: (notification: Notification) => void;
  removeNotification: (id: string) => void;

  // Context state
  context: {
    currentUser: UserProfile | null;
    currentEvent: CalendarEvent | null;
    currentApp: ApplicationInfo | null;
    environment: EnvironmentInfo;
  };
  setCurrentUser: (user: UserProfile | null) => void;
  setCurrentEvent: (event: CalendarEvent | null) => void;
  setCurrentApp: (app: ApplicationInfo | null) => void;
  setEnvironment: (env: Partial<EnvironmentInfo>) => void;

  // AI state
  ai: {
    conversationId: string;
    pendingRequests: number;
  };
  setConversationId: (id: string) => void;
  incrementPendingRequests: () => void;
  decrementPendingRequests: () => void;

  // Reset function
  reset: () => void;
}

// ============================================================================
// Initial State
// ============================================================================

const initialDisplayState: DisplayState = {
  currentMode: 'focus',
  isTransitioning: false,
  position: { x: 0, y: 0 },
  dimensions: { width: 400, height: 600 },
};

const initialAvatarState: AvatarStateInfo = {
  state: 'idle',
  emotion: 'neutral',
  skin: 'professional',
};

const initialEnvironment: EnvironmentInfo = {
  noiseLevel: 50,
  lightLevel: 300,
  faceCount: 0,
  classification: 'quiet',
};

// ============================================================================
// Store
// ============================================================================

export const useMavinStore = create<MavinState>()(
  persist(
    (set) => ({
      // Display
      display: initialDisplayState,
      setDisplayMode: (mode) =>
        set((state) => ({
          display: { ...state.display, currentMode: mode },
        })),
      setTransitioning: (isTransitioning) =>
        set((state) => ({
          display: { ...state.display, isTransitioning },
        })),

      // Avatar
      avatar: initialAvatarState,
      setAvatarState: (avatarState) =>
        set((state) => ({
          avatar: { ...state.avatar, state: avatarState },
        })),
      setAvatarEmotion: (emotion) =>
        set((state) => ({
          avatar: { ...state.avatar, emotion: emotion as any },
        })),
      setAvatarSkin: (skin) =>
        set((state) => ({
          avatar: { ...state.avatar, skin: skin as any },
        })),

      // Input
      input: {
        isListening: false,
        isCameraActive: false,
        lastInputTimestamp: 0,
      },
      setListening: (isListening) =>
        set((state) => ({
          input: { ...state.input, isListening },
        })),
      setCameraActive: (isActive) =>
        set((state) => ({
          input: { ...state.input, isCameraActive: isActive },
        })),
      updateLastInputTimestamp: () =>
        set((state) => ({
          input: { ...state.input, lastInputTimestamp: Date.now() },
        })),

      // Output
      output: {
        isSpeaking: false,
        currentMessage: null,
        notificationQueue: [],
      },
      setSpeaking: (isSpeaking) =>
        set((state) => ({
          output: { ...state.output, isSpeaking },
        })),
      setCurrentMessage: (message) =>
        set((state) => ({
          output: { ...state.output, currentMessage: message },
        })),
      addNotification: (notification) =>
        set((state) => ({
          output: {
            ...state.output,
            notificationQueue: [...state.output.notificationQueue, notification],
          },
        })),
      removeNotification: (id) =>
        set((state) => ({
          output: {
            ...state.output,
            notificationQueue: state.output.notificationQueue.filter((n) => n.id !== id),
          },
        })),

      // Context
      context: {
        currentUser: null,
        currentEvent: null,
        currentApp: null,
        environment: initialEnvironment,
      },
      setCurrentUser: (user) =>
        set((state) => ({
          context: { ...state.context, currentUser: user },
        })),
      setCurrentEvent: (event) =>
        set((state) => ({
          context: { ...state.context, currentEvent: event },
        })),
      setCurrentApp: (app) =>
        set((state) => ({
          context: { ...state.context, currentApp: app },
        })),
      setEnvironment: (env) =>
        set((state) => ({
          context: {
            ...state.context,
            environment: { ...state.context.environment, ...env },
          },
        })),

      // AI
      ai: {
        conversationId: `conv-${Date.now()}`,
        pendingRequests: 0,
      },
      setConversationId: (id) =>
        set((state) => ({
          ai: { ...state.ai, conversationId: id },
        })),
      incrementPendingRequests: () =>
        set((state) => ({
          ai: { ...state.ai, pendingRequests: state.ai.pendingRequests + 1 },
        })),
      decrementPendingRequests: () =>
        set((state) => ({
          ai: { ...state.ai, pendingRequests: Math.max(0, state.ai.pendingRequests - 1) },
        })),

      // Reset
      reset: () =>
        set({
          display: initialDisplayState,
          avatar: initialAvatarState,
          input: {
            isListening: false,
            isCameraActive: false,
            lastInputTimestamp: 0,
          },
          output: {
            isSpeaking: false,
            currentMessage: null,
            notificationQueue: [],
          },
          context: {
            currentUser: null,
            currentEvent: null,
            currentApp: null,
            environment: initialEnvironment,
          },
          ai: {
            conversationId: `conv-${Date.now()}`,
            pendingRequests: 0,
          },
        }),
    }),
    {
      name: 'mavin-storage', // localStorage key
      partialize: (state) => ({
        // Only persist these fields
        display: { currentMode: state.display.currentMode },
        avatar: { skin: state.avatar.skin },
        context: { currentUser: state.context.currentUser },
      }),
    }
  )
);

// Export selectors for optimized re-renders
export const useDisplayMode = () => useMavinStore((state) => state.display.currentMode);
export const useAvatarState = () => useMavinStore((state) => state.avatar.state);
export const useIsListening = () => useMavinStore((state) => state.input.isListening);
export const useIsSpeaking = () => useMavinStore((state) => state.output.isSpeaking);
export const useNotifications = () => useMavinStore((state) => state.output.notificationQueue);
export const usePendingRequests = () => useMavinStore((state) => state.ai.pendingRequests);
