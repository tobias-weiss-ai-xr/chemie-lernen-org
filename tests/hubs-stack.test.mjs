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

describe('Hubs client static assets (regression for console warnings)', () => {
  // These used to be console warnings/crashes:
  //  - /favicon.ico 404
  //  - /manifest.webmanifest icon declared with a size that did not match the
  //    actual PNG -> "Resource size is not correct"
  //  - /hub.service.js registered an empty fetch handler -> Chrome perf warning
  // They are fixed by serving corrected assets from /opt/git/hubs-client-assets
  // (read-only bind mounts over /code/dist), so no full client rebuild is needed.
  test('GET /favicon.ico returns an icon (was 404)', async () => {
    const res = await fetch(`${BASE}/favicon.ico`);
    expect(res.ok).toBe(true);
    expect(res.headers.get('content-type') || '').not.toMatch(/^text\/html/i);
  });

  test('GET /manifest.webmanifest returns 200 with a valid icon entry', async () => {
    const res = await fetch(`${BASE}/manifest.webmanifest`);
    expect(res.ok).toBe(true);
    expect(res.headers.get('content-type') || '').toMatch(/json/i);
    const body = await res.json();
    expect(Array.isArray(body.icons) && body.icons.length > 0).toBe(true);
    // 'any' avoids the Chrome "Resource size is not correct" warning
    expect(body.icons[0].sizes).toBe('any');
    expect(body.icons[0].src.startsWith('/')).toBe(true);
  });

  test('GET /hub.service.js returns 200 and has no no-op fetch handler', async () => {
    const res = await fetch(`${BASE}/hub.service.js`);
    expect(res.ok).toBe(true);
    const body = await res.text();
    // The previous build registered an empty fetch handler (Chrome perf warning).
    expect(body).not.toMatch(/addEventListener\(\s*["']fetch["']/);
  });
});
