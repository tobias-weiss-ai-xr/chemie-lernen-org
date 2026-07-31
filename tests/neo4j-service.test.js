/**
 * Unit tests for the Neo4j service helpers (toNumberSafe).
 *
 * Regression test for a production bug: the entity-detail API route
 * (`GET /api/kg-data/entity/:name`) returned 503 because `objective_count`
 * is stored as a Cypher Float (e.g. 3.0) on 1394 of 1524 entities, and the
 * route called `.toNumber()` which only exists on neo4j Integer objects.
 */
describe('toNumberSafe (api/services/neo4j.js)', () => {
  let toNumberSafe;

  beforeEach(async () => {
    jest.resetModules();
    const mod = await import('../api/services/neo4j.js');
    toNumberSafe = mod.toNumberSafe;
  });

  test('converts a neo4j Integer object', () => {
    expect(toNumberSafe({ toNumber: () => 3 })).toBe(3);
  });

  test('converts a plain JS number (Cypher Float like 3.0)', () => {
    expect(toNumberSafe(3.0)).toBe(3);
  });

  test('converts a plain integer', () => {
    expect(toNumberSafe(17)).toBe(17);
  });

  test('returns 0 for null/undefined (missing property)', () => {
    expect(toNumberSafe(null)).toBe(0);
    expect(toNumberSafe(undefined)).toBe(0);
  });

  test('returns 0 for NaN / Infinity', () => {
    expect(toNumberSafe(NaN)).toBe(0);
    expect(toNumberSafe(Infinity)).toBe(0);
  });

  test('parses numeric strings', () => {
    expect(toNumberSafe('5')).toBe(5);
  });

  test('returns 0 for non-numeric values', () => {
    expect(toNumberSafe({ foo: 'bar' })).toBe(0);
    expect(toNumberSafe('abc')).toBe(0);
  });
});
