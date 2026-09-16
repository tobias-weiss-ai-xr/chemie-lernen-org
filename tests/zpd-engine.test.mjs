/**
 * Unit tests for the Bloom × ZPD engine — pure logic only (no Neo4j).
 */

import { bloomIndex, recommendedStrategy, recommendedTool } from '../api/services/zpd-engine.js';

describe('bloomIndex', () => {
  it('maps level strings to 1–6', () => {
    expect(bloomIndex('remember')).toBe(1);
    expect(bloomIndex('understand')).toBe(2);
    expect(bloomIndex('apply')).toBe(3);
    expect(bloomIndex('analyze')).toBe(4);
    expect(bloomIndex('evaluate')).toBe(5);
    expect(bloomIndex('create')).toBe(6);
  });

  it('is case-insensitive', () => {
    expect(bloomIndex('CREATE')).toBe(6);
    expect(bloomIndex('Apply')).toBe(3);
  });

  it('passes through valid numeric indices', () => {
    expect(bloomIndex(4)).toBe(4);
  });

  it('returns 0 for unknown / missing levels', () => {
    expect(bloomIndex('zzz')).toBe(0);
    expect(bloomIndex(null)).toBe(0);
    expect(bloomIndex(undefined)).toBe(0);
    expect(bloomIndex(99)).toBe(0);
  });
});

describe('recommendedStrategy', () => {
  it('returns null when next is null', () => {
    expect(recommendedStrategy(null)).toBeNull();
  });

  it('recommends scaffold for unstarted objective with solid prerequisites', () => {
    expect(recommendedStrategy({ loMastery: 0, prereqAvg: 0.9 })).toBe('scaffold');
  });

  it('recommends assess for near-mastered objective', () => {
    expect(recommendedStrategy({ loMastery: 0.7, prereqAvg: 1.0 })).toBe('assess');
  });

  it('prefers peer when a peer is available', () => {
    expect(recommendedStrategy({ loMastery: 0.3, prereqAvg: 0.9 }, { hasPeer: true })).toBe('peer');
  });

  it('defaults to differentiate otherwise', () => {
    expect(recommendedStrategy({ loMastery: 0.3, prereqAvg: 0.9 })).toBe('differentiate');
  });

  // ── Differentiation (zpd-deepdive-differentiation) ──────────────
  it('recommends differentiate when the objective Bloom == learner target (advance ceiling)', () => {
    expect(recommendedStrategy({ loMastery: 0.3, prereqAvg: 0.9, bloom: 3 }, { targetBloomIndex: 3 })).toBe(
      'differentiate'
    );
  });

  it('recommends differentiate when the objective Bloom exceeds the learner target', () => {
    expect(recommendedStrategy({ loMastery: 0.3, prereqAvg: 0.9, bloom: 5 }, { targetBloomIndex: 4 })).toBe(
      'differentiate'
    );
  });

  it('does not force differentiate when bloom is below target (falls through to normal logic)', () => {
    expect(recommendedStrategy({ loMastery: 0.0, prereqAvg: 0.9, bloom: 2 }, { targetBloomIndex: 4 })).toBe(
      'scaffold'
    );
  });

  it('ignores the targetBloomIndex option when no bloom is present (backward compatible)', () => {
    expect(recommendedStrategy({ loMastery: 0.5, prereqAvg: 0.9 }, { targetBloomIndex: 3 })).toBe(
      'differentiate'
    );
  });
});

describe('recommendedStrategy — tool integration (zpd-deepdive-tech-integration)', () => {
  it('recommends tool for spatial objective with matching Bloom', () => {
    expect(
      recommendedStrategy({ loMastery: 0.3, prereqAvg: 0.9, bloom: 3 }, { objectiveTags: ['spatial'] })
    ).toBe('tool');
  });

  it('does not recommend tool when objectiveTags is absent (backward compatible)', () => {
    expect(recommendedStrategy({ loMastery: 0.3, prereqAvg: 0.9, bloom: 3 })).toBe('differentiate');
  });

  it('does not recommend tool when no objectiveTags array but bloom present', () => {
    expect(
      recommendedStrategy({ loMastery: 0.3, prereqAvg: 0.9, bloom: 3 }, { objectiveTags: [] })
    ).toBe('differentiate');
  });

  it('falls through to differentiate when tags do not resolve a tool', () => {
    expect(
      recommendedStrategy(
        { loMastery: 0.3, prereqAvg: 0.9, bloom: 1 },
        { objectiveTags: ['quantitative'] }
      )
    ).toBe('differentiate');
  });

  it('tool wins even when peer is available (tech beats collaborative default)', () => {
    expect(
      recommendedStrategy(
        { loMastery: 0.3, prereqAvg: 0.9, bloom: 3 },
        { hasPeer: true, objectiveTags: ['spatial'] }
      )
    ).toBe('tool');
  });
});

describe('recommendedTool', () => {
  it('returns null when next is null or bloom is missing', () => {
    expect(recommendedTool(null, ['spatial'])).toBeNull();
    expect(recommendedTool({ loMastery: 0.3 }, ['spatial'])).toBeNull();
  });

  it('returns a tool recommendation for a matching objective', () => {
    const rec = recommendedTool({ bloom: 2 }, ['spatial']);
    expect(rec).not.toBeNull();
    expect(rec.toolType).toBe('visualization');
    expect(rec).toHaveProperty('toolId');
    expect(rec).toHaveProperty('launchUrl');
    expect(rec).toHaveProperty('rationale');
  });

  it('returns null when no tool matches', () => {
    expect(recommendedTool({ bloom: 1 }, ['quantitative'])).toBeNull();
  });
});
