/**
 * Unit Tests for calc-molmol (Mol-to-Mol Calculator)
 * Tests calcMolMolValue: n₂ = n₁ × (ν₂/ν₁)
 * Imports pure function from source via module.exports.
 */

const { calcMolMolValue } = require('../myhugoapp/static/js/calculators/calc-molmol.js');

describe('calc-molmol — calcMolMolValue', () => {
  test('normal case: 2 mol reactant, ν₁=1, ν₂=3 → 6 mol product', () => {
    expect(calcMolMolValue(2, 1, 3)).toBe(6);
  });

  test('n₁=0 → result is 0 regardless of coefficients', () => {
    expect(calcMolMolValue(0, 2, 3)).toBe(0);
    expect(calcMolMolValue(0, 1, 100)).toBe(0);
    expect(calcMolMolValue(0, 5, 1)).toBe(0);
  });

  test('v₁=0 → division by zero returns Infinity', () => {
    const result = calcMolMolValue(5, 0, 3);
    expect(result).toBe(Infinity);
  });

  test('v₂=0 → result is 0', () => {
    expect(calcMolMolValue(5, 2, 0)).toBe(0);
  });

  test('negative n₁ → produces negative result', () => {
    const result = calcMolMolValue(-2, 1, 3);
    expect(result).toBe(-6);
  });

  test('negative v₁ → produces negative result', () => {
    const result = calcMolMolValue(2, -1, 3);
    expect(result).toBe(-6);
  });

  test('negative v₂ → produces negative result', () => {
    const result = calcMolMolValue(2, 1, -3);
    expect(result).toBe(-6);
  });

  test('all negative values → positive result (double negative)', () => {
    const result = calcMolMolValue(-2, -1, 3);
    expect(result).toBe(6);
  });

  test('fractional coefficients (ν₁=2, ν₂=1 → ratio 0.5)', () => {
    const result = calcMolMolValue(4, 2, 1);
    expect(result).toBe(2);
  });

  test('fractional n₁ input (0.5 mol)', () => {
    const result = calcMolMolValue(0.5, 1, 2);
    expect(result).toBe(1);
  });

  test('large values without overflow', () => {
    const result = calcMolMolValue(1e6, 1, 2);
    expect(result).toBe(2e6);
  });

  test('very small values (near zero)', () => {
    const result = calcMolMolValue(1e-10, 1, 2);
    expect(result).toBe(2e-10);
  });

  test('coefficient ratio where v₂ > v₁ produces amplification', () => {
    const result = calcMolMolValue(1, 1, 10);
    expect(result).toBe(10);
  });

  test('coefficient ratio where v₂ < v₁ produces attenuation', () => {
    const result = calcMolMolValue(10, 10, 1);
    expect(result).toBe(1);
  });

  test('v₁ = v₂ → result equals n₁', () => {
    expect(calcMolMolValue(7, 3, 3)).toBe(7);
  });

  test('n₁ = NaN is handled as NaN', () => {
    expect(calcMolMolValue(NaN, 1, 2)).toBeNaN();
  });

  test('fractional coefficients (ν₁=3, ν₂=2)', () => {
    const result = calcMolMolValue(6, 3, 2);
    expect(result).toBe(4);
  });

  test('module exports the expected function', () => {
    expect(calcMolMolValue).toBeDefined();
    expect(typeof calcMolMolValue).toBe('function');
  });
});
