/**
 * API-Contract-Tests: /api/curricula/* (UXF-042/043-Datenkette)
 *
 * Regression-Guards aus der Bug-Session 2026-09-08:
 *  - Der /list-Query zählt nur den kanonischen Schema-B-Baum
 *    (HAS_SUBTOPIC/FULFILLS) — das Legacy-Schema (HAS_TOPIC, Alt-Import)
 *    spiegelt dieselben Inhalte 1:1 und inflatierte die Counts ~2x.
 *    (Ursprünglich invers gebaut: "BEIDE Schemata matchen" gegen leere
 *    Bundesländer; seit allen 16 Länder unter Schema B importiert sind,
 *    schützt die einschränkende Variante vor Phantom-Zählungen.)
 *  - by-state nutzt Schema B (HAS_SUBTOPIC/FULFILLS) via curricula-mapper.
 *  - MAPPER-Caps: OBJECTIVES_CAP=8, ENTITIES_CAP=12 (UI verlässt sich drauf).
 *  - /list-Invariante: kein State wird je mit leerem curricula-Array
 *    ausgeliefert (Dropdown/Nav-Karte ohne Inhalt).
 *
 * Neo4j-Driver ist gemockt (kein DB-Zugriff im Unit-Test); der echte
 * Router + echte curricula-mapper.cjs laufen — Contract, nicht Mock-theater.
 *
 * @vitest-environment node
 */

import { vi, describe, test, expect, beforeEach, afterEach } from 'vitest';
import express from 'express';

// --- Neo4j-Driver-Mock -------------------------------------------------
const mockSessionRun = vi.fn();
const mockSessionClose = vi.fn().mockResolvedValue(undefined);
const fakeSession = { run: mockSessionRun, close: mockSessionClose };
const fakeDriver = { session: vi.fn(() => fakeSession) };

vi.mock('../../api/services/neo4j.js', () => ({
  getNeo4jDriver: () => fakeDriver,
  NEO4J_DATABASE: 'chemie',
  toNumberSafe: (v) => {
    if (v == null) return 0;
    if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
    if (typeof v?.toNumber === 'function') return v.toNumber();
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  },
}));

vi.mock('../../api/services/content.js', () => ({
  getFallbackData: vi.fn(() => ({ curricula: [] })),
}));

const { default: router, __clearCurriculaCache } = await import(
  '../../api/routes/curricula.js'
);
const curriculaMapper = (await import('../../api/curricula-mapper.cjs')).default;
const { getFallbackData } = await import('../../api/services/content.js');

// Fake Neo4j Integer (Interface: .toNumber())
const int = (n) => ({ toNumber: () => n });
const record = (map) => ({ get: (k) => map[k] });

// --- Express-Testserver ------------------------------------------------
let server;
let baseUrl;

beforeEach(() => {
  vi.clearAllMocks();
  __clearCurriculaCache(); // Perf-Cache würde mockSessionRun-Zählungen aushebeln
  const app = express();
  app.disable('x-powered-by');
  app.use('/', router);
  server = app.listen(0);
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

afterEach(() => {
  return new Promise((resolve) => server.close(resolve));
});

// ============================================================
// GET /api/curricula/list
// ============================================================
describe('GET /api/curricula/list', () => {
  const LIST_RECORDS = [
    record({
      state: 'BW',
      stateName: 'Baden-Württemberg',
      slug: 'bw-sek-i',
      schoolType: 'Sek I',
      grade: '5-10',
      topicCount: int(58),
      objectiveCount: int(442),
    }),
    record({
      state: 'BW',
      stateName: 'Baden-Württemberg',
      slug: 'bw-sek-ii',
      schoolType: 'Sek II',
      grade: '11-13',
      topicCount: int(12),
      objectiveCount: int(90),
    }),
    record({
      state: 'SL',
      stateName: 'Saarland',
      slug: 'sl-sek-i',
      schoolType: 'Sek I',
      grade: null,
      topicCount: int(13),
      objectiveCount: int(48),
    }),
  ];

  test('gruppiert nach State mit korrektem Shape (source/states/count)', async () => {
    mockSessionRun.mockResolvedValue({ records: LIST_RECORDS });

    const res = await fetch(`${baseUrl}/api/curricula/list`);
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.source).toBe('neo4j');
    expect(body.count).toBe(3); // Summe aller Curricula, nicht der States
    expect(body.states).toHaveLength(2);

    const bw = body.states.find((s) => s.state === 'BW');
    expect(bw.stateName).toBe('Baden-Württemberg');
    expect(bw.curricula).toHaveLength(2);
    expect(bw.curricula[0]).toEqual({
      slug: 'bw-sek-i',
      schoolType: 'Sek I',
      grade: '5-10',
      topicCount: 58, // via .toNumber()
      objectiveCount: 442,
    });
  });

  test('REGRESSION: Query zählt nur den kanonischen Schema-B-Baum (SubTopic/FULFILLS)', async () => {
    mockSessionRun.mockResolvedValue({ records: [] });
    await fetch(`${baseUrl}/api/curricula/list`);

    expect(mockSessionRun).toHaveBeenCalledTimes(1);
    const query = mockSessionRun.mock.calls[0][0];
    // DATA-2026-09-08: Das Legacy-Schema (HAS_TOPIC + HAS_LEARNING_OBJECTIVE,
    // Alt-Import) spiegelt die SubTopics 1:1 und ließ die Zählungen ~2x zu
    // hoch ausfallen (RP 1634 statt 811). by-state rendert ebenfalls nur
    // Schema B — die list-Query muss konsistent bleiben.
    expect(query).toMatch(/HAS_SUBTOPIC/);
    expect(query).not.toMatch(/HAS_TOPIC\|/);
    expect(query).toMatch(/:SubTopic/);
    expect(query).toMatch(/FULFILLS/);
    expect(query).not.toMatch(/\[:HAS_LEARNING_OBJECTIVE/);
    expect(query).not.toMatch(/\[:HAS_TOPIC/);
    // DISTINCT-Zählung gegen Duplikat-Knoten (inflated counts Bug)
    expect(query).toMatch(/count\(DISTINCT t\)/);
    expect(query).toMatch(/count\(DISTINCT lo\)/);
  });

  test('INVARIANTE: kein State mit leerem curricula-Array möglich', async () => {
    mockSessionRun.mockResolvedValue({ records: LIST_RECORDS });
    const body = await (await fetch(`${baseUrl}/api/curricula/list`)).json();

    for (const s of body.states) {
      expect(s.curricula.length).toBeGreaterThan(0);
    }
  });

  test('Neo4j-Fehler → Fallback-Shape (source:fallback)', async () => {
    mockSessionRun.mockRejectedValue(new Error('ServiceUnavailable'));
    getFallbackData.mockReturnValue({
      curricula: [
        {
          name: 'bw-lehrplan-alt',
          curriculumMeta: {
            state: 'BW',
            school_type: 'Sek I',
            grade: '5-10',
            objective_count: 12,
          },
        },
      ],
    });

    const res = await fetch(`${baseUrl}/api/curricula/list`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.source).toBe('fallback');
    expect(body.states[0].state).toBe('BW');
    expect(body.states[0].curricula[0].slug).toBe('bw-lehrplan-alt');
  });

  test('Neo4j-Fehler + Fallback wirft → 503', async () => {
    mockSessionRun.mockRejectedValue(new Error('ServiceUnavailable'));
    getFallbackData.mockImplementation(() => {
      throw new Error('no data');
    });

    const res = await fetch(`${baseUrl}/api/curricula/list`);
    expect(res.status).toBe(503);
  });
});

// ============================================================
// GET /api/curricula/by-state/:state
// ============================================================
describe('GET /api/curricula/by-state/:state', () => {
  const TOPIC_RECORD = (slug, title, objectives, entities, count) =>
    record({
      curriculumSlug: 'bw-sek-i',
      schoolType: 'Sek I',
      slug,
      title,
      grade: '8',
      objectiveCount: count ?? int(objectives.length),
      objectives,
      entities,
    });

  test('PERF-CACHE: 2. identischer Request kommt aus dem Cache (kein 2. Neo4j-Call)', async () => {
    mockSessionRun.mockResolvedValue({
      records: [TOPIC_RECORD('thema-1', 'Thema 1', ['LZ'], [], undefined)],
    });
    await fetch(`${baseUrl}/api/curricula/by-state/BW`);
    await fetch(`${baseUrl}/api/curricula/by-state/BW`);

    expect(mockSessionRun).toHaveBeenCalledTimes(1); // 2. Request → Cache-Hit
  });

  test('nutzt curriculaMapper.buildByStateQuery + Schema B (SubTopic/FULFILLS)', async () => {
    mockSessionRun.mockResolvedValue({ records: [] });
    await fetch(`${baseUrl}/api/curricula/by-state/BW`);

    const [query, params] = mockSessionRun.mock.calls[0];
    expect(params).toEqual({ state: 'BW' });
    // Die exakt von buildByStateQuery() erzeugte Query (echter Mapper, kein Mock)
    expect(query).toBe(curriculaMapper.buildByStateQuery('BW'));
    expect(query).toContain('HAS_SUBTOPIC');
    expect(query).toContain('FULFILLS');
    expect(query).toContain('state_abbr: $state');
  });

  test('lowercase-Param wird zu Uppercase normalisiert', async () => {
    mockSessionRun.mockResolvedValue({ records: [] });
    const res = await fetch(`${baseUrl}/api/curricula/by-state/sl`);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.state).toBe('SL');
    expect(mockSessionRun.mock.calls[0][1]).toEqual({ state: 'SL' });
  });

  test('ungültiger State-Code → 400 (1 Buchstabe)', async () => {
    const res = await fetch(`${baseUrl}/api/curricula/by-state/B`);
    expect(res.status).toBe(400);
  });

  test('ungültiger State-Code → 400 (3 Buchstaben)', async () => {
    const res = await fetch(`${baseUrl}/api/curricula/by-state/BWX`);
    expect(res.status).toBe(400);
    expect(mockSessionRun).not.toHaveBeenCalled();
  });

  test('MAPPER-CAPS: objectives max 8, entities dedupliziert + max 12, Gesamtsummen korrekt', async () => {
    const manyObjectives = Array.from({ length: 15 }, (_, i) => `Lernziel ${i + 1}`);
    const entities = [
      'Säure',
      'Base',
      'Säure', // Duplikat → muss dedupliziert werden
      ...Array.from({ length: 20 }, (_, i) => `Stoff ${i + 1}`),
    ]; // 22 unique → cap 12
    mockSessionRun.mockResolvedValue({
      records: [
        TOPIC_RECORD('säuren-und-basen', 'Säuren und Basen', manyObjectives, entities, int(15)),
        TOPIC_RECORD('atombau', 'Atombau', ['Protonen', 'Neutronen'], ['Atom'], int(2)),
      ],
    });

    const res = await fetch(`${baseUrl}/api/curricula/by-state/BW`);
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.source).toBe('neo4j');
    expect(body.topicCount).toBe(2);
    expect(body.totalObjectives).toBe(17); // 15 + 2 (vor Cap — reale Gesamtzahl)
    expect(body.topics[0].objectiveCount).toBe(15); // reale Zahl, nicht der Cap
    expect(body.topics[0].objectives).toHaveLength(8); // OBJECTIVES_CAP
    expect(body.topics[0].objectives[0]).toBe('Lernziel 1');
    expect(body.topics[0].entities).toHaveLength(12); // ENTITIES_CAP nach Dedup
    expect(body.topics[0].entities.filter((e) => e === 'Säure')).toHaveLength(1);
    expect(body.topics[1].objectives).toEqual(['Protonen', 'Neutronen']);
  });

  test('Neo4j-Fehler → Fallback-Shape mit leeren objectives/entities', async () => {
    mockSessionRun.mockRejectedValue(new Error('Session expired'));
    getFallbackData.mockReturnValue({
      curricula: [
        {
          name: 'bw-lehrplan-alt',
          curriculumMeta: { state: 'BW', school_type: 'Sek I', grade: '5-10', objective_count: 7 },
        },
        {
          name: 'sl-lehrplan-alt',
          curriculumMeta: { state: 'SL', school_type: 'Sek I', grade: null, objective_count: 3 },
        },
      ],
    });

    const res = await fetch(`${baseUrl}/api/curricula/by-state/bw`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.source).toBe('fallback');
    expect(body.state).toBe('BW');
    expect(body.topicCount).toBe(1);
    expect(body.totalObjectives).toBe(7);
    expect(body.topics[0].objectives).toEqual([]);
    expect(body.topics[0].entityCount).toBe(0);
  });
});

// ============================================================
// curricula-mapper (Public Contract)
// ============================================================
describe('curricula-mapper Contract', () => {
  test('Caps: OBJECTIVES_CAP=8, ENTITIES_CAP=12', () => {
    expect(curriculaMapper.OBJECTIVES_CAP).toBe(8);
    expect(curriculaMapper.ENTITIES_CAP).toBe(12);
  });

  test('mapCurriculumTopics akzeptiert Plain-Objects (ohne .get())', () => {
    const topics = curriculaMapper.mapCurriculumTopics([
      {
        slug: 'chemie-8',
        title: 'Chemie 8',
        grade: '8',
        schoolType: 'Sek I',
        objectiveCount: 3,
        objectives: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'],
        entities: ['x'],
      },
    ]);
    expect(topics).toHaveLength(1);
    expect(topics[0].slug).toBe('chemie-8');
    expect(topics[0].objectives).toHaveLength(8); // cap greift auch hier
  });

  test('mapCurriculumTopics ist robust gegen null/missing Felder', () => {
    const topics = curriculaMapper.mapCurriculumTopics([
      record({ slug: null, title: null, grade: null, schoolType: null }),
    ]);
    expect(topics[0].objectiveCount).toBe(0);
    expect(topics[0].objectives).toEqual([]);
    expect(topics[0].entities).toEqual([]);
    expect(topics[0].entityCount).toBe(0);
  });
});
