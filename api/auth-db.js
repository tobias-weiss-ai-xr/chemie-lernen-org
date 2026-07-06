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
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify({ users, nextId }, null, 2));
  } catch (err) {
    console.error('[auth-db] Failed to save users.json:', err.message);
  }
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
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  users.push(user);
  save();
  return user.id;
}

export function getUserByEmail(email) {
  return users.find((u) => u.email === email) || null;
}

export function getUserById(id) {
  return users.find((u) => u.id === id) || null;
}

export function updatePassword(id, passwordHash) {
  const u = users.find((u) => u.id === id);
  if (u) {
    u.password_hash = passwordHash;
    u.updated_at = new Date().toISOString();
    save();
  }
}

export function setPremiumTier(id, tier) {
  const u = users.find((u) => u.id === id);
  if (u) {
    u.tier = tier;
    u.role = tier === 'free' ? 'user' : 'premium';
    u.updated_at = new Date().toISOString();
    save();
  }
}

export function setStripeId(id, stripeId) {
  const u = users.find((u) => u.id === id);
  if (u) {
    u.stripe_id = stripeId;
    u.updated_at = new Date().toISOString();
    save();
  }
}

export function deleteUser(id) {
  users = users.filter((u) => u.id !== id);
  save();
}

export function isPremium(user) {
  return user && (user.role === 'premium' || user.tier !== 'free');
}

export function getAllUsers() {
  return users.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    tier: u.tier,
    stripe_id: u.stripe_id,
    created_at: u.created_at,
  }));
}
