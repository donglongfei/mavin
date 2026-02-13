import { Router, Request, Response } from 'express';
import { aiCoordinator } from '../services/AIServiceCoordinator.js';
import { logger } from '../utils/logger.js';
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
 * POST /api/ai/multi-modal
 * Process multi-modal request (text + audio + image)
 */
router.post(
  '/multi-modal',
  upload.fields([
    { name: 'audio', maxCount: 1 },
    { name: 'image', maxCount: 1 },
  ]),
  async (req: Request, res: Response) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const audio = files?.audio?.[0]?.buffer;
      const image = files?.image?.[0]?.buffer;

      const request = {
        text: req.body.text,
        audio,
        image,
        audioLanguage: req.body.audioLanguage,
        imageAnalysisType: req.body.imageAnalysisType,
        imagePrompt: req.body.imagePrompt,
        imageDetail: req.body.imageDetail,
        persona: req.body.persona,
        userMood: req.body.userMood,
        recentTopics: req.body.recentTopics ? JSON.parse(req.body.recentTopics) : undefined,
        model: req.body.model,
        temperature: req.body.temperature ? parseFloat(req.body.temperature) : undefined,
        maxTokens: req.body.maxTokens ? parseInt(req.body.maxTokens) : undefined,
        conversationId: req.body.conversationId,
      };

      logger.info('Multi-modal request received');
      const result = await aiCoordinator.processMultiModal(request);

      res.json(result);
    } catch (error: any) {
      logger.error('Multi-modal error:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }
);

/**
 * POST /api/ai/chat-with-image
 * Chat with image context
 */
router.post('/chat-with-image', upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'Image file is required' });
      return;
    }

    if (!req.body.message) {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    logger.info('Chat with image request');
    const result = await aiCoordinator.chatWithImage(req.file.buffer, req.body.message, {
      imageDetail: req.body.imageDetail,
      model: req.body.model,
      temperature: req.body.temperature ? parseFloat(req.body.temperature) : undefined,
      conversationId: req.body.conversationId,
    });

    res.json(result);
  } catch (error: any) {
    logger.error('Chat with image error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

/**
 * POST /api/ai/generate-from-conversation
 * Generate image from conversation context
 */
router.post('/generate-from-conversation', async (req: Request, res: Response) => {
  try {
    const { conversationId, additionalPrompt } = req.body;

    if (!conversationId) {
      res.status(400).json({ error: 'Conversation ID is required' });
      return;
    }

    logger.info(`Generating image from conversation: ${conversationId}`);
    const result = await aiCoordinator.generateFromConversation(conversationId, additionalPrompt);

    res.json(result);
  } catch (error: any) {
    logger.error('Generate from conversation error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

/**
 * POST /api/ai/voice-to-image
 * Generate image from voice input
 */
router.post('/voice-to-image', upload.single('audio'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'Audio file is required' });
      return;
    }

    logger.info('Voice to image request');
    const result = await aiCoordinator.voiceToImage(req.file.buffer, {
      language: req.body.language,
      size: req.body.size,
      quality: req.body.quality,
      style: req.body.style,
    });

    res.json(result);
  } catch (error: any) {
    logger.error('Voice to image error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

/**
 * POST /api/ai/image-to-image
 * Transform image based on instruction
 */
router.post('/image-to-image', upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'Image file is required' });
      return;
    }

    if (!req.body.instruction) {
      res.status(400).json({ error: 'Instruction is required' });
      return;
    }

    logger.info('Image to image request');
    const result = await aiCoordinator.imageToImage(req.file.buffer, req.body.instruction, {
      size: req.body.size,
      quality: req.body.quality,
      style: req.body.style,
    });

    res.json(result);
  } catch (error: any) {
    logger.error('Image to image error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

/**
 * POST /api/ai/workflow/create
 * Create a new workflow session
 */
router.post('/workflow/create', async (req: Request, res: Response) => {
  try {
    const { workflowId, type } = req.body;

    if (!workflowId || !type) {
      res.status(400).json({ error: 'Workflow ID and type are required' });
      return;
    }

    aiCoordinator.createWorkflow(workflowId, type);
    res.json({ message: 'Workflow created', workflowId, type });
  } catch (error: any) {
    logger.error('Create workflow error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

/**
 * GET /api/ai/workflow/:id
 * Get workflow state
 */
router.get('/workflow/:id', async (req: Request, res: Response) => {
  try {
    const workflow = aiCoordinator.getWorkflow(req.params.id);

    if (!workflow) {
      res.status(404).json({ error: 'Workflow not found or expired' });
      return;
    }

    res.json(workflow);
  } catch (error: any) {
    logger.error('Get workflow error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

/**
 * POST /api/ai/workflow/:id/complete
 * Complete workflow and get summary
 */
router.post('/workflow/:id/complete', async (req: Request, res: Response) => {
  try {
    const summary = aiCoordinator.completeWorkflow(req.params.id);
    res.json(summary);
  } catch (error: any) {
    logger.error('Complete workflow error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

/**
 * GET /api/ai/status
 * Get all services status
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const status = aiCoordinator.getServiceStatus();
    res.json(status);
  } catch (error: any) {
    logger.error('Get status error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

/**
 * GET /api/ai/stats
 * Get coordinator statistics
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = aiCoordinator.getStats();
    res.json(stats);
  } catch (error: any) {
    logger.error('Get stats error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

/**
 * DELETE /api/ai/workflows/expired
 * Clear expired workflows
 */
router.delete('/workflows/expired', async (req: Request, res: Response) => {
  try {
    const cleared = aiCoordinator.clearExpiredWorkflows();
    res.json({ message: 'Expired workflows cleared', count: cleared });
  } catch (error: any) {
    logger.error('Clear expired workflows error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

export default router;
