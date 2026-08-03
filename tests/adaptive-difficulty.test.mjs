/**
 * Unit tests for the adaptive difficulty recommendation logic.
 * Covers the evidence-based 70–80% accuracy sweet spot.
 */

import { accuracyToDifficulty, recommendForTopic } from '../api/routes/adaptive.js';

function makeResult(percentage, index) {
  return {
    topic: 'Allgemeine Chemie',
    score: Math.round((percentage / 100) * 10),
    total: 10,
    percentage,
    time: 30,
    completedAt: `2026-01-0${(index % 9) + 1}T10:00:00.000Z`,
  };
}

describe('accuracyToDifficulty', () => {
  test('maps <70% to leicht', () => {
    expect(accuracyToDifficulty(0.5)).toBe('leicht');
    expect(accuracyToDifficulty(0.69)).toBe('leicht');
  });

  test('maps 70–85% to mittel', () => {
    expect(accuracyToDifficulty(0.7)).toBe('mittel');
    expect(accuracyToDifficulty(0.8)).toBe('mittel');
    expect(accuracyToDifficulty(0.85)).toBe('mittel');
  });

  test('maps >85% to schwer', () => {
    expect(accuracyToDifficulty(0.86)).toBe('schwer');
    expect(accuracyToDifficulty(1.0)).toBe('schwer');
  });
});

describe('recommendForTopic', () => {
  test('returns neutral default for no results', () => {
    const rec = recommendForTopic([]);
    expect(rec.difficulty).toBe('mittel');
    expect(rec.sampleSize).toBe(0);
    expect(rec.accuracy).toBeNull();
  });

  test('recommends leicht for consistently low accuracy', () => {
    const results = [1, 2, 3, 4].map((i) => makeResult(55, i));
    const rec = recommendForTopic(results);
    expect(rec.difficulty).toBe('leicht');
    expect(rec.sampleSize).toBe(4);
    expect(rec.trend).toBe('neutral');
  });

  test('recommends schwer for consistently high accuracy', () => {
    const results = [1, 2, 3, 4].map((i) => makeResult(95, i));
    const rec = recommendForTopic(results);
    expect(rec.difficulty).toBe('schwer');
  });

  test('recommends mittel in the 70-85% sweet spot', () => {
    const results = [1, 2, 3, 4].map((i) => makeResult(78, i));
    const rec = recommendForTopic(results);
    expect(rec.difficulty).toBe('mittel');
  });

  test('detects improving trend', () => {
    const results = [50, 55, 85, 90].map((p, i) => makeResult(p, i));
    const rec = recommendForTopic(results);
    expect(rec.trend).toBe('improving');
  });

  test('detects declining trend', () => {
    const results = [90, 85, 55, 50].map((p, i) => makeResult(p, i));
    const rec = recommendForTopic(results);
    expect(rec.trend).toBe('declining');
  });

  test('only uses the most recent 8 results', () => {
    const results = [];
    for (let i = 0; i < 12; i++) {
      // Early high, recent low → should recommend leicht despite old highs
      results.push(makeResult(i < 4 ? 95 : 50, i));
    }
    const rec = recommendForTopic(results);
    expect(rec.sampleSize).toBe(8);
    expect(rec.difficulty).toBe('leicht');
  });
});
