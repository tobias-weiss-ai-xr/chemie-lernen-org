/**
 * Unit Tests for calc-massmass (Mass-to-Mass Calculator)
 * Tests calcMassMassValue: m₁ → n₁ → n₂ → m₂
 *   n₁ = m₁ / M₁
 *   n₂ = n₁ × (ν₂/ν₁)
 *   m₂ = n₂ × M₂
 * Imports pure function from source via module.exports.
 */

const { calcMassMassValue } = require('../myhugoapp/static/js/calculators/calc-massmass.js');

describe('calc-massmass — calcMassMassValue', () => {
  test('normal case: m₁=10, M₁=2, M₂=4, ν₁=1, ν₂=2', () => {
    const result = calcMassMassValue(10, 2, 4, 1, 2);
    expect(result).toEqual({
      n1: 5, // 10 / 2
      n2: 10, // 5 * (2/1)
      m2: 40, // 10 * 4
    });
  });

  test('m₁=0 → all results are 0', () => {
    const result = calcMassMassValue(0, 2, 4, 1, 2);
    expect(result).toEqual({ n1: 0, n2: 0, m2: 0 });
  });

  test('M₁=0 → division by zero on n₁ = m₁/M₁ → Infinity', () => {
    const result = calcMassMassValue(10, 0, 4, 1, 2);
    expect(result.n1).toBe(Infinity);
    expect(result.n2).toBe(Infinity);
    expect(result.m2).toBe(Infinity);
  });

  test('ν₁=0 → division by zero on n₂ = n₁ × (ν₂/0) → Infinity', () => {
    const result = calcMassMassValue(10, 2, 4, 0, 2);
    expect(result.n1).toBe(5);
    expect(result.n2).toBe(Infinity);
    expect(result.m2).toBe(Infinity);
  });

  test('negative m₁ → negative n₁, n₂, m₂', () => {
    const result = calcMassMassValue(-10, 2, 4, 1, 2);
    expect(result.n1).toBe(-5);
    expect(result.n2).toBe(-10);
    expect(result.m2).toBe(-40);
  });

  test('negative M₁ → positive n₁ = m₁/M₁ when both negative', () => {
    const result = calcMassMassValue(-10, -2, 4, 1, 2);
    expect(result.n1).toBe(5);
    expect(result.n2).toBe(10);
    expect(result.m2).toBe(40);
  });

  test('fractional ν ratio (ν₁=3, ν₂=2)', () => {
    const result = calcMassMassValue(12, 2, 3, 3, 2);
    expect(result.n1).toBe(6); // 12/2
    expect(result.n2).toBe(4); // 6 * (2/3)
    expect(result.m2).toBe(12); // 4 * 3
  });

  test('large values', () => {
    const result = calcMassMassValue(1e6, 2, 4, 1, 2);
    expect(result.n1).toBe(500000);
    expect(result.n2).toBe(1000000);
    expect(result.m2).toBe(4000000);
  });

  test('very small (fractional) m₁', () => {
    const result = calcMassMassValue(0.001, 2, 4, 1, 2);
    expect(result.n1).toBeCloseTo(0.0005, 7);
    expect(result.n2).toBeCloseTo(0.001, 7);
    expect(result.m2).toBeCloseTo(0.004, 7);
  });

  test('ν₁ = ν₂ → n₂ = n₁, ratio is 1', () => {
    const result = calcMassMassValue(10, 2, 5, 3, 3);
    expect(result.n1).toBe(5);
    expect(result.n2).toBe(5);
    expect(result.m2).toBe(25);
  });

  test('negative ν₁ and ν₂ both negative → ratio positive', () => {
    const result = calcMassMassValue(10, 2, 4, -1, -2);
    expect(result.n1).toBe(5);
    expect(result.n2).toBe(10);
    expect(result.m2).toBe(40);
  });

  test('M₂ does not affect n₁ or n₂, only m₂', () => {
    const result1 = calcMassMassValue(10, 2, 4, 1, 2);
    const result2 = calcMassMassValue(10, 2, 10, 1, 2);
    expect(result1.n1).toBe(result2.n1);
    expect(result1.n2).toBe(result2.n2);
    expect(result1.m2).toBe(40);
    expect(result2.m2).toBe(100);
  });

  test('ν₂=0 → n₂=0 → m₂=0', () => {
    const result = calcMassMassValue(10, 2, 4, 1, 0);
    expect(result.n1).toBe(5);
    expect(result.n2).toBe(0);
    expect(result.m2).toBe(0);
  });

  test('m₁=NaN → all results NaN', () => {
    const result = calcMassMassValue(NaN, 2, 4, 1, 2);
    expect(result.n1).toBeNaN();
    expect(result.n2).toBeNaN();
    expect(result.m2).toBeNaN();
  });

  test('module exports the expected function', () => {
    expect(calcMassMassValue).toBeDefined();
    expect(typeof calcMassMassValue).toBe('function');
  });
});

// ── DOM-Flows (jsdom): calcMassMass-Handler ───────────────────────────
const {
  calcMassMass,
  toggleMassMassExplanation,
} = require('../myhugoapp/static/js/calculators/calc-massmass.js');
global.showToast = jest.fn();
global.saveToHistory = jest.fn();

describe('calcMassMass — DOM-Handler', () => {
  beforeEach(() => {
    global.showToast.mockClear();
    document.body.innerHTML = [
      'mass-r',
      'mm-r',
      'mm-p',
      'mass-coeff-r',
      'mass-coeff-p',
      'mass-result',
      'mass-preview',
      'mass-mass-explanation',
    ]
      .map((id) => `<div id="${id}"></div>`)
      .join('');
  });

  test('m₁=10, M₁=2, M₂=4, ν=1:2 → m₂=40 wird angezeigt', () => {
    document.getElementById('mass-r').value = '10';
    document.getElementById('mm-r').value = '2';
    document.getElementById('mm-p').value = '4';
    document.getElementById('mass-coeff-r').value = '1';
    document.getElementById('mass-coeff-p').value = '2';
    calcMassMass();
    expect(document.getElementById('mass-result').style.display).toBe('block');
    expect(document.getElementById('mass-result').innerHTML).toContain('40');
  });

  test('ungültige Werte → Toast', () => {
    document.getElementById('mass-r').value = 'abc';
    calcMassMass();
    expect(global.showToast).toHaveBeenCalled();
  });

  test('toggleMassMassExplanation wechselt die Anzeige', () => {
    const ex = document.getElementById('mass-mass-explanation');
    ex.style.display = 'none';
    toggleMassMassExplanation();
    expect(ex.style.display).toBe('block');
  });
});
