/**
 * Unit tests for peer-collaboration pure logic in api/services/zpd-engine.js
 * (peer-collaboration PC-1 / PC-2). No Neo4j required.
 */

import { vi, describe, test, expect, beforeEach } from 'vitest';

let captured = null;
let runImpl = null;

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
          if (runImpl) return runImpl(query, params);
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

function makeRecord(map) {
  return {
    get: (key) => map[key],
  };
}

import {
  peerMatchScore,
  classifyMKODirection,
  curricularDistanceMetric,
} from '../api/services/zpd-engine.js';

describe('curricularDistanceMetric (PC-2)', () => {
  it('maps each proximity level to its distance', () => {
    expect(curricularDistanceMetric('same-objective')).toBe(0);
    expect(curricularDistanceMetric('same-subtopic')).toBe(0.3);
    expect(curricularDistanceMetric('same-topic')).toBe(0.6);
    expect(curricularDistanceMetric('cross-topic')).toBe(1.0);
  });

  it('defaults unknown levels to cross-topic (max distance)', () => {
    expect(curricularDistanceMetric(null)).toBe(1.0);
    expect(curricularDistanceMetric('whatever')).toBe(1.0);
    expect(curricularDistanceMetric(undefined)).toBe(1.0);
  });
});

describe('peerMatchScore (PC-2)', () => {
  it('returns 1.0 for a perfect same-objective, same-Bloom, no bonus match', () => {
    expect(peerMatchScore(3, 3, 0, 0)).toBe(1.0);
  });

  it('gives highest score to the same-Bloom peer (same subtopic)', () => {
    const same = peerMatchScore(3, 3, 0.3, 0);
    const adjacent = peerMatchScore(3, 4, 0.3, 0);
    expect(same).toBeGreaterThan(adjacent);
    expect(same).toBeCloseTo(0.94, 5);
  });

  it('penalises Bloom distance by 0.3 per level', () => {
    // 1.0 - 0.3*1 - 0.2*0.3 = 0.64
    expect(peerMatchScore(3, 4, 0.3, 0)).toBeCloseTo(0.64, 5);
  });

  it('penalises curricular distance (cross-topic scores lowest)', () => {
    const sameTopic = peerMatchScore(3, 3, 0.6, 0);
    const cross = peerMatchScore(3, 3, 1.0, 0);
    expect(sameTopic).toBeGreaterThan(cross);
    expect(cross).toBeCloseTo(0.8, 5);
  });

  it('adds the MKO bonus (+0.2) when a learner qualifies as MKO', () => {
    const without = peerMatchScore(3, 4, 0.3, 0);
    const withBonus = peerMatchScore(3, 4, 0.3, 1);
    expect(withBonus).toBeCloseTo(without + 0.2, 5);
  });

  it('clamps the result to the [0, 1] range', () => {
    // same-objective (0), same-Bloom, MKO bonus: 1.0 - 0 - 0 + 0.2 = 1.2 → 1.0
    expect(peerMatchScore(3, 3, 0, 1)).toBeCloseTo(1.0, 5);
    expect(peerMatchScore(5, 2, 1.0, 0)).toBeCloseTo(0.0, 5); // 1.0 - 0.9 - 0.2 = -0.1 → 0
  });
});

describe('classifyMKODirection (PC-1)', () => {
  const THETA_HIGH = 0.8;

  it('returns mko-for-you when the peer masters my next objective', () => {
    expect(classifyMKODirection(0.1, 0.9, THETA_HIGH)).toBe('mko-for-you');
  });

  it('returns you-are-mko when I master the peer next objective but they do not', () => {
    expect(classifyMKODirection(0.9, 0.3, THETA_HIGH)).toBe('you-are-mko');
  });

  it('returns peer when neither learner is the MKO', () => {
    expect(classifyMKODirection(0.4, 0.5, THETA_HIGH)).toBe('peer');
  });

  it('treats an exact threshold hit as MKO-qualified', () => {
    expect(classifyMKODirection(0.3, THETA_HIGH, THETA_HIGH)).toBe('mko-for-you');
  });

  it('uses the default thetaHigh when not supplied', () => {
    expect(classifyMKODirection(0.1, 0.85)).toBe('mko-for-you');
    expect(classifyMKODirection(0.4, 0.5)).toBe('peer');
  });
});

describe('findPeerCandidates (mocked driver)', () => {
  beforeEach(() => {
    captured = null;
    runImpl = null;
  });

  test('returns ranked candidates from overlapping ObjectiveState query', async () => {
    let calls = 0;
    runImpl = async (query, params) => {
      calls += 1;
      if (calls === 1) {
        // nextObjectiveInZPD → myNext bloom 3
        expect(params.myBloom).toBeUndefined();
        expect(params.bloomTarget).toBe(6);
        return {
          records: [
            makeRecord({
              slug: 'stoffe-lo-1',
              bloom: 3,
              description: 'Stoffe',
              prereqAvg: 0.9,
              loMastery: 0.2,
              filteredOutCount: 0,
            }),
          ],
        };
      }
      // findPeerCandidates overlap query
      expect(params.myBloom).toBe(3);
      expect(params.bloomLow).toBe(2);
      expect(params.bloomHigh).toBe(4);
      return {
        records: [
          makeRecord({
            userId: 'u-peer-a',
            objectiveSlug: 'stoffe-lo-1',
            bloom: 3,
            mastery: 0.9, // ≥ thetaHigh → MKO
            mkoFor: null,
          }),
          makeRecord({
            userId: 'u-peer-b',
            objectiveSlug: 'stoffe-lo-2',
            bloom: 4,
            mastery: 0.4,
            mkoFor: null,
          }),
        ],
      };
    };

    const { findPeerCandidates } = await import('../api/services/zpd-engine.js');
    const result = await findPeerCandidates('u1', null);
    expect(result.myNext.slug).toBe('stoffe-lo-1');
    expect(result.myNext.bloom).toBe(3);
    expect(result.candidates).toHaveLength(2);
    // same-Bloom, cross-topic (no path): 1.0 - 0 - 0.2 + 0.2 = 1.0 (MKO peer)
    expect(result.candidates[0].userId).toBe('u-peer-a');
    expect(result.candidates[0].matchScore).toBe(1.0);
    expect(result.candidates[0].mkoDirection).toBe('mko-for-you');
    // adjacent-Bloom, cross-topic: 1.0 - 0.3 - 0.2 = 0.5
    expect(result.candidates[1].userId).toBe('u-peer-b');
    expect(result.candidates[1].matchScore).toBeCloseTo(0.5, 5);
    // ranked descending
    expect(result.candidates[0].matchScore).toBeGreaterThan(result.candidates[1].matchScore);
  });

  test('returns empty candidates when the user has no nextInZPD', async () => {
    runImpl = async () => ({ records: [] });
    const { findPeerCandidates } = await import('../api/services/zpd-engine.js');
    const result = await findPeerCandidates('u-ghost');
    expect(result.myNext).toBeNull();
    expect(result.candidates).toEqual([]);
  });

  test('caps candidates at maxCandidates (max 20)', async () => {
    let calls = 0;
    runImpl = async (query, params) => {
      calls += 1;
      if (calls === 1) {
        return {
          records: [
            makeRecord({
              slug: 'x',
              bloom: 3,
              description: 'x',
              prereqAvg: 0.9,
              loMastery: 0.2,
              filteredOutCount: 0,
            }),
          ],
        };
      }
      // 5 candidates, but cap is 2 → only 2 returned
      const recs = Array.from({ length: 5 }, (_, i) =>
        makeRecord({
          userId: `peer-${i}`,
          objectiveSlug: `x-${i}`,
          bloom: 3,
          mastery: 0.1,
          mkoFor: null,
        })
      );
      return { records: recs };
    };

    const { findPeerCandidates } = await import('../api/services/zpd-engine.js');
    const result = await findPeerCandidates('u1', null, { maxCandidates: 2 });
    expect(result.candidates).toHaveLength(2);
    expect(result.candidates[0].userId).toBe('peer-0');
    expect(result.candidates[1].userId).toBe('peer-1');
  });
});