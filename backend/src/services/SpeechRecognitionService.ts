import OpenAI from 'openai';
import { config } from '../utils/config.js';
import { logger } from '../utils/logger.js';
import fs from 'fs';
import path from 'path';

/**
 * Speech Recognition Service
 * Handles audio transcription using OpenAI Whisper API
 */
export class SpeechRecognitionService {
  private openai: OpenAI;
  private transcriptionCache: Map<string, CachedTranscription> = new Map();
  private readonly CACHE_TTL = 3600000; // 1 hour in milliseconds
  private readonly MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB (Whisper limit)
  private readonly SUPPORTED_FORMATS = [
    'mp3',
    'mp4',
    'mpeg',
    'mpga',
    'm4a',
    'wav',
    'webm',
  ];

  constructor() {
    if (config.openai.apiKey && config.openai.apiKey !== 'dummy-key-for-dev') {
      this.openai = new OpenAI({
        apiKey: config.openai.apiKey,
      });
      logger.info('SpeechRecognitionService initialized');
    } else {
      logger.warn('OpenAI API key not configured for speech recognition');
    }
  }

  /**
   * Transcribe audio file
   */
  async transcribe(
    audioFile: Buffer | string,
    options: TranscriptionOptions = {}
  ): Promise<TranscriptionResult> {
    if (!this.openai) {
      throw new Error('OpenAI client not initialized. Please configure OPENAI_API_KEY.');
    }

    const startTime = Date.now();

    try {
      // Generate cache key
      const cacheKey = this.generateCacheKey(audioFile, options);

      // Check cache
      if (options.useCache !== false) {
        const cached = this.getFromCache(cacheKey);
        if (cached) {
          logger.info('Transcription cache hit');
          return cached;
        }
      }

      // Validate audio file
      await this.validateAudioFile(audioFile);

      // Prepare file for API
      const file = await this.prepareFile(audioFile);

      // Call Whisper API
      const response = await this.openai.audio.transcriptions.create({
        file: file,
        model: options.model || 'whisper-1',
        language: options.language,
        prompt: options.prompt,
        response_format: options.responseFormat || 'json',
        temperature: options.temperature || 0,
      });

      const processingTime = Date.now() - startTime;

      // Build result
      const result: TranscriptionResult = {
        text: response.text,
        language: options.language || this.detectLanguage(response.text),
        duration: response.duration,
        confidence: this.estimateConfidence(response.text),
        processingTime,
        model: 'whisper-1',
        cached: false,
      };

      // Cache result
      if (options.useCache !== false) {
        this.addToCache(cacheKey, result);
      }

      logger.info(
        `Transcription complete: ${result.text.length} chars, ${processingTime}ms`
      );

      return result;
    } catch (error: any) {
      logger.error('Transcription error:', error);
      throw new Error(`Speech recognition failed: ${error.message}`);
    }
  }

  /**
   * Transcribe with automatic language detection
   */
  async transcribeAuto(
    audioFile: Buffer | string,
    options: Omit<TranscriptionOptions, 'language'> = {}
  ): Promise<TranscriptionResult> {
    return this.transcribe(audioFile, { ...options, language: undefined });
  }

  /**
   * Transcribe with specific language
   */
  async transcribeWithLanguage(
    audioFile: Buffer | string,
    language: string,
    options: Omit<TranscriptionOptions, 'language'> = {}
  ): Promise<TranscriptionResult> {
    return this.transcribe(audioFile, { ...options, language });
  }

  /**
   * Validate audio file
   */
  private async validateAudioFile(audioFile: Buffer | string): Promise<void> {
    // Check file size
    const size = Buffer.isBuffer(audioFile)
      ? audioFile.length
      : (await fs.promises.stat(audioFile)).size;

    if (size > this.MAX_FILE_SIZE) {
      throw new Error(
        `Audio file too large: ${(size / 1024 / 1024).toFixed(2)}MB (max 25MB)`
      );
    }

    if (size === 0) {
      throw new Error('Audio file is empty');
    }

    // Check format (if file path provided)
    if (typeof audioFile === 'string') {
      const ext = path.extname(audioFile).toLowerCase().slice(1);
      if (!this.SUPPORTED_FORMATS.includes(ext)) {
        throw new Error(
          `Unsupported audio format: ${ext}. Supported: ${this.SUPPORTED_FORMATS.join(', ')}`
        );
      }
    }
  }

  /**
   * Prepare file for API (convert Buffer to File-like object)
   */
  private async prepareFile(audioFile: Buffer | string): Promise<any> {
    if (typeof audioFile === 'string') {
      // File path - read and return as File
      return fs.createReadStream(audioFile);
    } else {
      // Buffer - create temporary file
      const tempPath = path.join('/tmp', `audio_${Date.now()}.mp3`);
      await fs.promises.writeFile(tempPath, audioFile);
      return fs.createReadStream(tempPath);
    }
  }

  /**
   * Detect language from transcribed text (simplified)
   */
  private detectLanguage(text: string): string {
    // Simplified language detection
    // In production, use a proper language detection library
    const hasChineseChars = /[\u4e00-\u9fa5]/.test(text);
    const hasJapaneseChars = /[\u3040-\u309f\u30a0-\u30ff]/.test(text);
    const hasKoreanChars = /[\uac00-\ud7af]/.test(text);

    if (hasChineseChars) return 'zh';
    if (hasJapaneseChars) return 'ja';
    if (hasKoreanChars) return 'ko';

    return 'en'; // default
  }

  /**
   * Estimate transcription confidence (simplified)
   */
  private estimateConfidence(text: string): number {
    // Simplified confidence estimation
    // In production, Whisper API might provide this
    if (text.length === 0) return 0;
    if (text.length < 10) return 0.7;
    if (text.includes('[inaudible]') || text.includes('[unclear]')) return 0.6;

    return 0.95; // High confidence for normal transcriptions
  }

  /**
   * Generate cache key
   */
  private generateCacheKey(
    audioFile: Buffer | string,
    options: TranscriptionOptions
  ): string {
    const fileHash = Buffer.isBuffer(audioFile)
      ? audioFile.slice(0, 1024).toString('base64')
      : audioFile;

    return `${fileHash}_${options.language || 'auto'}_${options.model || 'whisper-1'}`;
  }

  /**
   * Get from cache
   */
  private getFromCache(key: string): TranscriptionResult | null {
    const cached = this.transcriptionCache.get(key);

    if (!cached) return null;

    // Check if expired
    if (Date.now() - cached.timestamp > this.CACHE_TTL) {
      this.transcriptionCache.delete(key);
      return null;
    }

    return { ...cached.result, cached: true };
  }

  /**
   * Add to cache
   */
  private addToCache(key: string, result: TranscriptionResult): void {
    this.transcriptionCache.set(key, {
      result,
      timestamp: Date.now(),
    });

    // Cleanup old cache entries
    if (this.transcriptionCache.size > 100) {
      const oldestKey = this.transcriptionCache.keys().next().value;
      this.transcriptionCache.delete(oldestKey);
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.transcriptionCache.clear();
    logger.info('Transcription cache cleared');
  }

  /**
   * Get cache stats
   */
  getCacheStats(): CacheStats {
    let validEntries = 0;
    let expiredEntries = 0;

    for (const [key, cached] of this.transcriptionCache.entries()) {
      if (Date.now() - cached.timestamp > this.CACHE_TTL) {
        expiredEntries++;
      } else {
        validEntries++;
      }
    }

    return {
      totalEntries: this.transcriptionCache.size,
      validEntries,
      expiredEntries,
      cacheTTL: this.CACHE_TTL,
    };
  }

  /**
   * Get supported formats
   */
  getSupportedFormats(): string[] {
    return [...this.SUPPORTED_FORMATS];
  }

  /**
   * Get max file size
   */
  getMaxFileSize(): number {
    return this.MAX_FILE_SIZE;
  }
}

// Types
export interface TranscriptionOptions {
  model?: 'whisper-1';
  language?: string; // ISO-639-1 code (e.g., 'en', 'zh', 'ja')
  prompt?: string; // Optional text to guide the model's style
  responseFormat?: 'json' | 'text' | 'srt' | 'verbose_json' | 'vtt';
  temperature?: number; // 0-1, sampling temperature
  useCache?: boolean; // Whether to use caching (default: true)
}

export interface TranscriptionResult {
  text: string;
  language: string;
  duration?: number;
  confidence: number;
  processingTime: number;
  model: string;
  cached: boolean;
}

interface CachedTranscription {
  result: TranscriptionResult;
  timestamp: number;
}

interface CacheStats {
  totalEntries: number;
  validEntries: number;
  expiredEntries: number;
  cacheTTL: number;
}

// Singleton instance
export const speechRecognition = new SpeechRecognitionService();
