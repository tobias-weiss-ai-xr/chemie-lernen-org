/**
 * @vitest-environment node
 *
 * Idempotent unit tests for scripts/backfill-bloom-index.mjs — pure logic
 * (toIndex) and backfill loop with mocked Neo4j sessions (no real DB).
 *
 * Task BZ-43 · bloom-zpd-adaptive-engine
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { toIndex, BLOOM_ORDER, backfillBloomIndex } from '../scripts/backfill-bloom-index.mjs';

// ── Lightweight mock helpers (avoids vi.fn() cross-mode issues) ──

function spyFn(impl) {
  const calls = [];
  const fn = (...args) => {
    calls.push(args);
    return typeof impl === 'function' ? impl(...args) : impl;
  };
  fn.mock = { calls };
  return fn;
}

// ── Pure-function tests ────────────────────────────────────────────

describe('toIndex', () => {
  it('maps Bloom level strings to 1–6', () => {
    expect(toIndex('remember')).toBe(1);
    expect(toIndex('understand')).toBe(2);
    expect(toIndex('apply')).toBe(3);
    expect(toIndex('analyze')).toBe(4);
    expect(toIndex('evaluate')).toBe(5);
    expect(toIndex('create')).toBe(6);
  });

  it('is case-insensitive', () => {
    expect(toIndex('CREATE')).toBe(6);
    expect(toIndex('Apply')).toBe(3);
    expect(toIndex('REMEMBER')).toBe(1);
  });

  it('passes through valid numeric indices', () => {
    expect(toIndex(1)).toBe(1);
    expect(toIndex(4)).toBe(4);
    expect(toIndex(6)).toBe(6);
  });

  it('returns null for unknown string levels', () => {
    expect(toIndex('zzz')).toBeNull();
    expect(toIndex('bloom')).toBeNull();
    expect(toIndex('')).toBeNull();
  });

  it('returns null for missing / null / undefined', () => {
    expect(toIndex(null)).toBeNull();
    expect(toIndex(undefined)).toBeNull();
  });

  it('aligns with BLOOM_ORDER array', () => {
    BLOOM_ORDER.forEach((level, i) => {
      expect(toIndex(level)).toBe(i + 1);
    });
  });
});

// ── Backfill loop tests (mocked sessions) ──────────────────────────

/** Build a mock record matching the `rec.get('key')` interface. */
function mockRecord(slug, level, idx) {
  return { get: (key) => ({ slug, level, idx }[key]) };
}

describe('backfillBloomIndex', () => {
  let writeCalls;
  let readSession;
  let writeSession;
  let logs;
  let warnings;

  beforeEach(() => {
    writeCalls = [];
    logs = [];
    warnings = [];

    readSession = {
      run: spyFn(() => Promise.resolve({ records: [] })),
      close: spyFn(() => Promise.resolve()),
    };
    writeSession = {
      run: spyFn((_query, params) => {
        writeCalls.push(params);
        return Promise.resolve();
      }),
      close: spyFn(() => Promise.resolve()),
    };
  });

  it('returns zero changed when all records already have correct idx', async () => {
    readSession.run = spyFn(() => Promise.resolve({
      records: [
        mockRecord('lo-a', 'remember', 1),
        mockRecord('lo-b', 'apply', 3),
        mockRecord('lo-c', 'create', 6),
      ],
    }));

    const result = await backfillBloomIndex(readSession, writeSession, {
      logger: logs.push.bind(logs),
      warn: warnings.push.bind(warnings),
    });

    expect(result.changed).toBe(0);
    expect(result.skipped).toBe(0);
    expect(writeCalls).toHaveLength(0);
  });

  it('updates records with missing blooms_index', async () => {
    readSession.run = spyFn(() => Promise.resolve({
      records: [mockRecord('lo-new', 'analyze', null)],
    }));

    const result = await backfillBloomIndex(readSession, writeSession, {
      logger: logs.push.bind(logs),
      warn: warnings.push.bind(warnings),
    });

    expect(result.changed).toBe(1);
    expect(writeCalls).toHaveLength(1);
    expect(writeCalls[0].slug).toBe('lo-new');
    expect(writeCalls[0].idx.toNumber()).toBe(4);
  });

  it('updates records with incorrect blooms_index', async () => {
    readSession.run = spyFn(() => Promise.resolve({
      records: [mockRecord('lo-wrong', 'evaluate', 2)],
    }));

    const result = await backfillBloomIndex(readSession, writeSession, {
      logger: logs.push.bind(logs),
      warn: warnings.push.bind(warnings),
    });

    expect(result.changed).toBe(1);
    expect(writeCalls).toHaveLength(1);
    expect(writeCalls[0].idx.toNumber()).toBe(5);
  });

  it('skips records with unknown blooms_level and counts them', async () => {
    readSession.run = spyFn(() => Promise.resolve({
      records: [mockRecord('lo-bad', 'synthesis', null)],
    }));

    const result = await backfillBloomIndex(readSession, writeSession, {
      logger: logs.push.bind(logs),
      warn: warnings.push.bind(warnings),
    });

    expect(result.changed).toBe(0);
    expect(result.skipped).toBe(1);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain('skip lo-bad');
    expect(writeCalls).toHaveLength(0);
  });

  it('does not write in dry-run mode (writeSession = null)', async () => {
    readSession.run = spyFn(() => Promise.resolve({
      records: [
        mockRecord('lo-dry', 'remember', null),
        mockRecord('lo-dry2', 'create', 1),
      ],
    }));

    const result = await backfillBloomIndex(readSession, null, {
      logger: logs.push.bind(logs),
      warn: warnings.push.bind(warnings),
    });

    expect(result.changed).toBe(2);
    expect(writeCalls).toHaveLength(0);
  });

  it('is idempotent — second run finds zero changes', async () => {
    // First run: three records need updating
    readSession.run = spyFn(() => Promise.resolve({
      records: [
        mockRecord('lo-1', 'remember', null),
        mockRecord('lo-2', 'apply', null),
        mockRecord('lo-3', 'create', null),
      ],
    }));

    // First run — apply mode
    const result1 = await backfillBloomIndex(readSession, writeSession, {
      logger: logs.push.bind(logs),
      warn: warnings.push.bind(warnings),
    });
    expect(result1.changed).toBe(3);

    // After first run, idx values are now correct
    readSession.run = spyFn(() => Promise.resolve({
      records: [
        mockRecord('lo-1', 'remember', 1),
        mockRecord('lo-2', 'apply', 3),
        mockRecord('lo-3', 'create', 6),
      ],
    }));

    // Second run — no changes expected
    const result2 = await backfillBloomIndex(readSession, writeSession, {
      logger: logs.push.bind(logs),
      warn: warnings.push.bind(warnings),
    });
    expect(result2.changed).toBe(0);
    expect(result2.skipped).toBe(0);
    // Total writes across both runs should be exactly 3 (from first run only)
    expect(writeCalls).toHaveLength(3);
  });

  it('uses the correct Cypher MATCH for reading', async () => {
    readSession.run = spyFn(() => Promise.resolve({ records: [] }));

    await backfillBloomIndex(readSession, null);

    const [query] = readSession.run.mock.calls[0];
    expect(query).toContain('MATCH (lo:LearningObjective)');
    expect(query).toContain('blooms_level');
    expect(query).toContain('blooms_index');
  });

  it('uses the correct Cypher SET for writing', async () => {
    readSession.run = spyFn(() => Promise.resolve({
      records: [mockRecord('lo-x', 'understand', null)],
    }));

    await backfillBloomIndex(readSession, writeSession);

    const [query, params] = writeSession.run.mock.calls[0];
    expect(query).toContain('MATCH (lo:LearningObjective {slug: $slug})');
    expect(query).toContain('SET lo.blooms_index = $idx');
    expect(params.slug).toBe('lo-x');
    expect(params.idx.toNumber()).toBe(2);
  });
});
