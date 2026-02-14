import { Router } from 'express';
import multer from 'multer';
import { localVoice } from '../services/LocalVoiceService.js';
import { OpenClawService } from '../services/openclaw.js';
import { logger } from '../utils/logger.js';
import path from 'path';
import fs from 'fs/promises';
import { nanoid } from 'nanoid';

const router = Router();

// Configure multer for audio file uploads
const upload = multer({
  dest: '/tmp/mavin-uploads/',
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/webm',
      'audio/ogg',
      'audio/m4a',
    ];

    if (allowedMimes.includes(file.mimetype) || file.originalname.match(/\.(mp3|wav|webm|ogg|m4a)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Supported: mp3, wav, webm, ogg, m4a'));
    }
  },
});

const openClawService = new OpenClawService();

/**
 * GET /api/voice/status
 * Get voice service status
 */
router.get('/status', async (req, res) => {
  try {
    const status = localVoice.getStatus();

    res.json({
      success: true,
      status,
    });
  } catch (error: any) {
    logger.error('Voice status error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/voice/asr
 * Speech-to-Text (ASR)
 * Body: audio file (multipart/form-data)
 */
router.post('/asr', upload.single('audio'), async (req, res) => {
  let tempFile: string | undefined;

  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No audio file provided',
      });
    }

    tempFile = req.file.path;
    const model = req.body.model || 'base';
    const language = req.body.language || undefined;

    logger.info(`ASR request: ${req.file.originalname} (${req.file.size} bytes)`);

    const result = await localVoice.speechToText(tempFile, {
      model,
      language,
    });

    res.json({
      success: true,
      result,
    });
  } catch (error: any) {
    logger.error('ASR error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  } finally {
    // Clean up temp file
    if (tempFile) {
      try {
        await fs.unlink(tempFile);
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  }
});

/**
 * POST /api/voice/tts
 * Text-to-Speech (TTS)
 * Body: { text, voice?, speed? }
 */
router.post('/tts', async (req, res) => {
  try {
    const { text, voice, speed } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Text is required',
      });
    }

    if (text.length > 5000) {
      return res.status(400).json({
        success: false,
        error: 'Text too long (max 5000 characters)',
      });
    }

    logger.info(`TTS request: "${text.substring(0, 50)}..." (${text.length} chars)`);

    const result = await localVoice.textToSpeech(text, {
      voice,
      speed: speed ? parseFloat(speed) : undefined,
    });

    res.json({
      success: true,
      result,
    });
  } catch (error: any) {
    logger.error('TTS error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/voice/tts-audio
 * Text-to-Speech returning audio file directly
 * Body: { text, voice?, speed? }
 */
router.post('/tts-audio', async (req, res) => {
  try {
    const { text, voice, speed } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Text is required',
      });
    }

    logger.info(`TTS audio request: "${text.substring(0, 50)}..."`);

    const { audio, result } = await localVoice.textToSpeechBuffer(text, {
      voice,
      speed: speed ? parseFloat(speed) : undefined,
    });

    res.set({
      'Content-Type': 'audio/wav',
      'Content-Length': audio.length,
      'Content-Disposition': 'inline',
    });

    res.send(audio);
  } catch (error: any) {
    logger.error('TTS audio error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/voice/conversation
 * Full conversation turn: Audio → Text → AI → Speech
 * Body: audio file (multipart/form-data)
 * Optional: conversationId, model, voice, speed
 */
router.post('/conversation', upload.single('audio'), async (req, res) => {
  let tempFile: string | undefined;

  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No audio file provided',
      });
    }

    tempFile = req.file.path;
    const conversationId = req.body.conversationId || `voice_${nanoid()}`;
    const model = req.body.model || 'claude';
    const asrModel = req.body.asrModel || 'base';
    const language = req.body.language || undefined;
    const voice = req.body.voice || undefined;
    const speed = req.body.speed ? parseFloat(req.body.speed) : undefined;

    logger.info(`Voice conversation: ${req.file.originalname}`);

    // Chat function using OpenClaw
    const chatFunction = async (userText: string): Promise<string> => {
      const response = await openClawService.chat(
        userText,
        conversationId,
        model
      );
      return response.content;
    };

    // Execute full conversation turn
    const result = await localVoice.conversationTurn(
      tempFile,
      chatFunction,
      {
        asrOptions: { model: asrModel, language },
        ttsOptions: { voice, speed },
      }
    );

    res.json({
      success: true,
      result: {
        conversationId,
        userText: result.userText,
        aiText: result.aiText,
        aiAudioUrl: result.aiAudioUrl,
        totalTime: result.totalTime,
        details: {
          asr: {
            language: result.asrResult.language,
            device: result.asrResult.device,
            processingTime: result.asrResult.processingTime,
          },
          tts: {
            voice: result.ttsResult.voice,
            fileSize: result.ttsResult.fileSize,
            processingTime: result.ttsResult.processingTime,
          },
        },
      },
    });
  } catch (error: any) {
    logger.error('Voice conversation error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  } finally {
    // Clean up temp file
    if (tempFile) {
      try {
        await fs.unlink(tempFile);
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  }
});

/**
 * GET /api/voice/voices
 * Get available TTS voices
 */
router.get('/voices', async (req, res) => {
  try {
    const status = localVoice.getStatus();

    res.json({
      success: true,
      voices: status.tts.voices,
    });
  } catch (error: any) {
    logger.error('Voice list error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/voice/models
 * Get available ASR models
 */
router.get('/models', async (req, res) => {
  try {
    const status = localVoice.getStatus();

    res.json({
      success: true,
      models: status.asr.models,
    });
  } catch (error: any) {
    logger.error('Model list error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/voice/cleanup
 * Clean up old audio files
 */
router.post('/cleanup', async (req, res) => {
  try {
    const maxAge = req.body.maxAge || 3600000; // 1 hour default

    await localVoice.cleanup(maxAge);

    res.json({
      success: true,
      message: 'Cleanup complete',
    });
  } catch (error: any) {
    logger.error('Cleanup error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
