/**
 * Service Health Status API Client
 */

export interface ServiceHealth {
  name: string;
  displayName: string;
  status: 'healthy' | 'degraded' | 'unavailable' | 'error' | 'starting';
  type: 'ai' | 'tts' | 'asr';
  lastCheck: Date;
  error?: string;
  metadata?: Record<string, any>;
  uptime?: number;
  startTime?: Date;
}

export interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'error';
  services: ServiceHealth[];
  timestamp: Date;
  stats: {
    total: number;
    healthy: number;
    degraded: number;
    error: number;
    unavailable: number;
  };
}

const API_BASE_URL = 'http://localhost:8002/api';

export class ServiceHealthAPI {
  /**
   * Get overall system health
   */
  static async getSystemHealth(): Promise<SystemHealth> {
    const response = await fetch(`${API_BASE_URL}/services/health`);
    if (!response.ok) {
      throw new Error('Failed to fetch system health');
    }
    const data = await response.json();

    // Convert date strings to Date objects
    return {
      ...data,
      timestamp: new Date(data.timestamp),
      services: data.services.map((service: any) => ({
        ...service,
        lastCheck: new Date(service.lastCheck),
        startTime: service.startTime ? new Date(service.startTime) : undefined,
      })),
    };
  }

  /**
   * Get specific service status
   */
  static async getServiceStatus(name: string): Promise<ServiceHealth> {
    const response = await fetch(`${API_BASE_URL}/services/${name}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch status for service: ${name}`);
    }
    const data = await response.json();

    return {
      ...data.service,
      lastCheck: new Date(data.service.lastCheck),
      startTime: data.service.startTime ? new Date(data.service.startTime) : undefined,
    };
  }

  /**
   * Restart a service
   */
  static async restartService(name: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/services/${name}/restart`, {
      method: 'POST',
    });
    if (!response.ok) {
      throw new Error(`Failed to restart service: ${name}`);
    }
  }
}
