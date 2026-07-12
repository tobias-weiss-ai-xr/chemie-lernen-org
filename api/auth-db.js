// ============================================================
// auth-db.js — JSON file-based user store
// No native dependencies — pure JS, works on all platforms
// ============================================================
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DB_DIR, 'users.json');

fs.mkdirSync(DB_DIR, { recursive: true });

let users = [];
let nextId = 1;
let savePending = false;
let saveTimeout = null;

function load() {
  try {
    if (fs.existsSync(DB_PATH)) {
      const data = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
      users = data.users || [];
      nextId = data.nextId || (users.length > 0 ? Math.max(...users.map((u) => u.id)) + 1 : 1);
    }
  } catch (err) {
    console.error('[auth-db] Failed to load users.json, starting fresh:', err.message);
    users = [];
    nextId = 1;
  }
}

function save() {
  // Atomic write: write to temp file then rename
  const tmpPath = DB_PATH + '.tmp';
  try {
    fs.writeFileSync(tmpPath, JSON.stringify({ users, nextId }, null, 2));
    fs.renameSync(tmpPath, DB_PATH);
  } catch (err) {
    console.error('[auth-db] Failed to save users.json:', err.message);
  }
}

// Debounced save — aggregates multiple writes within 200ms
function scheduleSave() {
  if (saveTimeout) clearTimeout(saveTimeout);
  savePending = true;
  saveTimeout = setTimeout(() => {
    save();
    savePending = false;
    saveTimeout = null;
  }, 200);
}

// Flush pending save immediately (call on graceful shutdown)
export function flush() {
  if (saveTimeout) clearTimeout(saveTimeout);
  if (savePending) save();
}

load();

export function createUser({ email, passwordHash, name = '', role = 'user', tier = 'free' }) {
  if (users.find((u) => u.email === email)) throw new Error('Email already exists');
  const user = {
    id: nextId++,
    email,
    password_hash: passwordHash,
    name,
    role,
    tier,
    stripe_id: null,
    stripe_customer_id: null,
    premium_until: null,
    learning_profile: {
      level: 'beginner',
      interests: [],
      preferred_explanation_style: 'simple',
      weak_areas: [],
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  users.push(user);
  scheduleSave();
  return user.id;
}

export function getUserByEmail(email) {
  return users.find((u) => u.email === email) || null;
}

export function getUserById(id) {
  return users.find((u) => u.id === id) || null;
}

export function getUserByStripeId(stripeId) {
  return users.find((u) => u.stripe_id === stripeId) || null;
}

export function updatePassword(id, passwordHash) {
  const u = users.find((u) => u.id === id);
  if (u) {
    u.password_hash = passwordHash;
    u.updated_at = new Date().toISOString();
    save();
  }
}

export function createPasswordResetToken(email) {
  const u = users.find((u) => u.email === email);
  if (!u) return null;
  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour
  u.password_reset_token = token;
  u.password_reset_expires = expires;
  u.updated_at = new Date().toISOString();
  save();
  return token;
}

export function resetPassword(token, passwordHash) {
  const u = users.find(
    (u) =>
      u.password_reset_token === token &&
      u.password_reset_expires &&
      new Date(u.password_reset_expires) > new Date()
  );
  if (!u) throw new Error('Ungültiger oder abgelaufener Token');
  u.password_hash = passwordHash;
  u.password_reset_token = null;
  u.password_reset_expires = null;
  u.updated_at = new Date().toISOString();
  save();
  return { id: u.id, email: u.email };
}

export function setPremiumTier(id, tier, premiumUntil) {
  const u = users.find((u) => u.id === id);
  if (u) {
    u.tier = tier;
    u.role = tier === 'free' ? 'user' : 'premium';
    if (premiumUntil !== undefined) u.premium_until = premiumUntil;
    if (tier === 'free') u.premium_until = null;
    u.updated_at = new Date().toISOString();
    scheduleSave();
  }
}

export function setStripeId(id, stripeId) {
  const u = users.find((u) => u.id === id);
  if (u) {
    u.stripe_id = stripeId;
    u.updated_at = new Date().toISOString();
    scheduleSave();
  }
}

export function setStripeCustomerId(id, customerId) {
  const u = users.find((u) => u.id === id);
  if (u) {
    u.stripe_customer_id = customerId;
    u.updated_at = new Date().toISOString();
    scheduleSave();
  }
}

export function deleteUser(id) {
  users = users.filter((u) => u.id !== id);
  scheduleSave();
}

export function setLearningProfile(id, profile) {
  const u = users.find((u) => u.id === id);
  if (!u) return null;
  u.learning_profile = {
    level: profile.level || 'beginner',
    interests: Array.isArray(profile.interests) ? profile.interests : [],
    preferred_explanation_style: profile.preferred_explanation_style || 'simple',
    weak_areas: Array.isArray(profile.weak_areas)
      ? profile.weak_areas
      : u.learning_profile?.weak_areas || [],
  };
  u.updated_at = new Date().toISOString();
  scheduleSave();
  return u.learning_profile;
}

export function getLearningProfile(id) {
  const u = users.find((u) => u.id === id);
  if (!u) return null;
  return u.learning_profile || null;
}

// ── Conversation Memory ───────────────────────────────────────

export function getConversationMemory(userId) {
  const u = users.find((u) => u.id === userId);
  if (!u) return null;
  if (!u.memory) u.memory = { conversations: [], chatHistorySearch: {} };
  return u.memory;
}

export function addConversationMemory(userId, { sessionId, date, topicSummary, messageCount }) {
  const u = users.find((u) => u.id === userId);
  if (!u) return null;
  if (!u.memory) u.memory = { conversations: [], chatHistorySearch: {} };
  u.memory.conversations.push({
    sessionId,
    date,
    topicSummary,
    messageCount,
  });
  if (u.memory.conversations.length > 10) {
    u.memory.conversations = u.memory.conversations.slice(-10);
  }
  u.updated_at = new Date().toISOString();
  scheduleSave();
  return u.memory;
}

export function getChatHistoryIndex(userId) {
  const u = users.find((u) => u.id === userId);
  if (!u) return null;
  if (!u.memory) u.memory = { conversations: [], chatHistorySearch: {} };
  return u.memory.chatHistorySearch;
}

export function updateChatHistoryIndex(userId, sessionId, searchableText) {
  const u = users.find((u) => u.id === userId);
  if (!u) return null;
  if (!u.memory) u.memory = { conversations: [], chatHistorySearch: {} };
  u.memory.chatHistorySearch[sessionId] = {
    text: searchableText,
    date: new Date().toISOString(),
    wordCount: searchableText.split(/\s+/).filter(Boolean).length,
  };
  u.updated_at = new Date().toISOString();
  scheduleSave();
  return u.memory.chatHistorySearch;
}

export function isPremium(user) {
  if (!user) return false;
  if (user.tier !== 'premium') return false;
  // premium_until check
  if (user.premium_until) {
    const expiry = new Date(user.premium_until);
    if (expiry <= new Date()) {
      // Expired — auto-demote
      user.tier = 'free';
      user.role = 'user';
      user.premium_until = null;
      scheduleSave();
      return false;
    }
  }
  return true;
}

// Check all users for expired premiums (called on startup)
export function expireStalePremiums() {
  let changed = false;
  for (const u of users) {
    if (u.tier === 'premium' && u.premium_until) {
      const expiry = new Date(u.premium_until);
      if (expiry <= new Date()) {
        u.tier = 'free';
        u.role = 'user';
        u.premium_until = null;
        changed = true;
      }
    }
  }
  if (changed) scheduleSave();
}

export function getAllUsers() {
  return users.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    tier: u.tier,
    stripe_id: u.stripe_id,
    stripe_customer_id: u.stripe_customer_id,
    premium_until: u.premium_until,
    created_at: u.created_at,
  }));
}

// ── Quiz Results ──────────────────────────────────────────────

export function addQuizResult(userId, result) {
  const u = users.find((u) => u.id === userId);
  if (!u) return { ok: false, error: 'User not found' };
  if (!u.quiz_results) u.quiz_results = [];
  u.quiz_results.push({
    topic: result.topic,
    score: result.score,
    total: result.total,
    percentage: result.percentage,
    answers: result.answers || [],
    time: result.time || 0,
    completedAt: new Date().toISOString(),
  });
  u.updated_at = new Date().toISOString();
  scheduleSave();
  return { ok: true };
}

export function getQuizResults(userId) {
  const u = users.find((u) => u.id === userId);
  if (!u) return [];
  return u.quiz_results || [];
}

// ── FSRS (Free Spaced Repetition Scheduler) ────────────────────

function _addDays(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function getFsrsCards(userId) {
  const u = users.find((u) => u.id === userId);
  if (!u) return null;
  if (!u.fsrsCards) u.fsrsCards = [];
  return u.fsrsCards;
}

export function createFsrsCard(userId, { topicId, question, answer, type }) {
  const u = users.find((u) => u.id === userId);
  if (!u) return null;
  if (!u.fsrsCards) u.fsrsCards = [];
  const card = {
    cardId: crypto.randomUUID(),
    topicId,
    question,
    answer,
    type,
    interval: 1,
    ease: 2.5,
    dueDate: new Date().toISOString().slice(0, 10),
    lapses: 0,
    lastReview: null,
    createdAt: new Date().toISOString(),
  };
  u.fsrsCards.push(card);
  u.updated_at = new Date().toISOString();
  scheduleSave();
  return card;
}

export function updateFsrsCard(userId, cardId, { score }) {
  const u = users.find((u) => u.id === userId);
  if (!u) return null;
  if (!u.fsrsCards) u.fsrsCards = [];
  const card = u.fsrsCards.find((c) => c.cardId === cardId);
  if (!card) return null;

  const today = new Date().toISOString().slice(0, 10);
  let interval = card.interval;
  let ease = card.ease;
  let lapses = card.lapses;

  if (score === 0) {
    // Again
    interval = 1;
    ease = Math.max(1.3, ease - 0.2);
    lapses += 1;
  } else if (score === 0.33) {
    // Hard
    interval = Math.round(interval * 1.2 * ease);
  } else if (score === 0.66) {
    // Good
    interval = Math.max(1, Math.round(interval * ease));
  } else if (score === 1.0) {
    // Easy
    interval = Math.max(1, Math.round(interval * ease * 1.3));
  }

  interval = Math.min(365, Math.max(1, interval));

  card.interval = interval;
  card.ease = ease;
  card.lapses = lapses;
  card.lastReview = new Date().toISOString();
  card.dueDate = _addDays(today, interval);
  u.updated_at = new Date().toISOString();
  scheduleSave();

  return {
    cardId: card.cardId,
    interval: card.interval,
    ease: card.ease,
    dueDate: card.dueDate,
    lapses: card.lapses,
    lastReview: card.lastReview,
  };
}

export function getDueCards(userId) {
  const u = users.find((u) => u.id === userId);
  if (!u) return [];
  if (!u.fsrsCards) u.fsrsCards = [];
  const today = new Date().toISOString().slice(0, 10);
  return u.fsrsCards
    .filter((c) => c.dueDate <= today)
    .sort((a, b) => a.ease - b.ease);
}
