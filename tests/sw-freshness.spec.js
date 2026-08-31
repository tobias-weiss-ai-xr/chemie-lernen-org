/**
 * Service-Worker-Frische (live) — Deploy-Skew-Detektor.
 *
 * Lehre aus 2026-08-31: Der legion-Runner ist oft offline; CI-Deploys
 * älterer Commits laufen später durch und überschreiben lokale
 * Notfall-Deploys. Browser tauschen sw.js aber nur bei Byte-Differenz —
 * ein alter SW hält dann veraltete Caches monatelang fest (Anlass der
 * SW_VERSION v9-Purge-Strategie).
 *
 * Dieser Test liest die SW-Version aus dem REPO (Selbstpflege: kein
 * manuelles Pinnen nötig) und verlangt, dass die LIVE-Site genau diese
 * Version serviert. Läuft ein alter CI-Deploy dazwischen, schlägt er an.
 */

const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');

const BASE_URL = process.env.BASE_URL || 'https://chemie-lernen.org';
const SW_PATH = path.join(__dirname, '..', 'myhugoapp', 'static', 'sw.js');

function repoVersion() {
  const m = fs.readFileSync(SW_PATH, 'utf8').match(/SW_VERSION\s*=\s*'([^']+)'/);
  if (!m) throw new Error('SW_VERSION nicht im Repo-sw.js gefunden');
  return m[1];
}

test.describe('Service-Worker-Frische', () => {
  test('Live-sw.js serviert exakt die Repo-Version (Deploy-Skew)', async ({ page }) => {
    const expected = repoVersion();
    await page.goto(`${BASE_URL}/?swcheck=${Date.now()}`, { waitUntil: 'domcontentloaded' });
    const served = await page.evaluate(async () => {
      const res = await fetch('/sw.js', { cache: 'reload' });
      return res.ok ? res.text() : 'HTTP ' + res.status;
    });
    expect(served).toContain(`SW_VERSION = '${expected}'`);
  });

  test('Startseite: ServiceWorker steuert die Seite nach Reload', async ({ page }) => {
    // Erstbesuch registriert den SW nur — controlling greift ab dem nächsten
    // Load. Deshalb: laden, kurz warten, dann reload und Controller prüfen.
    await page.goto(`${BASE_URL}/?swreg=${Date.now()}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    const sw = await page.evaluate(() =>
      navigator.serviceWorker.controller ? navigator.serviceWorker.controller.scriptURL : null
    );
    expect(sw).not.toBeNull();
    expect(sw).toMatch(/sw\.js/);
  });
});
