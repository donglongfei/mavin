import { exec } from 'child_process';
import { promisify } from 'util';
import { logger } from '../utils/logger.js';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { nanoid } from 'nanoid';
import WebSocket from 'ws';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * MT LiteTTS Streaming Service
 * Provides real-time streaming TTS with lower latency
 * Supports both complete synthesis and chunk-by-chunk streaming
 */
export class MTLiteTTSStreamingService {
  private pythonScript: string;
  private wsServerScript: string;
  private isInitialized: boolean = false;
  private audioDir: string;
  private wsServerProcess: any = null;
  private wsServerPort: number = 5000;

  constructor() {
    this.pythonScript = path.join(__dirname, '..', '..', 'python', 'mt_litetts_streaming.py');
    this.wsServerScript = path.join(__dirname, '..', '..', 'python', 'mt_litetts_ws_server.py');
    this.audioDir = path.join(__dirname, '..', '..', 'public', 'audio');
  }

  /**
   * Initialize service and check if MT LiteTTS is installed
   */
  async initialize(): Promise<void> {
    try {
      // Check if Python script exists
      await fs.access(this.pythonScript);
      await fs.access(this.wsServerScript);

      // Create audio directory
      await fs.mkdir(this.audioDir, { recursive: true });

      // Test if MT LiteTTS is available
      logger.info('Checking MT LiteTTS streaming installation...');

      this.isInitialized = true;
      logger.info('MTLiteTTSStreamingService initialized');
    } catch (error: any) {
      logger.warn(`MTLiteTTSStreamingService initialization warning: ${error.message}`);
      this.isInitialized = false;
    }
  }

  /**
   * Synthesize speech from text (complete synthesis)
   * Returns audio buffer that can be played immediately
   */
  async synthesize(text: string): Promise<MTLiteTTSStreamingResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const startTime = Date.now();

    try {
      // Generate output filename
      const outputFilename = `tts_mt_stream_${nanoid()}.wav`;
      const outputPath = path.join(this.audioDir, outputFilename);

      // Build command (without --stream flag for complete synthesis)
      const cmd = `python3 "${this.pythonScript}" "${text}" "${outputPath}"`;

      logger.info(`MT LiteTTS streaming synthesizing: "${text.substring(0, 50)}..."`);

      // Execute Python script
      const { stdout, stderr } = await execAsync(cmd, {
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
        timeout: 60000, // 60 second timeout
      });

      if (stderr) {
        logger.debug(`MT LiteTTS streaming stderr: ${stderr}`);
      }

      // Parse result - extract JSON from potentially mixed output
      // The model may output debug messages, so find the last line with JSON
      const lines = stdout.trim().split('\n');
      let resultJson = '';

      // Try to find JSON from the last lines
      for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i].trim();
        if (line.startsWith('{') && line.endsWith('}')) {
          resultJson = line;
          break;
        }
      }

      if (!resultJson) {
        throw new Error(`No valid JSON found in output: ${stdout.substring(0, 200)}`);
      }

      const result = JSON.parse(resultJson);

      if (!result.success) {
        throw new Error(result.error || 'MT LiteTTS streaming synthesis failed');
      }

      const totalTime = Date.now() - startTime;

      logger.info(
        `MT LiteTTS streaming complete: ${result.text_length} chars, ${result.file_size} bytes ` +
        `(${totalTime}ms)`
      );

      // Read audio buffer for auto-play
      const audioBuffer = await fs.readFile(outputPath);

      return {
        audioPath: result.audio_path,
        audioUrl: `/audio/${outputFilename}`,
        audioBuffer,
        fileSize: result.file_size,
        textLength: result.text_length,
        voice: result.voice,
        model: result.model,
        processingTime: result.processing_time,
        totalTime: totalTime / 1000,
        mode: result.mode || 'complete',
      };
    } catch (error: any) {
      logger.error('MT LiteTTS streaming synthesis error:', error);
      throw new Error(`MT LiteTTS streaming synthesis failed: ${error.message}`);
    }
  }

  /**
   * Synthesize with streaming chunks
   * Generator that yields audio chunks as they're ready
   */
  async* synthesizeStreaming(text: string, chunkSize: number = 50): AsyncGenerator<StreamChunk> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const wsUrl = `ws://localhost:${this.wsServerPort}/api/tts/stream`;

    return new Promise<AsyncGenerator<StreamChunk>>((resolve, reject) => {
      const ws = new WebSocket(wsUrl);

      async function* generator() {
        // Wait for connection
        await new Promise((res, rej) => {
          ws.on('open', res);
          ws.on('error', rej);
        });

        // Send synthesis request
        ws.send(JSON.stringify({ text, chunk_size: chunkSize }));

        // Process messages
        for await (const message of ws) {
          const data = JSON.parse(message.toString());

          if (data.type === 'start') {
            logger.info(`Streaming synthesis started: ${data.text}`);
          } else if (data.type === 'chunk') {
            // Decode audio from base64
            const audioBuffer = Buffer.from(data.audio_base64, 'base64');

            yield {
              chunkIndex: data.chunk_index,
              totalChunks: data.total_chunks,
              text: data.text,
              audioBuffer,
              sampleRate: data.sample_rate,
            };
          } else if (data.type === 'complete') {
            logger.info('Streaming synthesis complete');
            ws.close();
            break;
          } else if (data.type === 'error') {
            ws.close();
            throw new Error(data.error);
          }
        }
      }

      resolve(generator());
    });
  }

  /**
   * Start WebSocket server for streaming (if not running)
   */
  async startWebSocketServer(): Promise<void> {
    if (this.wsServerProcess) {
      logger.info('WebSocket server already running');
      return;
    }

    try {
      const { spawn } = await import('child_process');

      this.wsServerProcess = spawn('python3', [this.wsServerScript], {
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      this.wsServerProcess.stdout.on('data', (data: Buffer) => {
        logger.debug(`WS Server: ${data.toString()}`);
      });

      this.wsServerProcess.stderr.on('data', (data: Buffer) => {
        logger.debug(`WS Server stderr: ${data.toString()}`);
      });

      this.wsServerProcess.on('exit', (code: number) => {
        logger.info(`WebSocket server exited with code ${code}`);
        this.wsServerProcess = null;
      });

      // Wait for server to start
      await new Promise(resolve => setTimeout(resolve, 2000));

      logger.info(`MT LiteTTS WebSocket server started on port ${this.wsServerPort}`);
    } catch (error: any) {
      logger.error('Failed to start WebSocket server:', error);
      throw error;
    }
  }

  /**
   * Stop WebSocket server
   */
  async stopWebSocketServer(): Promise<void> {
    if (this.wsServerProcess) {
      this.wsServerProcess.kill();
      this.wsServerProcess = null;
      logger.info('WebSocket server stopped');
    }
  }

  /**
   * Synthesize and return only buffer (no file saved)
   * Perfect for auto-play without saving to disk
   */
  async synthesizeToBuffer(text: string): Promise<{ audio: Buffer; result: MTLiteTTSStreamingResult }> {
    const result = await this.synthesize(text);
    return { audio: result.audioBuffer, result };
  }

  /**
   * Get service information
   */
  getInfo(): ServiceInfo {
    return {
      name: 'MT LiteTTS Streaming',
      voice: 'cheng-xiaoke',
      displayName: '程小可 (Cheng Xiaoke)',
      language: 'zh-CN',
      model: 'mt_litetts_v4d',
      streaming: true,
      description: 'Real-time streaming TTS with MT LiteTTS',
    };
  }

  /**
   * Check if service is available
   */
  isAvailable(): boolean {
    return this.isInitialized;
  }

  /**
   * Clean up old audio files
   */
  async cleanupOldFiles(maxAgeMs: number = 3600000): Promise<number> {
    try {
      const files = await fs.readdir(this.audioDir);
      let deletedCount = 0;
      const now = Date.now();

      for (const file of files) {
        if (file.startsWith('tts_mt_stream_') && file.endsWith('.wav')) {
          const filePath = path.join(this.audioDir, file);
          const stats = await fs.stat(filePath);

          if (now - stats.mtimeMs > maxAgeMs) {
            await fs.unlink(filePath);
            deletedCount++;
          }
        }
      }

      if (deletedCount > 0) {
        logger.info(`Cleaned up ${deletedCount} old MT LiteTTS streaming audio files`);
      }

      return deletedCount;
    } catch (error: any) {
      logger.error('MT LiteTTS streaming cleanup error:', error);
      return 0;
    }
  }
}

// Types
export interface MTLiteTTSStreamingResult {
  audioPath: string;
  audioUrl: string;
  audioBuffer: Buffer;
  fileSize: number;
  textLength: number;
  voice: string;
  model: string;
  processingTime: number;
  totalTime: number;
  mode: string;
}

export interface StreamChunk {
  chunkIndex: number;
  totalChunks: number;
  text: string;
  audioBuffer: Buffer;
  sampleRate: number;
}

export interface ServiceInfo {
  name: string;
  voice: string;
  displayName: string;
  language: string;
  model: string;
  streaming: boolean;
  description: string;
}

// Singleton instance
export const mtLiteTTSStreaming = new MTLiteTTSStreamingService();
