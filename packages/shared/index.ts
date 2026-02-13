/**
 * Shared package entry point
 * Exports types, utilities, and API client
 */

// Export all types
export * from './types';

// Export API client
export { ApiClient, apiClient } from './api-client';

// Export store
export { useMavinStore, useDisplayMode, useAvatarState, useIsListening, useIsSpeaking, useNotifications, usePendingRequests } from './store';

// Export event bus (will be created later)
// export { EventBus } from './event-bus';

// Export utilities
export * from './utils';
