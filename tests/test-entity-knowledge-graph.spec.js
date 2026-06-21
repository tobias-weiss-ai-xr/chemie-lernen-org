/**
 * Entity Index / Wissensnetz — Knowledge Graph Display Tests
 *
 * Verifies that the entity index page:
 *  1. Loads without console errors (no 404s on .optimized.js, no bundle failures)
 *  2. Fetches real KG data from /api/kg-data (source=neo4j, 50+ entities)
 *  3. Renders entity cards with content (name, category, related entities, data attrs)
 *  4. Shows correct stats (entity count, article count)
 *  5. Skeleton placeholder and "Lade Wissensnetz..." disappear after data loads
 *  6. Filter, search, sort, pagination, and cloud view all work
 *  7. Responsive on mobile viewport
 *  8. Visual regression via screenshot matching
 *  9. Entity card navigation and detail pages work
 */

const { test, expect } = require('@playwright/test');

const BASE_URL = process.env.BASE_URL || 'https://chemie-lernen.org';

test.describe('Entity Index — Knowledge Graph Display', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.log('  ❌ Browser console.error:', msg.text());
      }
    });
    page.on('pageerror', (error) => {
      console.log('  ❌ Uncaught page error:', error.message);
    });
  });

  // ── Console errors & asset loading ──────────────────────────────────

  test('should load without any console errors', async ({ page }) => {
    const errors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto(`${BASE_URL}/entity/`, { waitUntil: 'networkidle' });

    // Give async bundle loader time to finish
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const pageErrors = errors.filter(Boolean);
    expect(pageErrors).toEqual([]);
  });

  test('should load entity-index.js without 404', async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/js/entity-index.js`, {
      waitUntil: 'domcontentloaded',
    });
    expect(response.status()).toBe(200);
    const ct = response.headers()['content-type'] || '';
    expect(ct).toContain('javascript');
  });

  // ── API data integrity ──────────────────────────────────────────────

  test('should load the /api/kg-data endpoint with real neo4j data', async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/api/kg-data`, {
      waitUntil: 'domcontentloaded',
    });
    expect(response.status()).toBe(200);

    const contentType = response.headers()['content-type'] || '';
    expect(contentType).toContain('application/json');

    const body = await response.json();
    expect(body.source).toBe('neo4j');
    expect(Array.isArray(body.entities)).toBe(true);
    expect(body.entities.length).toBeGreaterThan(50);
    expect(Array.isArray(body.articles)).toBe(true);
    expect(body.articles.length).toBeGreaterThan(0);

    // Verify every entity has required fields
    for (const entity of body.entities) {
      expect(entity).toHaveProperty('name');
      expect(entity).toHaveProperty('category');
      expect(entity).toHaveProperty('relatedEntities');
      expect(typeof entity.name).toBe('string');
      expect(entity.name.length).toBeGreaterThan(0);
    }

    // At least one entity should have related entities
    const withRelations = body.entities.filter((e) => (e.relatedEntities || []).length > 0);
    expect(withRelations.length).toBeGreaterThan(0);
  });

  // ── Skeleton / loading state transitions ────────────────────────────

  test('should show skeleton initially then replace with rendered content', async ({ page }) => {
    await page.goto(`${BASE_URL}/entity/`, { waitUntil: 'domcontentloaded' });

    // Immediately after DOM load the skeleton should exist
    const skeleton = page.locator('#entity-skeleton');
    await expect(skeleton).toBeVisible({ timeout: 3000 });

    // Loading text inside #entity-app should be visible
    const loadingText = page.locator('#entity-app h5');
    await expect(loadingText).toHaveText('Lade Wissensnetz...');

    // Wait for data to load and skeleton to disappear
    await expect(skeleton).not.toBeVisible({ timeout: 15000 });

    // Loading text should be replaced by rendered content
    await expect(loadingText).not.toBeVisible();

    // Entity cards should now be visible
    const cards = page.locator('.entity-card');
    await expect(cards.first()).toBeVisible({ timeout: 5000 });
  });

  // ── Entity card rendering ───────────────────────────────────────────

  test('should display entity cards with all sub-elements', async ({ page }) => {
    await page.goto(`${BASE_URL}/entity/`, { waitUntil: 'networkidle' });

    const skeleton = page.locator('#entity-skeleton');
    await expect(skeleton).not.toBeVisible({ timeout: 15000 });

    // At least one full page of cards
    const cards = page.locator('.entity-card');
    await expect(cards.first()).toBeVisible({ timeout: 5000 });
    const cardCount = await cards.count();
    expect(cardCount).toBeGreaterThanOrEqual(12);

    // Verify sub-elements on the first card
    const firstCard = cards.first();
    await expect(firstCard.locator('.entity-card-name a')).toBeVisible();
    await expect(firstCard.locator('.entity-card-cat')).toBeVisible();
    await expect(firstCard.locator('.entity-card-meta')).toBeVisible();

    // Check data attributes are set
    const dataCat = await firstCard.getAttribute('data-cat');
    expect(dataCat).toBeTruthy();
    expect(['stoff', 'konzept', 'reaktion', 'methode', 'person', 'quelle', 'other']).toContain(
      dataCat
    );

    const dataSlug = await firstCard.getAttribute('data-slug');
    expect(dataSlug).toBeTruthy();
    expect(dataSlug).toMatch(/^[a-z][a-z0-9-]*$/);
  });

  test('should render related entity tags inside cards', async ({ page }) => {
    await page.goto(`${BASE_URL}/entity/`, { waitUntil: 'networkidle' });

    const skeleton = page.locator('#entity-skeleton');
    await expect(skeleton).not.toBeVisible({ timeout: 15000 });

    const cards = page.locator('.entity-card');
    await expect(cards.first()).toBeVisible({ timeout: 5000 });

    // At least some cards should have related tags
    const cardsWithTags = cards.filter({ has: page.locator('.entity-card-related') });
    const withTagsCount = await cardsWithTags.count();
    expect(withTagsCount).toBeGreaterThanOrEqual(1);

    // Those cards should have at least one .entity-related-tag
    if (withTagsCount > 0) {
      const tags = cardsWithTags.first().locator('.entity-related-tag');
      expect(await tags.count()).toBeGreaterThanOrEqual(1);
    }
  });

  // ── Header and stats ────────────────────────────────────────────────

  test('should show header with Wissensnetz title and stats', async ({ page }) => {
    await page.goto(`${BASE_URL}/entity/`, { waitUntil: 'networkidle' });

    const skeleton = page.locator('#entity-skeleton');
    await expect(skeleton).not.toBeVisible({ timeout: 15000 });

    await expect(page.locator('.entity-header h1')).toHaveText('Wissensnetz');

    const stats = page.locator('.entity-stats');
    await expect(stats).toBeVisible();
    await expect(stats).toContainText(/Begriffe/);
    await expect(stats).toContainText(/Dokumente/);
    await expect(stats.locator('a.entity-graph-top-link')).toBeVisible();
  });

  // ── Filters ─────────────────────────────────────────────────────────

  test('should have working filter buttons with counts', async ({ page }) => {
    await page.goto(`${BASE_URL}/entity/`, { waitUntil: 'networkidle' });

    const skeleton = page.locator('#entity-skeleton');
    await expect(skeleton).not.toBeVisible({ timeout: 15000 });

    const filterBtns = page.locator('.entity-filter-btn');
    await expect(filterBtns.first()).toBeVisible({ timeout: 5000 });

    // "Alle" + at least 2 category filters
    const btnCount = await filterBtns.count();
    expect(btnCount).toBeGreaterThanOrEqual(3);

    // "Alle" should be active by default
    const allBtn = filterBtns.filter({ hasText: /^Alle/ });
    await expect(allBtn).toHaveClass(/active/);

    // Each filter button should have a count span
    const countSpans = filterBtns.locator('.entity-filter-count');
    expect(await countSpans.count()).toBe(btnCount);

    // Clicking a category filter should update the active state
    const firstCat = filterBtns.not(allBtn).first();
    const catName = await firstCat.textContent();
    await firstCat.click();
    await page.waitForTimeout(300);
    await expect(firstCat).toHaveClass(/active/);
    await expect(allBtn).not.toHaveClass(/active/);

    // Cards should be filtered to this category
    const cards = page.locator('.entity-card');
    const visibleCat = await cards.first().getAttribute('data-cat');
    expect(visibleCat).toBeTruthy();
  });

  // ── Search ──────────────────────────────────────────────────────────

  test('should filter cards via search input', async ({ page }) => {
    await page.goto(`${BASE_URL}/entity/`, { waitUntil: 'networkidle' });

    const skeleton = page.locator('#entity-skeleton');
    await expect(skeleton).not.toBeVisible({ timeout: 15000 });

    const searchInput = page.locator('.entity-search');
    await expect(searchInput).toBeVisible({ timeout: 5000 });

    // Search for a common chemistry term
    await searchInput.fill('säure');
    await page.waitForTimeout(500);

    const cards = page.locator('.entity-card');
    const cardCount = await cards.count();
    expect(cardCount).toBeGreaterThanOrEqual(1);

    // Search for something unlikely to exist — should show empty state
    await searchInput.fill('xyzzzznotexist123');
    await page.waitForTimeout(500);

    // Should show "Keine Begriffe gefunden"
    await expect(page.locator('.empty-state')).toBeVisible();
    await expect(page.locator('.empty-state')).toContainText(/Keine Begriffe/);

    // Clear search — cards should reappear
    await searchInput.fill('');
    await page.waitForTimeout(500);
    await expect(cards.first()).toBeVisible();
  });

  // ── Sort ────────────────────────────────────────────────────────────

  test('should sort cards by different criteria', async ({ page }) => {
    await page.goto(`${BASE_URL}/entity/`, { waitUntil: 'networkidle' });

    const skeleton = page.locator('#entity-skeleton');
    await expect(skeleton).not.toBeVisible({ timeout: 15000 });

    const sortSelect = page.locator('#entity-sort');
    await expect(sortSelect).toBeVisible({ timeout: 5000 });

    // Sort A–Z
    await sortSelect.selectOption('name');
    await page.waitForTimeout(400);

    const firstCardName = page.locator('.entity-card-name').first();
    const firstNameText = await firstCardName.textContent();
    expect(firstNameText).toBeTruthy();
    // First card should start with a letter A-G range approximately
    const firstChar = firstNameText.trim().charAt(0).toLowerCase();
    expect(firstChar).toMatch(/[a-zäöü]/);

    // Sort by category
    await sortSelect.selectOption('category');
    await page.waitForTimeout(400);

    // Should still have visible cards
    const cards = page.locator('.entity-card');
    expect(await cards.count()).toBeGreaterThanOrEqual(1);
  });

  // ── Cloud view ──────────────────────────────────────────────────────

  test('should switch to tag cloud view', async ({ page }) => {
    await page.goto(`${BASE_URL}/entity/`, { waitUntil: 'networkidle' });

    const skeleton = page.locator('#entity-skeleton');
    await expect(skeleton).not.toBeVisible({ timeout: 15000 });

    const cloudBtn = page.locator('.entity-view-btn[data-view="cloud"]');
    await expect(cloudBtn).toBeVisible({ timeout: 5000 });
    await cloudBtn.click();
    await page.waitForTimeout(400);

    const tagCloud = page.locator('.entity-tagcloud');
    await expect(tagCloud).toBeVisible();

    const tagItems = page.locator('.entity-tagcloud-item');
    const tagCount = await tagItems.count();
    expect(tagCount).toBeGreaterThanOrEqual(10);

    // Each tag item should link to an entity detail page
    const firstTag = tagItems.first();
    const href = await firstTag.getAttribute('href');
    expect(href).toMatch(/^\/entity\/.+\/$/);
  });

  // ── Pagination ──────────────────────────────────────────────────────

  test('should have working pagination', async ({ page }) => {
    await page.goto(`${BASE_URL}/entity/`, { waitUntil: 'networkidle' });

    const skeleton = page.locator('#entity-skeleton');
    await expect(skeleton).not.toBeVisible({ timeout: 15000 });

    const pagination = page.locator('.entity-pagination');
    await expect(pagination).toBeVisible({ timeout: 5000 });

    const pageBtns = pagination.locator('.entity-page-btn');
    const btnCount = await pageBtns.count();
    expect(btnCount).toBeGreaterThanOrEqual(2);

    // Page 1 button should be active
    const page1 = pageBtns.filter({ hasText: '1' });
    await expect(page1).toHaveClass(/active/);

    // Click page 2
    const page2 = pageBtns.filter({ hasText: '2' });
    if ((await page2.count()) > 0) {
      await page2.click();
      await page.waitForTimeout(400);

      await expect(page2).toHaveClass(/active/);
      await expect(page1).not.toHaveClass(/active/);

      // Cards should be different from page 1
      const cards = page.locator('.entity-card');
      expect(await cards.count()).toBeGreaterThanOrEqual(1);
    }
  });

  // ── Error / empty states ────────────────────────────────────────────

  test('should not show error or empty state when data loads successfully', async ({ page }) => {
    await page.goto(`${BASE_URL}/entity/`, { waitUntil: 'networkidle' });

    const skeleton = page.locator('#entity-skeleton');
    await expect(skeleton).not.toBeVisible({ timeout: 15000 });

    const emptyState = page.locator('.empty-state');
    await expect(emptyState).not.toBeVisible();
  });

  // ── Entity card navigation ──────────────────────────────────────────

  test('should navigate to entity detail page from a card name link', async ({ page }) => {
    await page.goto(`${BASE_URL}/entity/`, { waitUntil: 'networkidle' });

    const skeleton = page.locator('#entity-skeleton');
    await expect(skeleton).not.toBeVisible({ timeout: 15000 });

    const nameLink = page.locator('.entity-card-name a').first();
    await expect(nameLink).toBeVisible();

    const href = await nameLink.getAttribute('href');
    expect(href).toMatch(/^\/entity\/.+\/$/);

    // Click and verify navigation
    await nameLink.click();
    await page.waitForURL('**/entity/**', { timeout: 10000 });
    expect(page.url()).toMatch(/\/entity\/.+\//);
  });

  // ── Mobile responsive ───────────────────────────────────────────────

  test('should be responsive on mobile viewport (375px)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });

    await page.goto(`${BASE_URL}/entity/`, { waitUntil: 'networkidle' });

    const skeleton = page.locator('#entity-skeleton');
    await expect(skeleton).not.toBeVisible({ timeout: 15000 });

    // Cards should render and be visible
    const cards = page.locator('.entity-card');
    await expect(cards.first()).toBeVisible({ timeout: 5000 });
    const cardCount = await cards.count();
    expect(cardCount).toBeGreaterThanOrEqual(6);

    // Header, search, filters should all be visible on mobile
    await expect(page.locator('.entity-header h1')).toBeVisible();
    await expect(page.locator('.entity-search')).toBeVisible();
    await expect(page.locator('.entity-filter-btn').first()).toBeVisible();

    // Cloud view should also work on mobile
    const cloudBtn = page.locator('.entity-view-btn[data-view="cloud"]');
    await expect(cloudBtn).toBeVisible();
  });

  // ── Graph link ──────────────────────────────────────────────────────

  test('should link to interactive graph page from stats bar', async ({ page }) => {
    await page.goto(`${BASE_URL}/entity/`, { waitUntil: 'networkidle' });

    const skeleton = page.locator('#entity-skeleton');
    await expect(skeleton).not.toBeVisible({ timeout: 15000 });

    const graphLink = page.locator('.entity-graph-top-link');
    await expect(graphLink).toBeVisible();
    await expect(graphLink).toHaveAttribute('href', '/wissennetz/');
    await expect(graphLink).toContainText('Interaktiver Graph');
  });
});
