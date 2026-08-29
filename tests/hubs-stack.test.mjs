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
