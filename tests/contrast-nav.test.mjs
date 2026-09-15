/**
 * UXF-061: Gerenderter Kontrast-Scan für THEME-SCOPED NAV/HEADER-
 * Komponenten (Dropdown-Submenüs, Breadcrumb, Navbar-Suche) in allen Themes.
 *
 * Warum nicht der Ganzseiten-Scan (contrast-rendered / SCAN_SRC)?
 * Geschlossene Submenüs sind display:none — SCAN_SRC überspringt unsichtbare
 * und <1px-Elemente. Der Contrast-Theme-Bug „gelbe Links auf weißem
 * Dropdown" (Ratio ~1.05:1) war daher unsichtbar für UXF-058/059.
 *
 * FIX (site-chrome.css): [data-theme='contrast']-Zwillinge für .dropdown-menu,
 * .navbar-form und .breadcrumb ergänzt (vorher nur light + dark).
 *
 * Dieses Test liest computed style DIREKT (auch verdeckte Elemente gelten in
 * der Kaskade) und erzwingt damit, dass jede theme-scoped Nav-/Header-Regel
 * einen Kontrast-Zwilling in jedem Theme hat.
 *
 * Themes: dark (Baseline) + contrast (Regression). Läuft im node-Projekt
 * (kein DOM-Env — Browser via Playwright), skipped ohne hugo-extended.
 */
import { describe, beforeAll, afterAll, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
// Browser-seitige Strings müssen in der Fixture liegen (node-env-Guard).
import { NAV_CHECKS_SRC, themeInitSrc } from './fixtures/browser-scan-sources.mjs';

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
};

const THEMES = ['dark', 'contrast'];
const PAGES = [
  { path: '/', wait: 800 }, // Startseite: Dropdown + Breadcrumb
  { path: '/themenbereiche/', wait: 400 },
  { path: '/stoechiometrie-rechner/', wait: 400 }, // Breadcrumb auf Rechner
  { path: '/quiz/', wait: 400 },
];

let server;
let browser;
let port;
let skipped = false;

function hugoAvailable() {
  try {
    const r = spawnSync('hugo', ['version'], { timeout: 10000 });
    if (r.status !== 0) return false;
    return /extended/i.test(String(r.stdout));
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

describe('NAV-/Header-Kontrast in allen Themes (gerendert, WCAG AA)', () => {
  it(`0 Verstöße in Submenü/Breadcrumb/Nav-Suche auf ${PAGES.length} Seiten × ${THEMES.length} Themes`, async (ctx) => {
    if (skipped) return ctx.skip();
    expect(browser, 'Chromium verfügbar').toBeTruthy();
    const perTheme = await Promise.all(
      THEMES.map(async (theme) => {
        const context = await browser.newContext({
          colorScheme: theme === 'dark' ? 'dark' : 'dark',
        });
        const page = await context.newPage();
        const violations = [];
        try {
          await page.addInitScript(themeInitSrc(theme));
          for (const p of PAGES) {
            const res = await page
              .goto(`http://127.0.0.1:${port}${p.path}`, { waitUntil: 'load', timeout: 25000 })
              .catch(() => null);
            if (!res || res.status() >= 400) {
              violations.push({
                theme,
                page: p.path,
                sel: `HTTP ${res ? res.status() : 'network-error'}`,
                text: 'Seite nicht erreichbar',
                fg: '-',
                bg: '-',
                ratio: 0,
                need: '-',
              });
              continue;
            }
            await page.waitForTimeout(p.wait);
            const found = await page.evaluate(NAV_CHECKS_SRC);
            for (const v of found) violations.push({ theme, page: p.path, ...v });
          }
        } finally {
          await context.close();
        }
        return violations;
      })
    );
    const violations = perTheme.flat();
    const report = violations
      .map(
        (v) =>
          `[${v.theme} ${v.page}] ${v.sel} "${v.text}" ${v.fg} auf ${v.bg} = ${v.ratio}:1 (nötig ${v.need}:1)`
      )
      .join('\n');
    expect(violations, `${violations.length} NAV-Kontrast-Verletzungen:\n${report}`).toEqual([]);
  }, 240000);
});
