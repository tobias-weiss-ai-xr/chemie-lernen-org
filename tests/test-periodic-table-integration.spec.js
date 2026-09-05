// E2E test: self-hosted 3D periodic table (PSE) on chemie-lernen.org
//
// Covers the 2026-09 self-hosting architecture:
//   A. On-site promotion (home widget, nav entry, footer link)
//   B. /chemie-raeume/ — the 3D PSE app is embedded DIRECTLY (no client-side
//      tile grid, no GitHub Pages dependency)
//   C. Interactive runtime: WebGL init, RPRoom debug API, search, panel,
//      room navigation (headless via SwiftShader)
//   D. Deprecation notices on the archived Hubs pages
//   E. Link integrity — everything LOCAL: /periodic-table/, rooms, assets
//
// Runs against the live production site (BASE_URL, default chemie-lernen.org).

const { test, expect } = require('@playwright/test');

const BASE_URL = process.env.BASE_URL || 'https://chemie-lernen.org';
const PT = `${BASE_URL}/periodic-table`;

// Headless chromium only ships WebGL through SwiftShader, and newer Chrome
// builds require an explicit opt-in flag for the software rasterizer.
test.use({
  launchOptions: {
    args: ['--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader'],
  },
});

/** Collect page errors + console errors (favicon noise filtered). */
function collectErrors(page) {
  const errors = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e}`));
  page.on('console', (m) => {
    if (m.type() === 'error' && !/favicon/i.test(m.text())) errors.push(`console: ${m.text()}`);
  });
  return errors;
}

/* ──────────────────────────────────────────────────────────────
 * A. On-site promotion
 * ────────────────────────────────────────────────────────────── */

test.describe('Periodic-table promotion on chemie-lernen.org', () => {
  test('home page renders the periodic-table promo widget', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    const card = page.locator('.pt-promo-card');
    await expect(card).toBeVisible();
    await expect(page.locator('.pt-promo-title')).toContainText(/begehbarer 3d-raum/i);
    // Four USP bullets (kein Account / Browser / WebXR-VR / eigener Raum)
    const usps = page.locator('.pt-promo-usps li');
    await expect(usps).toHaveCount(4);
  });

  test('promo buttons link to the self-hosted periodic table and the rooms directory', async ({
    page,
  }) => {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    const primary = page.locator('.pt-btn-primary');
    // Self-hosted since 2026-09: no GitHub Pages dependency anymore.
    await expect(primary).toHaveAttribute('href', '/periodic-table/');
    await expect(primary).toHaveAttribute('rel', /noopener/);

    const secondary = page.locator('.pt-btn-secondary');
    await expect(secondary).toHaveAttribute('href', /\/chemie-raeume\//);
  });

  test('nav "Lernräume (3D)" points to the rooms directory', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    const navLink = page.locator('a[aria-label="Lernräume (3D)"]');
    await expect(navLink).toHaveCount(1);
    const href = await navLink.getAttribute('href');
    expect(href).toContain('/chemie-raeume/');
  });

  test('footer links to the rooms directory, not to Hubs', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    const footer = page.locator('footer');
    await expect(footer.locator('a[href="/chemie-raeume/"]')).toHaveCount(1);
    expect(await footer.locator('a[href*="hubs"]').count()).toBe(0);
  });

  test('home page contains no hubs.chemie-lernen.org links', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    const hubsLinks = page.locator('a[href*="hubs.chemie-lernen.org"]');
    await expect(hubsLinks).toHaveCount(0);
  });
});

/* ──────────────────────────────────────────────────────────────
 * B. /chemie-raeume/ — direct embed of the 3D PSE
 * ────────────────────────────────────────────────────────────── */

test.describe('Chemie-Räume embed', () => {
  test('embeds the 3D app with local importmap and fallback links', async ({ page }) => {
    await page.goto(`${BASE_URL}/chemie-raeume/`, { waitUntil: 'domcontentloaded' });

    // The PSE canvas is embedded directly on the page.
    await expect(page.locator('canvas#room')).toBeVisible();

    // The importmap resolves three.js LOCALLY (no CDN).
    const importmap = await page.locator('script[type="importmap"]').first().textContent();
    expect(importmap).toContain('/periodic-table/lib/three.module.js');
    expect(importmap).toContain('/periodic-table/lib/three/addons/');
    expect(importmap).not.toMatch(/https?:\/\//);

    // No external (GitHub Pages / Hubs) links anywhere on the page.
    await expect(page.locator('a[href*="github.io"]')).toHaveCount(0);
    await expect(page.locator('a[href*="hubs.chemie-lernen.org"]')).toHaveCount(0);

    // The <noscript> fallback still lists per-element room links.
    // (Several noscript blocks exist on the page — the room-link one is
    // not necessarily first, so assert that ANY of them carries the links.)
    const noscripts = page.locator('noscript');
    expect(await noscripts.count()).toBeGreaterThanOrEqual(1);
    const anyNoscriptHasRooms = await noscripts.evaluateAll((els) =>
      els.some((el) => el.textContent.includes('/periodic-table/rooms/'))
    );
    expect(anyNoscriptHasRooms).toBe(true);
  });

  test('room assets all resolve on the same origin', async ({ request }) => {
    for (const asset of [
      '/periodic-table/assets/app.js',
      '/periodic-table/assets/elements-data.js',
      '/periodic-table/assets/room.js',
      '/data/chemie-raeume-manifest.json',
      '/periodic-table/lib/three.module.js',
      '/periodic-table/lib/three/addons/controls/OrbitControls.js',
      '/periodic-table/lib/three/addons/libs/motion-controllers.module.js',
    ]) {
      const resp = await request.get(`${BASE_URL}${asset}`);
      expect(resp.status(), asset).toBeLessThan(400);
    }
  });
});

/* ──────────────────────────────────────────────────────────────
 * C. Interactive runtime (WebGL + RPRoom debug API)
 * ────────────────────────────────────────────────────────────── */

test.describe('PSE interactive runtime', () => {
  test('embed boots: WebGL init, RPRoom API, fps counter, no page errors', async ({ page }) => {
    test.setTimeout(90_000);
    const errors = collectErrors(page);
    await page.goto(`${BASE_URL}/chemie-raeume/`, { waitUntil: 'domcontentloaded' });

    // app.js hides #loading once the scene is built and starts the loop.
    await expect(page.locator('#loading')).toBeHidden({ timeout: 60_000 });

    // The debug/test API surfaces after full initialization.
    await expect
      .poll(() => page.evaluate(() => window.RPRoom?.elements ?? null), { timeout: 15_000 })
      .toBe(118);
    const api = await page.evaluate(() => ({
      nodes: window.RPRoom.nodes,
      matched: window.RPRoom.matchedCount(),
      idle: window.RPRoom.cameraIdle(),
      grid: window.RPRoom.grid(),
    }));
    expect(api.nodes).toBe(118);
    expect(api.matched).toBe(118);
    expect(api.idle).toBe(true);
    expect(api.grid.colW).toBeGreaterThan(0);

    // The render loop drives the fps counter.
    await expect
      .poll(() => page.locator('#fps').textContent(), { timeout: 20_000 })
      .toMatch(/\d+\s?fps/i);

    expect(errors).toEqual([]);
  });

  test('search focuses Gold: panel opens, selection + portal state update', async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto(`${BASE_URL}/chemie-raeume/`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#loading')).toBeHidden({ timeout: 60_000 });
    await expect
      .poll(() => page.evaluate(() => window.RPRoom?.elements ?? null), { timeout: 15_000 })
      .toBe(118);

    // Type "Gold" into the search box — exactly one match.
    const search = page.locator('#search-input');
    await search.fill('Gold');
    await expect(search).toHaveClass(/hit/);
    await expect
      .poll(() => page.evaluate(() => window.RPRoom.matchedCount()), { timeout: 10_000 })
      .toBe(1);

    // Enter focuses the element: selection, detail panel, info card.
    await search.press('Enter');
    await expect
      .poll(() => page.evaluate(() => window.RPRoom.selected()), { timeout: 10_000 })
      .toBe(79);
    await expect(page.locator('#panel')).toBeVisible();
    await expect(page.locator('#panel-body')).toContainText('Gold');

    // The room portal of the selected element becomes visible and projectable.
    const portal = await page.evaluate(() => ({
      visible: window.RPRoom.portalVisible(),
      screen: window.RPRoom.portalScreen(79),
      href: window.RPRoom.roomHref(79),
    }));
    expect(portal.visible).toBe(1);
    expect(portal.screen).not.toBeNull();
    expect(portal.href).toBe('rooms/079-gold.html');

    // Escape clears the search; the close button hides the panel.
    await search.press('Escape');
    await expect
      .poll(() => page.evaluate(() => window.RPRoom.matchedCount()), { timeout: 10_000 })
      .toBe(118);
    await page.locator('#panel-close').click();
    await expect(page.locator('#panel')).toBeHidden();
  });

  test('room pages boot: Gold room renders without errors', async ({ page }) => {
    test.setTimeout(90_000);
    const errors = collectErrors(page);
    await page.goto(`${PT}/rooms/079-gold.html`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('canvas#room')).toBeVisible();
    await expect(page.locator('#loading')).toBeHidden({ timeout: 60_000 });
    await expect(page.locator('#fps')).toContainText(/\d/i, { timeout: 20_000 });
    expect(errors).toEqual([]);
  });
});

/* ──────────────────────────────────────────────────────────────
 * D. Deprecation notices on archived Hubs pages
 * ────────────────────────────────────────────────────────────── */

test.describe('Hubs deprecation notices', () => {
  test('concept page shows the status notice and points to the local PSE', async ({ page }) => {
    await page.goto(`${BASE_URL}/pages/lernraeume-in-hubs/`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText(/nicht mehr aktiv beworben/i);
    await expect(page.locator('a[href="/periodic-table/"]').first()).toBeVisible();
  });

  test('guides index shows the status notice', async ({ page }) => {
    await page.goto(`${BASE_URL}/guides/`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText(/nicht mehr aktiv beworben/i);
  });
});

/* ──────────────────────────────────────────────────────────────
 * E. Link integrity — everything self-hosted now
 * ────────────────────────────────────────────────────────────── */

test.describe('Periodic table link integrity', () => {
  test('the self-hosted periodic table loads', async ({ page }) => {
    await page.goto(`${PT}/`, { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveTitle(/periodic table room/i);
    await expect(page.locator('canvas#room')).toBeVisible();
  });

  test('sample per-element rooms resolve locally', async ({ request }) => {
    for (const room of ['001-hydrogen', '026-iron', '055-cesium', '079-gold', '118-oganesson']) {
      const resp = await request.get(`${PT}/rooms/${room}.html`);
      expect(resp.status(), room).toBeLessThan(400);
    }
  });
});
