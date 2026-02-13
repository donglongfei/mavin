import { Router, Request, Response } from 'express';
import { openClawService } from '../services/openclaw.js';
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

export default router;
