/**
 * Quiz and FSRS (Free Spaced Repetition Scheduler) route handlers
 * — extracted from server.js.
 *
 * Mount in server.js via:
 *   import quizRouter from './routes/quiz.js';
 *   app.use('/api', quizRouter);
 *
 * Routes extracted:
 *   GET  /api/quizzes/:topic
 *   PUT  /api/quiz-results
 *   GET  /api/quiz-results
 *   GET  /api/fsrs/cards
 *   POST /api/fsrs/cards/:cardId/review
 */

import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import pino from 'pino';
import { requireAuth } from '../auth.js';
import { getDueCards, updateFsrsCard, addQuizResult, getQuizResults } from '../auth-db.js';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  ...(process.env.NODE_ENV !== 'production' && {
    transport: { target: 'pino-pretty', options: { colorize: true } },
  }),
});

const router = Router();

// ── Quiz API ───────────────────────────────────────────────────

router.get('/quizzes/:topic', async (req, res) => {
  const topic = req.params.topic.trim();

  try {
    let questions = [];
    try {
      const qPath = path.join(process.cwd(), 'data', 'quiz-questions.json');
      const raw = fs.readFileSync(qPath, 'utf-8');
      const parsed = JSON.parse(raw);
      questions = parsed.questions || [];
    } catch (loadErr) {
      logger.warn('[quiz-api] Failed to load quiz questions:', loadErr.message);
    }

    if (questions.length === 0) {
      return res.status(503).json({ error: 'Quiz questions unavailable' });
    }

    let filtered;
    if (topic === 'alle') {
      filtered = questions.slice();
    } else {
      filtered = questions.filter((q) => q.topic === topic);
      if (filtered.length === 0) {
        return res.status(404).json({ error: 'Topic not found', topic });
      }
    }

    for (let i = filtered.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [filtered[i], filtered[j]] = [filtered[j], filtered[i]];
    }

    const sanitized = filtered.map((q) => {
      const qCopy = Object.assign({}, q);
      delete qCopy.correctIndex;
      delete qCopy.correctIndices;
      delete qCopy.correctAnswer;
      delete qCopy.acceptedAnswers;
      return qCopy;
    });

    res.json({
      topic,
      total: sanitized.length,
      questions: sanitized,
    });
  } catch (err) {
    logger.error('[quiz-api] Error:', err.message);
    res.status(500).json({ error: 'Failed to load quiz questions' });
  }
});

router.put('/quiz-results', async (req, res) => {
  const { topic, score, total, answers, time } = req.body;
  if (!topic || score === undefined || !total) {
    return res.status(400).json({ error: 'Missing required fields: topic, score, total' });
  }

  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;

  const result = {
    topic,
    score,
    total,
    percentage,
    answers: answers || [],
    time: time || 0,
  };

  if (req.user && req.user.id) {
    const saveResult = addQuizResult(req.user.id, result);
    if (!saveResult.ok) {
      logger.warn('[quiz-api] Failed to save result:', saveResult.error);
    }
  }

  res.json({ ok: true, result });
});

router.get('/quiz-results', async (req, res) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ error: 'Authentifizierung erforderlich' });
  }

  try {
    const results = getQuizResults(req.user.id);
    res.json({ results });
  } catch (err) {
    logger.error('[quiz-api] Error loading results:', err.message);
    res.status(500).json({ error: 'Failed to load quiz results' });
  }
});

// ── FSRS (Free Spaced Repetition Scheduler) ─────────────────────

router.get('/fsrs/cards', requireAuth, async (req, res) => {
  try {
    const cards = getDueCards(req.user.id);
    const dueDates = cards
      .filter((c) => c.dueDate)
      .map((c) => c.dueDate)
      .sort();
    const nextDue = dueDates.length > 0 ? dueDates[0] : null;
    res.json({ cards, total: cards.length, nextDue });
  } catch (err) {
    logger.error('[fsrs] Error fetching due cards:', err.message);
    res.status(500).json({ error: 'Failed to fetch due cards' });
  }
});

router.post('/fsrs/cards/:cardId/review', requireAuth, async (req, res) => {
  try {
    const { score } = req.body;
    if (score === undefined || ![0, 0.33, 0.66, 1.0].includes(Number(score))) {
      return res.status(400).json({
        error: 'Invalid score. Must be one of: 0 (Again), 0.33 (Hard), 0.66 (Good), 1.0 (Easy)',
      });
    }

    const result = updateFsrsCard(req.user.id, req.params.cardId, { score: Number(score) });
    if (!result) {
      return res.status(404).json({ error: 'Card not found' });
    }
    res.json({
      ...result,
      nextInterval: result.interval,
      nextDueDate: result.dueDate,
    });
  } catch (err) {
    logger.error('[fsrs] Error reviewing card:', err.message);
    res.status(500).json({ error: 'Failed to review card' });
  }
});

export default router;
