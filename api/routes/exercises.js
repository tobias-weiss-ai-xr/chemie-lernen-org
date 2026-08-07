/**
 * Exercise generator route handlers — enhanced with grade, feedback, and assessment endpoints.
 *
 * Routes:
 *   POST /api/exercises/generate
 *   POST /api/exercises/grade
 *   POST /api/exercises/answer       (legacy, delegates to grade internally)
 *   POST /api/exercises/feedback
 *   GET  /api/exercises/history
 *   GET  /api/assessment/results
 *   GET  /api/assessment/class-results
 *   PUT  /api/assessment/feedback/:feedbackId
 *   DELETE /api/assessment/user/:userId
 */

import { Router } from 'express';
import pino from 'pino';
import { requireAuth } from '../auth.js';
import { sessionStore } from '../services/session.js';
import * as exerciseEngine from '../exercise-engine.js';
import * as learningEngine from '../learning-engine.js';
import { generateExercise, getLearningObjectivesForTopic } from '../services/exercise-generator.js';
import { gradeExercise } from '../services/auto-grader.js';
import { generateFeedback } from '../services/feedback-engine.js';
import {
  getLearnerResults,
  getClassResults,
  getStudentList,
  teacherOverrideFeedback,
  batchSync,
  deleteUserAssessmentData,
} from '../assessment-store.js';

const router = Router();
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  ...(process.env.NODE_ENV !== 'production' && {
    transport: { target: 'pino-pretty', options: { colorize: true } },
  }),
});

const LITELLM_URL = process.env.LITELLM_URL || 'http://litellm-proxy:4000';
const LITELLM_MODEL = process.env.LITELLM_MODEL || 'gemma-4';

// ── In-memory rate limiter ────────────────────────────────────────────
// Simple per-user rate limiter for grade/feedback endpoints

const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 60; // 60 requests per minute

function checkRateLimit(userId) {
  const now = Date.now();
  const entry = rateLimitMap.get(userId) || { count: 0, windowStart: now };

  if (now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    entry.count = 0;
    entry.windowStart = now;
  }

  entry.count++;
  rateLimitMap.set(userId, entry);

  // Cleanup old entries every 100 requests
  if (rateLimitMap.size > 1000) {
    const cutoff = now - RATE_LIMIT_WINDOW_MS;
    for (const [key, val] of rateLimitMap) {
      if (val.windowStart < cutoff) rateLimitMap.delete(key);
    }
  }

  return entry.count <= RATE_LIMIT_MAX;
}

// ── POST /api/exercises/generate ──────────────────────────────────────

router.post('/api/exercises/generate', requireAuth, async (req, res) => {
  try {
    const {
      learningObjectiveSlug,
      topicSlug,
      difficulty = 'medium',
      type = 'mcq',
      includeFsrsContext,
      bypassCache,
    } = req.body;

    // Resolve learning objectives from topic slug if needed
    let effectiveSlug = learningObjectiveSlug;
    if (!effectiveSlug && topicSlug) {
      const los = await getLearningObjectivesForTopic(topicSlug);
      if (los.length > 0) {
        // Pick a random learning objective (FSRS-weighted if context available)
        const randomIndex = Math.floor(Math.random() * los.length);
        effectiveSlug = los[randomIndex].slug;
      } else {
        effectiveSlug = topicSlug;
      }
    }

    if (!effectiveSlug) {
      return res
        .status(400)
        .json({ error: 'learningObjectiveSlug oder topicSlug ist erforderlich' });
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

    // Get FSRS context if requested
    let fsrsContext = null;
    if (includeFsrsContext) {
      const userSession = sessionStore.getSession(req.user.id);
      fsrsContext = userSession?.fsrs?.[effectiveSlug] || userSession?.fsrs?.global || null;
    }

    const exercise = await generateExercise({
      learningObjectiveSlug: effectiveSlug,
      difficulty,
      type,
      litellmUrl: LITELLM_URL,
      litellmModel: LITELLM_MODEL,
      fsrsContext,
      bypassCache,
    });

    // Store in user session
    const userSession = sessionStore.getSession(req.user.id);
    if (!userSession.exercises) userSession.exercises = [];
    userSession.exercises.unshift(exercise);
    if (userSession.exercises.length > 100) userSession.exercises.pop();

    res.json(exercise);
  } catch (err) {
    logger.error({ err: err, message: err.message || String(err) }, '[exercises] generate error');
    res.status(500).json({ error: 'Aufgabe konnte nicht generiert werden' });
  }
});

// ── POST /api/exercises/grade ─────────────────────────────────────────

router.post('/api/exercises/grade', requireAuth, async (req, res) => {
  try {
    const { exerciseId, answer } = req.body;
    if (!exerciseId || answer === undefined) {
      return res.status(400).json({ error: 'exerciseId und answer sind erforderlich' });
    }

    // Rate limit check
    if (!checkRateLimit(req.user.id)) {
      return res.status(429).json({ error: 'rate_limit_exceeded', retryAfter: 60 });
    }

    // Find exercise in session
    const userSession = sessionStore.getSession(req.user.id);
    const exercises = userSession.exercises || [];
    const exercise = exercises.find((e) => e.id === exerciseId);
    if (!exercise) {
      return res.status(404).json({ error: 'Aufgabe nicht gefunden' });
    }

    // Grade using auto-grader
    const gradeResult = await gradeExercise(exercise, answer, {
      litellm: { url: LITELLM_URL, model: LITELLM_MODEL },
    });

    // Record result
    exercise.answeredAt = new Date().toISOString();
    exercise.userAnswer = answer;
    exercise.gradeResult = gradeResult;

    // Award XP
    learningEngine.awardExerciseXp(sessionStore, req.user.id, exerciseId, gradeResult.score || 0);
    learningEngine.evaluateBadges(sessionStore, req.user.id);

    res.json(gradeResult);
  } catch (err) {
    logger.error({ err: err, message: err.message || String(err) }, '[exercises] grade error');
    res.status(500).json({ error: 'Antwort konnte nicht bewertet werden' });
  }
});

// ── POST /api/exercises/answer (legacy, delegates to grade) ──────────

router.post('/api/exercises/answer', requireAuth, async (req, res) => {
  try {
    const { exerciseId, answer } = req.body;
    if (!exerciseId || answer === undefined) {
      return res.status(400).json({ error: 'exerciseId und answer sind erforderlich' });
    }

    // Rate limit check
    if (!checkRateLimit(req.user.id)) {
      return res.status(429).json({ error: 'rate_limit_exceeded', retryAfter: 60 });
    }

    const userSession = sessionStore.getSession(req.user.id);
    const exercises = userSession.exercises || [];
    const exercise = exercises.find((e) => e.id === exerciseId);
    if (!exercise) {
      return res.status(404).json({ error: 'Aufgabe nicht gefunden' });
    }

    // Use legacy grading from exercise-engine first, then enrich with auto-grader
    const result = await exerciseEngine.gradeAnswer(exercise, answer, LITELLM_URL, LITELLM_MODEL);

    exercise.answeredAt = new Date().toISOString();
    exercise.userAnswer = answer;
    exercise.result = result;

    learningEngine.awardExerciseXp(sessionStore, req.user.id, exerciseId, result.score || 0);
    learningEngine.evaluateBadges(sessionStore, req.user.id);

    res.json(result);
  } catch (err) {
    logger.error({ err: err, message: err.message || String(err) }, '[exercises] answer error');
    res.status(500).json({ error: 'Antwort konnte nicht ausgewertet werden' });
  }
});

// ── POST /api/exercises/feedback ──────────────────────────────────────

router.post('/api/exercises/feedback', requireAuth, async (req, res) => {
  try {
    const { exerciseId, answer, gradeResult, studentLevel } = req.body;
    if (!exerciseId || answer === undefined || !gradeResult) {
      return res
        .status(400)
        .json({ error: 'exerciseId, answer und gradeResult sind erforderlich' });
    }

    // Find exercise in session
    const userSession = sessionStore.getSession(req.user.id);
    const exercises = userSession.exercises || [];
    const exercise = exercises.find((e) => e.id === exerciseId);
    if (!exercise) {
      return res.status(404).json({ error: 'Aufgabe nicht gefunden' });
    }

    // Get FSRS context for study recommendation
    const fsrsContext = userSession?.fsrs?.[exercise.learningObjective?.slug || ''] || null;

    const feedback = await generateFeedback({
      exercise,
      userAnswer: answer,
      gradeResult,
      fsrsContext,
      studentLevel: studentLevel || 'mittel',
    });

    res.json({ feedback });
  } catch (err) {
    logger.error({ err: err, message: err.message || String(err) }, '[exercises] feedback error');
    res.status(500).json({ error: 'Feedback konnte nicht generiert werden' });
  }
});

// ── GET /api/exercises/history ────────────────────────────────────────

router.get('/api/exercises/history', requireAuth, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const userSession = sessionStore.getSession(req.user.id);
    const exercises = (userSession.exercises || []).slice(0, limit);
    res.json({ exercises, total: exercises.length });
  } catch (err) {
    logger.error({ err: err, message: err.message || String(err) }, '[exercises] history error');
    res.status(500).json({ error: 'Verlauf konnte nicht geladen werden' });
  }
});

// ── GET /api/assessment/results ───────────────────────────────────────

router.get('/api/assessment/results', requireAuth, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = parseInt(req.query.offset) || 0;
    const userId = req.query.learnerId || req.user.id;

    const results = await getLearnerResults(userId, limit, offset);
    res.json(results);
  } catch (err) {
    logger.error({ err: err, message: err.message || String(err) }, '[assessment] results error');
    res.status(500).json({ error: 'Ergebnisse konnten nicht geladen werden' });
  }
});

// ── GET /api/assessment/class-results ─────────────────────────────────

router.get('/api/assessment/class-results', requireAuth, async (req, res) => {
  try {
    const curriculumSlug = req.query.curriculumSlug;
    if (!curriculumSlug) {
      return res.status(400).json({ error: 'curriculumSlug ist erforderlich' });
    }

    const topicBreakdown = await getClassResults(curriculumSlug);
    const students = await getStudentList(curriculumSlug);

    res.json({ ...topicBreakdown, students });
  } catch (err) {
    logger.error(
      { err: err, message: err.message || String(err) },
      '[assessment] class-results error'
    );
    res.status(500).json({ error: 'Klassenergebnisse konnten nicht geladen werden' });
  }
});

// ── PUT /api/assessment/feedback/:feedbackId ──────────────────────────

router.put('/api/assessment/feedback/:feedbackId', requireAuth, async (req, res) => {
  try {
    const { feedbackId } = req.params;
    const { teacherNote } = req.body;

    if (!teacherNote) {
      return res.status(400).json({ error: 'teacherNote ist erforderlich' });
    }

    const updated = await teacherOverrideFeedback(feedbackId, teacherNote);
    if (!updated) {
      return res.status(404).json({ error: 'Feedback nicht gefunden' });
    }

    res.json({ feedback: updated });
  } catch (err) {
    logger.error(
      { err: err, message: err.message || String(err) },
      '[assessment] feedback override error'
    );
    res.status(500).json({ error: 'Feedback konnte nicht aktualisiert werden' });
  }
});

// ── POST /api/assessment/sync (batch sync from offline) ──────────────

router.post('/api/assessment/sync', requireAuth, async (req, res) => {
  try {
    const { batch } = req.body;
    if (!Array.isArray(batch) || batch.length === 0) {
      return res.status(400).json({ error: 'batch muss ein nicht-leeres Array sein' });
    }

    const result = await batchSync(batch);
    res.json(result);
  } catch (err) {
    logger.error({ err: err, message: err.message || String(err) }, '[assessment] sync error');
    res.status(500).json({ error: 'Synchronisation fehlgeschlagen' });
  }
});

// ── DELETE /api/assessment/user/:userId (GDPR) ────────────────────────

router.delete('/api/assessment/user/:userId', requireAuth, async (req, res) => {
  try {
    const { userId } = req.params;

    // Only allow deleting own data or teacher/admin role
    if (userId !== req.user.id && req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Nicht berechtigt, diese Daten zu löschen' });
    }

    const result = await deleteUserAssessmentData(userId);
    res.json({ message: 'Assessment-Daten gelöscht', ...result });
  } catch (err) {
    logger.error({ err: err, message: err.message || String(err) }, '[assessment] delete error');
    res.status(500).json({ error: 'Löschen fehlgeschlagen' });
  }
});

export default router;
