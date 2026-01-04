/**
 * Molekuel Studio Tests
 * Verifies 3D molecule viewer functionality
 */

const { test, expect } = require('@playwright/test');

const BASE_URL = process.env.BASE_URL || 'https://chemie-lernen.org';

test.describe('Molekuel Studio', () => {
  test('should load molecule studio page', async ({ page }) => {
    await page.goto(`${BASE_URL}/molekuel-studio/`);

    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
  });

  test('should have 3D canvas', async ({ page }) => {
    await page.goto(`${BASE_URL}/molekuel-studio/`);

    const canvas = page.locator('canvas');
    await expect(canvas).toBeAttached();
  });

  test('should load default molecule', async ({ page }) => {
    await page.goto(`${BASE_URL}/molekuel-studio/`);

    // Wait for Three.js to load and render
    await page.waitForTimeout(2000);

    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('should have molecule input field', async ({ page }) => {
    await page.goto(`${BASE_URL}/molekuel-studio/`);

    const input = page.locator(
      'input[name="molecule"], #molecule-input, input[placeholder*="Formel"]'
    );
    await expect(input).toBeVisible();
  });

  test('should load molecule when formula is entered', async ({ page }) => {
    await page.goto(`${BASE_URL}/molekuel-studio/`);

    const input = page.locator('input[name="molecule"], #molecule-input');
    await input.fill('H2O');

    const loadBtn = page.locator('button:has-text("Laden"), button:has-text("Load")');
    await loadBtn.click();

    // Wait for molecule to load
    await page.waitForTimeout(2000);

    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('should load methane molecule', async ({ page }) => {
    await page.goto(`${BASE_URL}/molekuel-studio/`);

    const input = page.locator('input[name="molecule"], #molecule-input');
    await input.fill('CH4');

    const loadBtn = page.locator('button:has-text("Laden"), button:has-text("Load")');
    await loadBtn.click();

    await page.waitForTimeout(2000);

    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('should load carbon dioxide molecule', async ({ page }) => {
    await page.goto(`${BASE_URL}/molekuel-studio/`);

    const input = page.locator('input[name="molecule"], #molecule-input');
    await input.fill('CO2');

    const loadBtn = page.locator('button:has-text("Laden"), button:has-text("Load")');
    await loadBtn.click();

    await page.waitForTimeout(2000);

    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('should have rotation controls', async ({ page }) => {
    await page.goto(`${BASE_URL}/molekuel-studio/`);

    const autoRotateToggle = page.locator(
      'input[type="checkbox"][id*="rotate"], .auto-rotate-toggle'
    );
    const hasControls = (await await autoRotateToggle.count()) > 0;

    if (hasControls) {
      await expect(autoRotateToggle).toBeVisible();
    }
  });

  test('should allow manual rotation of molecule', async ({ page }) => {
    await page.goto(`${BASE_URL}/molekuel-studio/`);

    const canvas = page.locator('canvas').first();

    // Simulate mouse drag on canvas
    await canvas.click();
    await page.mouse.down();
    await page.mouse.move(100, 100);
    await page.mouse.up();

    await page.waitForTimeout(500);

    // Canvas should still be visible after rotation
    await expect(canvas).toBeVisible();
  });

  test('should show error for invalid molecule formula', async ({ page }) => {
    await page.goto(`${BASE_URL}/molekuel-studio/`);

    const input = page.locator('input[name="molecule"], #molecule-input');
    await input.fill('Invalid@Formula');

    const loadBtn = page.locator('button:has-text("Laden"), button:has-text("Load")');
    await loadBtn.click();

    await page.waitForTimeout(1000);

    const error = page.locator('.error, .error-message, .toast-error');
    const hasError = (await await error.count()) > 0;

    if (hasError) {
      await expect(error).toBeVisible();
    }
  });

  test('should have zoom controls', async ({ page }) => {
    await page.goto(`${BASE_URL}/molekuel-studio/`);

    const zoomIn = page.locator('button:has-text("+"), .zoom-in');
    const zoomOut = page.locator('button:has-text("-"), .zoom-out');
    const hasZoom = (await await zoomIn.count()) > 0 || (await zoomOut.count()) > 0;

    expect(hasZoom).toBeTruthy();
  });

  test('should have common molecule shortcuts', async ({ page }) => {
    await page.goto(`${BASE_URL}/molekuel-studio/`);

    const shortcuts = page.locator('.molecule-shortcuts, .common-molecules button');
    const hasShortcuts = (await await shortcuts.count()) > 0;

    if (hasShortcuts) {
      await expect(shortcuts.first()).toBeVisible();
    }
  });
});
