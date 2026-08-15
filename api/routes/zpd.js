/**
 * ZPD routes — learner-state ingestion + next-in-ZPD lookup.
 *
 *   GET  /api/zpd/next        (auth) -> next objective in ZPD + recommendedStrategy
 *   POST /api/zpd/mastery     (auth) -> upsert a (user × objective) mastery record
 */

import { Router } from 'express';
import { requireAuth } from '../auth.js';
import {
  nextObjectiveInZPD,
  recommendedStrategy,
  upsertObjectiveState,
} from '../services/zpd-engine.js';

const router = Router();

/**
 * GET /api/zpd/next?path=<curriculumSlug>
 */
router.get('/api/zpd/next', requireAuth, async (req, res) => {
  try {
    const next = await nextObjectiveInZPD(req.user.id, req.query.path || null);
    if (!next) {
      return res.json({ inZPD: false, next: null, recommendedStrategy: null });
    }
    return res.json({
      inZPD: true,
      next,
      recommendedStrategy: recommendedStrategy(next),
    });
  } catch (err) {
    return res.status(500).json({ error: 'nextInZPD failed', detail: err.message });
  }
});

/**
 * POST /api/zpd/mastery
 * body: { objectiveSlug, mastery, bloomLevel?, source? }
 */
router.post('/api/zpd/mastery', requireAuth, async (req, res) => {
  try {
    const { objectiveSlug, mastery, bloomLevel, source } = req.body || {};
    if (!objectiveSlug || typeof objectiveSlug !== 'string') {
      return res.status(400).json({ error: 'objectiveSlug is required' });
    }
    const m = Number(mastery);
    if (!Number.isFinite(m) || m < 0 || m > 1) {
      return res.status(400).json({ error: 'mastery must be a number in [0,1]' });
    }
    const state = await upsertObjectiveState(req.user.id, objectiveSlug, {
      mastery: m,
      bloomLevel,
      source: typeof source === 'string' ? source : 'quiz',
    });
    if (!state) {
      return res.status(404).json({ error: 'Learning objective not found' });
    }
    return res.json({ ok: true, data: state });
  } catch (err) {
    return res.status(500).json({ error: 'mastery upsert failed', detail: err.message });
  }
});

export default router;
