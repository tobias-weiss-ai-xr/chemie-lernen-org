/**
 * session-store.js — File-backed persistent session store.
 *
 * Replaces the in-memory Map<sessionId, session> with a JSON-file-backed
 * storage so that sessions survive server restarts.
 *
 * Environment variable:
 *   SESSION_DATA_PATH — path to the JSON file (default: /data/chemie-sessions.json)
 *   SESSION_SAVE_INTERVAL — periodic save interval in ms (default: 30000 = 30s)
 */
import fs from 'fs';
import path from 'path';

const DATA_PATH = process.env.SESSION_DATA_PATH || '/data/chemie-sessions.json';
const SAVE_INTERVAL = parseInt(process.env.SESSION_SAVE_INTERVAL, 10) || 30000;

/**
 * A Map-like store that persists its contents to a JSON file.
 * All mutations are tracked and flushed periodically + on process exit.
 */
class FileBackedSessionStore {
  constructor() {
    /** @type {Map<string, { messages: Array<{role:string,content:string}>, createdAt:number, lastUsed:number }>} */
    this._map = new Map();
    this._dirty = false;
    this._saveTimer = null;
    this._stopped = false;

    // Ensure data directory exists
    this._ensureDir();

    // Load existing sessions from disk
    this._load();

    // Periodic auto-save
    this._saveTimer = setInterval(() => this._flush(), SAVE_INTERVAL);
    this._saveTimer.unref(); // Don't keep process alive

    // Save on exit
    const onExit = () => {
      this._flushSync();
    };
    process.on('exit', onExit);
    process.on('SIGINT', () => {
      onExit();
      process.exit(0);
    });
    process.on('SIGTERM', () => {
      onExit();
      process.exit(0);
    });
  }

  /** Ensure the parent directory of DATA_PATH exists. */
  _ensureDir() {
    try {
      const dir = path.dirname(DATA_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    } catch {
      // Directory may not be writable — silently degrade to in-memory-only
    }
  }

  /** Load sessions from disk, silently degrading on error. */
  _load() {
    try {
      if (fs.existsSync(DATA_PATH)) {
        const raw = fs.readFileSync(DATA_PATH, 'utf-8');
        const data = JSON.parse(raw);
        if (data && typeof data === 'object' && !Array.isArray(data)) {
          const now = Date.now();
          for (const [id, s] of Object.entries(data)) {
            // Skip expired sessions
            if (s.createdAt && now - s.createdAt > 24 * 60 * 60 * 1000) continue;
            if (!s.messages || !Array.isArray(s.messages)) continue;
            this._map.set(id, {
              messages: s.messages.slice(-50),
              createdAt: s.createdAt || now,
              lastUsed: s.lastUsed || now,
            });
          }
        }
      }
    } catch {
      // Corrupt or unreadable file — start fresh
    }
  }

  /** Async flush: write to a temp file then rename. */
  _flush() {
    if (!this._dirty || this._stopped) return;
    this._dirty = false;
    try {
      const data = {};
      for (const [id, session] of this._map) {
        data[id] = session;
      }
      const json = JSON.stringify(data);
      const tmp = DATA_PATH + '.tmp.' + process.pid;
      fs.writeFileSync(tmp, json, 'utf-8');
      fs.renameSync(tmp, DATA_PATH);
    } catch {
      // Write failed — mark dirty for retry
      this._dirty = true;
    }
  }

  /** Synchronous flush for process exit — no tmp file dance. */
  _flushSync() {
    if (!this._dirty || this._stopped) return;
    this._dirty = false;
    try {
      const data = {};
      for (const [id, session] of this._map) {
        data[id] = session;
      }
      fs.writeFileSync(DATA_PATH, JSON.stringify(data), 'utf-8');
    } catch {
      // Best-effort at exit
    }
  }

  // --- Public API (matches Map subset) ---

  get(sessionId) {
    return this._map.get(sessionId);
  }

  set(sessionId, session) {
    this._map.set(sessionId, session);
    this._dirty = true;
  }

  /**
   * Get or create a session keyed by an identifier (e.g. userId).
   * Required by learning-engine (getProgress) and the exercise routes.
   */
  getSession(userId) {
    let session = this._map.get(userId);
    if (!session) {
      session = {
        userId,
        messages: [],
        createdAt: Date.now(),
        lastUsed: Date.now(),
      };
      this._map.set(userId, session);
      this._dirty = true;
    } else {
      session.lastUsed = Date.now();
      if (userId && !session.userId) session.userId = userId;
      // Restored/legacy sessions may lack chat state — never let
      // consumers (chat pushes to session.messages) crash on it.
      if (!session.messages) session.messages = [];
    }
    // NOTE: no `progress` pre-initialization here on purpose —
    // learning-engine's getProgress() is the single source of truth for the
    // progress shape; a partial `progress: {}` here would bypass its full
    // defaulting and crash addXpEntry (xpHistory.unshift) later.
    return session;
  }

  delete(sessionId) {
    this._map.delete(sessionId);
    this._dirty = true;
  }

  /** Iterate all sessions (Map-compatible signature: callback(session, id)). */
  forEach(callback) {
    for (const [id, session] of this._map) {
      callback(session, id);
    }
  }

  has(sessionId) {
    return this._map.has(sessionId);
  }

  get size() {
    return this._map.size;
  }

  /** Find all sessions belonging to a user ID, optionally filtered by maxAge in ms */
  findByUserId(userId, maxAge) {
    const results = [];
    const now = Date.now();
    for (const [id, session] of this._map) {
      if (session.userId === userId) {
        if (maxAge && now - session.createdAt > maxAge) continue;
        results.push({
          sessionId: id,
          createdAt: session.createdAt,
          lastUsed: session.lastUsed,
          messageCount: session.messages.length,
          title: session.title || null,
        });
      }
    }
    // Sort by lastUsed descending (most recent first)
    results.sort((a, b) => b.lastUsed - a.lastUsed);
    return results;
  }

  /** Flush immediately (e.g. before responding to a critical request). */
  flush() {
    this._flush();
  }

  /** Stop periodic saves (for testing). */
  stop() {
    this._stopped = true;
    if (this._saveTimer) {
      clearInterval(this._saveTimer);
      this._saveTimer = null;
    }
  }
}

export default FileBackedSessionStore;
