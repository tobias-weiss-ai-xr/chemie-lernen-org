// ============================================================
// bloom-target.js — per-learner Bloom depth ceiling (public)
//
// zpd-deepdive-differentiation: stores each learner's target Bloom
// index (1-6) so the ZPD engine can filter objectives by depth and
// activate the "differentiate" strategy when a learner overgrows
// their ceiling.
//
// This module is PUBLIC (git-tracked) because the storage it owns
// (api/data/bloom-targets.json) is a plain JSON map — it deliberately
// does NOT reach into the private auth-db user store, so the public
// ZPD engine/routes never depend on private exports.
//
// No native dependencies — pure JS.
// ============================================================
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_DIR = path.join(__dirname, '..', 'data');
const DB_PATH = path.join(DB_DIR, 'bloom-targets.json');

const BLOOM_LEVELS = ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'];

let targets = {}; // { [userId]: number(1-6) }
let saveTimeout = null;
let writeLock = false;
let writeQueue = [];

function load() {
  try {
    if (fs.existsSync(DB_PATH)) {
      const data = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
      targets = data.targets && typeof data.targets === 'object' ? data.targets : {};
    }
  } catch (err) {
    console.error('[bloom-target] Failed to load bloom-targets.json, starting fresh:', err.message);
    targets = {};
  }
}

function save() {
  if (writeLock) {
    return new Promise((resolve) => writeQueue.push(() => save().then(resolve)));
  }
  writeLock = true;
  const tmpPath = DB_PATH + '.tmp';
  try {
    fs.mkdirSync(DB_DIR, { recursive: true });
    fs.writeFileSync(tmpPath, JSON.stringify({ targets }, null, 2));
    fs.renameSync(tmpPath, DB_PATH);
  } catch (err) {
    console.error('[bloom-target] Failed to save bloom-targets.json:', err.message);
  } finally {
    writeLock = false;
    if (writeQueue.length > 0) {
      const next = writeQueue.shift();
      next();
    }
  }
}

// Debounced save — aggregates multiple writes within 200ms.
function scheduleSave() {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    save();
    saveTimeout = null;
  }, 200);
}

export function flush() {
  if (saveTimeout) clearTimeout(saveTimeout);
  if (targets && Object.keys(targets).length > 0) save();
}

load();

/**
 * Normalise a Bloom target value to a 1-6 index, or null when invalid.
 * Accepts an integer 1-6 or a level string ('remember'...'create'), case-insensitive.
 */
export function normalizeBloomTarget(target) {
  if (typeof target === 'string') {
    const idx = BLOOM_LEVELS.indexOf(target.trim().toLowerCase());
    return idx >= 0 ? idx + 1 : null;
  }
  const n = Number(target);
  return Number.isInteger(n) && n >= 1 && n <= 6 ? n : null;
}

/** Map a Bloom level string/number to its 1-6 index (0 if unknown). */
export function bloomIndex(level) {
  if (typeof level === 'number') return level >= 1 && level <= 6 ? level : 0;
  if (!level) return 0;
  const idx = BLOOM_LEVELS.indexOf(String(level).toLowerCase());
  return idx >= 0 ? idx + 1 : 0;
}

/**
 * Get a learner's target Bloom index (1-6). Defaults to 6 (full depth).
 * @returns {number}
 */
export function getBloomTarget(userId) {
  if (userId == null) return 6;
  const stored = targets[String(userId)];
  const idx = normalizeBloomTarget(stored);
  return idx || 6;
}

/**
 * Set a learner's target Bloom depth. Accepts an integer 1-6 or a level string.
 * @returns {{ok:boolean, targetBloomIndex?:number, bloomLevel?:string, error?:string}}
 */
export function setBloomTarget(userId, target) {
  const idx = normalizeBloomTarget(target);
  if (idx == null) {
    return {
      ok: false,
      error: 'targetBloomIndex must be an integer between 1 and 6 or a Bloom level string',
    };
  }
  targets[String(userId)] = idx;
  scheduleSave();
  return { ok: true, targetBloomIndex: idx, bloomLevel: BLOOM_LEVELS[idx - 1] };
}
