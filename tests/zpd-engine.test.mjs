/**
 * Unit tests for the Bloom × ZPD engine — pure logic only (no Neo4j).
 */

import { bloomIndex, recommendedStrategy } from '../api/services/zpd-engine.js';

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
});
