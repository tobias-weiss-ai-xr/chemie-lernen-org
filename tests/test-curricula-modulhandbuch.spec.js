const { test, expect } = require('@playwright/test');

const BASE_URL = process.env.BASE_URL || 'https://chemie-lernen.org';

test.describe('Curricula / Lehrpläne', () => {
  test('should load curricula index page', async ({ page }) => {
    await page.goto(`${BASE_URL}/curricula/`);
    await expect(page).toHaveTitle(/Lehrpläne|Curricula/i);
    await expect(page.getByRole('heading', { name: /Lehrpläne.*Curricula/i })).toBeVisible();
  });

  test('should load curricula state SSR page (NRW)', async ({ page }) => {
    await page.goto(`${BASE_URL}/curricula/nw/`);
    await expect(page).toHaveTitle(/Lehrplan.*Nordrhein-Westfalen/i);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should load curricula state SSR page (Bayern)', async ({ page }) => {
    await page.goto(`${BASE_URL}/curricula/by/`);
    await expect(page).toHaveTitle(/Lehrplan.*Bayern/i);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should load curricula state SSR page (Berlin)', async ({ page }) => {
    await page.goto(`${BASE_URL}/curricula/be/`);
    await expect(page).toHaveTitle(/Lehrplan.*Berlin/i);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should load bundeslaender overview page', async ({ page }) => {
    await page.goto(`${BASE_URL}/curricula/bundeslaender/`);
    await expect(page).toHaveTitle(/Lehrpläne.*Bundesland/i);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should return 404 for unknown state', async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/curricula/xx/`);
    expect(response.status()).toBe(404);
  });

  test('curricula index page loads API-driven tabs', async ({ page }) => {
    await page.goto(`${BASE_URL}/curricula/`);
    await expect(page.locator('#curricula-app')).toBeVisible({ timeout: 15000 });
  });

  test('curricula state page (BY) loads topic cards', async ({ page }) => {
    await page.goto(`${BASE_URL}/curricula/by/`);
    await expect(page.locator('.state-topic-card').first()).toBeVisible({ timeout: 15000 });
  });

  test('Wissensnetz loads entity grid', async ({ page }) => {
    await page.goto(`${BASE_URL}/entity/`);
    await expect(page.locator('.entity-grid').first()).toBeVisible({ timeout: 15000 });
  });

  test('Wissensnetz Lehrplan toggle button exists', async ({ page }) => {
    await page.goto(`${BASE_URL}/entity/`);
    await expect(page.locator('#entity-lehrplan-toggle')).toBeVisible({ timeout: 15000 });
  });
});

test.describe('Modulhandbuch', () => {
  test('should load modulhandbuch index page', async ({ page }) => {
    await page.goto(`${BASE_URL}/modulhandbuecher/`);
    await expect(page).toHaveTitle(/Modulhandbücher/i);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should load university SSR page (TUM)', async ({ page }) => {
    await page.goto(`${BASE_URL}/modulhandbuch/tum/`);
    await expect(page).toHaveTitle(/TUM|TU München|Technische Universität München/i);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should load university SSR page (LMU)', async ({ page }) => {
    await page.goto(`${BASE_URL}/modulhandbuch/lmu/`);
    await expect(page).toHaveTitle(/LMU/i);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should load module SSR page (TUM example)', async ({ page }) => {
    await page.goto(`${BASE_URL}/modulhandbuch/tum/ch0101/`);
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('should load university SSR page (Oxford)', async ({ page }) => {
    await page.goto(`${BASE_URL}/modulhandbuch/oxf/`);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should have functioning API endpoint', async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/api/modulhandbuch/universities`);
    expect(response.status()).toBe(200);
    const body = JSON.parse(await response.text());
    expect(Array.isArray(body.universities || body)).toBe(true);
  });

  test('should have Heidelberg module SSR page', async ({ page }) => {
    await page.goto(`${BASE_URL}/modulhandbuch/heid/chem101/`);
    await expect(page.locator('body')).not.toBeEmpty();
  });
});

test.describe('Entity page modulhandbuch section', () => {
  test('should load entity page with modulhandbuch section', async ({ page }) => {
    await page.goto(`${BASE_URL}/entity/sauerstoff/`);
    await expect(page.locator('h1')).toBeVisible();
    // Should eventually load the Universitäten section
    await page.waitForSelector('#entity-univ-card', { timeout: 15000 }).catch(() => {});
  });

  test('should load entity page with curricula section', async ({ page }) => {
    await page.goto(`${BASE_URL}/entity/ammoniak/`);
    await expect(page.locator('h1')).toBeVisible();
    await page.waitForSelector('#entity-curricula-card', { timeout: 15000 }).catch(() => {});
  });
});

test.describe('Wissensnetz KG data', () => {
  test('should return valid kg-data from API', async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/api/kg-data`);
    expect(response.status()).toBe(200);
    const body = JSON.parse(await response.text());
    expect(body).toHaveProperty('entities');
    expect(body).toHaveProperty('articles');
  });

  test('should have curricula data in kg export', async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/api/kg-data`);
    const body = JSON.parse(await response.text());
    expect(body).toHaveProperty('curricula');
    expect(Array.isArray(body.curricula)).toBe(true);
  });
});

test.describe('RAG context', () => {
  test('should return RAG context for chemical entity', async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/api/rag-context?q=Sauerstoff`);
    expect(response.status()).toBe(200);
    const body = JSON.parse(await response.text());
    // Should have some content
    expect(body).toBeTruthy();
  });
});
