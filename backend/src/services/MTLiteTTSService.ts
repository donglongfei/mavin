import { exec } from 'child_process';
import { promisify } from 'util';
import { logger } from '../utils/logger.js';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { nanoid } from 'nanoid';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Moore Threads LiteTTS Service
 * Official on-device TTS from Moore Threads
 * Model: mt_litetts_v4d (程小可 voice)
 */
export class MTLiteTTSService {
  private pythonScript: string;
  private isInitialized: boolean = false;
  private audioDir: string;

  constructor() {
    this.pythonScript = path.join(__dirname, '..', '..', 'python', 'mt_litetts.py');
    this.audioDir = path.join(__dirname, '..', '..', 'public', 'audio');
  }

  /**
   * Initialize service and check if MT LiteTTS is installed
   */
  async initialize(): Promise<void> {
    try {
      // Check if Python script exists
      await fs.access(this.pythonScript);

      // Create audio directory
      await fs.mkdir(this.audioDir, { recursive: true });

      // Test if MT LiteTTS is installed (will auto-install if needed)
      logger.info('Checking MT LiteTTS installation...');

      this.isInitialized = true;
      logger.info('MTLiteTTSService initialized');
    } catch (error: any) {
      logger.warn(`MTLiteTTSService initialization warning: ${error.message}`);
      this.isInitialized = false;
    }
  }

  /**
   * Synthesize speech from text
   */
  async synthesize(text: string): Promise<MTLiteTTSResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const startTime = Date.now();

    try {
      // Generate output filename
      const outputFilename = `tts_mt_${nanoid()}.wav`;
      const outputPath = path.join(this.audioDir, outputFilename);

      // Build command
      const cmd = `python3 "${this.pythonScript}" "${text}" "${outputPath}"`;

      logger.info(`MT LiteTTS synthesizing: "${text.substring(0, 50)}..."`);

      // Execute Python script
      const { stdout, stderr } = await execAsync(cmd, {
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
        timeout: 60000, // 60 second timeout
      });

      if (stderr) {
        logger.debug(`MT LiteTTS stderr: ${stderr}`);
      }

      // Parse result
      const result = JSON.parse(stdout);

      if (!result.success) {
        throw new Error(result.error || 'MT LiteTTS synthesis failed');
      }

      const totalTime = Date.now() - startTime;

      logger.info(
        `MT LiteTTS complete: ${result.text_length} chars, ${result.file_size} bytes ` +
        `(${totalTime}ms)`
      );

      return {
        audioPath: result.audio_path,
        audioUrl: `/audio/${outputFilename}`,
        fileSize: result.file_size,
        textLength: result.text_length,
        voice: result.voice,
        model: result.model,
        processingTime: result.processing_time,
        totalTime: totalTime / 1000,
        backend: result.backend,
      };
    } catch (error: any) {
      logger.error('MT LiteTTS synthesis error:', error);
      throw new Error(`MT LiteTTS synthesis failed: ${error.message}`);
    }
  }

  /**
   * Synthesize and return audio buffer
   */
  async synthesizeToBuffer(text: string): Promise<{ audio: Buffer; result: MTLiteTTSResult }> {
    const result = await this.synthesize(text);

    // Read audio file
    const audio = await fs.readFile(result.audioPath);

    return { audio, result };
  }

  /**
   * Get voice information
   */
  getVoiceInfo(): VoiceInfo {
    return {
      name: 'cheng-xiaoke',
      displayName: '程小可 (Cheng Xiaoke)',
      language: 'zh-CN',
      gender: 'female',
      description: 'MT TTS Premium Voice - 摩尔线程精品音色',
      model: 'mt_litetts_v4d',
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
        if (file.startsWith('tts_mt_') && file.endsWith('.wav')) {
          const filePath = path.join(this.audioDir, file);
          const stats = await fs.stat(filePath);

          if (now - stats.mtimeMs > maxAgeMs) {
            await fs.unlink(filePath);
            deletedCount++;
          }
        }
      }

      if (deletedCount > 0) {
        logger.info(`Cleaned up ${deletedCount} old MT LiteTTS audio files`);
      }

      return deletedCount;
    } catch (error: any) {
      logger.error('MT LiteTTS cleanup error:', error);
      return 0;
    }
  }
}

// Types
export interface MTLiteTTSResult {
  audioPath: string;
  audioUrl: string;
  fileSize: number;
  textLength: number;
  voice: string;
  model: string;
  processingTime: number;
  totalTime: number;
  backend: string;
}

export interface VoiceInfo {
  name: string;
  displayName: string;
  language: string;
  gender: string;
  description: string;
  model: string;
}

// Singleton instance
export const mtLiteTTS = new MTLiteTTSService();
