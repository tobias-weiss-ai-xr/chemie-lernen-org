/**
 * @jest-environment node
 *
 * Route-level authorization tests for the assessment API.
 *
 * Verifies the role/user-boundary guards:
 *  - learners may not read another user's results (?learnerId)
 *  - class-results is teacher/admin-only
 *  - feedback override is teacher/admin-only
 *  - /api/assessment/sync only persists the caller's own rows
 *
 * Runs against a real Express router with auth stubbed to inject req.user.
 */

import { jest, describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import express from 'express';
import http from 'node:http';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-for-security';
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
  }),
  { virtual: false }
);

// Stub the authenticated user (swapped by role per request).
let authUser = { id: 'user-123', role: 'student' };

let app;
let server;
let baseURL;
let getSession;

beforeAll(async () => {
  const mod = await import('../api/routes/exercises.js');
  const exercisesRouter = mod.default || mod.router || mod;
  getSession = (await import('../api/services/session.js')).getSession;

  app = express();
  app.use(express.json());
  app.use((req, res, next) => {
    req.user = authUser;
    next();
  });
  app.use(exercisesRouter);

  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseURL = `http://127.0.0.1:${server.address().port}`;
});

afterAll(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
});

beforeEach(() => {
  authUser = { id: 'user-123', role: 'student' };
  mockSession.run.mockReset();
  mockSession.run.mockResolvedValue({ records: [] });
});

describe('exercise route authorization', () => {
  test('GET results: learnerId is forbidden for students, allowed for teachers', async () => {
    authUser = { id: 'user-123', role: 'student' };
    let res = await fetch(`${baseURL}/api/assessment/results?learnerId=other-user`);
    expect(res.status).toBe(403);

    authUser = { id: 'teacher-1', role: 'teacher' };
    res = await fetch(`${baseURL}/api/assessment/results?learnerId=other-user`);
    expect(res.status).toBe(200);
  });

  test('GET class-results: teacher/admin only', async () => {
    let res = await fetch(`${baseURL}/api/assessment/class-results?curriculumSlug=bw-gymnasium`);
    expect(res.status).toBe(403);

    authUser = { id: 'teacher-1', role: 'teacher' };
    res = await fetch(`${baseURL}/api/assessment/class-results?curriculumSlug=bw-gymnasium`);
    expect(res.status).toBe(200);

    authUser = { id: 'admin-1', role: 'admin' };
    res = await fetch(`${baseURL}/api/assessment/class-results?curriculumSlug=bw-gymnasium`);
    expect(res.status).toBe(200);
  });

  test('PUT feedback override: teacher/admin only', async () => {
    let res = await fetch(`${baseURL}/api/assessment/feedback/fb-1`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ teacherNote: 'ok' }),
    });
    expect(res.status).toBe(403);

    authUser = { id: 'teacher-1', role: 'teacher' };
    res = await fetch(`${baseURL}/api/assessment/feedback/fb-1`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ teacherNote: 'ok' }),
    });
    // Not 403 — the gate passes; store mock returns "not found" (404).
    expect(res.status).not.toBe(403);
  });

  test("POST sync only persists the caller's own rows", async () => {
    const batch = [
      { assessmentId: 'own-1', userId: 'user-123', topic: 'Oxidation' },
      { assessmentId: 'for-1', userId: 'victim-99', topic: 'Säuren' },
    ];
    const res = await fetch(`${baseURL}/api/assessment/sync`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ batch }),
    });
    expect(res.status).toBe(200);

    // Exactly one MERGE executed — the foreign row is filtered out.
    expect(mockSession.run).toHaveBeenCalledTimes(1);
    const [, params] = mockSession.run.mock.calls[0];
    expect(params.assessmentId).toBe('own-1');
  });

  test('grade persists the Assessment + GradedAnswer to the knowledge graph', async () => {
    authUser = { id: 'user-123', role: 'student' };

    // Seed the in-memory session so the grade route can look the exercise up.
    const session = getSession('user-123');
    session.exercises = [
      {
        id: 'ex-1',
        type: 'mcq',
        question: 'Was ist Oxidation?',
        options: [
          { id: 'A', text: 'Abgabe von Elektronen' },
          { id: 'B', text: 'Aufnahme von Elektronen' },
        ],
        correctAnswer: 'A',
        explanation: 'Oxidation ist die Abgabe von Elektronen.',
        learningObjective: { slug: 'oxidation', title: 'Oxidation' },
        topic: 'Oxidation',
        difficulty: 'mittel',
      },
    ];

    // Store functions read .properties off the returned node.
    mockSession.run.mockResolvedValue({ records: [{ get: () => ({ properties: { id: 'n1' } }) }] });

    const res = await fetch(`${baseURL}/api/exercises/grade`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ exerciseId: 'ex-1', answer: 'A' }),
    });
    expect(res.status).toBe(200);

    const queries = mockSession.run.mock.calls.map((c) => c[0]);
    expect(queries.some((q) => q.includes('CREATE (a:Assessment'))).toBe(true);
    expect(queries.some((q) => q.includes('CREATE (g:GradedAnswer'))).toBe(true);
  });
});
