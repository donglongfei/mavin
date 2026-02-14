import WebSocket from 'ws';
import { logger } from '../utils/logger.js';
import fs from 'fs/promises';
import { getServiceConfig } from '../../../shared/config';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

/**
 * FunASR WebSocket Service
 * Connects to the Docker container running FunASR on port 10095
 * Note: FunASR uses SSL certificates, so we need wss:// (secure WebSocket)
 */
export class FunASRService {
  private wsUrl: string;
  private rejectUnauthorized: boolean;
  private isInitialized: boolean = false;

  constructor() {
    const asrConfig = getServiceConfig('asr');
    this.wsUrl = asrConfig.url || 'wss://localhost:10095';
    this.rejectUnauthorized = asrConfig.ssl?.rejectUnauthorized ?? false;
  }

  /**
   * Check if FunASR service is available
   */
  async initialize(): Promise<void> {
    try {
      // Try to connect to check availability
      await this.checkConnection();
      this.isInitialized = true;
      logger.info('FunASR service is available on ws://localhost:10095');
    } catch (error: any) {
      logger.warn(`FunASR service not available: ${error.message}`);
      this.isInitialized = false;
    }
  }

  /**
   * Check WebSocket connection
   */
  private async checkConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(this.wsUrl, {
        rejectUnauthorized: this.rejectUnauthorized, // Accept self-signed certificates
      });
      const timeout = setTimeout(() => {
        ws.close();
        reject(new Error('Connection timeout'));
      }, 5000);

      ws.on('open', () => {
        clearTimeout(timeout);
        ws.close();
        resolve();
      });

      ws.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
  }

  /**
   * Transcribe audio file using FunASR WebSocket
   */
  async transcribe(audioPath: string): Promise<FunASRResult> {
    if (!this.isInitialized) {
      await this.initialize();
      if (!this.isInitialized) {
        throw new Error('FunASR service not available. Make sure Docker container is running on port 10095.');
      }
    }

    const startTime = Date.now();
    let wavPath: string | undefined;

    try {
      // Convert audio to WAV format (16kHz, 16-bit, mono)
      // Ensure output has .wav extension (input from multer may not have extension)
      wavPath = audioPath + '.wav';
      await execAsync(
        `ffmpeg -i "${audioPath}" -ar 16000 -ac 1 -sample_fmt s16 -y "${wavPath}"`
      );
      logger.debug(`Converted ${audioPath} to ${wavPath}`);

      // Read WAV audio file
      const audioBuffer = await fs.readFile(wavPath);

      // Connect to FunASR WebSocket
      const result = await this.transcribeWebSocket(audioBuffer);

      const processingTime = (Date.now() - startTime) / 1000;

      logger.info(`FunASR transcription complete: "${result.text.substring(0, 50)}..." (${processingTime}s)`);

      return {
        text: result.text,
        language: result.language || 'zh',
        confidence: result.confidence || 1.0,
        device: 'docker-funasr',
        processingTime,
      };
    } catch (error: any) {
      logger.error('FunASR transcription error:', error);
      throw new Error(`FunASR transcription failed: ${error.message}`);
    } finally {
      // Clean up temporary WAV file
      if (wavPath) {
        try {
          await fs.unlink(wavPath);
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    }
  }

  /**
   * Send audio to FunASR WebSocket and get transcription
   */
  private async transcribeWebSocket(audioBuffer: Buffer): Promise<{ text: string; language?: string; confidence?: number }> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(this.wsUrl, {
        rejectUnauthorized: this.rejectUnauthorized, // Accept self-signed certificates
      });
      let resultText = '';
      let isResolved = false;

      const timeout = setTimeout(() => {
        if (!isResolved) {
          ws.close();
          reject(new Error('Transcription timeout (30s)'));
        }
      }, 30000);

      ws.on('open', () => {
        logger.debug('FunASR WebSocket connected');

        // FunASR expects a JSON message first with audio metadata
        const initMessage = {
          mode: 'offline',
          chunk_size: [5, 10, 5],
          chunk_interval: 10,
          wav_name: 'audio',
          is_speaking: true,
          wav_format: 'pcm',
          audio_fs: 16000,
        };

        ws.send(JSON.stringify(initMessage));
        logger.debug('Sent init message to FunASR');

        // Then send the audio data as binary
        ws.send(audioBuffer);
        logger.debug(`Sent audio buffer: ${audioBuffer.length} bytes`);

        // Finally send end signal
        const endMessage = {
          is_speaking: false,
        };
        ws.send(JSON.stringify(endMessage));
        logger.debug('Sent end signal to FunASR');
      });

      ws.on('message', (data: WebSocket.Data) => {
        try {
          const message = JSON.parse(data.toString());

          logger.debug('FunASR message:', message);

          // Extract text from response
          if (message.text) {
            resultText += message.text;
          }

          // Check if final result
          if (message.is_final || message.mode === 'offline') {
            clearTimeout(timeout);
            if (!isResolved) {
              isResolved = true;
              ws.close();
              resolve({
                text: resultText.trim(),
                language: message.language,
                confidence: message.confidence,
              });
            }
          }
        } catch (error: any) {
          logger.error('FunASR message parse error:', error);
          // Some messages might not be JSON, ignore them
        }
      });

      ws.on('error', (error) => {
        clearTimeout(timeout);
        if (!isResolved) {
          isResolved = true;
          reject(new Error(`WebSocket error: ${error.message}`));
        }
      });

      ws.on('close', () => {
        clearTimeout(timeout);
        if (!isResolved) {
          isResolved = true;
          if (resultText) {
            resolve({
              text: resultText.trim(),
            });
          } else {
            reject(new Error('WebSocket closed without result'));
          }
        }
      });
    });
  }

  /**
   * Check if service is available
   */
  isAvailable(): boolean {
    return this.isInitialized;
  }
}

// Types
export interface FunASRResult {
  text: string;
  language: string;
  confidence: number;
  device: string;
  processingTime: number;
}

// Singleton instance
export const funASR = new FunASRService();
