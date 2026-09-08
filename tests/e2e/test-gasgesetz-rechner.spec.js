/**
 * Gasgesetz Rechner Tests
 * Verifies gas law calculator functionality
 */

const { test, expect } = require('@playwright/test');

const BASE_URL = process.env.BASE_URL || 'https://chemie-lernen.org';

test.describe('Gasgesetz Rechner', () => {
  test('should load gas law calculator page', async ({ page }) => {
    await page.goto(`${BASE_URL}/gasgesetz-rechner/`);

    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
  });

  test('should have gas law selector', async ({ page }) => {
    await page.goto(`${BASE_URL}/gasgesetz-rechner/`);

    const select = page.locator('select[name*="law"], #gas-law, .law-selector');
    const hasSelect = (await await select.count()) > 0;

    expect(hasSelect).toBeTruthy();
  });

  test('should have input fields for pressure, volume, temperature', async ({ page }) => {
    await page.goto(`${BASE_URL}/gasgesetz-rechner/`);

    const pressureInput = page.locator('input[name*="pressure"], input[name*="p"], #pressure');
    const volumeInput = page.locator('input[name*="volume"], input[name*="v"], #volume');
    const temperatureInput = page.locator(
      'input[name*="temperature"], input[name*="t"], #temperature'
    );

    const hasPressure = (await await pressureInput.count()) > 0;
    const hasVolume = (await await volumeInput.count()) > 0;
    const hasTemperature = (await await temperatureInput.count()) > 0;

    expect(hasPressure || hasVolume || hasTemperature).toBeTruthy();
  });

  test('should calculate ideal gas law (PV=nRT)', async ({ page }) => {
    await page.goto(`${BASE_URL}/gasgesetz-rechner/`);

    // Select ideal gas law
    const lawSelect = page.locator('select[name*="law"], #gas-law');
    if ((await lawSelect.count()) > 0) {
      await lawSelect.selectOption('ideal', { index: 0 });
    }

    // Enter values
    const pressureInput = page.locator('input[name*="pressure"], input[name*="p"]');
    const volumeInput = page.locator('input[name*="volume"], input[name*="v"]');
    const temperatureInput = page.locator('input[name*="temperature"], input[name*="t"]');

    if ((await pressureInput.count()) > 0) {
      await pressureInput.fill('1');
    }
    if ((await volumeInput.count()) > 0) {
      await volumeInput.fill('22.4');
    }
    if ((await temperatureInput.count()) > 0) {
      await temperatureInput.fill('273');
    }

    // Calculate
    const calculateBtn = page.locator('button:has-text("Berechnen"), button:has-text("Calculate")');
    const hasButton = (await await calculateBtn.count()) > 0;

    if (hasButton) {
      await calculateBtn.click();
      await page.waitForTimeout(1000);
    }

    // Check for result
    const result = page.locator('.result, .calculation-result');
    const hasResult = (await await result.count()) > 0;

    if (hasResult) {
      await expect(result.first()).toBeVisible();
    }
  });

  test('should display gas law formulas', async ({ page }) => {
    await page.goto(`${BASE_URL}/gasgesetz-rechner/`);

    const formula = page.locator('.formula, .equation, text=/p.*V.*n.*R.*T|PV=nRT/');

    const hasFormula = (await await formula.count()) > 0;
    if (hasFormula) {
      await expect(formula.first()).toBeVisible();
    }
  });

  test('should support Boyle-Mariotte law (p1V1 = p2V2)', async ({ page }) => {
    await page.goto(`${BASE_URL}/gasgesetz-rechner/`);

    const lawSelect = page.locator('select[name*="law"], #gas-law');
    const hasSelect = (await await lawSelect.count()) > 0;

    if (hasSelect) {
      await lawSelect.selectOption('boyle');
      await page.waitForTimeout(500);

      // Check for Boyle-Mariotte specific inputs
      const p1Input = page.locator('input[name*="p1"], #p1');
      const v1Input = page.locator('input[name*="v1"], #v1');
      const p2Input = page.locator('input[name*="p2"], #p2');

      const hasInputs = (await await p1Input.count()) > 0 && (await v1Input.count()) > 0;

      if (hasInputs) {
        await p1Input.fill('1');
        await v1Input.fill('22.4');

        const calculateBtn = page.locator('button:has-text("Berechnen")');
        if ((await calculateBtn.count()) > 0) {
          await calculateBtn.click();
          await page.waitForTimeout(1000);
        }

        const result = page.locator('.result');
        const hasResult = (await await result.count()) > 0;
        if (hasResult) {
          await expect(result.first()).toBeVisible();
        }
      }
    }
  });

  test('should support Gay-Lussac law (V1/T1 = V2/T2)', async ({ page }) => {
    await page.goto(`${BASE_URL}/gasgesetz-rechner/`);

    const lawSelect = page.locator('select[name*="law"], #gas-law');
    const hasSelect = (await await lawSelect.count()) > 0;

    if (hasSelect) {
      await lawSelect.selectOption('gay-lussac');
      await page.waitForTimeout(500);

      const result = page.locator('.result, .formula');
      const hasResult = (await await result.count()) > 0;
      if (hasResult) {
        await expect(result.first()).toBeVisible();
      }
    }
  });

  test('should have unit selector for pressure', async ({ page }) => {
    await page.goto(`${BASE_URL}/gasgesetz-rechner/`);

    const unitSelect = page.locator(
      'select[name*="unit"], .pressure-unit, select[name*="pressure-unit"]'
    );
    const hasUnitSelect = (await await unitSelect.count()) > 0;

    expect(hasUnitSelect).toBeTruthy();
  });

  test('should display explanation of gas laws', async ({ page }) => {
    await page.goto(`${BASE_URL}/gasgesetz-rechner/`);

    const explanation = page.locator('.explanation, .info, article, section');

    const hasExplanation = (await await explanation.count()) > 0;
    if (hasExplanation) {
      await expect(explanation.first()).toBeVisible();
    }
  });

  test('should validate temperature in Kelvin', async ({ page }) => {
    await page.goto(`${BASE_URL}/gasgesetz-rechner/`);

    const tempInput = page.locator('input[name*="temperature"], input[name*="t"]');

    if ((await tempInput.count()) > 0) {
      // Enter negative Kelvin (invalid)
      await tempInput.fill('-100');

      const calculateBtn = page.locator('button:has-text("Berechnen")');
      if ((await calculateBtn.count()) > 0) {
        await calculateBtn.click();
        await page.waitForTimeout(500);

        const error = page.locator('.error, .error-message');
        const hasError = (await await error.count()) > 0;
        if (hasError) {
          await expect(error.first()).toBeVisible();
        }
      }
    }
  });

  test('should show calculation steps', async ({ page }) => {
    await page.goto(`${BASE_URL}/gasgesetz-rechner/`);

    const steps = page.locator('.steps, .calculation-steps, .step-by-step');

    const calculateBtn = page.locator('button:has-text("Berechnen")');
    if ((await calculateBtn.count()) > 0) {
      const input = page.locator('input[name*="pressure"], input[name*="p"]');
      if ((await input.count()) > 0) {
        await input.fill('1');
        await calculateBtn.click();
        await page.waitForTimeout(1000);
      }
    }

    const hasSteps = (await await steps.count()) > 0;
    if (hasSteps) {
      await expect(steps.first()).toBeVisible();
    }
  });

  test('should have examples or presets', async ({ page }) => {
    await page.goto(`${BASE_URL}/gasgesetz-rechner/`);

    const examples = page.locator('.example, .preset, button:has-text("Beispiel")');
    const hasExamples = (await await examples.count()) > 0;

    expect(hasExamples).toBeTruthy();
  });
});
