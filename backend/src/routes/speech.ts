import { Router, Request, Response } from 'express';
import type { TranscribeRequest, TranscribeResponse } from '../types/api.js';
import { logger } from '../utils/logger.js';
import { speechRecognition } from '../services/SpeechRecognitionService.js';
import multer from 'multer';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB
  },
});

/**
 * POST /api/speech/transcribe
 * Transcribe audio to text using Whisper API
 */
router.post('/transcribe', async (req: Request<{}, {}, TranscribeRequest>, res: Response<TranscribeResponse>) => {
  try {
    const { audio, language = 'en' } = req.body;

    if (!audio) {
      res.status(400).json({ error: 'Audio data is required' } as any);
      return;
    }

    logger.info(`Transcribe request: ${audio.substring(0, 30)}... (language: ${language})`);

    // Decode base64 audio
    const audioBuffer = Buffer.from(audio, 'base64');

    // Transcribe using SpeechRecognitionService
    const result = await speechRecognition.transcribe(audioBuffer, {
      language: language === 'auto' ? undefined : language,
      useCache: true,
    });

    const response: TranscribeResponse = {
      text: result.text,
      language: result.language,
      confidence: result.confidence,
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Transcribe error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' } as any);
  }
});

/**
 * POST /api/speech/transcribe-file
 * Transcribe audio file (multipart/form-data)
 */
router.post('/transcribe-file', upload.single('audio'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'Audio file is required' });
      return;
    }

    const language = req.body.language || 'auto';
    const prompt = req.body.prompt;

    logger.info(`Transcribe file: ${req.file.originalname} (${req.file.size} bytes)`);

    // Transcribe using SpeechRecognitionService
    const result = await speechRecognition.transcribe(req.file.buffer, {
      language: language === 'auto' ? undefined : language,
      prompt: prompt,
      useCache: true,
    });

    res.json({
      text: result.text,
      language: result.language,
      confidence: result.confidence,
      duration: result.duration,
      processingTime: result.processingTime,
      cached: result.cached,
    });
  } catch (error: any) {
    logger.error('Transcribe file error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

/**
 * GET /api/speech/info
 * Get speech recognition service info
 */
router.get('/info', (req: Request, res: Response) => {
  try {
    const info = {
      supportedFormats: speechRecognition.getSupportedFormats(),
      maxFileSize: speechRecognition.getMaxFileSize(),
      maxFileSizeMB: (speechRecognition.getMaxFileSize() / 1024 / 1024).toFixed(2),
      cacheStats: speechRecognition.getCacheStats(),
    };

    res.json(info);
  } catch (error) {
    logger.error('Get info error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/speech/cache
 * Clear transcription cache
 */
router.delete('/cache', (req: Request, res: Response) => {
  try {
    speechRecognition.clearCache();
    res.json({ message: 'Cache cleared successfully' });
  } catch (error) {
    logger.error('Clear cache error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
