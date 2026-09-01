/**
 * Unit tests for auto-grader.js — Two-tier grading service.
 *
 * Covers: normalizeFormula, gradeMCQ, gradeCalculation, gradeFillInBlank,
 *         gradeShortAnswer, gradeExercise (dispatcher).
 */

import { vi, describe, test, expect } from 'vitest';

// The auto-grader imports native node modules only (crypto, fs, path),
// so we can import directly without mocking.
let autoGrader;

beforeAll(async () => {
  autoGrader = await import('../api/services/auto-grader.js');
});

/* ------------------------------------------------------------------ */
/*  normalizeFormula                                                    */
/* ------------------------------------------------------------------ */

describe('normalizeFormula', () => {
  test('trims whitespace', () => {
    expect(autoGrader.normalizeFormula('  H2O  ')).toBe('h2o');
  });

  test('lowercases', () => {
    expect(autoGrader.normalizeFormula('NaCl')).toBe('nacl');
  });

  test('normalizes subscript digits (H₂O → h2o)', () => {
    expect(autoGrader.normalizeFormula('H₂O')).toBe('h2o');
  });

  test('normalizes superscript digits', () => {
    expect(autoGrader.normalizeFormula('Fe³⁺')).toBe('fe3+');
  });

  test('normalizes superscript minus', () => {
    expect(autoGrader.normalizeFormula('Cl⁻')).toBe('cl-');
  });

  test('handles mixed subscripts and superscripts', () => {
    expect(autoGrader.normalizeFormula('SO₄²⁻')).toBe('so42-');
  });

  test('strips spaces', () => {
    expect(autoGrader.normalizeFormula('Ca (OH) 2')).toBe('ca(oh)2');
  });

  test('NFKC normalization', () => {
    expect(autoGrader.normalizeFormula('H\u00e4matit')).toBe('h\u00e4matit');
  });

  test('returns empty string for null/undefined', () => {
    expect(autoGrader.normalizeFormula(null)).toBe('');
    expect(autoGrader.normalizeFormula(undefined)).toBe('');
  });
});

/* ------------------------------------------------------------------ */
/*  gradeMCQ                                                            */
/* ------------------------------------------------------------------ */

describe('gradeMCQ', () => {
  test('exact match is correct', () => {
    const result = autoGrader.gradeMCQ('A', 'A');
    expect(result.correct).toBe(true);
    expect(result.score).toBe(100);
    expect(result.gradedBy).toBe('deterministic');
  });

  test('case insensitive match', () => {
    expect(autoGrader.gradeMCQ('a', 'A').correct).toBe(true);
    expect(autoGrader.gradeMCQ('B', 'b').correct).toBe(true);
  });

  test('mismatch is incorrect', () => {
    const result = autoGrader.gradeMCQ('A', 'B');
    expect(result.correct).toBe(false);
    expect(result.score).toBe(0);
  });

  test('trims whitespace', () => {
    expect(autoGrader.gradeMCQ('  C  ', 'C').correct).toBe(true);
  });
});

/* ------------------------------------------------------------------ */
/*  gradeCalculation                                                    */
/* ------------------------------------------------------------------ */

describe('gradeCalculation', () => {
  test('exact match within default tolerance', () => {
    const result = autoGrader.gradeCalculation('44.01', '44.01');
    expect(result.correct).toBe(true);
    expect(result.score).toBe(100); // within 25% of tolerance
  });

  test('answer within tolerance is correct with partial credit', () => {
    // tolerance 0.5, diff 0.3 → within 50% of tolerance → 80 points
    const result = autoGrader.gradeCalculation('44.4', '44.01', 0.5);
    expect(result.correct).toBe(true);
    expect(result.score).toBe(80);
  });

  test('answer within tolerance but close to edge', () => {
    // diff 0.49, tolerance 0.5 → between 50% and 100% of tolerance → 60 points
    const result = autoGrader.gradeCalculation('44.5', '44.01', 0.5);
    expect(result.correct).toBe(true);
    expect(result.score).toBe(60);
  });

  test('answer outside tolerance is incorrect', () => {
    const result = autoGrader.gradeCalculation('50', '44.01', 0.5);
    expect(result.correct).toBe(false);
    expect(result.score).toBe(0);
  });

  test('handles German decimal comma', () => {
    const result = autoGrader.gradeCalculation('44,01', '44.01');
    expect(result.correct).toBe(true);
  });

  test('strips units', () => {
    const result = autoGrader.gradeCalculation('44.01 g/mol', '44.01');
    expect(result.correct).toBe(true);
  });

  test('handles scientific notation', () => {
    const result = autoGrader.gradeCalculation('6.022e23', '6.022e23', 1e20);
    expect(result.correct).toBe(true);
  });

  test('non-numeric answer returns 0', () => {
    const result = autoGrader.gradeCalculation('keine Ahnung', '44.01');
    expect(result.correct).toBe(false);
    expect(result.score).toBe(0);
  });

  test('default tolerance is 0.5', () => {
    const result = autoGrader.gradeCalculation('44.2', '44.01');
    expect(result.correct).toBe(true); // diff 0.19 < 0.5
  });

  test('custom tolerance respected', () => {
    const result = autoGrader.gradeCalculation('50', '44.01', 10);
    expect(result.correct).toBe(true); // diff 5.99 < 10
  });
});

/* ------------------------------------------------------------------ */
/*  gradeFillInBlank                                                    */
/* ------------------------------------------------------------------ */

describe('gradeFillInBlank', () => {
  test('exact string match', () => {
    const result = autoGrader.gradeFillInBlank('Wasser', 'Wasser');
    expect(result.correct).toBe(true);
    expect(result.score).toBe(100);
  });

  test('case insensitive', () => {
    expect(autoGrader.gradeFillInBlank('wasser', 'Wasser').correct).toBe(true);
  });

  test('formula normalization (H₂O vs H2O)', () => {
    expect(autoGrader.gradeFillInBlank('H₂O', 'H2O').correct).toBe(true);
    expect(autoGrader.gradeFillInBlank('H2O', 'H₂O').correct).toBe(true);
  });

  test('multiple acceptable answers', () => {
    const result = autoGrader.gradeFillInBlank('Na+', ['Na⁺', 'Na+', 'Natriumion']);
    expect(result.correct).toBe(true);
  });

  test('no match in acceptable answers', () => {
    const result = autoGrader.gradeFillInBlank('Cl-', ['Na⁺', 'Na+']);
    expect(result.correct).toBe(false);
    expect(result.score).toBe(0);
  });

  test('null/undefined returns false', () => {
    expect(autoGrader.gradeFillInBlank(null, 'test').correct).toBe(false);
    expect(autoGrader.gradeFillInBlank('test', null).correct).toBe(false);
  });

  test('single string wrapped in array', () => {
    const result = autoGrader.gradeFillInBlank('Kohlendioxid', 'Kohlendioxid');
    expect(result.correct).toBe(true);
  });
});

/* ------------------------------------------------------------------ */
/*  gradeShortAnswer (AI-assisted)                                     */
/* ------------------------------------------------------------------ */

describe('gradeShortAnswer', () => {
  const mockRubric = {
    keyConcepts: ['Oxidation', 'Elektronenabgabe'],
    minLength: 10,
    maxLength: 200,
  };

  const mockLitellm = { url: 'http://localhost:4000', model: 'gemma-4' };

  test('too short answer returns early with 0', async () => {
    const result = await autoGrader.gradeShortAnswer('Ja', 'Was ist Oxidation?', mockRubric, mockLitellm);
    expect(result.correct).toBe(false);
    expect(result.score).toBe(0);
    expect(result.gradedBy).toBe('ai');
    expect(result.feedback).toContain('ausführlichere');
  });

  test('empty answer returns 0', async () => {
    const result = await autoGrader.gradeShortAnswer('', 'Was ist Oxidation?', mockRubric, mockLitellm);
    expect(result.correct).toBe(false);
    expect(result.score).toBe(0);
  });

  test('graceful fallback on fetch failure', async () => {
    const brokenLitellm = { url: 'http://localhost:1', model: 'gemma-4' };
    const result = await autoGrader.gradeShortAnswer(
      'Oxidation ist die Abgabe von Elektronen.',
      'Was ist Oxidation?',
      mockRubric,
      brokenLitellm
    );
    // Should return fallback score 50
    expect(result.correct).toBe(false);
    expect(result.score).toBe(50);
    expect(result.gradedBy).toBe('ai');
    expect(result.feedback).toContain('nicht automatisch');
  });

  test('graceful fallback on non-JSON response', async () => {
    // Override the global fetch temporarily to simulate a bad response
    const origFetch = global.fetch;
    global.fetch = async () => ({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'Ungültige Antwort' } }],
      }),
    });

    const result = await autoGrader.gradeShortAnswer(
      'Oxidation ist die Abgabe von Elektronen.',
      'Was ist Oxidation?',
      mockRubric,
      mockLitellm
    );
    expect(result.score).toBe(50);
    expect(result.gradedBy).toBe('ai');
    expect(result.feedback).toContain('nicht automatisch');

    global.fetch = origFetch;
  });
});

/* ------------------------------------------------------------------ */
/*  gradeExercise (dispatcher)                                         */
/* ------------------------------------------------------------------ */

describe('gradeExercise (dispatcher)', () => {
  test('dispatches MCQ', async () => {
    const result = await autoGrader.gradeExercise(
      { id: 'q1', type: 'mcq', correctAnswer: 'B', question: 'Test?' },
      'B'
    );
    expect(result.correct).toBe(true);
    expect(result.gradedBy).toBe('deterministic');
  });

  test('dispatches calculation', async () => {
    const result = await autoGrader.gradeExercise(
      { id: 'q2', type: 'calculation', expectedAnswer: '44.01', tolerance: 0.5 },
      '44.01'
    );
    expect(result.correct).toBe(true);
    expect(result.gradedBy).toBe('deterministic');
  });

  test('dispatches fill-in-blank', async () => {
    const result = await autoGrader.gradeExercise(
      { id: 'q3', type: 'fill-in-blank', acceptableAnswers: ['H2O', 'Wasser'] },
      'Wasser'
    );
    expect(result.correct).toBe(true);
    expect(result.gradedBy).toBe('deterministic');
  });

  test('dispatches short-answer with litellm', async () => {
    const result = await autoGrader.gradeExercise(
      {
        id: 'q4',
        type: 'short-answer',
        question: 'Was ist Oxidation?',
        rubric: { keyConcepts: ['Oxidation'], minLength: 10 },
      },
      'Ein langer Text über Oxidation.',
      { litellm: { url: 'http://localhost:9999', model: 'gemma-4' } }
    );
    // Should fallback gracefully since LiteLLM is not running
    expect(result.score).toBe(50);
    expect(result.gradedBy).toBe('ai');
  });

  test('short-answer without litellm returns unavailable', async () => {
    const result = await autoGrader.gradeExercise(
      {
        id: 'q4',
        type: 'short-answer',
        question: 'Was ist Oxidation?',
        rubric: { keyConcepts: ['Oxidation'], minLength: 10 },
      },
      'Ein langer Text.'
    );
    expect(result.correct).toBe(false);
    expect(result.score).toBe(0);
    expect(result.feedback).toContain('nicht verfügbar');
  });

  test('empty answer returns 0', async () => {
    const result = await autoGrader.gradeExercise(
      { id: 'q1', type: 'mcq', correctAnswer: 'B' },
      ''
    );
    expect(result.correct).toBe(false);
    expect(result.score).toBe(0);
    expect(result.feedback).toContain('Bitte gib eine Antwort ein');
  });

  test('unknown type returns error', async () => {
    const result = await autoGrader.gradeExercise(
      { id: 'q1', type: 'essay', correctAnswer: '' },
      'Something'
    );
    expect(result.correct).toBe(false);
    expect(result.score).toBe(0);
    expect(result.feedback).toContain('Unbekannter Aufgabentyp');
  });
});
