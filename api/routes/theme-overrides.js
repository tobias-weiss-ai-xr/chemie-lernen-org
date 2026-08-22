/**
 * Theme overrides route handlers — GET/PUT/PATCH/DELETE element→themeKey map.
 *
 * Routes (all require admin API key via adminKeyMiddleware):
 *   GET    /api/theme-overrides            → full symbol→themeKey map ({} if none)
 *   PUT    /api/theme-overrides            → REPLACE the whole map (bulk admin)
 *   PATCH  /api/theme-overrides/:symbol    → upsert a single key (conflict-free)
 *   DELETE /api/theme-overrides/:symbol    → remove a single key
 *
 * Single-key edits use PATCH/DELETE so concurrent admins editing different
 * elements don't clobber each other (PUT replaces the entire map).
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

const MAX_VALUE_LEN = 128;
// Element symbols are alphanumeric (H, Fe, Uuo, Og, …); restrict keys to that.
const SYMBOL_RE = /^[A-Za-z0-9]{1,32}$/;

/**
 * Read the stored overrides map.
 *  - missing file → {} (normal)
 *  - corrupt JSON → {} but warn (so the problem is visible)
 */
async function readOverrides() {
  try {
    const raw = await readFile(DATA_FILE, 'utf8');
    const data = JSON.parse(raw);
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      return data;
    }
    console.warn('[theme-overrides] stored file is not an object; serving {}');
    return {};
  } catch (err) {
    if (err && err.code === 'ENOENT') return {};
    console.error('[theme-overrides] corrupt JSON in', DATA_FILE, '-', err && err.message);
    return {};
  }
}

/** Write atomically (temp file + rename) and refresh the cache. */
async function writeOverrides(map) {
  const dir = dirname(DATA_FILE);
  await mkdir(dir, { recursive: true });
  const tmpFile = join(tmpdir(), `theme-overrides-${randomUUID()}.tmp`);
  await writeFile(tmpFile, JSON.stringify(map, null, 2), 'utf8');
  await rename(tmpFile, DATA_FILE);
}

function isValidSymbol(symbol) {
  return typeof symbol === 'string' && SYMBOL_RE.test(symbol);
}

function isValidThemeKey(key) {
  return typeof key === 'string' && key.length > 0 && key.length <= MAX_VALUE_LEN;
}

/** Validate a full-map PUT body. */
function isValidOverridesMap(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return false;
  const keys = Object.keys(body);
  if (keys.length === 0) return true; // empty map is valid (clears all)
  return keys.every((k) => isValidSymbol(k) && isValidThemeKey(body[k]));
}

// ── GET ────────────────────────────────────────────────────────

router.get('/api/theme-overrides', adminKeyMiddleware, async function (req, res) {
  try {
    const overrides = await readOverrides();
    res.json(overrides);
  } catch (err) {
    console.error('[theme-overrides] read failed:', err);
    res.status(500).json({ error: 'Could not read theme overrides' });
  }
});

// ── PUT (replace whole map) ────────────────────────────────────

router.put('/api/theme-overrides', adminKeyMiddleware, async function (req, res) {
  try {
    if (!isValidOverridesMap(req.body)) {
      return res.status(400).json({
        error:
          'Invalid body: object of { symbol: themeKey } with alphanumeric symbols (<=32) and non-empty string values (<=128)',
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

// ── PATCH (upsert one key) ─────────────────────────────────────

router.patch('/api/theme-overrides/:symbol', adminKeyMiddleware, async function (req, res) {
  try {
    const symbol = req.params.symbol;
    if (!isValidSymbol(symbol)) {
      return res.status(400).json({ error: 'Invalid symbol (alphanumeric, <=32 chars)' });
    }
    const themeKey = req.body && req.body.themeKey;
    if (!isValidThemeKey(themeKey)) {
      return res
        .status(400)
        .json({ error: 'Body must be { "themeKey": "..." } with a non-empty string (<=128)' });
    }
    const map = { ...(await readOverrides()) };
    map[symbol] = themeKey;
    await writeOverrides(map);
    res.json(map);
  } catch (err) {
    console.error('[theme-overrides] patch failed:', err);
    res.status(500).json({ error: 'Could not patch theme override' });
  }
});

// ── DELETE (remove one key) ────────────────────────────────────

router.delete('/api/theme-overrides/:symbol', adminKeyMiddleware, async function (req, res) {
  try {
    const symbol = req.params.symbol;
    if (!isValidSymbol(symbol)) {
      return res.status(400).json({ error: 'Invalid symbol (alphanumeric, <=32 chars)' });
    }
    const map = { ...(await readOverrides()) };
    delete map[symbol];
    await writeOverrides(map);
    res.json(map);
  } catch (err) {
    console.error('[theme-overrides] delete failed:', err);
    res.status(500).json({ error: 'Could not delete theme override' });
  }
});

export default router;
