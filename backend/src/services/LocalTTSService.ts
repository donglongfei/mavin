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
 * Local TTS Service using Piper TTS
 * Fast, lightweight TTS that works efficiently on CPU
 */
export class LocalTTSService {
  private pythonScript: string;
  private defaultVoice: string = 'en_US-lessac-medium';
  private isInitialized: boolean = false;
  private audioDir: string;

  constructor() {
    this.pythonScript = path.join(__dirname, '..', '..', 'python', 'local_tts.py');
    this.audioDir = path.join(__dirname, '..', '..', 'public', 'audio');
  }

  /**
   * Initialize service and check dependencies
   */
  async initialize(): Promise<void> {
    try {
      // Check if Python script exists
      await fs.access(this.pythonScript);

      // Create audio directory
      await fs.mkdir(this.audioDir, { recursive: true });

      // Try to import piper or check piper CLI
      try {
        await execAsync('python3 -c "import piper"');
        logger.info('LocalTTSService initialized with piper-tts (Python)');
      } catch {
        // Try piper CLI
        try {
          await execAsync('piper --version');
          logger.info('LocalTTSService initialized with piper (CLI)');
        } catch {
          logger.warn('Piper not found. Install with: pip install piper-tts');
          logger.warn('Or download binary from: https://github.com/rhasspy/piper/releases');
        }
      }

      this.isInitialized = true;
    } catch (error: any) {
      logger.warn(`LocalTTSService initialization failed: ${error.message}`);
      this.isInitialized = false;
    }
  }

  /**
   * Synthesize speech from text
   */
  async synthesize(
    text: string,
    options: LocalTTSOptions = {}
  ): Promise<LocalTTSResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const startTime = Date.now();

    try {
      // Generate output filename
      const outputFilename = `tts_${nanoid()}.wav`;
      const outputPath = path.join(this.audioDir, outputFilename);

      // Build command
      const voice = options.voice || this.defaultVoice;
      const speed = options.speed || 1.0;

      const cmd = `python3 "${this.pythonScript}" "${text}" "${outputPath}" "${voice}" "${speed}"`;

      logger.info(`Synthesizing speech: "${text.substring(0, 50)}..." with voice ${voice}`);

      // Execute Python script
      const { stdout, stderr } = await execAsync(cmd, {
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
        timeout: 60000, // 60 second timeout
      });

      if (stderr) {
        logger.debug(`TTS stderr: ${stderr}`);
      }

      // Parse result
      const result = JSON.parse(stdout);

      if (!result.success) {
        throw new Error(result.error || 'TTS failed');
      }

      const totalTime = Date.now() - startTime;

      logger.info(
        `TTS complete: ${result.text_length} chars, ${result.file_size} bytes ` +
        `(${result.method}, ${totalTime}ms)`
      );

      return {
        audioPath: result.audio_path,
        audioUrl: `/audio/${outputFilename}`,
        fileSize: result.file_size,
        textLength: result.text_length,
        voice: result.voice,
        speed: result.speed,
        processingTime: result.processing_time,
        totalTime: totalTime / 1000,
        method: result.method,
      };
    } catch (error: any) {
      logger.error('TTS synthesis error:', error);
      throw new Error(`Speech synthesis failed: ${error.message}`);
    }
  }

  /**
   * Synthesize and return audio buffer
   */
  async synthesizeToBuffer(
    text: string,
    options: LocalTTSOptions = {}
  ): Promise<{ audio: Buffer; result: LocalTTSResult }> {
    const result = await this.synthesize(text, options);

    // Read audio file
    const audio = await fs.readFile(result.audioPath);

    return { audio, result };
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
        if (file.startsWith('tts_') && file.endsWith('.wav')) {
          const filePath = path.join(this.audioDir, file);
          const stats = await fs.stat(filePath);

          if (now - stats.mtimeMs > maxAgeMs) {
            await fs.unlink(filePath);
            deletedCount++;
          }
        }
      }

      if (deletedCount > 0) {
        logger.info(`Cleaned up ${deletedCount} old TTS audio files`);
      }

      return deletedCount;
    } catch (error: any) {
      logger.error('TTS cleanup error:', error);
      return 0;
    }
  }

  /**
   * Get available voices
   */
  getAvailableVoices(): VoiceInfo[] {
    return [
      {
        name: 'en_US-lessac-medium',
        language: 'en-US',
        description: 'English (US) - Lessac - Medium quality',
        quality: 'medium',
      },
      {
        name: 'en_US-amy-medium',
        language: 'en-US',
        description: 'English (US) - Amy - Medium quality',
        quality: 'medium',
      },
      {
        name: 'en_GB-alan-medium',
        language: 'en-GB',
        description: 'English (GB) - Alan - Medium quality',
        quality: 'medium',
      },
      {
        name: 'zh_CN-huayan-medium',
        language: 'zh-CN',
        description: 'Chinese (Mandarin) - Huayan - Medium quality',
        quality: 'medium',
      },
    ];
  }

  /**
   * Check if service is available
   */
  isAvailable(): boolean {
    return this.isInitialized;
  }
}

// Types
export interface LocalTTSOptions {
  voice?: string; // e.g., 'en_US-lessac-medium'
  speed?: number; // 0.5 - 2.0 (1.0 = normal)
}

export interface LocalTTSResult {
  audioPath: string;
  audioUrl: string;
  fileSize: number;
  textLength: number;
  voice: string;
  speed: number;
  processingTime: number;
  totalTime: number;
  method: string;
}

export interface VoiceInfo {
  name: string;
  language: string;
  description: string;
  quality: 'low' | 'medium' | 'high';
}

// Singleton instance
export const localTTS = new LocalTTSService();
