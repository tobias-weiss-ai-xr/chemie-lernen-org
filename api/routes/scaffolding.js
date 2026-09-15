/**
 * Scaffolding route handlers — Bloom-staircase scaffolding plans.
 *
 * Routes:
 *   GET /api/scaffolding/hints   (auth required)
 */

import { Router } from 'express';
import pino from 'pino';
import { requireAuth } from '../auth.js';
import { scaffoldingPlan } from '../services/scaffolding-engine.js';

const router = Router();
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  ...(process.env.NODE_ENV !== 'production' && {
    transport: { target: 'pino-pretty', options: { colorize: true } },
  }),
});

/**
 * GET /api/scaffolding/hints?objectiveSlug=...
 * Returns a Bloom-staircase scaffolding plan for the given learning objective.
 */
router.get('/api/scaffolding/hints', requireAuth, async (req, res) => {
  try {
    const objectiveSlug = req.query && req.query.objectiveSlug;
    if (!objectiveSlug || String(objectiveSlug).trim() === '') {
      return res.status(400).json({ error: 'objectiveSlug query parameter ist erforderlich' });
    }

    const plan = await scaffoldingPlan(req.user.id, String(objectiveSlug).trim());
    if (!plan) {
      return res.status(404).json({ error: 'Lernziel nicht gefunden oder ohne Bloom-Level' });
    }

    res.json(plan);
  } catch (err) {
    logger.error({ err, message: err.message || String(err) }, '[scaffolding] hints error');
    res.status(500).json({ error: 'Scaffolding-Hinweise konnten nicht geladen werden' });
  }
});

export default router;
