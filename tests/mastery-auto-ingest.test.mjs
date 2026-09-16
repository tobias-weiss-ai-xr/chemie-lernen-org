/**
 * Auto-ingestion hook tests (formative-assessment 4.2 / 4.3).
 *
 * Verifies PUT /api/quiz-results folds quiz + FSRS evidence into ObjectiveState
 * mastery ONLY when ENABLE_MASTERY_AUTO_INGEST=true. When the flag is off the
 * hook must be a no-op. Upsert failures are swallowed (request still 200).
 *
 * The quiz route reads req.user (no requireAuth) so we can drive it directly
 * with a fake user object.
 */

import { vi, describe, test, expect, beforeEach, afterEach } from 'vitest';
import express from 'express';

// Mock stores & aggregation so the route never touches Neo4j / files.
vi.mock(
  '../api/auth-db.js',
  () => ({
    getDueCards: vi.fn(() => []),
    getQuizResults: vi.fn(() => []),
    getFsrsCards: vi.fn(() => []),
    addQuizResult: vi.fn(() => ({ ok: true })),
    createFsrsCard: vi.fn(() => ({ ok: true })),
    updateFsrsCard: vi.fn(),
  })
);

const mockAggregateMastery = vi.fn();
const mockMapTopicToObjectives = vi.fn();
vi.mock('../api/services/mastery-aggregator.js', () => ({
  aggregateMastery: mockAggregateMastery,
  mapTopicToObjectives: mockMapTopicToObjectives,
}));

const mockUpsert = vi.fn();
vi.mock('../api/services/zpd-engine.js', () => ({
  upsertObjectiveState: mockUpsert,
  nextObjectiveInZPD: vi.fn(),
  recommendedStrategy: vi.fn(),
  ZPD_THRESHOLDS: { thetaHigh: 0.8, thetaLow: 0.6 },
  bloomIndex: (l) => (l >= 1 && l <= 6 ? l : 0),
}));

// Import helpers from mocked modules.
const { getQuizResults, getFsrsCards, addQuizResult } = await import('../api/auth-db.js');

let router;

describe('quiz-results auto-ingest (formative 4.2/4.3)', () => {
  let server;
  let baseURL;

  beforeEach(() => {
    process.env.ENABLE_MASTERY_AUTO_INGEST = 'true';
    vi.clearAllMocks();
    mockUpsert.mockResolvedValue({ mastery: 0.8, bloomsMaxReached: 3 });
  });

  function mockQuizStore(quizResults = [], fsrsCards = []) {
    getQuizResults.mockReturnValue(quizResults);
    getFsrsCards.mockReturnValue(fsrsCards);
  }

  async function createQuizTestServer(authUser = { id: 7 }) {
    const app = express();
    app.disable('x-powered-by');
    app.use(express.json());
    app.use((req, _res, next) => {
      req.user = authUser;
      next();
    });
    app.use(router);
    server = app.listen(0);
    baseURL = `http://127.0.0.1:${server.address().port}`;
  }

  afterEach(async () => {
    if (server) await new Promise((resolve) => server.close(resolve));
    delete process.env.ENABLE_MASTERY_AUTO_INGEST;
  });

  test('upserts ObjectiveState via aggregated quiz+FSRS evidence (flag on)', async () => {
    process.env.ENABLE_MASTERY_AUTO_INGEST = 'true';
    mockQuizStore(
      [{ topic: 'Stoffe', percentage: 80 }],
      [{ topicId: 'Stoffe', question: 'x' }]
    );
    mockMapTopicToObjectives.mockResolvedValue(['lo-1', 'lo-2']);
    mockAggregateMastery.mockReturnValue({ mastery: 0.7, sources: ['quiz', 'fsrs'] });

    // re-import router fresh so ENABLE flag is read at module load.
    vi.resetModules();
    const { default: quizRouter } = await import('../api/routes/quiz.js');
    router = quizRouter;
    await createQuizTestServer();

    const res = await fetch(`${baseURL}/api/quiz-results`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic: 'Stoffe',
        score: 4,
        total: 5,
        answers: [],
      }),
    });
    expect(res.status).toBe(200);

    // distinct topics -> one mapTopicToObjectives call
    expect(mockMapTopicToObjectives).toHaveBeenCalledWith('Stoffe');
    // one upsert per resolved LO slug
    expect(mockUpsert).toHaveBeenCalledTimes(2);
    expect(mockUpsert).toHaveBeenCalledWith(7, 'lo-1', {
      mastery: 0.7,
      source: 'auto-ingest',
    });
  });

  test('no upsert when aggregator returns null mastery (no evidence)', async () => {
    process.env.ENABLE_MASTERY_AUTO_INGEST = 'true';
    mockQuizStore([{ topic: 'Thema ohne LO', percentage: 0 }]);
    mockMapTopicToObjectives.mockResolvedValue(['lo-1']);
    mockAggregateMastery.mockReturnValue({ mastery: null, sources: [] });

    vi.resetModules();
    const { default: quizRouter } = await import('../api/routes/quiz.js');
    router = quizRouter;
    await createQuizTestServer();

    const res = await fetch(`${baseURL}/api/quiz-results`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic: 'Thema ohne LO', score: 0, total: 5, answers: [] }),
    });
    expect(res.status).toBe(200);
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  test('does NOT auto-ingest when flag is off (no-op)', async () => {
    delete process.env.ENABLE_MASTERY_AUTO_INGEST; // flag off
    mockQuizStore([{ topic: 'Stoffe', percentage: 80 }]);

    vi.resetModules();
    const { default: quizRouter } = await import('../api/routes/quiz.js');
    router = quizRouter;
    await createQuizTestServer();

    const res = await fetch(`${baseURL}/api/quiz-results`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic: 'Stoffe', score: 4, total: 5, answers: [] }),
    });
    expect(res.status).toBe(200);
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  test('upsert failure is swallowed (request still 200)', async () => {
    process.env.ENABLE_MASTERY_AUTO_INGEST = 'true';
    mockQuizStore([{ topic: 'Stoffe', percentage: 80 }]);
    mockMapTopicToObjectives.mockResolvedValue(['lo-1']);
    mockAggregateMastery.mockReturnValue({ mastery: 0.7, sources: ['quiz'] });
    mockUpsert.mockRejectedValue(new Error('neo4j down'));

    vi.resetModules();
    const { default: quizRouter } = await import('../api/routes/quiz.js');
    router = quizRouter;
    await createQuizTestServer();

    const res = await fetch(`${baseURL}/api/quiz-results`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic: 'Stoffe', score: 4, total: 5, answers: [] }),
    });
    expect(res.status).toBe(200);
  });

  test('still saves the quiz result to the store (addQuizResult called)', async () => {
    process.env.ENABLE_MASTERY_AUTO_INGEST = 'true';
    mockQuizStore([{ topic: 'Stoffe', percentage: 80 }]);
    mockMapTopicToObjectives.mockResolvedValue(['lo-1']);
    mockAggregateMastery.mockReturnValue({ mastery: 0.7, sources: ['quiz'] });

    vi.resetModules();
    const { default: quizRouter } = await import('../api/routes/quiz.js');
    router = quizRouter;
    await createQuizTestServer();

    await fetch(`${baseURL}/api/quiz-results`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic: 'Stoffe', score: 4, total: 5, answers: [] }),
    });
    expect(addQuizResult).toHaveBeenCalledTimes(1);
  });
});