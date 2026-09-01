/**
 * Comprehensive Unit Tests for calc-limiting.js
 * Tests calcLimitingValue (pure function) and calcLimiting / toggleLimitingExplanation (DOM).
 *
 * Strategy: require() for pure function + eval patching for DOM functions.
 */

const fs = require('fs');
const path = require('path');

const SRC_PATH = path.join(__dirname, '..', 'myhugoapp/static/js/calculators/calc-limiting.js');

let calcLimitingValue;

beforeAll(() => {
  const mod = require(SRC_PATH);
  calcLimitingValue = mod.calcLimitingValue;
});

beforeEach(() => {
  const _code = fs.readFileSync(SRC_PATH, 'utf8');
  const _noExport = _code.replace(/if \(typeof module[^]+$/s, '');
  const _patched = _noExport.replace(/^function\s+(\w+)/gm, 'globalThis.$1 = function $1');
  (0, eval)(_patched);

  global.showToast = vi.fn();
  global.saveToHistory = vi.fn();
});

afterEach(() => {
  delete global.showToast;
  delete global.saveToHistory;
});

describe('calcLimitingValue — pure function', () => {
  test('reagent 1 is limiting (n1 < n2)', () => {
    const r = calcLimitingValue(5, 50, 10, 50);
    expect(r.n1).toBe(0.1);
    expect(r.n2).toBe(0.2);
    expect(r.limiting).toBe(1);
    expect(r.name).toBe('Reagenz 1');
    expect(r.excess).toBeCloseTo(0.1, 10);
  });

  test('reagent 2 is limiting (n2 < n1)', () => {
    const r = calcLimitingValue(10, 50, 5, 50);
    expect(r.n1).toBe(0.2);
    expect(r.n2).toBe(0.1);
    expect(r.limiting).toBe(2);
    expect(r.name).toBe('Reagenz 2');
    expect(r.excess).toBeCloseTo(0.1, 10);
  });

  test('equal moles — n1 < n2 is false, so limiting = 2', () => {
    const r = calcLimitingValue(10, 50, 10, 50);
    expect(r.n1).toBe(r.n2);
    expect(r.n1).toBe(0.2);
    expect(r.limiting).toBe(2);
    expect(r.excess).toBe(0);
  });

  test('excess calculation is correct when n1 < n2', () => {
    const r = calcLimitingValue(2, 40, 6, 60);
    expect(r.n1).toBe(0.05);
    expect(r.n2).toBe(0.1);
    expect(r.limiting).toBe(1);
    expect(r.excess).toBeCloseTo(0.05, 5);
  });

  test('excess calculation is correct when n2 < n1', () => {
    const r = calcLimitingValue(6, 60, 2, 40);
    expect(r.n1).toBe(0.1);
    expect(r.n2).toBe(0.05);
    expect(r.limiting).toBe(2);
    expect(r.excess).toBeCloseTo(0.05, 5);
  });

  test('identical masses and molar masses = equal moles', () => {
    const r = calcLimitingValue(10, 10, 10, 10);
    expect(r.n1).toBe(1);
    expect(r.n2).toBe(1);
    expect(r.limiting).toBe(2);
    expect(r.excess).toBe(0);
  });

  test('different molar masses — smaller mass can have more moles', () => {
    const r = calcLimitingValue(2, 2, 50, 50);
    expect(r.n1).toBe(1);
    expect(r.n2).toBe(1);
    expect(r.excess).toBe(0);
  });

  test('reagent 1 vastly more mass => reagent 2 is limiting', () => {
    const r = calcLimitingValue(100, 1, 1, 100);
    expect(r.n1).toBe(100);
    expect(r.n2).toBe(0.01);
    expect(r.limiting).toBe(2);
    expect(r.excess).toBeCloseTo(99.99, 2);
  });

  test('reagent 2 vastly more mass => reagent 1 is limiting', () => {
    const r = calcLimitingValue(1, 100, 100, 1);
    expect(r.n1).toBe(0.01);
    expect(r.n2).toBe(100);
    expect(r.limiting).toBe(1);
    expect(r.excess).toBeCloseTo(99.99, 2);
  });

  test('zero mass for reagent 1 gives n1=0, limiting=1', () => {
    const r = calcLimitingValue(0, 50, 10, 50);
    expect(r.n1).toBe(0);
    expect(r.n2).toBe(0.2);
    expect(r.limiting).toBe(1);
    expect(r.excess).toBeCloseTo(0.2, 10);
  });

  test('zero mass for reagent 2 gives n2=0, limiting=2 (since 0 < n1)', () => {
    const r = calcLimitingValue(10, 50, 0, 50);
    expect(r.n1).toBe(0.2);
    expect(r.n2).toBe(0);
    expect(r.limiting).toBe(2);
    expect(r.excess).toBeCloseTo(0.2, 10);
  });

  test('both masses zero gives equal zero moles, limiting=2', () => {
    const r = calcLimitingValue(0, 50, 0, 50);
    expect(r.n1).toBe(0);
    expect(r.n2).toBe(0);
    expect(r.limiting).toBe(2);
    expect(r.excess).toBe(0);
  });

  test('negative mass for reagent 1 yields negative n1, limiting=1', () => {
    const r = calcLimitingValue(-10, 50, 10, 50);
    expect(r.n1).toBe(-0.2);
    expect(r.n2).toBe(0.2);
    expect(r.limiting).toBe(1);
    expect(r.excess).toBeCloseTo(0.4, 10);
  });

  test('negative molar mass yields negative n', () => {
    const r = calcLimitingValue(10, -50, 10, 50);
    expect(r.n1).toBe(-0.2);
    expect(r.n2).toBe(0.2);
    expect(r.limiting).toBe(1);
  });

  test('zero molar mass yields Infinity', () => {
    const r = calcLimitingValue(10, 0, 10, 50);
    expect(r.n1).toBe(Infinity);
    expect(r.n2).toBe(0.2);
    expect(r.limiting).toBe(2);
  });

  test('NaN propagation', () => {
    const r = calcLimitingValue(NaN, 50, 10, 50);
    expect(r.n1).toBeNaN();
    // NaN < anything is always false, so n2(0.2) < n1(NaN) is false → limiting = 2
    expect(r.limiting).toBe(2);
  });

  test('fractional masses', () => {
    const r = calcLimitingValue(0.5, 2, 1.5, 3);
    expect(r.n1).toBe(0.25);
    expect(r.n2).toBe(0.5);
    expect(r.limiting).toBe(1);
  });

  test('module exports the expected function', () => {
    expect(calcLimitingValue).toBeDefined();
    expect(typeof calcLimitingValue).toBe('function');
  });
});

describe('calcLimiting — DOM-dependent', () => {
  function setInputs(m1, M1, m2, M2) {
    document.getElementById('lim-m1').value = String(m1);
    document.getElementById('lim-mm1').value = String(M1);
    document.getElementById('lim-m2').value = String(m2);
    document.getElementById('lim-mm2').value = String(M2);
  }

  beforeEach(() => {
    document.body.innerHTML = `
      <input id="lim-m1" type="text" />
      <input id="lim-mm1" type="text" />
      <input id="lim-m2" type="text" />
      <input id="lim-mm2" type="text" />
      <div id="limit-result" style="display:none"></div>
      <div id="limiting-explanation" style="display:none"></div>
    `;
  });

  test('normal calc — reagent 1 limiting', () => {
    setInputs(5, 50, 10, 50);
    calcLimiting();

    expect(showToast).not.toHaveBeenCalled();
    const resultEl = document.getElementById('limit-result');
    expect(resultEl.style.display).toBe('block');
    expect(resultEl.innerHTML).toContain('Limitierend');
    expect(resultEl.innerHTML).toContain('Reagenz 1');
    expect(resultEl.innerHTML).toContain('0.1000');
    expect(resultEl.innerHTML).toContain('0.2000');
    expect(saveToHistory).toHaveBeenCalledWith(
      'Limitierendes Reagenz',
      expect.stringContaining('Reagenz 1')
    );
  });

  test('normal calc — reagent 2 limiting', () => {
    setInputs(10, 50, 5, 50);
    calcLimiting();

    const resultEl = document.getElementById('limit-result');
    expect(resultEl.innerHTML).toContain('Reagenz 2');
    expect(saveToHistory).toHaveBeenCalledWith(
      'Limitierendes Reagenz',
      expect.stringContaining('Reagenz 2')
    );
  });

  test('equal moles — reagent 2 limiting (defaults to 2)', () => {
    setInputs(10, 50, 10, 50);
    calcLimiting();

    const resultEl = document.getElementById('limit-result');
    expect(resultEl.innerHTML).toContain('Reagenz 2');
  });

  test('excess is included in result', () => {
    setInputs(5, 50, 20, 50);
    calcLimiting();

    const html = document.getElementById('limit-result').innerHTML;
    expect(html).toContain('berschuss');
  });

  test('missing input shows error toast', () => {
    setInputs('', 50, 10, 50);
    calcLimiting();

    expect(showToast).toHaveBeenCalledWith('Bitte geben Sie alle Werte ein', 'error');
  });

  test('NaN input shows error toast', () => {
    setInputs('abc', 50, 10, 50);
    calcLimiting();

    expect(showToast).toHaveBeenCalledWith('Bitte geben Sie alle Werte ein', 'error');
  });

  test('M1 <= 0 shows specific error toast', () => {
    setInputs(10, 0, 10, 50);
    calcLimiting();

    expect(showToast).toHaveBeenCalledWith('Die molare Masse muss größer als 0 sein', 'error');
  });

  test('negative molar mass shows error toast', () => {
    setInputs(10, -1, 10, 50);
    calcLimiting();

    expect(showToast).toHaveBeenCalledWith('Die molare Masse muss größer als 0 sein', 'error');
  });

  test('M2 <= 0 shows error toast', () => {
    setInputs(10, 50, 10, 0);
    calcLimiting();

    expect(showToast).toHaveBeenCalledWith('Die molare Masse muss größer als 0 sein', 'error');
  });

  test('step-by-step explanation button present', () => {
    setInputs(5, 50, 10, 50);
    calcLimiting();

    const html = document.getElementById('limit-result').innerHTML;
    expect(html).toContain('Schritt-f');
    expect(html).toContain('toggleLimitingExplanation');
  });

  test('PDF export button present', () => {
    setInputs(5, 50, 10, 50);
    calcLimiting();

    const html = document.getElementById('limit-result').innerHTML;
    expect(html).toContain('PDF');
  });
});

describe('toggleLimitingExplanation — DOM toggle', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="limiting-explanation" style="display:none"></div>
    `;
  });

  test('toggles from hidden to visible', () => {
    const el = document.getElementById('limiting-explanation');
    expect(el.style.display).toBe('none');

    toggleLimitingExplanation();
    expect(el.style.display).toBe('block');
  });

  test('toggles from visible to hidden', () => {
    const el = document.getElementById('limiting-explanation');
    el.style.display = 'block';

    toggleLimitingExplanation();
    expect(el.style.display).toBe('none');
  });

  test('does not throw when element is missing', () => {
    document.body.innerHTML = '';
    expect(() => toggleLimitingExplanation()).not.toThrow();
  });
});

// ── DOM-Flows (jsdom): calcLimiting-Handler ───────────────────────────
const {
  calcLimiting,
  toggleLimitingExplanation,
} = require('../myhugoapp/static/js/calculators/calc-limiting.js');
global.showToast = jest.fn();

describe('calcLimiting — DOM-Handler', () => {
  beforeEach(() => {
    global.showToast.mockClear();
    document.body.innerHTML = [
      'lim-m1',
      'lim-mm1',
      'lim-m2',
      'lim-mm2',
      'limit-result',
      'limiting-explanation',
    ]
      .map((id) => `<div id="${id}"></div>`)
      .join('');
  });

  test('Stoff 1 erschöpft zuerst → Ergebnis nennt Edukt 1 als Grenzreaktor', () => {
    document.getElementById('lim-m1').value = '10';
    document.getElementById('lim-mm1').value = '100'; // n₁ = 0.1
    document.getElementById('lim-m2').value = '10';
    document.getElementById('lim-mm2').value = '10'; // n₂ = 1
    calcLimiting();
    expect(document.getElementById('limit-result').style.display).toBe('block');
    expect(document.getElementById('limit-result').innerHTML).toContain('1');
  });

  test('ungültige Eingaben → Toast', () => {
    document.getElementById('lim-m1').value = 'x';
    calcLimiting();
    expect(global.showToast).toHaveBeenCalled();
  });

  test('toggleLimitingExplanation wechselt die Anzeige', () => {
    const ex = document.getElementById('limiting-explanation');
    ex.style.display = 'none';
    toggleLimitingExplanation();
    expect(ex.style.display).toBe('block');
  });
});
