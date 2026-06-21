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
 *  8. Entity card navigation and detail pages work
 *  9. Known chemistry entities are present in the rendered list
 */

const { test, expect } = require('@playwright/test');

const BASE_URL = process.env.BASE_URL || 'https://chemie-lernen.org';

/**
 * Navigate to /entity/ and wait for skeleton to disappear (KG data loaded).
 * Uses domcontentloaded + explicit element wait — avoids flakiness from networkidle.
 */
async function gotoAndWaitForKG(page, timeout) {
  timeout = timeout || 20000;
  await page.goto(`${BASE_URL}/entity/`, { waitUntil: 'domcontentloaded', timeout });
  const skeleton = page.locator('#entity-skeleton');
  // If skeleton is already hidden by the time we check, that's OK
  await expect(skeleton).not.toBeVisible({ timeout });
}

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

  test('should load entity-index.js without 404', async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/js/entity-index.js`, {
      waitUntil: 'domcontentloaded',
    });
    expect(response.status()).toBe(200);
    const ct = response.headers()['content-type'] || '';
    expect(ct).toContain('javascript');
  });

  test('should load without entity-related console errors', async ({ page }) => {
    const errors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto(`${BASE_URL}/entity/`, { waitUntil: 'domcontentloaded' });
    const skeleton = page.locator('#entity-skeleton');
    await expect(skeleton).not.toBeVisible({ timeout: 20000 });

    // Filter errors: ignore pre-existing issues unrelated to entity page
    const entityErrors = errors.filter((e) => {
      const lower = e.toLowerCase();
      // Ignore molekuel-studio errors (pre-existing, unrelated to entity page)
      if (lower.includes('molekuel-studio')) return false;
      // Ignore dark-mode/logo errors
      if (lower.includes('logo_dark') || lower.includes('dark-mode')) return false;
      return true;
    });

    expect(entityErrors).toEqual([]);
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

    // Log data shape for debugging
    console.log(
      `  📊 API data: ${body.entities.length} entities, ${body.articles.length} articles`
    );
  });

  // ── Skeleton / loading state transitions ────────────────────────────

  test('should show skeleton initially then replace with rendered content', async ({ page }) => {
    // Load just DOM first to catch skeleton in initial state
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
    await expect(loadingText).not.toBeVisible({ timeout: 5000 });

    // Entity cards should now be visible
    const cards = page.locator('.entity-card');
    await expect(cards.first()).toBeVisible({ timeout: 5000 });
  });

  // ── Entity card rendering ───────────────────────────────────────────

  test('should display entity cards with all sub-elements', async ({ page }) => {
    await gotoAndWaitForKG(page);

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
    await gotoAndWaitForKG(page);

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

  test('should render known chemistry entities from the knowledge graph', async ({ page }) => {
    await gotoAndWaitForKG(page);

    const cards = page.locator('.entity-card');
    await expect(cards.first()).toBeVisible({ timeout: 5000 });

    // Get all rendered entity names
    const entityNames = await cards.locator('.entity-card-name a').allTextContents();
    const namesLower = entityNames.map((n) => n.trim().toLowerCase());

    expect(namesLower.length).toBeGreaterThanOrEqual(12);

    // At least one of these common chemistry concepts should be in the KG
    const commonConcepts = [
      'säure',
      'base',
      'oxidat',
      'reduktion',
      'katalys',
      'wasserstoff',
      'sauerstoff',
      'kohlenstoff',
      'stickstoff',
      'ion',
      'elektron',
      'proton',
      'atom',
      'molekül',
      'reaktion',
    ];
    const found = commonConcepts.some((concept) =>
      namesLower.some((name) => name.includes(concept))
    );
    expect(found).toBe(true);

    console.log(
      `  📝 Rendered entities (${namesLower.length}): ${namesLower.slice(0, 5).join(', ')}...`
    );
  });

  // ── Header and stats ────────────────────────────────────────────────

  test('should show header with Wissensnetz title and stats', async ({ page }) => {
    await gotoAndWaitForKG(page);

    await expect(page.locator('.entity-header h1')).toHaveText('Wissensnetz');

    const stats = page.locator('.entity-stats');
    await expect(stats).toBeVisible();
    await expect(stats).toContainText(/Begriffe/);
    await expect(stats).toContainText(/Dokumente/);
    await expect(stats.locator('a.entity-graph-top-link')).toBeVisible();
  });

  // ── Filters ─────────────────────────────────────────────────────────

  test('should have working filter buttons with counts', async ({ page }) => {
    await gotoAndWaitForKG(page);

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
    console.log(`  🔘 Clicking filter: ${catName.trim()}`);
    await firstCat.click();
    await page.waitForTimeout(300);
    await expect(firstCat).toHaveClass(/active/);
    await expect(allBtn).not.toHaveClass(/active/);

    // Cards should be filtered to this category
    const cards = page.locator('.entity-card');
    // Wait for re-render to complete
    await expect(cards.first()).toBeVisible({ timeout: 5000 });
    const visibleCat = await cards.first().getAttribute('data-cat');
    expect(visibleCat).toBeTruthy();
  });

  // ── Search ──────────────────────────────────────────────────────────

  test('should filter cards via search input', async ({ page }) => {
    await gotoAndWaitForKG(page);

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
    await gotoAndWaitForKG(page);

    const sortSelect = page.locator('#entity-sort');
    await expect(sortSelect).toBeVisible({ timeout: 5000 });

    // Sort A–Z
    await sortSelect.selectOption('name');
    await page.waitForTimeout(400);

    const firstCardName = page.locator('.entity-card-name a').first();
    const firstNameText = await firstCardName.textContent();
    expect(firstNameText).toBeTruthy();
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
    await gotoAndWaitForKG(page);

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
    await gotoAndWaitForKG(page);

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

      // Cards should be visible on page 2
      const cards = page.locator('.entity-card');
      expect(await cards.count()).toBeGreaterThanOrEqual(1);
    }
  });

  // ── Error / empty states ────────────────────────────────────────────

  test('should not show error or empty state when data loads successfully', async ({ page }) => {
    await gotoAndWaitForKG(page);

    const emptyState = page.locator('.empty-state');
    await expect(emptyState).not.toBeVisible();
  });

  // ── Entity card navigation ──────────────────────────────────────────

  test('should navigate to entity detail page from a card name link', async ({ page }) => {
    await gotoAndWaitForKG(page);

    const nameLink = page.locator('.entity-card-name a').first();
    await expect(nameLink).toBeVisible();

    const href = await nameLink.getAttribute('href');
    expect(href).toMatch(/^\/entity\/.+\/$/);
    console.log(`  🔗 Clicking entity link: ${href}`);

    // Click and verify navigation
    await nameLink.click();
    await page.waitForURL('**/entity/**', { timeout: 10000 });
    expect(page.url()).toMatch(/\/entity\/.+\//);
  });

  // ── Mobile responsive ───────────────────────────────────────────────

  test('should be responsive on mobile viewport (375px)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await gotoAndWaitForKG(page);

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
    await gotoAndWaitForKG(page);

    const graphLink = page.locator('.entity-graph-top-link');
    await expect(graphLink).toBeVisible();
    await expect(graphLink).toHaveAttribute('href', '/wissennetz/');
    await expect(graphLink).toContainText('Interaktiver Graph');
  });
});
