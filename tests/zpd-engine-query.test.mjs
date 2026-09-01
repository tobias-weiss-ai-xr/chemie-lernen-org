/**
 * Regression guard for the ZPD path-scoping Cypher (api/services/zpd-engine.js).
 *
 * Production incident: GET /api/learning-paths/:slug/next always returned
 * inZPD:false because the path filter only matched a Topic-nested chain
 * (Curriculum→HAS_TOPIC→Topic→HAS_SUBTOPIC→SubTopic→FULFILLS→lo) that does
 * NOT exist for most curricula. The real graph uses BOTH:
 *
 *   Schema A (majority): Curriculum→HAS_SUBTOPIC→SubTopic→FULFILLS→lo
 *   Schema B (BY only):  Curriculum→HAS_TOPIC→Topic→HAS_SUBTOPIC→SubTopic→FULFILLS→lo
 *
 * This test captures the generated query (via a mocked driver) and asserts
 * BOTH chains are present — mirroring the detail route in learning-paths.js.
 */

import { vi, describe, test, expect, beforeEach } from 'vitest';

let captured = null;

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
          return { records: [] };
        },
        close: async () => {},
      }),
    }),
    NEO4J_DATABASE: 'chemie',
    toNumberSafe: (v) => (v == null ? undefined : Number(v)),
  })
);

vi.mock(
  '../scripts/_neo4j-subset-filter.mjs',
  () => ({
    subsetMatch: () => 'WHERE (lo:LearningObjective)',
  })
);

const { nextObjectiveInZPD } = await import('../api/services/zpd-engine.js');

const PATH_SLUG = 'BB-sek-i-gemeinsamer-rlp-berlin-brandenburg';

describe('zpd-engine path-scoping Cypher (schema A + B)', () => {
  beforeEach(() => {
    captured = null;
  });

  test('query contains BOTH curriculum→objective chains (SubTopic + Topic-nested)', async () => {
    await nextObjectiveInZPD('user-1', PATH_SLUG);
    expect(captured).not.toBeNull();

    // Schema A: Curriculum→HAS_SUBTOPIC→SubTopic→FULFILLS→lo (majority)
    expect(captured.query).toContain('-[:HAS_SUBTOPIC]->(:SubTopic)-[:FULFILLS]->(lo)');
    // Schema B: Curriculum→HAS_TOPIC→Topic→HAS_SUBTOPIC→SubTopic→FULFILLS→lo (BY)
    expect(captured.query).toContain(
      '-[:HAS_TOPIC]->(:Topic)-[:HAS_SUBTOPIC]->(:SubTopic)-[:FULFILLS]->(lo)'
    );
    // exactly the two EXISTS branches, no single-chain variant
    const existsBranches = captured.query.match(/EXISTS \{/g) || [];
    expect(existsBranches).toHaveLength(2);
    expect(captured.query).toContain('OR EXISTS {');
  });

  test('passes pathSlug, thresholds and userId as parameters', async () => {
    await nextObjectiveInZPD('user-1', PATH_SLUG);
    expect(captured.params).toMatchObject({
      userId: 'user-1',
      pathSlug: PATH_SLUG,
      thetaHigh: 0.8,
      thetaLow: 0.6,
    });
  });

  test('pathSlug is null for the global (non-scoped) query', async () => {
    await nextObjectiveInZPD('user-1');
    expect(captured.params.pathSlug).toBeNull();
    expect(captured.query).toContain('$pathSlug IS NULL');
  });
});
