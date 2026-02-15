/**
 * Frontend API Configuration
 *
 * Loads service configuration and provides typed API client
 */

// In production, this would be loaded from environment or build-time config
// For development, we'll fetch it from the backend or use hardcoded values

import servicesConfig from '../../../shared/config';

export const API_BASE_URL = servicesConfig.api.baseUrl;

export const API_ENDPOINTS = {
  health: servicesConfig.api.endpoints.health,
  chat: servicesConfig.api.endpoints.chat,
  voice: {
    asr: servicesConfig.api.endpoints.voice.asr,
    tts: servicesConfig.api.endpoints.voice.tts,
    status: servicesConfig.api.endpoints.voice.status,
    conversation: servicesConfig.api.endpoints.voice.conversation,
  },
  speech: servicesConfig.api.endpoints.speech,
  image: servicesConfig.api.endpoints.image,
  vision: servicesConfig.api.endpoints.vision,
  services: {
    health: servicesConfig.api.endpoints.services.health,
  },
};

/**
 * Get full API URL
 */
export function getApiUrl(endpoint: string): string {
  return `${API_BASE_URL}${endpoint}`;
}

/**
 * Typed API client
 */
export const api = {
  voice: {
    asr: () => getApiUrl(API_ENDPOINTS.voice.asr),
    tts: () => getApiUrl(API_ENDPOINTS.voice.tts),
    status: () => getApiUrl(API_ENDPOINTS.voice.status),
    conversation: () => getApiUrl(API_ENDPOINTS.voice.conversation),
  },
  chat: () => getApiUrl(API_ENDPOINTS.chat),
  speech: () => getApiUrl(API_ENDPOINTS.speech),
  image: () => getApiUrl(API_ENDPOINTS.image),
  vision: () => getApiUrl(API_ENDPOINTS.vision),
  health: () => getApiUrl(API_ENDPOINTS.health),
  services: {
    health: () => getApiUrl(API_ENDPOINTS.services.health),
  },
};

export default api;
