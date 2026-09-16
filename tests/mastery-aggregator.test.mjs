/**
 * mastery-aggregator — pure-function tests (formative-assessment 5.1).
 *
 * Covers: aggregateMastery with all/missing/zero evidence, weight
 * redistribution, env-var weight configuration, and the three signal helpers.
 */

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import {
  aggregateMastery,
  quizSignal,
  fsrsSignal,
  autoGraderSignal,
  loadWeights,
} from '../api/services/mastery-aggregator.js';

const BASE = { autoGrader: 0.4, quiz: 0.35, fsrs: 0.25 };

const save = process.env.MASTERY_WEIGHT_QUIZ;
afterEach(() => {
  if (save === undefined) delete process.env.MASTERY_WEIGHT_QUIZ;
  else process.env.MASTERY_WEIGHT_QUIZ = save;
  delete process.env.MASTERY_WEIGHT_AUTOGRADER;
  delete process.env.MASTERY_WEIGHT_FSRS;
});

describe('loadWeights', () => {
  test('returns defaults when env vars are unset', () => {
    expect(loadWeights()).toEqual(BASE);
  });

  test('reads env overrides', () => {
    process.env.MASTERY_WEIGHT_AUTOGRADER = '0.5';
    process.env.MASTERY_WEIGHT_QUIZ = '0.3';
    process.env.MASTERY_WEIGHT_FSRS = '0.2';
    expect(loadWeights()).toEqual({ autoGrader: 0.5, quiz: 0.3, fsrs: 0.2 });
  });

  test('ignores invalid (non-numeric) env values -> fallback', () => {
    process.env.MASTERY_WEIGHT_AUTOGRADER = 'nonsense';
    expect(loadWeights().autoGrader).toBe(0.4);
  });
});

describe('quizSignal', () => {
  test('maps a 0-100 percentage to [0,1]', () => {
    expect(quizSignal([{ percentage: 85 }])).toBeCloseTo(0.85);
  });

  test('handles raw {score,total} rows', () => {
    expect(quizSignal([{ score: 3, total: 4 }])).toBeCloseTo(0.75);
  });

  test('filters by topic when provided', () => {
    const rows = [{ topic: 'Stoffe', percentage: 90 }, { topic: 'Atombau', percentage: 50 }];
    expect(quizSignal(rows, 'Stoffe')).toBeCloseTo(0.9);
  });

  test('returns null with no evidence', () => {
    expect(quizSignal([])).toBeNull();
    expect(quizSignal(null)).toBeNull();
  });
});

describe('fsrsSignal', () => {
  test('maps a >0 stability to (0,1] via asymptote', () => {
    const v = fsrsSignal([{ stability: 14 }]);
    expect(v).toBeGreaterThan(0);
    expect(v).toBeLessThan(1);
  });

  test('ease-only cards map via (ease-1.3)/1.7', () => {
    const easy = fsrsSignal([{ ease: 3.0 }]);
    const hard = fsrsSignal([{ ease: 1.3 }]);
    expect(easy).toBeGreaterThan(hard);
    expect(easy).toBeCloseTo(1);
  });

  test('filters by topicId when provided', () => {
    const cards = [{ topicId: 'a', stability: 30 }, { topicId: 'b', stability: 0 }];
    expect(fsrsSignal(cards, 'a')).toBeGreaterThan(0);
    expect(fsrsSignal(cards, 'b')).toBeCloseTo(0);
  });

  test('returns null when no usable cards', () => {
    expect(fsrsSignal([])).toBeNull();
    expect(fsrsSignal([{ unknown: 1 }])).toBeNull();
  });
});

describe('autoGraderSignal', () => {
  test('averages correctness', () => {
    expect(autoGraderSignal([{ correct: true }, { correct: false }, { correct: true }])).toBeCloseTo(
      2 / 3
    );
  });

  test('all correct -> 1, all wrong -> 0', () => {
    expect(autoGraderSignal([{ correct: true }])).toBe(1);
    expect(autoGraderSignal([{ correct: false }])).toBe(0);
  });

  test('returns null when no boolean-correct rows', () => {
    expect(autoGraderSignal([{ score: 5 }])).toBeNull();
    expect(autoGraderSignal([])).toBeNull();
  });
});

describe('aggregateMastery', () => {
  test('combines all three sources using default weights', () => {
    // autoGrader: (1+0)/2=0.5 ; quiz: 0.85 ; fsrs: ~0.667
    const r = aggregateMastery('u1', 'lo-1', {
      quizResults: [{ percentage: 85 }],
      fsrsCards: [{ stability: 14 }], // 14/(14+7)=0.667
      gradedAnswers: [{ correct: true }, { correct: false }],
    });
    const expected = 0.5 * 0.4 + 0.85 * 0.35 + (14 / 21) * 0.25;
    expect(r.mastery).toBeCloseTo(expected);
    expect(r.objectiveSlug).toBe('lo-1');
  });

  test('redistributes weights when a source is missing', () => {
    // quiz-only -> mastery = quiz value, weight normalised to 1
    const r = aggregateMastery('u1', 'lo-1', { quizResults: [{ percentage: 80 }] });
    expect(r.mastery).toBeCloseTo(0.8);
    const srcKeys = Object.values(r.sources).filter((v) => v !== null && v !== undefined);
    expect(srcKeys.length).toBe(1);
  });

  test('returns null when NO source contributes evidence', () => {
    const r = aggregateMastery('u1', 'lo-1', {
      quizResults: [],
      fsrsCards: [],
      gradedAnswers: [],
    });
    expect(r.mastery).toBeNull();
  });

  test('clamps combined mastery to [0,1]', () => {
    const r = aggregateMastery('u1', 'lo-1', {
      quizResults: [{ percentage: 100 }],
      fsrsCards: [{ stability: 1000 }],
      gradedAnswers: [{ correct: true }],
    });
    expect(r.mastery).toBeLessThanOrEqual(1);
    expect(r.mastery).toBeGreaterThan(0.9);
  });

  test('respects explicit weights argument', () => {
    const w = { autoGrader: 0.7, quiz: 0.2, fsrs: 0.1 };
    const r = aggregateMastery('u1', 'lo-1', {
      quizResults: [{ percentage: 100 }],
      fsrsCards: [],
      gradedAnswers: [],
      weights: w,
    });
    expect(r.mastery).toBeCloseTo(1.0);
    expect(r.weights).toEqual(w);
  });
});