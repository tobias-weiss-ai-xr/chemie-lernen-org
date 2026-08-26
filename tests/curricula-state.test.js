/**
 * Part B Task 5 — curricula-state helpers: canonical entity links
 * (Slugs.entityUrl), KMK operator highlighting, umlaut slug fallback.
 */
const fs = require('fs');
const path = require('path');

const MODULE_PATH = path.resolve(
  __dirname,
  '..',
  'myhugoapp',
  'static',
  'js',
  'curricula-state.js'
);

function loadModule() {
  delete window.CurriculaState;
  window.fetch = jest.fn(() =>
    Promise.resolve({ ok: true, json: () => Promise.resolve({ states: [] }) })
  );
  if (!window.AbortSignal.timeout) {
    window.AbortSignal.timeout = () => new AbortController().signal;
  }
  const src = fs.readFileSync(MODULE_PATH, 'utf8');
  const script = document.createElement('script');
  script.textContent = src;
  document.body.appendChild(script);
}

beforeEach(() => {
  document.body.innerHTML = '<div id="curricula-state-app"></div>';
  delete globalThis.Slugs;
  loadModule();
});

describe('CurriculaState.toSlug (Part B Task 5)', () => {
  test('transliterates umlauts like the canonical Slugs util', () => {
    expect(window.CurriculaState.toSlug('Säure-Base-Reaktion')).toBe('saeure-base-reaktion');
    expect(window.CurriculaState.toSlug('Übergangsmetalle')).toBe('uebergangsmetalle');
    expect(window.CurriculaState.toSlug('Maßanalyse')).toBe('massanalyse');
  });
});

describe('CurriculaState.entityHref (Part B Task 5)', () => {
  test('prefers globalThis.Slugs.entityUrl when available', () => {
    globalThis.Slugs = {
      entityUrl: (name) => '/entity/' + name.toLowerCase().replace(/\s+/g, '-') + '/',
    };
    loadModule();
    expect(window.CurriculaState.entityHref('Calvin-Zyklus')).toBe('/entity/calvin-zyklus/');
  });

  test('falls back to /entity/ + toSlug without Slugs', () => {
    expect(window.CurriculaState.entityHref('Säure-Base-Reaktion')).toBe(
      '/entity/saeure-base-reaktion/'
    );
  });
});

describe('CurriculaState.highlightOperators (Part B Task 5)', () => {
  test('wraps the first KMK operator verb in <strong class="kg-operator">', () => {
    const out = window.CurriculaState.highlightOperators(
      'Die Schülerinnen und Schüler beschreiben den Aufbau des Atomkerns.'
    );
    expect(out).toContain('<strong class="kg-operator">beschreiben</strong>');
    expect(out.indexOf('<strong')).toBeLessThan(out.indexOf('beschreiben', 20) >= 0 ? 40 : 9999);
  });

  test('is case-insensitive (sentence start)', () => {
    const out = window.CurriculaState.highlightOperators('Erklären Sie die Elektrolyse.');
    expect(out).toContain('<strong class="kg-operator">Erklären</strong>');
  });

  test('respects word boundaries (no partial-word matches)', () => {
    const out = window.CurriculaState.highlightOperators('Beschreibend analysieren die SuS Daten.');
    expect(out).not.toContain('kg-operator');
  });

  test('marks only the first occurrence', () => {
    const out = window.CurriculaState.highlightOperators('Vergleichen und bewerten Sie.');
    expect(out.match(/kg-operator/g)).toHaveLength(1);
  });

  test('leaves text without operators untouched', () => {
    const out = window.CurriculaState.highlightOperators('Grundlagen der Chemie.');
    expect(out).toBe('Grundlagen der Chemie.');
  });

  test('all 18 KMK verbs are present', () => {
    expect(window.CurriculaState.KMK_OPERATORS).toHaveLength(18);
  });
});
