/**
 * UXF-060: Mobile-Viewport-Scan (375px — iPhone-Klasse).
 *
 * Prüft im echten Chromium über die 14 Layout-Familien-Seiten:
 *  - Horizontaler Overflow (WCAG 1.4.10 Reflow: kein Seitwärts-Scrollen)
 *    plus die Top-Offender-Elemente, die selbst breiter als der Viewport sind.
 *  - Kompletter UX-Check aus UXF-059 IM MOBILEN Layout (Responsive-CSS kann
 *    Touch-Targets/Headings/Labels anders rendern als am Desktop).
 *
 * Themes: light + dark (parallel, je eigener Kontext).
 * Skipped ohne hugo-extended/Chromium (wie contrast-rendered).
 */

import { describe, beforeAll, afterAll, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
// Browser-seitige Quellen (DOM-Strings) liegen in der Fixture — node-env-Files
// dürfen laut tests/vitest-project-lists.test.js keine DOM-Referenzen enthalten.
import { UX_CHECKS_SRC, OVERFLOW_SRC, themeInitSrc } from './fixtures/browser-scan-sources.mjs';

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

const COMBOS = [
  ['light', 'light'],
  ['dark', 'dark'],
];

const PAGES = [
  { path: '/', wait: 1200 },
  { path: '/themenbereiche/', wait: 400 },
  { path: '/themenbereiche/einfuehrung-chemie/was-ist-chemie/', wait: 400 },
  { path: '/quiz/', wait: 400 },
  { path: '/lernpfade/', wait: 400 },
  { path: '/lernvideos/', wait: 400 },
  { path: '/molare-masse-rechner/', wait: 400 },
  { path: '/ph-rechner/', wait: 400 },
  { path: '/stoechiometrie-rechner/', wait: 400 },
  { path: '/ki-assistent/', wait: 700 },
  { path: '/curricula/', wait: 400 },
  { path: '/modulhandbuecher/', wait: 400 },
  { path: '/dashboard/', wait: 400 },
  { path: '/impressum/', wait: 400 },
];

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

const LIMITS = {
  focusless: 0,
  smallTargets: 0,
  imgsNoAlt: 0,
  unlabeledInputs: 0,
  headingSkips: 0,
  unnamedIconButtons: 0,
};

describe('Mobile-Scan 375px (Overflow + UX-Checks im mobilen Layout)', () => {
  it(`kein Horizontal-Overflow & 0 UX-Findings auf ${PAGES.length} Seiten × ${COMBOS.length} Themes`, async (ctx) => {
    if (skipped) return ctx.skip();
    expect(browser, 'Chromium verfügbar').toBeTruthy();
    const perCombo = await Promise.all(
      COMBOS.map(async ([dataTheme, osScheme]) => {
        const context = await browser.newContext({
          colorScheme: osScheme,
          viewport: { width: 375, height: 812 },
          isMobile: true,
          hasTouch: true,
          userAgent:
            'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        });
        const page = await context.newPage();
        const findings = [];
        try {
          await page.addInitScript(themeInitSrc(dataTheme));
          for (const p of PAGES) {
            const res = await page
              .goto(`http://127.0.0.1:${port}${p.path}`, { waitUntil: 'load', timeout: 25000 })
              .catch(() => null);
            if (!res || res.status() >= 400) continue;
            await page.waitForTimeout(p.wait);
            for (const o of await page.evaluate(OVERFLOW_SRC)) {
              findings.push({ combo: dataTheme, page: p.path, key: 'overflow', item: o });
            }
            const r = await page.evaluate(UX_CHECKS_SRC);
            for (const key of Object.keys(LIMITS)) {
              for (const item of r[key])
                findings.push({ combo: dataTheme, page: p.path, key, item });
            }
          }
        } finally {
          await context.close();
        }
        return findings;
      })
    );
    const findings = perCombo.flat();
    const report = findings.map((f) => `[${f.combo} ${f.page}] ${f.key}: ${f.item}`).join('\n');
    expect(findings, `${findings.length} Mobile-Findings:\n${report}`).toEqual([]);
  }, 240000);
});
