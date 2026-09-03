// E2E test: 3D periodic-table rooms integration on chemie-lernen.org
//
// Covers the promotion → 3D-rooms surface after the 2026-09 refactor:
//   A. On-site promotion (home widget, nav entry, footer link)
//   B. Element-rooms directory (/chemie-raeume/) — manifest-driven tiles
//   C. Deprecation notices on the archived Hubs pages (instance stays up,
//      but is no longer advertised)
//   D. External link integrity (GitHub Pages periodic table + sample rooms)
//
// Runs against the live production site (BASE_URL, default chemie-lernen.org)
// — same as the other *.spec.js tests in this directory.

const { test, expect } = require('@playwright/test');

const BASE_URL = process.env.BASE_URL || 'https://chemie-lernen.org';
const PT_URL = 'https://tobias-weiss-ai-xr.github.io/periodic-table';

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

  test('promo buttons link to the periodic table and the rooms directory', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    const primary = page.locator('.pt-btn-primary');
    await expect(primary).toHaveAttribute('href', `${PT_URL}/`);
    await expect(primary).toHaveAttribute('target', '_blank');
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
 * B. Element-rooms directory (/chemie-raeume/)
 * ────────────────────────────────────────────────────────────── */

test.describe('Element-rooms directory', () => {
  test('renders manifest-driven tiles deep-linking into the periodic table', async ({ page }) => {
    await page.goto(`${BASE_URL}/chemie-raeume/`, { waitUntil: 'domcontentloaded' });
    // Wait for the client-side manifest fetch + render
    const tiles = page.locator('#chemie-raeume-grid a.cr-tile');
    await expect(tiles.first()).toBeVisible({ timeout: 15000 });
    const count = await tiles.count();
    expect(count).toBeGreaterThanOrEqual(118);

    // First tile deep-links into a per-element room on GitHub Pages
    const firstHref = await tiles.first().getAttribute('href');
    expect(firstHref).toMatch(
      new RegExp(`^${PT_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/rooms/\\d{3}-[a-z-]+\\.html$`)
    );
    await expect(tiles.first()).toHaveAttribute('target', '_blank');
  });

  test('directory page contains no hubs.chemie-lernen.org links', async ({ page }) => {
    await page.goto(`${BASE_URL}/chemie-raeume/`, { waitUntil: 'domcontentloaded' });
    await page.locator('#chemie-raeume-grid a.cr-tile').first().waitFor({ timeout: 15000 });
    const hubsLinks = page.locator('a[href*="hubs.chemie-lernen.org"]');
    await expect(hubsLinks).toHaveCount(0);
  });
});

/* ──────────────────────────────────────────────────────────────
 * C. Deprecation notices on archived Hubs pages
 * ────────────────────────────────────────────────────────────── */

test.describe('Hubs deprecation notices', () => {
  test('concept page shows the status notice and points to the new surface', async ({ page }) => {
    await page.goto(`${BASE_URL}/pages/lernraeume-in-hubs/`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText(/nicht mehr aktiv beworben/i);
    const newLink = page.locator('a[href*="tobias-weiss-ai-xr.github.io/periodic-table"]');
    await expect(newLink.first()).toBeVisible();
  });

  test('guides index shows the status notice', async ({ page }) => {
    await page.goto(`${BASE_URL}/guides/`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText(/nicht mehr aktiv beworben/i);
  });
});

/* ──────────────────────────────────────────────────────────────
 * D. External link integrity (GitHub Pages periodic table)
 * ────────────────────────────────────────────────────────────── */

test.describe('Periodic table link integrity', () => {
  test('the periodic table room loads', async ({ page }) => {
    await page.goto(PT_URL, { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveTitle(/periodic table room/i);
  });

  test('sample per-element rooms resolve', async ({ request }) => {
    for (const room of ['001-hydrogen', '026-iron', '055-cesium', '118-oganesson']) {
      const resp = await request.get(`${PT_URL}/rooms/${room}.html`);
      expect(resp.status(), room).toBeLessThan(400);
    }
  });
});
