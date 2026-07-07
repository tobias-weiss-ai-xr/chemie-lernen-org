/**
 * collab-engine.js — Collaborative learning session manager
 * for chemie-lernen.org
 *
 * Manages study groups / collaborative sessions where users can
 * share exercises, chat, and learn together in real time via
 * in-memory + file-backed storage.
 */
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const COLLAB_DIR = path.resolve('data/collab');
const MAX_PARTICIPANTS = 20;
const MAX_MESSAGES = 200;
const MAX_EXERCISES = 50;
const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24h

// In-memory sessions map
const sessions = new Map();

// ── File persistence ────────────────────────────────────────

function ensureDir() {
  if (!fs.existsSync(COLLAB_DIR)) {
    fs.mkdirSync(COLLAB_DIR, { recursive: true });
  }
}

function sessionFilePath(id) {
  return path.join(COLLAB_DIR, `${id}.json`);
}

function saveToDisk(id) {
  try {
    ensureDir();
    const data = sessions.get(id);
    if (!data) return;
    fs.writeFileSync(sessionFilePath(id), JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('[collab] save error:', err.message);
  }
}

function loadFromDisk(id) {
  try {
    const fp = sessionFilePath(id);
    if (!fs.existsSync(fp)) return null;
    const raw = fs.readFileSync(fp, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// ── Session helpers ─────────────────────────────────────────

function generateId() {
  return crypto.randomBytes(12).toString('hex');
}

function isExpired(session) {
  return Date.now() - session.createdAt > SESSION_TTL_MS;
}

function loadSession(id) {
  const cached = sessions.get(id);
  if (cached) {
    if (isExpired(cached)) {
      sessions.delete(id);
      return null;
    }
    return cached;
  }
  const fromDisk = loadFromDisk(id);
  if (fromDisk) {
    if (isExpired(fromDisk)) return null;
    sessions.set(id, fromDisk);
    return fromDisk;
  }
  return null;
}

// ── Core API ────────────────────────────────────────────────

export function createSession(name, topic, creatorId, creatorName) {
  const id = generateId();
  const now = Date.now();
  const session = {
    id,
    name: name || 'Lerngruppe',
    topic: topic || '',
    createdAt: now,
    lastActivity: now,
    creatorId,
    participants: [{ userId: creatorId, displayName: creatorName || 'Benutzer', joinedAt: now }],
    messages: [],
    sharedExercises: [],
    settings: {
      maxParticipants: MAX_PARTICIPANTS,
      allowAnonymous: false,
    },
  };
  sessions.set(id, session);
  saveToDisk(id);
  return sanitize(session);
}

export function getSession(id) {
  const session = loadSession(id);
  if (!session) return null;
  return sanitize(session);
}

export function listActiveSessions() {
  const all = [];
  for (const [, s] of sessions) {
    if (!isExpired(s)) all.push(sanitize(s));
  }
  // Also scan disk for sessions not in memory
  try {
    ensureDir();
    const files = fs.readdirSync(COLLAB_DIR);
    for (const f of files) {
      if (!f.endsWith('.json')) continue;
      const sid = f.replace('.json', '');
      if (!sessions.has(sid)) {
        const fromDisk = loadFromDisk(sid);
        if (fromDisk && !isExpired(fromDisk)) {
          sessions.set(sid, fromDisk);
          all.push(sanitize(fromDisk));
        }
      }
    }
  } catch {
    /* ignore */
  }
  return all;
}

export function joinSession(id, userId, displayName) {
  const session = loadSession(id);
  if (!session) return { error: 'Sitzung nicht gefunden' };

  if (isExpired(session)) return { error: 'Sitzung ist abgelaufen' };

  const existing = session.participants.find((p) => p.userId === userId);
  if (existing) {
    existing.lastActive = Date.now();
    saveToDisk(id);
    return sanitize(session);
  }

  if (session.participants.length >= session.settings.maxParticipants) {
    return { error: 'Sitzung ist voll' };
  }

  session.participants.push({
    userId,
    displayName: displayName || 'Benutzer',
    joinedAt: Date.now(),
  });
  session.lastActivity = Date.now();

  addSystemMessage(session, `${displayName || 'Benutzer'} ist der Sitzung beigetreten`);
  saveToDisk(id);
  return sanitize(session);
}

export function leaveSession(id, userId) {
  const session = loadSession(id);
  if (!session) return { error: 'Sitzung nicht gefunden' };

  const idx = session.participants.findIndex((p) => p.userId === userId);
  if (idx === -1) return { error: 'Nicht in dieser Sitzung' };

  const name = session.participants[idx].displayName;
  session.participants.splice(idx, 1);
  session.lastActivity = Date.now();

  if (session.participants.length === 0) {
    sessions.delete(id);
    try {
      fs.unlinkSync(sessionFilePath(id));
    } catch {
      /* ok */
    }
    return { success: true, deleted: true };
  }

  if (session.creatorId === userId) {
    session.creatorId = session.participants[0].userId;
  }

  addSystemMessage(session, `${name} hat die Sitzung verlassen`);
  saveToDisk(id);
  return sanitize(session);
}

export function sendMessage(id, userId, displayName, text) {
  if (!text || !text.trim()) return { error: 'Nachricht darf nicht leer sein' };

  const session = loadSession(id);
  if (!session) return { error: 'Sitzung nicht gefunden' };

  const participant = session.participants.find((p) => p.userId === userId);
  if (!participant) return { error: 'Nur Teilnehmer können Nachrichten senden' };

  const msg = {
    id: crypto.randomBytes(6).toString('hex'),
    userId,
    displayName: displayName || participant.displayName,
    text: text.trim(),
    timestamp: new Date().toISOString(),
  };
  session.messages.push(msg);
  session.lastActivity = Date.now();

  if (session.messages.length > MAX_MESSAGES) {
    session.messages = session.messages.slice(-MAX_MESSAGES);
  }

  saveToDisk(id);
  return { success: true, message: msg };
}

export function getMessages(id, since) {
  const session = loadSession(id);
  if (!session) return [];

  let msgs = session.messages;
  if (since) {
    const sinceTime = new Date(since).getTime();
    msgs = msgs.filter((m) => new Date(m.timestamp).getTime() > sinceTime);
  }
  return msgs;
}

export function shareExercise(id, userId, exercise) {
  const session = loadSession(id);
  if (!session) return { error: 'Sitzung nicht gefunden' };

  const participant = session.participants.find((p) => p.userId === userId);
  if (!participant) return { error: 'Nur Teilnehmer können Aufgaben teilen' };

  const shared = {
    id: crypto.randomBytes(6).toString('hex'),
    userId,
    displayName: participant.displayName,
    exercise,
    sharedAt: new Date().toISOString(),
    completedBy: [],
  };
  session.sharedExercises.push(shared);
  session.lastActivity = Date.now();

  if (session.sharedExercises.length > MAX_EXERCISES) {
    session.sharedExercises = session.sharedExercises.slice(-MAX_EXERCISES);
  }

  addSystemMessage(session, `${participant.displayName} hat eine Aufgabe geteilt`);
  saveToDisk(id);
  return { success: true, shared };
}

export function markExerciseCompleted(sessionId, exerciseId, userId, displayName) {
  const session = loadSession(sessionId);
  if (!session) return { error: 'Sitzung nicht gefunden' };

  const ex = session.sharedExercises.find((e) => e.id === exerciseId);
  if (!ex) return { error: 'Aufgabe nicht gefunden' };

  if (!ex.completedBy.find((c) => c.userId === userId)) {
    ex.completedBy.push({
      userId,
      displayName: displayName || 'Benutzer',
      completedAt: new Date().toISOString(),
    });
    session.lastActivity = Date.now();
    saveToDisk(sessionId);
  }

  return { success: true, completedBy: ex.completedBy };
}

export function getSharedExercises(id) {
  const session = loadSession(id);
  if (!session) return [];
  return session.sharedExercises;
}

export function getParticipants(id) {
  const session = loadSession(id);
  if (!session) return [];
  return session.participants.map((p) => ({
    userId: p.userId,
    displayName: p.displayName,
    joinedAt: p.joinedAt,
  }));
}

// ── Internals ───────────────────────────────────────────────

function addSystemMessage(session, text) {
  session.messages.push({
    id: crypto.randomBytes(6).toString('hex'),
    userId: '__system__',
    displayName: 'System',
    text,
    timestamp: new Date().toISOString(),
    system: true,
  });
  if (session.messages.length > MAX_MESSAGES) {
    session.messages = session.messages.slice(-MAX_MESSAGES);
  }
}

function sanitize(session) {
  return {
    id: session.id,
    name: session.name,
    topic: session.topic,
    createdAt: session.createdAt,
    lastActivity: session.lastActivity,
    creatorId: session.creatorId,
    participantCount: session.participants.length,
    messageCount: session.messages.length,
    exerciseCount: session.sharedExercises.length,
    settings: session.settings,
  };
}

// Periodic cleanup of expired sessions
setInterval(
  () => {
    const now = Date.now();
    for (const [id, s] of sessions) {
      if (now - s.createdAt > SESSION_TTL_MS) {
        sessions.delete(id);
      }
    }
  },
  15 * 60 * 1000
); // every 15 min
