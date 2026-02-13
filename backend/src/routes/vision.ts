import { Router, Request, Response } from 'express';
import type { VisionAnalyzeRequest, VisionAnalyzeResponse } from '../types/api.js';
import { logger } from '../utils/logger.js';
import { visionService } from '../services/VisionService.js';
import multer from 'multer';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB
  },
});

/**
 * POST /api/vision/analyze
 * Analyze image with GPT-4 Vision
 */
router.post('/analyze', async (req: Request<{}, {}, VisionAnalyzeRequest>, res: Response<VisionAnalyzeResponse>) => {
  try {
    const { image, prompt } = req.body;

    if (!image) {
      res.status(400).json({ error: 'Image data is required' } as any);
      return;
    }

    logger.info(`Vision analysis request: ${image.substring(0, 30)}...`);

    // Decode base64 image
    const imageBuffer = Buffer.from(image, 'base64');

    // Analyze using VisionService
    const result = await visionService.analyze(imageBuffer, {
      prompt: prompt,
      analysisType: 'general',
      useCache: true,
    });

    const response: VisionAnalyzeResponse = {
      description: result.description || '',
      objects: result.objects || [],
      text: result.text,
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Vision analysis error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' } as any);
  }
});

/**
 * POST /api/vision/analyze-file
 * Analyze image file (multipart/form-data)
 */
router.post('/analyze-file', upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'Image file is required' });
      return;
    }

    const analysisType = req.body.analysisType || 'general';
    const prompt = req.body.prompt;
    const detail = req.body.detail || 'auto';

    logger.info(`Vision analysis file: ${req.file.originalname} (${req.file.size} bytes)`);

    // Analyze using VisionService
    const result = await visionService.analyze(req.file.buffer, {
      analysisType: analysisType as any,
      prompt: prompt,
      detail: detail as any,
      useCache: true,
    });

    res.json({
      ...result,
    });
  } catch (error: any) {
    logger.error('Vision analysis file error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

/**
 * POST /api/vision/describe
 * Get detailed description of image
 */
router.post('/describe', upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'Image file is required' });
      return;
    }

    const description = await visionService.describe(req.file.buffer, req.body.detail);

    res.json({ description });
  } catch (error: any) {
    logger.error('Describe error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

/**
 * POST /api/vision/objects
 * Detect objects in image
 */
router.post('/objects', upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'Image file is required' });
      return;
    }

    const objects = await visionService.detectObjects(req.file.buffer);

    res.json({ objects, count: objects.length });
  } catch (error: any) {
    logger.error('Object detection error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

/**
 * POST /api/vision/ocr
 * Extract text from image (OCR)
 */
router.post('/ocr', upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'Image file is required' });
      return;
    }

    const text = await visionService.extractText(req.file.buffer);

    res.json({ text, length: text.length });
  } catch (error: any) {
    logger.error('OCR error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

/**
 * POST /api/vision/faces
 * Detect faces in image
 */
router.post('/faces', upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'Image file is required' });
      return;
    }

    const faces = await visionService.detectFaces(req.file.buffer);

    res.json({ faces, count: faces.length });
  } catch (error: any) {
    logger.error('Face detection error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

/**
 * POST /api/vision/scene
 * Analyze scene and context
 */
router.post('/scene', upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'Image file is required' });
      return;
    }

    const scene = await visionService.analyzeScene(req.file.buffer);

    res.json(scene);
  } catch (error: any) {
    logger.error('Scene analysis error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

/**
 * GET /api/vision/info
 * Get vision service info
 */
router.get('/info', (req: Request, res: Response) => {
  try {
    const info = {
      supportedFormats: visionService.getSupportedFormats(),
      maxImageSize: visionService.getMaxImageSize(),
      maxImageSizeMB: (visionService.getMaxImageSize() / 1024 / 1024).toFixed(2),
      cacheStats: visionService.getCacheStats(),
    };

    res.json(info);
  } catch (error) {
    logger.error('Get info error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/vision/cache
 * Clear vision analysis cache
 */
router.delete('/cache', (req: Request, res: Response) => {
  try {
    visionService.clearCache();
    res.json({ message: 'Cache cleared successfully' });
  } catch (error) {
    logger.error('Clear cache error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
