import { localASR, LocalASRService, LocalASROptions, LocalASRResult } from './LocalASRService.js';
import { localTTS, LocalTTSService, LocalTTSOptions, LocalTTSResult } from './LocalTTSService.js';
import { logger } from '../utils/logger.js';

/**
 * Unified Local Voice Service
 * Coordinates TTS and ASR services
 */
export class LocalVoiceService {
  private asr: LocalASRService;
  private tts: LocalTTSService;

  constructor() {
    this.asr = localASR;
    this.tts = localTTS;
  }

  /**
   * Initialize both services
   */
  async initialize(): Promise<VoiceServiceStatus> {
    logger.info('Initializing LocalVoiceService...');

    await Promise.all([
      this.asr.initialize(),
      this.tts.initialize(),
    ]);

    const status = this.getStatus();

    if (status.asr.available) {
      logger.info(`✓ ASR available (models: ${status.asr.models.join(', ')})`);
    } else {
      logger.warn('✗ ASR not available');
    }

    if (status.tts.available) {
      logger.info(`✓ TTS available (${status.tts.voices.length} voices)`);
    } else {
      logger.warn('✗ TTS not available');
    }

    return status;
  }

  /**
   * Speech-to-Text (ASR)
   */
  async speechToText(
    audioPath: string,
    options?: LocalASROptions
  ): Promise<LocalASRResult> {
    return this.asr.transcribe(audioPath, options);
  }

  /**
   * Text-to-Speech (TTS)
   */
  async textToSpeech(
    text: string,
    options?: LocalTTSOptions
  ): Promise<LocalTTSResult> {
    return this.tts.synthesize(text, options);
  }

  /**
   * Text-to-Speech returning audio buffer
   */
  async textToSpeechBuffer(
    text: string,
    options?: LocalTTSOptions
  ): Promise<{ audio: Buffer; result: LocalTTSResult }> {
    return this.tts.synthesizeToBuffer(text, options);
  }

  /**
   * Full conversation turn: Audio input → Text → AI → Speech output
   */
  async conversationTurn(
    inputAudioPath: string,
    chatFunction: (text: string) => Promise<string>,
    options?: {
      asrOptions?: LocalASROptions;
      ttsOptions?: LocalTTSOptions;
    }
  ): Promise<ConversationTurnResult> {
    const startTime = Date.now();

    try {
      // 1. Speech to Text
      logger.info('Step 1: Transcribing user speech...');
      const asrResult = await this.speechToText(
        inputAudioPath,
        options?.asrOptions
      );

      logger.info(`User said: "${asrResult.text}"`);

      // 2. Get AI response
      logger.info('Step 2: Getting AI response...');
      const aiResponse = await chatFunction(asrResult.text);

      logger.info(`AI responded: "${aiResponse.substring(0, 100)}..."`);

      // 3. Text to Speech
      logger.info('Step 3: Synthesizing AI response...');
      const ttsResult = await this.textToSpeech(
        aiResponse,
        options?.ttsOptions
      );

      const totalTime = Date.now() - startTime;

      logger.info(`Conversation turn complete in ${totalTime}ms`);

      return {
        userText: asrResult.text,
        aiText: aiResponse,
        aiAudioUrl: ttsResult.audioUrl,
        aiAudioPath: ttsResult.audioPath,
        asrResult,
        ttsResult,
        totalTime: totalTime / 1000,
      };
    } catch (error: any) {
      logger.error('Conversation turn failed:', error);
      throw error;
    }
  }

  /**
   * Get service status
   */
  getStatus(): VoiceServiceStatus {
    return {
      asr: {
        available: this.asr.isAvailable(),
        models: this.asr.getAvailableModels(),
      },
      tts: {
        available: this.tts.isAvailable(),
        voices: this.tts.getAvailableVoices(),
      },
    };
  }

  /**
   * Clean up old audio files
   */
  async cleanup(maxAgeMs: number = 3600000): Promise<void> {
    await this.tts.cleanupOldFiles(maxAgeMs);
  }
}

// Types
export interface VoiceServiceStatus {
  asr: {
    available: boolean;
    models: string[];
  };
  tts: {
    available: boolean;
    voices: Array<{
      name: string;
      language: string;
      description: string;
      quality: string;
    }>;
  };
}

export interface ConversationTurnResult {
  userText: string;
  aiText: string;
  aiAudioUrl: string;
  aiAudioPath: string;
  asrResult: LocalASRResult;
  ttsResult: LocalTTSResult;
  totalTime: number;
}

// Singleton instance
export const localVoice = new LocalVoiceService();
