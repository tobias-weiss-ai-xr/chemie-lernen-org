/**
 * Calculator Functional Tests
 * Verifies calculator pages load and function correctly
 */

const { test, expect } = require('@playwright/test');

const BASE_URL = process.env.BASE_URL || 'https://chemie-lernen.org';

test.describe('Molare Masse Rechner', () => {
  test('should load calculator page', async ({ page }) => {
    await page.goto(`${BASE_URL}/molare-masse-rechner/`);

    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
  });

  test('should have formula input field', async ({ page }) => {
    await page.goto(`${BASE_URL}/molare-masse-rechner/`);

    const input = page.locator('#formula-input');
    await expect(input).toBeVisible();
    await expect(input).toHaveAttribute('placeholder');
  });

  test('should calculate molar mass for H2O', async ({ page }) => {
    await page.goto(`${BASE_URL}/molare-masse-rechner/`);

    const input = page.locator('#formula-input, input[name="formula"]');
    await input.fill('H2O');

    const calculateBtn = page.locator('button:has-text("Berechnen"), button:has-text("Calculate")');
    await calculateBtn.click();

    // Wait for result
    await page.waitForTimeout(500);

    const result = page.locator('.result, #molar-mass, text=/18,015|18,02/');
    await expect(result).toBeVisible();
  });

  test('should calculate molar mass for NaCl', async ({ page }) => {
    await page.goto(`${BASE_URL}/molare-masse-rechner/`);

    const input = page.locator('#formula-input, input[name="formula"]');
    await input.fill('NaCl');

    const calculateBtn = page.locator('button:has-text("Berechnen"), button:has-text("Calculate")');
    await calculateBtn.click();

    await page.waitForTimeout(500);

    const result = page.locator('.result, #molar-mass');
    await expect(result).toBeVisible();
  });

  test('should show error for invalid formula', async ({ page }) => {
    await page.goto(`${BASE_URL}/molare-masse-rechner/`);

    const input = page.locator('#formula-input, input[name="formula"]');
    await input.fill('Invalid@Formula');

    const calculateBtn = page.locator('button:has-text("Berechnen"), button:has-text("Calculate")');
    await calculateBtn.click();

    await page.waitForTimeout(500);

    const error = page.locator('.error, .error-message');
    const hasError = (await await error.count()) > 0;
    expect(hasError).toBeTruthy();
  });
});

test.describe('pH Rechner', () => {
  test('should load calculator page', async ({ page }) => {
    await page.goto(`${BASE_URL}/ph-rechner/`);

    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
  });

  test('should calculate pH from H+ concentration', async ({ page }) => {
    await page.goto(`${BASE_URL}/ph-rechner/`);

    const input = page.locator('input[name="h-concentration"], #h-concentration');
    await input.fill('0.001');

    const calculateBtn = page.locator('button:has-text("Berechnen"), button:has-text("Calculate")');
    await calculateBtn.click();

    await page.waitForTimeout(500);

    const result = page.locator('.result, #ph-value, text=/pH.*3/');
    await expect(result).toBeVisible();
  });

  test('should calculate H+ concentration from pH', async ({ page }) => {
    await page.goto(`${BASE_URL}/ph-rechner/`);

    const input = page.locator('input[name="ph"], #ph');
    await input.fill('7');

    const calculateBtn = page.locator('button:has-text("Berechnen"), button:has-text("Calculate")');
    await calculateBtn.click();

    await page.waitForTimeout(500);

    const result = page.locator('.result');
    await expect(result).toBeVisible();
  });
});

test.describe('Reaktionsgleichungen Ausgleichen', () => {
  test('should load calculator page', async ({ page }) => {
    await page.goto(`${BASE_URL}/reaktionsgleichungen-ausgleichen/`);

    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
  });

  test('should have equation input field', async ({ page }) => {
    await page.goto(`${BASE_URL}/reaktionsgleichungen-ausgleichen/`);

    const input = page.locator('#equation-input, input[name="equation"]');
    await expect(input).toBeVisible();
  });

  test('should balance simple equation H2 + O2 = H2O', async ({ page }) => {
    await page.goto(`${BASE_URL}/reaktionsgleichungen-ausgleichen/`);

    const input = page.locator('#equation-input, input[name="equation"]');
    await input.fill('H2 + O2 = H2O');

    const calculateBtn = page.locator('button:has-text("Ausgleichen"), button:has-text("Balance")');
    await calculateBtn.click();

    await page.waitForTimeout(1000);

    const result = page.locator('.result, .balanced-equation, text=/2.*H2.*O2/');
    await expect(result).toBeVisible();
  });

  test('should show error for invalid equation format', async ({ page }) => {
    await page.goto(`${BASE_URL}/reaktionsgleichungen-ausgleichen/`);

    const input = page.locator('#equation-input, input[name="equation"]');
    await input.fill('Invalid Equation');

    const calculateBtn = page.locator('button:has-text("Ausgleichen"), button:has-text("Balance")');
    await calculateBtn.click();

    await page.waitForTimeout(500);

    const error = page.locator('.error, .error-message');
    const hasError = (await await error.count()) > 0;
    expect(hasError).toBeTruthy();
  });
});

test.describe('Periodensystem der Elemente', () => {
  test('should load periodic table page', async ({ page }) => {
    await page.goto(`${BASE_URL}/perioden-system-der-elemente/`);

    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
  });

  test('should display periodic table grid', async ({ page }) => {
    await page.goto(`${BASE_URL}/perioden-system-der-elemente/`);

    const periodicTable = page.locator('.periodic-table, #periodic-table, [class*="period"]');
    await expect(periodicTable).toBeVisible();
  });

  test('should have clickable elements', async ({ page }) => {
    await page.goto(`${BASE_URL}/perioden-system-der-elemente/`);

    const element = page.locator('.element, [data-element]').first();
    await expect(element).toBeVisible();
  });

  test('should show element details on click', async ({ page }) => {
    await page.goto(`${BASE_URL}/perioden-system-der-elemente/`);

    const element = page.locator('.element, [data-element="H"]').first();

    if ((await element.count()) > 0) {
      await element.click();
      await page.waitForTimeout(500);

      const modal = page.locator('.modal, .element-details, .popup');
      const hasModal = (await await modal.count()) > 0;
      expect(hasModal).toBeTruthy();
    }
  });
});
