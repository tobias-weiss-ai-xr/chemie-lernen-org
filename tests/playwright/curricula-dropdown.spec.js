/**
 * Playwright E2E Tests für UXF-042/043
 * - Dropdown-Funktionalität auf /curricula/
 * - Bundesland-SeitenZugriff
 * - Mobile-Darstellung
 */
const { test, expect } = require('@playwright/test');

// Basis-URL — standardmäßig Production (chemie-lernen.org)
// Zum lokalen Testen: npx playwright test --baseURL=http://localhost:1313
const BASE_URL = process.env.BASE_URL || 'https://chemie-lernen.org';

test.describe('UXF-042/043: Lehrpläne Curricula Dropdown & Menu', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  // ============================================================
  // 1. MENU VERIFICATION (UXF-042)
  // ============================================================
  test.describe('UXF-042: Menu Aggregation', () => {
    test('Sollte genau 1 "Lehrpläne & Curricula" Menüpunkt unter "Lehrende" haben', async ({
      page,
    }) => {
      await page.goto(BASE_URL);

      // Warte auf Menü-Ladung
      await page.waitForSelector('nav[aria-label="Hauptnavigation"]', { timeout: 10000 });

      // Finde alle Menüpunkte unter "Lehrende"
      const lehrendeLink = page.getByRole('link', { name: /Lehrende/i });
      await lehrendeLink.first().hover();

      // Warte auf Submenu
      await page.waitForTimeout(500);

      // Prüfe dass "Lehrpläne & Curricula" existiert
      const curriculaLink = page.getByRole('link', { name: /Lehrpläne & Curricula/i });
      await expect(curriculaLink.first()).toBeVisible();

      // Prüfe dass KEINE individuellen Bundesland-Links existieren
      const bundeslandLinks = [
        'Baden-Württemberg',
        'Bayern',
        'Berlin',
        'Brandenburg',
        'Bremen',
        'Hamburg',
        'Hessen',
        'Mecklenburg-Vorpommern',
        'Niedersachsen',
        'Nordrhein-Westfalen',
        'Rheinland-Pfalz',
        'Saarland',
        'Sachsen',
        'Sachsen-Anhalt',
        'Schleswig-Holstein',
        'Thüringen',
      ];

      for (const land of bundeslandLinks) {
        const landLink = page.getByRole('link', { name: new RegExp(land, 'i') });
        await expect(landLink).not.toBeVisible();
      }
    });

    test('"Lehrpläne & Curricula" sollte zu /curricula/ navigieren', async ({ page }) => {
      await page.goto(BASE_URL);

      const lehrendeLink = page.getByRole('link', { name: /Lehrende/i });
      await lehrendeLink.first().hover();
      await page.waitForTimeout(500);

      const curriculaLink = page.getByRole('link', { name: /Lehrpläne & Curricula/i });
      await curriculaLink.first().click();

      await expect(page).toHaveURL(/\/curricula\/?$/);
    });
  });

  // ============================================================
  // 2. DROPDOWN VERIFICATION (UXF-043)
  // ============================================================
  test.describe('UXF-043: Dropdown Funktionalität', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${BASE_URL}/curricula/`);
      await page.waitForSelector('#state-select', { timeout: 10000 });
    });

    test('Sollte Dropdown-Element mit id=state-select haben', async ({ page }) => {
      const dropdown = page.locator('#state-select');
      await expect(dropdown).toBeVisible();
    });

    test('Sollte Label für Dropdown haben', async ({ page }) => {
      const label = page.locator('label[for="state-select"]');
      await expect(label).toBeVisible();
      await expect(label).toHaveText(/Bundesland/i);
    });

    test('Sollte Platzhalter-Option haben', async ({ page }) => {
      const dropdown = page.locator('#state-select');
      const options = dropdown.locator('option');

      await expect(options.first()).toHaveAttribute('value', '');
      await expect(options.first()).toHaveAttribute('selected');
      await expect(options.first()).toHaveAttribute('disabled');
    });

    test('Sollte alle 16 Bundesländer als Options haben', async ({ page }) => {
      const dropdown = page.locator('#state-select');
      const options = await dropdown.locator('option').all();

      // 17 = 16 Bundesländer + 1 Platzhalter
      expect(options.length).toBeGreaterThanOrEqual(17);

      const bundeslandCodes = [
        'bw',
        'by',
        'be',
        'bb',
        'hb',
        'he',
        'hh',
        'mv',
        'ni',
        'nw',
        'rp',
        'sh',
        'sl',
        'sn',
        'st',
        'th',
      ];

      for (const code of bundeslandCodes) {
        const option = page.locator(`#state-select option[value="${code}"]`);
        await expect(option).toBeVisible();
      }
    });

    test('Dropdown Navigation sollte funktionieren (Baden-Württemberg)', async ({ page }) => {
      const dropdown = page.locator('#state-select');
      await dropdown.selectOption('bw');

      // onchange sollte direkt navigieren
      await expect(page).toHaveURL(/\/curricula\/bw\/?$/);
    });

    test('Dropdown Navigation sollte funktionieren (Hessen)', async ({ page }) => {
      const dropdown = page.locator('#state-select');
      await dropdown.selectOption('he');

      await expect(page).toHaveURL(/\/curricula\/he\/?$/);
    });

    test('Dropdown Navigation sollte funktionieren (Saarland)', async ({ page }) => {
      const dropdown = page.locator('#state-select');
      await dropdown.selectOption('sl');

      await expect(page).toHaveURL(/\/curricula\/sl\/?$/);
    });
  });

  // ============================================================
  // 3. BUNDESLAND-SEITEN VERIFICATION
  // ============================================================
  test.describe('Bundesland-Seiten Inhalte', () => {
    const states = [
      { code: 'bw', name: 'Baden-Württemberg' },
      { code: 'by', name: 'Bayern' },
      { code: 'be', name: 'Berlin' },
      { code: 'bb', name: 'Brandenburg' },
      { code: 'hb', name: 'Bremen' },
      { code: 'he', name: 'Hessen' },
      { code: 'hh', name: 'Hamburg' },
      { code: 'mv', name: 'Mecklenburg-Vorpommern' },
      { code: 'ni', name: 'Niedersachsen' },
      { code: 'nw', name: 'Nordrhein-Westfalen' },
      { code: 'rp', name: 'Rheinland-Pfalz' },
      { code: 'sl', name: 'Saarland' },
      { code: 'sn', name: 'Sachsen' },
      { code: 'st', name: 'Sachsen-Anhalt' },
      { code: 'sh', name: 'Schleswig-Holstein' },
      { code: 'th', name: 'Thüringen' },
    ];

    for (const state of states) {
      test(`Bundesland ${state.code} sollte laden und Inhalte anzeigen`, async ({ page }) => {
        await page.goto(`${BASE_URL}/curricula/${state.code}/`, { timeout: 15000 });

        // Seite sollte laden ohne 404
        await expect(page).not.toHaveURL(/404/);

        // Sollte Seiten-Titel enthalten
        await expect(page).toHaveTitle(new RegExp(state.name, 'i'));
      });
    }
  });

  // ============================================================
  // 4. MOBILE RESPONSIVENESS
  // ============================================================
  test.describe('Mobile Darstellung', () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test('Dropdown sollte auf Mobile kompakt angezeigt werden', async ({ page }) => {
      await page.goto(`${BASE_URL}/curricula/`);
      await page.waitForSelector('#state-select', { timeout: 10000 });

      const dropdown = page.locator('#state-select');
      await expect(dropdown).toBeVisible();

      // Sollte nicht zu breit sein
      const width = await dropdown.evaluate((el) => el.offsetWidth);
      expect(width).toBeLessThan(400);
    });

    test('Dropdown sollte auf Mobile funktionsfähig sein', async ({ page }) => {
      await page.goto(`${BASE_URL}/curricula/`);

      const dropdown = page.locator('#state-select');
      await dropdown.selectOption('bw');

      await expect(page).toHaveURL(/\/curricula\/bw\/?$/);
    });
  });

  // ============================================================
  // 5. A11Y VERIFICATION
  // ============================================================
  test.describe('Barrierefreiheit', () => {
    test('Dropdown sollte aria-label Attribute haben', async ({ page }) => {
      await page.goto(`${BASE_URL}/curricula/`);

      const dropdown = page.locator('#state-select');
      await expect(dropdown).toHaveAttribute('aria-label', /Bundesland.*auswählen/i);
    });

    test('Dropdown sollte mit Tastatur bedienbar sein', async ({ page }) => {
      await page.goto(`${BASE_URL}/curricula/`);

      const dropdown = page.locator('#state-select');
      await dropdown.focus();

      // Pfeil nach unten drücken um Options zu öffnen
      await page.keyboard.press('ArrowDown');

      // Enter für erste Auswahl
      await page.keyboard.press('Enter');

      // Sollte navigiert haben
      await expect(page).toHaveURL(/\/curricula\/[a-z]{2}\/?$/);
    });
  });
});
