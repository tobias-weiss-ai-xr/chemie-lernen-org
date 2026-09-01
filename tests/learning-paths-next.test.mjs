/**
 * @vitest-environment node
 *
 * DB-free unit tests for GET /api/learning-paths/:slug/next
 *
 * Tests the route handler for the nextObjectiveInZPD endpoint:
 * - returns 401 when unauthenticated
 * - returns the highest-Bloom in-ZPD objective when authenticated
 * - respects pathSlug scope
 * - returns proper JSON structure with inZPD, next, recommendedStrategy
 */

import { vi, describe, test, expect, beforeAll, beforeEach } from 'vitest';
import express from 'express';

/* ------------------------------------------------------------------ */
/*  Mock all external dependencies that learning-paths.js imports      */
/* ------------------------------------------------------------------ */

// Mock pdfkit (used by certificate route)
vi.mock('pdfkit', () => ({
  default: function () {
    return { pipe: vi.fn(), end: vi.fn() };
  },
  __esModule: true,
}));

// Mock pino (used for logging)
vi.mock('pino', () => ({
  default: vi.fn(() => ({
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  })),
}));

// Mock crypto
vi.mock('crypto', () => ({
  default: {
    randomUUID: vi.fn(() => 'test-uuid'),
  },
}));

// Mock neo4j-driver (not directly used but imported)
vi.mock('neo4j-driver', () => ({
  default: {},
  session: { READ: 'READ' },
}));

// Mock auth.js - requireAuth checks for authenticated user
vi.mock('../api/auth.js', () => ({
  requireAuth: vi.fn((req, res, next) => {
    if (!req.user?.id) {
      // Return 401 to match the real behavior
      return res.status(401).json({ error: 'Authentication required' });
    }
    next();
  }),
  requirePremium: vi.fn((req, res, next) => next()),
}));

// Mock services that learning-paths.js imports but we don't need for this endpoint
vi.mock('../api/services/neo4j.js', () => ({
  getNeo4jDriver: vi.fn(),
  NEO4J_DATABASE: 'chemie',
  toNumberSafe: (v) => (v == null ? undefined : Number(v)),
}));

vi.mock('../api/auth-db.js', () => ({
  getGamification: vi.fn(() => ({})),
}));

vi.mock('../api/learning-engine.js', () => ({
  getAggregatedProgress: vi.fn(() => ({})),
  enrollInPath: vi.fn(() => ({})),
}));

vi.mock('../api/services/content.js', () => ({
  loadLearningPathsJson: vi.fn(() => []),
}));

vi.mock('../api/services/session.js', () => ({
  sessionStore: {},
}));

// Mock the subset filter
vi.mock('../scripts/_neo4j-subset-filter.mjs', () => ({
  subsetMatch: () => '1=1',
}));

/* ------------------------------------------------------------------ */
/*  Mock the zpd-engine module - the key one we're testing through    */
/* ------------------------------------------------------------------ */

const mockNextObjectiveInZPD = vi.fn();
const mockRecommendedStrategy = vi.fn();

vi.mock('../api/services/zpd-engine.js', () => ({
  nextObjectiveInZPD: mockNextObjectiveInZPD,
  recommendedStrategy: mockRecommendedStrategy,
  ZPD_THRESHOLDS: { thetaHigh: 0.8, thetaLow: 0.6 },
}));

/* ------------------------------------------------------------------ */
/*  Import the module under test                                        */
/* ------------------------------------------------------------------ */

let router;

beforeAll(async () => {
  const mod = await import('../api/routes/learning-paths.js');
  router = mod.default || mod.router || mod;
});

beforeEach(() => {
  vi.clearAllMocks();
  mockNextObjectiveInZPD.mockReset();
  mockRecommendedStrategy.mockReset();
});

/* ------------------------------------------------------------------ */
/*  Test server helper                                                 */
/* ------------------------------------------------------------------ */

function createTestServer(authUser = null) {
  const app = express();
  app.use(express.json());

  // Inject req.user based on authUser parameter
  app.use((req, res, next) => {
    req.user = authUser;
    next();
  });

  app.use(router);

  const server = app.listen(0);
  const port = server.address().port;
  const baseURL = `http://127.0.0.1:${port}`;

  return { server, baseURL };
}

/* ------------------------------------------------------------------ */
/*  Tests                                                             */
/* ------------------------------------------------------------------ */

describe('GET /api/learning-paths/:slug/next', () => {
  let server;
  let baseURL;

  afterEach(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  test('returns 401 when user is not authenticated', async () => {
    ({ server, baseURL } = createTestServer(null));

    const res = await fetch(`${baseURL}/api/learning-paths/test-path/next`);
    expect(res.status).toBe(401);

    const body = await res.json();
    expect(body.error).toBe('Authentication required');
  });

  test('returns 401 when user object exists but has no id', async () => {
    ({ server, baseURL } = createTestServer({}));

    const res = await fetch(`${baseURL}/api/learning-paths/test-path/next`);
    expect(res.status).toBe(401);

    const body = await res.json();
    expect(body.error).toBe('Authentication required');
  });

  test('returns inZPD=false when no objective found in ZPD', async () => {
    ({ server, baseURL } = createTestServer({ id: 'user-123' }));

    // Mock nextObjectiveInZPD to return null
    mockNextObjectiveInZPD.mockResolvedValue(null);
    mockRecommendedStrategy.mockReturnValue(null);

    const res = await fetch(`${baseURL}/api/learning-paths/test-path/next`);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toEqual({
      inZPD: false,
      next: null,
      recommendedStrategy: null,
    });

    // Verify nextObjectiveInZPD was called with correct arguments
    expect(mockNextObjectiveInZPD).toHaveBeenCalledWith('user-123', 'test-path');
    // recommendedStrategy is NOT called when next is null (route returns early)
    expect(mockRecommendedStrategy).not.toHaveBeenCalled();
  });

  test('returns highest-Bloom in-ZPD objective with recommendedStrategy', async () => {
    ({ server, baseURL } = createTestServer({ id: 'user-123' }));

    const mockNext = {
      slug: 'stoffe-teilchen-lo-3',
      bloom: 3,
      description: 'Stoffe und Teilchen verstehen',
      prereqAvg: 0.91,
      loMastery: 0,
    };

    mockNextObjectiveInZPD.mockResolvedValue(mockNext);
    mockRecommendedStrategy.mockReturnValue('scaffold');

    const res = await fetch(`${baseURL}/api/learning-paths/bw-gymnasium/next`);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.inZPD).toBe(true);
    expect(body.next).toEqual(mockNext);
    expect(body.recommendedStrategy).toBe('scaffold');

    expect(mockNextObjectiveInZPD).toHaveBeenCalledWith('user-123', 'bw-gymnasium');
  });

  test('passes pathSlug parameter correctly to nextObjectiveInZPD', async () => {
    ({ server, baseURL } = createTestServer({ id: 'user-456' }));

    const pathSlug = 'by-chemie';
    const mockNext = { slug: 'test-lo', bloom: 2, description: 'Test LO', prereqAvg: 0.85, loMastery: 0.3 };

    mockNextObjectiveInZPD.mockResolvedValue(mockNext);
    mockRecommendedStrategy.mockReturnValue('differentiate');

    const res = await fetch(`${baseURL}/api/learning-paths/${pathSlug}/next`);
    expect(res.status).toBe(200);

    expect(mockNextObjectiveInZPD).toHaveBeenCalledWith('user-456', pathSlug);
    expect(mockRecommendedStrategy).toHaveBeenCalledWith(mockNext);
  });

  test('recommends assess strategy for near-mastered objective', async () => {
    ({ server, baseURL } = createTestServer({ id: 'user-789' }));

    // loMastery between 0.6 and 0.8 should trigger 'assess' via recommendedStrategy
    const mockNext = { slug: 'analyze-lo', bloom: 4, description: 'Analyse', prereqAvg: 0.95, loMastery: 0.7 };

    mockNextObjectiveInZPD.mockResolvedValue(mockNext);
    mockRecommendedStrategy.mockImplementation((next) => {
      // Mimic the actual logic
      if (!next) return null;
      if (next.loMastery === 0 && next.prereqAvg >= 0.8) return 'scaffold';
      if (next.loMastery > 0.6 && next.loMastery < 0.8) return 'assess';
      return 'differentiate';
    });

    const res = await fetch(`${baseURL}/api/learning-paths/test-path/next`);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.inZPD).toBe(true);
    expect(body.recommendedStrategy).toBe('assess');
  });

  test('handles nextObjectiveInZPD errors gracefully', async () => {
    ({ server, baseURL } = createTestServer({ id: 'user-999' }));

    mockNextObjectiveInZPD.mockRejectedValue(new Error('Database error'));

    const res = await fetch(`${baseURL}/api/learning-paths/test-path/next`);
    expect(res.status).toBe(500);

    const body = await res.json();
    expect(body.error).toBe('nextInZPD failed');
  });
});
