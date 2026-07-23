/**
 * Session service — session ID generation, storage, rate limiting.
 */

import crypto from 'crypto';
import FileBackedSessionStore from '../session-store.js';

const SESSION_TTL = 24 * 60 * 60 * 1000; // 24 hours
const MAX_MESSAGES_PER_SESSION = 50;

// In-memory rate limit store: Map<ip, { count, resetDate }>
const rateStore = new Map();

// File-backed session store: persists sessions across restarts
const sessionStore = new FileBackedSessionStore();

/**
 * Generate rate key for an IP (resets daily).
 * @param {string} ip
 * @returns {string}
 */
function getRateKey(ip) {
  const today = new Date().toISOString().slice(0, 10);
  return `${ip}:${today}`;
}

/**
 * Check rate limit for an IP.
 * @param {string} ip
 * @param {number} [rateLimit=50]
 * @returns {{ allowed: boolean, remaining: number }}
 */
function checkRateLimit(ip, rateLimit) {
  rateLimit = rateLimit || 50;
  const key = getRateKey(ip);
  const entry = rateStore.get(key);
  if (!entry) {
    rateStore.set(key, { count: 1 });
    return { allowed: true, remaining: rateLimit - 1 };
  }
  entry.count++;
  if (entry.count > rateLimit) {
    return { allowed: false, remaining: 0 };
  }
  return { allowed: true, remaining: rateLimit - entry.count };
}

/**
 * Generate or retrieve session ID from cookie.
 * @param {object} req - Express request
 * @param {object} res - Express response
 * @returns {string} session ID
 */
function getSessionId(req, res) {
  let sessionId = req.cookies?.chemie_session;
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    res.cookie('chemie_session', sessionId, {
      maxAge: SESSION_TTL,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
  }
  return sessionId;
}

/**
 * Get or create a session.
 * @param {string} sessionId
 * @param {string} [userId]
 * @returns {object} session object
 */
function getSession(sessionId, userId) {
  let session = sessionStore.get(sessionId);
  if (!session) {
    session = {
      messages: [],
      createdAt: Date.now(),
      lastUsed: Date.now(),
      userId: userId || null,
    };
    sessionStore.set(sessionId, session);
  } else {
    session.lastUsed = Date.now();
    if (userId && !session.userId) {
      session.userId = userId;
    }
  }
  return session;
}

/**
 * Trim old messages from session to prevent unbounded growth.
 * @param {object} session
 */
function cleanupSessionMessages(session) {
  if (session.messages.length > MAX_MESSAGES_PER_SESSION) {
    session.messages = session.messages.slice(-MAX_MESSAGES_PER_SESSION);
  }
}

/**
 * Periodic cleanup of stale rate-limit entries and sessions.
 * Call once at startup: setInterval(cleanupStaleEntries, 3600000)
 */
function cleanupStaleEntries() {
  const today = new Date().toISOString().slice(0, 10);
  for (const key of rateStore.keys()) {
    if (!key.endsWith(today)) rateStore.delete(key);
  }
  const now = Date.now();
  for (const [sessionId, session] of sessionStore.entries()) {
    if (now - session.lastUsed > SESSION_TTL) {
      sessionStore.delete(sessionId);
    }
  }
}

export {
  getSessionId,
  getSession,
  cleanupSessionMessages,
  checkRateLimit,
  getRateKey,
  cleanupStaleEntries,
  sessionStore,
  SESSION_TTL,
  MAX_MESSAGES_PER_SESSION,
};
