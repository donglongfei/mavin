import { Router, Request, Response } from 'express';
import type { ChatRequest, ChatResponse } from '../types/api.js';
import { logger } from '../utils/logger.js';
import { languageModel } from '../services/LanguageModelInterface.js';
import { promptManager } from '../services/PromptManager.js';
import { OpenClawService } from '../services/openclaw.js';
import type { ModelName } from '../types/language-model.js';
import type { PersonaType } from '../types/prompts.js';

const router = Router();
const openClawService = new OpenClawService();

/**
 * POST /api/chat/chat
 * Chat with AI using OpenClaw
 */
router.post('/chat', async (req: Request<{}, {}, ChatRequest>, res: Response<ChatResponse>) => {
  try {
    const { message, conversationId, model = 'claude', persona } = req.body;

    if (!message) {
      res.status(400).json({ error: 'Message is required' } as any);
      return;
    }

    logger.info(`Chat request (OpenClaw): ${message.substring(0, 50)}... (model: ${model}, persona: ${persona || 'none'})`);

    // Prepare message with persona context if specified
    let finalMessage = message;
    if (persona) {
      const context = promptManager.generateContext({
        currentTime: new Date(),
        conversationHistory: [],
      });
      const systemPrompt = promptManager.getPrompt(persona as PersonaType, context);
      // Prepend system prompt to the message for OpenClaw
      finalMessage = `${systemPrompt}\n\nUser: ${message}`;
    }

    // Use OpenClaw for AI response
    const modelType = model.toLowerCase().includes('gpt') ? 'gpt-4' : 'claude';
    const aiResponse = await openClawService.chat(
      finalMessage,
      conversationId || `conv_${Date.now()}`,
      modelType
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

/**
 * POST /api/chat/stream
 * Stream chat responses
 */
router.post('/stream', async (req: Request, res: Response) => {
  try {
    const { message, conversationId, model = 'claude' } = req.body;

    if (!message) {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    logger.info(`Stream request: ${message.substring(0, 50)}...`);

    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const modelMap: Record<string, ModelName> = {
      'claude': 'claude-3-5-sonnet-20241022',
      'gpt-4': 'gpt-4-turbo',
      'gpt-3.5': 'gpt-3.5-turbo',
    };

    const fullModelName = modelMap[model] || (model as ModelName);

    // Stream response
    const stream = languageModel.chatStream(
      {
        messages: [
          {
            role: 'user',
            content: message,
          },
        ],
        model: fullModelName,
        temperature: 0.7,
      },
      conversationId
    );

    for await (const chunk of stream) {
      res.write(`data: ${JSON.stringify(chunk)}\n\n`);

      if (chunk.done) {
        break;
      }
    }

    res.end();
  } catch (error) {
    logger.error('Stream error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/chat/context/:conversationId
 * Get conversation context
 */
router.get('/context/:conversationId', (req: Request, res: Response) => {
  try {
    const { conversationId } = req.params;
    const context = languageModel.getContext(conversationId);

    if (!context) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    res.json(context);
  } catch (error) {
    logger.error('Context retrieval error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/chat/context/:conversationId
 * Clear conversation context
 */
router.delete('/context/:conversationId', (req: Request, res: Response) => {
  try {
    const { conversationId } = req.params;
    languageModel.clearContext(conversationId);

    res.json({ message: 'Context cleared', conversationId });
  } catch (error) {
    logger.error('Context clear error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
