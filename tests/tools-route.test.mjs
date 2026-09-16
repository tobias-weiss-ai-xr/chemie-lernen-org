/**
 * /api/tools route tests (ZPD-aware tool routing, public module).
 *
 * - GET /api/tools lists the registry, optional bloom/tags filters.
 * - GET /api/tools/resolve returns the best-matching tool for a Bloom
 *   level + tags (REQ-TTR-2), 400 on invalid bloom, 401 unauthenticated.
 */

import { vi, describe, test, expect } from 'vitest';
import express from 'express';

vi.mock(
  '../api/auth.js',
  () => ({
    requireAuth: vi.fn((req, res, next) => {
      if (!req.user?.id) return res.status(401).json({ error: 'Authentication required' });
      next();
    }),
  })
);

const { default: router } = await import('../api/routes/tools.js');

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

const base = (server) => `http://127.0.0.1:${server.address().port}`;

describe('GET /api/tools', () => {
  test('401 when unauthenticated', async () => {
    const server = createTestServer(null);
    try {
      const res = await fetch(`${base(server)}/api/tools`);
      expect(res.status).toBe(401);
    } finally {
      server.close();
    }
  });

  test('lists full registry with count', async () => {
    const server = createTestServer({ id: 'u1' });
    try {
      const res = await fetch(`${base(server)}/api/tools`);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.tools.length).toBeGreaterThan(0);
      expect(body.count).toBe(body.tools.length);
      expect(body.tools[0]).toHaveProperty('toolId');
      expect(body.tools[0]).toHaveProperty('toolType');
    } finally {
      server.close();
    }
  });

  test('filters by bloom (only tools whose band contains it)', async () => {
    const server = createTestServer({ id: 'u1' });
    try {
      const res = await fetch(`${base(server)}/api/tools?bloom=1`);
      expect(res.status).toBe(200);
      const body = await res.json();
      // Bloom 1 falls in perioden-system [1,2]
      expect(body.tools.every((t) => t.bloomRange[0] <= 1 && 1 <= t.bloomRange[1])).toBe(true);
      expect(body.tools.some((t) => t.toolId === 'perioden-system')).toBe(true);
    } finally {
      server.close();
    }
  });

  test('filters by tags', async () => {
    const server = createTestServer({ id: 'u1' });
    try {
      const res = await fetch(`${base(server)}/api/tools?tags=quantitative`);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.tools.every((t) => t.objectiveTags.includes('quantitative'))).toBe(true);
    } finally {
      server.close();
    }
  });
});

describe('GET /api/tools/resolve', () => {
  test('401 when unauthenticated', async () => {
    const server = createTestServer(null);
    try {
      const res = await fetch(`${base(server)}/api/tools/resolve?bloom=2`);
      expect(res.status).toBe(401);
    } finally {
      server.close();
    }
  });

  test('400 when bloom missing', async () => {
    const server = createTestServer({ id: 'u1' });
    try {
      const res = await fetch(`${base(server)}/api/tools/resolve`);
      expect(res.status).toBe(400);
    } finally {
      server.close();
    }
  });

  test('400 when bloom out of range', async () => {
    const server = createTestServer({ id: 'u1' });
    try {
      const res = await fetch(`${base(server)}/api/tools/resolve?bloom=9`);
      expect(res.status).toBe(400);
    } finally {
      server.close();
    }
  });

  test('resolves spatial objective at bloom 2 to molekuel-studio', async () => {
    const server = createTestServer({ id: 'u1' });
    try {
      const res = await fetch(`${base(server)}/api/tools/resolve?bloom=2&description=Moleküstruktur%20und%203D-Gestalt`);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.resolved).toBe(true);
      expect(body.tool.toolId).toBe('molekuel-studio');
      expect(body.tool.toolType).toBe('visualization');
    } finally {
      server.close();
    }
  });

  test('resolves quantitative objective at bloom 4 to stoichiometry-calculator', async () => {
    const server = createTestServer({ id: 'u1' });
    try {
      const res = await fetch(`${base(server)}/api/tools/resolve?bloom=4&description=Stoffmenge%20berechnen`);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.resolved).toBe(true);
      expect(body.tool.toolId).toBe('stoichiometry-calculator');
    } finally {
      server.close();
    }
  });

  test('returns resolved=false when no tool matches', async () => {
    const server = createTestServer({ id: 'u1' });
    try {
      const res = await fetch(`${base(server)}/api/tools/resolve?bloom=1&tags=quantitative`);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.resolved).toBe(false);
      expect(body.tool).toBeNull();
    } finally {
      server.close();
    }
  });

  test('combines explicit tags with inferred tags', async () => {
    const server = createTestServer({ id: 'u1' });
    try {
      const res = await fetch(`${base(server)}/api/tools/resolve?bloom=3&tags=quantitative&description=Reaktionsgleichung%20ausgleichen`);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.tags).toContain('quantitative');
      expect(body.tool).not.toBeNull();
    } finally {
      server.close();
    }
  });
});