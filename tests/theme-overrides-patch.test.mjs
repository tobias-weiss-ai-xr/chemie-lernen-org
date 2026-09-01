/**
 * @vitest-environment node
 *
 * Tests for PATCH/DELETE single-key endpoints on /api/theme-overrides.
 * Auth + neo4j are mocked; the route uses an isolated temp data file.
 *
 * Verifies:
 *   - PATCH upserts one key; GET reflects it
 *   - PATCH is conflict-free: two different keys both persist (no clobber)
 *   - DELETE removes one key (idempotent)
 *   - validation: bad symbol / missing-or-empty themeKey → 400
 *   - admin key enforced (401 missing/wrong, 503 unconfigured)
 */

import { vi, describe, test, expect, beforeAll, afterAll, afterEach } from 'vitest';
import express from 'express';
import http from 'node:http';
import { unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

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
      session: () => ({ run: vi.fn().mockResolvedValue({ records: [] }), close: vi.fn() }),
    }),
  })
);

process.env.ADMIN_API_KEY = 'test-admin-key-patch-TO6';
process.env.THEME_OVERRIDES_FILE = join(tmpdir(), 'theme-overrides-patch.json');

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
    /* not present — fine */
  }
});

describe('PATCH single key', () => {
  test('upserts a key and GET reflects it', async () => {
    const patch = await fetch(`${baseURL}/api/theme-overrides/H`, {
      method: 'PATCH',
      headers: adminHeaders(),
      body: JSON.stringify({ themeKey: 'cosmic' }),
    });
    expect(patch.status).toBe(200);
    const get = await fetch(`${baseURL}/api/theme-overrides`, { headers: adminHeaders() });
    expect(await get.json()).toEqual({ H: 'cosmic' });
  });

  test('is conflict-free across different keys (no clobber)', async () => {
    await fetch(`${baseURL}/api/theme-overrides/H`, {
      method: 'PATCH',
      headers: adminHeaders(),
      body: JSON.stringify({ themeKey: 'cosmic' }),
    });
    await fetch(`${baseURL}/api/theme-overrides/Fe`, {
      method: 'PATCH',
      headers: adminHeaders(),
      body: JSON.stringify({ themeKey: 'forge' }),
    });
    const get = await fetch(`${baseURL}/api/theme-overrides`, { headers: adminHeaders() });
    expect(await get.json()).toEqual({ H: 'cosmic', Fe: 'forge' });
  });
});

describe('DELETE single key', () => {
  test('removes a key (idempotent)', async () => {
    await fetch(`${baseURL}/api/theme-overrides/H`, {
      method: 'PATCH',
      headers: adminHeaders(),
      body: JSON.stringify({ themeKey: 'cosmic' }),
    });
    const del = await fetch(`${baseURL}/api/theme-overrides/H`, {
      method: 'DELETE',
      headers: adminHeaders(),
    });
    expect(del.status).toBe(200);
    const get = await fetch(`${baseURL}/api/theme-overrides`, { headers: adminHeaders() });
    expect(await get.json()).toEqual({});
  });
});

describe('validation', () => {
  test('PATCH rejects a non-alphanumeric symbol with 400', async () => {
    const res = await fetch(`${baseURL}/api/theme-overrides/a*b`, {
      method: 'PATCH',
      headers: adminHeaders(),
      body: JSON.stringify({ themeKey: 'cosmic' }),
    });
    expect(res.status).toBe(400);
  });

  test('PATCH rejects a missing themeKey with 400', async () => {
    const res = await fetch(`${baseURL}/api/theme-overrides/H`, {
      method: 'PATCH',
      headers: adminHeaders(),
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
  });

  test('PATCH rejects an empty themeKey with 400', async () => {
    const res = await fetch(`${baseURL}/api/theme-overrides/H`, {
      method: 'PATCH',
      headers: adminHeaders(),
      body: JSON.stringify({ themeKey: '' }),
    });
    expect(res.status).toBe(400);
  });
});

describe('admin key enforcement', () => {
  test('PATCH rejects missing key with 401', async () => {
    const res = await fetch(`${baseURL}/api/theme-overrides/H`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ themeKey: 'cosmic' }),
    });
    expect(res.status).toBe(401);
  });

  test('DELETE rejects missing key with 401', async () => {
    const res = await fetch(`${baseURL}/api/theme-overrides/H`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });
    expect(res.status).toBe(401);
  });

  test('PATCH returns 503 when ADMIN_API_KEY is unset', async () => {
    const saved = process.env.ADMIN_API_KEY;
    delete process.env.ADMIN_API_KEY;
    const res = await fetch(`${baseURL}/api/theme-overrides/H`, {
      method: 'PATCH',
      headers: adminHeaders(),
      body: JSON.stringify({ themeKey: 'cosmic' }),
    });
    expect(res.status).toBe(503);
    process.env.ADMIN_API_KEY = saved;
  });
});
