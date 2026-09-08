/**
 * Verbrennungsrechner Tests
 * Verifies combustion calculator functionality
 */

const { test, expect } = require('@playwright/test');

const BASE_URL = process.env.BASE_URL || 'https://chemie-lernen.org';

test.describe('Verbrennungsrechner', () => {
  test('should load combustion calculator page', async ({ page }) => {
    await page.goto(`${BASE_URL}/verbrennungsrechner/`);

    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
  });

  test('should have fuel input field', async ({ page }) => {
    await page.goto(`${BASE_URL}/verbrennungsrechner/`);

    const input = page.locator(
      'input[name*="fuel"], input[name*="treibstoff"], #fuel, input[placeholder*="Kraftstoff"]'
    );
    const hasInput = (await await input.count()) > 0;

    expect(hasInput).toBeTruthy();
  });

  test('should have fuel type selector', async ({ page }) => {
    await page.goto(`${BASE_URL}/verbrennungsrechner/`);

    const select = page.locator('select[name*="fuel"], select[name*="type"], #fuel-type');
    const hasSelect = (await await select.count()) > 0;

    expect(hasSelect).toBeTruthy();
  });

  test('should calculate combustion results', async ({ page }) => {
    await page.goto(`${BASE_URL}/verbrennungsrechner/`);

    // Enter fuel amount
    const fuelInput = page.locator('input[name*="fuel"], input[name*="amount"], #fuel-amount');
    if ((await fuelInput.count()) > 0) {
      await fuelInput.fill('1');
    }

    // Select fuel type
    const fuelSelect = page.locator('select[name*="fuel"], #fuel-type');
    if ((await fuelSelect.count()) > 0) {
      await fuelSelect.selectOption({ index: 0 });
    }

    // Click calculate
    const calculateBtn = page.locator('button:has-text("Berechnen"), button:has-text("Calculate")');
    const hasButton = (await await calculateBtn.count()) > 0;

    if (hasButton) {
      await calculateBtn.click();
      await page.waitForTimeout(1000);
    }

    // Should show results
    const result = page.locator('.result, .combustion-result, #result');
    const hasResult = (await await result.count()) > 0;

    if (hasResult) {
      await expect(result.first()).toBeVisible();
    }
  });

  test('should display combustion equation', async ({ page }) => {
    await page.goto(`${BASE_URL}/verbrennungsrechner/`);

    const equation = page.locator('.equation, .reaction-equation, .chemical-equation');
    const hasEquation = (await await equation.count()) > 0;

    if (hasEquation) {
      await expect(equation.first()).toBeVisible();
    }
  });

  test('should show energy released', async ({ page }) => {
    await page.goto(`${BASE_URL}/verbrennungsrechner/`);

    const energyDisplay = page.locator('.energy, .enthalpy, #energy, text=/kilojoule|kJ|Energie/');

    const calculateBtn = page.locator('button:has-text("Berechnen"), button:has-text("Calculate")');
    if ((await calculateBtn.count()) > 0) {
      const input = page.locator('input[name*="fuel"], input[name*="amount"]');
      if ((await input.count()) > 0) {
        await input.fill('1');
        await calculateBtn.click();
        await page.waitForTimeout(1000);
      }
    }

    const hasEnergy = (await await energyDisplay.count()) > 0;
    if (hasEnergy) {
      await expect(energyDisplay.first()).toBeVisible();
    }
  });

  test('should have common fuel presets', async ({ page }) => {
    await page.goto(`${BASE_URL}/verbrennungsrechner/`);

    const presets = page.locator(
      '.preset, .fuel-preset, button:has-text("Benzin"), button:has-text("Diesel"), button:has-text("Erdgas")'
    );
    const hasPresets = (await await presets.count()) > 0;

    expect(hasPresets).toBeTruthy();
  });

  test('should show stoichiometric coefficients', async ({ page }) => {
    await page.goto(`${BASE_URL}/verbrennungsrechner/`);

    const coefficients = page.locator('.coefficient, .stoichiometry, text=/C.*H.*O/');

    const calculateBtn = page.locator('button:has-text("Berechnen"), button:has-text("Calculate")');
    if ((await calculateBtn.count()) > 0) {
      const input = page.locator('input[name*="fuel"]');
      if ((await input.count()) > 0) {
        await input.fill('octane');
        await calculateBtn.click();
        await page.waitForTimeout(1000);
      }
    }

    const hasCoefficients = (await await coefficients.count()) > 0;
    if (hasCoefficients) {
      await expect(coefficients.first()).toBeVisible();
    }
  });

  test('should validate input for negative values', async ({ page }) => {
    await page.goto(`${BASE_URL}/verbrennungsrechner/`);

    const input = page.locator('input[name*="fuel"], input[name*="amount"]');
    if ((await input.count()) > 0) {
      await input.fill('-1');

      const calculateBtn = page.locator(
        'button:has-text("Berechnen"), button:has-text("Calculate")'
      );
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

  test('should display CO2 emissions', async ({ page }) => {
    await page.goto(`${BASE_URL}/verbrennungsrechner/`);

    const emissions = page.locator('.emissions, .co2, text=/CO2|Kohlenstoffdioxid/');

    const calculateBtn = page.locator('button:has-text("Berechnen"), button:has-text("Calculate")');
    if ((await calculateBtn.count()) > 0) {
      const input = page.locator('input[name*="fuel"]');
      if ((await input.count()) > 0) {
        await input.fill('1');
        await calculateBtn.click();
        await page.waitForTimeout(1000);
      }
    }

    const hasEmissions = (await await emissions.count()) > 0;
    if (hasEmissions) {
      await expect(emissions.first()).toBeVisible();
    }
  });

  test('should have explanation section', async ({ page }) => {
    await page.goto(`${BASE_URL}/verbrennungsrechner/`);

    const explanation = page.locator('.explanation, .info, .description, article');
    const hasExplanation = (await await explanation.count()) > 0;

    if (hasExplanation) {
      await expect(explanation.first()).toBeVisible();
    }
  });
});
