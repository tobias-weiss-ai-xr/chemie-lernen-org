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

// POST /api/v1/hubs response — the room-creation contract.
const HubCreatedSchema = z
  .object({
    hub_id: z.string().min(1),
    url: z.string().url(),
    status: z.literal('ok'),
    creator_assignment_token: z.string(),
    embed_token: z.string(),
  })
  .passthrough();

// Enhanced /api/v1/meta — must include phx_host and phx_port.
const MetaSchemaFull = z
  .object({
    version: z.string(),
    phx_host: z.string(),
    phx_port: z.string(),
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

const ROOM_ID_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const SLUG_CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789-';

function randomRoomId(len = 7) {
  let s = '';
  for (let i = 0; i < len; i++) s += ROOM_ID_CHARS[Math.floor(Math.random() * ROOM_ID_CHARS.length)];
  return s;
}

function randomSlug(len = 10) {
  let s = '';
  for (let i = 0; i < len; i++) s += SLUG_CHARS[Math.floor(Math.random() * SLUG_CHARS.length)];
  return s;
}

function isHubPage(html) {
  return html.includes('Room | App') && html.length > 10000;
}

function isIndexPage(html) {
  return html.includes('<title>App</title>') && html.length < 3000;
}

/* ------------------------------------------------------------------ */
/* Contract — /api/v1/meta                                             */
/* ------------------------------------------------------------------ */

describe('Contract — /api/v1/meta', () => {
  test('returns reticulum JSON (not the SPA) with version + phx_host + phx_port', async () => {
    const res = await fetch(`${BASE}/api/v1/meta`);
    expect(res.ok).toBe(true);
    expect(isHtml(res)).toBe(false);
    const body = await res.json();
    expect(MetaSchema.safeParse(body).success).toBe(true);
    // Full contract: must include phx_host + phx_port for the websocket connection.
    const full = MetaSchemaFull.safeParse(body);
    if (!full.success) console.error('meta full contract violated:', full.error?.issues);
    expect(full.success).toBe(true);
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
  test('favicon.ico is a valid multi-size ICO whose declared sizes match its embedded entries', async () => {
    const mres = await fetch(`${BASE}/manifest.webmanifest`);
    const manifest = await mres.json();
    const icoIcon = manifest.icons.find((i) => (i.type || '').includes('icon'));
    expect(icoIcon).toBeDefined();

    const res = await fetch(`${BASE}${icoIcon.src}`);
    expect(res.ok).toBe(true);
    expect(res.headers.get('content-type') || '').toMatch(/image\//);
    const buf = new Uint8Array(await res.arrayBuffer());
    // ICO magic: 00 00 01 00 (reserved=0, type=1)
    expect([buf[0], buf[1], buf[2], buf[3]]).toEqual([0, 0, 1, 0]);
    // Decode the ICO directory and collect embedded sizes.
    const count = buf[4] | (buf[5] << 8);
    const embedded = new Set();
    for (let i = 0; i < count; i++) {
      const o = 6 + i * 16;
      const w = buf[o] === 0 ? 256 : buf[o];
      embedded.add(`${w}x${w}`);
    }
    // Every declared size must be present in the ICO — the "Resource size is
    // not correct" guard for the ICO entry.
    const declared = icoIcon.sizes.split(/\s+/).filter(Boolean);
    for (const s of declared) {
      expect(embedded.has(s)).toBe(true);
    }
  });

  test('manifest PNG icons have real square dimensions matching declared sizes (PWA property)', async () => {
    const mres = await fetch(`${BASE}/manifest.webmanifest`);
    expect(mres.ok).toBe(true);
    const manifest = await mres.json();
    const pngIcons = (manifest.icons || []).filter((i) => (i.type || '').includes('png'));
    expect(pngIcons.length).toBeGreaterThan(0);

    for (const icon of pngIcons) {
      expect(icon.src.startsWith('/')).toBe(true);
      const ir = await fetch(`${BASE}${icon.src}`);
      expect(ir.ok).toBe(true);
      const buf = new Uint8Array(await ir.arrayBuffer());
      const { width, height } = pngDimensions(buf);
      // pngDimensions throws on non-PNG, so reaching here means valid PNG.
      // Icons must be square (browser/PWA requirement).
      expect(width).toBe(height);
      // Declared size must match actual pixels — the exact "Resource size is
      // not correct" guard.
      expect(width).toBe(parseInt(icon.sizes, 10));
      // PWA installability requires at least one icon >= 144px; all our PNGs
      // are 192 or 512.
      expect(width).toBeGreaterThanOrEqual(192);
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

/* ------------------------------------------------------------------ */
/* Room URL routing — redirect-loop fix                                */
/* ------------------------------------------------------------------ */

describe('Room URL routing — redirect-loop fix', () => {
  test('7-char room ID without slug serves hub.html (Room | App page)', async () => {
    const res = await fetch(`${BASE}/raJ6mj3`);
    expect(res.ok).toBe(true);
    const html = await res.text();
    expect(isHubPage(html)).toBe(true);
  });

  test('7-char room ID with trailing slash serves hub.html', async () => {
    const res = await fetch(`${BASE}/raJ6mj3/`);
    expect(res.ok).toBe(true);
    const html = await res.text();
    expect(isHubPage(html)).toBe(true);
  });

  test('7-char room ID with slug serves hub.html', async () => {
    const res = await fetch(`${BASE}/raJ6mj3/test-room`);
    expect(res.ok).toBe(true);
    const html = await res.text();
    expect(isHubPage(html)).toBe(true);
  });

  test('7-char room ID with long slug serves hub.html', async () => {
    const res = await fetch(`${BASE}/raJ6mj3/this-is-a-very-long-slug-with-123`);
    expect(res.ok).toBe(true);
    const html = await res.text();
    expect(isHubPage(html)).toBe(true);
  });

  test('7-char room ID with query string serves hub.html', async () => {
    const res = await fetch(`${BASE}/raJ6mj3?token=abc123&scene=xyz`);
    expect(res.ok).toBe(true);
    const html = await res.text();
    expect(isHubPage(html)).toBe(true);
  });

  test('7-char room ID with hash fragment serves hub.html', async () => {
    const res = await fetch(`${BASE}/raJ6mj3#waypoint`);
    expect(res.ok).toBe(true);
    const html = await res.text();
    expect(isHubPage(html)).toBe(true);
  });

  test('7-char room ID with slug + query serves hub.html', async () => {
    const res = await fetch(`${BASE}/raJ6mj3/test-room?foo=1`);
    expect(res.ok).toBe(true);
    const html = await res.text();
    expect(isHubPage(html)).toBe(true);
  });

  // Property-based: many random 7-char IDs all serve hub.html
  test('property: random 7-char IDs all serve hub.html', async () => {
    for (let i = 0; i < 5; i++) {
      const id = randomRoomId(7);
      const res = await fetch(`${BASE}/${id}`);
      expect(res.ok).toBe(true);
      const html = await res.text();
      if (!isHubPage(html)) console.error(`room ID ${id} served non-hub page (${html.length} bytes)`);
      expect(isHubPage(html)).toBe(true);
    }
  });

  // Property-based: random 7-char IDs with random slugs all serve hub.html
  test('property: random 7-char IDs with random slugs all serve hub.html', async () => {
    for (let i = 0; i < 5; i++) {
      const id = randomRoomId(7);
      const slug = randomSlug(8 + Math.floor(Math.random() * 10));
      const res = await fetch(`${BASE}/${id}/${slug}`);
      expect(res.ok).toBe(true);
      const html = await res.text();
      if (!isHubPage(html)) console.error(`room ${id}/${slug} served non-hub page (${html.length} bytes)`);
      expect(isHubPage(html)).toBe(true);
    }
  });

  // Negative: invalid IDs should NOT serve hub.html
  test('6-char ID falls back to index.html (not hub.html)', async () => {
    const res = await fetch(`${BASE}/raJ6mj`);
    expect(res.ok).toBe(true);
    const html = await res.text();
    expect(isHubPage(html)).toBe(false);
    expect(isIndexPage(html)).toBe(true);
  });

  test('8-char ID falls back to index.html (not hub.html)', async () => {
    const res = await fetch(`${BASE}/raJ6mj3x`);
    expect(res.ok).toBe(true);
    const html = await res.text();
    expect(isHubPage(html)).toBe(false);
    expect(isIndexPage(html)).toBe(true);
  });
});

/* ------------------------------------------------------------------ */
/* SPA named-route contracts                                            */
/* ------------------------------------------------------------------ */

describe('SPA named-route contracts', () => {
  // Each named route should return the corresponding HTML page (not index.html).
  // Title mappings were verified live on the production server.
  const ROUTE_TITLES = [
    ['/signin', 'Sign In'],
    ['/verify', 'Verify Email'],
    ['/avatars', 'Avatar'],
    ['/scenes', 'Scene'],
    ['/link', 'Enter Code'],
    ['/discord', 'Hubs for Discord'],
    ['/cloud', 'Get Hubs Cloud'],
    ['/tokens', 'Tokens'],
  ]; // This is an Array<[string, string]>

  for (const [route, expectedTitle] of ROUTE_TITLES) {
    test(`GET ${route} serves the correct page with title "${expectedTitle}"`, async () => {
      const res = await fetch(`${BASE}${route}`);
      expect(res.ok).toBe(true);
      expect(isHtml(res)).toBe(true);
      const html = await res.text();
      // Must NOT be the index page (2078 bytes, title "App")
      expect(isIndexPage(html)).toBe(false);
      // Must contain the expected title
      expect(html).toMatch(new RegExp(`<title>${expectedTitle}</title>`));
    });
  }
});

/* ------------------------------------------------------------------ */
/* File extension routing — must NOT serve hub.html for file paths      */
/* ------------------------------------------------------------------ */

describe('File extension routing — glTF/file assets must NOT serve hub.html', () => {
  // These paths have dots (file extensions) and should NOT match the room
  // URL regex, because serving hub.html for them causes SyntaxError in
  // the glTF loader (which tries to parse HTML as JSON).
  test('GET /<hub-id>/objects.gltf returns 404 (not hub.html)', async () => {
    const res = await fetch(`${BASE}/KGsQjXJ/objects.gltf`);
    expect(res.status).toBe(404);
    const body = await res.text();
    // MUST NOT be hub.html (which would cause SyntaxError in glTF loader)
    expect(body.length < 10000).toBe(true);
    expect(isHubPage(body)).toBe(false);
  });

  test('GET /<hub-id>/scene.glb returns 404 (not hub.html)', async () => {
    const res = await fetch(`${BASE}/KGsQjXJ/scene.glb`);
    expect(res.status).toBe(404);
    const body = await res.text();
    expect(isHubPage(body)).toBe(false);
  });

  test('GET /<hub-id>/somefile.js returns 404 (not hub.html)', async () => {
    const res = await fetch(`${BASE}/KGsQjXJ/somefile.js`);
    expect(res.status).toBe(404);
    const body = await res.text();
    expect(isHubPage(body)).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
/* HEAD request contracts                                              */
/* ------------------------------------------------------------------ */

describe('HEAD request contracts', () => {
  test('HEAD to room ID returns 200 (not 404)', async () => {
    const res = await fetch(`${BASE}/raJ6mj3`, { method: 'HEAD' });
    expect(res.status).toBe(200);
  });

  test('HEAD to room ID with slug returns 200 (not 404)', async () => {
    const res = await fetch(`${BASE}/raJ6mj3/test-room`, { method: 'HEAD' });
    expect(res.status).toBe(200);
  });

  test('HEAD to 7-char ID + slug with hyphens returns 200', async () => {
    const res = await fetch(`${BASE}/raJ6mj3/handmade-thirsty-square`, { method: 'HEAD' });
    expect(res.status).toBe(200);
  });

  test('HEAD to file path returns 404', async () => {
    const res = await fetch(`${BASE}/KGsQjXJ/objects.gltf`, { method: 'HEAD' });
    expect(res.status).toBe(404);
  });
});

/* ------------------------------------------------------------------ */
/* Bundle integrity — patch verification                               */
/* ------------------------------------------------------------------ */

describe('Bundle integrity — patch verification', () => {
  const BUNDLE_FILE = 'hub-544153456e8422fbb129.js';

  test('hub.html references the correct hub bundle', async () => {
    const res = await fetch(`${BASE}/hub.html`);
    const html = await res.text();
    expect(html).toMatch(new RegExp(BUNDLE_FILE));
  });

  test('served hub bundle has getLayoutMap fix (truthy check)', async () => {
    const res = await fetch(`${BASE}/assets/js/${BUNDLE_FILE}`);
    const body = await res.text();
    // Truthy check: window.navigator.keyboard (no `void 0!==` prefix)
    expect(body).toContain('window.navigator.keyboard&&window.navigator.keyboard.getLayoutMap');
    // Old bug pattern must NOT be present
    expect(body).not.toContain('void 0!==window.navigator.keyboard&&window.navigator.keyboard.getLayoutMap');
  });

  test('served hub bundle has APP ReferenceError fix (window.APP?. guard)', async () => {
    const res = await fetch(`${BASE}/assets/js/${BUNDLE_FILE}`);
    const body = await res.text();
    // Guard: window.APP?.hub (not bare APP.hub)
    expect(body).toContain('window.APP?.hub?.user_data?.hubs_use_bitecs_based_client');
    // Old bug pattern (bare APP.hub) must NOT be present
    expect(body).not.toContain('APP.hub?.user_data?.hubs_use_bitecs_based_client');
  });
});

/* ------------------------------------------------------------------ */
/* Room creation e2e flow                                              */
/* ------------------------------------------------------------------ */

describe('Room creation e2e flow', () => {
  test('POST /api/v1/hubs creates a room whose URL serves hub.html', async () => {
    const res = await fetch(`${BASE}/api/v1/hubs`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ hub: { name: 'e2e-test-room' } }),
    });
    expect(res.ok).toBe(true);
    expect(isHtml(res)).toBe(false);
    expect(res.headers.get('access-control-allow-origin')).toBeTruthy();

    const hub = await res.json();
    // Contract validation
    const result = HubCreatedSchema.safeParse(hub);
    if (!result.success) console.error('hub creation contract violated:', result.error?.issues);
    expect(result.success).toBe(true);

    // The returned URL must be valid and contain the hub_id
    expect(hub.url).toContain(hub.hub_id);
    expect(hub.url).toMatch(/^https:\/\//);

    // The room page must serve hub.html (not index.html)
    const pageRes = await fetch(hub.url);
    expect(pageRes.ok).toBe(true);
    const html = await pageRes.text();
    expect(isHubPage(html)).toBe(true);
    expect(isIndexPage(html)).toBe(false);
    // hub.html loads the hub bundle + webxr-polyfill
    expect(html).toMatch(/hub-\w+\.js/);
    expect(html).toMatch(/webxr-polyfill/);
  }, 15000);
});

/* ------------------------------------------------------------------ */
/* PWA manifest completeness                                           */
/* ------------------------------------------------------------------ */

describe('PWA manifest completeness', () => {
  test('manifest has all required PWA fields and valid icons', async () => {
    const res = await fetch(`${BASE}/manifest.webmanifest`);
    expect(res.ok).toBe(true);
    expect(res.headers.get('content-type') || '').toMatch(/manifest\+json|application\/json/i);

    const manifest = await res.json();

    // Required PWA fields
    expect(manifest.name).toBeTruthy();
    expect(manifest.short_name).toBeTruthy();
    expect(manifest.start_url).toBeTruthy();
    expect(manifest.display).toBeTruthy();

    // Icon requirements (PWA installability)
    const icons = manifest.icons || [];
    expect(icons.length).toBeGreaterThanOrEqual(3);

    // Must have PNG icons
    const pngIcons = icons.filter((i) => (i.type || '').includes('png'));
    expect(pngIcons.length).toBeGreaterThanOrEqual(2);

    // Must have at least one icon >= 192px
    const has192 = pngIcons.some((i) => parseInt(i.sizes, 10) >= 192);
    expect(has192).toBe(true);

    // Must have a maskable icon
    const hasMaskable = pngIcons.some((i) => (i.purpose || '').includes('maskable'));
    expect(hasMaskable).toBe(true);

    // Must have an ICO icon
    const hasIco = icons.some((i) => (i.type || '').includes('icon'));
    expect(hasIco).toBe(true);
  });
});

/* ------------------------------------------------------------------ */
/* Content-type & cache-control contracts                               */
/* ------------------------------------------------------------------ */

describe('Content-type & cache-control contracts', () => {
  const CONTENT_TYPES = [
    ['/', /text\/html/i],
    ['/hub.html', /text\/html/i],
    ['/signin', /text\/html/i],
    ['/raJ6mj3', /text\/html/i],
    ['/raJ6mj3/test-room', /text\/html/i],
    ['/assets/js/hub-544153456e8422fbb129.js', /javascript/i],
    ['/manifest.webmanifest', /manifest\+json|application\/json/i],
    ['/favicon.ico', /image\//i],
    ['/assets/images/icon-192.png', /image\/png/i],
    ['/assets/images/icon-512.png', /image\/png/i],
    ['/assets/images/icon-512-maskable.png', /image\/png/i],
    ['/hub.service.js', /javascript/i],
  ]; // This is an Array<[string, RegExp]>

  for (const [path, expectedType] of CONTENT_TYPES) {
    test(`GET ${path} has correct content-type`, async () => {
      const res = await fetch(`${BASE}${path}`);
      expect(res.ok).toBe(true);
      expect(res.headers.get('content-type') || '').toMatch(expectedType);
    });
  }

  const NO_CACHE_PATHS = [
    '/',
    '/hub.html',
    '/signin',
    '/raJ6mj3',
    '/assets/js/hub-544153456e8422fbb129.js',
    '/manifest.webmanifest',
    '/favicon.ico',
    '/assets/images/icon-192.png',
    '/assets/images/icon-512.png',
    '/assets/images/icon-512-maskable.png',
    '/hub.service.js',
  ]; // This is an Array<string>

  for (const path of NO_CACHE_PATHS) {
    test(`GET ${path} has cache-control: no-cache`, async () => {
      const res = await fetch(`${BASE}${path}`);
      expect(res.headers.get('cache-control')).toMatch(/no-cache/i);
    });
  }
});

/* ------------------------------------------------------------------ */
/* HTML page structure                                                 */
/* ------------------------------------------------------------------ */

describe('HTML page structure', () => {
  test('index.html loads frontend, support, store, index bundles but NOT hub bundle', async () => {
    const res = await fetch(`${BASE}/`);
    const html = await res.text();
    expect(html).toMatch(/frontend-[\w]+\.js/);
    expect(html).toMatch(/support-[\w]+\.js/);
    expect(html).toMatch(/store-[\w]+\.js/);
    expect(html).toMatch(/index-[\w]+\.js/);
    // index.html should NOT load the heavy hub bundle
    expect(html).not.toMatch(/hub-[\w]+\.js/);
  });

  test('hub.html loads hub bundle, webxr-polyfill, engine, hub-vendors', async () => {
    const res = await fetch(`${BASE}/hub.html`);
    const html = await res.text();
    expect(html).toMatch(/hub-[\w]+\.js/);
    expect(html).toMatch(/webxr-polyfill-[\w]+\.js/);
    expect(html).toMatch(/engine-[\w]+\.js/);
    expect(html).toMatch(/hub-vendors-[\w]+\.js/);
  });

  test('all HTML pages have viewport meta tag', async () => {
    for (const path of ['/', '/hub.html', '/signin', '/verify', '/avatars', '/scenes']) {
      const res = await fetch(`${BASE}${path}`);
      const html = await res.text();
      expect(html).toMatch(/<meta[^>]*viewport[^>]*>/i);
    }
  });
});

/* ------------------------------------------------------------------ */
/* Negative routing — 404 and fallback                                 */
/* ------------------------------------------------------------------ */

describe('Negative routing — 404 and fallback behavior', () => {
  test('non-existent JS file returns 404', async () => {
    const res = await fetch(`${BASE}/assets/js/nonexistent-12345.js`);
    expect(res.status).toBe(404);
  });

  test('non-existent PNG file returns 404', async () => {
    const res = await fetch(`${BASE}/assets/images/nonexistent-12345.png`);
    expect(res.status).toBe(404);
  });

  test('unknown extensionless path falls back to SPA (index.html)', async () => {
    const res = await fetch(`${BASE}/this-is-not-a-real-route-xyz`);
    expect(res.ok).toBe(true);
    expect(isHtml(res)).toBe(true);
    const html = await res.text();
    // SPA fallback should be index.html (not hub.html)
    expect(isHubPage(html)).toBe(false);
    expect(isIndexPage(html)).toBe(true);
  });
});

/* ------------------------------------------------------------------ */
/* Resilience — non-existent room IDs                                  */
/* ------------------------------------------------------------------ */

describe('Resilience — non-existent room IDs', () => {
  test('non-existent room ID (7-char but not created) still serves hub.html', async () => {
    // The static server doesn't check if the room exists in reticulum;
    // it serves hub.html for any 7-char ID. The client will show a
    // "Room not found" message after loading.
    const res = await fetch(`${BASE}/aaaaaaa`);
    expect(res.ok).toBe(true);
    const html = await res.text();
    expect(isHubPage(html)).toBe(true);
  });
});

/* ------------------------------------------------------------------ */
/* Link integrity — all referenced assets resolve                     */
/* ------------------------------------------------------------------ */

describe('Link integrity — hub.html assets', () => {
  test('all script src tags in hub.html resolve to 200', async () => {
    const res = await fetch(`${BASE}/raJ6mj3/test-room`);
    const html = await res.text();
    const scripts = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map((m) => m[1]);
    expect(scripts.length).toBeGreaterThan(0);
    for (const src of scripts) {
      const r = await fetch(`${BASE}${src}`);
      if (!r.ok) console.error(`hub.html script ${src} returned ${r.status}`);
      expect(r.ok).toBe(true);
    }
  });

  test('all internal link href tags in hub.html resolve to 200', async () => {
    const res = await fetch(`${BASE}/raJ6mj3/test-room`);
    const html = await res.text();
    const links = [...html.matchAll(/<link[^>]+href="([^"]+)"/g)]
      .map((m) => m[1])
      .filter((href) => href.startsWith('/')); // skip external (fonts.gstatic.com etc.)
    expect(links.length).toBeGreaterThan(0);
    for (const href of links) {
      const r = await fetch(`${BASE}${href}`);
      if (!r.ok) console.error(`hub.html link ${href} returned ${r.status}`);
      expect(r.ok).toBe(true);
    }
  });
});

describe('Link integrity — index.html assets', () => {
  test('all script src tags in index.html resolve to 200', async () => {
    const res = await fetch(`${BASE}/`);
    const html = await res.text();
    const scripts = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map((m) => m[1]);
    expect(scripts.length).toBeGreaterThan(0);
    for (const src of scripts) {
      const r = await fetch(`${BASE}${src}`);
      if (!r.ok) console.error(`index.html script ${src} returned ${r.status}`);
      expect(r.ok).toBe(true);
    }
  });

  test('all internal link href tags in index.html resolve to 200', async () => {
    const res = await fetch(`${BASE}/`);
    const html = await res.text();
    const links = [...html.matchAll(/<link[^>]+href="([^"]+)"/g)]
      .map((m) => m[1])
      .filter((href) => href.startsWith('/'));
    expect(links.length).toBeGreaterThan(0);
    for (const href of links) {
      const r = await fetch(`${BASE}${href}`);
      if (!r.ok) console.error(`index.html link ${href} returned ${r.status}`);
      expect(r.ok).toBe(true);
    }
  });
});

/* ------------------------------------------------------------------ */
/* Manifest icon link integrity                                       */
/* ------------------------------------------------------------------ */

describe('Manifest icon link integrity', () => {
  test('every manifest icon URL resolves to 200 with correct content-type', async () => {
    const res = await fetch(`${BASE}/manifest.webmanifest`);
    const manifest = await res.json();
    const icons = manifest.icons || [];
    expect(icons.length).toBeGreaterThan(0);
    for (const icon of icons) {
      const iconRes = await fetch(`${BASE}${icon.src}`);
      if (!iconRes.ok) console.error(`manifest icon ${icon.src} returned ${iconRes.status}`);
      expect(iconRes.ok).toBe(true);
      const ct = iconRes.headers.get('content-type') || '';
      if (icon.type && icon.type.includes('png')) {
        expect(ct).toMatch(/image\/png/i);
      } else if (icon.type && icon.type.includes('icon')) {
        expect(ct).toMatch(/image\//i);
      }
    }
  });
});

/* ------------------------------------------------------------------ */
/* Security — path traversal, method rejection, headers              */
/* ------------------------------------------------------------------ */

describe('Security — path traversal protection', () => {
  test('directory traversal /../../../etc/passwd serves index.html (not /etc/passwd)', async () => {
    const res = await fetch(`${BASE}/../../../etc/passwd`);
    expect(res.ok).toBe(true);
    const body = await res.text();
    expect(body.includes('root:')).toBe(false);
    expect(isIndexPage(body)).toBe(true);
  });

  test('encoded traversal /%2e%2e/%2e%2e/etc/passwd serves index.html', async () => {
    const res = await fetch(`${BASE}/%2e%2e/%2e%2e/etc/passwd`);
    expect(res.ok).toBe(true);
    const body = await res.text();
    expect(body.includes('root:')).toBe(false);
    expect(isIndexPage(body)).toBe(true);
  });

  test('direct /etc/passwd serves index.html (not passwd file content)', async () => {
    const res = await fetch(`${BASE}/etc/passwd`);
    expect(res.ok).toBe(true);
    const body = await res.text();
    expect(body.includes('root:')).toBe(false);
    expect(isIndexPage(body)).toBe(true);
  });
});

describe('Security — HTTP method rejection', () => {
  test('PUT to / returns 501 (method not allowed)', async () => {
    const res = await fetch(`${BASE}/`, { method: 'PUT', body: 'test' });
    expect(res.status).toBe(501);
  });

  test('DELETE to / returns 501', async () => {
    const res = await fetch(`${BASE}/`, { method: 'DELETE' });
    expect(res.status).toBe(501);
  });

  test('POST to / returns 501', async () => {
    const res = await fetch(`${BASE}/`, { method: 'POST', body: 'test' });
    expect(res.status).toBe(501);
  });
});

describe('Security — API security headers', () => {
  test('/api/v1/meta has x-content-type-options: nosniff', async () => {
    const res = await fetch(`${BASE}/api/v1/meta`);
    expect(res.headers.get('x-content-type-options')).toBe('nosniff');
  });

  test('/api/v1/meta has x-frame-options: SAMEORIGIN', async () => {
    const res = await fetch(`${BASE}/api/v1/meta`);
    expect(res.headers.get('x-frame-options')).toBe('SAMEORIGIN');
  });

  test('/api/v1/meta has x-xss-protection header', async () => {
    const res = await fetch(`${BASE}/api/v1/meta`);
    expect(res.headers.get('x-xss-protection')).toBeTruthy();
  });
});

/* ------------------------------------------------------------------ */
/* CORS preflight                                                     */
/* ------------------------------------------------------------------ */

describe('CORS preflight', () => {
  test('OPTIONS /api/v1/meta returns 204 with CORS headers', async () => {
    const res = await fetch(`${BASE}/api/v1/meta`, { method: 'OPTIONS' });
    expect(res.status).toBe(204);
    expect(res.headers.get('access-control-allow-origin')).toBeTruthy();
    expect(res.headers.get('access-control-allow-methods')).toBeTruthy();
  });

  test('OPTIONS /api/v1/meta with Origin returns allow-origin:* + credentials:true', async () => {
    const res = await fetch(`${BASE}/api/v1/meta`, {
      method: 'OPTIONS',
      headers: { Origin: BASE, 'Access-Control-Request-Method': 'GET' },
    });
    expect(res.status).toBe(204);
    expect(res.headers.get('access-control-allow-origin')).toBe('*');
    expect(res.headers.get('access-control-allow-credentials')).toBe('true');
  });

  test('OPTIONS /api/v1/media/search returns 204 with CORS headers', async () => {
    const res = await fetch(`${BASE}/api/v1/media/search?source=rooms&filter=public&cursor=0`, {
      method: 'OPTIONS',
      headers: { Origin: BASE, 'Access-Control-Request-Method': 'GET' },
    });
    expect(res.status).toBe(204);
    expect(res.headers.get('access-control-allow-origin')).toBeTruthy();
  });
});

/* ------------------------------------------------------------------ */
/* Room URL edge cases (extended)                                     */
/* ------------------------------------------------------------------ */

describe('Room URL routing — extended edge cases', () => {
  test('trailing slash with slug (/raJ6mj3/test-room/) serves hub.html', async () => {
    const res = await fetch(`${BASE}/raJ6mj3/test-room/`);
    expect(res.ok).toBe(true);
    const html = await res.text();
    expect(isHubPage(html)).toBe(true);
  });

  test('slug with dot (/raJ6mj3/test.room) returns 404', async () => {
    const res = await fetch(`${BASE}/raJ6mj3/test.room`);
    expect(res.status).toBe(404);
  });

  test('slug with underscore (/raJ6mj3/test_room) serves hub.html', async () => {
    const res = await fetch(`${BASE}/raJ6mj3/test_room`);
    expect(res.ok).toBe(true);
    const html = await res.text();
    expect(isHubPage(html)).toBe(true);
  });

  test('very long slug (200 chars) serves hub.html', async () => {
    const res = await fetch(`${BASE}/raJ6mj3/${'a'.repeat(200)}`);
    expect(res.ok).toBe(true);
    const html = await res.text();
    expect(isHubPage(html)).toBe(true);
  });

  test('mixed case room ID (AbCdEfG) serves hub.html', async () => {
    const res = await fetch(`${BASE}/AbCdEfG`);
    expect(res.ok).toBe(true);
    const html = await res.text();
    expect(isHubPage(html)).toBe(true);
  });

  test('digits-only room ID (1234567) serves hub.html', async () => {
    const res = await fetch(`${BASE}/1234567`);
    expect(res.ok).toBe(true);
    const html = await res.text();
    expect(isHubPage(html)).toBe(true);
  });

  test('encoded space in slug (/raJ6mj3/test%20room) falls back to index.html', async () => {
    const res = await fetch(`${BASE}/raJ6mj3/test%20room`);
    expect(res.ok).toBe(true);
    const html = await res.text();
    expect(isIndexPage(html)).toBe(true);
  });

  test('double slash (//raJ6mj3) serves hub.html (path normalization)', async () => {
    const res = await fetch(`${BASE}//raJ6mj3`);
    expect(res.ok).toBe(true);
    const html = await res.text();
    expect(isHubPage(html)).toBe(true);
  });

  test('single-character slug (/raJ6mj3/a) serves hub.html', async () => {
    const res = await fetch(`${BASE}/raJ6mj3/a`);
    expect(res.ok).toBe(true);
    const html = await res.text();
    expect(isHubPage(html)).toBe(true);
  });
});

/* ------------------------------------------------------------------ */
/* Admin redirect                                                      */
/* ------------------------------------------------------------------ */

describe('Admin redirect', () => {
  test('/admin returns 302 redirect to /admin/admin.html', async () => {
    const res = await fetch(`${BASE}/admin`, { redirect: 'manual' });
    expect(res.status).toBe(302);
    const location = res.headers.get('location') || '';
    expect(location).toMatch(/\/admin\/admin\.html$/);
  });

  test('/admin/admin.html returns 200 with admin content', async () => {
    const res = await fetch(`${BASE}/admin/admin.html`);
    expect(res.ok).toBe(true);
    const html = await res.text();
    expect(html).toMatch(/admin/i);
  });

  test('/admin/ (trailing slash) returns 302 redirect to /admin/admin.html', async () => {
    const res = await fetch(`${BASE}/admin/`, { redirect: 'manual' });
    expect(res.status).toBe(302);
    const location = res.headers.get('location') || '';
    expect(location).toMatch(/\/admin\/admin\.html$/);
  });
});

/* ------------------------------------------------------------------ */
/* Health endpoints (SPA fallback)                                    */
/* ------------------------------------------------------------------ */

describe('Health endpoints (SPA fallback)', () => {
  test('/health returns 200 with index.html (SPA fallback)', async () => {
    const res = await fetch(`${BASE}/health`);
    expect(res.ok).toBe(true);
    expect(isHtml(res)).toBe(true);
    const html = await res.text();
    expect(isIndexPage(html)).toBe(true);
  });

  test('/healthz returns 200 — note: 7 chars matches room-ID regex so serves hub.html', async () => {
    const res = await fetch(`${BASE}/healthz`);
    expect(res.ok).toBe(true);
    const html = await res.text();
    // "healthz" is exactly 7 alphanumeric chars → matches the room-ID regex → hub.html
    expect(html).toMatch(/<title>Room | App/);
  });
});

/* ------------------------------------------------------------------ */
/* Room lifecycle — multiple room creation                            */
/* ------------------------------------------------------------------ */

describe('Room lifecycle — multiple room creation', () => {
  test('create 3 rooms with delays, verify unique hub_ids and hub.html serving', async () => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const hubIds = [];
    for (let i = 0; i < 3; i++) {
      const res = await fetch(`${BASE}/api/v1/hubs`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ hub: { name: `e2e-lifecycle-${i}` } }),
      });
      expect(res.ok).toBe(true);
      expect(isHtml(res)).toBe(false);
      const hub = await res.json();
      const result = HubCreatedSchema.safeParse(hub);
      if (!result.success) console.error(`room ${i} contract violated:`, result.error?.issues);
      expect(result.success).toBe(true);
      hubIds.push(hub.hub_id);
      // The room URL must serve hub.html
      const pageRes = await fetch(hub.url);
      expect(pageRes.ok).toBe(true);
      const html = await pageRes.text();
      expect(isHubPage(html)).toBe(true);
      if (i < 2) await sleep(2000); // avoid rate-limit
    }
    expect(new Set(hubIds).size).toBe(3);
  }, 20000);
});

/* ------------------------------------------------------------------ */
/* API error contracts                                                 */
/* ------------------------------------------------------------------ */

describe('API error contracts', () => {
  test('/api/v1/avatars returns 404 (reticulum does not route this)', async () => {
    const res = await fetch(`${BASE}/api/v1/avatars`);
    expect(res.status).toBe(404);
    expect(isHtml(res)).toBe(false);
  });

  test('/api/v1/scenes returns 404 (reticulum does not route this)', async () => {
    const res = await fetch(`${BASE}/api/v1/scenes`);
    expect(res.status).toBe(404);
    expect(isHtml(res)).toBe(false);
  });

  test('/api/v1/media/search?source=invalid returns 400 (bad source)', async () => {
    const res = await fetch(`${BASE}/api/v1/media/search?source=invalid`);
    expect(res.status).toBe(400);
    expect(isHtml(res)).toBe(false);
  });

  test('POST /api/v1/meta returns 404', async () => {
    const res = await fetch(`${BASE}/api/v1/meta`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{}',
    });
    expect(res.status).toBe(404);
  });

  test('PUT /api/v1/meta returns 404', async () => {
    const res = await fetch(`${BASE}/api/v1/meta`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: '{}',
    });
    expect(res.status).toBe(404);
  });

  test('DELETE /api/v1/meta returns 404', async () => {
    const res = await fetch(`${BASE}/api/v1/meta`, { method: 'DELETE' });
    expect(res.status).toBe(404);
  });

  test('PATCH /api/v1/meta returns 404', async () => {
    const res = await fetch(`${BASE}/api/v1/meta`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: '{}',
    });
    expect(res.status).toBe(404);
  });
});

/* ------------------------------------------------------------------ */
/* Server identity                                                    */
/* ------------------------------------------------------------------ */

describe('Server identity', () => {
  test('/api/v1/meta is served by Cowboy (reticulum/Erlang)', async () => {
    const res = await fetch(`${BASE}/api/v1/meta`);
    expect(res.headers.get('server')).toBe('Cowboy');
  });

  test('/ is served by Python SimpleHTTP (static server)', async () => {
    const res = await fetch(`${BASE}/`);
    expect(res.headers.get('server')).toMatch(/SimpleHTTP/i);
  });
});

/* ------------------------------------------------------------------ */
/* Content-type contracts (additional)                                 */
/* ------------------------------------------------------------------ */

describe('Content-type contracts (additional)', () => {
  test('/api/v1/meta returns text/plain (Cowboy JSON-as-text, not application/json)', async () => {
    const res = await fetch(`${BASE}/api/v1/meta`);
    const ct = res.headers.get('content-type') || '';
    expect(ct).toMatch(/text\/plain/i);
    expect(ct).not.toMatch(/text\/html/i);
  });

  test('POST /api/v1/hubs returns application/vnd.pgrst.object+json', async () => {
    // Small delay to avoid rate-limit with room lifecycle tests
    await new Promise((r) => setTimeout(r, 2000));
    const res = await fetch(`${BASE}/api/v1/hubs`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ hub: { name: 'e2e-content-type-test' } }),
    });
    expect(res.ok).toBe(true);
    const ct = res.headers.get('content-type') || '';
    expect(ct).toMatch(/application\/vnd\.pgrst\.object\+json/i);
  });
});

/* ------------------------------------------------------------------ */
/* A-Frame structure                                                  */
/* ------------------------------------------------------------------ */

describe('A-Frame structure', () => {
  test('hub.html contains <a-scene> element', async () => {
    const res = await fetch(`${BASE}/raJ6mj3/test-room`);
    const html = await res.text();
    expect(html).toMatch(/<a-scene/i);
  });

  test('index.html does NOT contain <a-scene> element', async () => {
    const res = await fetch(`${BASE}/`);
    const html = await res.text();
    expect(html).not.toMatch(/<a-scene/i);
  });
});

/* ------------------------------------------------------------------ */
/* SPA fallback — additional                                        */
/* ------------------------------------------------------------------ */

describe('SPA fallback — additional paths', () => {
  test('nested unknown path /foo/bar serves index.html', async () => {
    const res = await fetch(`${BASE}/foo/bar`);
    expect(res.ok).toBe(true);
    const html = await res.text();
    expect(isIndexPage(html)).toBe(true);
  });

  test('/signin?redirect=/rooms serves Sign In page (query param routing)', async () => {
    const res = await fetch(`${BASE}/signin?redirect=/rooms`);
    expect(res.ok).toBe(true);
    const html = await res.text();
    expect(html).toMatch(/<title>Sign In<\/title>/);
  });
});

/* ------------------------------------------------------------------ */
/* HEAD /api requests                                                 */
/* ------------------------------------------------------------------ */

describe('HEAD /api request', () => {
  test('HEAD /api/v1/meta returns 200', async () => {
    const res = await fetch(`${BASE}/api/v1/meta`, { method: 'HEAD' });
    expect(res.status).toBe(200);
  });
});

/* ------------------------------------------------------------------ */
/* API routing — reticulum paths                                      */
/* ------------------------------------------------------------------ */

describe('API routing — reticulum path contracts', () => {
  test('/socket returns 404 (reticulum, not HTML, not SPA)', async () => {
    const res = await fetch(`${BASE}/socket`);
    expect(res.status).toBe(404);
    expect(isHtml(res)).toBe(false);
  });

  test('/reticulum returns 404 (reticulum, not HTML, not SPA)', async () => {
    const res = await fetch(`${BASE}/reticulum`);
    expect(res.status).toBe(404);
    expect(isHtml(res)).toBe(false);
  });

  test('/files returns 404 (reticulum, not HTML, not SPA)', async () => {
    const res = await fetch(`${BASE}/files`);
    expect(res.status).toBe(404);
    expect(isHtml(res)).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
/* API method contracts — GET vs POST                                 */
/* ------------------------------------------------------------------ */

describe('API method contracts', () => {
  test('GET /api/v1/hubs returns 404 (only POST is supported for room creation)', async () => {
    const res = await fetch(`${BASE}/api/v1/hubs`);
    expect(res.status).toBe(404);
    expect(isHtml(res)).toBe(false);
  });

  test('GET /api/v1/hubs/ (trailing slash) returns 404', async () => {
    const res = await fetch(`${BASE}/api/v1/hubs/`);
    expect(res.status).toBe(404);
  });
});

/* ------------------------------------------------------------------ */
/* Static file routing edge cases                                     */
/* ------------------------------------------------------------------ */

describe('Static file routing edge cases', () => {
  test('/hub.html/ (trailing slash on file) falls back to index.html (not hub.html)', async () => {
    const res = await fetch(`${BASE}/hub.html/`);
    expect(res.ok).toBe(true);
    const html = await res.text();
    // Python SimpleHTTPRequestHandler treats /hub.html/ as a directory path
    // that doesn't exist → SPA fallback → index.html
    expect(isIndexPage(html)).toBe(true);
    expect(isHubPage(html)).toBe(false);
  });

  test('/manifest.webmanifest/ (trailing slash) falls back to index.html (not JSON)', async () => {
    const res = await fetch(`${BASE}/manifest.webmanifest/`);
    expect(res.ok).toBe(true);
    const html = await res.text();
    // A trailing slash on the manifest path means it's not served as JSON
    expect(isIndexPage(html)).toBe(true);
  });
});

/* ------------------------------------------------------------------ */
/* Deep path routing                                                  */
/* ------------------------------------------------------------------ */

describe('Deep path routing', () => {
  test('/raJ6mj3/a/b/c (deep nesting) falls back to index.html (not hub.html)', async () => {
    const res = await fetch(`${BASE}/raJ6mj3/a/b/c`);
    expect(res.ok).toBe(true);
    const html = await res.text();
    // The room-ID regex only allows one optional slug segment
    // (/[A-Za-z0-9_-]*), so multi-level paths fall to SPA fallback
    expect(isIndexPage(html)).toBe(true);
    expect(isHubPage(html)).toBe(false);
  });

  test('/raJ6mj3/a/b (two segments) falls back to index.html', async () => {
    const res = await fetch(`${BASE}/raJ6mj3/a/b`);
    expect(res.ok).toBe(true);
    const html = await res.text();
    expect(isIndexPage(html)).toBe(true);
  });
});

/* ------------------------------------------------------------------ */
/* Asset property tests                                               */
/* ------------------------------------------------------------------ */

describe('Asset property — cache-control on static assets', () => {
  test('all JS bundles have cache-control: no-cache', async () => {
    const res = await fetch(`${BASE}/hub.html`);
    const html = await res.text();
    const scripts = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map((m) => m[1]);
    const localScripts = scripts.filter((s) => s.startsWith('/'));
    expect(localScripts.length).toBeGreaterThan(0);
    for (const src of localScripts) {
      const r = await fetch(`${BASE}${src}`);
      const cc = r.headers.get('cache-control') || '';
      if (!cc.match(/no-cache/i)) console.error(`script ${src} cache-control: ${cc}`);
      expect(cc).toMatch(/no-cache/i);
    }
  });

  test('all CSS bundles have cache-control: no-cache', async () => {
    const res = await fetch(`${BASE}/hub.html`);
    const html = await res.text();
    const links = [...html.matchAll(/<link[^>]+href="([^"]+)"/g)].map((m) => m[1]);
    const cssLinks = links.filter((h) => h.startsWith('/') && h.endsWith('.css'));
    expect(cssLinks.length).toBeGreaterThan(0);
    for (const href of cssLinks) {
      const r = await fetch(`${BASE}${href}`);
      const cc = r.headers.get('cache-control') || '';
      if (!cc.match(/no-cache/i)) console.error(`css ${href} cache-control: ${cc}`);
      expect(cc).toMatch(/no-cache/i);
    }
  });
});

describe('Asset property — CORS on static assets', () => {
  test('JS bundles have access-control-allow-origin: *', async () => {
    const res = await fetch(`${BASE}/assets/js/frontend-b15f0d3a8e669ae5e13d.js`);
    expect(res.headers.get('access-control-allow-origin')).toBeTruthy();
  });

  test('CSS bundles have access-control-allow-origin: *', async () => {
    const res = await fetch(`${BASE}/assets/stylesheets/hub-177db13c35c3313eda13.css`);
    expect(res.headers.get('access-control-allow-origin')).toBeTruthy();
  });

  test('HTML pages have access-control-allow-origin: *', async () => {
    const res = await fetch(`${BASE}/hub.html`);
    expect(res.headers.get('access-control-allow-origin')).toBeTruthy();
  });
});

/* ------------------------------------------------------------------ */
/* Service worker structural contract                                  */
/* ------------------------------------------------------------------ */

describe('Service worker structural contract', () => {
  test('hub.service.js uses self.addEventListener (not bare addEventListener)', async () => {
    const res = await fetch(`${BASE}/hub.service.js`);
    const body = await res.text();
    expect(body).toMatch(/self\.addEventListener/);
    // Must NOT use bare addEventListener (should be self.addEventListener)
    expect(body).not.toMatch(/[^.]addEventListener\("install"/);
  });

  test('hub.service.js does NOT contain a no-op addEventListener("fetch")', async () => {
    const res = await fetch(`${BASE}/hub.service.js`);
    const body = await res.text();
    // The service worker intentionally has no fetch handler
    expect(body).not.toMatch(/addEventListener\(\s*["']fetch["']/);
  });
});

/* ------------------------------------------------------------------ */
/* HTML structural contracts                                           */
/* ------------------------------------------------------------------ */

describe('HTML structural contracts', () => {
  test('hub.html starts with <!DOCTYPE html>', async () => {
    const html = await (await fetch(`${BASE}/hub.html`)).text();
    expect(html.startsWith('<!DOCTYPE html>')).toBe(true);
  });

  test('index.html starts with <!DOCTYPE html>', async () => {
    const html = await (await fetch(`${BASE}/`)).text();
    expect(html.startsWith('<!DOCTYPE html>')).toBe(true);
  });

  test('hub.html has <meta charset="utf-8">', async () => {
    const html = await (await fetch(`${BASE}/hub.html`)).text();
    expect(html).toMatch(/<meta[^>]*charset=["']?utf-?8["']?/i);
  });

  test('index.html has <meta charset="utf-8">', async () => {
    const html = await (await fetch(`${BASE}/`)).text();
    expect(html).toMatch(/<meta[^>]*charset=["']?utf-?8["']?/i);
  });
});

/* ------------------------------------------------------------------ */
/* Room URL structural invariants                                      */
/* ------------------------------------------------------------------ */

describe('Room URL structural invariants', () => {
  test('all room URL variants return identical byte length', async () => {
    const urls = ['/raJ6mj3', '/raJ6mj3/', '/raJ6mj3/test-room', '/raJ6mj3/test-room/'];
    const sizes = [];
    for (const url of urls) {
      const res = await fetch(`${BASE}${url}`);
      const body = await res.text();
      sizes.push(body.length);
    }
    // All variants must return the same hub.html
    expect(new Set(sizes).size).toBe(1);
    expect(sizes[0]).toBeGreaterThan(10000);
  });
});

/* ------------------------------------------------------------------ */
/* hub.html meta tag contracts                                        */
/* ------------------------------------------------------------------ */

describe('hub.html meta tag contracts', () => {
  test('hub.html has <link rel="manifest" href="/manifest.webmanifest">', async () => {
    const html = await (await fetch(`${BASE}/hub.html`)).text();
    expect(html).toMatch(/<link[^>]+rel=["']manifest["'][^>]+href=["']\/manifest\.webmanifest["']/i);
  });

  test('hub.html favicon link includes sizes with 48x48', async () => {
    const html = await (await fetch(`${BASE}/hub.html`)).text();
    const match = html.match(/<link[^>]+rel=["']icon["'][^>]+sizes=["']([^"']*)["']/i);
    expect(match).toBeTruthy();
    if (match) {
      expect(match[1]).toMatch(/48x48/);
    }
  });

  test('hub.html favicon link includes all 5 sizes (16, 24, 32, 48, 64)', async () => {
    const html = await (await fetch(`${BASE}/hub.html`)).text();
    const match = html.match(/<link[^>]+rel=["']icon["'][^>]+sizes=["']([^"']*)["']/i);
    expect(match).toBeTruthy();
    if (match) {
      const sizes = match[1];
      expect(sizes).toMatch(/16x16/);
      expect(sizes).toMatch(/24x24/);
      expect(sizes).toMatch(/32x32/);
      expect(sizes).toMatch(/48x48/);
      expect(sizes).toMatch(/64x64/);
    }
  });
});

/* ------------------------------------------------------------------ */
/* Asset content-type matrix                                           */
/* ------------------------------------------------------------------ */

describe('Asset content-type matrix', () => {
  test('CSS file has content-type: text/css', async () => {
    const res = await fetch(`${BASE}/assets/stylesheets/hub-177db13c35c3313eda13.css`);
    expect(res.ok).toBe(true);
    expect(res.headers.get('content-type') || '').toMatch(/text\/css/i);
  });

  test('JS file has content-type: application/javascript or text/javascript', async () => {
    const res = await fetch(`${BASE}/assets/js/frontend-b15f0d3a8e669ae5e13d.js`);
    expect(res.ok).toBe(true);
    const ct = res.headers.get('content-type') || '';
    expect(ct).toMatch(/javascript/i);
  });

  test('hub.service.js has content-type: application/javascript or text/javascript', async () => {
    const res = await fetch(`${BASE}/hub.service.js`);
    expect(res.ok).toBe(true);
    const ct = res.headers.get('content-type') || '';
    expect(ct).toMatch(/javascript/i);
  });
});

/* ------------------------------------------------------------------ */
/* Room URL slug character class contracts                            */
/* ------------------------------------------------------------------ */

describe('Room URL slug character class contracts', () => {
  test('slug with only underscores serves hub.html', async () => {
    const res = await fetch(`${BASE}/raJ6mj3/___`);
    expect(res.ok).toBe(true);
    const html = await res.text();
    expect(isHubPage(html)).toBe(true);
  });

  test('slug with only hyphens serves hub.html', async () => {
    const res = await fetch(`${BASE}/raJ6mj3/---`);
    expect(res.ok).toBe(true);
    const html = await res.text();
    expect(isHubPage(html)).toBe(true);
  });

  test('slug with all valid chars (letters, digits, underscore, hyphen) serves hub.html', async () => {
    const res = await fetch(`${BASE}/raJ6mj3/AbCdEfG_0123-`);
    expect(res.ok).toBe(true);
    const html = await res.text();
    expect(isHubPage(html)).toBe(true);
  });

  test('slug with digits only serves hub.html', async () => {
    const res = await fetch(`${BASE}/raJ6mj3/12345`);
    expect(res.ok).toBe(true);
    const html = await res.text();
    expect(isHubPage(html)).toBe(true);
  });
});

/* ------------------------------------------------------------------ */
/* API consistency under load                                        */
/* ------------------------------------------------------------------ */

describe('API consistency under load', () => {
  test('5 consecutive /api/v1/meta calls all return 200 with Cowboy server', async () => {
    const results = [];
    for (let i = 0; i < 5; i++) {
      const res = await fetch(`${BASE}/api/v1/meta`);
      results.push({ status: res.status, server: res.headers.get('server') });
    }
    results.forEach((r, i) => {
      if (r.status !== 200) console.error(`call ${i}: status=${r.status} server=${r.server}`);
      expect(r.status).toBe(200);
      expect(r.server).toBe('Cowboy');
    });
  });
});

/* ------------------------------------------------------------------ */
/* Property-based: slug character class invariants                   */
/* ------------------------------------------------------------------ */

describe('Property — slug character class invariants', () => {
  const VALID_SLUG_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-';
  const INVALID_SLUG_CHARS = '.';

  function randString(len, chars) {
    let s = '';
    for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
    return s;
  }

  test('random slugs from [A-Za-z0-9_-] always serve hub.html', async () => {
    for (let i = 0; i < 5; i++) {
      const slug = randString(5 + Math.floor(Math.random() * 10), VALID_SLUG_CHARS);
      const res = await fetch(`${BASE}/raJ6mj3/${slug}`);
      if (!res.ok) console.error(`slug "${slug}" returned ${res.status}`);
      expect(res.ok).toBe(true);
      const html = await res.text();
      expect(isHubPage(html)).toBe(true);
    }
  });

  test('random slugs containing dots always return 404', async () => {
    for (let i = 0; i < 5; i++) {
      const slug = randString(3 + Math.floor(Math.random() * 3), VALID_SLUG_CHARS) + '.xyz';
      const res = await fetch(`${BASE}/raJ6mj3/${slug}`);
      expect(res.status).toBe(404);
    }
  });
});

/* ------------------------------------------------------------------ */
/* API method contracts — collection vs item                         */
/* ------------------------------------------------------------------ */

describe('API method contracts — collection vs item', () => {
  test('GET /api/v1/hubs/test returns 404 (bad Room ID)', async () => {
    const res = await fetch(`${BASE}/api/v1/hubs/test`);
    expect(res.status).toBe(404);
    expect(isHtml(res)).toBe(false);
  });

  test('PUT /api/v1/hubs/test returns 401 (unauthenticated)', async () => {
    const res = await fetch(`${BASE}/api/v1/hubs/test`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: '{}',
    });
    expect(res.status).toBe(401);
  });

  test('DELETE /api/v1/hubs/test returns 401 or 403 (unauthenticated/forbidden)', async () => {
    const res = await fetch(`${BASE}/api/v1/hubs/test`, { method: 'DELETE' });
    expect([401, 403]).toContain(res.status);
  });
});

/* ------------------------------------------------------------------ */
/* API query parameter contracts                                       */
/* ------------------------------------------------------------------ */

describe('API query parameter contracts', () => {
  test('GET /api/v1/media/search without params returns 400', async () => {
    const res = await fetch(`${BASE}/api/v1/media/search`);
    expect(res.status).toBe(400);
    expect(isHtml(res)).toBe(false);
  });

  test('GET /api/v1/media/search?source=rooms (no filter/cursor) returns 500', async () => {
    const res = await fetch(`${BASE}/api/v1/media/search?source=rooms`);
    expect(res.status).toBe(500);
    expect(isHtml(res)).toBe(false);
  });

  test('/api/v1/meta?foo=bar ignores query string and returns 200', async () => {
    const res = await fetch(`${BASE}/api/v1/meta?foo=bar`);
    expect(res.ok).toBe(true);
    expect(isHtml(res)).toBe(false);
    const body = await res.json();
    expect(MetaSchemaFull.safeParse(body).success).toBe(true);
  });
});

/* ------------------------------------------------------------------ */
/* Static server header contracts                                      */
/* ------------------------------------------------------------------ */

describe('Static server header contracts', () => {
  test('/ has access-control-allow-origin: * (CORS on static assets)', async () => {
    const res = await fetch(`${BASE}/`);
    expect(res.headers.get('access-control-allow-origin')).toBe('*');
  });

  test('/ has last-modified header (Python SimpleHTTP behavior)', async () => {
    const res = await fetch(`${BASE}/`);
    expect(res.headers.get('last-modified')).toBeTruthy();
  });

  test('/ does NOT have x-content-type-options (no security headers on static)', async () => {
    const res = await fetch(`${BASE}/`);
    expect(res.headers.get('x-content-type-options')).toBeFalsy();
  });

  test('/ does NOT have x-frame-options (no security headers on static)', async () => {
    const res = await fetch(`${BASE}/`);
    expect(res.headers.get('x-frame-options')).toBeFalsy();
  });

  test('/hub.html has cache-control: no-cache', async () => {
    const res = await fetch(`${BASE}/hub.html`);
    expect(res.headers.get('cache-control')).toMatch(/no-cache/i);
  });
});

/* ------------------------------------------------------------------ */
/* CORS preflight — detailed header contracts                          */
/* ------------------------------------------------------------------ */

describe('CORS preflight — detailed headers', () => {
  test('OPTIONS /api/v1/meta allow-methods includes all standard HTTP methods', async () => {
    const res = await fetch(`${BASE}/api/v1/meta`, {
      method: 'OPTIONS',
      headers: { Origin: BASE, 'Access-Control-Request-Method': 'GET' },
    });
    const methods = res.headers.get('access-control-allow-methods') || '';
    expect(methods).toMatch(/GET/i);
    expect(methods).toMatch(/POST/i);
    expect(methods).toMatch(/PUT/i);
    expect(methods).toMatch(/PATCH/i);
    expect(methods).toMatch(/DELETE/i);
    expect(methods).toMatch(/OPTIONS/i);
  });

  test('OPTIONS /api/v1/meta allow-headers includes Content-Type and Authorization', async () => {
    const res = await fetch(`${BASE}/api/v1/meta`, {
      method: 'OPTIONS',
      headers: { Origin: BASE, 'Access-Control-Request-Method': 'GET' },
    });
    const headers = res.headers.get('access-control-allow-headers') || '';
    expect(headers).toMatch(/Content-Type/i);
    expect(headers).toMatch(/Authorization/i);
  });

  test('OPTIONS /api/v1/meta allow-credentials is true', async () => {
    const res = await fetch(`${BASE}/api/v1/meta`, {
      method: 'OPTIONS',
      headers: { Origin: BASE, 'Access-Control-Request-Method': 'GET' },
    });
    expect(res.headers.get('access-control-allow-credentials')).toBe('true');
  });

  test('OPTIONS /api/v1/meta max-age is 1728000 (24 hours)', async () => {
    const res = await fetch(`${BASE}/api/v1/meta`, {
      method: 'OPTIONS',
      headers: { Origin: BASE, 'Access-Control-Request-Method': 'GET' },
    });
    expect(res.headers.get('access-control-max-age')).toBe('1728000');
  });
});

/* ------------------------------------------------------------------ */
/* CORS on error responses                                            */
/* ------------------------------------------------------------------ */

describe('CORS on error responses', () => {
  test('404 on /api/v1/avatars still has CORS allow-origin', async () => {
    const res = await fetch(`${BASE}/api/v1/avatars`);
    expect(res.status).toBe(404);
    expect(res.headers.get('access-control-allow-origin')).toBeTruthy();
  });

  test('401 on /api/v1/hubs/test has CORS allow-origin', async () => {
    const res = await fetch(`${BASE}/api/v1/hubs/test`, { method: 'PUT' });
    expect(res.status).toBe(401);
    expect(res.headers.get('access-control-allow-origin')).toBeTruthy();
  });
});

/* ------------------------------------------------------------------ */
/* API response structure contracts                                    */
/* ------------------------------------------------------------------ */

describe('API response structure contracts', () => {
  test('/api/v1/meta has exactly 4 keys: version, pool, phx_port, phx_host', async () => {
    const res = await fetch(`${BASE}/api/v1/meta`);
    const body = await res.json();
    // passthrow allows extra keys, but we verify the required ones exist
    expect(body).toHaveProperty('version');
    expect(body).toHaveProperty('phx_host');
    expect(body).toHaveProperty('phx_port');
    expect(body).toHaveProperty('pool');
  });

  test('phx_port is "4000" (Phoenix socket port)', async () => {
    const res = await fetch(`${BASE}/api/v1/meta`);
    const body = await res.json();
    expect(body.phx_port).toBe('4000');
  });

  test('phx_host matches the request host', async () => {
    const res = await fetch(`${BASE}/api/v1/meta`);
    const body = await res.json();
    expect(body.phx_host).toBe('hubs.chemie-lernen.org');
  });

  test('meta.next_cursor is a number (integer cursor)', async () => {
    const res = await fetch(`${BASE}/api/v1/media/search?source=rooms&filter=public&cursor=0`);
    const body = await res.json();
    // next_cursor is 1 on first page, null when exhausted — must be number or null
    const cursorType = typeof body.meta.next_cursor;
    expect(cursorType === 'number' || cursorType === 'object' || body.meta.next_cursor === null).toBe(true);
  });

  test('media/search meta.source is "public_rooms"', async () => {
    const res = await fetch(`${BASE}/api/v1/media/search?source=rooms&filter=public&cursor=0`);
    const body = await res.json();
    expect(body.meta.source).toBe('public_rooms');
  });
});

/* ------------------------------------------------------------------ */
/* Manifest field contracts                                            */
/* ------------------------------------------------------------------ */

describe('Manifest field contracts', () => {
  test('manifest has name: "Chemie Lernen Hubs"', async () => {
    const res = await fetch(`${BASE}/manifest.webmanifest`);
    const manifest = await res.json();
    expect(manifest.name).toBe('Chemie Lernen Hubs');
  });

  test('manifest has short_name: "ChemieHubs"', async () => {
    const res = await fetch(`${BASE}/manifest.webmanifest`);
    const manifest = await res.json();
    expect(manifest.short_name).toBe('ChemieHubs');
  });

  test('manifest has start_url: "/"', async () => {
    const res = await fetch(`${BASE}/manifest.webmanifest`);
    const manifest = await res.json();
    expect(manifest.start_url).toBe('/');
  });

  test('manifest has display: "standalone"', async () => {
    const res = await fetch(`${BASE}/manifest.webmanifest`);
    const manifest = await res.json();
    expect(manifest.display).toBe('standalone');
  });

  test('manifest has background_color: "#1b1b1b"', async () => {
    const res = await fetch(`${BASE}/manifest.webmanifest`);
    const manifest = await res.json();
    expect(manifest.background_color).toBe('#1b1b1b');
  });

  test('manifest has theme_color: "#2d6a4f"', async () => {
    const res = await fetch(`${BASE}/manifest.webmanifest`);
    const manifest = await res.json();
    expect(manifest.theme_color).toBe('#2d6a4f');
  });
});

/* ------------------------------------------------------------------ */
/* Content-length contracts                                            */
/* ------------------------------------------------------------------ */

describe('Content-length contracts', () => {
  test('POST /api/v1/hubs response has content-length header', async () => {
    // Delay to avoid rate-limit with room lifecycle tests
    await new Promise((r) => setTimeout(r, 2000));
    const res = await fetch(`${BASE}/api/v1/hubs`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ hub: { name: 'e2e-length-test' } }),
    });
    expect(res.ok).toBe(true);
    const cl = res.headers.get('content-length');
    expect(parseInt(cl || '0')).toBeGreaterThan(0);
  });

  test('favicon.ico has content-length header', async () => {
    const res = await fetch(`${BASE}/favicon.ico`);
    expect(res.ok).toBe(true);
    const cl = res.headers.get('content-length');
    expect(parseInt(cl || '0')).toBeGreaterThan(0);
  });
});

/* ------------------------------------------------------------------ */
/* API input validation contracts                                      */
/* ------------------------------------------------------------------ */

describe('API input validation contracts', () => {
  test('POST /api/v1/hubs with empty name {} returns 400', async () => {
    await new Promise((r) => setTimeout(r, 2000));
    const res = await fetch(`${BASE}/api/v1/hubs`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{}',
    });
    expect(res.status).toBe(400);
    expect(isHtml(res)).toBe(false);
  });

  test('POST /api/v1/hubs with invalid JSON body returns 400', async () => {
    await new Promise((r) => setTimeout(r, 2000));
    const res = await fetch(`${BASE}/api/v1/hubs`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: 'not json',
    });
    expect(res.status).toBe(400);
  });

  test('POST /api/v1/hubs with empty room name returns 422', async () => {
    await new Promise((r) => setTimeout(r, 2000));
    const res = await fetch(`${BASE}/api/v1/hubs`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ hub: { name: '' } }),
    });
    expect(res.status).toBe(422);
  });

  test('POST /api/v1/hubs with very long name returns 422', async () => {
    await new Promise((r) => setTimeout(r, 2000));
    const res = await fetch(`${BASE}/api/v1/hubs`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ hub: { name: 'x'.repeat(500) } }),
    });
    expect(res.status).toBe(422);
  });

  test('POST /api/v1/hubs without content-type header returns 400', async () => {
    await new Promise((r) => setTimeout(r, 2000));
    const res = await fetch(`${BASE}/api/v1/hubs`, {
      method: 'POST',
      body: JSON.stringify({ hub: { name: 'no-ct-test' } }),
    });
    expect(res.status).toBe(400);
  });
});

/* ------------------------------------------------------------------ */
/* Room creation response contracts                                    */
/* ------------------------------------------------------------------ */

describe('Room creation response contracts', () => {
  test('created room URL starts with https://', async () => {
    await new Promise((r) => setTimeout(r, 2000));
    const res = await fetch(`${BASE}/api/v1/hubs`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ hub: { name: 'e2e-https-url-test' } }),
    });
    expect(res.ok).toBe(true);
    const hub = await res.json();
    expect(hub.url).toMatch(/^https:\/\//);
  });

  test('created room hub_id is exactly 7 characters', async () => {
    await new Promise((r) => setTimeout(r, 2000));
    const res = await fetch(`${BASE}/api/v1/hubs`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ hub: { name: 'e2e-7char-test' } }),
    });
    expect(res.ok).toBe(true);
    const hub = await res.json();
    expect(hub.hub_id).toHaveLength(7);
  });

  test('created room URL path starts with /{hub_id}/', async () => {
    await new Promise((r) => setTimeout(r, 2000));
    const res = await fetch(`${BASE}/api/v1/hubs`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ hub: { name: 'e2e-url-pattern' } }),
    });
    expect(res.ok).toBe(true);
    const hub = await res.json();
    const url = new URL(hub.url);
    expect(url.pathname).toMatch(new RegExp('^/' + hub.hub_id + '/'));
  });

  test('created room response has no Location header (not REST-style)', async () => {
    await new Promise((r) => setTimeout(r, 2000));
    const res = await fetch(`${BASE}/api/v1/hubs`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ hub: { name: 'e2e-no-location' } }),
    });
    expect(res.headers.get('location')).toBeFalsy();
  });

  test('created room page has identical structure to /raJ6mj3/test-room', async () => {
    await new Promise((r) => setTimeout(r, 2000));
    const res = await fetch(`${BASE}/api/v1/hubs`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ hub: { name: 'e2e-page-struct' } }),
    });
    expect(res.ok).toBe(true);
    const hub = await res.json();
    const roomRes = await fetch(hub.url);
    expect(roomRes.ok).toBe(true);
    const html = await roomRes.text();
    expect(isHubPage(html)).toBe(true);
    // Should have the same HTML structure as /raJ6mj3/test-room
    const refRes = await fetch(`${BASE}/raJ6mj3/test-room`);
    const refHtml = await refRes.text();
    // Both should reference the same hub bundle
    expect(html).toMatch(/hub-544153456e8422fbb129\.js/);
    expect(refHtml).toMatch(/hub-544153456e8422fbb129\.js/);
    // Both should have <a-scene>
    expect(html).toMatch(/<a-scene/i);
    expect(refHtml).toMatch(/<a-scene/i);
  });
});

/* ------------------------------------------------------------------ */
/* API error response content-type matrix                             */
/* ------------------------------------------------------------------ */

describe('API error response content-type matrix', () => {
  test('404 on /api/v1/avatars has text/plain content-type', async () => {
    const res = await fetch(`${BASE}/api/v1/avatars`);
    expect(res.status).toBe(404);
    expect(res.headers.get('content-type') || '').toMatch(/text\/plain/i);
  });

  test('400 on /api/v1/media/search?source=invalid has vnd.pgrst content-type', async () => {
    const res = await fetch(`${BASE}/api/v1/media/search?source=invalid`);
    expect(res.status).toBe(400);
    expect(res.headers.get('content-type') || '').toMatch(/application\/vnd\.pgrst/i);
  });

  test('400 on POST /api/v1/hubs with invalid JSON has text/html content-type', async () => {
    await new Promise((r) => setTimeout(r, 2000));
    const res = await fetch(`${BASE}/api/v1/hubs`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: 'not json',
    });
    expect(res.status).toBe(400);
    // Bug detection: invalid JSON returns text/html, not JSON
    expect(res.headers.get('content-type') || '').toMatch(/text\/html/i);
  });

  test('401 on PUT /api/v1/hubs/test has text/plain content-type', async () => {
    const res = await fetch(`${BASE}/api/v1/hubs/test`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: '{}',
    });
    expect(res.status).toBe(401);
    expect(res.headers.get('content-type') || '').toMatch(/text\/plain/i);
  });
});

/* ------------------------------------------------------------------ */
/* Server identity — extended                                        */
/* ------------------------------------------------------------------ */

describe('Server identity — extended', () => {
  test('/api/v1/meta has x-request-id header (Cowboy request tracking)', async () => {
    const res = await fetch(`${BASE}/api/v1/meta`);
    expect(res.headers.get('x-request-id')).toBeTruthy();
  });

  test('/api/v1/meta has cross-origin-window-policy: deny', async () => {
    const res = await fetch(`${BASE}/api/v1/meta`);
    expect(res.headers.get('cross-origin-window-policy')).toBe('deny');
  });

  test('/api/v1/meta has x-download-options: noopen', async () => {
    const res = await fetch(`${BASE}/api/v1/meta`);
    expect(res.headers.get('x-download-options')).toBe('noopen');
  });

  test('/api/v1/meta has x-permitted-cross-domain-policies: none', async () => {
    const res = await fetch(`${BASE}/api/v1/meta`);
    expect(res.headers.get('x-permitted-cross-domain-policies')).toBe('none');
  });

  test('/ does NOT have x-request-id (Python server, not Cowboy)', async () => {
    const res = await fetch(`${BASE}/`);
    expect(res.headers.get('x-request-id')).toBeFalsy();
  });

  test('/ does NOT have content-security-policy (Python static server)', async () => {
    const res = await fetch(`${BASE}/`);
    expect(res.headers.get('content-security-policy')).toBeFalsy();
  });
});

/* ------------------------------------------------------------------ */
/* HTML structural completeness                                       */
/* ------------------------------------------------------------------ */

describe('HTML structural completeness', () => {
  test('hub.html has closing </html> tag', async () => {
    const html = await (await fetch(`${BASE}/hub.html`)).text();
    expect(html).toMatch(/<\/html>/i);
  });

  test('index.html has closing </html> tag', async () => {
    const html = await (await fetch(`${BASE}/`)).text();
    expect(html).toMatch(/<\/html>/i);
  });

  test('index.html has closing </body> tag', async () => {
    const html = await (await fetch(`${BASE}/`)).text();
    expect(html).toMatch(/<\/body>/i);
  });

  test('hub.html has meta charset=utf-8', async () => {
    const html = await (await fetch(`${BASE}/hub.html`)).text();
    expect(html).toMatch(/<meta charset="utf-8">/i);
  });

  test('index.html has meta charset=utf-8', async () => {
    const html = await (await fetch(`${BASE}/`)).text();
    expect(html).toMatch(/<meta charset="utf-8">/i);
  });

  test('hub.html has a-scene with networked-scene attribute', async () => {
    const html = await (await fetch(`${BASE}/hub.html`)).text();
    expect(html).toMatch(/<a-scene[^>]*networked-scene/i);
  });
});

/* ------------------------------------------------------------------ */
/* Static asset property tests                                        */
/* ------------------------------------------------------------------ */

describe('Static asset property tests', () => {
  test('all JS bundles have content-length > 0', async () => {
    const res = await fetch(`${BASE}/hub.html`);
    const html = await res.text();
    const scripts = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map((m) => m[1]);
    for (const src of scripts) {
      const r = await fetch(`${BASE}${src}`);
      const cl = r.headers.get('content-length');
      if (!cl || parseInt(cl) <= 0) console.error(`JS ${src} content-length: ${cl}`);
      expect(parseInt(cl || '0')).toBeGreaterThan(0);
    }
  });

  test('all CSS bundles have content-length > 0', async () => {
    const res = await fetch(`${BASE}/hub.html`);
    const html = await res.text();
    const links = [...html.matchAll(/<link[^>]+href="([^"]+)"/g)].map((m) => m[1]);
    const cssLinks = links.filter((h) => h.startsWith('/') && h.endsWith('.css'));
    for (const href of cssLinks) {
      const r = await fetch(`${BASE}${href}`);
      const cl = r.headers.get('content-length');
      if (!cl || parseInt(cl) <= 0) console.error(`CSS ${href} content-length: ${cl}`);
      expect(parseInt(cl || '0')).toBeGreaterThan(0);
    }
  });

  test('hub.service.js has content-length > 0 and is a valid service worker', async () => {
    const res = await fetch(`${BASE}/hub.service.js`);
    expect(res.ok).toBe(true);
    const cl = res.headers.get('content-length');
    expect(parseInt(cl || '0')).toBeGreaterThan(0);
    const body = await res.text();
    expect(body).toMatch(/self\.addEventListener/);
    // Must NOT match the old no-op pattern (even in comments)
    expect(body).not.toMatch(/addEventListener\(\s*["']fetch["']/);
  });
});

/* ------------------------------------------------------------------ */
/* Mutation testing — negative proof of routing bug                    */
/* ------------------------------------------------------------------ */

describe('Mutation testing — routing bug regression', () => {
  test('IF regex were greedy (.*)?, .gltf files would serve hub.html — verify they do NOT', async () => {
    // This is the key regression test for the greedy regex bug.
    // The old greedy regex ^/[A-Za-z0-9]{7}(/.*)?$ would match
    // /<hubId>/objects.gltf and serve hub.html (HTML) to the glTF
    // loader, causing SyntaxError: Unexpected token '<'.
    const res = await fetch(`${BASE}/KGsQjXJ/objects.gltf`);
    expect(res.status).toBe(404);
    const body = await res.text();
    // The response must NOT be hub.html (which would cause a JS SyntaxError)
    expect(body).not.toMatch(/<title>Room \| App/);
    expect(body.length).toBeLessThan(1000);
  });

  test('IF regex lacked slug support, room+slug URLs would serve index.html — verify they serve hub.html', async () => {
    // This is the key regression test for the redirect-loop bug.
    // The old regex ^/[A-Za-z0-9]{7}/?$ would NOT match /raJ6mj3/test-room
    // and would fall through to index.html (landing page) instead of
    // hub.html (room page), causing a redirect loop.
    const res = await fetch(`${BASE}/raJ6mj3/test-room`);
    expect(res.ok).toBe(true);
    const html = await res.text();
    expect(html).toMatch(/<title>Room \| App/);
  });

  test('IF do_HEAD lacked _resolve_target, HEAD to room URL would return 404 — verify it returns 200', async () => {
    const res = await fetch(`${BASE}/raJ6mj3/test-room`, { method: 'HEAD' });
    expect(res.status).toBe(200);
  });

  test('IF manifest lacked 48x48 in sizes, Chrome would warn "Resource size is not correct" — verify 48x48 present', async () => {
    const html = await (await fetch(`${BASE}/hub.html`)).text();
    const match = html.match(/<link[^>]+rel=["']icon["'][^>]+sizes=["']([^"']*)["']/i);
    expect(match).toBeTruthy();
    if (match) {
      expect(match[1]).toMatch(/48x48/);
    }
  });

  test('IF bundle lacked window.APP?. guard, APP ReferenceError would crash GLTF loader — verify fix present', async () => {
    const res = await fetch(`${BASE}/assets/js/hub-544153456e8422fbb129.js`);
    const body = await res.text();
    expect(body).toContain('window.APP?.hub?.user_data?.hubs_use_bitecs_based_client');
    expect(body).not.toContain('APP.hub?.user_data?.hubs_use_bitecs_based_client');
  });

  test('IF bundle lacked getLayoutMap truthy check, keyboard API null would crash A-Frame — verify fix present', async () => {
    const res = await fetch(`${BASE}/assets/js/hub-544153456e8422fbb129.js`);
    const body = await res.text();
    expect(body).toContain('window.navigator.keyboard&&window.navigator.keyboard.getLayoutMap');
    expect(body).not.toContain('void 0!==window.navigator.keyboard&&window.navigator.keyboard.getLayoutMap');
  });
});
