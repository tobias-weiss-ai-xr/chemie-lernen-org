// E2E test: Hubs (hubs.chemie-lernen.org) integration on chemie-lernen.org
//
// Covers the full promotion → hubs-instance surface:
//   A. On-site promotion (home widget, nav entry, footer link, concept page)
//   B. The Hubs instance itself (loads, title, create-room route, app shell)
//   C. Link integrity (every hubs.chemie-lernen.org link resolves)
//
// Runs against the live production site (BASE_URL, default chemie-lernen.org)
// — same as the other *.spec.js tests in this directory.

const { test, expect } = require('@playwright/test');

const BASE_URL = process.env.BASE_URL || 'https://chemie-lernen.org';
const HUBS_URL = 'https://hubs.chemie-lernen.org';

/* ──────────────────────────────────────────────────────────────
 * A. On-site promotion
 * ────────────────────────────────────────────────────────────── */

test.describe('Hubs promotion on chemie-lernen.org', () => {
  test('home page renders the Hubs promo widget', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    const card = page.locator('.hubs-promo-card');
    await expect(card).toBeVisible();
    await expect(page.locator('.hubs-promo-title')).toContainText(/gemeinsam in 3d lernen/i);
    // Three USP bullets (kein Account / Browser / DSGVO)
    const usps = page.locator('.hubs-promo-usps li');
    await expect(usps).toHaveCount(3);
  });

  test('promo widget cover SVG loads', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    const cover = page.locator('.hubs-promo-cover img');
    await expect(cover).toBeVisible();
    await expect(cover).toHaveAttribute('src', /hubs-lernraum-cover\.svg/);
    const resp = await cover.evaluate((el) =>
      fetch(el.src, { method: 'HEAD' }).then((r) => r.status)
    );
    expect(resp).toBeLessThan(400);
  });

  test('promo buttons link to hubs instance and concept page', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    const createBtn = page.locator('.hubs-btn-primary');
    await expect(createBtn).toHaveAttribute('href', `${HUBS_URL}/`);
    await expect(createBtn).toHaveAttribute('target', '_blank');
    await expect(createBtn).toHaveAttribute('rel', /noopener/);

    const moreBtn = page.locator('.hubs-btn-secondary');
    await expect(moreBtn).toHaveAttribute('href', /\/pages\/lernraeume-in-hubs\//);
  });

  test('nav contains the "Lernräume (3D)" entry', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    // The menu item renders with a stable aria-label (double-quoted), so we
    // target it directly rather than a broad nav-a filter that can match the
    // wrong anchor first.
    const navLink = page.locator('a[aria-label="Lernräume (3D)"]');
    // The item lives in a collapsed "Visualisierungen" dropdown (hidden until
    // hover/click) — that's expected Bootstrap behavior, not a wiring bug. We
    // assert it is attached + correctly linked rather than visible.
    await expect(navLink.first()).toBeAttached();
    await expect(navLink.first()).toHaveAttribute('href', /\/pages\/lernraeume-in-hubs\//);
  });

  test('footer links to the Hubs concept page', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    const footerLink = page.locator('footer a').filter({
      hasText: /Lernräume in Hubs/,
    });
    await expect(footerLink.first()).toHaveAttribute('href', /\/pages\/lernraeume-in-hubs\//);
  });

  test('concept page loads and promotes hubs', async ({ page }) => {
    await page.goto(`${BASE_URL}/pages/lernraeume-in-hubs/`, {
      waitUntil: 'domcontentloaded',
    });
    await expect(page).toHaveTitle(/Lernräume in Mozilla Hubs/i);
    const hubsLinks = page.locator(`a[href^="${HUBS_URL}"]`);
    expect(await hubsLinks.count()).toBeGreaterThan(0);
    // "Raum erstellen" CTA points at the instance root
    await expect(
      page
        .locator(`a[href="${HUBS_URL}/"]`)
        .filter({ hasText: /Raum erstellen/i })
        .first()
    ).toBeVisible();
  });
});

/* ──────────────────────────────────────────────────────────────
 * B. The Hubs instance itself
 * ────────────────────────────────────────────────────────────── */

test.describe('Hubs instance (hubs.chemie-lernen.org)', () => {
  test('root loads with the Chemie Lernen Hubs title', async ({ page }) => {
    const resp = await page.goto(HUBS_URL, { waitUntil: 'domcontentloaded' });
    expect(resp.status()).toBeLessThan(400);
    await expect(page).toHaveTitle(/Chemie Lernen Hubs/i);
  });

  test('create-room route (?new) is reachable', async ({ page }) => {
    const resp = await page.goto(`${HUBS_URL}/?new`, {
      waitUntil: 'domcontentloaded',
    });
    expect(resp.status()).toBeLessThan(400);
  });

  test('no fatal client-side errors on landing', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(HUBS_URL, { waitUntil: 'networkidle' });
    // Network hiccups from 3rd-party CDNs are tolerated; only page-crashing
    // JS errors fail the test.
    expect(errors).toEqual([]);
  });
});

/* ──────────────────────────────────────────────────────────────
 * C. Link integrity — every hubs link on the main site resolves
 * ────────────────────────────────────────────────────────────── */

test.describe('Hubs link integrity', () => {
  test('all hubs.chemie-lernen.org links on the concept page resolve', async ({
    page,
    request,
  }) => {
    await page.goto(`${BASE_URL}/pages/lernraeume-in-hubs/`, {
      waitUntil: 'domcontentloaded',
    });
    // Collect real href values via the DOM (links may use unquoted attrs).
    const hubsLinks = await page.$$eval('a', (as) => [
      ...new Set(
        as
          .map((a) => a.getAttribute('href') || '')
          .filter((h) => h.startsWith('https://hubs.chemie-lernen.org'))
      ),
    ]);
    expect(hubsLinks.length).toBeGreaterThan(0);
    for (const url of hubsLinks) {
      const r = await request.get(url);
      expect(r.status(), `link ${url}`).toBeLessThan(400);
    }
  });
});

/* ──────────────────────────────────────────────────────────────
 * D. Hubs PWA manifest + console health
 *    Regression guards for the console errors reported on
 *    hubs.chemie-lernen.org (manifest.webmanifest 404, uncaught errors).
 * ────────────────────────────────────────────────────────────── */

test.describe('Hubs PWA manifest', () => {
  test('serves a valid manifest.webmanifest (no 404)', async ({ request }) => {
    const resp = await request.get(`${HUBS_URL}/manifest.webmanifest`);
    expect(
      resp.status(),
      'hubs.chemie-lernen.org/manifest.webmanifest must return 200, not 404'
    ).toBe(200);
    const body = await resp.text();
    const manifest = JSON.parse(body);
    expect(manifest).toHaveProperty('name');
    expect(manifest).toHaveProperty('icons');
    expect(Array.isArray(manifest.icons)).toBe(true);
    expect(manifest.icons.length).toBeGreaterThanOrEqual(1);
  });

  test('landing page has no manifest.webmanifest 404 in console', async ({ page }) => {
    const manifestProblems = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error' && /manifest\.webmanifest/i.test(msg.text())) {
        manifestProblems.push(msg.text());
      }
    });
    page.on('requestfailed', (req) => {
      if (/manifest\.webmanifest/i.test(req.url())) {
        manifestProblems.push(`requestfailed: ${req.url()}`);
      }
    });
    page.on('response', (resp) => {
      if (/manifest\.webmanifest/i.test(resp.url()) && resp.status() >= 400) {
        manifestProblems.push(`HTTP ${resp.status()}: ${resp.url()}`);
      }
    });

    await page.goto(HUBS_URL, { waitUntil: 'networkidle' });
    expect(
      manifestProblems,
      `manifest.webmanifest problems:\n${manifestProblems.join('\n')}`
    ).toEqual([]);
  });

  test('a hubs room logs no manifest.webmanifest 404', async ({ page }) => {
    const problems = [];
    const collect = (text) => {
      if (/manifest\.webmanifest|uncaught/i.test(text)) problems.push(text);
    };
    page.on('console', (msg) => {
      if (msg.type() === 'error') collect(msg.text());
    });
    page.on('requestfailed', (req) => collect(`requestfailed: ${req.url()}`));
    page.on('response', (resp) => {
      if (resp.status() >= 400) collect(`HTTP ${resp.status()}: ${resp.url()}`);
    });

    const resp = await page.goto(`${HUBS_URL}/V9SecZz/wasserstoff-raum`, {
      waitUntil: 'domcontentloaded',
    });
    // Room may have been cleaned up; only assert when the page is reachable.
    if (resp && resp.status() < 400) {
      await page.waitForTimeout(4000);
      expect(problems, `manifest/uncaught problems on room page:\n${problems.join('\n')}`).toEqual(
        []
      );
    }
  });
});
