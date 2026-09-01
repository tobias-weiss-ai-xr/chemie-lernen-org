/**
 * @vitest-environment node
 *
 * Unit test: GET/PUT theme-overrides route with auth.js + neo4j mocked.
 *
 * Verifies:
 *   - GET /api/theme-overrides returns the stored map ({} if none)
 *   - PUT /api/theme-overrides replaces the stored map; returns it
 *   - PUT validates body: keys and values must be non-empty strings
 *   - Admin key enforcement: 401 missing/wrong key, 503 unconfigured
 */

import { vi, describe, test, expect, beforeAll, afterAll, afterEach } from 'vitest';
import express from 'express';
import http from 'node:http';
import { unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

// ── Mocks (must appear before dynamic import) ───────────────────

vi.mock(
  '../api/auth.js',
  () => ({
    adminKeyMiddleware: (req, res, next) => {
      const key = process.env.ADMIN_API_KEY;
      if (!key) return res.status(503).json({ error: 'Admin API key not configured' });
      if (req.headers['x-api-key'] !== key) return res.status(401).json({ error: 'Unauthorized' });
      next();
    },
  })
);

vi.mock(
  '../api/services/neo4j.js',
  () => ({
    getNeo4jDriver: () => ({
      session: () => ({
        run: vi.fn().mockResolvedValue({ records: [] }),
        close: vi.fn().mockResolvedValue(undefined),
      }),
    }),
  })
);

// ── Fixture ────────────────────────────────────────────────────

process.env.ADMIN_API_KEY = 'test-admin-key-unit-TO3';
process.env.THEME_OVERRIDES_FILE = join(tmpdir(), 'theme-overrides-unit.json');

const DATA_FILE = process.env.THEME_OVERRIDES_FILE;

const adminHeaders = (overrides = {}) => ({
  'x-api-key': process.env.ADMIN_API_KEY,
  'Content-Type': 'application/json',
  ...overrides,
});

let app;
let server;
let baseURL;

beforeAll(async () => {
  const mod = await import('../api/routes/theme-overrides.js');
  const router = mod.default || mod;

  app = express();
  app.use(express.json());
  app.use(router);

  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  baseURL = `http://127.0.0.1:${server.address().port}`;
});

afterAll(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
});

afterEach(async () => {
  try {
    await unlink(DATA_FILE);
  } catch {
    // File may not exist — that's fine.
  }
});

// ── GET /api/theme-overrides ───────────────────────────────────

describe('GET /api/theme-overrides', () => {
  test('returns empty object when no overrides stored', async () => {
    const res = await fetch(`${baseURL}/api/theme-overrides`, { headers: adminHeaders() });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({});
  });

  test('returns stored overrides after a PUT', async () => {
    const overrides = { H: 'cosmic', Fe: 'forge', Au: 'royal' };

    await fetch(`${baseURL}/api/theme-overrides`, {
      method: 'PUT',
      headers: adminHeaders(),
      body: JSON.stringify(overrides),
    });

    const res = await fetch(`${baseURL}/api/theme-overrides`, { headers: adminHeaders() });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(overrides);
  });

  test('rejects missing x-api-key with 401', async () => {
    const res = await fetch(`${baseURL}/api/theme-overrides`);
    expect(res.status).toBe(401);
  });

  test('rejects wrong x-api-key with 401', async () => {
    const res = await fetch(`${baseURL}/api/theme-overrides`, {
      headers: { 'x-api-key': 'wrong-key' },
    });
    expect(res.status).toBe(401);
  });
});

// ── PUT /api/theme-overrides ───────────────────────────────────

describe('PUT /api/theme-overrides', () => {
  test('stores and returns the provided map', async () => {
    const overrides = { H: 'cosmic', Fe: 'forge' };
    const res = await fetch(`${baseURL}/api/theme-overrides`, {
      method: 'PUT',
      headers: adminHeaders(),
      body: JSON.stringify(overrides),
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(overrides);
  });

  test('fully replaces the previous map (not merge)', async () => {
    await fetch(`${baseURL}/api/theme-overrides`, {
      method: 'PUT',
      headers: adminHeaders(),
      body: JSON.stringify({ H: 'cosmic', Fe: 'forge' }),
    });

    const res = await fetch(`${baseURL}/api/theme-overrides`, {
      method: 'PUT',
      headers: adminHeaders(),
      body: JSON.stringify({ Au: 'royal' }),
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ Au: 'royal' });

    const getRes = await fetch(`${baseURL}/api/theme-overrides`, { headers: adminHeaders() });
    expect(await getRes.json()).toEqual({ Au: 'royal' });
  });

  test('accepts an empty map', async () => {
    const res = await fetch(`${baseURL}/api/theme-overrides`, {
      method: 'PUT',
      headers: adminHeaders(),
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({});
  });

  test('rejects a string body with 400', async () => {
    const res = await fetch(`${baseURL}/api/theme-overrides`, {
      method: 'PUT',
      headers: adminHeaders(),
      body: JSON.stringify('not-an-object'),
    });
    expect(res.status).toBe(400);
  });

  test('rejects an array body with 400', async () => {
    const res = await fetch(`${baseURL}/api/theme-overrides`, {
      method: 'PUT',
      headers: adminHeaders(),
      body: JSON.stringify(['H', 'cosmic']),
    });
    expect(res.status).toBe(400);
  });

  test('rejects an empty-string key with 400', async () => {
    const res = await fetch(`${baseURL}/api/theme-overrides`, {
      method: 'PUT',
      headers: adminHeaders(),
      body: JSON.stringify({ '': 'cosmic' }),
    });
    expect(res.status).toBe(400);
  });

  test('rejects an empty-string value with 400', async () => {
    const res = await fetch(`${baseURL}/api/theme-overrides`, {
      method: 'PUT',
      headers: adminHeaders(),
      body: JSON.stringify({ H: '' }),
    });
    expect(res.status).toBe(400);
  });

  test('rejects a numeric value with 400', async () => {
    const res = await fetch(`${baseURL}/api/theme-overrides`, {
      method: 'PUT',
      headers: adminHeaders(),
      body: JSON.stringify({ H: 42 }),
    });
    expect(res.status).toBe(400);
  });

  test('rejects missing x-api-key with 401', async () => {
    const res = await fetch(`${baseURL}/api/theme-overrides`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ H: 'cosmic' }),
    });
    expect(res.status).toBe(401);
  });
});

// ── Admin key not configured ──────────────────────────────────

describe('admin key not configured', () => {
  test('returns 503 when ADMIN_API_KEY is unset', async () => {
    const saved = process.env.ADMIN_API_KEY;
    delete process.env.ADMIN_API_KEY;

    const res = await fetch(`${baseURL}/api/theme-overrides`);
    expect(res.status).toBe(503);

    process.env.ADMIN_API_KEY = saved;
  });
});
