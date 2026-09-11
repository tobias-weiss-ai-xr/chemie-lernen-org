/**
 * Sitewide-A11y-Kontrakte (A11y-Pass 2, 2026-09-11).
 *
 * Anlass: Sitewide-Kontrast-Scan (20 Seiten × light/dark) fand 80
 * WCAG-Fails in 4 Klassen:
 *   1. Weiße Flächen im Dark-Theme (undefinierte Vars mit Light-Fallback:
 *      --item-bg, --score-bg, --bg-input … in progress-tracker/quiz-user-
 *      system/quiz-system/entity-index/curricula)
 *   2. data-theme-Blindheit: kg-legend.css + wissennetz.md hatten nur
 *      @media(prefers-color-scheme:dark) — das greift NIE, wenn JS
 *      data-theme='dark' setzt (Default-Theme ist dark!)
 *   3. Buttons/Badges < 4.5:1 (btn #388e3c→#2e7d32, danger #d9534f→
 *      #c9302c, label-info #5bc0de→#14808c, quiz-btn-primary #4a90d9→
 *      accent-solid, skip-link #4caf50→#1b6aa5)
 *   4. Harzkodierte Dark-Textfarben (#1b5e20, #555, #999 …) auf
 *      hellen Inline-Panels (quiz-container #fff!)
 *
 * Diese Tests frieren die Kontrakte ein: alle themenabhängigen Vars
 * müssen je Theme definiert sein; die AA-Farbwerte dürfen nicht
 * zurückgeändert werden.
 */

const fs = require('fs');
const path = require('path');

const MY = path.join(__dirname, '..', 'myhugoapp');
const read = (p) => fs.readFileSync(path.join(MY, p), 'utf8');

const custom = read(path.join('static', 'css', 'custom.css'));
const darkCss = read(path.join('static', 'css', 'dark-mode.css'));

function lum(hex) {
  const c = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4]
    .map((i) => parseInt(c.substr(i, 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(fg, bg) {
  const [l1, l2] = [lum(fg), lum(bg)].sort((a, b) => b - a);
  return (l1 + 0.05) / (l2 + 0.05);
}

// Alle Vorkommen eines Theme-Blocks mergen (letzter gewinnt pro Var)
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

function rootVars(css) {
  const vars = {};
  for (const m of css.matchAll(/--([\w-]+):\s*([^;]+);/g)) vars['--' + m[1]] = m[2].trim();
  return vars;
}

const DARK = themeVars("[data-theme='dark'] {");
const CONTRAST = themeVars("[data-theme='contrast'] {");

// Vars, die A11y-Pass 2 je Theme definiert (Flächen/Text im Dark)
const SURFACE_VARS = [
  '--item-bg',
  '--overview-bg',
  '--circle-bg',
  '--score-bg',
  '--score-text',
  '--achievement-bg',
  '--header-bg',
  '--row-hover',
  '--detail-bg',
  '--review-bg',
  '--bg-input',
  '--bg-hover',
  '--bg-tag',
  '--qs-bg',
  '--tag-bg',
  '--tag-fg',
  '--tag-border',
  '--badge-color',
  '--text-graph',
  '--bg-body',
  '--alert-warning-bg',
];

describe('A11y-Pass 2: Theme-Variablen-Kontrakte', () => {
  test.each(SURFACE_VARS)('%s ist in dark UND contrast definiert', (v) => {
    expect(DARK[v]).toBeTruthy();
    expect(CONTRAST[v]).toBeTruthy();
  });

  test('kg-legend + wissennetz nutzen data-theme statt nur prefers-color-scheme', () => {
    const kg = read(path.join('static', 'css', 'kg-legend.css'));
    expect(kg).toMatch(/\[data-theme='dark'\]/);
    const wissen = read(path.join('content', 'wissennetz.md'));
    expect(wissen).toMatch(/\[data-theme='dark'\]/);
  });

  test('quiz.html: kein hartkodiertes #fff-Panel mehr', () => {
    const quiz = read(path.join('layouts', '_default', 'quiz.html'));
    expect(quiz).toMatch(/\.quiz-container\s*\{\s*background:\s*var\(--card-bg/);
    expect(quiz).toMatch(/\.quiz-btn-primary\s*\{\s*background:\s*var\(--accent-solid/);
    expect(quiz).not.toMatch(/background:\s*#4a90d9/);
  });

  test('practice-generator: Score-/Difficulty-Texte AA in light', () => {
    const css = read(path.join('static', 'css', 'practice-generator.css'));
    // alt: #90ee90 (1.27), #ffb6c1 (1.48), #28a745 (3.13), #ffc107 (1.63) auf #f4f2ec
    expect(css).not.toMatch(/#90ee90|#ffb6c1/);
    expect(contrast('#1e7e34', '#f4f2ec')).toBeGreaterThanOrEqual(4.5);
    expect(contrast('#b71c1c', '#f4f2ec')).toBeGreaterThanOrEqual(4.5);
    expect(contrast('#7a6000', '#f4f2ec')).toBeGreaterThanOrEqual(4.5);
  });
});

describe('A11y-Pass 2: WCAG-Werte (light Theme)', () => {
  const cases = [
    ['weiß auf btn-primary #2e7d32', '#ffffff', '#2e7d32', 4.5],
    ['weiß auf btn-danger #c9302c', '#ffffff', '#c9302c', 4.5],
    ['weiß auf label-info #14808c', '#ffffff', '#14808c', 4.5],
    ['weiß auf skip-link #1b6aa5', '#ffffff', '#1b6aa5', 4.5],
    ['--text-muted #626e7b auf Karten-Weiß', '#626e7b', '#fcfbf7', 4.5],
  ];
  test.each(cases)('%s ≥ 4.5:1', (_label, fg, bg, min) => {
    expect(contrast(fg, bg)).toBeGreaterThanOrEqual(min);
  });

  test('Runde 2: Hardcodes bleiben ersetzt', () => {
    const dash = read(path.join('static', 'css', 'progress-dashboard.css'));
    expect(dash).not.toMatch(/#7f8c8d|#95a5a6|background:\s*#fff;/);
    expect(custom).toMatch(/color: var\(--text-muted, #626e7b\) !important/);
    expect(custom).toMatch(/\.calculator-panel\s*\{\s*background: var\(--card-bg/);
    const promo = read(path.join('layouts', 'shortcodes', 'periodic-table-promo-widget.html'));
    expect(promo).toMatch(/\.pt-promo-badge\s*\{[^}]*background: #0c6b62/s);
    expect(promo).not.toMatch(/0d9488, #0f766e/);
    const wissen = read(path.join('content', 'wissennetz.md'));
    expect(wissen).not.toMatch(/kg-portal-count\{[^}]*#888/);
  });

  test('Screen-Reader-Utilities vorhanden (Navbar-Label/Loading-Leaks)', () => {
    expect(custom).toMatch(/\.sr-only,\s*\.visually-hidden\s*\{/);
  });

  test('dark: Karten-Text ≥ 4.5:1 auf Dark-Flächen', () => {
    const card = DARK['--card-bg'];
    const surface = DARK['--item-bg'];
    for (const [label, fg] of [
      ['score-text', DARK['--score-text']],
      ['tag-fg', DARK['--tag-fg']],
      ['badge-color', DARK['--badge-color']],
      ['text-graph', DARK['--text-graph']],
    ]) {
      expect(contrast(fg, surface)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(fg, card)).toBeGreaterThanOrEqual(4.5);
    }
  });
});
