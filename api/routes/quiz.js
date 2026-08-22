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
import {
  getDueCards,
  updateFsrsCard,
  createFsrsCard,
  addQuizResult,
  getQuizResults,
} from '../auth-db.js';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  ...(process.env.NODE_ENV !== 'production' && {
    transport: { target: 'pino-pretty', options: { colorize: true } },
  }),
});

const router = Router();

// ── Quiz API ───────────────────────────────────────────────────

router.get('/api/quizzes/:topic', async (req, res) => {
  const topic = req.params.topic.trim();

  try {
    let questions = [];
    try {
      const qPath = path.join(process.cwd(), 'data', 'quiz-questions.json');
      const raw = fs.readFileSync(qPath, 'utf-8');
      const parsed = JSON.parse(raw);
      questions = parsed.questions || [];
    } catch (loadErr) {
      logger.warn(
        { err: loadErr, message: loadErr.message || String(loadErr) },
        '[quiz-api] Failed to load quiz questions'
      );
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
    logger.error({ err: err, message: err.message || String(err) }, '[quiz-api] Error');
    res.status(500).json({ error: 'Failed to load quiz questions' });
  }
});

router.put('/api/quiz-results', async (req, res) => {
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
      logger.warn({ err: saveResult.error, message: '[quiz-api] Failed to save result' });
    }

    // ── Evidence-based loop: wrong answers → FSRS flashcards ──
    // Research (1,732 papers): spaced repetition + testing effect
    // boost retention by up to 40%. Wrong quiz answers become cards
    // that are re-visited at increasing intervals (day 3/7/14/30).
    let cardsCreated = 0;
    const wrongAnswers = (answers || [])
      .filter((a) => a && a.question && a.correct === false)
      // Bound per-submission work: an attacker-controlled payload of
      // thousands of wrong answers would otherwise balloon the user's
      // fsrsCards array (and with it users.json, rewritten on save).
      .slice(0, 30);
    for (const wa of wrongAnswers) {
      const q = wa.question;
      let answerText = '';
      if (q.correctAnswer) {
        answerText = String(q.correctAnswer);
      } else if (Array.isArray(q.correctIndices)) {
        answerText = (q.correctIndices || [])
          .map((idx) => (q.options || [])[idx])
          .filter(Boolean)
          .join(', ');
      } else if (q.correctIndex !== undefined && q.options) {
        answerText = q.options[q.correctIndex] || '';
      }
      if (q.explanation) {
        answerText = answerText ? answerText + ' — ' + q.explanation : q.explanation;
      }
      if (answerText) {
        createFsrsCard(req.user.id, {
          topicId: String(q.id || topic).slice(0, 120),
          question: String(q.question || '').slice(0, 500),
          answer: String(answerText).slice(0, 500),
          type: q.type || 'multiple-choice',
        });
        cardsCreated++;
      }
    }
    if (cardsCreated > 0) {
      logger.info(
        { userId: req.user.id, cardsCreated, topic },
        '[quiz-api] Auto-created FSRS cards from wrong answers'
      );
    }
  }

  res.json({ ok: true, result });
});

router.get('/api/quiz-results', async (req, res) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ error: 'Authentifizierung erforderlich' });
  }

  try {
    const results = getQuizResults(req.user.id);
    res.json({ results });
  } catch (err) {
    logger.error(
      { err: err, message: err.message || String(err) },
      '[quiz-api] Error loading results'
    );
    res.status(500).json({ error: 'Failed to load quiz results' });
  }
});

// ── FSRS (Free Spaced Repetition Scheduler) ─────────────────────

router.get('/api/fsrs/cards', requireAuth, async (req, res) => {
  try {
    const cards = getDueCards(req.user.id);
    const dueDates = cards
      .filter((c) => c.dueDate)
      .map((c) => c.dueDate)
      .sort();
    const nextDue = dueDates.length > 0 ? dueDates[0] : null;
    res.json({ cards, total: cards.length, nextDue });
  } catch (err) {
    logger.error(
      { err: err, message: err.message || String(err) },
      '[fsrs] Error fetching due cards'
    );
    res.status(500).json({ error: 'Failed to fetch due cards' });
  }
});

// ── FSRS card creation ──────────────────────────────

router.post('/api/fsrs/cards', requireAuth, async (req, res) => {
  try {
    const { topicId, question, answer, type } = req.body;
    if (!question || !answer) {
      return res.status(400).json({ error: 'Missing required fields: question, answer' });
    }
    const card = createFsrsCard(req.user.id, {
      topicId: topicId || 'general',
      question,
      answer,
      type: type || 'flashcard',
    });
    if (!card) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(201).json({ card });
  } catch (err) {
    logger.error({ err: err, message: err.message || String(err) }, '[fsrs] Error creating card');
    res.status(500).json({ error: 'Failed to create card' });
  }
});

router.post('/api/fsrs/cards/:cardId/review', requireAuth, async (req, res) => {
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
    logger.error({ err: err, message: err.message || String(err) }, '[fsrs] Error reviewing card');
    res.status(500).json({ error: 'Failed to review card' });
  }
});

export default router;
