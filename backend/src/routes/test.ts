import { Router, Request, Response } from 'express';
import { openClawService } from '../services/openclaw.js';
import { languageModel } from '../services/LanguageModelInterface.js';
import { logger } from '../utils/logger.js';

const router = Router();

/**
 * GET /api/test/openclaw
 * Test OpenClaw connections
 */
router.get('/openclaw', async (req: Request, res: Response) => {
  try {
    logger.info('Testing OpenClaw connections...');

    const results = {
      claude: false,
      openai: false,
    };

    // Test Claude
    try {
      results.claude = await openClawService.testClaude();
    } catch (error) {
      logger.error('Claude test error:', error);
    }

    // Test OpenAI
    try {
      results.openai = await openClawService.testOpenAI();
    } catch (error) {
      logger.error('OpenAI test error:', error);
    }

    res.json({
      status: results.claude || results.openai ? 'ok' : 'failed',
      connections: results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Test error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/test/language-model
 * Test LanguageModelInterface with both providers
 */
router.get('/language-model', async (req: Request, res: Response) => {
  try {
    logger.info('Testing LanguageModelInterface...');

    const results: any = {
      claude: { success: false, error: null, response: null, cost: null },
      openai: { success: false, error: null, response: null, cost: null },
    };

    // Test Claude
    try {
      const claudeResponse = await languageModel.chat({
        messages: [
          {
            role: 'user',
            content: 'Say "Claude is working!" if you can read this.',
          },
        ],
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 50,
      });

      results.claude = {
        success: true,
        response: claudeResponse.content.substring(0, 100),
        model: claudeResponse.model,
        tokens: claudeResponse.usage.total_tokens,
        cost: claudeResponse.cost.total_cost,
      };
    } catch (error: any) {
      results.claude.error = error.message;
      logger.error('Claude test error:', error);
    }

    // Test OpenAI
    try {
      const openaiResponse = await languageModel.chat({
        messages: [
          {
            role: 'user',
            content: 'Say "OpenAI is working!" if you can read this.',
          },
        ],
        model: 'gpt-4-turbo',
        max_tokens: 50,
      });

      results.openai = {
        success: true,
        response: openaiResponse.content.substring(0, 100),
        model: openaiResponse.model,
        tokens: openaiResponse.usage.total_tokens,
        cost: openaiResponse.cost.total_cost,
      };
    } catch (error: any) {
      results.openai.error = error.message;
      logger.error('OpenAI test error:', error);
    }

    const allSuccess = results.claude.success && results.openai.success;

    res.json({
      status: allSuccess ? 'ok' : 'partial',
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Language model test error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
