/**
 * @vitest-environment node
 *
 * Unit tests for the per-learner Bloom target in api/services/bloom-target.js
 * (zpd-deepdive-differentiation, tasks 1.1 / 1.5 / 6.2).
 *
 * This module is public and owns a JSON-file-backed map (bloom-targets.json).
 * Here we mock the fs plumbing so getBloomTarget / setBloomTarget run against an
 * in-memory "file" without touching real data. It is deliberately independent
 * of the private auth-db user store (which would be overwritten by vendor-core).
 */

import { vi, describe, test, expect, beforeAll } from 'vitest';

// In-memory "file" contents for our own DB file.
let fileContents = null;
let bloomDbPath;

vi.mock('fs', async () => {
  const actual = await vi.importActual('fs');
  return {
    ...actual,
    existsSync: (p) => {
      const isBloom = bloomDbPath != null && p === bloomDbPath;
      return (isBloom && fileContents != null) || actual.existsSync(p);
    },
    readFileSync: (p, enc) => {
      if (p === bloomDbPath && fileContents != null) return fileContents;
      return actual.readFileSync(p, enc);
    },
    mkdirSync: () => {},
    writeFileSync: (_p, data) => {
      fileContents = String(data);
    },
    renameSync: () => {},
  };
});

let mod;

beforeAll(async () => {
  mod = await import('../api/services/bloom-target.js');
  // Capture the real path this module persisted to (data/bloom-targets.json).
  const { default: path } = await import('path');
  const { fileURLToPath } = await import('url');
  bloomDbPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'api', 'data', 'bloom-targets.json');
  await mod.flush();
});

describe('Bloom target in bloom-target.js (public)', () => {
  test('getBloomTarget defaults to 6 for a fresh/unknown user', () => {
    expect(mod.getBloomTarget('u-unknown')).toBe(6);
    expect(mod.getBloomTarget(null)).toBe(6);
    expect(mod.getBloomTarget(undefined)).toBe(6);
  });

  test('setBloomTarget persists an integer in 1–6', () => {
    const res = mod.setBloomTarget('u-1', 3);
    expect(res).toEqual({ ok: true, targetBloomIndex: 3, bloomLevel: 'apply' });
    expect(mod.getBloomTarget('u-1')).toBe(3);
    expect(mod.flush()).toBeUndefined();
  });

  test('rejects values outside 1–6 / unknown levels', () => {
    for (const bad of [0, 7, -1, 2.5, 'zzz', null, undefined]) {
      expect(mod.setBloomTarget('u-2', bad).ok).toBe(false);
    }
    // Value unchanged after rejects (still default).
    expect(mod.getBloomTarget('u-2')).toBe(6);
  });

  test('accepts a Bloom level string (case-insensitive)', () => {
    expect(mod.setBloomTarget('u-3', 'CREATE')).toEqual({
      ok: true,
      targetBloomIndex: 6,
      bloomLevel: 'create',
    });
    expect(mod.setBloomTarget('u-3', 'analyze')).toEqual({
      ok: true,
      targetBloomIndex: 4,
      bloomLevel: 'analyze',
    });
    expect(mod.getBloomTarget('u-3')).toBe(4);
  });

  test('normalizeBloomTarget accepts ints and level strings', () => {
    expect(mod.normalizeBloomTarget(2)).toBe(2);
    expect(mod.normalizeBloomTarget('remember')).toBe(1);
    expect(mod.normalizeBloomTarget('Create')).toBe(6);
    expect(mod.normalizeBloomTarget(0)).toBe(null);
    expect(mod.normalizeBloomTarget('nope')).toBe(null);
  });

  test('getBloomTarget reflects setBloomTarget (in-memory), flush is no-op-safe', () => {
    mod.setBloomTarget('u-4', 4);
    expect(mod.getBloomTarget('u-4')).toBe(4);
    // flush triggers a write; with our mock it must not throw.
    expect(() => mod.flush()).not.toThrow();
  });
});