import { Router, Request, Response } from 'express';
import type { ChatRequest, ChatResponse } from '../types/api.js';
import { logger } from '../utils/logger.js';
import { openClawService } from '../services/openclaw.js';

const router = Router();

/**
 * POST /api/chat
 * Chat with AI using OpenClaw
 */
router.post('/chat', async (req: Request<{}, {}, ChatRequest>, res: Response<ChatResponse>) => {
  try {
    const { message, conversationId, model = 'claude' } = req.body;

    if (!message) {
      res.status(400).json({ error: 'Message is required' } as any);
      return;
    }

    logger.info(`Chat request: ${message.substring(0, 50)}... (model: ${model})`);

    // Use OpenClaw for AI response
    const aiResponse = await openClawService.chat(
      message,
      conversationId,
      model as 'gpt-4' | 'claude'
    );

    const response: ChatResponse = {
      response: aiResponse.content,
      conversationId: conversationId || `conv_${Date.now()}`,
      model: aiResponse.model,
    };

    res.json(response);
  } catch (error) {
    logger.error('Chat error:', error);
    res.status(500).json({ error: 'Internal server error' } as any);
  }
});

export default router;
