// @jest-environment node

import { jest, describe, test, expect, beforeAll } from '@jest/globals';
import express from 'express';
import http from 'node:http';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-for-premium-0123456789abcdef0123';
process.env.LITELLM_URL = process.env.LITELLM_URL || 'http://localhost:4000';
process.env.LITELLM_MODEL = process.env.LITELLM_MODEL || 'gemma-4';

const mockSession = {
  run: jest.fn().mockResolvedValue({ records: [] }),
  close: jest.fn().mockResolvedValue(undefined),
};
const mockDriver = { session: jest.fn(() => mockSession) };

jest.unstable_mockModule(
  '../api/services/neo4j.js',
  () => ({
    getNeo4jDriver: () => mockDriver,
    NEO4J_DATABASE: 'chemie',
    toNumberSafe: (v) => (v == null ? undefined : Number(v)),
    toNeoInt: (v) => ({ toNumber: () => Number(v), low: Number(v), high: 0, isInt: true }),
  }),
  { virtual: false }
);

const authUser = { id: 'premium-1', role: 'premium', tier: 'premium' };

// LiteLLM success stub for the exam simulator. The LLM content is the exam
// object itself (the route wraps it as { exam, generatedAt }).
const examObject = {
  title: 'Testprüfung',
  topic: 'Säuren',
  klassenstufe: '10',
  duration: '45',
  difficulty: 'mittel',
  tasks: [],
  maxPoints: 0,
  gradingGuide: 'x',
};
let fetchCalls = 0;
const realFetch = global.fetch;
global.fetch = async (url, opts) => {
  const target = String(url);
  if (target.includes('litellm') || target.includes('localhost:4000')) {
    fetchCalls++;
    return {
      ok: true,
      status: 200,
      json: async () => ({
        choices: [{ message: { content: JSON.stringify(examObject) } }],
      }),
    };
  }
  return realFetch(url, opts);
};

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

describe('POST /api/premium/exam-simulator', () => {
  test('400 on invalid klassenstufe (validation before LLM)', async () => {
    fetchCalls = 0;
    const res = await fetch(baseURL + '/api/premium/exam-simulator', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic: 'Säuren',
        klassenstufe: '7',
        duration: '45',
        difficulty: 'mittel',
      }),
    });
    expect(res.status).toBe(400);
    // Validation must reject before any LiteLLM call happens.
    expect(fetchCalls).toBe(0);
  });

  test('400 on topic shorter than 2 chars', async () => {
    const res = await fetch(baseURL + '/api/premium/exam-simulator', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic: 'X',
        klassenstufe: '10',
        duration: '45',
        difficulty: 'mittel',
      }),
    });
    expect(res.status).toBe(400);
  });

  test('200 on a mocked LiteLLM success', async () => {
    fetchCalls = 0;
    const res = await fetch(baseURL + '/api/premium/exam-simulator', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic: 'Säuren',
        klassenstufe: '10',
        duration: '45',
        difficulty: 'mittel',
      }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.exam).toBeDefined();
    expect(body.exam.title).toBe('Testprüfung');
    expect(fetchCalls).toBe(1);
  });
});
