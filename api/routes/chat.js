/**
 * Chat-related route handlers — extracted from server.js.
 *
 * Mount in server.js via:
 *   import chatRouter from './routes/chat.js';
 *   app.use('/api', chatRouter);
 *
 * Routes extracted:
 *   GET  /api/session
 *   GET  /api/chat/history
 *   GET  /api/chat/history/search
 *   GET  /api/chat/export/:sessionId
 *   GET  /api/chat/history/:sessionId
 *   GET  /api/auth/learning-profile
 *   POST /api/chat/hint
 *   POST /api/chat/feedback
 *   GET  /api/chat/feedback/analytics
 *   GET  /api/curricula/compare
 *   GET  /api/admin/chat-logs
 *
 * NOTE: POST /api/chat remains in server.js.
 */

import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import pino from 'pino';
import {
  getSessionId,
  getSession,
  sessionStore,
  MAX_MESSAGES_PER_SESSION,
} from '../services/session.js';
import { requireAuth } from '../auth.js';
import { getUserById } from '../auth-db.js';
import { getFallbackData } from '../services/content.js';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  ...(process.env.NODE_ENV !== 'production' && {
    transport: { target: 'pino-pretty', options: { colorize: true } },
  }),
});

const LITELLM_URL = process.env.LITELLM_URL || 'http://litellm-proxy:4000';
const LITELLM_MODEL = process.env.LITELLM_MODEL || 'gemma-4';

const router = Router();

// ── GET /api/session ──────────────────────────────────────────────────────

router.get('/api/session', (req, res) => {
  const sessionId = getSessionId(req, res);
  const session = getSession(sessionId, req.user?.id);

  res.json({
    sessionId,
    messageCount: session.messages.length,
    sessionInfo: {
      createdAt: new Date(session.createdAt).toISOString(),
      lastUsed: new Date(session.lastUsed).toISOString(),
      maxMessages: MAX_MESSAGES_PER_SESSION,
    },
  });
});

// ── GET /api/chat/history — list past sessions for current user ───────────
// Retention: 90 days for free, 1 year for premium

router.get('/api/chat/history', requireAuth, (req, res) => {
  const maxAge = req.user.tier === 'premium' ? 365 * 24 * 60 * 60 * 1000 : 90 * 24 * 60 * 60 * 1000;
  const sessions = sessionStore.findByUserId(req.user.id, maxAge);
  res.json({ sessions });
});

// ── GET /api/chat/history/search?q= — full-text search ───────────────────

router.get('/api/chat/history/search', requireAuth, function (req, res) {
  var q = (req.query.q || '').toLowerCase().trim();
  if (!q) return res.json({ results: [] });

  var userSessions = sessionStore.findByUserId(req.user.id);
  var results = [];

  for (var si = 0; si < userSessions.length; si++) {
    var sid = userSessions[si].sessionId;
    var session = sessionStore.get(sid);
    if (!session || !session.messages) continue;
    var text = session.messages
      .map(function (m) {
        return m.content || '';
      })
      .join(' ')
      .toLowerCase();
    if (text.indexOf(q) !== -1) {
      results.push({
        sessionId: sid,
        createdAt: new Date(session.createdAt).toISOString(),
        snippet: session.messages.slice(0, 2).map(function (m) {
          return (m.content || '').slice(0, 100);
        }),
        messageCount: session.messages.length,
      });
    }
  }

  results.sort(function (a, b) {
    return new Date(b.createdAt) - new Date(a.createdAt);
  });
  res.json({ results: results.slice(0, 10), query: q });
});

// ── GET /api/chat/export/:sessionId — download session as Markdown ───────

router.get('/api/chat/export/:sessionId', requireAuth, function (req, res) {
  var session = sessionStore.get(req.params.sessionId);
  if (!session || session.userId !== req.user.id) {
    return res.status(404).json({ error: 'Session nicht gefunden' });
  }

  var md = '# KI-Assistent Chat-Verlauf\n\n';
  md += '**Datum:** ' + new Date(session.createdAt).toLocaleDateString('de-DE') + '\n';
  md += '**Nachrichten:** ' + session.messages.length + '\n\n';
  md += '---\n\n';

  session.messages.forEach(function (msg) {
    var role = msg.role === 'user' ? '👤 **Du**' : '🤖 **KI-Assistent**';
    md += '### ' + role + '\n\n';
    md += msg.content + '\n\n';
    md += '---\n\n';
  });

  res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
  res.setHeader(
    'Content-Disposition',
    'attachment; filename="chat-' + req.params.sessionId + '.md"'
  );
  res.send(md);
});

// ── GET /api/chat/history/:sessionId — full conversation for a session ───

router.get('/api/chat/history/:sessionId', requireAuth, (req, res) => {
  const session = sessionStore.get(req.params.sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session nicht gefunden' });
  }
  if (session.userId !== req.user.id) {
    return res.status(403).json({ error: 'Kein Zugriff auf diese Session' });
  }
  // Auto-generate title if not set
  if (!session.title && session.messages.length > 0) {
    const firstMsg = session.messages.find((m) => m.role === 'user');
    if (firstMsg) {
      session.title = firstMsg.content.slice(0, 80) + (firstMsg.content.length > 80 ? '...' : '');
      sessionStore._dirty = true;
    }
  }
  res.json({
    sessionId: req.params.sessionId,
    title: session.title || null,
    createdAt: new Date(session.createdAt).toISOString(),
    lastUsed: new Date(session.lastUsed).toISOString(),
    messages: session.messages,
  });
});

// ── GET /api/auth/learning-profile — weak/strong areas from quiz results ──

router.get('/api/auth/learning-profile', requireAuth, (req, res) => {
  var user = getUserById(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  var quizResults = user.quiz_results || [];
  var topicScores = {};

  quizResults.forEach(function (r) {
    if (!topicScores[r.topic]) {
      topicScores[r.topic] = { total: 0, count: 0 };
    }
    topicScores[r.topic].total += r.percentage || 0;
    topicScores[r.topic].count += 1;
  });

  var weakAreas = [];
  var strongAreas = [];
  Object.keys(topicScores).forEach(function (topic) {
    var avg = topicScores[topic].total / topicScores[topic].count;
    if (avg < 60)
      weakAreas.push({
        topic: topic,
        average: Math.round(avg),
        attempts: topicScores[topic].count,
      });
    else if (avg >= 80)
      strongAreas.push({
        topic: topic,
        average: Math.round(avg),
        attempts: topicScores[topic].count,
      });
  });

  res.json({
    weakAreas: weakAreas.sort(function (a, b) {
      return a.average - b.average;
    }),
    strongAreas: strongAreas.sort(function (a, b) {
      return b.average - a.average;
    }),
    totalQuizzes: quizResults.length,
    lastUpdated: user.updated_at || null,
  });
});

// ── POST /api/chat/hint — generate step-by-step hint ─────────────────────

router.post('/api/chat/hint', async (req, res) => {
  var { problem } = req.body;
  if (!problem || typeof problem !== 'string' || problem.length > 2000) {
    return res.status(400).json({ error: 'Problem text required (max 2000 chars)' });
  }

  var weakAreas = '';
  if (req.user?.id) {
    var user = getUserById(req.user.id);
    var quizResults = user?.quiz_results || [];
    var topicScores = {};
    quizResults.forEach(function (r) {
      if (!topicScores[r.topic]) topicScores[r.topic] = { total: 0, count: 0 };
      topicScores[r.topic].total += r.percentage || 0;
      topicScores[r.topic].count += 1;
    });
    weakAreas = Object.keys(topicScores)
      .filter(function (t) {
        return topicScores[t].total / topicScores[t].count < 60;
      })
      .slice(0, 3)
      .join(', ');
  }

  var hintPrompt = 'Du bist ein Chemie-Nachhilfelehrer.';
  if (weakAreas) hintPrompt += ' Der Schüler hat Schwierigkeiten mit: ' + weakAreas + '.';
  hintPrompt +=
    ' Gib einen Schritt-für-Schritt-Hinweis für folgende Aufgabe, aber verrate NICHT die endgültige Antwort: ' +
    problem;

  try {
    var llmRes = await fetch(LITELLM_URL + '/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: LITELLM_MODEL,
        messages: [{ role: 'system', content: hintPrompt }],
        max_tokens: 512,
        temperature: 0.3,
      }),
    });
    if (!llmRes.ok) {
      var errText = await llmRes.text();
      logger.error('[chat-api] Hint LLM error ' + llmRes.status + ': ' + errText);
      return res.status(502).json({ error: 'Hint generation failed' });
    }
    var data = await llmRes.json();
    var hint = data.choices?.[0]?.message?.content || 'Kein Hinweis verfügbar.';
    res.json({ hint: hint });
  } catch (err) {
    logger.error({ err: err.message }, '[chat-api] Hint error');
    res.status(500).json({ error: 'Hint generation failed' });
  }
});

// ── Feedback ─────────────────────────────────────────────────────────────

// POST /api/chat/feedback — store per-message rating (thumb up/down)
router.post('/api/chat/feedback', (req, res) => {
  var { sessionId, messageIndex, rating } = req.body;
  if (!sessionId || messageIndex === undefined || !rating) {
    return res.status(400).json({ error: 'sessionId, messageIndex, rating required' });
  }
  if (rating !== 'up' && rating !== 'down') {
    return res.status(400).json({ error: 'rating must be "up" or "down"' });
  }
  try {
    var feedbackPath = path.join(process.cwd(), 'data', 'feedback.json');
    var feedback = [];
    try {
      feedback = JSON.parse(fs.readFileSync(feedbackPath, 'utf-8'));
    } catch {
      void 0;
    }
    feedback.push({
      sessionId: sessionId,
      messageIndex: parseInt(messageIndex, 10),
      rating: rating,
      userId: req.user?.id || null,
      createdAt: new Date().toISOString(),
    });
    if (feedback.length > 5000) feedback = feedback.slice(-5000);
    var tmp = feedbackPath + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(feedback), 'utf-8');
    fs.renameSync(tmp, feedbackPath);
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err: err, message: err.message || String(err) }, '[feedback] save error');
    res.status(500).json({ error: 'Feedback konnte nicht gespeichert werden' });
  }
});

// GET /api/chat/feedback/analytics — satisfaction summary
router.get('/api/chat/feedback/analytics', (req, res) => {
  try {
    var feedbackPath = path.join(process.cwd(), 'data', 'feedback.json');
    var feedback = [];
    try {
      feedback = JSON.parse(fs.readFileSync(feedbackPath, 'utf-8'));
    } catch {
      void 0;
    }
    var up = 0,
      down = 0;
    for (var fi = 0; fi < feedback.length; fi++) {
      if (feedback[fi].rating === 'up') up++;
      else if (feedback[fi].rating === 'down') down++;
    }
    res.json({
      total: feedback.length,
      up: up,
      down: down,
      satisfactionRate: feedback.length > 0 ? Math.round((up / feedback.length) * 100) : 0,
    });
  } catch (err) {
    logger.error({ err: err, message: err.message || String(err) }, '[feedback] analytics error');
    res.status(500).json({ error: 'Analytics nicht verfügbar' });
  }
});

// ── GET /api/curricula/compare?name=X — Find matching topics across states ─

router.get('/api/curricula/compare', function (req, res) {
  var q = (req.query.name || '').toLowerCase().trim();
  if (!q) {
    return res.json({ results: {}, query: q, count: 0 });
  }

  var fallback = getFallbackData();
  var matches = [];
  var seen = {};

  // Search in fallback curricula
  for (var ci = 0; ci < fallback.curricula.length; ci++) {
    var c = fallback.curricula[ci];
    if (c.name.toLowerCase().indexOf(q) !== -1) {
      var key = c.curriculumMeta.state + '|' + c.name;
      if (!seen[key]) {
        seen[key] = true;
        matches.push({
          name: c.name,
          state: c.curriculumMeta.state,
          grade: c.curriculumMeta.grade,
          school_type: c.curriculumMeta.school_type,
          objective_count: c.curriculumMeta.objective_count,
        });
      }
    }
  }

  // Group by state
  var grouped = {};
  for (var mi = 0; mi < matches.length; mi++) {
    var m = matches[mi];
    if (!grouped[m.state]) grouped[m.state] = [];
    grouped[m.state].push(m);
  }

  res.json({ results: grouped, query: q, count: matches.length });
});

// ── GET /api/admin/chat-logs — Recent chat sessions for klassencockpit ───

router.get('/api/admin/chat-logs', function (req, res) {
  var limit = parseInt(req.query.limit) || 20;
  var sessions = [];
  sessionStore.forEach(function (session, id) {
    var userMsgCount = 0;
    var firstQuestion = '';
    for (var mi = 0; mi < session.messages.length; mi++) {
      var msg = session.messages[mi];
      if (msg.role === 'user') {
        userMsgCount++;
        if (!firstQuestion) firstQuestion = msg.content.slice(0, 120);
      }
    }
    sessions.push({
      sessionId: id,
      messageCount: session.messages.length,
      userMessageCount: userMsgCount,
      firstQuestion: firstQuestion,
      createdAt: session.createdAt,
      lastUsed: session.lastUsed,
    });
  });
  sessions.sort(function (a, b) {
    return new Date(b.lastUsed) - new Date(a.lastUsed);
  });
  sessions = sessions.slice(0, limit);
  res.json({ totalSessions: sessions.length, sessions: sessions });
});

export default router;
