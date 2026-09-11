/**
 * Quiz-Kontrast-Audit (docs/quiz-user-stories.md › US-10).
 *
 * Prüft rechnerisch (WCAG 2.1 relative Luminanz), dass die kritischen
 * Text-/Hintergrund-Paare der Quiz-Seite in ALLEN DREI Themes
 * (light via CSS-Fallbacks, dark + contrast via [data-theme]-Variablen)
 * AA erfüllen: ≥ 4.5:1 normaler Text, ≥ 3:1 UI-Grenzen.
 *
 * Anlass (2026-09-11): dark-mode.css definierte keine der Quiz-Variablen —
 * im Dark-Theme blieben Quiz-Karten weiß; im Contrast-Theme resultierte
 * Weiß-auf-Gelb (Buttons) mit ~1.2:1.
 */

const fs = require('fs');
const path = require('path');

const QUIZ_CSS = path.join(__dirname, '..', 'myhugoapp', 'static', 'css', 'quiz-system.css');
const QUIZ_USER_CSS = path.join(
  __dirname,
  '..',
  'myhugoapp',
  'static',
  'css',
  'quiz-user-system.css'
);
const DARK_CSS = path.join(__dirname, '..', 'myhugoapp', 'static', 'css', 'dark-mode.css');

// ── WCAG 2.1 Hilfsfunktionen ─────────────────────────────────────
function parseColor(str) {
  let s = str.trim().toLowerCase();
  if (s.startsWith('#')) {
    if (s.length === 4) s = '#' + s[1] + s[1] + s[2] + s[2] + s[3] + s[3];
    return [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16));
  }
  const m = s.match(/rgba?\(([^)]+)\)/);
  if (m)
    return m[1]
      .split(',')
      .slice(0, 3)
      .map((v) => parseFloat(v));
  throw new Error('Unbekannte Farbe: ' + str);
}

function luminance(rgb) {
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(fg, bg) {
  const [l1, l2] = [luminance(parseColor(fg)), luminance(parseColor(bg))].sort((a, b) => b - a);
  return (l1 + 0.05) / (l2 + 0.05);
}

/** Alle Var-Definitionen je Theme aus dark-mode.css ziehen (Basis- UND Quiz-Blöcke mergen). */
function themeVars(css, selector) {
  const vars = {};
  let searchFrom = 0;
  for (;;) {
    const idx = css.indexOf(selector, searchFrom);
    if (idx === -1) break;
    searchFrom = idx + selector.length;
    const open = css.indexOf('{', idx);
    let depth = 1;
    let end = open + 1;
    while (depth > 0 && end < css.length) {
      if (css[end] === '{') depth++;
      if (css[end] === '}') depth--;
      end++;
    }
    const block = css.slice(open, end);
    for (const m of block.matchAll(/--([\w-]+):\s*([^;]+);/g)) {
      vars['--' + m[1]] = m[2].trim();
    }
  }
  expect(Object.keys(vars).length).toBeGreaterThan(0);
  return vars;
}

const darkCss = fs.readFileSync(DARK_CSS, 'utf8');
const LIGHT = {
  '--card-bg': '#ffffff',
  '--question-bg': '#f8f9fa',
  '--question-text': '#2c3e50',
  '--option-bg': '#ffffff',
  '--option-hover': '#f0f8ff',
  '--option-selected': '#e3f2fd',
  '--option-border': '#767676',
  '--timer-bg': '#fff3cd',
  '--timer-text': '#856404',
  '--timer-warning-bg': '#f8d7da',
  '--timer-warning-text': '#721c24',
  '--critical-bg': '#c82333',
  '--critical-text': '#ffffff',
  '--hint-bg': '#e3f2fd',
  '--settings-bg': '#f8f9fa',
  '--progress-bg': '#e0e0e0',
  '--correct-bg': '#d4edda',
  '--correct-border': '#28a745',
  '--correct-text': '#333333',
  '--correct-text-strong': '#155724',
  '--incorrect-bg': '#f8d7da',
  '--incorrect-border': '#dc3545',
  '--incorrect-text': '#333333',
  '--incorrect-text-strong': '#721c24',
  '--secondary-bg': '#6c757d',
  '--primary-color': '#2c3e50',
  '--text-color': '#333333',
  '--text-secondary': '#666666',
  '--accent-color': '#1b6aa5',
  '--accent-dark': '#14568a',
  '--accent-solid': '#1b6aa5',
  '--border-color': '#767676',
};
const DARK = { ...LIGHT, ...themeVars(darkCss, "[data-theme='dark'] {") };
const CONTRAST = { ...LIGHT, ...themeVars(darkCss, "[data-theme='contrast'] {") };

/** Kritische Paare: [Beschreibung, Vordergrund, Hintergrund, Minimum] */
const PAIRS = (t) => [
  ['Frage-Text auf Fragenkarte', t['--question-text'], t['--question-bg'], 4.5],
  ['Antwort-Text auf Option', t['--text-color'], t['--option-bg'], 4.5],
  ['Antwort-Text auf Option (hover)', t['--text-color'], t['--option-hover'], 4.5],
  ['Antwort-Text auf Option (selektiert)', t['--text-color'], t['--option-selected'], 4.5],
  ['Timer-Warnung', t['--timer-warning-text'], t['--timer-warning-bg'], 4.5],
  ['Timer kritisch', t['--critical-text'], t['--critical-bg'], 4.5],
  ['Einstellungs-Beschreibung', t['--text-secondary'], t['--settings-bg'], 4.5],
  ['Feedback richtig', t['--correct-text-strong'], t['--correct-bg'], 4.5],
  ['Feedback falsch', t['--incorrect-text-strong'], t['--incorrect-bg'], 4.5],
  ['Antwort-Text im korrekten Zustand', t['--correct-text'], t['--correct-bg'], 4.5],
  ['Antwort-Text im falschen Zustand', t['--incorrect-text'], t['--incorrect-bg'], 4.5],
  ['Sekundär-Button-Text', '#ffffff', t['--secondary-bg'], 4.5],
  ['Fragennummer-Text auf Flächen-Akzent', '#ffffff', t['--accent-solid'], 4.5],
  ['Primär-Button-Text auf Flächen-Akzent', '#ffffff', t['--accent-solid'], 4.5],
  ['Option-Grenze als UI (Normalzustand)', t['--option-border'], t['--option-bg'], 3],
  ['Header-Trennlinie als UI (user-panel)', t['--border-color'], t['--card-bg'], 3],
];

describe.each([
  ['light', LIGHT],
  ['dark', DARK],
  ['contrast', CONTRAST],
])('US-10: Quiz-Kontrast im %s-Theme (WCAG 2.1 AA)', (name, theme) => {
  test.each(PAIRS(theme))('%s', (label, fg, bg, min) => {
    const ratio = contrast(fg, bg);
    if (ratio < min) {
      throw new Error(`${label}: ${fg} auf ${bg} = ${ratio.toFixed(2)}:1 (min ${min})`);
    }
    expect(ratio).toBeGreaterThanOrEqual(min);
  });
});

describe('US-10: Theme-Abdeckung der Quiz-Variablen', () => {
  const REQUIRED = [
    '--question-bg',
    '--question-text',
    '--option-bg',
    '--option-hover',
    '--option-selected',
    '--option-border',
    '--timer-bg',
    '--timer-text',
    '--hint-bg',
    '--settings-bg',
    '--progress-bg',
    '--correct-bg',
    '--correct-border',
    '--incorrect-bg',
    '--incorrect-border',
  ];

  test.each([
    ['dark', DARK],
    ['contrast', CONTRAST],
  ])('%s-Theme definiert alle Quiz-Variablen (keine hellen Fallback-Leichen)', (name, theme) => {
    for (const v of REQUIRED) {
      expect(theme).toHaveProperty(v);
    }
  });

  test('Contrast-Theme: Buttons sind schwarz auf weiß (nicht weiß auf gelb)', () => {
    expect(darkCss).toMatch(
      /\[data-theme='contrast'\] \.quiz-button-primary \{[^}]*background: #ffffff;[^}]*color: #000000;/s
    );
  });

  test('Light-Fallbacks in beiden Quiz-CSS sind AA-tauglich (#1b6aa5 statt #3498db)', () => {
    for (const file of [QUIZ_CSS, QUIZ_USER_CSS]) {
      const css = fs.readFileSync(file, 'utf8');
      expect(css).not.toMatch(/--accent-color, #3498db/);
      expect(css).not.toMatch(/--accent-dark, #2980b9/);
    }
  });
});
