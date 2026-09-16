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
import {
  findPeerCandidates,
  getBloomTarget,
  curricularDistanceMetric,
} from '../services/zpd-engine.js';
import { getAllUsers } from '../auth-db.js';

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

// ── Quiz Challenges (social learning) ─────────────────────────

router.get('/api/collab/sessions/:id/challenges', requireAuth, async (req, res) => {
  try {
    const challenges = collabEngine.getChallenges(req.params.id);
    res.json({ challenges });
  } catch (err) {
    logger.error({ err: err, message: err.message || String(err) }, '[collab] challenges error');
    res.status(500).json({ error: 'Challenges konnten nicht geladen werden' });
  }
});

router.post('/api/collab/sessions/:id/challenges', requireAuth, async (req, res) => {
  try {
    const { topic, score, total, percentage, note } = req.body;
    if (score === undefined || !total) {
      return res.status(400).json({ error: 'score und total sind erforderlich' });
    }
    const result = collabEngine.postQuizChallenge(req.params.id, req.user.id, {
      topic: topic || 'Quiz',
      score: Number(score),
      total: Number(total),
      percentage: percentage !== undefined ? Number(percentage) : Math.round((score / total) * 100),
      note: note || '',
    });
    if (result.error) return res.status(400).json(result);
    res.status(201).json(result);
  } catch (err) {
    logger.error(
      { err: err, message: err.message || String(err) },
      '[collab] post challenge error'
    );
    res.status(500).json({ error: 'Challenge konnte nicht gepostet werden' });
  }
});

router.post(
  '/api/collab/sessions/:id/challenges/:challengeId/reactions',
  requireAuth,
  async (req, res) => {
    try {
      const { emoji } = req.body;
      if (!emoji) return res.status(400).json({ error: 'emoji ist erforderlich' });
      const result = collabEngine.reactToChallenge(
        req.params.id,
        req.params.challengeId,
        req.user.id,
        String(emoji)
      );
      if (result.error) return res.status(400).json(result);
      res.json(result);
    } catch (err) {
      logger.error(
        { err: err, message: err.message || String(err) },
        '[collab] challenge reaction error'
      );
      res.status(500).json({ error: 'Reaktion konnte nicht gespeichert werden' });
    }
  }
);

// ── ZPD peer matching (peer-collaboration PC-1..PC-5) ─────────

function buildNameMap() {
  const map = new Map();
  try {
    for (const u of getAllUsers()) {
      map.set(String(u.id), u.name || u.email || null);
    }
  } catch {
    /* non-fatal: leave names null */
  }
  return map;
}

/** Enrich candidate records with resolvable display names. */
function enrichCandidates(candidates, nameMap) {
  return candidates.map((c) => ({
    ...c,
    displayName: c.displayName || nameMap.get(String(c.userId)) || null,
  }));
}

// POST /api/collab/sessions/zpd-match — find ZPD-overlapping peers, optionally
// creating a collaboration session pre-populated with ZPD context (PC-3).
router.post('/api/collab/sessions/zpd-match', requireAuth, async (req, res) => {
  try {
    const { pathSlug, createSession = false, maxCandidates = 5, name, topic } = req.body || {};
    const userId = req.user.id;

    const { myNext, candidates: rawCandidates } = await findPeerCandidates(userId, pathSlug, {
      maxCandidates,
    });
    const nameMap = buildNameMap();
    const candidates = enrichCandidates(rawCandidates, nameMap);

    let session = null;
    if (createSession && myNext && candidates.length > 0) {
      const top = candidates[0];
      const zpdContext = {
        sharedObjective: top.objectiveSlug,
        bloomLevel: top.bloom,
        mkoDirection: top.mkoDirection,
        curricularDistance: curricularDistanceMetric(pathSlug ? 'same-topic' : 'cross-topic'),
      };
      // Create a session with the requesting learner as creator, then invite the
      // top peer. The session object carries the ZPD rationale for the UI.
      session = collabEngine.createSession(
        name || 'ZPD-Lerngruppe',
        topic || `Gemeinsames Lernen bei ${myNext.slug || ''}`,
        userId,
        req.user.displayName || req.user.email
      );
      collabEngine.joinSession(session.id, top.userId, top.displayName || 'Peer');
      session.zpdContext = zpdContext;
    }

    res.json({
      myNext,
      candidates,
      session,
    });
  } catch (err) {
    logger.error({ err: err, message: err.message || String(err) }, '[collab] zpd-match error');
    res.status(500).json({ error: 'ZPD-Peers konnten nicht ermittelt werden' });
  }
});

// GET /api/collab/peer-status — current user's peer collab context (PC-4).
router.get('/api/collab/peer-status', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { myNext, candidates } = await findPeerCandidates(userId, null, {
      maxCandidates: 20,
    });

    // Determine whether the user is already part of an active collab session.
    let hasActiveSession = false;
    let currentSession = null;
    try {
      const sessions = collabEngine.listActiveSessions();
      // listActiveSessions returns sanitised records without participant ids, so
      // we conservatively check creator membership as the available active flag.
      const creators = sessions.filter((s) => s.creatorId === userId);
      if (creators.length > 0) {
        hasActiveSession = true;
        currentSession = { id: creators[0].id, participantCount: creators[0].participantCount };
      }
    } catch {
      /* non-fatal */
    }

    res.json({
      hasActiveSession,
      currentSession,
      myNext,
      candidateCount: candidates.length,
      bloomTarget: getBloomTarget(userId).targetBloomIndex,
    });
  } catch (err) {
    logger.error({ err: err, message: err.message || String(err) }, '[collab] peer-status error');
    res.status(500).json({ error: 'Peer-Status konnte nicht geladen werden' });
  }
});

export default router;
