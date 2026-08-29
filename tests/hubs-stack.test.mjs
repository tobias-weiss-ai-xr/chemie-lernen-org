/**
 * @jest-environment node
 *
 * Hubs deployment smoke / integration tests.
 *
 * Regression coverage for the bug class where Traefik misroutes /api to the
 * static SPA (instead of reticulum). The Hubs client then fetches HTML where
 * it expects JSON and crashes the home page:
 *   "Cannot read properties of undefined (reading 'next_cursor')"
 * in usePaginatedAPI.js.
 *
 * These tests lock in the *contract* the client depends on, and cover the
 * edge cases that would otherwise surface as a white-screen crash:
 *   - /api returns HTML instead of JSON (misroute)
 *   - API returns JSON but without `meta` (error payload)
 *   - `meta.next_cursor` is undefined (the exact crash)
 *   - `entries` / `suggestions` missing or not arrays
 *   - pagination to the next cursor keeps the same shape
 *
 * Runs live against HUBS_BASE (default https://hubs.chemie-lernen.org).
 * It is a live smoke test: if the stack is down the assertions fail loudly,
 * which is the desired signal for a deployment check.
 */

import { describe, test, expect } from '@jest/globals';

const BASE = process.env.HUBS_BASE || 'https://hubs.chemie-lernen.org';

function assertJsonNotHtml(res) {
  const ct = res.headers.get('content-type') || '';
  // Regression guard: /api must never be served as the SPA's text/html.
  // reticulum returns JSON (sometimes as text/plain), which res.json() still
  // parses fine -- only the SPA fallback (text/html) is the failure mode.
  expect(ct).not.toMatch(/^text\/html/i);
}

describe('Hubs API routing — /api must reach reticulum, not the SPA', () => {
  test('GET /api/v1/meta returns JSON from reticulum (not text/html)', async () => {
    const res = await fetch(`${BASE}/api/v1/meta`);
    expect(res.ok).toBe(true);
    assertJsonNotHtml(res);
    const body = await res.json();
    expect(typeof body.version).toBe('string');
  });

  test('GET /api/v1/media/search (public rooms) returns the shape usePaginatedAPI needs', async () => {
    const url = `${BASE}/api/v1/media/search?source=rooms&filter=public&cursor=0`;
    const res = await fetch(url);
    expect(res.ok).toBe(true);
    assertJsonNotHtml(res);

    const body = await res.json();
    // usePaginatedAPI reads response.meta.next_cursor and response.entries
    expect(body.meta).toBeDefined();
    expect(typeof body.meta).toBe('object');
    expect(body.meta.next_cursor).not.toBeUndefined();
    expect(Array.isArray(body.entries)).toBe(true);
    expect(body.suggestions).toBeDefined();
  });

  test('pagination: fetching meta.next_cursor keeps the same contract', async () => {
    const first = await (
      await fetch(`${BASE}/api/v1/media/search?source=rooms&filter=public&cursor=0`)
    ).json();
    const cursor = first.meta && first.meta.next_cursor;
    if (typeof cursor !== 'number') return; // nothing to page; contract still valid
    const res = await fetch(
      `${BASE}/api/v1/media/search?source=rooms&filter=public&cursor=${cursor}`
    );
    // Key regression guard: page 2 must also be JSON, never the SPA HTML.
    assertJsonNotHtml(res);
    if (res.ok) {
      const body = await res.json();
      expect(body.meta).toBeDefined();
      expect(Array.isArray(body.entries)).toBe(true);
    }
  });

  test('generic guard: no /api/* response is HTML (would crash the client)', async () => {
    const paths = [
      '/api/v1/meta',
      '/api/v1/media/search?source=rooms&filter=public&cursor=0',
    ];
    for (const p of paths) {
      const res = await fetch(`${BASE}${p}`);
      const ct = res.headers.get('content-type') || '';
      expect(ct).not.toMatch(/^text\/html/i);
    }
  });
});

describe('Hubs SPA root', () => {
  test('GET / returns the client HTML app', async () => {
    const res = await fetch(`${BASE}/`);
    expect(res.ok).toBe(true);
    const ct = res.headers.get('content-type') || '';
    expect(ct).toMatch(/text\/html/i);
    const html = await res.text();
    expect(html).toMatch(/<!DOCTYPE html>/i);
  });
});

describe('Known client-asset bugs (require a Hubs client rebuild to fix)', () => {
  // The built client currently lacks favicon.ico / manifest.webmanifest and
  // registers a no-op service-worker fetch handler. Documented as todos so
  // they are tracked and can be closed once the client is rebuilt.
  test.todo('GET /favicon.ico should return 200 (currently 404)');
  test.todo('GET /manifest.webmanifest should return 200 referencing a valid logo PNG');
  test.todo('service worker must not register a no-op fetch handler (Chrome perf warning)');
});
