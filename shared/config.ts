/**
 * Mavin Services Configuration Loader
 *
 * Centralized configuration for all services, ports, and endpoints.
 * Used by backend, frontend, and service management scripts.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load configuration from JSON file
const configPath = path.join(__dirname, '..', 'config', 'services.json');
const configData = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

export interface ServiceConfig {
  name: string;
  type: 'web' | 'api' | 'docker' | 'python' | 'cli';
  port?: number;
  ports?: {
    primary: number;
    fallback?: number[];
  };
  url?: string;
  protocol?: string;
  healthCheck?: string | null;
  command?: string;
  directory?: string;
  script?: string;
  container?: {
    name: string;
    image: string;
    imagePath: string;
  };
  ssl?: {
    enabled: boolean;
    rejectUnauthorized: boolean;
  };
  cors?: {
    origins: string[];
  };
}

export interface ServicesConfiguration {
  version: string;
  services: {
    frontend: ServiceConfig;
    backend: ServiceConfig;
    asr: ServiceConfig;
    tts: ServiceConfig;
    openclaw: ServiceConfig;
  };
  api: {
    baseUrl: string;
    endpoints: {
      health: string;
      chat: string;
      voice: {
        asr: string;
        tts: string;
        status: string;
        conversation: string;
      };
      speech: string;
      image: string;
      vision: string;
      services: {
        health: string;
      };
    };
  };
  paths: {
    logs: string;
    pids: string;
    uploads: string;
    audio: string;
  };
}

export const servicesConfig: ServicesConfiguration = configData;

/**
 * Get service configuration by name
 */
export function getServiceConfig(serviceName: keyof ServicesConfiguration['services']): ServiceConfig {
  return servicesConfig.services[serviceName];
}

/**
 * Get API endpoint URL
 */
export function getApiUrl(endpoint: string): string {
  const { baseUrl, endpoints } = servicesConfig.api;

  // Navigate nested endpoint paths
  const parts = endpoint.split('.');
  let current: any = endpoints;

  for (const part of parts) {
    current = current[part];
    if (!current) {
      throw new Error(`Unknown API endpoint: ${endpoint}`);
    }
  }

  return `${baseUrl}${current}`;
}

/**
 * Get service URL
 */
export function getServiceUrl(serviceName: keyof ServicesConfiguration['services']): string {
  const service = servicesConfig.services[serviceName];
  if (!service.url) {
    throw new Error(`Service ${serviceName} has no URL configured`);
  }
  return service.url;
}

/**
 * Get service port
 */
export function getServicePort(serviceName: keyof ServicesConfiguration['services']): number {
  const service = servicesConfig.services[serviceName];

  if (service.port) {
    return service.port;
  }

  if (service.ports?.primary) {
    return service.ports.primary;
  }

  throw new Error(`Service ${serviceName} has no port configured`);
}

/**
 * Get all service ports (including fallbacks)
 */
export function getServicePorts(serviceName: keyof ServicesConfiguration['services']): number[] {
  const service = servicesConfig.services[serviceName];

  if (service.port) {
    return [service.port];
  }

  if (service.ports) {
    const ports = [service.ports.primary];
    if (service.ports.fallback) {
      ports.push(...service.ports.fallback);
    }
    return ports;
  }

  return [];
}

// Export configuration object
export default servicesConfig;
