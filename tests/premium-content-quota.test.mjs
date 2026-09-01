/**
 * @vitest-environment node
 *
 * Route-level LLM cost-quota tests for the premium generator routes.
 *
 * POST /api/premium/lesson-plan and /api/premium/worksheet both hit
 * LiteLLM per request. They are premium-gated (requirePremium) but were
 * otherwise unbounded — a premium user could generate unlimited lesson
 * plans / worksheets and rack up unbounded LLM cost. This test verifies
 * the daily scoped quota (10 / day / user) returns 429 past the limit.
 *
 * The LLM call itself is stubbed to reject: requests 1..N pass the quota
 * and fail with 502/500 (proving the quota check ran), request N+1 must
 * return 429 BEFORE any fetch happens.
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

// LLM stub: any generation call fails loudly. Scoped to the LiteLLM URL so
// the test's own HTTP requests pass through the real fetch.
let fetchCalls = 0;
const realFetch = global.fetch;
global.fetch = async (url, opts) => {
  const target = String(url);
  if (target.includes('litellm') || target.includes('localhost:4000')) {
    fetchCalls++;
    throw new Error('LLM unreachable (test stub)');
  }
  return realFetch(url, opts);
};

const authUser = { id: 'premium-1', role: 'premium', tier: 'premium' };

let app;
let server;
let baseURL;

beforeAll(async () => {
  const mod = await import('../api/routes/premium-content.js');
  const premiumRouter = mod.default || mod.router || mod;

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

describe('premium generator LLM cost quota', () => {
  test('lesson-plan: 10 requests allowed (LLM stubbed), 11th is 429', async () => {
    fetchCalls = 0;
    const statuses = [];
    for (let i = 0; i < 11; i++) {
      const res = await fetch(baseURL + '/api/premium/lesson-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: 'Säuren und Basen' }),
      });
      statuses.push(res.status);
      await res.json().catch(() => null);
    }
    // Quota passes for the first 10 (LLM stub fails → 500), then 429.
    expect(statuses.slice(0, 10).every((s) => s === 500)).toBe(true);
    expect(statuses[10]).toBe(429);
    // The 11th request must never have reached the LLM stub.
    expect(fetchCalls).toBe(10);
  });

  test('worksheet: same 10/day bound, independent scope', async () => {
    fetchCalls = 0;
    const statuses = [];
    for (let i = 0; i < 11; i++) {
      const res = await fetch(baseURL + '/api/premium/worksheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: 'Redoxreaktionen' }),
      });
      statuses.push(res.status);
      await res.json().catch(() => null);
    }
    expect(statuses.slice(0, 10).every((s) => s === 500)).toBe(true);
    expect(statuses[10]).toBe(429);
    expect(fetchCalls).toBe(10);
  });
});
