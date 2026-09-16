/**
 * Regression guard: POST /api/zpd/mastery must record persistent completion
 * (users.json via auth-db completeObjective) when mastery >= thetaHigh.
 *
 * Context: the Sprint-14 progress writer (markLosComplete) was dropped as dead
 * code, leaving completedObjectives without any caller — learning-path list /
 * detail progressPercent and objective checkmarks were permanently stuck at 0.
 * The ZPD mastery endpoint is the natural writer for the feature.
 *
 * @vitest-environment node
 */

import { vi, describe, test, expect, beforeEach, afterEach } from 'vitest';
import express from 'express';

const mockCompleteObjective = vi.fn();
const mockUpsert = vi.fn();
const mockNextObjective = vi.fn();
const mockRecommendedStrategy = vi.fn();
const mockCountObjectiveStates = vi.fn();
const mockGetQuizResults = vi.fn();
const mockGetFsrsCards = vi.fn();
const mockAggregateMastery = vi.fn();
const mockMapTopicToObjectives = vi.fn();

vi.mock(
  '../api/auth.js',
  () => ({
    requireAuth: vi.fn((req, res, next) => {
      if (!req.user?.id) return res.status(401).json({ error: 'Authentication required' });
      next();
    }),
  })
);

vi.mock(
  '../api/services/zpd-engine.js',
  () => ({
    nextObjectiveInZPD: mockNextObjective,
    recommendedStrategy: mockRecommendedStrategy,
    upsertObjectiveState: mockUpsert,
    countObjectiveStates: mockCountObjectiveStates,
    ZPD_THRESHOLDS: { thetaHigh: 0.8, thetaLow: 0.6 },
    bloomIndex: (l) => (l >= 1 && l <= 6 ? l : 0),
  })
);

vi.mock(
  '../api/auth-db.js',
  () => ({
    completeObjective: mockCompleteObjective,
    getQuizResults: mockGetQuizResults,
    getFsrsCards: mockGetFsrsCards,
    getBloomTarget: () => 6,
    setBloomTarget: () => ({ ok: true, targetBloomIndex: 6 }),
  })
);

vi.mock(
  '../api/services/mastery-aggregator.js',
  () => ({
    aggregateMastery: mockAggregateMastery,
    mapTopicToObjectives: mockMapTopicToObjectives,
  })
);

vi.mock(
  '../api/services/bloom-target.js',
  () => ({
    getBloomTarget: () => 6,
    setBloomTarget: (id, target) =>
      target === 6 || target === 'create' || target === 'CREATE'
        ? { ok: true, targetBloomIndex: 6, bloomLevel: 'create' }
        : { ok: true, targetBloomIndex: 4, bloomLevel: 'analyze' },
    normalizeBloomTarget: (t) => (t >= 1 && t <= 6 ? t : null),
    bloomIndex: (l) => (l >= 1 && l <= 6 ? l : 0),
  })
);

const { default: router } = await import('../api/routes/zpd.js');

function createTestServer(authUser = null) {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json());
  app.use((req, res, next) => {
    req.user = authUser;
    next();
  });
  app.use(router);
  const server = app.listen(0);
  const baseURL = `http://127.0.0.1:${server.address().port}`;
  return { server, baseURL };
}

const SLUG = 'BB-sek-i-gemeinsamer-rlp-berlin-brandenburg-x';

describe('POST /api/zpd/mastery → completeObjective wiring', () => {
  let server;
  let baseURL;

  beforeEach(() => {
    mockCompleteObjective.mockClear();
    mockUpsert.mockReset();
    mockNextObjective.mockReset();
    mockRecommendedStrategy.mockReset();
    mockCountObjectiveStates.mockReset();
    mockGetQuizResults.mockReset();
    mockGetFsrsCards.mockReset();
    mockAggregateMastery.mockReset();
    mockMapTopicToObjectives.mockReset();
    mockUpsert.mockResolvedValue({ mastery: 0.9, bloomsMaxReached: 3 });
    mockCountObjectiveStates.mockResolvedValue(10); // >0 => no cold-start
    mockGetQuizResults.mockReturnValue([]);
    mockGetFsrsCards.mockReturnValue([]);
  });

  afterEach(async () => {
    if (server) await new Promise((resolve) => server.close(resolve));
  });

  async function postMastery(mastery) {
    ({ server, baseURL } = createTestServer({ id: 7 }));
    return fetch(`${baseURL}/api/zpd/mastery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ objectiveSlug: SLUG, mastery }),
    });
  }

  test('mastery >= thetaHigh (0.8) records completion', async () => {
    const res = await postMastery(0.9);
    expect(res.status).toBe(200);
    expect(mockCompleteObjective).toHaveBeenCalledWith(7, SLUG);
  });

  test('boundary mastery 0.8 records completion', async () => {
    await postMastery(0.8);
    expect(mockCompleteObjective).toHaveBeenCalledWith(7, SLUG);
  });

  test('mastery below thetaHigh does NOT record completion', async () => {
    const res = await postMastery(0.5);
    expect(res.status).toBe(200);
    expect(mockCompleteObjective).not.toHaveBeenCalled();
  });

  test('unknown objective returns 404 and skips completion', async () => {
    mockUpsert.mockResolvedValue(null);
    const res = await postMastery(0.9);
    expect(res.status).toBe(404);
    expect(mockCompleteObjective).not.toHaveBeenCalled();
  });
});

describe('GET/POST /api/zpd/bloom-target (differentiation)', () => {
  let server;
  let baseURL;

  afterEach(async () => {
    if (server) await new Promise((resolve) => server.close(resolve));
  });

  test('returns 401 when unauthenticated', async () => {
    ({ server, baseURL } = createTestServer(null));
    const res = await fetch(`${baseURL}/api/zpd/bloom-target`);
    expect(res.status).toBe(401);
  });

  test('GET returns the user Bloom target with level', async () => {
    ({ server, baseURL } = createTestServer({ id: 7 }));
    const res = await fetch(`${baseURL}/api/zpd/bloom-target`);
    expect(res.status).toBe(200);
    const body = await res.json();
    // auth-db mock returns getBloomTarget()=6 → bloomIndex(6)=6, level from index
    expect(body.ok).toBe(true);
    expect(body.targetBloomIndex).toBe(6);
    expect(body.bloomLevel).toBe(6); // mocked bloomIndex numeric passthrough
  });

  test('POST accepts a Bloom level string and returns bloomLevel', async () => {
    ({ server, baseURL } = createTestServer({ id: 7 }));
    const res = await fetch(`${baseURL}/api/zpd/bloom-target`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetBloomIndex: 'analyze' }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.targetBloomIndex).toBe(4); // 'analyze' → index 4 via bloom-target mock
  });

  test('POST rejects a missing target', async () => {
    ({ server, baseURL } = createTestServer({ id: 7 }));
    const res = await fetch(`${baseURL}/api/zpd/bloom-target`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/zpd/thresholds + threshold params (formative-assessment)', () => {
  let server;
  let baseURL;

  afterEach(async () => {
    if (server) await new Promise((resolve) => server.close(resolve));
  });

  beforeEach(() => {
    mockUpsert.mockReset();
    mockNextObjective.mockReset();
    mockRecommendedStrategy.mockReset();
    mockAggregateMastery.mockReset();
    mockMapTopicToObjectives.mockReset();
    mockCountObjectiveStates.mockResolvedValue(10); // >0 => no cold-start
    mockGetQuizResults.mockReturnValue([]);
    mockGetFsrsCards.mockReturnValue([]);
  });

  test('GET /api/zpd/thresholds returns defaults without auth', async () => {
    ({ server, baseURL } = createTestServer(null));
    const res = await fetch(`${baseURL}/api/zpd/thresholds`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.thetaHigh).toBe(0.8);
    expect(body.thetaLow).toBe(0.6);
  });

  test('/next passes clamped thresholds + echoes them', async () => {
    mockNextObjective.mockResolvedValue({ slug: SLUG, bloom: 3 });
    mockRecommendedStrategy.mockReturnValue('scaffold');
    ({ server, baseURL } = createTestServer({ id: 7 }));
    const res = await fetch(`${baseURL}/api/zpd/next?thetaHigh=0.9&thetaLow=0.4`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(mockNextObjective).toHaveBeenCalledWith(
      7,
      null,
      { thetaHigh: 0.9, thetaLow: 0.4 },
      null
    );
    expect(body.thresholds).toEqual({ thetaHigh: 0.9, thetaLow: 0.4 });
  });

  test('/next clamps out-of-range theta + keeps high >= low', async () => {
    mockNextObjective.mockResolvedValue(null);
    ({ server, baseURL } = createTestServer({ id: 7 }));
    const res = await fetch(`${baseURL}/api/zpd/next?thetaHigh=9&thetaLow=0`);
    expect(res.status).toBe(200);
    const body = await res.json();
    // thetaHigh=9 invalid -> fallback 0.8; thetaLow=0 invalid -> fallback 0.6
    expect(body.thresholds).toEqual({ thetaHigh: 0.8, thetaLow: 0.6 });
  });

  test('/next with no theta params falls back to defaults', async () => {
    mockNextObjective.mockResolvedValue(null);
    ({ server, baseURL } = createTestServer({ id: 7 }));
    const res = await fetch(`${baseURL}/api/zpd/next`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.thresholds).toEqual({ thetaHigh: 0.8, thetaLow: 0.6 });
  });

  test('/next triggers no cold-start when the user already has states', async () => {
    mockCountObjectiveStates.mockResolvedValue(5);
    mockNextObjective.mockResolvedValue(null);
    mockGetQuizResults.mockReturnValue([{ topic: 'Stoffe', percentage: 80 }]);
    ({ server, baseURL } = createTestServer({ id: 7 }));
    await fetch(`${baseURL}/api/zpd/next`);
    expect(mockMapTopicToObjectives).not.toHaveBeenCalled();
    expect(mockUpsert).not.toHaveBeenCalled();
  });
});

describe('cold-start seeding (formative-assessment 2.2/2.3)', () => {
  let server;
  let baseURL;

  beforeEach(() => {
    // Isolate call counts from prior describes / tests.
    mockUpsert.mockReset();
    mockGetQuizResults.mockReset();
    mockGetFsrsCards.mockReset();
    mockMapTopicToObjectives.mockReset();
    mockAggregateMastery.mockReset();
    mockNextObjective.mockReset();
  });

  afterEach(async () => {
    if (server) await new Promise((resolve) => server.close(resolve));
  });

  test('seeds ObjectiveState from quiz topics via mapTopicToObjectives', async () => {
    mockCountObjectiveStates.mockResolvedValue(0); // no states -> cold-start
    mockGetQuizResults.mockReturnValue([
      { topic: 'Stoffe', percentage: 60 },
      { topic: 'Stoffe', percentage: 90 },
    ]);
    mockGetFsrsCards.mockReturnValue([]);
    mockMapTopicToObjectives.mockResolvedValue(['lo-1']);
    mockAggregateMastery.mockReturnValue({ mastery: 0.75, sources: ['quiz'] });
    mockUpsert.mockResolvedValue({ mastery: 0.75, bloomsMaxReached: 3 });
    mockNextObjective.mockResolvedValue(null);

    ({ server, baseURL } = createTestServer({ id: 7 }));
    const res = await fetch(`${baseURL}/api/zpd/next`);
    expect(res.status).toBe(200);

    // dedicated to the distinct topic once
    expect(mockMapTopicToObjectives).toHaveBeenCalledTimes(1);
    expect(mockMapTopicToObjectives).toHaveBeenCalledWith('Stoffe');
    // aggregate called once per resolved LO slug
    expect(mockAggregateMastery).toHaveBeenCalled();
    expect(mockUpsert).toHaveBeenCalledTimes(1);
    expect(mockUpsert).toHaveBeenCalledWith(7, 'lo-1', {
      mastery: 0.75,
      source: 'cold-start',
    });
  });

  test('runs cold-start at most once per process+userId (2.3 cache)', async () => {
    mockCountObjectiveStates.mockResolvedValue(0);
    mockGetQuizResults.mockReturnValue([{ topic: 'Alkane', percentage: 70 }]);
    mockGetFsrsCards.mockReturnValue([]);
    mockMapTopicToObjectives.mockResolvedValue(['lo-x']);
    mockAggregateMastery.mockReturnValue({ mastery: 0.7, sources: ['quiz'] });
    mockUpsert.mockResolvedValue({ mastery: 0.7, bloomsMaxReached: 3 });
    mockNextObjective.mockResolvedValue(null);

    ({ server, baseURL } = createTestServer({ id: 8 }));
    await fetch(`${baseURL}/api/zpd/next`);
    await fetch(`${baseURL}/api/zpd/next`);

    // First request sets the cache; the second short-circuits.
    expect(mockUpsert).toHaveBeenCalledTimes(1);
  });

  test('cold-start failures are swallowed (request still 200)', async () => {
    mockCountObjectiveStates.mockResolvedValue(0);
    mockGetQuizResults.mockReturnValue([{ topic: 'Stoffe', percentage: 80 }]);
    mockGetFsrsCards.mockReturnValue([]);
    mockMapTopicToObjectives.mockRejectedValue(new Error('neo4j down'));
    mockNextObjective.mockResolvedValue(null);

    ({ server, baseURL } = createTestServer({ id: 9 }));
    const res = await fetch(`${baseURL}/api/zpd/next`);
    expect(res.status).toBe(200);
  });
});
