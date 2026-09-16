/**
 * Route tests for peer-collaboration endpoints (peer-collaboration PC-3..PC-5):
 *   POST /api/collab/sessions/zpd-match
 *   GET  /api/collab/peer-status
 *
 * Mocks neo4j, zpd-engine, collab-engine and auth-db.
 */

import { vi, describe, test, expect, beforeEach } from 'vitest';
import express from 'express';

vi.mock(
  'neo4j-driver',
  () => ({
    default: { session: { READ: 'READ' } },
  })
);

vi.mock(
  '../api/services/neo4j.js',
  () => ({
    getNeo4jDriver: () => ({
      session: () => ({
        run: async () => ({ records: [] }),
        close: async () => {},
      }),
    }),
    NEO4J_DATABASE: 'chemie',
    toNumberSafe: (v) => (v == null ? undefined : Number(v)),
  })
);

vi.mock(
  '../scripts/_neo4j-subset-filter.mjs',
  () => ({
    subsetMatch: () => 'WHERE (lo:LearningObjective)',
  })
);

vi.mock(
  '../api/auth.js',
  () => ({
    requireAuth: vi.fn((req, res, next) => {
      if (!req.user?.id) return res.status(401).json({ error: 'Authentifizierung erforderlich' });
      next();
    }),
  })
);

const findPeerCandidatesMock = vi.fn(async () => ({
  myNext: { slug: 'stoffe-lo-1', bloom: 3 },
  candidates: [
    {
      userId: 'u-peer',
      displayName: null,
      objectiveSlug: 'stoffe-lo-1',
      bloom: 3,
      mastery: 0.4,
      loMastery: 0.4,
      matchScore: 0.94,
      mkoDirection: 'peer',
    },
  ],
}));

const createSessionMock = vi.fn((name, topic, creatorId, creatorName) => ({
  id: 'session-1',
  name: name || 'ZPD-Lerngruppe',
  topic: topic || '',
  creatorId,
  participantCount: 1,
}));
const joinSessionMock = vi.fn(() => ({ participantCount: 2 }));
const listActiveSessionsMock = vi.fn(() => []);

vi.mock(
  '../api/services/zpd-engine.js',
  () => ({
    findPeerCandidates: (userId, pathSlug, opts) => findPeerCandidatesMock(userId, pathSlug, opts),
    getBloomTarget: () => ({ targetBloomIndex: 4, bloomLevel: 'analyze', isDefault: false }),
    curricularDistanceMetric: (level) =>
      level === 'same-topic' ? 0.6 : level === 'same-subtopic' ? 0.3 : 1.0,
    peerMatchScore: () => 0.94,
  })
);

vi.mock(
  '../api/collab-engine.js',
  () => ({
    createSession: (n, t, c, cn) => createSessionMock(n, t, c, cn),
    joinSession: (...a) => joinSessionMock(...a),
    listActiveSessions: () => listActiveSessionsMock(),
    getSession: () => null,
    getParticipants: () => [],
  })
);

vi.mock(
  '../api/auth-db.js',
  () => ({
    getAllUsers: () => [
      { id: 'u-peer', name: 'Peer Name', email: 'peer@example.com', role: 'user', tier: 'free' },
    ],
  })
);

const { default: router } = await import('../api/routes/collab.js');

function createTestServer(authUser = null) {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json());
  app.use((req, res, next) => {
    req.user = authUser;
    next();
  });
  app.use(router);
  return app.listen(0);
}

describe('POST /api/collab/sessions/zpd-match', () => {
  beforeEach(() => {
    findPeerCandidatesMock.mockReset();
    findPeerCandidatesMock.mockImplementation(async () => ({
      myNext: { slug: 'stoffe-lo-1', bloom: 3 },
      candidates: [
        {
          userId: 'u-peer',
          displayName: null,
          objectiveSlug: 'stoffe-lo-1',
          bloom: 3,
          mastery: 0.4,
          loMastery: 0.4,
          matchScore: 0.94,
          mkoDirection: 'peer',
        },
      ],
    }));
    createSessionMock.mockClear();
    joinSessionMock.mockClear();
  });

  test('401 when unauthenticated', async () => {
    const server = createTestServer(null);
    try {
      const res = await fetch(
        `http://127.0.0.1:${server.address().port}/api/collab/sessions/zpd-match`,
        { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' }
      );
      expect(res.status).toBe(401);
    } finally {
      server.close();
    }
  });

  test('candidates-only mode (default, no session created)', async () => {
    const server = createTestServer({ id: 'u1', displayName: 'Ich' });
    try {
      const res = await fetch(
        `http://127.0.0.1:${server.address().port}/api/collab/sessions/zpd-match`,
        { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' }
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.myNext.slug).toBe('stoffe-lo-1');
      expect(body.candidates).toHaveLength(1);
      expect(body.candidates[0].displayName).toBe('Peer Name');
      expect(body.candidates[0].mkoDirection).toBe('peer');
      expect(body.candidates[0].matchScore).toBe(0.94);
      expect(body.session).toBeNull();
      expect(createSessionMock).not.toHaveBeenCalled();
    } finally {
      server.close();
    }
  });

  test('createSession:true creates a session with zpdContext', async () => {
    const server = createTestServer({ id: 'u1', displayName: 'Ich' });
    try {
      const res = await fetch(
        `http://127.0.0.1:${server.address().port}/api/collab/sessions/zpd-match`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ createSession: true, pathSlug: 'bb-rlp' }),
        }
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.session).not.toBeNull();
      expect(body.session.id).toBe('session-1');
      expect(body.session.zpdContext.sharedObjective).toBe('stoffe-lo-1');
      expect(body.session.zpdContext.bloomLevel).toBe(3);
      expect(body.session.zpdContext.curricularDistance).toBe(0.6);
      expect(createSessionMock).toHaveBeenCalledTimes(1);
      expect(joinSessionMock).toHaveBeenCalledTimes(1);
      expect(joinSessionMock).toHaveBeenCalledWith('session-1', 'u-peer', 'Peer Name');
    } finally {
      server.close();
    }
  });
});

describe('GET /api/collab/peer-status', () => {
  beforeEach(() => {
    findPeerCandidatesMock.mockReset();
    findPeerCandidatesMock.mockImplementation(async () => ({
      myNext: { slug: 'stoffe-lo-1', bloom: 3 },
      candidates: [],
    }));
    listActiveSessionsMock.mockReturnValue([]);
  });

  test('401 when unauthenticated', async () => {
    const server = createTestServer(null);
    try {
      const res = await fetch(
        `http://127.0.0.1:${server.address().port}/api/collab/peer-status`
      );
      expect(res.status).toBe(401);
    } finally {
      server.close();
    }
  });

  test('returns no active session, myNext and candidate count', async () => {
    const server = createTestServer({ id: 'u1' });
    try {
      const res = await fetch(
        `http://127.0.0.1:${server.address().port}/api/collab/peer-status`
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.hasActiveSession).toBe(false);
      expect(body.currentSession).toBeNull();
      expect(body.myNext.slug).toBe('stoffe-lo-1');
      expect(body.candidateCount).toBe(0);
      expect(body.bloomTarget).toBe(4);
    } finally {
      server.close();
    }
  });

  test('detects an active session created by the user', async () => {
    listActiveSessionsMock.mockReturnValue([{ id: 'session-9', creatorId: 'u1', participantCount: 3 }]);
    const server = createTestServer({ id: 'u1' });
    try {
      const res = await fetch(
        `http://127.0.0.1:${server.address().port}/api/collab/peer-status`
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.hasActiveSession).toBe(true);
      expect(body.currentSession.id).toBe('session-9');
      expect(body.currentSession.participantCount).toBe(3);
    } finally {
      server.close();
    }
  });
});