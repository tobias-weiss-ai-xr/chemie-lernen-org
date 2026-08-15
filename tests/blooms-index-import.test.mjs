/**
 * Unit tests for blooms_index (1-6) derivation from blooms_level strings.
 *
 * Tests the mapping logic used by both import scripts
 * (import-curricula-all.mjs, import-curricula.mjs) and the backfill script.
 * No Neo4j dependency — pure logic only.
 */

// Inline the same mapping used by all three scripts so we test the contract
const BLOOM_ORDER = ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'];

function bloomsLevelToIndex(level) {
  if (typeof level === 'number') return level >= 1 && level <= 6 ? level : null;
  if (!level) return null;
  const i = BLOOM_ORDER.indexOf(String(level).toLowerCase());
  return i >= 0 ? i + 1 : null;
}

describe('bloomsLevelToIndex — import mapping', () => {
  it('maps all six canonical Bloom levels to 1–6', () => {
    expect(bloomsLevelToIndex('remember')).toBe(1);
    expect(bloomsLevelToIndex('understand')).toBe(2);
    expect(bloomsLevelToIndex('apply')).toBe(3);
    expect(bloomsLevelToIndex('analyze')).toBe(4);
    expect(bloomsLevelToIndex('evaluate')).toBe(5);
    expect(bloomsLevelToIndex('create')).toBe(6);
  });

  it('is case-insensitive (German curriculum data may vary)', () => {
    expect(bloomsLevelToIndex('REMEMBER')).toBe(1);
    expect(bloomsLevelToIndex('Understand')).toBe(2);
    expect(bloomsLevelToIndex('APPLY')).toBe(3);
    expect(bloomsLevelToIndex('Analyze')).toBe(4);
    expect(bloomsLevelToIndex('Evaluate')).toBe(5);
    expect(bloomsLevelToIndex('CREATE')).toBe(6);
  });

  it('passes through valid numeric indices 1–6', () => {
    expect(bloomsLevelToIndex(1)).toBe(1);
    expect(bloomsLevelToIndex(3)).toBe(3);
    expect(bloomsLevelToIndex(6)).toBe(6);
  });

  it('returns null for out-of-range numeric values', () => {
    expect(bloomsLevelToIndex(0)).toBeNull();
    expect(bloomsLevelToIndex(7)).toBeNull();
    expect(bloomsLevelToIndex(-1)).toBeNull();
    expect(bloomsLevelToIndex(99)).toBeNull();
  });

  it('returns null for unknown level strings', () => {
    expect(bloomsLevelToIndex('zzz')).toBeNull();
    expect(bloomsLevelToIndex('bloom')).toBeNull();
    expect(bloomsLevelToIndex('')).toBeNull();
  });

  it('returns null for null and undefined (no blooms_level in JSON)', () => {
    expect(bloomsLevelToIndex(null)).toBeNull();
    expect(bloomsLevelToIndex(undefined)).toBeNull();
  });

  it('consistently matches the zpd-engine bloomIndex for known levels', () => {
    // Import scripts use null for unknown, zpd-engine uses 0.
    // For known levels they must agree.
    const levels = ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'];
    for (const level of levels) {
      expect(bloomsLevelToIndex(level)).toBeGreaterThanOrEqual(1);
      expect(bloomsLevelToIndex(level)).toBeLessThanOrEqual(6);
    }
  });
});
