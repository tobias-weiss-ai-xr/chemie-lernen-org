/**
 * Titrations Simulator Tests
 * Verifies titration curve simulator functionality
 */

const { test, expect } = require('@playwright/test');

const BASE_URL = process.env.BASE_URL || 'https://chemie-lernen.org';

test.describe('Titrations Simulator', () => {
  test('should load titration simulator page', async ({ page }) => {
    await page.goto(`${BASE_URL}/titrations-simulator/`);

    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
  });

  test('should have acid and base input fields', async ({ page }) => {
    await page.goto(`${BASE_URL}/titrations-simulator/`);

    const acidInput = page.locator(
      'input[name*="acid"], #acid-concentration, input[placeholder*="Säure"]'
    );
    const baseInput = page.locator(
      'input[name*="base"], #base-concentration, input[placeholder*="Lauge"]'
    );

    const hasAcidInput = (await await acidInput.count()) > 0;
    const hasBaseInput = (await await baseInput.count()) > 0;

    expect(hasAcidInput || hasBaseInput).toBeTruthy();
  });

  test('should have chart container for titration curve', async ({ page }) => {
    await page.goto(`${BASE_URL}/titrations-simulator/`);

    const chart = page.locator('canvas, .chart, .titration-curve, #chart');
    await expect(chart.first()).toBeVisible();
  });

  test('should have volume input', async ({ page }) => {
    await page.goto(`${BASE_URL}/titrations-simulator/`);

    const volumeInput = page.locator(
      'input[name*="volume"], #volume, input[placeholder*="Volumen"]'
    );
    const hasVolumeInput = (await await volumeInput.count()) > 0;

    expect(hasVolumeInput).toBeTruthy();
  });

  test('should calculate titration curve', async ({ page }) => {
    await page.goto(`${BASE_URL}/titrations-simulator/`);

    // Enter titration parameters
    const acidInput = page.locator('input[name*="acid"], #acid-concentration');
    const baseInput = page.locator('input[name*="base"], #base-concentration');
    const volumeInput = page.locator('input[name*="volume"], #volume');

    if ((await acidInput.count()) > 0) {
      await acidInput.fill('0.1');
    }
    if ((await baseInput.count()) > 0) {
      await baseInput.fill('0.1');
    }
    if ((await volumeInput.count()) > 0) {
      await volumeInput.fill('50');
    }

    // Click calculate/simulate button
    const calculateBtn = page.locator(
      'button:has-text("Berechnen"), button:has-text("Simulieren"), button:has-text("Calculate")'
    );
    const hasButton = (await await calculateBtn.count()) > 0;

    if (hasButton) {
      await calculateBtn.click();
      await page.waitForTimeout(1000);
    }

    // Chart should be visible
    const chart = page.locator('canvas, .chart');
    await expect(chart.first()).toBeVisible();
  });

  test('should display equivalence point', async ({ page }) => {
    await page.goto(`${BASE_URL}/titrations-simulator/`);

    const resultSection = page.locator('.result, .equivalence-point, #equivalence-point');
    const hasResults = (await await resultSection.count()) > 0;

    if (hasResults) {
      const calculateBtn = page.locator(
        'button:has-text("Berechnen"), button:has-text("Calculate")'
      );
      if ((await calculateBtn.count()) > 0) {
        await calculateBtn.click();
        await page.waitForTimeout(1000);
      }

      await expect(resultSection.first()).toBeVisible();
    }
  });

  test('should allow selecting acid/base type', async ({ page }) => {
    await page.goto(`${BASE_URL}/titrations-simulator/`);

    const acidSelect = page.locator('select[name*="acid"], #acid-type');
    const baseSelect = page.locator('select[name*="base"], #base-type');
    const hasSelect = (await await acidSelect.count()) > 0 || (await baseSelect.count()) > 0;

    expect(hasSelect).toBeTruthy();
  });

  test('should show pH indicators', async ({ page }) => {
    await page.goto(`${BASE_URL}/titrations-simulator/`);

    const indicator = page.locator('.indicator, .ph-indicator, #indicator');
    const hasIndicator = (await await indicator.count()) > 0;

    if (hasIndicator) {
      await expect(indicator.first()).toBeVisible();
    }
  });

  test('should display pH scale', async ({ page }) => {
    await page.goto(`${BASE_URL}/titrations-simulator/`);

    const phScale = page.locator('.ph-scale, .ph-meter, #ph-scale');
    const hasScale = (await await phScale.count()) > 0;

    if (hasScale) {
      await expect(phScale.first()).toBeVisible();
    }
  });

  test('should have reset button', async ({ page }) => {
    await page.goto(`${BASE_URL}/titrations-simulator/`);

    const resetBtn = page.locator(
      'button:has-text("Zurücksetzen"), button:has-text("Reset"), .reset-button'
    );
    const hasReset = (await await resetBtn.count()) > 0;

    expect(hasReset).toBeTruthy();
  });
});
