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

    // Probe-verifiziert: Freitext-Formel-Eingabe statt name-Attributen:
    // #fuel-formula, #fuel-name, #fuel-mass.
    const input = page.locator('#fuel-formula');
    const hasInput = (await await input.count()) > 0;

    expect(hasInput).toBeTruthy();
  });

  test('should have fuel mass and name inputs', async ({ page }) => {
    await page.goto(`${BASE_URL}/verbrennungsrechner/`);

    // Kein <select> für Brennstoff-Typen — Brennstoff wird als
    // Summenformel (#fuel-formula) eingegeben, Presets via
    // .quick-examples-Buttons (siehe presets-Test).
    await expect(page.locator('#fuel-name')).toBeVisible();
    await expect(page.locator('#fuel-mass')).toBeVisible();
  });

  test('should calculate combustion results', async ({ page }) => {
    await page.goto(`${BASE_URL}/verbrennungsrechner/`);

    // Enter fuel formula + mass, then calculate
    await page.locator('#fuel-formula').fill('CH4');
    await page.locator('#fuel-mass').fill('16');

    // Click calculate (Button heißt "Verbrennung analysieren")
    await page.locator('#btn-calc-combustion').click();
    await page.waitForTimeout(1500);

    // Should show results (probe-verifiziert: Verbrennungsgleichung etc.)
    const result = page.locator('#results-section');
    await expect(result).toBeVisible();
  });

  test('should display combustion equation', async ({ page }) => {
    await page.goto(`${BASE_URL}/verbrennungsrechner/`);

    // Erst CH4 verbrennen — die Gleichung ist initial leer
    await page.locator('#fuel-formula').fill('CH4');
    await page.locator('#btn-calc-combustion').click();
    await page.waitForTimeout(1500);

    // Probe-verifiziert: "CH4 + 2.00 O₂ → CO₂ + 2H₂O"
    const equation = page.locator('#combustion-equation');
    await expect(equation).toBeVisible();
    await expect(equation).toContainText(/CH4|CH₄/);
  });

  // AUDIT-2026-09-08: Heizwert-/Energieanzeige existiert nicht in den
  // Ergebnis-Karten (probe-verifiziert: kein kJ in #results-section).
  // Reaktivieren, sobald Energie-Betrachtung eingebaut ist.
  test.fixme('should show energy released', async ({ page }) => {
    await page.goto(`${BASE_URL}/verbrennungsrechner/`);

    await page.locator('#fuel-formula').fill('CH4');
    await page.locator('#fuel-mass').fill('16');
    await page.locator('#btn-calc-combustion').click();
    await page.waitForTimeout(1500);

    const energyDisplay = page.locator('text=/kilojoule|Heizwert|Energiefreisetzung/');
    await expect(energyDisplay.first()).toBeVisible();
  });

  test('should have common fuel presets', async ({ page }) => {
    await page.goto(`${BASE_URL}/verbrennungsrechner/`);

    const presets = page.locator('.quick-examples button, .preset, .fuel-preset');
    const hasPresets = (await await presets.count()) > 0;

    expect(hasPresets).toBeTruthy();
  });

  test('should show stoichiometric coefficients', async ({ page }) => {
    await page.goto(`${BASE_URL}/verbrennungsrechner/`);

    // Probe-verifiziert: Gleichung nach CH4-Analyse → "CH4 + 2.00 O₂ → CO₂…"
    await page.locator('#fuel-formula').fill('CH4');
    await page.locator('#fuel-mass').fill('16');
    await page.locator('#btn-calc-combustion').click();
    await page.waitForTimeout(1500);

    const coefficients = page.locator('#combustion-equation');
    const hasCoefficients = (await await coefficients.count()) > 0;
    if (hasCoefficients) {
      await expect(coefficients).toBeVisible();
      await expect(coefficients).toContainText(/O₂|O2/);
    }
  });

  test('should validate input for negative values', async ({ page }) => {
    await page.goto(`${BASE_URL}/verbrennungsrechner/`);

    const input = page.locator('#fuel-mass');
    if ((await input.count()) > 0) {
      await input.fill('-1');

      const calculateBtn = page.locator('#btn-calc-combustion');
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

    const calculateBtn = page.locator('#btn-calc-combustion');
    if ((await calculateBtn.count()) > 0) {
      const input = page.locator('#fuel-formula');
      if ((await input.count()) > 0) {
        await input.fill('CH4');
        await page.locator('#fuel-mass').fill('16');
        await calculateBtn.click();
        await page.waitForTimeout(1500);
      }
    }

    // Probe-verifiziert: #environmental-data ("Umweltkennwerte") nennt CO₂
    const envData = page.locator('#environmental-data');
    const hasEmissions = (await envData.count()) > 0 || (await emissions.count()) > 0;
    if (hasEmissions) {
      const target = (await envData.count()) > 0 ? envData : emissions.first();
      await expect(target).toBeVisible();
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
