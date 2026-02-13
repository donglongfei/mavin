import { Router, Request, Response } from 'express';
import { promptManager } from '../services/PromptManager.js';
import type { PersonaType } from '../types/prompts.js';
import { logger } from '../utils/logger.js';

const router = Router();

/**
 * GET /api/prompts/personas
 * Get all available personas
 */
router.get('/personas', (req: Request, res: Response) => {
  try {
    const personas = promptManager.getAvailablePersonas();
    res.json({ personas });
  } catch (error) {
    logger.error('Get personas error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/prompts/persona/:type
 * Get specific persona info
 */
router.get('/persona/:type', (req: Request, res: Response) => {
  try {
    const { type } = req.params;
    const info = promptManager.getPersonaInfo(type as PersonaType);

    if (!info) {
      res.status(404).json({ error: 'Persona not found' });
      return;
    }

    res.json(info);
  } catch (error) {
    logger.error('Get persona error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/prompts/generate
 * Generate contextual prompt for a persona
 */
router.post('/generate', (req: Request, res: Response) => {
  try {
    const { persona, context } = req.body;

    if (!persona) {
      res.status(400).json({ error: 'Persona is required' });
      return;
    }

    const prompt = promptManager.getPrompt(persona as PersonaType, context);

    res.json({
      persona,
      prompt,
      context: context || {},
    });
  } catch (error) {
    logger.error('Generate prompt error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/prompts/ab-test
 * Create A/B test for a persona
 */
router.post('/ab-test', (req: Request, res: Response) => {
  try {
    const { persona, variantPrompt, splitPercentage = 50 } = req.body;

    if (!persona || !variantPrompt) {
      res.status(400).json({ error: 'Persona and variantPrompt are required' });
      return;
    }

    promptManager.createABTest(
      persona as PersonaType,
      variantPrompt,
      splitPercentage
    );

    res.json({
      message: 'A/B test created',
      persona,
      splitPercentage,
    });
  } catch (error) {
    logger.error('Create A/B test error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/prompts/ab-test/:persona
 * Get A/B test results
 */
router.get('/ab-test/:persona', (req: Request, res: Response) => {
  try {
    const { persona } = req.params;
    const results = promptManager.getABTestResults(persona as PersonaType);

    if (!results) {
      res.status(404).json({ error: 'No active A/B test for this persona' });
      return;
    }

    res.json(results);
  } catch (error) {
    logger.error('Get A/B test results error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/prompts/ab-test/:persona
 * Stop A/B test
 */
router.delete('/ab-test/:persona', (req: Request, res: Response) => {
  try {
    const { persona } = req.params;
    promptManager.stopABTest(persona as PersonaType);

    res.json({
      message: 'A/B test stopped',
      persona,
    });
  } catch (error) {
    logger.error('Stop A/B test error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
