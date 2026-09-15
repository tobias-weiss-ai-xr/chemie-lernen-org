/**
 * Unit tests for the Bloom-staircase scaffolding engine — pure logic only.
 */

import { describe, it, expect } from 'vitest';
import {
  BLOOM_METADATA,
  computeStaircase,
  scaffoldingPlan,
} from '../api/services/scaffolding-engine.js';

describe('BLOOM_METADATA', () => {
  it('has exactly 6 entries for Bloom 1–6', () => {
    expect(BLOOM_METADATA).toHaveLength(6);
  });

  it('every entry carries level, verb, descriptor and hintType', () => {
    for (const meta of BLOOM_METADATA) {
      expect(meta.level).toEqual(expect.any(String));
      expect(meta.verb).toEqual(expect.any(String));
      expect(meta.descriptor).toEqual(expect.any(String));
      expect(meta.hintType).toEqual(expect.any(String));
    }
  });

  it('maps the spec hint-type table correctly', () => {
    const table = {
      0: 'direct-recall', // remember
      1: 'analogy', // understand
      2: 'worked-example', // apply
      3: 'socratic-question', // analyze
      4: 'compare-contrast', // evaluate
      5: 'open-ended-challenge', // create
    };
    for (let i = 0; i < 6; i += 1) {
      expect(BLOOM_METADATA[i].hintType).toBe(table[i]);
    }
  });

  it('has ascending level names (remember→create)', () => {
    const expectOrder = ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'];
    expect(BLOOM_METADATA.map((m) => m.level)).toEqual(expectOrder);
  });
});

describe('computeStaircase', () => {
  it('returns empty for zero gap (learner >= target)', () => {
    expect(computeStaircase(4, 4)).toEqual([]);
    expect(computeStaircase(5, 3)).toEqual([]);
  });

  it('produces a single step for a one-level gap', () => {
    const steps = computeStaircase(2, 3);
    expect(steps).toHaveLength(1);
    expect(steps[0]).toMatchObject({
      step: 1,
      bloomIndex: 3,
      level: 'apply',
      hintType: 'worked-example',
    });
  });

  it('produces multi-step staircase for a 2-level gap (analyze target)', () => {
    const steps = computeStaircase(2, 4);
    expect(steps).toHaveLength(2);
    expect(steps[0]).toMatchObject({ step: 1, bloomIndex: 3, level: 'apply', hintType: 'worked-example' });
    expect(steps[1]).toMatchObject({ step: 2, bloomIndex: 4, level: 'analyze', hintType: 'socratic-question' });
  });

  it('cold-start (learner 0) yields full staircase for a modest target', () => {
    const steps = computeStaircase(0, 4);
    expect(steps.map((s) => s.bloomIndex)).toEqual([1, 2, 3, 4]);
    expect(steps[0].level).toBe('remember');
    expect(steps[3].hintType).toBe('socratic-question');
  });

  it('truncates to at most 5 steps (highest levels up to target)', () => {
    // learner 0, target 6 => levels 2..6 (5 steps, level 1 dropped)
    const steps = computeStaircase(0, 6);
    expect(steps).toHaveLength(5);
    expect(steps[0].bloomIndex).toBe(2);
    expect(steps[4].bloomIndex).toBe(6);
  });

  it('handles invalid / out-of-range target gracefully', () => {
    expect(computeStaircase(2, 99)).toEqual([]);
    expect(computeStaircase(2, 0)).toEqual([]);
    expect(computeStaircase(2, -1)).toEqual([]);
    expect(computeStaircase(2, 'zzz')).toEqual([]);
    expect(computeStaircase(2, undefined)).toEqual([]);
  });

  it('coerces string numeric inputs', () => {
    expect(computeStaircase('2', '4')).toHaveLength(2);
  });
});

describe('scaffoldingPlan', () => {
  it('is exported and async (integration path relies on Neo4j)', async () => {
    expect(typeof scaffoldingPlan).toBe('function');
    // Not invoked here — requires the live driver (covered by route/lib tests).
    expect(scaffoldingPlan.length).toBeGreaterThanOrEqual(2);
  });
});