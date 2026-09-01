/**
 * @vitest-environment node
 *
 * Regression tests for learning-engine XP awarding against sessions with
 * missing/partial progress — the crash class that a pre-initialized
 * `progress: {}` in the session store used to trigger
 * (addXpEntry: Cannot read properties of undefined (reading 'unshift')).
 */

import { vi, describe, test, expect } from 'vitest';

vi.mock(
  'pdfkit',
  () => ({
    default: function () {
      return { pipe: vi.fn(), end: vi.fn() };
    },
    __esModule: true,
  })
);

const engine = await import('../api/learning-engine.js');

/** Minimal sessionStore whose getSession returns a session WITHOUT progress. */
function makeStore(session) {
  return {
    getSession: vi.fn(() => session),
  };
}

describe('learning-engine.awardExerciseXp', () => {
  test('awards XP when the session has no progress at all', () => {
    const session = { userId: 'u1', messages: [] };
    const total = engine.awardExerciseXp(makeStore(session), 'u1', 'ex-1', 100);
    expect(total).toBeGreaterThan(0);
    expect(session.progress.exercisesCompleted).toBe(1);
    expect(Array.isArray(session.progress.xpHistory)).toBe(true);
  });

  test('fills partial progress (e.g. restored from disk) without crashing', () => {
    const session = { userId: 'u1', messages: [], progress: { xp: 5 } };
    const total = engine.awardExerciseXp(makeStore(session), 'u1', 'ex-1', 80);
    // Award is a fixed per-exercise amount (15), not the score.
    expect(total).toBe(5 + 15);
    expect(session.progress.xpHistory.length).toBe(1);
    expect(session.progress.xpHistory[0].metadata.score).toBe(80);
    expect(session.progress.streak).toBe(0);
    expect(session.progress.earnedBadges).toEqual([]);
  });

  test('evaluateBadges does not crash on partial progress', () => {
    const session = { userId: 'u1', messages: [], progress: { xp: 100 } };
    expect(() => engine.evaluateBadges(makeStore(session), 'u1')).not.toThrow();
    expect(Array.isArray(session.progress.earnedBadges)).toBe(true);
  });
});
