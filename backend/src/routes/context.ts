import { Router, Request, Response } from 'express';
import type { ContextResponse } from '../types/api.js';
import { logger } from '../utils/logger.js';

const router = Router();

/**
 * GET /api/context/current
 * Get current user context (mock response)
 */
router.get('/current', async (req: Request, res: Response<ContextResponse>) => {
  try {
    logger.info('Context request');

    const hour = new Date().getHours();
    let timeOfDay = 'morning';
    if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';
    else if (hour >= 17 && hour < 21) timeOfDay = 'evening';
    else if (hour >= 21 || hour < 6) timeOfDay = 'night';

    // Mock response
    const mockResponse: ContextResponse = {
      mode: 'companion',
      userActivity: 'working',
      timeOfDay: timeOfDay,
      location: 'home',
      calendar: {
        nextEvent: 'Team meeting',
        timeUntilNext: 3600, // 1 hour in seconds
      },
    };

    res.json(mockResponse);
  } catch (error) {
    logger.error('Context error:', error);
    res.status(500).json({ error: 'Internal server error' } as any);
  }
});

export default router;
