import { Router, Request, Response } from 'express';
import type { TranscribeRequest, TranscribeResponse } from '../types/api.js';
import { logger } from '../utils/logger.js';

const router = Router();

/**
 * POST /api/speech/transcribe
 * Transcribe audio to text (mock response)
 */
router.post('/transcribe', async (req: Request<{}, {}, TranscribeRequest>, res: Response<TranscribeResponse>) => {
  try {
    const { audio, language = 'en' } = req.body;

    if (!audio) {
      res.status(400).json({ error: 'Audio data is required' } as any);
      return;
    }

    logger.info(`Transcribe request: ${audio.substring(0, 30)}... (language: ${language})`);

    // Mock response
    const mockResponse: TranscribeResponse = {
      text: 'This is a mock transcription. Whisper API integration will be added in C0.3.',
      language: language,
      confidence: 0.95,
    };

    res.json(mockResponse);
  } catch (error) {
    logger.error('Transcribe error:', error);
    res.status(500).json({ error: 'Internal server error' } as any);
  }
});

export default router;
