/**
 * Collaboration route handlers — extracted from server.js.
 *
 * Routes:
 *   POST  /api/collab/sessions
 *   GET   /api/collab/sessions
 *   GET   /api/collab/sessions/:id
 *   POST  /api/collab/sessions/:id/join
 *   POST  /api/collab/sessions/:id/leave
 *   GET   /api/collab/sessions/:id/messages
 *   POST  /api/collab/sessions/:id/messages
 *   GET   /api/collab/sessions/:id/exercises
 *   POST  /api/collab/sessions/:id/exercises
 *   POST  /api/collab/sessions/:sessionId/exercises/:exerciseId/complete
 */

import { Router } from 'express';
import pino from 'pino';
import { requireAuth } from '../auth.js';
import * as collabEngine from '../collab-engine.js';

const router = Router();
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  ...(process.env.NODE_ENV !== 'production' && {
    transport: { target: 'pino-pretty', options: { colorize: true } },
  }),
});

router.post('/api/collab/sessions', requireAuth, async (req, res) => {
  try {
    const { name, topic } = req.body;
    const result = collabEngine.createSession(
      name,
      topic,
      req.user.id,
      req.user.displayName || req.user.email
    );
    res.status(201).json(result);
  } catch (err) {
    logger.error({ err: err, message: err.message || String(err) }, '[collab] create error');
    res.status(500).json({ error: 'Sitzung konnte nicht erstellt werden' });
  }
});

router.get('/api/collab/sessions', requireAuth, async (req, res) => {
  try {
    const list = collabEngine.listActiveSessions();
    res.json({ sessions: list });
  } catch (err) {
    logger.error({ err: err, message: err.message || String(err) }, '[collab] list error');
    res.status(500).json({ error: 'Sitzungen konnten nicht geladen werden' });
  }
});

router.get('/api/collab/sessions/:id', requireAuth, async (req, res) => {
  try {
    const session = collabEngine.getSession(req.params.id);
    if (!session) return res.status(404).json({ error: 'Sitzung nicht gefunden' });
    const participants = collabEngine.getParticipants(req.params.id);
    res.json({ ...session, participants });
  } catch (err) {
    logger.error({ err: err, message: err.message || String(err) }, '[collab] get error');
    res.status(500).json({ error: 'Sitzung konnte nicht geladen werden' });
  }
});

router.post('/api/collab/sessions/:id/join', requireAuth, async (req, res) => {
  try {
    const result = collabEngine.joinSession(
      req.params.id,
      req.user.id,
      req.user.displayName || req.user.email
    );
    if (result.error) return res.status(400).json(result);
    res.json(result);
  } catch (err) {
    logger.error({ err: err, message: err.message || String(err) }, '[collab] join error');
    res.status(500).json({ error: 'Beitritt fehlgeschlagen' });
  }
});

router.post('/api/collab/sessions/:id/leave', requireAuth, async (req, res) => {
  try {
    const result = collabEngine.leaveSession(req.params.id, req.user.id);
    if (result.error) return res.status(400).json(result);
    res.json(result);
  } catch (err) {
    logger.error({ err: err, message: err.message || String(err) }, '[collab] leave error');
    res.status(500).json({ error: 'Austritt fehlgeschlagen' });
  }
});

router.get('/api/collab/sessions/:id/messages', requireAuth, async (req, res) => {
  try {
    const since = req.query.since;
    const messages = collabEngine.getMessages(req.params.id, since);
    res.json({ messages });
  } catch (err) {
    logger.error({ err: err, message: err.message || String(err) }, '[collab] messages error');
    res.status(500).json({ error: 'Nachrichten konnten nicht geladen werden' });
  }
});

router.post('/api/collab/sessions/:id/messages', requireAuth, async (req, res) => {
  try {
    const { text } = req.body;
    const result = collabEngine.sendMessage(
      req.params.id,
      req.user.id,
      req.user.displayName || req.user.email,
      text
    );
    if (result.error) return res.status(400).json(result);
    res.status(201).json(result);
  } catch (err) {
    logger.error({ err: err, message: err.message || String(err) }, '[collab] send error');
    res.status(500).json({ error: 'Nachricht konnte nicht gesendet werden' });
  }
});

router.get('/api/collab/sessions/:id/exercises', requireAuth, async (req, res) => {
  try {
    const exercises = collabEngine.getSharedExercises(req.params.id);
    res.json({ exercises });
  } catch (err) {
    logger.error({ err: err, message: err.message || String(err) }, '[collab] exercises error');
    res.status(500).json({ error: 'Aufgaben konnten nicht geladen werden' });
  }
});

router.post('/api/collab/sessions/:id/exercises', requireAuth, async (req, res) => {
  try {
    const { exercise } = req.body;
    if (!exercise) return res.status(400).json({ error: 'Aufgabe ist erforderlich' });
    const result = collabEngine.shareExercise(req.params.id, req.user.id, exercise);
    if (result.error) return res.status(400).json(result);
    res.status(201).json(result);
  } catch (err) {
    logger.error(
      { err: err, message: err.message || String(err) },
      '[collab] share exercise error'
    );
    res.status(500).json({ error: 'Aufgabe konnte nicht geteilt werden' });
  }
});

router.post(
  '/api/collab/sessions/:sessionId/exercises/:exerciseId/complete',
  requireAuth,
  async (req, res) => {
    try {
      const result = collabEngine.markExerciseCompleted(
        req.params.sessionId,
        req.params.exerciseId,
        req.user.id,
        req.user.displayName || req.user.email
      );
      if (result.error) return res.status(400).json(result);
      res.json(result);
    } catch (err) {
      logger.error(
        { err: err, message: err.message || String(err) },
        '[collab] complete exercise error'
      );
      res.status(500).json({ error: 'Aufgabe konnte nicht als erledigt markiert werden' });
    }
  }
);

export default router;
