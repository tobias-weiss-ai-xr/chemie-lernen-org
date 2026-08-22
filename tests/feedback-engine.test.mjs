/**
 * Unit tests for feedback-engine.js — Individualized feedback generation.
 *
 * Covers: detectMisconception, generateStudyRecommendation, generateFeedback,
 *         applyTeacherOverride, clearFeedbackCache, getFeedbackCacheSize.
 */

import { jest, describe, test, expect, beforeEach } from '@jest/globals';

let feedbackEngine;

beforeAll(async () => {
  feedbackEngine = await import('../api/services/feedback-engine.js');
});

const sampleExercise = {
  id: 'ex-001',
  type: 'mcq',
  question: 'Was versteht man unter Oxidation?',
  options: [
    { id: 'A', text: 'Abgabe von Elektronen' },
    { id: 'B', text: 'Aufnahme von Elektronen' },
    { id: 'C', text: 'Abgabe von Protonen' },
  ],
  correctAnswer: 'A',
  explanation: 'Oxidation ist die Abgabe von Elektronen.',
  learningObjective: { slug: 'oxidation-reduktion', title: 'Oxidation und Reduktion' },
  topic: 'Oxidation und Reduktion',
};

/* ------------------------------------------------------------------ */
/*  generateStudyRecommendation                                        */
/* ------------------------------------------------------------------ */

describe('generateStudyRecommendation', () => {
  test('high score recommends advancing', () => {
    const rec = feedbackEngine.generateStudyRecommendation(90, 30, 'Säuren und Basen');
    expect(rec).toContain('Gut gemacht');
    expect(rec).toContain('nächste Schwierigkeitsstufe');
  });

  test('low score with low stability recommends basics', () => {
    const rec = feedbackEngine.generateStudyRecommendation(35, 3, 'Redoxreaktionen');
    expect(rec).toContain('Wiederholen');
    expect(rec).toContain('niedrig');
    expect(rec).toContain('Grundlagen');
  });

  test('medium score recommends focused review', () => {
    const rec = feedbackEngine.generateStudyRecommendation(55, 10, 'Chemische Bindungen');
    expect(rec).toContain('Konzepte, die Sie noch nicht sicher beherrschen');
  });

  test('moderate score (70) recommends targeted repetition', () => {
    const rec = feedbackEngine.generateStudyRecommendation(70, 20, 'Stöchiometrie');
    expect(rec).toContain('gezieltes Wiederholen');
  });

  test('no FSRS stability still gives recommendation', () => {
    const rec = feedbackEngine.generateStudyRecommendation(50, null, 'Allgemeine Chemie');
    expect(rec).toContain('Wiederholen');
    expect(rec).not.toContain('Stabilität');
  });
});

/* ------------------------------------------------------------------ */
/*  detectMisconception (internal, accessed via generateFeedback)       */
/* ------------------------------------------------------------------ */

describe('feedback generation with misconception detection', () => {
  test('correct answer produces positive feedback', async () => {
    const result = await feedbackEngine.generateFeedback({
      exercise: sampleExercise,
      userAnswer: 'A',
      gradeResult: { correct: true, score: 100, gradedBy: 'deterministic' },
      fsrsContext: { stability: 15, difficulty: 0.5 },
      studentLevel: 'mittel',
    });

    expect(result.summary).toBe('Richtig!');
    expect(result.detailedExplanation).toContain('korrekt');
    expect(result.studyRecommendation).toContain('Gut gemacht');
    expect(result.aiGenerated).toBe(true);
  });

  test('wrong MCQ answer identifies concept links', async () => {
    const result = await feedbackEngine.generateFeedback({
      exercise: sampleExercise,
      userAnswer: 'B',
      gradeResult: { correct: false, score: 0, gradedBy: 'deterministic' },
      fsrsContext: { stability: 5 },
      studentLevel: 'mittel',
    });

    expect(result.summary).toBe('Leider nicht richtig.');
    expect(result.detailedExplanation).toContain('Oxidation');
    expect(result.conceptLinks).toBeDefined();
    expect(result.conceptLinks.length).toBeGreaterThan(0);
    expect(result.studyRecommendation).toContain('Wiederholen');
  });

  test('partial credit feedback', async () => {
    const result = await feedbackEngine.generateFeedback({
      exercise: sampleExercise,
      userAnswer: 'A',
      gradeResult: { correct: true, score: 60, gradedBy: 'deterministic' },
      studentLevel: 'mittel',
    });

    expect(result.summary).toBe('Teilweise richtig (60%).');
  });

  test('caches feedback for identical inputs', async () => {
    // Clear cache first
    feedbackEngine.clearFeedbackCache();

    const params = {
      exercise: sampleExercise,
      userAnswer: 'B',
      gradeResult: { correct: false, score: 0, gradedBy: 'deterministic' },
      studentLevel: 'mittel',
    };

    // First call
    const result1 = await feedbackEngine.generateFeedback(params);
    expect(feedbackEngine.getFeedbackCacheSize()).toBe(1);

    // Second call with same params — should use cache
    const result2 = await feedbackEngine.generateFeedback(params);
    expect(result1.summary).toBe(result2.summary);
    expect(result1.detailedExplanation).toBe(result2.detailedExplanation);
  });

  test('AI disclaimer is appended', async () => {
    const result = await feedbackEngine.generateFeedback({
      exercise: sampleExercise,
      userAnswer: 'A',
      gradeResult: { correct: true, score: 100, gradedBy: 'deterministic' },
      studentLevel: 'leicht',
    });

    expect(result.detailedExplanation).toContain('mit Lehrenden besprechen');
  });
});

/* ------------------------------------------------------------------ */
/*  applyTeacherOverride                                               */
/* ------------------------------------------------------------------ */

describe('applyTeacherOverride', () => {
  const originalFeedback = {
    summary: 'Leider nicht richtig.',
    detailedExplanation: 'Automatisch generierte Erklärung.',
    conceptLinks: [{ slug: 'test', label: 'Test' }],
    studyRecommendation: 'Wiederholen Sie das Thema Test.',
    aiGenerated: true,
  };

  test('overrides summary and detailedExplanation', () => {
    const result = feedbackEngine.applyTeacherOverride(originalFeedback, 'Guter Ansatz, aber vergiss die Elektronenabgabe.');
    expect(result.summary).toBe('Lehrkraft-Kommentar:');
    expect(result.detailedExplanation).toBe('Guter Ansatz, aber vergiss die Elektronenabgabe.');
    expect(result.aiGenerated).toBe(false);
    expect(result.teacherOverride).toBe(true);
  });

  test('preserves study recommendation', () => {
    const result = feedbackEngine.applyTeacherOverride(originalFeedback, 'Gut gemacht!');
    expect(result.studyRecommendation).toBe('Wiederholen Sie das Thema Test.');
  });

  test('marks feedback as not AI-generated', () => {
    const result = feedbackEngine.applyTeacherOverride(originalFeedback, 'Prima!');
    expect(result.aiGenerated).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
/*  Cache management                                                   */
/* ------------------------------------------------------------------ */

describe('Cache management', () => {
  beforeEach(() => {
    feedbackEngine.clearFeedbackCache();
  });

  test('starts empty', () => {
    expect(feedbackEngine.getFeedbackCacheSize()).toBe(0);
  });

  test('clearFeedbackCache empties cache', () => {
    feedbackEngine.clearFeedbackCache();
    expect(feedbackEngine.getFeedbackCacheSize()).toBe(0);
  });
});
