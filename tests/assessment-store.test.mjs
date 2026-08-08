/**
 * Unit tests for assessment-store.js — Neo4j persistence for assessment data.
 *
 * Covers: createAssessment, saveGradedAnswer, saveFeedback, teacherOverrideFeedback,
 *         getLearnerResults, getClassResults, getStudentList, getFeedbackForAnswer,
 *         batchSync, deleteUserAssessmentData.
 */

import { jest, describe, test, expect, beforeAll, beforeEach } from '@jest/globals';

/* ------------------------------------------------------------------ */
/*  Mock Neo4j driver                                                  */
/* ------------------------------------------------------------------ */

const mockSession = {
  run: jest.fn(),
  close: jest.fn().mockResolvedValue(undefined),
};

const mockDriver = {
  session: jest.fn(() => mockSession),
};

// Mock called via import from '../services/neo4j.js'
jest.unstable_mockModule(
  '../api/services/neo4j.js',
  () => ({
    getNeo4jDriver: jest.fn(() => mockDriver),
    NEO4J_DATABASE: 'chemie',
    toNumberSafe: (v) => (v == null || v === undefined ? undefined : Number(v)),
    // Mimic neo4j-int: returns an object with isFinite()/toNumber() so
    // queries can assert LIMIT/SKIP params are INTEGERs (not dangerous floats).
    toNeoInt: (v) => ({
      toNumber: () => Number(v),
      low: Number(v),
      high: 0,
      isInt: true,
    }),
  }),
  { virtual: false }
);

/* ------------------------------------------------------------------ */
/*  Import module under test                                           */
/* ------------------------------------------------------------------ */

let store;

function mockRecord(props) {
  return {
    get: (key) =>
      key === 'f' || key === 'g' || key === 'a' ? { properties: props[key] } : props[key],
  };
}

function mockQueryResult(records) {
  return { records: records.map(mockRecord) };
}

beforeAll(async () => {
  store = await import('../api/assessment-store.js');
});

beforeEach(() => {
  jest.clearAllMocks();
  mockSession.run.mockReset();
  mockSession.close.mockReset().mockResolvedValue(undefined);
  // Reset index bookkeeping so each test observes fresh index creation
  store.resetAssessmentIndexes();
});

/* ------------------------------------------------------------------ */
/*  createAssessment                                                   */
/* ------------------------------------------------------------------ */

describe('createAssessment', () => {
  test('creates assessment with learning objective links', async () => {
    mockSession.run.mockResolvedValue(
      mockQueryResult([
        { a: { id: 'assess-1', userId: 'user-1', topic: 'oxidation', difficulty: 'mittel' } },
      ])
    );

    const result = await store.createAssessment({
      userId: 'user-1',
      topic: 'oxidation',
      difficulty: 'mittel',
      learningObjectiveSlugs: ['oxidation-reduktion'],
      type: 'auto-generated',
    });

    expect(result).toBeDefined();
    expect(result.userId).toBe('user-1');
    expect(result.topic).toBe('oxidation');

    // Verify the session.run was called with the CREATE query
    const calls = mockSession.run.mock.calls;
    expect(calls.some(([query]) => query.includes('CREATE (a:Assessment'))).toBe(true);
    expect(mockSession.close).toHaveBeenCalled();
  });

  test('creates indexes on first call', async () => {
    mockSession.run.mockResolvedValue(mockQueryResult([{ a: { id: 'a1', userId: 'u1' } }]));

    await store.createAssessment({
      userId: 'u1',
      topic: 'test',
      difficulty: 'leicht',
      learningObjectiveSlugs: [],
    });

    // Should have called index CREATE queries
    const calls = mockSession.run.mock.calls;
    const indexCalls = calls.filter(([query]) => query.includes('CREATE INDEX'));
    expect(indexCalls.length).toBeGreaterThan(0);
  });

  test('handles index creation failure gracefully', async () => {
    // First call (index) throws, second call succeeds
    mockSession.run
      .mockRejectedValueOnce(new Error('Index exists'))
      .mockResolvedValue(mockQueryResult([{ a: { id: 'a2' } }]));

    const result = await store.createAssessment({
      userId: 'u1',
      topic: 'test',
      difficulty: 'mittel',
      learningObjectiveSlugs: [],
    });

    // Should still succeed despite index warning
    expect(result).toBeDefined();
  });
});

/* ------------------------------------------------------------------ */
/*  saveGradedAnswer                                                   */
/* ------------------------------------------------------------------ */

describe('saveGradedAnswer', () => {
  test('saves graded answer and links to assessment', async () => {
    mockSession.run.mockResolvedValue(
      mockQueryResult([{ g: { id: 'ga-1', exerciseId: 'ex-1', score: 100, correct: true } }])
    );

    const result = await store.saveGradedAnswer({
      assessmentId: 'assess-1',
      exerciseId: 'ex-1',
      userId: 'user-1',
      answer: 'A',
      correct: true,
      score: 100,
      gradedBy: 'deterministic',
    });

    expect(result).toBeDefined();
    expect(result.correct).toBe(true);
    expect(result.score).toBe(100);
    expect(mockSession.close).toHaveBeenCalled();
  });
});

/* ------------------------------------------------------------------ */
/*  saveFeedback                                                       */
/* ------------------------------------------------------------------ */

describe('saveFeedback', () => {
  test('saves feedback with concept references', async () => {
    mockSession.run.mockResolvedValue(
      mockQueryResult([{ f: { id: 'fb-1', text: 'Richtig!', aiGenerated: true } }])
    );

    const result = await store.saveFeedback({
      gradedAnswerId: 'ga-1',
      text: 'Richtig!',
      aiGenerated: true,
      conceptSlugs: ['oxidation'],
      loSlugs: ['oxidation-reduktion'],
    });

    expect(result).toBeDefined();
    expect(result.text).toBe('Richtig!');
    expect(mockSession.close).toHaveBeenCalled();
  });
});

/* ------------------------------------------------------------------ */
/*  teacherOverrideFeedback                                            */
/* ------------------------------------------------------------------ */

describe('teacherOverrideFeedback', () => {
  test('overrides feedback with teacher note', async () => {
    mockSession.run.mockResolvedValue(
      mockQueryResult([
        {
          f: {
            id: 'fb-1',
            teacherOverride: true,
            teacherNote: 'Besser machen!',
            text: 'Besser machen!',
          },
        },
      ])
    );

    const result = await store.teacherOverrideFeedback('fb-1', 'Besser machen!');

    expect(result).toBeDefined();
    expect(result.teacherOverride).toBe(true);
    expect(result.teacherNote).toBe('Besser machen!');
  });
});

/* ------------------------------------------------------------------ */
/*  getLearnerResults                                                  */
/* ------------------------------------------------------------------ */

describe('getLearnerResults', () => {
  test('returns paginated results with score', async () => {
    mockSession.run.mockResolvedValueOnce(mockQueryResult([{ total: 5 }])).mockResolvedValueOnce(
      mockQueryResult([
        {
          assessmentId: 'a1',
          topic: 'Oxidation',
          difficulty: 'mittel',
          date: '2026-08-06',
          correctCount: 3,
          totalCount: 5,
        },
        {
          assessmentId: 'a2',
          topic: 'Säuren',
          difficulty: 'schwer',
          date: '2026-08-05',
          correctCount: 4,
          totalCount: 4,
        },
      ])
    );

    const result = await store.getLearnerResults('user-1', 20, 0);

    expect(result.total).toBe(5);
    expect(result.results).toHaveLength(2);
    expect(result.results[0].topic).toBe('Oxidation');
    expect(result.results[0].score).toBe(60); // 3/5
    expect(result.results[1].score).toBe(100); // 4/4

    // Regression: Neo4j 5.x rejects float LIMIT/SKIP params. The
    // paginated query must pass INTEGERs (mimicked isInt: true), not
    // plain JS numbers that the driver serializes as FLOAT (20 → '20.0').
    const [query, params] = mockSession.run.mock.calls[1];
    expect(query).toContain('SKIP $offset');
    expect(query).toContain('LIMIT $limit');
    expect(params.offset.isInt).toBe(true);
    expect(params.limit.isInt).toBe(true);
    expect(params.limit.toNumber()).toBe(20);
  });

  test('handles empty results', async () => {
    mockSession.run
      .mockResolvedValueOnce(mockQueryResult([{ total: 0 }]))
      .mockResolvedValueOnce(mockQueryResult([]));

    const result = await store.getLearnerResults('unknown-user');

    expect(result.total).toBe(0);
    expect(result.results).toEqual([]);
  });
});

/* ------------------------------------------------------------------ */
/*  getClassResults                                                    */
/* ------------------------------------------------------------------ */

describe('getClassResults', () => {
  test('returns class average and topic breakdown', async () => {
    mockSession.run.mockResolvedValue(
      mockQueryResult([
        { topic: 'Oxidation', averageScore: 75, studentCount: 10, assessmentCount: 15 },
        { topic: 'Säuren', averageScore: 82, studentCount: 8, assessmentCount: 12 },
      ])
    );

    const result = await store.getClassResults('bw-gymnasium');

    expect(result).toBeDefined();
    expect(result.classAverage).toBeDefined();
    expect(result.topicBreakdown).toHaveLength(2);
    expect(result.topicBreakdown[0].topic).toBe('Oxidation');

    // Regression: assessments TESTS a LearningObjective, not the Topic — the
    // query must route cur→topic→LO and then <-[:TESTS].
    const q = mockSession.run.mock.calls[0][0];
    expect(q).toContain('HAS_TOPIC');
    expect(q).toContain('HAS_LEARNING_OBJECTIVE');
    expect(q).toContain('<-[:TESTS]-(a:Assessment)');
    expect(mockSession.run.mock.calls[0][1]).toMatchObject({ curriculumSlug: 'bw-gymnasium' });
  });
});

/* ------------------------------------------------------------------ */
/*  getStudentList                                                     */
/* ------------------------------------------------------------------ */

describe('getStudentList', () => {
  test('returns students ordered by average score', async () => {
    mockSession.run.mockResolvedValue(
      mockQueryResult([
        { userId: 'student-a', averageScore: 95, assessmentsCompleted: 10 },
        { userId: 'student-b', averageScore: 72, assessmentsCompleted: 8 },
      ])
    );

    const result = await store.getStudentList('bw-gymnasium');

    expect(result).toHaveLength(2);
    expect(result[0].userId).toBe('student-a');
    expect(result[0].averageScore).toBe(95);

    // Regression: the student list MUST be scoped to the given curriculum.
    // The old version ignored the param and returned every learner in the DB.
    const [q, params] = mockSession.run.mock.calls[0];
    expect(q).toContain('curriculumSlug');
    expect(q).toContain('HAS_LEARNING_OBJECTIVE');
    expect(params).toMatchObject({ curriculumSlug: 'bw-gymnasium' });
  });
});

/* ------------------------------------------------------------------ */
/*  getFeedbackForAnswer                                               */
/* ------------------------------------------------------------------ */

describe('getFeedbackForAnswer', () => {
  test('returns feedback with referenced concepts', async () => {
    mockSession.run.mockResolvedValue(
      mockQueryResult([
        {
          f: { id: 'fb-1', text: 'Gut gemacht!', aiGenerated: true },
          referencedConcepts: ['Oxidation'],
        },
      ])
    );

    const result = await store.getFeedbackForAnswer('ga-1');

    expect(result).toBeDefined();
    expect(result.text).toBe('Gut gemacht!');
    expect(result.referencedConcepts).toContain('Oxidation');
  });

  test('returns null when no feedback found', async () => {
    mockSession.run.mockResolvedValue(mockQueryResult([]));

    const result = await store.getFeedbackForAnswer('nonexistent');
    expect(result).toBeNull();
  });
});

/* ------------------------------------------------------------------ */
/*  batchSync                                                          */
/* ------------------------------------------------------------------ */

describe('batchSync', () => {
  test('syncs batch of assessment results', async () => {
    mockSession.run.mockResolvedValue(mockQueryResult([]));

    const batch = [
      {
        assessmentId: 'a1',
        userId: 'u1',
        topic: 'oxidation',
        difficulty: 'mittel',
        type: 'auto-generated',
      },
      {
        assessmentId: 'a2',
        userId: 'u1',
        topic: 'saeuren',
        difficulty: 'schwer',
        type: 'auto-generated',
      },
    ];

    const result = await store.batchSync(batch);

    expect(result.synced).toBe(2);
    expect(result.errors).toEqual([]);
  });

  test('reports errors per item', async () => {
    mockSession.run
      .mockResolvedValueOnce(mockQueryResult([]))
      .mockRejectedValueOnce(new Error('Connection timeout'));

    const batch = [
      { assessmentId: 'a1', userId: 'u1', topic: 'oxidation', difficulty: 'mittel' },
      { assessmentId: 'a2', userId: 'u1', topic: 'saeuren', difficulty: 'schwer' },
    ];

    const result = await store.batchSync(batch);

    expect(result.synced).toBe(1);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('Connection timeout');
  });

  test('persists queued graded answers and feedback (no silent drops)', async () => {
    mockSession.run.mockResolvedValue(mockQueryResult([]));

    const batch = [
      {
        assessmentId: 'a1',
        userId: 'u1',
        topic: 'oxidation',
        difficulty: 'mittel',
        gradedAnswers: [{ id: 'ga1', exerciseId: 'e1', answer: 'A', correct: true, score: 100 }],
        feedbacks: [{ id: 'fb1', gradedAnswerId: 'ga1', text: 'Weiter so!' }],
      },
    ];

    const result = await store.batchSync(batch);

    // 1 assessment + 1 graded answer + 1 feedback = 3 persisted records.
    expect(result.synced).toBe(3);
    expect(result.errors).toEqual([]);

    const queries = mockSession.run.mock.calls.map((c) => c[0]);
    expect(queries.some((q) => q.includes('MERGE (g:GradedAnswer'))).toBe(true);
    expect(queries.some((q) => q.includes('MERGE (f:Feedback'))).toBe(true);
    expect(queries.some((q) => q.includes('-[:FOR]->'))).toBe(true);
  });
});

/* ------------------------------------------------------------------ */
/*  deleteUserAssessmentData (GDPR)                                    */
/* ------------------------------------------------------------------ */

describe('deleteUserAssessmentData', () => {
  test('deletes all assessment data for a user', async () => {
    mockSession.run.mockResolvedValue(
      mockQueryResult([{ deletedFeedback: 5, deletedAnswers: 3, deletedAssessments: 2 }])
    );

    const result = await store.deleteUserAssessmentData('user-1');

    expect(result.deletedFeedback).toBe(5);
    expect(result.deletedAnswers).toBe(3);
    expect(result.deletedAssessments).toBe(2);
    expect(mockSession.close).toHaveBeenCalled();

    // Regression: must issue three independent, per-layer deletes so that
    // graded answers/assessments WITHOUT feedback are not leaked. The old
    // single chain only matched paths through a Feedback node.
    expect(mockSession.run).toHaveBeenCalledTimes(3);
    const queries = mockSession.run.mock.calls.map((c) => c[0]);
    expect(queries[0]).toContain('(f:Feedback)-[:FOR]->(g:GradedAnswer');
    expect(queries[1]).toContain('(g:GradedAnswer {userId:');
    expect(queries[2]).toContain('(a:Assessment {userId:');
  });

  test('delete is scoped to the given user only', async () => {
    mockSession.run.mockResolvedValue(
      mockQueryResult([{ deletedFeedback: 0, deletedAnswers: 0, deletedAssessments: 0 }])
    );
    await store.deleteUserAssessmentData('user-2');
    const params = mockSession.run.mock.calls.map((c) => c[1]);
    params.forEach((p) => expect(p.userId).toBe('user-2'));
  });
});
