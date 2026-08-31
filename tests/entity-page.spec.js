/**
 * E2E — /entity/ Seitenintegrität (Regression 2026-08-31).
 *
 * Anlass war ein Komplett-Ausfall der Entity-Übersicht:
 *   - kaputte <script>-Tags -> kein Graph-Loader, slugs.js fehlte
 *   - lunr von unpkg + Timing-Bug -> Suche tot ("lunr is not defined")
 *   - entity-index.js doppelt geladen (?v=3 + ?v=8)
 *   - alter Service-Worker servierte wochenlanges HTML
 *
 * Läuft gegen die Live-Site (BASE_URL) und verifiziert Verhalten, nicht
 * nur Markup: Console frei von den drei gefixten Fehlern, lunr global
 * definiert, Wissensnetz-Graph rendert (Canvas), Suche filtert die Liste.
 *
 * Bekanntes, harmloses Console-Rauschen wird gefiltert: 404er von
 * optionalen Auth/Gamification-Endpoints, Pagefind, AdSense.
 */

const { test, expect } = require('@playwright/test');

const BASE_URL = process.env.BASE_URL || 'https://chemie-lernen.org';

// Console-Muster, die bewusst ignoriert werden (präexistierendes Rauschen)
const NOISE = [
  /passkeys-inject\.js/, // Browser-Extension des Nutzers
  /\/api\/auth\/me/,
  /\/api\/gamification/,
  /\/api\/learning-paths/,
  /pagefind/,
  /googlesyndication/,
  /wheel sensitivity/, // Cytoscape-Info
  /text-zoomable/, // Cytoscape-Style-Warning
];

test.describe('Entity-Übersicht /entity/ (Regression 2026-08-31)', () => {
  let consoleIssues;

  test.beforeEach(async ({ page }) => {
    consoleIssues = [];
    page.on('console', (msg) => {
      if (msg.type() !== 'error' && msg.type() !== 'warning') return;
      const text = msg.text();
      if (NOISE.some((re) => re.test(text))) return;
      consoleIssues.push(`${msg.type()}: ${text.slice(0, 120)}`);
    });
    page.on('pageerror', (err) => {
      consoleIssues.push(`pageerror: ${String(err).slice(0, 120)}`);
    });
    await page.goto(`${BASE_URL}/entity/?e2e=${Date.now()}`, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    // KG-Daten + Graph-Init brauchen einen Moment
    await page.waitForTimeout(3000);
  });

  test('entity-index.js ist genau einmal eingebunden (?v=9)', async ({ page }) => {
    // Der exakte Versions-Pin ist Absicht: Er schlägt an, wenn ein älterer
    // CI-Deploy aus der Runner-Queue die Seite überschreibt (Deploy-Skew),
    // und erzwingt, dass JS-Änderungen mit Version-Bump + Test-Update
    // gemeinsam geshippt werden.
    const count = await page.evaluate(
      () => document.querySelectorAll('script[src*="entity-index.js"]').length
    );
    expect(count).toBe(1);
    const src = await page.evaluate(
      () => (document.querySelector('script[src*="entity-index.js"]') || {}).src || ''
    );
    expect(src).toContain('v=9');
  });

  test('keine der gefixten Console-Fehler tritt auf', async () => {
    const joined = consoleIssues.join('\n');
    expect(joined).not.toContain('lunr is not defined');
    expect(joined).not.toContain('loadD3AndEgoGraph not available');
    expect(consoleIssues).toEqual([]);
  });

  test('lunr global definiert — Suche initialisiert', async ({ page }) => {
    const lunrOk = await page.evaluate(() => typeof window.lunr !== 'undefined');
    expect(lunrOk).toBe(true);
  });

  test('Wissensnetz-Graph rendert (Canvas vorhanden)', async ({ page }) => {
    const hasCanvas = await page.evaluate(
      () => !!document.querySelector('#entity-graph canvas, .entity-graph canvas, canvas')
    );
    expect(hasCanvas).toBe(true);
  });

  test('Suche filtert die Entity-Liste', async ({ page }) => {
    // #entity-search wird dynamisch vom App-JS gerendert (nicht im Template!)
    const input = page.locator('#entity-search');
    await expect(input).toBeVisible({ timeout: 15000 });

    const before = await page.evaluate(
      () =>
        [...document.querySelectorAll('.entity-card')].filter((c) => c.offsetParent !== null).length
    );
    expect(before).toBeGreaterThan(5);

    // 'eisen' matcht eisen, eisen-i, eisen-ii-sulfat, eisen-iii-oxid, …
    await input.fill('eisen');
    // Suche re-rendert die Kartengruppe (input-Event -> _render())
    await page.waitForTimeout(1500);

    const after = await page.evaluate(
      () =>
        [...document.querySelectorAll('.entity-card')].filter((c) => c.offsetParent !== null).length
    );
    expect(after).toBeLessThan(before);
    expect(after).toBeGreaterThan(0);
  });

  test('slugs.js ist als echtes Script geladen (kein Text-Fragment)', async ({ page }) => {
    const loaded = await page.evaluate(() => !!document.querySelector('script[src*="slugs.js"]'));
    expect(loaded).toBe(true);
  });
});
