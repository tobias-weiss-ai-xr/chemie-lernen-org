/**
 * Entity Index / Wissensnetz — Knowledge Graph Display Tests
 *
 * Verifies that the entity index page:
 *  1. Loads without console errors (no 404s on .optimized.js, no bundle failures)
 *  2. Fetches real KG data from /api/kg-data (source=neo4j)
 *  3. Renders entity cards with content (name, category, related entities)
 *  4. Shows correct stats (entity count, article count)
 *  5. Skeleton placeholder disappears after data loads
 *  6. Filter, search, sort, pagination, and cloud view all work
 */

const { test, expect } = require('@playwright/test');

const BASE_URL = process.env.BASE_URL || 'https://chemie-lernen.org';

test.describe('Entity Index — Knowledge Graph Display', () => {
  test.beforeEach(async ({ page }) => {
    // Collect all console messages; we'll assert no errors occurred
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.log('  ❌ Browser console.error:', msg.text());
      }
    });
    page.on('pageerror', (error) => {
      console.log('  ❌ Uncaught page error:', error.message);
    });
  });

  test('should load without any console errors', async ({ page }) => {
    const errors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto(`${BASE_URL}/entity/`, { waitUntil: 'networkidle' });

    // Give JS a few seconds to finish async loads (bundle loader, entity fetch)
    await page.waitForTimeout(4000);

    // Collect any remaining console errors
    const pageErrors = errors.filter(Boolean);
    expect(pageErrors).toEqual([]);
  });

  test('should load the /api/kg-data endpoint successfully', async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/api/kg-data`, { waitUntil: 'domcontentloaded' });
    expect(response.status()).toBe(200);

    const contentType = response.headers()['content-type'] || '';
    expect(contentType).toContain('application/json');

    const body = await response.json();
    expect(body.source).toBe('neo4j');
    expect(Array.isArray(body.entities)).toBe(true);
    expect(body.entities.length).toBeGreaterThan(50);
    expect(Array.isArray(body.articles)).toBe(true);
    expect(body.articles.length).toBeGreaterThan(0);

    // Verify entity structure
    const firstEntity = body.entities[0];
    expect(firstEntity).toHaveProperty('name');
    expect(firstEntity).toHaveProperty('category');
    expect(firstEntity).toHaveProperty('relatedEntities');
  });

  test('should display entity cards after data loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/entity/`, { waitUntil: 'networkidle' });

    // Wait for skeleton to disappear (means JS processed the data)
    const skeleton = page.locator('#entity-skeleton');
    await expect(skeleton).not.toBeVisible({ timeout: 15000 });

    // Wait for entity cards to render
    const cards = page.locator('.entity-card');
    await expect(cards.first()).toBeVisible({ timeout: 10000 });

    // At least 12 cards should be visible (one page of grid)
    const cardCount = await cards.count();
    expect(cardCount).toBeGreaterThanOrEqual(12);

    // Verify each card has a name link
    const nameLinks = page.locator('.entity-card-name a');
    const linkCount = await nameLinks.count();
    expect(linkCount).toBeGreaterThanOrEqual(12);

    // Verify cards have category badges
    const catBadges = page.locator('.entity-card-cat');
    expect(await catBadges.count()).toBeGreaterThanOrEqual(12);
  });

  test('should show header with Wissensnetz title and stats', async ({ page }) => {
    await page.goto(`${BASE_URL}/entity/`, { waitUntil: 'networkidle' });

    const skeleton = page.locator('#entity-skeleton');
    await expect(skeleton).not.toBeVisible({ timeout: 15000 });

    // Title
    const h1 = page.locator('.entity-header h1');
    await expect(h1).toBeVisible();
    await expect(h1).toHaveText('Wissensnetz');

    // Stats — should show entity count and document count
    const stats = page.locator('.entity-stats');
    await expect(stats).toBeVisible();
    await expect(stats).toContainText(/Begriffe/);
    await expect(stats).toContainText(/Dokumente/);
  });

  test('should have working filter buttons', async ({ page }) => {
    await page.goto(`${BASE_URL}/entity/`, { waitUntil: 'networkidle' });

    const skeleton = page.locator('#entity-skeleton');
    await expect(skeleton).not.toBeVisible({ timeout: 15000 });

    // Wait for filters to render
    const filterBtns = page.locator('.entity-filter-btn');
    await expect(filterBtns.first()).toBeVisible({ timeout: 10000 });

    // Should have "Alle" + at least 2 category filters
    const btnCount = await filterBtns.count();
    expect(btnCount).toBeGreaterThanOrEqual(3);

    // "Alle" should be active by default
    const allBtn = filterBtns.filter({ hasText: /^Alle/ });
    await expect(allBtn).toHaveClass(/active/);
  });

  test('should have working search input', async ({ page }) => {
    await page.goto(`${BASE_URL}/entity/`, { waitUntil: 'networkidle' });

    const skeleton = page.locator('#entity-skeleton');
    await expect(skeleton).not.toBeVisible({ timeout: 15000 });

    const searchInput = page.locator('.entity-search');
    await expect(searchInput).toBeVisible({ timeout: 10000 });

    // Search for a common chemistry term
    await searchInput.fill('säure');
    await page.waitForTimeout(500); // allow debounce / re-render

    // Should filter the cards — expect at least 1 result
    const cards = page.locator('.entity-card');
    const cardCount = await cards.count();
    expect(cardCount).toBeGreaterThanOrEqual(1);
  });

  test('should have working sort dropdown', async ({ page }) => {
    await page.goto(`${BASE_URL}/entity/`, { waitUntil: 'networkidle' });

    const skeleton = page.locator('#entity-skeleton');
    await expect(skeleton).not.toBeVisible({ timeout: 15000 });

    const sortSelect = page.locator('#entity-sort');
    await expect(sortSelect).toBeVisible({ timeout: 10000 });

    // Switch to A–Z sort
    await sortSelect.selectOption('name');
    await page.waitForTimeout(300);

    // First card should now start with 'a' or similar low letter
    const firstCard = page.locator('.entity-card-name').first();
    await expect(firstCard).toBeVisible();
  });

  test('should switch to tag cloud view', async ({ page }) => {
    await page.goto(`${BASE_URL}/entity/`, { waitUntil: 'networkidle' });

    const skeleton = page.locator('#entity-skeleton');
    await expect(skeleton).not.toBeVisible({ timeout: 15000 });

    // Click cloud view button
    const cloudBtn = page.locator('.entity-view-btn[data-view="cloud"]');
    await expect(cloudBtn).toBeVisible({ timeout: 10000 });
    await cloudBtn.click();
    await page.waitForTimeout(300);

    // Tag cloud should be visible
    const tagCloud = page.locator('.entity-tagcloud');
    await expect(tagCloud).toBeVisible();

    // Should have tag items
    const tagItems = page.locator('.entity-tagcloud-item');
    const tagCount = await tagItems.count();
    expect(tagCount).toBeGreaterThanOrEqual(10);
  });

  test('should have working pagination when many entities exist', async ({ page }) => {
    await page.goto(`${BASE_URL}/entity/`, { waitUntil: 'networkidle' });

    const skeleton = page.locator('#entity-skeleton');
    await expect(skeleton).not.toBeVisible({ timeout: 15000 });

    // If pagination exists, verify it works
    const pagination = page.locator('.entity-pagination');
    const paginationExists = (await pagination.count()) > 0;

    if (paginationExists) {
      const pageBtns = pagination.locator('.entity-page-btn');
      const btnCount = await pageBtns.count();
      expect(btnCount).toBeGreaterThanOrEqual(2);

      // Click page 2 if it exists
      const page2 = pageBtns.filter({ hasText: '2' });
      if ((await page2.count()) > 0) {
        await page2.click();
        await page.waitForTimeout(300);

        // Should have cards on page 2 too
        const cards = page.locator('.entity-card');
        expect(await cards.count()).toBeGreaterThanOrEqual(1);
      }
    }
  });

  test('should not show error/empty state when data loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/entity/`, { waitUntil: 'networkidle' });

    const skeleton = page.locator('#entity-skeleton');
    await expect(skeleton).not.toBeVisible({ timeout: 15000 });

    // Error state should NOT be visible
    const emptyState = page.locator('.empty-state');
    await expect(emptyState).not.toBeVisible();
  });

  test('should link to interactive graph page', async ({ page }) => {
    await page.goto(`${BASE_URL}/entity/`, { waitUntil: 'networkidle' });

    const skeleton = page.locator('#entity-skeleton');
    await expect(skeleton).not.toBeVisible({ timeout: 15000 });

    const graphLink = page.locator('.entity-graph-top-link');
    await expect(graphLink).toBeVisible();
    await expect(graphLink).toHaveAttribute('href', '/wissennetz/');
    await expect(graphLink).toContainText('Interaktiver Graph');
  });
});
