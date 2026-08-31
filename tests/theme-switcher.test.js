/**
 * Theme-Switcher (Hell / Dunkel / Kontrast) — Regression 2026-08-31.
 *
 * Der Header-Switcher wurde auf kompakte Chips verkleinert (fc3d21cb).
 * Dabei gilt eine bewusste Architektur-Regel: dark-mode.css und die
 * Kontrast-Overrides sind FARB-ONLY — sämtliche Größen (font-size,
 * padding, width/height) liegen ausschließlich in custom.css. Diese
 * Suite frißt beide Verträge ein, plus die FOUC-/Speicher-Logik.
 */

const fs = require('fs');
const path = require('path');

const MYHUGO = path.join(__dirname, '..', 'myhugoapp');
const read = (...p) => fs.readFileSync(path.join(MYHUGO, ...p), 'utf8');

describe('Theme-Switcher Größen (custom.css — alleinige Quelle)', () => {
  const css = read('static', 'css', 'custom.css');

  test('Chips: 0.74rem + padding 3px 8px (fc3d21cb)', () => {
    const m = css.match(/\.theme-option-text\s*\{[^}]*\}/);
    expect(m).not.toBeNull();
    expect(m[0]).toContain('0.74rem');
    expect(m[0]).toContain('3px 8px');
  });

  test('Header-Icon: padding 2px !important, Icon 18px', () => {
    const m = css.match(/\.theme-toggle-header\s*\{[^}]*\}/);
    expect(m).not.toBeNull();
    expect(m[0]).toContain('padding: 2px !important');
    const icon = css.match(/\.theme-toggle-header i\s*\{[^}]*\}/);
    expect(icon).not.toBeNull();
    expect(icon[0]).toContain('18px');
  });

  test('Switcher-Label: 0.7rem', () => {
    const m = css.match(/\.theme-switcher-label\s*\{[^}]*\}/);
    expect(m).not.toBeNull();
    expect(m[0]).toContain('0.7rem');
  });
});

describe('Dark-Mode-Overrides sind color-only (Architektur-Regel)', () => {
  // Größenänderungen gehören NUR in custom.css — sonst driften die
  // Themes auseinander und die Chips passen nicht mehr in den Header.
  const dark = read('static', 'css', 'dark-mode.css');
  const SIZE_PROPS = /(?:^|;)\s*(font-size|padding|margin|width|height)\s*:/;

  function themeBlocks(src, attr) {
    // Blocker zu [data-theme='x'] .theme-…-Selektoren (bis zur schließenden Klammer)
    const out = [];
    const re = new RegExp(`\\[data-theme='${attr}'\\][^{]*\\.theme-[^{]*\\{[^}]*\\}`, 'g');
    for (const m of src.matchAll(re)) out.push(m[0]);
    return out;
  }

  test.each(['dark', 'contrast'])(
    '[%s] .theme-*-Blocks enthalten keine Größen-Properties',
    (attr) => {
      const blocks = themeBlocks(dark, attr);
      expect(blocks.length).toBeGreaterThanOrEqual(2); // es GIBT Theme-Overrides
      for (const block of blocks) {
        expect({ block, violation: SIZE_PROPS.test(block) }).toEqual({
          block,
          violation: false,
        });
      }
    }
  );
});

describe('Theme-Persistenz & FOUC-Schutz', () => {
  test('theme-switcher.js: localStorage-Schlüssel "theme", data-theme wird gesetzt', () => {
    const js = read('static', 'js', 'theme-switcher.js');
    expect(js).toContain("THEME_KEY = 'theme'");
    expect(js).toContain("setAttribute('data-theme'");
    expect(js).toContain('localStorage.getItem(THEME_KEY)');
    expect(js).toContain('localStorage.setItem(THEME_KEY');
  });

  test('head.html: FOUC-Inline-Script setzt data-theme vor dem Paint', () => {
    const head = read('layouts', 'partials', 'head.html');
    // Muss VOR dem Stylesheet-Render passieren: inline script mit data-theme
    expect(head).toMatch(/localStorage\.getItem\('theme'\)/);
    expect(head).toMatch(/setAttribute\('data-theme'/);
  });

  test('baseof.html bindet theme-switcher.js ein', () => {
    const baseof = read('layouts', '_default', 'baseof.html');
    expect(baseof).toContain('/js/theme-switcher.js');
  });

  test('config.toml: custom.css + dark-mode.css mit Cache-Busting ?v=', () => {
    const cfg = read('config.toml');
    const m = cfg.match(/custom_css\s*=\s*\[[^\]]*\]/);
    expect(m).not.toBeNull();
    expect(m[0]).toContain('css/custom.css?v=');
    expect(m[0]).toContain('css/dark-mode.css?v=');
  });
});
