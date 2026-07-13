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
    gamification: {
      xp: 0,
      level: 0,
      streak: 0,
      lastCheckin: null,
      lastCheckinDate: null,
      badges: [],
      completedObjectives: [],
      checkinHistory: [],
      xpLog: [],
    },
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
  return u.fsrsCards.filter((c) => c.dueDate <= today).sort((a, b) => a.ease - b.ease);
}

// ── Gamification System ──────────────────────────────────────────────

/**
 * Daily XP caps by action category.
 * Design: quiz=200xp/day, exercise=100xp/day, checkin=20xp/day, reading=50xp/day.
 */
const DAILY_XP_CAPS = {
  quiz: 200,
  exercise: 100,
  checkin: 20,
  reading: 50,
};

/**
 * Ten badge definitions with functional criteria.
 * Each badge has an id, display name, trigger description, XP bonus,
 * and a condition function that receives the gamification object.
 */
const BADGES = [
  {
    id: 'erste-schritte',
    name: 'Erste Schritte',
    trigger: 'first_quiz',
    xpBonus: 50,
    condition: (g) => g.xpLog.some((e) => e.action === 'quiz_submit'),
  },
  {
    id: 'fruehaufsteher',
    name: 'Frühaufsteher',
    trigger: 'streak_7',
    xpBonus: 200,
    condition: (g) => g.streak >= 7,
  },
  {
    id: 'chemie-fuchs',
    name: 'Chemie-Fuchs',
    trigger: 'streak_30',
    xpBonus: 500,
    condition: (g) => g.streak >= 30,
  },
  {
    id: 'uebungsmeister',
    name: 'Übungsmeister',
    trigger: '100_exercises',
    xpBonus: 300,
    condition: (g) => g.xpLog.filter((e) => e.action === 'exercise_correct').length >= 100,
  },
  {
    id: 'themen-experte',
    name: 'Themen-Experte',
    trigger: 'topic_100',
    xpBonus: 150,
    condition: (g) => g.completedObjectives.length >= 5,
  },
  {
    id: 'pfad-absolvent',
    name: 'Pfad-Absolvent',
    trigger: 'path_complete',
    xpBonus: 500,
    condition: (g) => g.completedObjectives.length >= 15,
  },
  {
    id: 'sammler',
    name: 'Sammler',
    trigger: '5_badges',
    xpBonus: 200,
    condition: (g) => g.badges.length >= 5,
  },
  {
    id: 'bestaendig',
    name: 'Beständig',
    trigger: '30_checkins',
    xpBonus: 250,
    condition: (g) => g.checkinHistory.length >= 30,
  },
  {
    id: 'schnellstarter',
    name: 'Schnellstarter',
    trigger: '3_in_one_day',
    xpBonus: 50,
    condition: (g) => todayCount(g.xpLog, 'exercise_correct') >= 3,
  },
  {
    id: 'alleskoenner',
    name: 'Alleskönner',
    trigger: 'all_types',
    xpBonus: 300,
    condition: (g) => {
      const types = new Set(g.xpLog.map((e) => e.action));
      return types.size >= 5;
    },
  },
];

/**
 * Count how many xpLog entries with `action` occurred today.
 * @param {Array} xpLog
 * @param {string} action
 * @returns {number}
 */
function todayCount(xpLog, action) {
  const today = new Date().toISOString().slice(0, 10);
  return xpLog.filter(
    (e) => e.action === action && e.timestamp && e.timestamp.slice(0, 10) === today
  ).length;
}

/**
 * Extract the action category from an action name for cap checking.
 * @param {string} action
 * @returns {string}
 */
function _getActionCategory(action) {
  for (const cat of Object.keys(DAILY_XP_CAPS)) {
    if (action.startsWith(cat)) return cat;
  }
  return 'other';
}

/**
 * Calculate how much XP of the given category has been earned today.
 * @param {Array} xpLog
 * @param {string} category
 * @returns {number}
 */
function _getTodayXpForCategory(xpLog, category) {
  const today = new Date().toISOString().slice(0, 10);
  return xpLog.reduce((sum, entry) => {
    if (
      entry.timestamp &&
      entry.timestamp.slice(0, 10) === today &&
      _getActionCategory(entry.action) === category
    ) {
      return sum + (entry.amount || 0);
    }
    return sum;
  }, 0);
}

/**
 * Calculate level from total XP.
 * Level = Math.floor(xp / 500)
 * @param {number} xp
 * @returns {number}
 */
export function calculateLevel(xp) {
  return Math.floor(xp / 500);
}

/**
 * Lazy-init and return a user's gamification object.
 * Follows the same pattern as getFsrsCards / getConversationMemory.
 * @param {number} userId
 * @returns {object|null} gamification object, or null if user not found
 */
export function getGamification(userId) {
  const u = users.find((u) => u.id === userId);
  if (!u) return null;
  if (!u.gamification) {
    u.gamification = {
      xp: 0,
      level: 0,
      streak: 0,
      lastCheckin: null,
      lastCheckinDate: null,
      badges: [],
      completedObjectives: [],
      checkinHistory: [],
      xpLog: [],
    };
  }
  return u.gamification;
}

/**
 * Award XP to a user, enforcing daily category caps.
 * Updates level, logs to xpLog, and persists.
 *
 * @param {number} userId
 * @param {number} amount - XP amount to award (before cap)
 * @param {string} source - human-readable source description (e.g. 'Quiz: Säuren und Basen')
 * @param {string} action - action type for cap grouping (e.g. 'quiz_submit', 'exercise_correct', 'checkin', 'reading')
 * @returns {{ awarded: number, totalXp: number, capped: boolean, newLevel: number }} result
 */
export function awardXp(userId, amount, source, action) {
  const u = users.find((u) => u.id === userId);
  if (!u) return { awarded: 0, totalXp: 0, capped: false, newLevel: 0 };

  const g = getGamification(userId);
  if (!g) return { awarded: 0, totalXp: 0, capped: false, newLevel: 0 };

  const category = _getActionCategory(action);
  const todayXp = _getTodayXpForCategory(g.xpLog, category);
  const cap = DAILY_XP_CAPS[category];

  let capped = false;
  let awarded = amount;

  if (cap !== undefined && todayXp + amount > cap) {
    const remaining = Math.max(0, cap - todayXp);
    if (remaining <= 0) {
      // Daily cap already reached — no XP awarded
      return { awarded: 0, totalXp: g.xp, capped: true, newLevel: g.level };
    }
    awarded = remaining;
    capped = true;
  }

  g.xp += awarded;
  g.level = calculateLevel(g.xp);

  g.xpLog.unshift({
    action,
    amount: awarded,
    source,
    timestamp: new Date().toISOString(),
  });

  // Keep only the last 100 entries
  if (g.xpLog.length > 100) {
    g.xpLog.length = 100;
  }

  u.updated_at = new Date().toISOString();
  scheduleSave();

  return { awarded, totalXp: g.xp, capped, newLevel: g.level };
}

/**
 * Get the current streak length for a user.
 * @param {number} userId
 * @returns {number}
 */
export function getStreak(userId) {
  const g = getGamification(userId);
  if (!g) return 0;
  return g.streak || 0;
}

/**
 * Record a daily check-in for the user.
 * Manages streak logic and streak freeze (burn 100 XP if a day was missed
 * and the user has enough XP to preserve the streak).
 *
 * Streak freeze: if lastCheckinDate !== yesterday && streak > 0 && xp >= 100,
 * auto-debit 100 XP to keep streak.
 *
 * @param {number} userId
 * @returns {object} { checkedIn, streak, xpEarned, totalXp, message, streakFrozen }
 */
export function recordCheckin(userId) {
  const u = users.find((u) => u.id === userId);
  if (!u)
    return {
      checkedIn: false,
      streak: 0,
      xpEarned: 0,
      totalXp: 0,
      message: 'User not found',
      streakFrozen: false,
    };

  const g = getGamification(userId);
  if (!g)
    return {
      checkedIn: false,
      streak: 0,
      xpEarned: 0,
      totalXp: 0,
      message: 'User not found',
      streakFrozen: false,
    };

  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const yesterday = new Date(now.getTime() - 86400000).toISOString().slice(0, 10);

  // Already checked in today
  if (g.lastCheckinDate === today) {
    return {
      checkedIn: false,
      streak: g.streak || 0,
      xpEarned: 0,
      totalXp: g.xp,
      message: 'Bereits heute eingecheckt',
      streakFrozen: false,
    };
  }

  let streakFrozen = false;

  // Streak logic
  if (g.lastCheckinDate === yesterday) {
    // Consecutive day — increment streak
    g.streak = (g.streak || 0) + 1;
  } else if (g.lastCheckinDate && g.streak > 0) {
    // Gap detected: try streak freeze
    if (g.xp >= 100) {
      g.xp -= 100;
      g.level = calculateLevel(g.xp);
      streakFrozen = true;
      // Log the freeze as a negative XP entry
      g.xpLog.unshift({
        action: 'streak_freeze',
        amount: -100,
        source: 'Streak-Freeze (verpasster Tag)',
        timestamp: new Date().toISOString(),
      });
      if (g.xpLog.length > 100) g.xpLog.length = 100;
    } else {
      // Cannot afford freeze — reset streak
      g.streak = 1;
    }
  } else {
    // First check-in or streak already 0
    g.streak = 1;
  }

  g.lastCheckin = now.toISOString();
  g.lastCheckinDate = today;

  // Update check-in history (keep last 60 days)
  if (!g.checkinHistory.includes(today)) {
    g.checkinHistory.unshift(today);
    if (g.checkinHistory.length > 60) {
      g.checkinHistory.length = 60;
    }
  }

  // Award check-in XP (capped at 20/day)
  const xpResult = awardXp(userId, 20, 'Tägliches Check-in', 'checkin');

  u.updated_at = now.toISOString();
  scheduleSave();

  return {
    checkedIn: true,
    streak: g.streak || 0,
    xpEarned: xpResult.awarded,
    totalXp: g.xp,
    message: streakFrozen ? 'Streak durch Einfrieren erhalten (-100 XP)' : null,
    streakFrozen,
  };
}

/**
 * Evaluate all 10 badge criteria and unlock any that are newly earned.
 * @param {number} userId
 * @returns {Array} newly unlocked badges
 */
export function checkBadgeUnlock(userId) {
  const g = getGamification(userId);
  if (!g) return [];

  const earnedIds = new Set(g.badges.map((b) => b.badgeId));
  const newlyEarned = [];

  for (const badge of BADGES) {
    if (earnedIds.has(badge.id)) continue;

    if (badge.condition(g)) {
      const earnedBadge = {
        badgeId: badge.id,
        name: badge.name,
        earnedAt: new Date().toISOString(),
      };
      g.badges.push(earnedBadge);
      newlyEarned.push(earnedBadge);

      // Award XP bonus for earning the badge
      if (badge.xpBonus > 0) {
        g.xp += badge.xpBonus;
        g.level = calculateLevel(g.xp);
        g.xpLog.unshift({
          action: 'badge_unlock',
          amount: badge.xpBonus,
          source: `Abzeichen: ${badge.name}`,
          timestamp: new Date().toISOString(),
        });
        if (g.xpLog.length > 100) g.xpLog.length = 100;
      }
    }
  }

  if (newlyEarned.length > 0) {
    const u = users.find((u) => u.id === userId);
    if (u) u.updated_at = new Date().toISOString();
    scheduleSave();
  }

  return newlyEarned;
}

/**
 * Get the status of all 10 badges (earned vs not earned).
 * @param {number} userId
 * @returns {Array} [{ id, name, earned, earnedAt }]
 */
export function getBadgeStatus(userId) {
  const g = getGamification(userId);
  if (!g) return BADGES.map((b) => ({ id: b.id, name: b.name, earned: false, earnedAt: null }));

  const earnedMap = new Map(g.badges.map((b) => [b.badgeId, b.earnedAt]));

  return BADGES.map((badge) => ({
    id: badge.id,
    name: badge.name,
    earned: earnedMap.has(badge.id),
    earnedAt: earnedMap.get(badge.id) || null,
  }));
}

/**
 * Mark a learning objective as completed by the user.
 * @param {number} userId
 * @param {string} slug - learning objective slug (e.g. 'trennverfahren-kennen')
 * @returns {object|null} updated completedObjectives array, or null if user not found
 */
export function completeObjective(userId, slug) {
  const u = users.find((u) => u.id === userId);
  if (!u) return null;

  const g = getGamification(userId);
  if (!g) return null;

  // Avoid duplicates
  if (!g.completedObjectives.some((o) => o.slug === slug)) {
    g.completedObjectives.push({
      slug,
      completedAt: new Date().toISOString(),
    });

    // Award XP for completing an objective
    g.xp += 50;
    g.level = calculateLevel(g.xp);
    g.xpLog.unshift({
      action: 'objective_complete',
      amount: 50,
      source: `Lernziel erfüllt: ${slug}`,
      timestamp: new Date().toISOString(),
    });
    if (g.xpLog.length > 100) g.xpLog.length = 100;

    u.updated_at = new Date().toISOString();
    scheduleSave();
  }

  return g.completedObjectives;
}

/**
 * Get the last N entries from the XP log.
 * @param {number} userId
 * @param {number} [limit=50]
 * @returns {Array}
 */
export function getXpLog(userId, limit) {
  const safeLimit = typeof limit === 'number' && limit > 0 ? limit : 50;
  const g = getGamification(userId);
  if (!g) return [];
  return (g.xpLog || []).slice(0, safeLimit);
}

export { BADGES, DAILY_XP_CAPS };
