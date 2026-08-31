/**
 * Landing-Page-Hero (3D-Molekül) — Regressionen aus df13dbdf/00e7b0b5.
 *
 * Verträge:
 *  - three.js ist SELF-HOSTED (Importmap auf /js/vendor/, kein CDN)
 *  - das Vendor-Paar three.module.min.js + three.core.min.js schifft zusammen
 *  - molecule-hero.js enthält den ResizeObserver-Guard (lastW/lastH) gegen
 *    die Endlos-Wachstumsschleife (scrollHeight driftete unendlich)
 *  - Canvas bekommt inline display:block gegen den Descender-Gap (Feed der
 *    ResizeObserver-Schleife bei fehlendem CSS)
 *  - Watchdog mit Fallback-Text existiert im Template
 */

const fs = require('fs');
const path = require('path');

const MYHUGO = path.join(__dirname, '..', 'myhugoapp');
const read = (...p) => fs.readFileSync(path.join(MYHUGO, ...p), 'utf8');
const exists = (...p) => fs.existsSync(path.join(MYHUGO, ...p));

describe('Landing-Page: three.js self-hosted', () => {
  const index = read('layouts', 'index.html');

  test('Importmap zeigt auf /js/vendor/three.module.min.js (kein CDN)', () => {
    const m = index.match(/<script type="importmap">([\s\S]*?)<\/script>/);
    expect(m).not.toBeNull();
    expect(m[1]).toContain('/js/vendor/three.module.min.js');
    expect(m[1]).not.toMatch(/https?:\/\/(unpkg|cdn|jsdelivr)/);
  });

  test('Vendor-Paar ist vollständig und plausibel (nicht leer/404-Seiten)', () => {
    for (const f of ['three.module.min.js', 'three.core.min.js']) {
      expect(exists('static', 'js', 'vendor', f)).toBe(true);
      const size = fs.statSync(path.join(MYHUGO, 'static', 'js', 'vendor', f)).size;
      expect(size).toBeGreaterThan(100000);
    }
  });

  test('keine CDN-Referenzen im Hero-Stack', () => {
    for (const file of [
      read('layouts', 'index.html'),
      read('static', 'js', 'molecule-hero.js'),
      read('static', 'js', 'molecule-data.js'),
      read('static', 'js', 'molecule-geometry.js'),
    ]) {
      expect(file).not.toMatch(/https?:\/\/(unpkg\.com|cdn\.jsdelivr\.net|cdnjs\.cloudflare\.com)/);
    }
  });
});

describe('molecule-hero.js: Wachstums-Schleifen-Guards', () => {
  const js = read('static', 'js', 'molecule-hero.js');

  test('ResizeObserver-Entprellung (lastW/lastH — kein Re-Render-Loop)', () => {
    expect(js).toContain('ResizeObserver');
    expect(js).toMatch(/w\s*===\s*lastW\s*&&\s*h\s*===\s*lastH/);
  });

  test('Canvas erhält inline display:block (Descender-Gap-Falle)', () => {
    expect(js).toMatch(/display\s*[:=]\s*'?block/);
  });

  test('Molekül-Datenverträge vorhanden (Dopamin als Startmolekül)', () => {
    const data = read('static', 'js', 'molecule-data.js');
    expect(data).toContain('Dopamin');
  });
});

describe('Watchdog-Fallback', () => {
  const index = read('layouts', 'index.html');

  test('Watchdog-Text + Link zum Molekül-Studio existieren', () => {
    expect(index).toContain('3D-Darstellung nicht verfügbar');
    expect(index).toContain('/molekuel-studio/');
  });

  test('molecule-hero.js ist als ES-Module eingebunden (Importmap-Konsistenz)', () => {
    expect(index).toMatch(
      /type="module"[^>]*molecule-hero\.js|molecule-hero\.js[^>]*type="module"/
    );
  });
});
