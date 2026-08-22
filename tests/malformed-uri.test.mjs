/**
 * @jest-environment node
 *
 * Malformed percent-encoding (e.g. /%e4) must return 400 — not throw an
 * uncaught URIError inside an Express 4 async handler (which would hang
 * the request). Regression test for the decodeURIComponent hardening on
 * the kg-data + curricula routes.
 */

import { jest, describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import express from 'express';
import http from 'node:http';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-for-urldecode-0123456789abcdef';
process.env.LITELLM_URL = process.env.LITELLM_URL || 'http://localhost:4000';

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

let app;
let server;
let baseURL;

beforeAll(async () => {
  const kgData = await import('../api/routes/kg-data.js');
  const curricula = await import('../api/routes/curricula.js');

  app = express();
  app.use(express.json());
  app.use(kgData.default || kgData.router || kgData);
  app.use(curricula.default || curricula.router || curricula);
  // Mirror the production global error handler: URIError from Express's
  // router (malformed percent-encoding is rejected BEFORE any handler runs)
  // must surface as a 400 JSON, not a hang or an HTML 500.
  app.use((err, req, res, next) => {
    if (err instanceof URIError) {
      return res.status(400).json({ error: 'Ungültige URL-Kodierung' });
    }
    next(err);
  });

  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  baseURL = `http://127.0.0.1:${server.address().port}`;
});

afterAll(async () => {
  await new Promise((resolve) => server.close(resolve));
});

describe('malformed percent-encoding handling', () => {
  const badPaths = [
    '/api/kg-data/entity/%e4',
    '/api/curricula/topic/%e4/articles',
    '/api/curricula/objective/%e4/articles',
    '/api/entities/%e4/curricula',
  ];

  test.each(badPaths)('GET %s returns 400 instead of hanging/500', async (path) => {
    const res = await fetch(baseURL + path);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Ungültige URL-Kodierung');
  });

  test('valid encoded names still work', async () => {
    const res = await fetch(baseURL + '/api/kg-data/entity/' + encodeURIComponent('Säure'));
    // 404 (entity not found) proves decoding succeeded and the query ran.
    expect([404, 503]).toContain(res.status);
  });
});