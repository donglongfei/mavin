import { logger } from '../utils/logger.js';
import { openClawService } from './openclaw.js';
import { mtLiteTTSStreaming } from './MTLiteTTSStreamingService.js';
import { funASR } from './FunASRService.js';
import { getServiceConfig } from '../../../shared/config';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import WebSocket from 'ws';
const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Mavin Service Manager
 *
 * Manages core voice backend services:
 * 1. OpenClaw - AI chat (GPT-4 / Claude)
 * 2. MT LiteTTS Streaming - Text-to-Speech
 * 3. FunASR - Automatic Speech Recognition
 *
 * Features:
 * - Health check monitoring
 * - Auto-start services
 * - Centralized logging
 * - Status reporting for UI
 */

export interface ServiceHealth {
  name: string;
  displayName: string;
  status: 'healthy' | 'degraded' | 'unavailable' | 'error' | 'starting';
  type: 'ai' | 'tts' | 'asr';
  lastCheck: Date;
  error?: string;
  metadata?: Record<string, any>;
  uptime?: number; // seconds
  startTime?: Date;
}

export interface ServiceLog {
  timestamp: Date;
  service: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  details?: any;
}

export class ServiceManager {
  private services: Map<string, ServiceHealth> = new Map();
  private logs: ServiceLog[] = [];
  private maxLogs: number = 1000;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private isInitialized: boolean = false;

  // FunASR Docker configuration
  private funasrConfig = (() => {
    const asrConfig = getServiceConfig('asr');
    return {
      containerName: asrConfig.container?.name || 'local_asr_server',
      wsUrl: asrConfig.url || 'wss://localhost:10095',
      checkTimeout: 5000,
      rejectUnauthorized: asrConfig.ssl?.rejectUnauthorized ?? false,
    };
  })();

  constructor() {
    logger.info('ServiceManager created');
  }

  /**
   * Initialize all services
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      this.log('info', 'manager', 'Service manager already initialized');
      return;
    }

    this.log('info', 'manager', 'Starting service initialization...');

    try {
      // Initialize services in parallel for faster startup
      await Promise.all([
        this.initializeOpenClaw(),
        this.initializeMTLiteTTS(),
        this.initializeFunASR(),
      ]);

      this.isInitialized = true;
      this.log('info', 'manager', 'All services initialized');

      // Start periodic health checks
      this.startHealthCheckLoop();

    } catch (error: any) {
      this.log('error', 'manager', 'Service initialization failed', error);
      throw error;
    }
  }

  /**
   * Initialize OpenClaw service (AI Chat)
   */
  private async initializeOpenClaw(): Promise<void> {
    const serviceName = 'openclaw';
    this.log('info', serviceName, 'Initializing OpenClaw service...');

    this.setServiceStatus(serviceName, {
      name: serviceName,
      displayName: 'OpenClaw AI',
      status: 'starting',
      type: 'ai',
      lastCheck: new Date(),
    });

    try {
      // Check if openclaw CLI is available
      try {
        await execAsync('which openclaw');
      } catch {
        throw new Error('OpenClaw CLI not found. Install with: npm install -g openclaw');
      }

      // Test Kimi connection first (uses OpenClaw's default model)
      const kimiOk = await openClawService.testKimi().catch(() => false);

      if (kimiOk) {
        // Kimi is working via OpenClaw
        this.setServiceStatus(serviceName, {
          name: serviceName,
          displayName: 'OpenClaw AI',
          status: 'healthy',
          type: 'ai',
          lastCheck: new Date(),
          startTime: new Date(),
          metadata: {
            provider: 'kimi-coding',
            model: 'k2p5',
            displayName: 'Kimi K2.5',
            backend: 'OpenClaw CLI',
          },
        });

        this.log('info', serviceName, 'OpenClaw ready (Kimi K2.5)');
      } else {
        // Fall back to testing OpenAI/Claude
        this.log('info', serviceName, 'Kimi not available, testing OpenAI/Claude...');

        const [openaiOk, claudeOk] = await Promise.all([
          openClawService.testOpenAI().catch(() => false),
          openClawService.testClaude().catch(() => false),
        ]);

        if (!openaiOk && !claudeOk) {
          throw new Error('No models available. Configure Kimi or set OpenAI/Claude API keys.');
        }

        this.setServiceStatus(serviceName, {
          name: serviceName,
          displayName: 'OpenClaw AI',
          status: openaiOk && claudeOk ? 'healthy' : 'degraded',
          type: 'ai',
          lastCheck: new Date(),
          startTime: new Date(),
          metadata: {
            openai: openaiOk,
            claude: claudeOk,
            providers: [
              ...(openaiOk ? ['OpenAI (GPT-4)'] : []),
              ...(claudeOk ? ['Anthropic (Claude)'] : []),
            ],
          },
        });

        this.log('info', serviceName, `OpenClaw ready (OpenAI: ${openaiOk}, Claude: ${claudeOk})`);
      }

    } catch (error: any) {
      this.setServiceStatus(serviceName, {
        name: serviceName,
        displayName: 'OpenClaw AI',
        status: 'error',
        type: 'ai',
        lastCheck: new Date(),
        error: error.message,
      });

      this.log('error', serviceName, 'OpenClaw initialization failed', error);
    }
  }

  /**
   * Initialize MT LiteTTS Streaming service
   */
  private async initializeMTLiteTTS(): Promise<void> {
    const serviceName = 'mt-litetts';
    this.log('info', serviceName, 'Initializing MT LiteTTS Streaming...');

    this.setServiceStatus(serviceName, {
      name: serviceName,
      displayName: 'MT LiteTTS',
      status: 'starting',
      type: 'tts',
      lastCheck: new Date(),
    });

    try {
      await mtLiteTTSStreaming.initialize();

      if (!mtLiteTTSStreaming.isAvailable()) {
        throw new Error('MT LiteTTS not available. Install: pip install mt-litetts');
      }

      const info = mtLiteTTSStreaming.getInfo();

      this.setServiceStatus(serviceName, {
        name: serviceName,
        displayName: 'MT LiteTTS',
        status: 'healthy',
        type: 'tts',
        lastCheck: new Date(),
        startTime: new Date(),
        metadata: {
          voice: info.voice,
          displayName: info.displayName,
          model: info.model,
          language: info.language,
          streaming: info.streaming,
        },
      });

      this.log('info', serviceName, `MT LiteTTS ready (${info.voice})`);

    } catch (error: any) {
      this.setServiceStatus(serviceName, {
        name: serviceName,
        displayName: 'MT LiteTTS',
        status: 'error',
        type: 'tts',
        lastCheck: new Date(),
        error: error.message,
      });

      this.log('error', serviceName, 'MT LiteTTS initialization failed', error);
    }
  }

  /**
   * Initialize FunASR Docker service
   */
  private async initializeFunASR(): Promise<void> {
    const serviceName = 'funasr';
    this.log('info', serviceName, 'Checking FunASR Docker service...');

    this.setServiceStatus(serviceName, {
      name: serviceName,
      displayName: 'FunASR',
      status: 'starting',
      type: 'asr',
      lastCheck: new Date(),
    });

    try {
      // Check if Docker container exists
      let { stdout: containers } = await execAsync('docker ps -a --format "{{.Names}}"')
        .catch(async (err) => {
          // Try with sudo if permission denied
          if (err.message.includes('permission denied')) {
            this.log('warn', serviceName, 'Docker permission denied, trying with sudo...');
            return await execAsync('sudo docker ps -a --format "{{.Names}}"');
          }
          throw err;
        });

      const containerExists = containers.split('\n').includes(this.funasrConfig.containerName);

      if (!containerExists) {
        throw new Error(`FunASR container '${this.funasrConfig.containerName}' not found`);
      }

      // Check if container is running
      let { stdout: runningContainers } = await execAsync('docker ps --format "{{.Names}}"')
        .catch(async (err) => {
          if (err.message.includes('permission denied')) {
            return await execAsync('sudo docker ps --format "{{.Names}}"');
          }
          throw err;
        });

      const isRunning = runningContainers.split('\n').includes(this.funasrConfig.containerName);

      if (!isRunning) {
        this.log('warn', serviceName, 'FunASR container not running, starting...');
        await this.startFunASR();
      }

      // Wait a moment for service to be ready
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Initialize FunASR service
      await funASR.initialize();

      // Test WebSocket connection
      const wsAvailable = await this.testFunASRConnection();

      if (!wsAvailable) {
        throw new Error('FunASR WebSocket connection failed');
      }

      this.setServiceStatus(serviceName, {
        name: serviceName,
        displayName: 'FunASR',
        status: 'healthy',
        type: 'asr',
        lastCheck: new Date(),
        startTime: new Date(),
        metadata: {
          container: this.funasrConfig.containerName,
          wsUrl: this.funasrConfig.wsUrl,
          port: 10095,
          mode: '2-pass (streaming + offline)',
        },
      });

      this.log('info', serviceName, 'FunASR service ready');

    } catch (error: any) {
      // Check if it's a permission error
      const isPermissionError = error.message && error.message.includes('permission denied');

      this.setServiceStatus(serviceName, {
        name: serviceName,
        displayName: 'FunASR',
        status: 'error',
        type: 'asr',
        lastCheck: new Date(),
        error: isPermissionError
          ? 'Docker permission denied. Run: sudo usermod -aG docker $USER && newgrp docker'
          : error.message,
        metadata: {
          permissionError: isPermissionError,
        },
      });

      this.log('error', serviceName, 'FunASR initialization failed', error);
    }
  }

  /**
   * Start FunASR Docker container
   */
  private async startFunASR(): Promise<void> {
    try {
      this.log('info', 'funasr', `Starting container ${this.funasrConfig.containerName}...`);

      await execAsync(`docker start ${this.funasrConfig.containerName}`)
        .catch(async (err) => {
          if (err.message.includes('permission denied')) {
            return await execAsync(`sudo docker start ${this.funasrConfig.containerName}`);
          }
          throw err;
        });

      this.log('info', 'funasr', 'Container started successfully');
    } catch (error: any) {
      this.log('error', 'funasr', 'Failed to start container', error);
      throw error;
    }
  }

  /**
   * Test FunASR WebSocket connection
   */
  private async testFunASRConnection(): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        this.log('info', 'funasr', `Testing WebSocket connection to ${this.funasrConfig.wsUrl}...`);
        const ws = new WebSocket(this.funasrConfig.wsUrl, {
          rejectUnauthorized: this.funasrConfig.rejectUnauthorized, // From centralized config
        });

        const timeout = setTimeout(() => {
          this.log('warn', 'funasr', 'WebSocket connection timeout');
          ws.close();
          resolve(false);
        }, this.funasrConfig.checkTimeout);

        ws.on('open', () => {
          this.log('info', 'funasr', 'WebSocket connection successful');
          clearTimeout(timeout);
          ws.close();
          resolve(true);
        });

        ws.on('error', (error: any) => {
          this.log('error', 'funasr', `WebSocket connection error: ${error.message}`);
          clearTimeout(timeout);
          resolve(false);
        });

      } catch (error: any) {
        this.log('error', 'funasr', `WebSocket test exception: ${error.message || error}`);
        resolve(false);
      }
    });
  }

  /**
   * Start periodic health check loop
   */
  private startHealthCheckLoop(): void {
    if (this.healthCheckInterval) {
      return;
    }

    // Check every 60 seconds
    this.healthCheckInterval = setInterval(async () => {
      this.log('info', 'manager', 'Running periodic health checks...');

      await Promise.all([
        this.checkOpenClawHealth(),
        this.checkMTLiteTTSHealth(),
        this.checkFunASRHealth(),
      ]);

    }, 60000);

    this.log('info', 'manager', 'Health check loop started (60s interval)');
  }

  /**
   * Check OpenClaw health
   */
  private async checkOpenClawHealth(): Promise<void> {
    const service = this.services.get('openclaw');
    if (!service) return;

    try {
      // Try Kimi first
      const kimiOk = await openClawService.testKimi().catch(() => false);

      if (kimiOk) {
        service.status = 'healthy';
        service.lastCheck = new Date();
        service.metadata = {
          ...service.metadata,
          provider: 'kimi-coding',
          model: 'k2p5',
        };
      } else {
        // Fall back to OpenAI/Claude
        const [openaiOk, claudeOk] = await Promise.all([
          openClawService.testOpenAI().catch(() => false),
          openClawService.testClaude().catch(() => false),
        ]);

        service.status = (openaiOk || claudeOk) ? (openaiOk && claudeOk ? 'healthy' : 'degraded') : 'error';
        service.lastCheck = new Date();
        service.metadata = {
          ...service.metadata,
          openai: openaiOk,
          claude: claudeOk,
        };
      }

      if (service.startTime) {
        service.uptime = Math.floor((Date.now() - service.startTime.getTime()) / 1000);
      }

    } catch (error: any) {
      service.status = 'error';
      service.error = error.message;
      service.lastCheck = new Date();
    }
  }

  /**
   * Check MT LiteTTS health
   */
  private async checkMTLiteTTSHealth(): Promise<void> {
    const service = this.services.get('mt-litetts');
    if (!service) return;

    try {
      const available = mtLiteTTSStreaming.isAvailable();
      service.status = available ? 'healthy' : 'unavailable';
      service.lastCheck = new Date();

      if (service.startTime) {
        service.uptime = Math.floor((Date.now() - service.startTime.getTime()) / 1000);
      }

    } catch (error: any) {
      service.status = 'error';
      service.error = error.message;
      service.lastCheck = new Date();
    }
  }

  /**
   * Check FunASR health
   */
  private async checkFunASRHealth(): Promise<void> {
    const service = this.services.get('funasr');
    if (!service) return;

    try {
      // Check if container is still running
      const { stdout } = await execAsync(`docker ps --filter name=${this.funasrConfig.containerName} --format "{{.Names}}"`)
        .catch(async (err) => {
          if (err.message.includes('permission denied')) {
            return await execAsync(`sudo docker ps --filter name=${this.funasrConfig.containerName} --format "{{.Names}}"`);
          }
          throw err;
        });

      const isRunning = stdout.trim() === this.funasrConfig.containerName;

      if (!isRunning) {
        service.status = 'unavailable';
        service.error = 'Container not running';
        service.lastCheck = new Date();
        return;
      }

      // Test WebSocket
      const wsAvailable = await this.testFunASRConnection();
      service.status = wsAvailable ? 'healthy' : 'degraded';
      service.lastCheck = new Date();

      if (service.startTime) {
        service.uptime = Math.floor((Date.now() - service.startTime.getTime()) / 1000);
      }

    } catch (error: any) {
      service.status = 'error';
      service.error = error.message;
      service.lastCheck = new Date();
    }
  }

  /**
   * Stop health check loop
   */
  stopHealthCheckLoop(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
      this.log('info', 'manager', 'Health check loop stopped');
    }
  }

  /**
   * Get status of a specific service
   */
  getServiceStatus(name: string): ServiceHealth | undefined {
    return this.services.get(name);
  }

  /**
   * Get all service statuses
   */
  getAllServices(): ServiceHealth[] {
    return Array.from(this.services.values());
  }

  /**
   * Get overall system health
   */
  getSystemHealth(): {
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
  } {
    const services = this.getAllServices();

    const stats = services.reduce((acc, service) => {
      acc.total++;
      if (service.status === 'healthy') acc.healthy++;
      else if (service.status === 'degraded') acc.degraded++;
      else if (service.status === 'error') acc.error++;
      else if (service.status === 'unavailable') acc.unavailable++;
      return acc;
    }, { total: 0, healthy: 0, degraded: 0, error: 0, unavailable: 0 });

    let overall: 'healthy' | 'degraded' | 'error' = 'healthy';
    if (stats.error > 0 || stats.unavailable > 0) {
      overall = 'error';
    } else if (stats.degraded > 0) {
      overall = 'degraded';
    }

    return {
      overall,
      services,
      timestamp: new Date(),
      stats,
    };
  }

  /**
   * Get recent logs
   */
  getLogs(count: number = 100): ServiceLog[] {
    return this.logs.slice(-count);
  }

  /**
   * Get logs for a specific service
   */
  getServiceLogs(serviceName: string, count: number = 100): ServiceLog[] {
    return this.logs
      .filter(log => log.service === serviceName)
      .slice(-count);
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logs = [];
    this.log('info', 'manager', 'Logs cleared');
  }

  /**
   * Set service status
   */
  private setServiceStatus(name: string, status: ServiceHealth): void {
    this.services.set(name, status);
  }

  /**
   * Add log entry
   */
  private log(level: 'info' | 'warn' | 'error', service: string, message: string, details?: any): void {
    const logEntry: ServiceLog = {
      timestamp: new Date(),
      service,
      level,
      message,
      details,
    };

    this.logs.push(logEntry);

    // Trim logs if exceeding max
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Also log to console
    const logMessage = `[${service.toUpperCase()}] ${message}`;
    if (level === 'error') {
      logger.error(logMessage, details);
    } else if (level === 'warn') {
      logger.warn(logMessage);
    } else {
      logger.info(logMessage);
    }
  }

  /**
   * Restart a service
   */
  async restartService(name: string): Promise<void> {
    this.log('info', name, `Restarting service...`);

    switch (name) {
      case 'openclaw':
        await this.initializeOpenClaw();
        break;
      case 'mt-litetts':
        await this.initializeMTLiteTTS();
        break;
      case 'funasr':
        await this.initializeFunASR();
        break;
      default:
        throw new Error(`Unknown service: ${name}`);
    }
  }

  /**
   * Cleanup and shutdown
   */
  async shutdown(): Promise<void> {
    this.log('info', 'manager', 'Shutting down service manager...');

    this.stopHealthCheckLoop();

    // Cleanup services
    await mtLiteTTSStreaming.cleanupOldFiles(0);

    this.log('info', 'manager', 'Shutdown complete');
  }
}

// Singleton instance
export const serviceManager = new ServiceManager();
