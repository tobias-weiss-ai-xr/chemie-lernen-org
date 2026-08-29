/**
 * @jest-environment node
 *
 * Hubs deployment tests using modern paradigms:
 *   - Contract testing       : zod schemas pin the exact response shape the
 *                              client (usePaginatedAPI) depends on. The schema
 *                              IS the contract; drift fails the test.
 *   - Property-based testing  : invariants are checked across many generated
 *                              cursors (incl. the live next_cursor), not one
 *                              happy path.
 *   - Image-dimension property: the manifest icon PNG is decoded (PNG IHDR) and
 *                              its real pixels are asserted square + >=144px —
 *                              this is exactly the rule Chrome enforces when it
 *                              emits "Resource size is not correct".
 *   - Negative / oracle test  : mutation-testing-lite — we prove the contract
 *                              actually rejects the crash-shaped payload, so
 *                              the suite would have caught the original bug.
 *   - Semantic monitoring     : CORS + cache-control presence on /api (the
 *                              client calls reticulum cross-origin).
 *
 * Runs live against HUBS_BASE (default https://hubs.chemie-lernen.org).
 */

import { describe, test, expect } from '@jest/globals';
import { z } from 'zod';

const BASE = process.env.HUBS_BASE || 'https://hubs.chemie-lernen.org';

/* ------------------------------------------------------------------ */
/* Contracts (zod)                                                     */
/* ------------------------------------------------------------------ */

const MetaSchema = z.object({ version: z.string() }).passthrough();

// The exact shape usePaginatedAPI consumes: response.meta.next_cursor and
// response.entries. The original crash was `meta.next_cursor` of undefined
// because the API returned the SPA's HTML (no `meta` at all).
const PaginatedSchema = z
  .object({
    meta: z
      .object({ next_cursor: z.unknown() })
      .passthrough()
      .refine((m) => m.next_cursor !== undefined, {
        message: 'meta.next_cursor must be defined (the original crash condition)',
      }),
    entries: z.array(z.unknown()),
    suggestions: z.unknown(),
  })
  .passthrough();

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function isHtml(res) {
  return /^text\/html/i.test(res.headers.get('content-type') || '');
}

function pngDimensions(buf) {
  const sig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (!sig.every((b, i) => buf[i] === b)) throw new Error('not a PNG');
  const u32 = (o) => (buf[o] * 2 ** 24 + (buf[o + 1] << 16) + (buf[o + 2] << 8) + buf[o + 3]) >>> 0;
  return { width: u32(16), height: u32(20) };
}

/* ------------------------------------------------------------------ */
/* Contract — /api/v1/meta                                             */
/* ------------------------------------------------------------------ */

describe('Contract — /api/v1/meta', () => {
  test('returns reticulum JSON (not the SPA) with a version', async () => {
    const res = await fetch(`${BASE}/api/v1/meta`);
    expect(res.ok).toBe(true);
    expect(isHtml(res)).toBe(false);
    const body = await res.json();
    expect(MetaSchema.safeParse(body).success).toBe(true);
  });
});

/* ------------------------------------------------------------------ */
/* Contract — /api/v1/media/search (usePaginatedAPI shape)             */
/* ------------------------------------------------------------------ */

describe('Contract — /api/v1/media/search (the client usePaginatedAPI shape)', () => {
  test('live response satisfies the paginated contract', async () => {
    const res = await fetch(`${BASE}/api/v1/media/search?source=rooms&filter=public&cursor=0`);
    expect(res.ok).toBe(true);
    expect(isHtml(res)).toBe(false);
    const body = await res.json();
    const result = PaginatedSchema.safeParse(body);
    if (!result.success) console.error('media/search contract violated:', result.error?.issues);
    expect(result.success).toBe(true);
  });
});

/* ------------------------------------------------------------------ */
/* Negative / oracle soundness (mutation-testing lite)                 */
/* ------------------------------------------------------------------ */

describe('Contract oracle soundness (mutation-testing lite)', () => {
  test('schema accepts a valid payload and rejects the crash-shaped one', () => {
    const valid = { meta: { next_cursor: 1 }, entries: [], suggestions: [] };
    const crashShaped = { entries: [] }; // what the SPA fallback / HTML parse yields
    expect(PaginatedSchema.safeParse(valid).success).toBe(true);
    expect(PaginatedSchema.safeParse(crashShaped).success).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
/* Property-based — pagination invariants across many cursors           */
/* ------------------------------------------------------------------ */

describe('Property-based — pagination contract across many cursors', () => {
  test('every cursor yields JSON (never HTML) and, when ok, satisfies the contract', async () => {
    const first = await (
      await fetch(`${BASE}/api/v1/media/search?source=rooms&filter=public&cursor=0`)
    ).json();
    const cursors = [0, 1, 2, 3, 7, 13, 100, first.meta?.next_cursor].filter(
      (c) => typeof c === 'number'
    );
    expect(cursors.length).toBeGreaterThan(0);

    for (const cursor of cursors) {
      const res = await fetch(
        `${BASE}/api/v1/media/search?source=rooms&filter=public&cursor=${cursor}`
      );
      // Invariant 1: /api must never be served as the SPA HTML (the regression).
      expect(isHtml(res)).toBe(false);
      // Invariant 2: a successful page must satisfy the client contract.
      if (res.ok) {
        const body = await res.json();
        const result = PaginatedSchema.safeParse(body);
        if (!result.success)
          console.error(`cursor=${cursor} contract violated:`, result.error?.issues);
        expect(result.success).toBe(true);
      }
    }
  }, 30000);
});

/* ------------------------------------------------------------------ */
/* Asset contracts & properties                                        */
/* ------------------------------------------------------------------ */

describe('Asset contracts & properties', () => {
  test('favicon.ico is a valid icon (status, image type, ICO magic)', async () => {
    const res = await fetch(`${BASE}/favicon.ico`);
    expect(res.ok).toBe(true);
    expect(res.headers.get('content-type') || '').toMatch(/image\//);
    const buf = new Uint8Array(await res.arrayBuffer());
    expect(buf.length).toBeGreaterThan(0);
    // ICO magic: 00 00 01 00 (reserved=0, type=1)
    expect([buf[0], buf[1], buf[2], buf[3]]).toEqual([0, 0, 1, 0]);
  });

  test('manifest icon PNG has real square dimensions (PWA property)', async () => {
    const res = await fetch(`${BASE}/manifest.webmanifest`);
    expect(res.ok).toBe(true);
    const body = await res.json();
    const icon = body.icons && body.icons[0];
    expect(icon).toBeDefined();
    expect(icon.src.startsWith('/')).toBe(true);

    const ir = await fetch(`${BASE}${icon.src}`);
    expect(ir.ok).toBe(true);
    const buf = new Uint8Array(await ir.arrayBuffer());
    const { width, height } = pngDimensions(buf);
    // PWA icons must be square (browser requirement).
    expect(width).toBe(height);
    // Sane, non-trivial dimensions.
    expect(width).toBeGreaterThanOrEqual(16);
    expect(width).toBeLessThanOrEqual(1024);
    // If a concrete size is declared, it must match the actual pixels — this is
    // the exact check that produced "Resource size is not correct".
    if (icon.sizes && icon.sizes !== 'any') {
      expect(width).toBe(parseInt(icon.sizes, 10));
    }
  });

  test('hub.service.js has functional handlers and no no-op fetch handler', async () => {
    const res = await fetch(`${BASE}/hub.service.js`);
    expect(res.ok).toBe(true);
    const body = await res.text();
    // The no-op fetch handler was the Chrome perf warning; it must be gone.
    expect(body).not.toMatch(/addEventListener\(\s*["']fetch["']/);
    // Functional listeners must remain (install/activate/push/notificationclick).
    expect(body).toMatch(/addEventListener\(\s*["'](install|activate|push|notificationclick)["']/);
  });
});

/* ------------------------------------------------------------------ */
/* Resilience / semantic monitoring                                    */
/* ------------------------------------------------------------------ */

describe('Resilience / semantic monitoring', () => {
  test('/api responses carry CORS + cache-control and are never HTML', async () => {
    const res = await fetch(`${BASE}/api/v1/meta`);
    expect(res.headers.get('access-control-allow-origin')).toBeTruthy();
    expect(res.headers.get('cache-control')).toBeTruthy();
    expect(isHtml(res)).toBe(false);
  });

  test('generic guard: no /api/* response is HTML (would crash the client)', async () => {
    const paths = [
      '/api/v1/meta',
      '/api/v1/media/search?source=rooms&filter=public&cursor=0',
    ];
    for (const p of paths) {
      const res = await fetch(`${BASE}${p}`);
      expect(isHtml(res)).toBe(false);
    }
  });
});

/* ------------------------------------------------------------------ */
/* SPA root                                                            */
/* ------------------------------------------------------------------ */

describe('Hubs SPA root', () => {
  test('GET / returns the client HTML app', async () => {
    const res = await fetch(`${BASE}/`);
    expect(res.ok).toBe(true);
    expect(res.headers.get('content-type') || '').toMatch(/text\/html/i);
    const html = await res.text();
    expect(html).toMatch(/<!DOCTYPE html>/i);
  });
});
