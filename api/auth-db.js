// ============================================================
// auth-db.js — JSON file-based user store
// No native dependencies — pure JS, works on all platforms
// ============================================================
import path from 'path';
import fs from 'fs';
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
