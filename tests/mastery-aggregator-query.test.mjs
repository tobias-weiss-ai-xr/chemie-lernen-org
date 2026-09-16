/**
 * Cypher-scope guard for api/services/mastery-aggregator.js::mapTopicToObjectives.
 *
 * Captures the generated Topic -> SubTopic -> LearningObjective (FULFILLS)
 * query via a mocked driver and asserts both the Topic/LO subset scoping and
 * the FULFILLS chain are present — mirroring how topic-level signals (quiz
 * topics / FSRS topicIds) resolve to concrete LearningObjective slugs.
 */

import { vi, describe, test, expect, beforeEach } from 'vitest';

let captured = null;
let recordsToReturn = [];

vi.mock(
  'neo4j-driver',
  () => ({
    default: { session: { READ: 'READ' } },
  })
);

vi.mock(
  '../api/services/neo4j.js',
  () => ({
    getNeo4jDriver: () => ({
      session: () => ({
        run: async (query, params) => {
          captured = { query, params };
          return { records: recordsToReturn };
        },
        close: async () => {},
      }),
    }),
    NEO4J_DATABASE: 'chemie',
    toNeoInt: (v) => (v == null ? v : Number(v)),
    toNumberSafe: (v) => (v == null ? undefined : Number(v)),
  })
);

vi.mock(
  '../scripts/_neo4j-subset-filter.mjs',
  () => ({
    subsetMatch: (labelRef) => `WHERE (${labelRef}:chemie)`,
  })
);

const { mapTopicToObjectives } = await import('../api/services/mastery-aggregator.js');

describe('mapTopicToObjectives (formative-assessment 1.5)', () => {
  beforeEach(() => {
    captured = null;
    recordsToReturn = [];
  });

  test('returns [] for empty/non-string topic without querying', async () => {
    await mapTopicToObjectives('');
    await mapTopicToObjectives(null);
    await mapTopicToObjectives(42);
    expect(captured).toBeNull();
  });

  test('builds a query scoping Topic + LO to the subset via FULFILLS', async () => {
    await mapTopicToObjectives('Säuren und Basen');
    expect(captured).not.toBeNull();
    const q = captured.query;
    expect(q).toContain('(t:Topic)');
    expect(q).toContain('(lo:LearningObjective)');
    expect(q).toContain('(t:chemie)'); // Topic subset scoping
    expect(q).toContain('(lo:chemie)'); // LO subset scoping
    expect(q).toContain('-[:HAS_SUBTOPIC]->(:SubTopic)-[:FULFILLS]->');
    expect(q).toContain('RETURN DISTINCT lo.slug AS slug');
    expect(captured.params.norm).toBe('säuren und basen');
  });

  test('matches topic by lower-cased title OR slug', async () => {
    await mapTopicToObjectives('STOFFE');
    expect(captured.query).toContain("toLower(coalesce(t.title,''))");
    expect(captured.query).toContain("toLower(coalesce(t.slug,''))");
    expect(captured.params.norm).toBe('stoffe');
  });

  test('maps returned records to slug strings, filtering empties', async () => {
    recordsToReturn = [
      { get: (k) => (k === 'slug' ? 'lo-1' : undefined) },
      { get: (k) => (k === 'slug' ? 'lo-2' : undefined) },
      { get: (k) => (k === 'slug' ? null : undefined) },
    ];
    const slugs = await mapTopicToObjectives('Analyse');
    expect(slugs).toEqual(['lo-1', 'lo-2']);
  });
});