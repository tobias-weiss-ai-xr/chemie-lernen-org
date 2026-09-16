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
  countObjectiveStates,
  ZPD_THRESHOLDS,
  bloomIndex,
} from '../services/zpd-engine.js';
import { completeObjective, getFsrsCards, getQuizResults } from '../auth-db.js';
import { aggregateMastery, mapTopicToObjectives } from '../services/mastery-aggregator.js';
import { getBloomTarget, setBloomTarget } from '../services/bloom-target.js';

const router = Router();

/**
 * Parse an optional theta query param, clamp to [0.1, 0.95], fall back to the
 * given default when absent/invalid. Returns a number.
 */
function parseTheta(raw, fallback) {
  if (raw == null || raw === '') return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0 || n >= 1) return fallback;
  return Math.min(0.95, Math.max(0.1, n));
}

/**
 * Build a thresholds object from optional query params.
 * thetaHigh defaults to 0.8, thetaLow to 0.6; clamps ensure high >= low.
 */
function resolveThresholds(query = {}) {
  const thetaHigh = parseTheta(query.thetaHigh, ZPD_THRESHOLDS.thetaHigh);
  const thetaLow = parseTheta(query.thetaLow, ZPD_THRESHOLDS.thetaLow);
  return {
    thetaHigh: Math.max(thetaHigh, thetaLow),
    thetaLow: Math.min(thetaHigh, thetaLow),
  };
}

// Per-session cold-start guard: userId -> timestamp (ms). Runs at most once per
// server process per userId (formative-assessment 2.3). TTL 10 minutes.
const coldStartRanAt = new Map();
const COLD_START_TTL_MS = 10 * 60 * 1000;

/**
 * Seed :ObjectiveState records from historical signals the first time a user
 * hits /api/zpd/next with zero objective states. Idempotent + guarded.
 * Failures are logged and swallowed — cold-start must never break the request.
 */
async function ensureColdStart(userId) {
  const now = Date.now();
  const last = coldStartRanAt.get(userId);
  if (last != null && now - last < COLD_START_TTL_MS) return;

  try {
    const states = await countObjectiveStates(userId);
    if (states > 0) return; // already has evidence -> nothing to seed

    // First contact with zero states: record we are seeding now so this runs
    // at most once per process+userId within the TTL (formative 2.3).
    coldStartRanAt.set(userId, now);

    const quizResults = getQuizResults(userId) || [];
    const fsrsCards = getFsrsCards(userId) || [];

    // Group quiz rows by topic, remember distinct topics for LO mapping.
    const topics = new Set();
    for (const q of quizResults) {
      if (q && q.topic) topics.add(q.topic);
    }
    for (const c of fsrsCards) {
      if (c && c.topicId) topics.add(c.topicId);
    }

    // Resolve each distinct topic once to its LO slugs (2.4 batching: one query
    // per topic instead of per quiz row).
    const topicSlugs = new Map(); // topic -> slug[]
    await Promise.all(
      [...topics].map(async (t) => {
        topicSlugs.set(t, await mapTopicToObjectives(t));
      })
    );

    let upserts = 0;
    for (const [, slugs] of topicSlugs) {
      for (const slug of slugs) {
        const mastery = aggregateMastery(userId, slug, {
          quizResults,
          fsrsCards,
          gradedAnswers: [],
        });
        if (mastery && mastery.mastery != null) {
          await upsertObjectiveState(userId, slug, {
            mastery: mastery.mastery,
            source: 'cold-start',
          });
          upserts += 1;
        }
      }
    }
    if (upserts > 0) {
      console.debug(`[zpd] cold-start seeded ${upserts} objective states for user ${userId}`);
    }
  } catch (err) {
    console.error(`[zpd] cold-start failed for user ${userId}:`, err.message);
  }
}

/**
 * GET /api/zpd/thresholds
 * Public: returns the current mastery thresholds (no auth).
 */
router.get('/api/zpd/thresholds', async (req, res) => {
  return res.json({
    thetaHigh: ZPD_THRESHOLDS.thetaHigh,
    thetaLow: ZPD_THRESHOLDS.thetaLow,
  });
});

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
    const thresholds = resolveThresholds(req.query);
    const effectiveTarget = target != null ? target : getBloomTarget(req.user.id);
    // 2.1/2.2: seed ObjectiveState from historical signals on first contact.
    await ensureColdStart(req.user.id);
    const next = await nextObjectiveInZPD(req.user.id, req.query.path || null, thresholds, target);
    if (!next) {
      return res.json({
        inZPD: false,
        next: null,
        recommendedStrategy: null,
        targetBloomIndex: effectiveTarget,
        thresholds,
      });
    }
    return res.json({
      inZPD: true,
      next,
      recommendedStrategy: recommendedStrategy(next, {
        targetBloomIndex: effectiveTarget,
      }),
      targetBloomIndex: effectiveTarget,
      thresholds,
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
