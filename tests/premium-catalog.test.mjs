/**
 * @vitest-environment node
 */

import { vi, describe, test, expect, beforeAll } from 'vitest';
import express from 'express';
import http from 'node:http';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-for-premium-0123456789abcdef0123';
process.env.LITELLM_URL = process.env.LITELLM_URL || 'http://localhost:4000';
process.env.LITELLM_MODEL = process.env.LITELLM_MODEL || 'gemma-4';

const mockSession = {
  run: vi.fn().mockResolvedValue({ records: [] }),
  close: vi.fn().mockResolvedValue(undefined),
};
const mockDriver = { session: vi.fn(() => mockSession) };

vi.mock(
  '../api/services/neo4j.js',
  () => ({
    getNeo4jDriver: () => mockDriver,
    NEO4J_DATABASE: 'chemie',
    toNumberSafe: (v) => (v == null ? undefined : Number(v)),
    toNeoInt: (v) => ({ toNumber: () => Number(v), low: Number(v), high: 0, isInt: true }),
  })
);

const authUser = { id: 'premium-1', role: 'premium', tier: 'premium' };

let app;
let server;
let baseURL;
let premiumRouter;

beforeAll(async () => {
  const mod = await import('../api/routes/premium-content.js');
  premiumRouter = mod.default || mod.router || mod;

  app = express();
  app.use(express.json());
  app.use((req, res, next) => {
    req.user = authUser;
    next();
  });
  app.use(premiumRouter);

  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  baseURL = `http://127.0.0.1:${server.address().port}`;
});

afterAll(async () => {
  await new Promise((resolve) => server.close(resolve));
});

describe('GET /api/premium/catalog', () => {
  test('returns an array; each item has id/title/type and tier in [free,pro,max]', async () => {
    const res = await fetch(baseURL + '/api/premium/catalog');
    expect(res.status).toBe(200);
    const catalog = await res.json();
    expect(Array.isArray(catalog)).toBe(true);
    expect(catalog.length).toBeGreaterThan(0);
    for (const item of catalog) {
      expect(typeof item.id).toBe('string');
      expect(typeof item.title).toBe('string');
      expect(typeof item.type).toBe('string');
      expect(['free', 'pro', 'max']).toContain(item.tier);
    }
  });

  test('is read-only JSON (no auth → 401)', async () => {
    const anonApp = express();
    anonApp.use(express.json());
    anonApp.use(premiumRouter);
    const anonServer = http.createServer(anonApp);
    await new Promise((resolve) => anonServer.listen(0, resolve));
    const anonURL = `http://127.0.0.1:${anonServer.address().port}`;
    const res = await fetch(anonURL + '/api/premium/catalog');
    expect(res.status).toBe(401);
    await new Promise((resolve) => anonServer.close(resolve));
  });
});
