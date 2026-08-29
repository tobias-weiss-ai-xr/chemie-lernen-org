/**
 * @jest-environment node
 *
 * Route-level tests for GET /api/curricula/graph — the cytoscape-ready
 * payload behind the curricula index graph visualization.
 *
 * Asserts:
 *  - universities scope returns University/Module nodes + OFFERS edges
 *  - curriculum scope returns Curriculum/Topic/SubTopic + HAS_TOPIC edges
 *  - state filter only emits matching state_abbr nodes
 *  - university filter scopes the query
 *  - q filter narrows nodes
 *  - limit cap keeps payload bounded
 *  - malformed scope falls back to 'all'
 */

import { jest, describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import express from 'express';
import http from 'node:http';

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

jest.unstable_mockModule(
  '../api/services/content.js',
  () => ({
    getFallbackData: () => ({ curricula: [] }),
  }),
  { virtual: false }
);

let app;
let server;
let baseURL;

/** Neo4j node-shaped helper. */
function neoNode(props) {
  return { properties: props };
}

const uniRecord = {
  get: (k) => {
    if (k === 'u')
      return neoNode({
        name: 'University of Cambridge',
        short_code: 'CAM',
        country: 'GB',
        city: 'Cambridge',
        website: 'https://www.cam.ac.uk/',
      });
    if (k === 'm')
      return neoNode({
        module_code: 'NST-IA-MATH',
        module_name: 'Mathematics for Natural Sciences',
        university: 'CAM',
        degree: 'BSc',
        level: 'BSc',
        ects: 12,
        language: 'en',
        url: '',
      });
    if (k === 'entities') return [neoNode({ name: 'Oxidation', kategorie: 'konzept' })];
    return null;
  },
};

const curRecord = {
  get: (k) => {
    const map = {
      stateAbbr: 'BY',
      stateName: 'Bayern',
      curSlug: 'BY-gymnasium',
      schoolType: 'Gymnasium',
      topicTitle: 'Säuren und Basen',
      topicSlug: 'BY-gymnasium-saeuren-basen',
      subs: [neoNode({ title: 'pH-Wert', slug: 'ph-wert' })],
      los: [neoNode({ text: 'kennen den pH-Wert', slug: 'lo-1' })],
    };
    return map[k];
  },
};

beforeAll(async () => {
  const mod = await import('../api/routes/curricula.js');
  const curriculaRouter = mod.default || mod.router || mod;

  app = express();
  app.use(curriculaRouter);
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseURL = `http://127.0.0.1:${server.address().port}`;
});

afterAll(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
});

beforeEach(() => {
  mockSession.run.mockReset();
  mockSession.run.mockResolvedValue({ records: [] });
});

describe('GET /api/curricula/graph', () => {
  test('universities scope returns uni+module nodes and OFFERS edges', async () => {
    mockSession.run.mockResolvedValue({ records: [uniRecord] });
    const res = await fetch(`${baseURL}/api/curricula/graph?scope=universities&limit=100`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.scope).toBe('universities');
    const types = {};
    body.nodes.forEach((n) => {
      types[n.type] = (types[n.type] || 0) + 1;
    });
    expect(types.university).toBe(1);
    expect(types.module).toBe(1);
    expect(body.edges.some((e) => e.type === 'OFFERS')).toBe(true);
    expect(body.edges.some((e) => e.type === 'COVERS')).toBe(true);
    // Only query 1 runs for scope=universities
    expect(mockSession.run).toHaveBeenCalledTimes(1);
  });

  test('curriculum scope returns Curriculum→Topic→SubTopic + objectives', async () => {
    // scope=curriculum runs query 2 (curriculum) then query 3 (bridges).
    mockSession.run.mockResolvedValueOnce({ records: [curRecord] }); // query 2
    mockSession.run.mockResolvedValueOnce({ records: [] }); // query 3 (bridges)
    const res = await fetch(`${baseURL}/api/curricula/graph?scope=curriculum&limit=100`);
    expect(res.status).toBe(200);
    const body = await res.json();
    const types = {};
    body.nodes.forEach((n) => {
      types[n.type] = (types[n.type] || 0) + 1;
    });
    expect(types.curriculum).toBe(1);
    expect(types.topic).toBe(1);
    expect(types.subtopic).toBe(1);
    expect(types.objective).toBe(1);
    expect(body.edges.some((e) => e.type === 'HAS_TOPIC')).toBe(true);
    expect(body.edges.some((e) => e.type === 'HAS_SUBTOPIC')).toBe(true);
    expect(body.edges.some((e) => e.type === 'HAS_LEARNING_OBJECTIVE')).toBe(true);
    // scope=curriculum runs exactly 2 queries (curriculum + bridges)
    expect(mockSession.run).toHaveBeenCalledTimes(2);
  });

  test('state filter is passed to the curriculum query', async () => {
    mockSession.run.mockResolvedValue({ records: [curRecord] });
    await fetch(`${baseURL}/api/curricula/graph?scope=curriculum&state=BY&limit=100`);
    const calls = mockSession.run.mock.calls;
    const curCall = calls.find((c) => c[0].includes('(c:Curriculum)'));
    expect(curCall).toBeDefined();
    expect(curCall[1]).toEqual({ state: 'BY' });
  });

  test('curriculum slug filter is passed to the curriculum query (P2 drill-down)', async () => {
    mockSession.run.mockResolvedValue({ records: [curRecord] });
    await fetch(`${baseURL}/api/curricula/graph?scope=curriculum&curriculum=BY-gymnasium&limit=100`);
    const calls = mockSession.run.mock.calls;
    const curCall = calls.find((c) => c[0].includes('(c:Curriculum)'));
    expect(curCall).toBeDefined();
    expect(curCall[1]).toEqual({ curriculum: 'BY-gymnasium' });
    expect(curCall[0]).toContain('WHERE c.slug = $curriculum');
  });

  test('curriculum filter is part of the cache key (no collision with full scope)', async () => {
    // Full curriculum scope (no curriculum param) caches under a key WITHOUT
    // the curriculum value. A subsequent drill-down with a curriculum param
    // MUST hit Neo4j again — otherwise the cache returns the wrong payload.
    mockSession.run.mockResolvedValue({ records: [curRecord] });
    await fetch(`${baseURL}/api/curricula/graph?scope=curriculum&limit=100`);
    mockSession.run.mockClear();
    const res = await fetch(
      `${baseURL}/api/curricula/graph?scope=curriculum&curriculum=ZZ-drill-regression&limit=100`
    );
    expect(mockSession.run).toHaveBeenCalled();
    const body = await res.json();
    const curNodes = body.nodes.filter((n) => n.type === 'curriculum');
    expect(curNodes).toHaveLength(1);
  });

  test('curriculum filter takes precedence over state filter (P2)', async () => {
    mockSession.run.mockResolvedValue({ records: [curRecord] });
    await fetch(
      `${baseURL}/api/curricula/graph?scope=curriculum&state=BY&curriculum=BY-gymnasium&limit=100`
    );
    const calls = mockSession.run.mock.calls;
    const curCall = calls.find((c) => c[0].includes('(c:Curriculum)'));
    expect(curCall).toBeDefined();
    expect(curCall[0]).toContain('WHERE c.slug = $curriculum');
    expect(curCall[0]).not.toContain('WHERE c.state_abbr = $state');
  });

  test('university filter is passed to the universities query', async () => {
    mockSession.run.mockResolvedValue({ records: [uniRecord] });
    await fetch(`${baseURL}/api/curricula/graph?scope=universities&university=CAM&limit=100`);
    const calls = mockSession.run.mock.calls;
    const uniCall = calls.find((c) => c[0].includes('(u:University)'));
    expect(uniCall).toBeDefined();
    expect(uniCall[1]).toEqual({ university: 'CAM' });
    expect(uniCall[0]).toContain('WHERE u.short_code = $university');
  });

  test('q filter narrows returned nodes', async () => {
    mockSession.run.mockResolvedValue({ records: [curRecord] });
    const res = await fetch(`${baseURL}/api/curricula/graph?scope=curriculum&q=pH-Wert&limit=100`);
    const body = await res.json();
    expect(body.nodes.length).toBeGreaterThan(0);
    expect(body.nodes.every((n) => n.label.toLowerCase().includes('ph-wert'))).toBe(true);
  });

  test('limit cap trims node list and edges', async () => {
    const many = [];
    for (let i = 0; i < 40; i++) {
      many.push({
        get: (k) => {
          if (k === 'u') return neoNode({ name: 'U' + i, short_code: 'U' + i });
          if (k === 'm')
            return neoNode({
              module_code: 'M' + i,
              module_name: 'Module ' + i,
              university: 'U' + i,
            });
          if (k === 'entities') return [];
          return null;
        },
      });
    }
    mockSession.run.mockResolvedValue({ records: many });
    // 80 nodes > limit (clamped to min 50) → payload is bounded to 50.
    const res = await fetch(`${baseURL}/api/curricula/graph?scope=universities&limit=5`);
    const body = await res.json();
    expect(body.meta.nodeCount).toBe(50);
  });

  test('malformed scope falls back to all', async () => {
    mockSession.run.mockResolvedValue({ records: [] });
    const res = await fetch(`${baseURL}/api/curricula/graph?scope=bogus`);
    const body = await res.json();
    expect(body.scope).toBe('all');
    expect(res.status).toBe(200);
  });
});
