/**
 * tests/lazy-loader.test.js — Tests für den LazyLoader
 * (Script-Loading mit Dedupe, Calculator-Registry, Sequenz-Garantien).
 * Quelle: myhugoapp/static/js/lazy-loader.js
 */
const LazyLoader = require('../myhugoapp/static/js/lazy-loader.js');

describe('LazyLoader.loadScript', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
    LazyLoader.loadedScripts.clear();
    LazyLoader.loadingScripts.clear();
  });

  test('hängt <script async> an den Head', () => {
    LazyLoader.loadScript('/js/x.js', 'x');
    const el = document.head.querySelector('script[src="/js/x.js"]');
    expect(el).not.toBeNull();
    expect(el.async).toBe(true);
    expect(el.id).toBe('x');
    expect(LazyLoader.loadingScripts.has('/js/x.js')).toBe(true);
  });

  test('onload → Promise resolved, State-Konsistenz', async () => {
    const p = LazyLoader.loadScript('/js/a.js', 'a');
    const el = document.head.querySelector('script[src="/js/a.js"]');
    el.onload();
    await expect(p).resolves.toBeUndefined();
    expect(LazyLoader.loadedScripts.has('a')).toBe(true);
    expect(LazyLoader.loadingScripts.has('/js/a.js')).toBe(false);
  });

  test('onerror → Promise rejected mit Pfad, State aufgeräumt', async () => {
    const p = LazyLoader.loadScript('/js/broken.js', 'broken');
    const el = document.head.querySelector('script[src="/js/broken.js"]');
    el.onerror();
    await expect(p).rejects.toThrow('Failed to load script: /js/broken.js');
    expect(LazyLoader.loadingScripts.has('/js/broken.js')).toBe(false);
    expect(LazyLoader.loadedScripts.has('broken')).toBe(false);
  });

  test('Dedupe: zweiter Call während des Ladens → gleiches Promise', () => {
    const p1 = LazyLoader.loadScript('/js/dup.js', 'dup');
    const p2 = LazyLoader.loadScript('/js/dup.js', 'dup');
    expect(p2).toBe(p1);
  });

  test('nach erfolgreichem Load → sofort aufgelöstes Promise', async () => {
    const p1 = LazyLoader.loadScript('/js/done.js', 'done');
    document.head.querySelector('script[src="/js/done.js"]').onload();
    await p1;
    const p2 = LazyLoader.loadScript('/js/done.js', 'done');
    await expect(p2).resolves.toBeUndefined();
  });
});

describe('LazyLoader.loadCalculator', () => {
  beforeEach(() => {
    LazyLoader.loadedScripts.clear();
    LazyLoader.loadingScripts.clear();
  });

  test('unbekannter Typ → rejects mit Fehler', async () => {
    await expect(LazyLoader.loadCalculator('existiert-nicht')).rejects.toThrow(
      'Unknown calculator type'
    );
  });

  test('lädt Skripte sequenziell in Registry-Reihenfolge', async () => {
    const calls = [];
    const orig = LazyLoader.loadScript;
    LazyLoader.loadScript = function (src, id) {
      calls.push(src);
      return Promise.resolve();
    };
    try {
      await LazyLoader.loadCalculator('werkzeuge');
    } finally {
      LazyLoader.loadScript = orig;
    }
    expect(calls).toEqual([
      '/js/calculators/calc-equation-parser.js',
      '/js/calculators/calc-element-lookup.js',
      '/js/calculators/calc-history.js',
    ]);
  });

  test('stoichiometry-Registry umfasst 10 Skripte', async () => {
    const calls = [];
    const orig = LazyLoader.loadScript;
    LazyLoader.loadScript = function (src) {
      calls.push(src);
      return Promise.resolve();
    };
    try {
      await LazyLoader.loadCalculator('stoichiometry');
    } finally {
      LazyLoader.loadScript = orig;
    }
    expect(calls.length).toBe(10);
    expect(calls[0]).toBe('/js/calculators/calc-presets.js');
  });

  test('bricht die Kette ab, wenn ein Skript fehlschlägt', async () => {
    const calls = [];
    const orig = LazyLoader.loadScript;
    LazyLoader.loadScript = function (src) {
      calls.push(src);
      return src.endsWith('calc-element-lookup.js')
        ? Promise.reject(new Error('boom'))
        : Promise.resolve();
    };
    try {
      await expect(LazyLoader.loadCalculator('werkzeuge')).rejects.toThrow('boom');
      expect(calls).toEqual([
        '/js/calculators/calc-equation-parser.js',
        '/js/calculators/calc-element-lookup.js',
      ]);
    } finally {
      LazyLoader.loadScript = orig;
    }
  });
});

describe('LazyLoader.init / preloadCritical', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    LazyLoader.loadedScripts.clear();
    LazyLoader.loadingScripts.clear();
  });

  test('preloadCritical ohne Container ist ein No-op', () => {
    expect(() => LazyLoader.preloadCritical()).not.toThrow();
  });

  test('init ohne Container und ohne IntersectionObserver ist ein No-op', () => {
    expect(() => LazyLoader.init()).not.toThrow();
  });
});
