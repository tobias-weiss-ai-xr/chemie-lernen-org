/**
 * @vitest-environment node
 *
 * Unit tests for Bloom-target exposure on the public gamification profile
 * routes (zpd-deepdive-differentiation, GAM-BLOOM-1..4).
 *
 * GET /api/gamification/profile — response includes targetBloomIndex /
 * bloomLevel / isDefaultBloomTarget.
 * POST /api/gamification/profile — accepts targetBloomIndex or bloomLevel and
 * returns the set value; rejects invalid values with 400.
 */

import { vi, describe, test, expect, beforeAll } from 'vitest';
import express from 'express';

const mockGetBloomTarget = vi.fn(() => 4);
const mockSetBloomTarget = vi.fn(() => ({ ok: true, targetBloomIndex: 4, bloomLevel: 'analyze' }));
const mockGetGamification = vi.fn();
const mockGetBadgeStatus = vi.fn();
const mockCalculateLevel = vi.fn((xp) => Math.floor(xp / 500) + 1);
const mockAwardXp = vi.fn();
const mockRecordCheckin = vi.fn();
const mockCheckBadgeUnlock = vi.fn(() => []);

vi.mock('pino', () => ({
  default: () => ({ info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn(), child: () => ({ info: vi.fn(), error: vi.fn() }) }),
}));
vi.mock('../api/auth.js', () => ({
  requireAuth: (req, res, next) => { req.user = req.user || { id: 'user-game-1' }; next(); },
}));
vi.mock('../api/auth-db.js', () => ({
  getGamification: (id) => mockGetGamification(id),
  awardXp: (id, ...a) => mockAwardXp(id, ...a),
  recordCheckin: (id, ...a) => mockRecordCheckin(id, ...a),
  checkBadgeUnlock: (id, ...a) => mockCheckBadgeUnlock(id, ...a),
  getBadgeStatus: (id) => mockGetBadgeStatus(id),
  calculateLevel: (xp) => mockCalculateLevel(xp),
}));
vi.mock('../api/learning-engine.js', () => ({
  getAggregatedProgress: vi.fn(() => ({})),
  enrollInPath: vi.fn(() => ({})),
}));
vi.mock('../api/services/badges.js', () => ({
  BADGE_INFO: [],
}));
vi.mock('../api/services/session.js', () => ({
  sessionStore: { get: vi.fn(() => null), set: vi.fn() },
}));
vi.mock('../api/services/bloom-target.js', () => ({
  getBloomTarget: (id) => mockGetBloomTarget(id),
  setBloomTarget: (id, v) => mockSetBloomTarget(id, v),
}));

let router;

beforeAll(async () => {
  // Sync initial mocks.
  mockGetGamification.mockReturnValue({
    xp: 1500,
    streak: 2,
    lastCheckin: '2026-09-01',
    xpLog: [{ action: 'quiz', amount: 100 }],
    badges: [],
    completedObjectives: [],
  });
  mockGetBadgeStatus.mockReturnValue([]);
  const mod = await import('../api/routes/gamification.js');
  router = mod.default;
});

function createServer() {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json());
  app.use((req, res, next) => {
    req.user = { id: 'user-game-1' };
    next();
  });
  app.use(router);
  return app.listen(0);
}

function closeServer(srv) {
  return new Promise((resolve) => srv.close(() => resolve()));
}

describe('gamification profile Bloom target (differentiation)', () => {
  test('GET profile includes targetBloomIndex / bloomLevel / isDefaultBloomTarget', async () => {
    mockGetBloomTarget.mockReturnValue(4);
    const srv = createServer();
    const base = `http://localhost:${srv.address().port}`;
    try {
      const res = await fetch(`${base}/api/gamification/profile`);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.targetBloomIndex).toBe(4);
      expect(body.bloomLevel).toBe('analyze');
      expect(body.isDefaultBloomTarget).toBe(false);
    } finally {
      await closeServer(srv);
    }
  });

  test('GET profile flags isDefaultBloomTarget when target is 6', async () => {
    mockGetBloomTarget.mockReturnValue(6);
    const srv = createServer();
    const base = `http://localhost:${srv.address().port}`;
    try {
      const res = await fetch(`${base}/api/gamification/profile`);
      const body = await res.json();
      expect(body.bloomLevel).toBe('create');
      expect(body.isDefaultBloomTarget).toBe(true);
    } finally {
      await closeServer(srv);
    }
  });

  test('POST profile accepts targetBloomIndex and returns value', async () => {
    mockSetBloomTarget.mockReturnValue({ ok: true, targetBloomIndex: 4, bloomLevel: 'analyze' });
    const srv = createServer();
    const base = `http://localhost:${srv.address().port}`;
    try {
      const res = await fetch(`${base}/api/gamification/profile`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ targetBloomIndex: 4 }),
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(mockSetBloomTarget).toHaveBeenCalledWith('user-game-1', 4);
      expect(body).toMatchObject({ targetBloomIndex: 4, bloomLevel: 'analyze', isDefaultBloomTarget: false });
    } finally {
      await closeServer(srv);
    }
  });

  test('POST profile accepts bloomLevel string', async () => {
    mockSetBloomTarget.mockReturnValue({ ok: true, targetBloomIndex: 3, bloomLevel: 'apply' });
    const srv = createServer();
    const base = `http://localhost:${srv.address().port}`;
    try {
      const res = await fetch(`${base}/api/gamification/profile`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ bloomLevel: 'apply' }),
      });
      expect(res.status).toBe(200);
      expect(mockSetBloomTarget).toHaveBeenCalledWith('user-game-1', 'apply');
      const body = await res.json();
      expect(body).toMatchObject({ targetBloomIndex: 3, bloomLevel: 'apply' });
    } finally {
      await closeServer(srv);
    }
  });

  test('POST profile rejects invalid target with 400', async () => {
    mockSetBloomTarget.mockReturnValue({ ok: false, error: 'targetBloomIndex must be an integer between 1 and 6 or a Bloom level string' });
    const srv = createServer();
    const base = `http://localhost:${srv.address().port}`;
    try {
      const res = await fetch(`${base}/api/gamification/profile`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ targetBloomIndex: 0 }),
      });
      expect(res.status).toBe(400);
    } finally {
      await closeServer(srv);
    }
  });

  test('POST profile requires a value', async () => {
    const srv = createServer();
    const base = `http://localhost:${srv.address().port}`;
    try {
      const res = await fetch(`${base}/api/gamification/profile`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      });
      expect(res.status).toBe(400);
    } finally {
      await closeServer(srv);
    }
  });
});