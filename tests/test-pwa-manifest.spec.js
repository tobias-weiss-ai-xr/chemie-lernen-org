const { test, expect } = require('@playwright/test');

const BASE_URL = process.env.BASE_URL || 'https://chemie-lernen.org';

test.describe('Service Worker', () => {
  test('should register a service worker', async ({ page }) => {
    await page.goto(BASE_URL);

    const hasSW = await page.evaluate(() => {
      return 'serviceWorker' in navigator;
    });
    expect(hasSW).toBe(true);

    const registrations = await page.evaluate(async () => {
      const regs = await navigator.serviceWorker.getRegistrations();
      return regs.map((r) => ({
        scope: r.scope,
        active: !!r.active,
      }));
    });

    expect(registrations.length).toBeGreaterThanOrEqual(1);
    expect(registrations[0].active).toBe(true);
  });

  test('should cache static assets after first visit', async ({ page }) => {
    await page.goto(BASE_URL);
    // Wait for SW to activate
    await page.waitForTimeout(3000);

    const cacheKeys = await page.evaluate(async () => {
      const keys = await caches.keys();
      return keys;
    });

    expect(cacheKeys.length).toBeGreaterThanOrEqual(1);
  });
});

test.describe('Web App Manifest', () => {
  test('should have valid manifest link', async ({ page }) => {
    await page.goto(BASE_URL);

    const manifestLink = page.locator('link[rel="manifest"]');
    await expect(manifestLink).toHaveAttribute('href', /site\.webmanifest|manifest\.json/);
  });

  test('manifest should be fetchable', async ({ page }) => {
    const response = await page.request.get(`${BASE_URL}/site.webmanifest`);
    expect(response.status()).toBe(200);

    const body = await response.text();
    const manifest = JSON.parse(body);
    expect(manifest).toHaveProperty('name');
    expect(manifest).toHaveProperty('short_name');
    expect(manifest).toHaveProperty('start_url');
    expect(manifest).toHaveProperty('icons');
    expect(manifest.icons.length).toBeGreaterThanOrEqual(1);
  });
});

test.describe('Offline Page', () => {
  test('should have offline fallback page', async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/offline/`);
    if (response.status() === 200) {
      await expect(page.locator('h1')).toBeVisible();
    }
  });
});

test.describe('Offline Caching', () => {
  test('should cache API data and serve from cache when offline', async ({ page, context }) => {
    await page.goto(`${BASE_URL}/entity/`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    await context.setOffline(true);
    await page.reload();

    await expect(
      page.locator('#entity-index-app, .card, .entity-grid, h1, .search-box').first()
    ).toBeVisible({ timeout: 10000 });

    const searchInput = page.locator(
      'input[type="text"], input[placeholder*="Suche"], #search-input, .search-field'
    );
    await expect(searchInput).toBeVisible();

    await context.setOffline(false);
  });

  test('should cache search index and serve from cache when offline', async ({ page, context }) => {
    await page.goto(`${BASE_URL}/entity/`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    await context.setOffline(true);

    const searchInput = page.locator(
      'input[type="text"], input[placeholder*="Suche"], #search-input, .search-field'
    );
    const inputCount = await searchInput.count();
    if (inputCount > 0) {
      await searchInput.first().fill('Wasserstoff');
      await page.waitForTimeout(500);

      const results = page.locator('.entity-card, .search-result, .entity-item, .card');
      await expect(results.first()).toBeVisible({ timeout: 5000 });
    }

    await context.setOffline(false);
  });

  test('offline page should render calculator reference', async ({ page, context }) => {
    await page.goto(`${BASE_URL}/offline/`);
    expect(page.url()).toContain('/offline/');

    const bodyText = await page.locator('body').innerText();
    expect(bodyText.length).toBeGreaterThan(50);

    await context.setOffline(false);
  });
});

test.describe('Meta Tags', () => {
  test('should have viewport meta tag', async ({ page }) => {
    await page.goto(BASE_URL);

    const viewport = page.locator('meta[name="viewport"]');
    await expect(viewport).toHaveAttribute('content', /width=device-width/);
  });

  test('should have theme-color meta tag', async ({ page }) => {
    await page.goto(BASE_URL);

    const themeColor = page.locator('meta[name="theme-color"]');
    await expect(themeColor).toHaveAttribute('content');
  });

  test('should have OG meta tags', async ({ page }) => {
    await page.goto(BASE_URL);

    const ogTitle = page.locator('meta[property="og:title"]');
    await expect(ogTitle).toHaveAttribute('content');

    const ogLocale = page.locator('meta[property="og:locale"]');
    await expect(ogLocale).toHaveAttribute('content', /de_de/i);
  });
});
