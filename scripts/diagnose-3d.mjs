/* global document */
/**
 * Diagnose-Skript: 3D-Umgebungen + Spoke — Konsole, PageErrors,
 * fehlgeschlagene Requests, Canvas/WebGL-Status.
 * Usage: node scripts/diagnose-3d.mjs [url ...]
 */
import { chromium } from '@playwright/test';

const TARGETS = process.argv.slice(2).length
  ? process.argv.slice(2)
  : [
      'https://chemie-lernen.org/molekuel-studio/',
      'https://chemie-lernen.org/virtuelles-labor/',
      'https://chemie-lernen.org/perioden-system-der-elemente/',
      'https://hubs.chemie-lernen.org/spoke/',
    ];

const browser = await chromium.launch({
  headless: true,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});

for (const url of TARGETS) {
  console.log(`\n════════ ${url} ════════`);
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await ctx.newPage();

  const consoleMsgs = [];
  const pageErrors = [];
  const failedReqs = [];

  page.on('console', (msg) => {
    if (['error', 'warning'].includes(msg.type())) {
      consoleMsgs.push(`[${msg.type()}] ${msg.text().slice(0, 300)}`);
    }
  });
  page.on('pageerror', (err) => pageErrors.push(String(err).slice(0, 400)));
  page.on('requestfailed', (req) => {
    failedReqs.push(`${req.method()} ${req.url().slice(0, 140)} → ${req.failure()?.errorText}`);
  });
  page.on('response', (res) => {
    if (res.status() >= 400) {
      failedReqs.push(`${res.request().method()} ${res.url().slice(0, 140)} → HTTP ${res.status()}`);
    }
  });

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(9000); // 3D-Init + Asset-Loads abwarten

    const webgl = await page.evaluate(() => {
      const c = document.createElement('canvas');
      const gl = c.getContext('webgl2') || c.getContext('webgl');
      return gl ? `${gl.getParameter(gl.VERSION)}` : 'KEIN WEBGL';
    });
    const canvases = await page.evaluate(() =>
      [...document.querySelectorAll('canvas')].map((c) => ({
        w: c.width,
        h: c.height,
        cls: (c.className || '').slice(0, 60),
      }))
    );

    console.log('WebGL:', webgl);
    console.log('Canvases:', JSON.stringify(canvases));
    if (pageErrors.length) console.log('PAGE ERRORS:\n  ' + pageErrors.slice(0, 8).join('\n  '));
    else console.log('PageErrors: keine');
    if (consoleMsgs.length)
      console.log(
        `CONSOLE (${consoleMsgs.length}):\n  ` + consoleMsgs.slice(0, 12).join('\n  ')
      );
    else console.log('Console-Fehler: keine');
    if (failedReqs.length)
      console.log(`FEHLREQUESTS (${failedReqs.length}):\n  ` + failedReqs.slice(0, 12).join('\n  '));
    else console.log('Fehlrequests: keine');
  } catch (err) {
    console.log('NAV-FEHLER:', String(err).slice(0, 300));
  }
  await ctx.close();
}
await browser.close();
