/**
 * UXF-058: Gerenderter Kontrast-Scan (WCAG AA) über alle Theme-Kombis.
 *
 * Garantiert, dass die drei lived Bug-Klassen nie wieder auftreten:
 *  1. UXF-053: Selektor-Mismatch → kein BG → geerbte Parent-Farbe (Scanner:
 *     effektiver BG via Parent-Kette INKL. Alpha-Kompositierung).
 *  2. UXF-054: hardcoded Farbe ohne Dark-Override (Scanner: alle Kombis).
 *  3. UXF-057: prefers-color-scheme-Drift — OS-Dark verdunkelt Container,
 *     data-theme='light' hält Text hell (Scanner: prefers × data-theme
 *     Kombinationen; Struktur-Guard: prefers-theme-duality.test.mjs).
 *
 * Baut die Site mit Hugo in node_modules/.cache (gitignored), serviert sie
 * über einen lokalen HTTP-Server und scannt im echten Chromium gerenderte
 * Textknoten: echte Kaskade, Vererbung, Media-Queries, Gradients, Alpha.
 *
 * Läuft im node-Projekt (kein DOM-Env — Browser via Playwright). Skipped
 * automatisch, wenn hugo oder Chromium nicht verfügbar sind.
 */

import { describe, beforeAll, afterAll, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
// Browser-seitige Quellen (DOM-Strings) liegen in der Fixture — node-env-Files
// dürfen laut tests/vitest-project-lists.test.js keine DOM-Referenzen enthalten.
import { SCAN_SRC, INJECT_QUIZ_FEEDBACK, themeInitSrc } from './fixtures/contrast-browser.mjs';

const SITE_ROOT = path.resolve('node_modules/.cache/hugo-contrast');

const MIME = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json',
};

const COMBOS = [
  ['light', 'light'],
  ['dark', 'dark'],
  ['dark', 'light'], // UXF-057-Drift-Klasse
  ['light', 'dark'], // UXF-057-Drift-Klasse
];

const PAGES = [
  { path: '/', wait: 1500 }, // Startseite: 3D-Hero-Init abwarten
  { path: '/themenbereiche/einfuehrung-chemie/was-ist-chemie/', wait: 500 },
  { path: '/quiz/', wait: 500, injectQuizFeedback: true },
];

let server;
let browser;
let port;
let skipped = false;

function hugoAvailable() {
  try {
    const r = spawnSync('hugo', ['version'], { timeout: 10000 });
    return r.status === 0;
  } catch {
    return false;
  }
}

beforeAll(async () => {
  if (!hugoAvailable()) {
    skipped = true;
    return;
  }
  fs.rmSync(SITE_ROOT, { recursive: true, force: true });
  const build = spawnSync(
    'hugo',
    ['--source', 'myhugoapp', '--destination', SITE_ROOT, '--quiet'],
    { timeout: 180000, stdio: 'pipe' }
  );
  if (build.status !== 0)
    throw new Error('Hugo-Build fehlgeschlagen: ' + String(build.stderr).slice(0, 500));
  server = http.createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (p.endsWith('/')) p += 'index.html';
    let file = path.join(SITE_ROOT, p);
    if (!file.startsWith(SITE_ROOT)) {
      res.writeHead(403);
      return res.end();
    }
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory())
      file = path.join(SITE_ROOT, '404.html');
    res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  port = server.address().port;
  try {
    browser = await chromium.launch();
  } catch {
    skipped = true;
    server.close();
    server = null;
  }
}, 240000);

afterAll(async () => {
  if (browser) await browser.close();
  if (server) server.close();
});

describe('Kontrast-Ganzseiten-Scan (gerendert, WCAG AA)', () => {
  for (const [dataTheme, osScheme] of COMBOS) {
    it(`[data-theme=${dataTheme} / prefers=${osScheme}] 0 AA-Verletzungen auf ${PAGES.length} Seiten`, async (ctx) => {
      if (skipped) return ctx.skip();
      expect(browser, 'Chromium verfügbar').toBeTruthy();
      const context = await browser.newContext({ colorScheme: osScheme });
      const page = await context.newPage();
      const violations = [];
      try {
        await page.addInitScript(themeInitSrc(dataTheme));
        for (const p of PAGES) {
          await page
            .goto(`http://127.0.0.1:${port}${p.path}`, {
              waitUntil: 'load',
              timeout: 20000,
            })
            .catch(() => {});
          await page.waitForTimeout(p.wait);
          if (p.injectQuizFeedback) {
            await page.evaluate(INJECT_QUIZ_FEEDBACK).catch(() => {});
          }
          const found = await page.evaluate(SCAN_SRC);
          for (const v of found) violations.push({ page: p.path, ...v });
        }
      } finally {
        await context.close();
      }
      const report = violations
        .map(
          (v) =>
            `[${v.page}] ${v.selector} "${v.text}" ${v.fg} auf ${v.bg} = ${v.ratio}:1 (nötig ${v.need}:1)`
        )
        .join('\n');
      expect(violations, `${violations.length} Kontrast-Verletzungen:\n${report}`).toEqual([]);
    }, 120000);
  }
});
