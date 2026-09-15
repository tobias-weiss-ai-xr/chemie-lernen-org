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
  ZPD_THRESHOLDS,
  bloomIndex,
} from '../services/zpd-engine.js';
import { completeObjective } from '../auth-db.js';
import { getBloomTarget, setBloomTarget } from '../services/bloom-target.js';

const router = Router();

/**
 * GET /api/zpd/bloom-target
 * Returns the current user's per-learner Bloom ceiling (1–6).
 */
router.get('/api/zpd/bloom-target', requireAuth, async (req, res) => {
  try {
    const t = getBloomTarget(req.user.id);
    return res.json({ ok: true, targetBloomIndex: t, bloomLevel: bloomIndex(t) });
  } catch (err) {
    return res.status(500).json({ error: 'getBloomTarget failed', detail: err.message });
  }
});

/**
 * POST /api/zpd/bloom-target
 * body: { targetBloomIndex: 1..6 | Bloom level string }
 * Sets the current user's per-learner Bloom ceiling.
 */
router.post('/api/zpd/bloom-target', requireAuth, async (req, res) => {
  try {
    const { targetBloomIndex } = req.body || {};
    if (targetBloomIndex == null) {
      return res.status(400).json({ error: 'targetBloomIndex is required' });
    }
    const result = setBloomTarget(req.user.id, targetBloomIndex);
    if (!result.ok) {
      return res.status(400).json({ error: result.error });
    }
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: 'setBloomTarget failed', detail: err.message });
  }
});

/**
 * GET /api/zpd/next?path=<curriculumSlug>
 */
router.get('/api/zpd/next', requireAuth, async (req, res) => {
  try {
    // Bloom ceiling from query param (optional) else the user's profile.
    const rawTarget = req.query.targetBloomIndex;
    const target =
      rawTarget != null && typeof rawTarget === 'string' && rawTarget.trim() !== ''
        ? Number(rawTarget)
        : null;
    const next = await nextObjectiveInZPD(req.user.id, req.query.path || null, null, target);
    if (!next) {
      return res.json({
        inZPD: false,
        next: null,
        recommendedStrategy: null,
        targetBloomIndex: target != null ? target : getBloomTarget(req.user.id),
      });
    }
    return res.json({
      inZPD: true,
      next,
      recommendedStrategy: recommendedStrategy(next, {
        targetBloomIndex: target != null ? target : getBloomTarget(req.user.id),
      }),
      targetBloomIndex: target != null ? target : getBloomTarget(req.user.id),
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
    // Mastered (>= thetaHigh) → record persistent completion in users.json.
    // This is the missing writer for the learning-path progress feature
    // (completedObjectives feeds the list/detail progressPercent, the
    // objective checkmarks and the +50 XP reward; completeObjective had no
    // callers since the Sprint-14 writer was dropped as dead code).
    if (m >= ZPD_THRESHOLDS.thetaHigh) {
      completeObjective(req.user.id, objectiveSlug);
    }
    return res.json({ ok: true, data: state });
  } catch (err) {
    return res.status(500).json({ error: 'mastery upsert failed', detail: err.message });
  }
});

export default router;
