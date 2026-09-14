/**
 * UXF-060: Interaktive Rechner-Smoke-Tests (gerenderter Chromium).
 *
 * Der Kontrast-/UX-Scan bewertet statisches Rendering — JS-Verkabelung
 * (LazyLoader-Script-Reihenfolge, Event-Handler, .optimized-Sidecars)
 * sieht er nicht. Hier wird wirklich getippt, geklickt, gerechnet:
 *  - Molare Masse: "H2O" → 18.015 g/mol
 *  - pH-Rechner: c(H+) = 1e-7 → pH 7
 *  - Stöchiometrie: Preset "Wasserbildung" füllt die Reaktionsgleichung
 *
 * Fängt Script-Load-Fehler über die Console ab (pageerror).
 * Skipped ohne hugo-extended/Chromium (wie contrast-rendered).
 */

import { describe, beforeAll, afterAll, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { themeInitSrc } from './fixtures/browser-scan-sources.mjs';

const SITE_ROOT = path.resolve('node_modules/.cache/hugo-ux');

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

let server;
let browser;
let port;
let skipped = false;

function hugoExtendedAvailable() {
  try {
    const r = spawnSync('hugo', ['version'], { timeout: 10000 });
    return r.status === 0 && /extended/i.test(String(r.stdout));
  } catch {
    return false;
  }
}

beforeAll(async () => {
  if (!hugoExtendedAvailable()) {
    skipped = true;
    return;
  }
  // Immer frisch bauen — geteilter Cache könnte veraltet sein
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

describe('Interaktive Rechner (gerendert: tippen, klicken, rechnen)', () => {
  it('Molare Masse: H2O → ~18 g/mol, Ergebnis-Sektion erscheint', async (ctx) => {
    if (skipped) return ctx.skip();
    const context = await browser.newContext({ colorScheme: 'light' });
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', (e) => pageErrors.push(String(e).slice(0, 120)));
    try {
      await page.addInitScript(themeInitSrc('light'));
      await page.goto(`http://127.0.0.1:${port}/molare-masse-rechner/`, {
        waitUntil: 'networkidle',
        timeout: 25000,
      });
      await page.fill('#formula-input', 'H2O');
      await page.click('#btn-calc-molar-mass');
      await page.waitForTimeout(600);
      expect(await page.locator('#results-section').isVisible(), 'results-section sichtbar').toBe(
        true
      );
      const mm = (await page.locator('#molar-mass').textContent()).trim();
      expect(parseFloat(mm.replace(',', '.')), `molar-mass="${mm}"`).toBeGreaterThan(17);
      expect(parseFloat(mm.replace(',', '.')), `molar-mass="${mm}"`).toBeLessThan(19);
      expect(pageErrors, 'keine JS-Laufzeitfehler').toEqual([]);
    } finally {
      await context.close();
    }
  }, 60000);

  it('pH-Rechner: c(H+) = 1e-7 → pH ≈ 7', async (ctx) => {
    if (skipped) return ctx.skip();
    const context = await browser.newContext({ colorScheme: 'light' });
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', (e) => pageErrors.push(String(e).slice(0, 120)));
    try {
      await page.addInitScript(themeInitSrc('light'));
      await page.goto(`http://127.0.0.1:${port}/ph-rechner/`, {
        waitUntil: 'networkidle',
        timeout: 25000,
      });
      await page.fill('#hplus-input', '1e-7');
      await page.click('#btn-calc-from-hplus');
      await page.waitForTimeout(600);
      expect(await page.locator('#hplus-result').isVisible(), 'hplus-result sichtbar').toBe(true);
      const ph = (await page.locator('#hplus-ph').textContent()).trim();
      expect(parseFloat(ph.replace(',', '.')), `hplus-ph="${ph}"`).toBeGreaterThanOrEqual(6.9);
      expect(parseFloat(ph.replace(',', '.')), `hplus-ph="${ph}"`).toBeLessThanOrEqual(7.1);
      expect(pageErrors, 'keine JS-Laufzeitfehler').toEqual([]);
    } finally {
      await context.close();
    }
  }, 60000);

  it('Stöchiometrie: Preset Wasserbildung füllt die Gleichung', async (ctx) => {
    if (skipped) return ctx.skip();
    const context = await browser.newContext({ colorScheme: 'light' });
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', (e) => pageErrors.push(String(e).slice(0, 120)));
    try {
      await page.addInitScript(themeInitSrc('light'));
      await page.goto(`http://127.0.0.1:${port}/stoechiometrie-rechner/`, {
        waitUntil: 'networkidle',
        timeout: 25000,
      });
      await page.waitForTimeout(500); // LazyLoader lädt calc-presets async
      await page.click('#btn-preset-water');
      await page.waitForTimeout(300);
      const eq = await page.locator('#reaction-1').inputValue();
      expect(eq, `reaction-1="${eq}"`).toMatch(/H2.*O2|O2.*H2/);
      expect(pageErrors, 'keine JS-Laufzeitfehler').toEqual([]);
    } finally {
      await context.close();
    }
  }, 60000);
});
