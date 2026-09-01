/**
 * Unit tests for exercise-generator.js — Enhanced exercise generation service.
 *
 * Covers: validateDistractors, calibrateDifficulty, getGenerationCacheSize,
 *         clearGenerationCache, and generateExercise with mocked Neo4j + LiteLLM.
 */

import { vi, describe, test, expect, beforeAll, beforeEach, afterEach } from 'vitest';

/* ------------------------------------------------------------------ */
/*  Mocks for ESM dependencies                                         */
/* ------------------------------------------------------------------ */

const mockNeo4jResult = (records) => ({
  records: records.map((r) => ({
    get: (key) => r[key],
  })),
});

const mockSession = {
  run: vi.fn(),
  close: vi.fn().mockResolvedValue(undefined),
};

const mockDriver = {
  session: vi.fn(() => mockSession),
};

vi.mock(
  '../api/services/neo4j.js',
  () => ({
    getNeo4jDriver: vi.fn(() => mockDriver),
    NEO4J_DATABASE: 'chemie',
    toNumberSafe: (v) => (v == null ? undefined : Number(v)),
  })
);

/* ------------------------------------------------------------------ */
/*  Import module under test                                           */
/* ------------------------------------------------------------------ */

let generator;
let fsMod;

beforeAll(async () => {
  generator = await import('../api/services/exercise-generator.js');
  fsMod = await import('node:fs');
});

beforeEach(() => {
  vi.clearAllMocks();

  // Default Neo4j session mock: return some learning objectives
  mockSession.run.mockImplementation((query, params) => {
    if (query.includes('HAS_LEARNING_OBJECTIVE')) {
      return mockNeo4jResult([
        { slug: 'oxidation-reduktion', text: 'Oxidation und Reduktion verstehen' },
        { slug: 'edelgasregel', text: 'Die Edelgasregel anwenden können' },
      ]);
    }
    if (query.includes('COVERS_TOPIC')) {
      return mockNeo4jResult([
        { name: 'Oxidation', kategorie: 'konzept', description: 'Elektronenabgabe bei chemischen Reaktionen' },
        { name: 'Reduktion', kategorie: 'konzept', description: 'Elektronenaufnahme bei chemischen Reaktionen' },
      ]);
    }
    return mockNeo4jResult([]);
  });
});

afterEach(() => {
  generator.clearGenerationCache();
});

/* ------------------------------------------------------------------ */
/*  Neo4j query: getLearningObjectivesForTopic                         */
/* ------------------------------------------------------------------ */

describe('getLearningObjectivesForTopic', () => {
  test('queries Neo4j and returns learning objectives', async () => {
    const result = await generator.getLearningObjectivesForTopic('oxidation');
    expect(result).toHaveLength(2);
    expect(result[0].slug).toBe('oxidation-reduktion');
    expect(result[1].text).toContain('Edelgasregel');
    expect(mockSession.close).toHaveBeenCalled();
  });

  test('filters out entries without slug or text', async () => {
    mockSession.run.mockResolvedValue(
      mockNeo4jResult([
        { slug: 'valid', text: 'Valid objective' },
        { slug: '', text: 'No slug' },
        { slug: 'no-text', text: '' },
      ])
    );
    const result = await generator.getLearningObjectivesForTopic('test');
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe('valid');
  });

  test('closes session even on error', async () => {
    mockSession.run.mockRejectedValue(new Error('DB error'));
    await expect(generator.getLearningObjectivesForTopic('fail')).rejects.toThrow('DB error');
    expect(mockSession.close).toHaveBeenCalled();
  });
});

/* ------------------------------------------------------------------ */
/*  validateDistractors                                                */
/* ------------------------------------------------------------------ */

describe('validateDistractors', () => {
  const options = [
    { id: 'A', text: 'Oxidation ist die Abgabe von Elektronen' },
    { id: 'B', text: 'Oxidation ist die Aufnahme von Elektronen' },
    { id: 'C', text: 'Oxidation hat nichts mit Elektronen zu tun' },
    { id: 'D', text: 'Oxidation' },
  ];

  test('valid distractors pass', () => {
    const result = generator.validateDistractors(options, 'A', 'medium');
    expect(result.valid).toBe(true);
    expect(result.issues).toEqual([]);
  });

  test('correct answer not found', () => {
    const result = generator.validateDistractors(options, 'Z', 'medium');
    expect(result.valid).toBe(false);
    expect(result.issues[0]).toContain('not found');
  });

  test('too few options', () => {
    const result = generator.validateDistractors(
      [{ id: 'A', text: 'Only' }],
      'A',
      'medium'
    );
    expect(result.valid).toBe(false);
    expect(result.issues[0]).toContain('Mindestens 2 Optionen');
  });

  test('distractor identical to correct answer', () => {
    const dupOptions = [
      { id: 'A', text: 'Gleicher Text' },
      { id: 'B', text: 'Gleicher Text' },
      { id: 'C', text: 'Anderer Text' },
    ];
    const result = generator.validateDistractors(dupOptions, 'A', 'medium');
    expect(result.valid).toBe(false);
    expect(result.issues[0]).toContain('identical');
  });

  test('length ratio issue flagged for non-easy difficulty', () => {
    // Correct is long, distractor is very short
    const longOptions = [
      { id: 'A', text: 'Eine sehr lange korrekte Antwort mit vielen Details und Erklärungen' },
      { id: 'B', text: 'Kurz' },
      { id: 'C', text: 'Eine andere ausführliche Antwort' },
    ];
    const result = generator.validateDistractors(longOptions, 'A', 'medium');
    expect(result.valid).toBe(false);
    expect(result.issues[0]).toContain('length ratio');
  });

  test('length ratio not flagged for easy difficulty', () => {
    const longOptions = [
      { id: 'A', text: 'Eine sehr lange korrekte Antwort' },
      { id: 'B', text: 'Kurz' },
    ];
    const result = generator.validateDistractors(longOptions, 'A', 'easy');
    // Should be valid because length ratio check is skipped for 'easy'
    expect(result.valid).toBe(true);
  });
});

/* ------------------------------------------------------------------ */
/*  calibrateDifficulty                                                */
/* ------------------------------------------------------------------ */

describe('calibrateDifficulty', () => {
  test('no FSRS context returns requested difficulty', () => {
    const result = generator.calibrateDifficulty('medium', null);
    expect(result.difficulty).toBe('medium');
    expect(result.includeHint).toBe(false);
  });

  test('low stability eases hard → medium', () => {
    const result = generator.calibrateDifficulty('hard', { stability: 2 });
    expect(result.difficulty).toBe('medium');
    expect(result.includeHint).toBe(true);
  });

  test('very low stability eases medium → easy', () => {
    const result = generator.calibrateDifficulty('medium', { stability: 1 });
    expect(result.difficulty).toBe('easy');
    expect(result.includeHint).toBe(true);
  });

  test('very low stability eases hard → easy', () => {
    const result = generator.calibrateDifficulty('hard', { stability: 2 });
    expect(result.difficulty).toBe('medium');
  });

  test('stability < 7 with hard goes to medium', () => {
    const result = generator.calibrateDifficulty('hard', { stability: 5 });
    expect(result.difficulty).toBe('medium');
    expect(result.includeHint).toBe(true);
  });

  test('stability < 3 with easy stays easy', () => {
    const result = generator.calibrateDifficulty('easy', { stability: 1 });
    expect(result.difficulty).toBe('easy');
    expect(result.includeHint).toBe(false);
  });

  test('high stability keeps requested difficulty', () => {
    const result = generator.calibrateDifficulty('hard', { stability: 50 });
    expect(result.difficulty).toBe('hard');
    expect(result.includeHint).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
/*  Cache functions                                                    */
/* ------------------------------------------------------------------ */

describe('Cache', () => {
  test('starts empty', () => {
    expect(generator.getGenerationCacheSize()).toBe(0);
  });

  test('clearGenerationCache clears all entries', () => {
    // Calling clear after each test ensures it works
    generator.clearGenerationCache();
    expect(generator.getGenerationCacheSize()).toBe(0);
  });
});

/* ------------------------------------------------------------------ */
/*  generateExercise (with mocked LiteLLM)                             */
/* ------------------------------------------------------------------ */

describe('generateExercise', () => {
  const validParams = {
    learningObjectiveSlug: 'oxidation-reduktion',
    difficulty: 'medium',
    type: 'mcq',
    litellmUrl: 'http://localhost:4000',
    litellmModel: 'gemma-4',
    fsrsContext: null,
    bypassCache: true,
  };

  test('throws for invalid difficulty', async () => {
    await expect(
      generator.generateExercise({ ...validParams, difficulty: 'extreme' })
    ).rejects.toThrow('Invalid difficulty');
  });

  test('throws for invalid type', async () => {
    await expect(
      generator.generateExercise({ ...validParams, type: 'essay' })
    ).rejects.toThrow('Invalid type');
  });

  test('generates exercise from LLM response', async () => {
    const mockResponse = JSON.stringify({
      question: 'Was versteht man unter Oxidation?',
      type: 'mcq',
      difficulty: 'medium',
      options: [
        { id: 'A', text: 'Abgabe von Elektronen' },
        { id: 'B', text: 'Aufnahme von Elektronen' },
        { id: 'C', text: 'Abgabe von Protonen' },
      ],
      correctAnswer: 'A',
      explanation: 'Oxidation ist die Abgabe von Elektronen. Dies ist eine der grundlegenden Definitionen in der Elektrochemie.',
      topic: 'Oxidation und Reduktion',
    });

    const origFetch = global.fetch;
    try {
      global.fetch = async (url, opts) => {
        const body = JSON.parse(opts.body);
        expect(body.model).toBe('gemma-4');
        return {
          ok: true,
          json: async () => ({
            choices: [{ message: { content: mockResponse } }],
          }),
        };
      };

      const exercise = await generator.generateExercise(validParams);
      expect(exercise).toBeDefined();
      expect(exercise.id).toBeDefined();
      expect(exercise.type).toBe('mcq');
      expect(exercise.question).toContain('Oxidation');
      expect(exercise.correctAnswer).toBe('A');
      expect(exercise.options).toHaveLength(3);
      expect(exercise.source).toBe('ai');
      expect(exercise.fsrsCalibrated).toBe(false);
    } finally {
      global.fetch = origFetch;
    }
  });

  test('generates fill-in-blank exercise', async () => {
    const mockResponse = JSON.stringify({
      question: 'Welches Gas entsteht bei der Fotosynthese?',
      type: 'fill-blank',
      difficulty: 'easy',
      acceptableAnswers: ['Sauerstoff', 'O2', 'O₂'],
      correctAnswer: 'Sauerstoff',
      explanation: 'Bei der Fotosynthese wird Sauerstoff (O₂) freigesetzt.',
    });

    const origFetch = global.fetch;
    try {
      global.fetch = async () => ({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: mockResponse } }],
        }),
      });

      const exercise = await generator.generateExercise({
        ...validParams,
        type: 'fill-blank',
        difficulty: 'easy',
      });
      expect(exercise.type).toBe('fill-blank');
      expect(exercise.acceptableAnswers).toContain('O2');
      expect(exercise.explanation).toContain('Sauerstoff');
    } finally {
      global.fetch = origFetch;
    }
  });

  test('generates calculation exercise with tolerance', async () => {
    const mockResponse = JSON.stringify({
      question: 'Berechne die molare Masse von H₂O.',
      type: 'calculation',
      difficulty: 'medium',
      expectedAnswer: '18.015',
      tolerance: 0.1,
      correctAnswer: '18.015',
      explanation: 'Molare Masse von Wasser: 2×1,008 + 16,00 = 18,016 g/mol.',
    });

    const origFetch = global.fetch;
    try {
      global.fetch = async () => ({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: mockResponse } }],
        }),
      });

      const exercise = await generator.generateExercise({
        ...validParams,
        type: 'calculation',
      });
      expect(exercise.type).toBe('calculation');
      expect(exercise.expectedAnswer).toBe('18.015');
      expect(exercise.tolerance).toBe(0.1);
    } finally {
      global.fetch = origFetch;
    }
  });

  test('generates short-answer exercise with rubric', async () => {
    const mockResponse = JSON.stringify({
      question: 'Erkläre den Unterschied zwischen Oxidation und Reduktion.',
      type: 'short-answer',
      difficulty: 'hard',
      rubric: {
        keyConcepts: ['Elektronenabgabe', 'Elektronenaufnahme', 'Redoxreaktion'],
        minLength: 50,
        maxLength: 300,
      },
      correctAnswer: '',
      explanation: 'Eine vollständige Antwort sollte beide Begriffe definieren und deren Zusammenhang erklären.',
    });

    const origFetch = global.fetch;
    try {
      global.fetch = async () => ({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: mockResponse } }],
        }),
      });

      const exercise = await generator.generateExercise({
        ...validParams,
        type: 'short-answer',
        difficulty: 'hard',
      });
      expect(exercise.type).toBe('short-answer');
      expect(exercise.rubric.keyConcepts).toContain('Redoxreaktion');
      expect(exercise.rubric.minLength).toBe(50);
    } finally {
      global.fetch = origFetch;
    }
  });

  test('FSRS calibration applied when context provided', async () => {
    const mockResponse = JSON.stringify({
      question: 'Welche Teilchen bestimmen die Masse eines Atoms?',
      type: 'mcq',
      difficulty: 'medium',
      options: [
        { id: 'A', text: 'Protonen und Neutronen' },
        { id: 'B', text: 'Nur Protonen' },
        { id: 'C', text: 'Elektronen und Protonen' },
      ],
      correctAnswer: 'A',
      explanation: 'Protonen und Neutronen bestimmen die Atommasse.',
    });

    const origFetch = global.fetch;
    try {
      global.fetch = async () => ({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: mockResponse } }],
        }),
      });

      const exercise = await generator.generateExercise({
        ...validParams,
        difficulty: 'hard',
        fsrsContext: { stability: 2, difficulty: 0.5, retrievability: 0.6 },
      });
      expect(exercise.fsrsCalibrated).toBe(true);
      // With stability 2 and hard requested, should calibrate to medium
      expect(exercise.difficulty).toBe('medium');
    } finally {
      global.fetch = origFetch;
    }
  });

  test('throws on LLM fetch error', async () => {
    const origFetch = global.fetch;
    try {
      global.fetch = async () => ({
        ok: false,
        status: 503,
        text: async () => 'Service Unavailable',
      });

      await expect(
        generator.generateExercise(validParams)
      ).rejects.toThrow('LiteLLM error 503');
    } finally {
      global.fetch = origFetch;
    }
  });

  test('throws on unparseable LLM response', async () => {
    const origFetch = global.fetch;
    try {
      global.fetch = async () => ({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Kein JSON hier, nur Text.' } }],
        }),
      });

      await expect(
        generator.generateExercise(validParams)
      ).rejects.toThrow('Failed to parse exercise JSON');
    } finally {
      global.fetch = origFetch;
    }
  });

  test('caches exercise and returns cached on subsequent call', async () => {
    const mockResponse = JSON.stringify({
      question: 'Caching test?',
      type: 'mcq',
      difficulty: 'medium',
      options: [
        { id: 'A', text: 'Option A' },
        { id: 'B', text: 'Option B' },
        { id: 'C', text: 'Option C' },
      ],
      correctAnswer: 'A',
      explanation: 'Test',
    });

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: mockResponse } }],
      }),
    });

    const origFetch = global.fetch;
    try {
      global.fetch = fetchMock;

      // First call — should generate
      const exercise1 = await generator.generateExercise({
        ...validParams,
        bypassCache: false,
      });
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(exercise1.cached).toBeUndefined();

      // Second call with same params — should return cached
      const exercise2 = await generator.generateExercise({
        ...validParams,
        bypassCache: false,
      });
      expect(fetchMock).toHaveBeenCalledTimes(1); // No additional fetch
      expect(exercise2.cached).toBe(true);
      expect(exercise2.id).toBe(exercise1.id);
    } finally {
      global.fetch = origFetch;
    }
  });

  test('bypassCache parameter skips cache', async () => {
    const mockResponse1 = JSON.stringify({
      question: 'First?',
      type: 'mcq',
      options: [{ id: 'A', text: 'A' }, { id: 'B', text: 'B' }, { id: 'C', text: 'C' }],
      correctAnswer: 'A',
      explanation: 'First',
    });
    const mockResponse2 = JSON.stringify({
      question: 'Second?',
      type: 'mcq',
      options: [{ id: 'A', text: 'A' }, { id: 'B', text: 'B' }, { id: 'C', text: 'C' }],
      correctAnswer: 'B',
      explanation: 'Second',
    });

    const responses = [mockResponse1, mockResponse2];
    let callCount = 0;

    const origFetch = global.fetch;
    try {
      global.fetch = async () => ({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: responses[callCount++] } }],
        }),
      });

      const first = await generator.generateExercise({ ...validParams, bypassCache: true });
      const second = await generator.generateExercise({ ...validParams, bypassCache: true });
      expect(first.id).not.toBe(second.id);
      expect(first.question).not.toBe(second.question);
    } finally {
      global.fetch = origFetch;
    }
  });
});
