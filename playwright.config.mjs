/**
 * Playwright-Konfiguration (ROOT — von der Playwright-CLI automatisch geladen).
 *
 * HISTORIE: Diese Config lag früher unter tests/playwright.config.js und wurde
 * NIE geladen (Playwright sucht nur playwright.config.{mjs,js,ts} im Repo-Root).
 * Die CLI lief mit Defaults → "Available projects: ''", und der Default-
 * testMatch (auch *.test.js!) ließ `playwright test --list` sogar vitest-Dateien
 * laden und crashen.
 *
 * Browser-Sets (gegen Produktion/Antwortzeit abgewogen):
 *   E2E_BROWSERS=chromium (Default)   — Desktop Chrome
 *   E2E_BROWSERS=mobile               — Mobile Chrome (Pixel 5) + Mobile Safari (iPhone 12)
 *   E2E_BROWSERS=desktop              — Firefox + WebKit
 *   E2E_BROWSERS=chromium,mobile,…    — Kombinationen (Komma-separiert)
 *   E2E_BROWSERS=all                  — alles (Achtung: 5× Last auf der Live-API)
 *
 * Projekt-Auswahl wie üblich: npx playwright test --project="Mobile Chrome"
 *
 * Die Tests laufen gegen die LIVE-Produktion (BASE_URL überschreibbar), es
 * gibt keinen lokalen webServer — siehe AGENTS.md.
 */

import { defineConfig, devices } from '@playwright/test';

const BROWSER_SETS = {
  chromium: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  mobile: [
    { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
    { name: 'Mobile Safari', use: { ...devices['iPhone 12'] } },
  ],
  desktop: [
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
};

const wanted = (process.env.E2E_BROWSERS || 'chromium').split(',');
const projects = wanted.flatMap((key) => {
  const set = BROWSER_SETS[key.trim()];
  if (!set) {
    console.warn(
      `[playwright.config] Unbekanntes E2E_BROWSERS-Set "${key}" — erlaubt: ${Object.keys(BROWSER_SETS).join(', ')}, all`
    );
    return [];
  }
  return set;
});

export default defineConfig({
  // Alle Playwright-Specs liegen unter tests/e2e/ (Unit-Tests sind vitest: *.test.js)
  testDir: './tests/e2e',

  // NUR .spec-Dateien — .test.js gehört vitest (sonst lädt Playwright jsdom-Tests)
  testMatch: '**/*.spec.{js,ts}',

  // Timeout per Test
  timeout: 30_000,

  // Expect timeout
  expect: { timeout: 5_000 },

  // Build failt bei versehentlichem test.only im CI
  forbidOnly: !!process.env.CI,

  // Retries absorbieren HTTP-429-Bursts der Production-API
  retries: 2,

  // CI: seriell (Live-API rate-limitiert), lokal: Playwright-Default
  workers: process.env.CI ? 1 : undefined,

  // Reporter
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'test-results/playwright-results.json' }],
    ['list'],
  ],

  use: {
    // Live-Produktion; für lokale Tests: BASE_URL=http://localhost:1313
    baseURL: process.env.BASE_URL || 'https://chemie-lernen.org',

    // Trace/Screenshots/Video nur bei Fehlern (Aufwand sparen)
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',

    // HTTPS-Fehler bei lokalem Testing ignorieren
    ignoreHTTPSErrors: !process.env.CI,
  },

  projects,
});
