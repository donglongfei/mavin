import { Router, Request, Response } from 'express';
import type { ImageGenerateRequest, ImageGenerateResponse } from '../types/api.js';
import { logger } from '../utils/logger.js';
import { imageGeneration } from '../services/ImageGenerationService.js';

const router = Router();

/**
 * POST /api/image/generate
 * Generate image from text prompt using DALL-E 3
 */
router.post('/generate', async (req: Request<{}, {}, ImageGenerateRequest>, res: Response<ImageGenerateResponse>) => {
  try {
    const { prompt, size = '1024x1024', quality = 'standard' } = req.body;

    if (!prompt) {
      res.status(400).json({ error: 'Prompt is required' } as any);
      return;
    }

    logger.info(`Image generation request: ${prompt.substring(0, 50)}... (${size}, ${quality})`);

    // Generate image using ImageGenerationService
    const result = await imageGeneration.generate({
      prompt,
      size: size as any,
      quality: quality as any,
      enhancePrompt: false,
      saveLocally: true,
    });

    const response: ImageGenerateResponse = {
      imageUrl: result.imageUrl,
      revisedPrompt: result.revisedPrompt,
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Image generation error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' } as any);
  }
});

/**
 * POST /api/image/generate-enhanced
 * Generate image with automatic prompt enhancement
 */
router.post('/generate-enhanced', async (req: Request, res: Response) => {
  try {
    const { prompt, size = '1024x1024', quality = 'standard', style = 'vivid' } = req.body;

    if (!prompt) {
      res.status(400).json({ error: 'Prompt is required' });
      return;
    }

    logger.info(`Enhanced image generation: ${prompt.substring(0, 50)}...`);

    const result = await imageGeneration.generateEnhanced(prompt, {
      size: size as any,
      quality: quality as any,
      style: style as any,
      saveLocally: true,
    });

    res.json({
      imageUrl: result.imageUrl,
      revisedPrompt: result.revisedPrompt,
      originalPrompt: result.originalPrompt,
      enhancedPrompt: result.enhancedPrompt,
      size: result.size,
      quality: result.quality,
      style: result.style,
      processingTime: result.processingTime,
      cost: result.cost,
    });
  } catch (error: any) {
    logger.error('Enhanced image generation error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

/**
 * POST /api/image/variations
 * Generate multiple style variations
 */
router.post('/variations', async (req: Request, res: Response) => {
  try {
    const { prompt, size = '1024x1024', quality = 'standard' } = req.body;

    if (!prompt) {
      res.status(400).json({ error: 'Prompt is required' });
      return;
    }

    logger.info(`Generating variations: ${prompt.substring(0, 50)}...`);

    const results = await imageGeneration.generateVariations(prompt, {
      size: size as any,
      quality: quality as any,
      saveLocally: true,
    });

    res.json({
      variations: results.map((r) => ({
        imageUrl: r.imageUrl,
        style: r.style,
        revisedPrompt: r.revisedPrompt,
        cost: r.cost,
      })),
      totalCost: results.reduce((sum, r) => sum + r.cost, 0),
    });
  } catch (error: any) {
    logger.error('Variations generation error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

/**
 * GET /api/image/stored
 * List locally stored images
 */
router.get('/stored', async (req: Request, res: Response) => {
  try {
    const images = await imageGeneration.listStoredImages();
    res.json({ images, count: images.length });
  } catch (error) {
    logger.error('List stored images error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/image/stored/:filename
 * Delete stored image
 */
router.delete('/stored/:filename', async (req: Request, res: Response) => {
  try {
    const { filename } = req.params;
    const success = await imageGeneration.deleteStoredImage(filename);

    if (success) {
      res.json({ message: 'Image deleted successfully', filename });
    } else {
      res.status(404).json({ error: 'Image not found or could not be deleted' });
    }
  } catch (error) {
    logger.error('Delete image error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/image/info
 * Get image generation service info
 */
router.get('/info', (req: Request, res: Response) => {
  try {
    const info = {
      ...imageGeneration.getSupportedOptions(),
      storageDir: imageGeneration.getStorageDir(),
    };

    res.json(info);
  } catch (error) {
    logger.error('Get info error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
