import { exec } from 'child_process';
import { promisify } from 'util';
import { logger } from '../utils/logger.js';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Local ASR Service using Faster-Whisper
 * Supports MUSA GPU, CUDA GPU, and CPU fallback
 */
export class LocalASRService {
  private pythonScript: string;
  private defaultModel: string = 'base'; // tiny, base, small, medium, large
  private isInitialized: boolean = false;

  constructor() {
    this.pythonScript = path.join(__dirname, '..', '..', 'python', 'local_asr.py');
  }

  /**
   * Initialize service and check dependencies
   */
  async initialize(): Promise<void> {
    try {
      // Check if Python script exists
      await fs.access(this.pythonScript);

      // Check if faster-whisper is installed
      const { stdout } = await execAsync('python3 -c "import faster_whisper; print(faster_whisper.__version__)"');
      logger.info(`LocalASRService initialized with faster-whisper ${stdout.trim()}`);

      this.isInitialized = true;
    } catch (error: any) {
      logger.warn(`LocalASRService initialization failed: ${error.message}`);
      logger.warn('Install faster-whisper: pip install faster-whisper');
      this.isInitialized = false;
    }
  }

  /**
   * Transcribe audio file
   */
  async transcribe(
    audioPath: string,
    options: LocalASROptions = {}
  ): Promise<LocalASRResult> {
    if (!this.isInitialized) {
      await this.initialize();
      if (!this.isInitialized) {
        throw new Error('LocalASRService not initialized. Please install faster-whisper.');
      }
    }

    const startTime = Date.now();

    try {
      // Validate audio file exists
      await fs.access(audioPath);

      // Build command
      const model = options.model || this.defaultModel;
      const language = options.language || '';

      const cmd = `python3 "${this.pythonScript}" "${audioPath}" "${model}" "${language}"`;

      logger.info(`Transcribing with model: ${model}, language: ${language || 'auto'}`);

      // Execute Python script
      const { stdout, stderr } = await execAsync(cmd, {
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      });

      if (stderr) {
        logger.debug(`ASR stderr: ${stderr}`);
      }

      // Parse result
      const result = JSON.parse(stdout);

      if (!result.success) {
        throw new Error(result.error || 'ASR failed');
      }

      const totalTime = Date.now() - startTime;

      logger.info(
        `Transcription complete: "${result.text.substring(0, 50)}..." ` +
        `(${result.device}, ${totalTime}ms)`
      );

      return {
        text: result.text,
        segments: result.segments,
        language: result.language,
        languageProbability: result.language_probability,
        duration: result.duration,
        device: result.device,
        computeType: result.compute_type,
        model: result.model,
        processingTime: result.processing_time,
        totalTime: totalTime / 1000,
      };
    } catch (error: any) {
      logger.error('ASR transcription error:', error);
      throw new Error(`Speech recognition failed: ${error.message}`);
    }
  }

  /**
   * Transcribe with automatic language detection
   */
  async transcribeAuto(
    audioPath: string,
    model?: string
  ): Promise<LocalASRResult> {
    return this.transcribe(audioPath, { model });
  }

  /**
   * Get available models
   */
  getAvailableModels(): string[] {
    return ['tiny', 'base', 'small', 'medium', 'large', 'large-v2', 'large-v3'];
  }

  /**
   * Check if service is available
   */
  isAvailable(): boolean {
    return this.isInitialized;
  }
}

// Types
export interface LocalASROptions {
  model?: 'tiny' | 'base' | 'small' | 'medium' | 'large' | 'large-v2' | 'large-v3';
  language?: string; // ISO-639-1 code (e.g., 'en', 'zh', 'ja')
}

export interface LocalASRResult {
  text: string;
  segments: Array<{
    start: number;
    end: number;
    text: string;
    confidence: number;
  }>;
  language: string;
  languageProbability: number;
  duration: number;
  device: string; // 'cpu', 'cuda', or 'musa'
  computeType: string;
  model: string;
  processingTime: number;
  totalTime: number;
}

// Singleton instance
export const localASR = new LocalASRService();
