/**
 * Regression guard: POST /api/zpd/mastery must record persistent completion
 * (users.json via auth-db completeObjective) when mastery >= thetaHigh.
 *
 * Context: the Sprint-14 progress writer (markLosComplete) was dropped as dead
 * code, leaving completedObjectives without any caller — learning-path list /
 * detail progressPercent and objective checkmarks were permanently stuck at 0.
 * The ZPD mastery endpoint is the natural writer for the feature.
 *
 * @jest-environment node
 */

import { jest, describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import express from 'express';

const mockCompleteObjective = jest.fn();
const mockUpsert = jest.fn();

jest.unstable_mockModule(
  '../api/auth.js',
  () => ({
    requireAuth: jest.fn((req, res, next) => {
      if (!req.user?.id) return res.status(401).json({ error: 'Authentication required' });
      next();
    }),
  }),
  { virtual: false }
);

jest.unstable_mockModule(
  '../api/services/zpd-engine.js',
  () => ({
    nextObjectiveInZPD: jest.fn(),
    recommendedStrategy: jest.fn(),
    upsertObjectiveState: mockUpsert,
    ZPD_THRESHOLDS: { thetaHigh: 0.8, thetaLow: 0.6 },
  }),
  { virtual: false }
);

jest.unstable_mockModule(
  '../api/auth-db.js',
  () => ({
    completeObjective: mockCompleteObjective,
  }),
  { virtual: false }
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
    mockUpsert.mockResolvedValue({ mastery: 0.9, bloomsMaxReached: 3 });
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
