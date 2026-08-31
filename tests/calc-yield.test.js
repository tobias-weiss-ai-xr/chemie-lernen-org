/**
 * Comprehensive Unit Tests for calc-yield.js
 * Tests calcYieldValue (pure function) and calcYield / toggleYieldExplanation (DOM).
 *
 * Strategy: require() for pure function + eval patching for DOM functions.
 */

const fs = require('fs');
const path = require('path');

const SRC_PATH = path.join(__dirname, '..', 'myhugoapp/static/js/calculators/calc-yield.js');

let calcYieldValue;

beforeAll(() => {
  const mod = require(SRC_PATH);
  calcYieldValue = mod.calcYieldValue;
});

beforeEach(() => {
  const _code = fs.readFileSync(SRC_PATH, 'utf8');
  const _noExport = _code.replace(/if \(typeof module[^]+$/s, '');
  const _patched = _noExport.replace(/^function\s+(\w+)/gm, 'globalThis.$1 = function $1');
  (0, eval)(_patched);

  // Stub external dependencies
  global.showToast = jest.fn();
  global.saveToHistory = jest.fn();
});

afterEach(() => {
  delete global.showToast;
  delete global.saveToHistory;
});

describe('calcYieldValue — pure function', () => {
  test('100% yield (act === theo)', () => {
    expect(calcYieldValue(50, 50)).toBe(100);
  });

  test('50% yield', () => {
    expect(calcYieldValue(40, 20)).toBe(50);
  });

  test('75% yield', () => {
    expect(calcYieldValue(80, 60)).toBe(75);
  });

  test('25% yield', () => {
    expect(calcYieldValue(100, 25)).toBe(25);
  });

  test('0% yield (no product)', () => {
    expect(calcYieldValue(100, 0)).toBe(0);
  });

  test('over 100% yield (impure product / measurement error)', () => {
    expect(calcYieldValue(50, 60)).toBeGreaterThan(100);
    expect(calcYieldValue(50, 60)).toBe(120);
  });

  test('200% yield (act = 2× theo)', () => {
    expect(calcYieldValue(50, 100)).toBe(200);
  });

  test('fractional yield — 33.33...%', () => {
    const result = calcYieldValue(30, 10);
    expect(result).toBeCloseTo(33.3333, 3);
  });

  test('small theoretical value', () => {
    const result = calcYieldValue(0.1, 0.05);
    expect(result).toBe(50);
  });

  test('large values without overflow', () => {
    const result = calcYieldValue(1e6, 5e5);
    expect(result).toBe(50);
  });

  test('act > theo returns > 100 (no upper bound clamping)', () => {
    expect(calcYieldValue(10, 15)).toBe(150);
    expect(calcYieldValue(10, 50)).toBe(500);
  });

  test('act = 0 returns 0 regardless of theo', () => {
    expect(calcYieldValue(1, 0)).toBe(0);
    expect(calcYieldValue(1000, 0)).toBe(0);
  });

  test('theo = 0 returns Infinity (division by zero)', () => {
    const result = calcYieldValue(0, 5);
    expect(result).toBe(Infinity);
  });

  test('both zero returns NaN (0/0)', () => {
    expect(calcYieldValue(0, 0)).toBeNaN();
  });

  test('NaN input propagates', () => {
    expect(calcYieldValue(NaN, 10)).toBeNaN();
    expect(calcYieldValue(10, NaN)).toBeNaN();
  });

  test('module exports the expected function', () => {
    expect(calcYieldValue).toBeDefined();
    expect(typeof calcYieldValue).toBe('function');
  });
});

describe('calcYield — DOM-dependent', () => {
  function setYieldInputs(theo, act) {
    document.getElementById('yield-theo').value = String(theo);
    document.getElementById('yield-act').value = String(act);
  }

  beforeEach(() => {
    document.body.innerHTML = `
      <input id="yield-theo" type="text" />
      <input id="yield-act" type="text" />
      <div id="yield-result" style="display:none"></div>
      <div id="yield-explanation" style="display:none"></div>
    `;
  });

  test('normal yield calculation', () => {
    setYieldInputs(50, 25);
    calcYield();

    expect(showToast).not.toHaveBeenCalled();
    const resultEl = document.getElementById('yield-result');
    expect(resultEl.style.display).toBe('block');
    expect(resultEl.innerHTML).toContain('50.00%');
    expect(resultEl.innerHTML).toContain('50 g');
    expect(resultEl.innerHTML).toContain('25 g');
    expect(saveToHistory).toHaveBeenCalledWith('Ausbeute', expect.stringContaining('50.00%'));
  });

  test('100% yield', () => {
    setYieldInputs(30, 30);
    calcYield();

    const html = document.getElementById('yield-result').innerHTML;
    expect(html).toContain('100.00%');
    // 80-100% range shows success message
    expect(html).toContain('Gut');
  });

  test('0% yield', () => {
    setYieldInputs(100, 0);
    calcYield();

    const html = document.getElementById('yield-result').innerHTML;
    expect(html).toContain('0.00%');
    // < 50% shows low yield warning
    expect(html).toContain('Niedrig');
  });

  test('yield > 100% shows impurity warning', () => {
    setYieldInputs(50, 75);
    calcYield();

    const html = document.getElementById('yield-result').innerHTML;
    expect(html).toContain('150.00%');
    expect(html).toContain('physikalisch unm');
  });

  test('yield in 80-100% range shows good yield message', () => {
    setYieldInputs(10, 9);
    calcYield();

    const html = document.getElementById('yield-result').innerHTML;
    expect(html).toContain('90.00%');
    expect(html).toContain('Gute Ausbeute');
  });

  test('missing theo input shows error toast', () => {
    setYieldInputs('', 25);
    calcYield();

    expect(showToast).toHaveBeenCalledWith('Bitte geben Sie alle Werte ein', 'error');
    expect(document.getElementById('yield-result').style.display).not.toBe('block');
  });

  test('missing act input shows error toast', () => {
    setYieldInputs(50, '');
    calcYield();

    expect(showToast).toHaveBeenCalledWith('Bitte geben Sie alle Werte ein', 'error');
  });

  test('theo <= 0 shows specific error toast', () => {
    setYieldInputs(0, 25);
    calcYield();

    expect(showToast).toHaveBeenCalledWith(
      'Die theoretische Ausbeute muss größer als 0 sein',
      'error'
    );
  });

  test('negative theo shows error toast', () => {
    setYieldInputs(-10, 25);
    calcYield();

    expect(showToast).toHaveBeenCalledWith(
      'Die theoretische Ausbeute muss größer als 0 sein',
      'error'
    );
  });

  test('theo > 0 but act can be negative (still computes)', () => {
    setYieldInputs(50, -10);
    calcYield();

    const resultEl = document.getElementById('yield-result');
    expect(resultEl.style.display).toBe('block');
    expect(resultEl.innerHTML).toContain('-20.00%');
  });

  test('very small theo value', () => {
    setYieldInputs(0.001, 0.0005);
    calcYield();

    const html = document.getElementById('yield-result').innerHTML;
    expect(html).toContain('50.00%');
  });

  test('large values', () => {
    setYieldInputs(1e6, 5e5);
    calcYield();

    const html = document.getElementById('yield-result').innerHTML;
    expect(html).toContain('50.00%');
  });

  test('step by step explanation button is present', () => {
    setYieldInputs(10, 5);
    calcYield();

    const html = document.getElementById('yield-result').innerHTML;
    expect(html).toContain('Schritt-f');
    expect(html).toContain('toggleYieldExplanation');
  });
});

describe('toggleYieldExplanation', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="yield-explanation" style="display:none"></div>
    `;
  });

  test('toggles from hidden to visible', () => {
    const el = document.getElementById('yield-explanation');
    expect(el.style.display).toBe('none');

    toggleYieldExplanation();
    expect(el.style.display).toBe('block');
  });

  test('toggles from visible to hidden', () => {
    const el = document.getElementById('yield-explanation');
    el.style.display = 'block';

    toggleYieldExplanation();
    expect(el.style.display).toBe('none');
  });

  test('does nothing when element is missing', () => {
    document.body.innerHTML = '';
    expect(() => toggleYieldExplanation()).not.toThrow();
  });
});

// ── DOM-Flows (jsdom): calcYield-Handler ──────────────────────────────
const {
  calcYield,
  toggleYieldExplanation,
} = require('../myhugoapp/static/js/calculators/calc-yield.js');
global.showToast = jest.fn();

describe('calcYield — DOM-Handler', () => {
  beforeEach(() => {
    global.showToast.mockClear();
    document.body.innerHTML = ['yield-theo', 'yield-act', 'yield-result', 'yield-explanation']
      .map((id) => `<div id="${id}"></div>`)
      .join('');
  });

  test('50 g real von 100 g theoretisch → 50 % werden angezeigt', () => {
    document.getElementById('yield-theo').value = '100';
    document.getElementById('yield-act').value = '50';
    calcYield();
    expect(document.getElementById('yield-result').style.display).toBe('block');
    expect(document.getElementById('yield-result').innerHTML).toContain('50');
  });

  test('unvollständige Eingabe → Toast, kein Ergebnis', () => {
    document.getElementById('yield-theo').value = '100';
    document.getElementById('yield-act').value = '';
    calcYield();
    expect(global.showToast).toHaveBeenCalled();
  });

  test('toggleYieldExplanation wechselt die Anzeige', () => {
    const ex = document.getElementById('yield-explanation');
    ex.style.display = 'none';
    toggleYieldExplanation();
    expect(ex.style.display).toBe('block');
  });
});
