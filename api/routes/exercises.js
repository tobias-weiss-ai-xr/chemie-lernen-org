/**
 * Exercise generator route handlers — extracted from server.js.
 *
 * Routes:
 *   POST /api/exercises/generate
 *   POST /api/exercises/answer
 *   GET  /api/exercises/history
 */

import { Router } from 'express';
import pino from 'pino';
import { requireAuth } from '../auth.js';
import { getNeo4jDriver, NEO4J_DATABASE } from '../services/neo4j.js';
import { sessionStore } from '../services/session.js';
import * as exerciseEngine from '../exercise-engine.js';
import * as learningEngine from '../learning-engine.js';

const router = Router();
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  ...(process.env.NODE_ENV !== 'production' && {
    transport: { target: 'pino-pretty', options: { colorize: true } },
  }),
});

const LITELLM_URL = process.env.LITELLM_URL || 'http://litellm-proxy:4000';
const LITELLM_MODEL = process.env.LITELLM_MODEL || 'gemma-4';

/**
 * POST /api/exercises/generate
 */
router.post('/api/exercises/generate', requireAuth, async (req, res) => {
  try {
    const { learningObjectiveSlug, difficulty = 'medium', type = 'mcq' } = req.body;
    if (!learningObjectiveSlug) {
      return res.status(400).json({ error: 'learningObjectiveSlug ist erforderlich' });
    }
    const validDifficulties = ['easy', 'medium', 'hard'];
    if (!validDifficulties.includes(difficulty)) {
      return res
        .status(400)
        .json({ error: 'Ungültiger Schwierigkeitsgrad. Nutze: easy, medium, hard' });
    }
    const validTypes = ['mcq', 'fill-blank', 'calculation', 'short-answer'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Ungültiger Aufgabentyp' });
    }

    const session = getNeo4jDriver().session({ database: NEO4J_DATABASE });
    let kgContext = '';
    try {
      kgContext = await exerciseEngine.getKGContext(learningObjectiveSlug, session);
    } finally {
      await session.close();
    }

    const exercise = await exerciseEngine.generateExercise(
      learningObjectiveSlug,
      difficulty,
      type,
      LITELLM_URL,
      LITELLM_MODEL,
      kgContext
    );

    // Store in user session
    const userSession = sessionStore.getSession(req.user.id);
    if (!userSession.exercises) userSession.exercises = [];
    userSession.exercises.unshift(exercise);
    if (userSession.exercises.length > 100) userSession.exercises.pop();

    res.json(exercise);
  } catch (err) {
    logger.error('[exercises] generate error:', err.message);
    res.status(500).json({ error: 'Aufgabe konnte nicht generiert werden' });
  }
});

/**
 * POST /api/exercises/answer
 */
router.post('/api/exercises/answer', requireAuth, async (req, res) => {
  try {
    const { exerciseId, answer } = req.body;
    if (!exerciseId || answer === undefined) {
      return res.status(400).json({ error: 'exerciseId und answer sind erforderlich' });
    }

    // Find exercise in session
    const userSession = sessionStore.getSession(req.user.id);
    const exercises = userSession.exercises || [];
    const exercise = exercises.find((e) => e.id === exerciseId);
    if (!exercise) {
      return res.status(404).json({ error: 'Aufgabe nicht gefunden' });
    }

    const result = await exerciseEngine.gradeAnswer(exercise, answer, LITELLM_URL, LITELLM_MODEL);

    // Record result
    exercise.answeredAt = new Date().toISOString();
    exercise.userAnswer = answer;
    exercise.result = result;

    // Award XP
    learningEngine.awardExerciseXp(sessionStore, req.user.id, exerciseId, result.score || 0);
    learningEngine.evaluateBadges(sessionStore, req.user.id);

    res.json(result);
  } catch (err) {
    logger.error('[exercises] answer error:', err.message);
    res.status(500).json({ error: 'Antwort konnte nicht ausgewertet werden' });
  }
});

/**
 * GET /api/exercises/history
 */
router.get('/api/exercises/history', requireAuth, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const userSession = sessionStore.getSession(req.user.id);
    const exercises = (userSession.exercises || []).slice(0, limit);
    res.json({ exercises, total: exercises.length });
  } catch (err) {
    logger.error('[exercises] history error:', err.message);
    res.status(500).json({ error: 'Verlauf konnte nicht geladen werden' });
  }
});

export default router;
