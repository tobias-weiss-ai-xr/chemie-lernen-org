/**
 * Theme overrides route handlers — GET/PUT element→themeKey map.
 *
 * Routes (all require admin API key):
 *   GET  /api/theme-overrides  → full symbol→themeKey map ({} if none)
 *   PUT  /api/theme-overrides  → replace the stored map; validate keys/values
 */

import { Router } from 'express';
import { adminKeyMiddleware } from '../auth.js';
import { readFile, writeFile, rename, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';

const router = Router();

const DATA_FILE =
  process.env.THEME_OVERRIDES_FILE ??
  join(dirname(fileURLToPath(import.meta.url)), '..', 'data', 'theme-overrides.json');

/**
 * Read the stored overrides map.
 * Returns an empty object if the file does not exist or is corrupt.
 */
async function readOverrides() {
  try {
    const raw = await readFile(DATA_FILE, 'utf8');
    const data = JSON.parse(raw);
    // Guard against non-object files
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      return data;
    }
    return {};
  } catch {
    return {};
  }
}

/**
 * Write the overrides map atomically (write to temp then rename).
 */
async function writeOverrides(map) {
  const dir = dirname(DATA_FILE);
  await mkdir(dir, { recursive: true });
  const tmpFile = join(tmpdir(), `theme-overrides-${randomUUID()}.tmp`);
  await writeFile(tmpFile, JSON.stringify(map, null, 2), 'utf8');
  await rename(tmpFile, DATA_FILE);
}

/**
 * Validate the body for PUT: must be a plain object where every key
 * is a non-empty string and every value is a non-empty string.
 */
function isValidOverridesMap(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return false;
  const keys = Object.keys(body);
  if (keys.length === 0) return true; // empty map is valid
  return keys.every(
    (k) =>
      typeof k === 'string' && k.length > 0 && typeof body[k] === 'string' && body[k].length > 0
  );
}

// ── GET /api/theme-overrides ────────────────────────────────────

router.get('/api/theme-overrides', adminKeyMiddleware, async function (req, res) {
  try {
    const overrides = await readOverrides();
    res.json(overrides);
  } catch (err) {
    console.error('[theme-overrides] read failed:', err);
    res.status(500).json({ error: 'Could not read theme overrides' });
  }
});

// ── PUT /api/theme-overrides ────────────────────────────────────

router.put('/api/theme-overrides', adminKeyMiddleware, async function (req, res) {
  try {
    if (!isValidOverridesMap(req.body)) {
      return res.status(400).json({
        error:
          'Invalid body: must be an object of { "symbol": "themeKey", ... } with non-empty strings',
      });
    }
    const map = Object.fromEntries(Object.entries(req.body));
    await writeOverrides(map);
    res.json(map);
  } catch (err) {
    console.error('[theme-overrides] write failed:', err);
    res.status(500).json({ error: 'Could not write theme overrides' });
  }
});

export default router;
