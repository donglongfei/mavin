import dotenv from 'dotenv';
import path from 'path';
import {
  servicesConfig,
  getServiceConfig as _getServiceConfig,
  getApiUrl as _getApiUrl,
  getServiceUrl as _getServiceUrl,
  getServicePort as _getServicePort
} from '../../../shared/config.ts';

// Load .env first (default config)
dotenv.config();

// Load .env.local (private keys, overrides .env)
// This file is gitignored and should contain your private API keys
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

export const config = {
  // Load port and CORS from centralized config
  port: process.env.PORT || servicesConfig.services.backend.port,
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
    : servicesConfig.services.backend.cors?.origins || ['http://localhost:3000'],

  openai: {
    apiKey: process.env.OPENAI_API_KEY || 'dummy-key-for-dev',
    model: process.env.OPENAI_MODEL || 'gpt-4-turbo',
  },

  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY || 'dummy-key-for-dev',
    model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022',
  },

  kimi: {
    apiKey: process.env.KIMI_API_KEY || '',
    baseUrl: process.env.KIMI_BASE_URL || 'https://api.moonshot.cn/v1',
    model: process.env.KIMI_MODEL || 'moonshot-v1-8k',
  },

  openclaw: {
    path: process.env.OPENCLAW_PATH || '',
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },

  // Services configuration from centralized config
  services: servicesConfig.services,
  api: servicesConfig.api,
  paths: servicesConfig.paths,
};

// Export helper functions
export const getServiceConfig = _getServiceConfig;
export const getApiUrl = _getApiUrl;
export const getServiceUrl = _getServiceUrl;
export const getServicePort = _getServicePort;
