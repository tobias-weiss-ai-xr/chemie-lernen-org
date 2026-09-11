/**
 * Modulhandbuch-Seiten: Kontrast in light/dark/contrast (WCAG 2.1 AA).
 *
 * Anlass 2026-09-11: /modulhandbuecher/ nutzte --bg-card (nie definiert!)
 * statt --card-bg → Karten blieben im Dark-Theme WEISS, während der Text
 * über --text-primary (#c8e6c9) lief = 1,34:1. Zusätzlich: purpur-Akzente
 * (#9b59b6) ohne Dark-Override, #888/#555-Fallbacks unter AA.
 *
 * Strategie der Fixes:
 *   - dark-mode.css definiert jetzt systemisch --bg-card/--bg-card-header
 *     (13 Dateien nutzen sie mit Light-Fallbacks)
 *   - Modulhandbuch-Layouts nutzen var(--card-bg), var(--border-color),
 *     var(--text-*) und eine theme-fähige --mh-accent-Triole
 *
 * Diese Tests frieren die Quell-Kontrakte ein; Paar-Matrix wird aus
 * Layout-Style-Block + dark-mode.css-Variablen berechnet.
 */

const fs = require('fs');
const path = require('path');

const MY = path.join(__dirname, '..', 'myhugoapp');
const darkCss = fs.readFileSync(path.join(MY, 'static', 'css', 'dark-mode.css'), 'utf8');
const read = (p) => fs.readFileSync(p, 'utf8');

const indexLayout = read(path.join(MY, 'layouts', '_default', 'modulhandbuch-index.html'));
const moduleLayout = read(path.join(MY, 'layouts', 'modulhandbuch', 'module.html'));
const uniLayout = read(path.join(MY, 'layouts', 'modulhandbuch', 'uni.html'));

// CSS-/HTML-Kommentare entfernen (Verweise in Kommentaren sind keine Regeln)
const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/<!--[\s\S]*?-->/g, '');

// ── WCAG-Helfer ────────────────────────────────────────────────
function parseColor(c) {
  c = c.trim().toLowerCase();
  if (c[0] === '#') {
    if (c.length === 4) c = '#' + [...c.slice(1)].map((x) => x + x).join('');
    return [0, 2, 4].map((i) => parseInt(c.substr(i + 1, 2), 16));
  }
  const m = c.match(/rgba?\(([^)]+)\)/);
  if (m)
    return m[1]
      .split(',')
      .slice(0, 3)
      .map((x) => parseFloat(x));
  return null;
}
function luminance(hex) {
  const [r, g, b] = parseColor(hex).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(fg, bg) {
  const [l1, l2] = [luminance(fg), luminance(bg)].sort((a, b) => b - a);
  return (l1 + 0.05) / (l2 + 0.05);
}

// ── Theme-Variablen aus dark-mode.css (alle Blöcke je Theme mergen) ──
function themeVars(selector) {
  const vars = {};
  let from = 0;
  for (;;) {
    const idx = darkCss.indexOf(selector, from);
    if (idx === -1) break;
    from = idx + selector.length;
    const open = darkCss.indexOf('{', idx);
    let depth = 1;
    let end = open + 1;
    while (depth > 0 && end < darkCss.length) {
      if (darkCss[end] === '{') depth++;
      if (darkCss[end] === '}') depth--;
      end++;
    }
    for (const m of darkCss.slice(open, end).matchAll(/--([\w-]+):\s*([^;]+);/g)) {
      vars['--' + m[1]] = m[2].trim();
    }
  }
  return vars;
}

const DARK = themeVars("[data-theme='dark'] {");
const CONTRAST = themeVars("[data-theme='contrast'] {");

// Layout-Style-Blöcke: --mh-accent je Theme ziehen
function accentFrom(layout, scopeRegex) {
  const m = layout.match(scopeRegex);
  return m ? m[1].trim() : null;
}

describe('Modulhandbuch: systemische Theme-Variablen', () => {
  test('--bg-card/--bg-card-header sind je Theme definiert (13 Nutzungsstellen)', () => {
    // Die Theme-Blöcke existieren und definieren die Kern-Variablen
    expect(DARK['--card-bg']).toBeTruthy();
    expect(CONTRAST['--card-bg']).toBeTruthy();
    expect(DARK['--bg-card']).toBeTruthy();
    expect(DARK['--bg-card-header']).toBeTruthy();
    expect(CONTRAST['--bg-card']).toBeTruthy();
  });

  test('Kein --bg-card-Fallback mehr in den Modulhandbuch-Layouts (Karten nutzen --card-bg)', () => {
    for (const [name, src] of [
      ['index', stripComments(indexLayout)],
      ['module', stripComments(moduleLayout)],
      ['uni', stripComments(uniLayout)],
    ]) {
      expect(src.includes('--bg-card')).toBe(false);
      expect(src.includes('--card-bg')).toBe(true);
    }
  });

  test('--mh-accent-Triole existiert mit Dark-Override in allen drei Layouts', () => {
    for (const [name, src] of [
      ['index', indexLayout],
      ['module', moduleLayout],
      ['uni', uniLayout],
    ]) {
      expect(src).toMatch(/--mh-accent:\s*#9b59b6/);
      expect(src).toMatch(/\[data-theme='dark'\][^{]*\{[^}]*--mh-accent:\s*#ce93d8/);
      // Kein nackter Purpur-Akzent mehr ohne Var
      expect(src.match(/#9b59b6/g).length).toBe(1);
    }
  });

  test('Keine #888/#555-Hartkodierungen mehr in den Modulhandbuch-Layouts', () => {
    for (const [name, src] of [
      ['index', indexLayout],
      ['module', moduleLayout],
      ['uni', uniLayout],
    ]) {
      expect(src).not.toMatch(/#888(?![0-9a-f])/);
      expect(src).not.toMatch(/color:\s*#555/);
    }
  });
});

describe('Modulhandbuch: WCAG-Paare je Theme', () => {
  const themes = [
    {
      name: 'light',
      cardBg: '#ffffff',
      textPrimary: '#333333',
      textMuted: '#767676',
      accent: '#9b59b6',
      accentText: '#7b1fa2',
      accentSoft: '#f3e8ff',
      border: '#767676',
    },
    {
      name: 'dark',
      cardBg: DARK['--card-bg'],
      textPrimary: DARK['--text-primary'],
      textMuted: DARK['--text-muted'],
      accent: '#ce93d8',
      accentText: DARK
        ? accentFrom(
            indexLayout,
            /\[data-theme='dark'\]\s*#mh-app\s*\{[^}]*--mh-accent-text:\s*([^;]+);/
          )
        : null,
      accentSoft: accentFrom(
        indexLayout,
        /\[data-theme='dark'\]\s*#mh-app\s*\{[^}]*--mh-accent-soft:\s*([^;]+);/
      ),
      border: DARK['--border-color'],
    },
    {
      name: 'contrast',
      cardBg: CONTRAST['--card-bg'],
      textPrimary: CONTRAST['--text-primary'],
      textMuted: CONTRAST['--text-muted'],
      accent: '#ce93d8',
      accentText: '#ce93d8',
      accentSoft: '#3a2060',
      border: CONTRAST['--border-color'],
    },
  ];

  test.each(themes)('%s: Karten-Text, Meta, Akzent, Chips, Border ≥ AA', (t) => {
    const pairs = [
      ['Karten-Link (text-primary)', t.textPrimary, t.cardBg, 4.5],
      ['Meta-Text (text-muted)', t.textMuted, t.cardBg, 4.5],
      ['Akzent-Text (hover/code/link)', t.accent, t.cardBg, 4.5],
      ['Chip-Text auf Chip-BG', t.accentText, t.accentSoft, 4.5],
      ['Karten-Border als UI', t.border, t.cardBg, 3],
      ['Modul-Akzent-Rand als UI', t.accent, t.cardBg, 3],
    ];
    for (const [label, fg, bg, min] of pairs) {
      const ratio = contrast(fg, bg);
      if (ratio < min) {
        throw new Error(
          `${t.name} — ${label}: ${fg} auf ${bg} = ${ratio.toFixed(2)}:1 (min ${min})`
        );
      }
      expect(ratio).toBeGreaterThanOrEqual(min);
    }
  });
});
