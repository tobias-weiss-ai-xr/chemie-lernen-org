/**
 * @vitest-environment node
 *
 * Unit tests for scripts/seed-objective-states.mjs — pure logic (toMastery)
 * and seeding loop with mocked Neo4j sessions (no real DB).
 *
 * Task BZ-1.4 · bloom-zpd-adaptive-engine
 */

import { describe, it, expect } from 'vitest';
import { toMastery, seedObjectiveStates, READ_QUERY } from '../scripts/seed-objective-states.mjs';

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

function makeReadSession(records) {
  return { run: spyFn(() => Promise.resolve({ records })) };
}

function makeWriteSession() {
  return {
    run: spyFn(() => Promise.resolve({ records: [] })),
    close: spyFn(() => Promise.resolve()),
  };
}

function rec(userId, slug, avgScore, attempts, bloomIdx) {
  return {
    get: (key) => ({ userId, slug, avgScore, attempts, bloomIdx })[key],
  };
}

// ── Pure-function tests ────────────────────────────────────────────

describe('toMastery', () => {
  it('maps 0–100 scores to 0–1 mastery', () => {
    expect(toMastery(0)).toBe(0);
    expect(toMastery(50)).toBe(0.5);
    expect(toMastery(100)).toBe(1);
  });

  it('clamps out-of-range scores', () => {
    expect(toMastery(150)).toBe(1);
    expect(toMastery(-20)).toBe(0);
  });

  it('treats null/undefined as 0', () => {
    expect(toMastery(null)).toBe(0);
    expect(toMastery(undefined)).toBe(0);
    expect(toMastery('abc')).toBe(0);
  });
});

// ── Seeding loop tests ─────────────────────────────────────────────

describe('seedObjectiveStates', () => {
  it('reads GradedAnswer aggregates scoped to the chemie subset', async () => {
    const read = makeReadSession([]);
    await seedObjectiveStates(read, null);
    const query = read.run.mock.calls[0][0];
    expect(query).toContain('GradedAnswer');
    expect(query).toContain('PART_OF');
    expect(query).toContain('TESTS');
    // subset-scoped via _neo4j-subset-filter (chemie labels)
    expect(query).toMatch(/WHERE \(lo:/);
  });

  it('dry-run (writeSession=null) counts but does not write', async () => {
    const read = makeReadSession([rec('u1', 'lo-a', 80, 4, 3)]);
    const { seeded, users } = await seedObjectiveStates(read, null);
    expect(seeded).toBe(1);
    expect(users.has('u1')).toBe(true);
  });

  it('applies mastery/bloom upserts in apply mode', async () => {
    const read = makeReadSession([rec('u1', 'lo-a', 80, 4, 3), rec('u2', 'lo-b', 60, 2, 0)]);
    const write = makeWriteSession();
    const { seeded, users } = await seedObjectiveStates(read, write);
    expect(seeded).toBe(2);
    expect(users.size).toBe(2);
    expect(write.run.mock.calls).toHaveLength(2);

    const [query, params] = write.run.mock.calls[0];
    expect(query).toContain('MERGE (s:ObjectiveState');
    expect(query).toContain('-[:FOR]->(lo)');
    expect(query).toContain("s.source = 'seed:graded-answers'");
    expect(params.userId).toBe('u1');
    expect(params.slug).toBe('lo-a');
    expect(params.mastery).toBeCloseTo(0.8);
    expect(params.bloomIdx.toString()).toBe('3');
  });

  it('skips records with missing userId or slug', async () => {
    const read = makeReadSession([rec(null, 'lo-a', 90, 1, 2), rec('u1', null, 90, 1, 2)]);
    const write = makeWriteSession();
    const { seeded, skipped } = await seedObjectiveStates(read, write);
    expect(seeded).toBe(0);
    expect(skipped).toBe(2);
    expect(write.run.mock.calls).toHaveLength(0);
  });
});
