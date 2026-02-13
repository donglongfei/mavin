import { Router, Request, Response } from 'express';
import type { VisionAnalyzeRequest, VisionAnalyzeResponse } from '../types/api.js';
import { logger } from '../utils/logger.js';

const router = Router();

/**
 * POST /api/vision/analyze
 * Analyze image with AI vision (mock response)
 */
router.post('/analyze', async (req: Request<{}, {}, VisionAnalyzeRequest>, res: Response<VisionAnalyzeResponse>) => {
  try {
    const { image, prompt } = req.body;

    if (!image) {
      res.status(400).json({ error: 'Image data is required' } as any);
      return;
    }

    logger.info(`Vision analysis request: ${image.substring(0, 30)}...`);
    if (prompt) {
      logger.info(`With prompt: ${prompt}`);
    }

    // Mock response
    const mockResponse: VisionAnalyzeResponse = {
      description: 'This is a mock vision analysis. GPT-4 Vision integration will be added in C0.3.',
      objects: ['object1', 'object2', 'object3'],
      text: 'Mock OCR text extracted from image',
    };

    res.json(mockResponse);
  } catch (error) {
    logger.error('Vision analysis error:', error);
    res.status(500).json({ error: 'Internal server error' } as any);
  }
});

export default router;
