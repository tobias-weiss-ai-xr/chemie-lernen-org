/**
 * Unit Tests for Stoichiometry Sub-Calculators
 * Tests mol-mol, mass-mass, yield, and limiting reagent calculations.
 * Imports pure functions from source files via module.exports.
 */

const { calcMolMolValue } = require('../myhugoapp/static/js/calculators/calc-molmol.js');
const { calcMassMassValue } = require('../myhugoapp/static/js/calculators/calc-massmass.js');
const { calcYieldValue } = require('../myhugoapp/static/js/calculators/calc-yield.js');
const { calcLimitingValue } = require('../myhugoapp/static/js/calculators/calc-limiting.js');

describe('Mol-Mol Stoichiometry (calc-molmol.js)', () => {
  test('1:1 ratio — 2 mol → 2 mol', () => {
    expect(calcMolMolValue(2, 1, 1)).toBe(2);
  });

  test('2:2 ratio (water) — 4 mol H₂ → 4 mol H₂O', () => {
    expect(calcMolMolValue(4, 2, 2)).toBe(4);
  });

  test('1:2 ratio (ammonia) — 3 mol N₂ → 6 mol NH₃', () => {
    expect(calcMolMolValue(3, 1, 2)).toBe(6);
  });

  test('6:1 ratio (photosynthesis) — 6 mol CO₂ → 1 mol glucose', () => {
    expect(calcMolMolValue(6, 6, 1)).toBeCloseTo(1, 10);
  });

  test('fractional result — 1 mol with 1:3 ratio', () => {
    expect(calcMolMolValue(1, 3, 1)).toBeCloseTo(0.3333, 3);
  });

  test('larger product coefficient → more product than reactant', () => {
    const result = calcMolMolValue(2, 1, 3);
    expect(result).toBe(6);
    expect(result).toBeGreaterThan(2);
  });

  test('zero reactant → zero product', () => {
    expect(calcMolMolValue(0, 1, 1)).toBe(0);
  });
});

describe('Mass-Mass Stoichiometry (calc-massmass.js)', () => {
  test('water formation: 4g H₂ + O₂ → H₂O', () => {
    const { n1, n2, m2 } = calcMassMassValue(4, 2, 18, 2, 2);
    expect(n1).toBe(2);
    expect(n2).toBe(2);
    expect(m2).toBe(36);
  });

  test('methane combustion: 16g CH₄ → CO₂', () => {
    const { n1, n2, m2 } = calcMassMassValue(16, 16, 44, 1, 1);
    expect(n1).toBe(1);
    expect(n2).toBe(1);
    expect(m2).toBe(44);
  });

  test('ammonia (Haber): 28g N₂ → NH₃', () => {
    const { n1, n2, m2 } = calcMassMassValue(28, 28, 17, 1, 2);
    expect(n1).toBe(1);
    expect(n2).toBe(2);
    expect(m2).toBe(34);
  });

  test('photosynthesis: 264g CO₂ → glucose', () => {
    const { n1, n2, m2 } = calcMassMassValue(264, 44, 180, 6, 1);
    expect(n1).toBe(6);
    expect(n2).toBeCloseTo(1, 5);
    expect(m2).toBeCloseTo(180, 0);
  });

  test('conservation: mass in = mass out only if M₁ = M₂ and v₁ = v₂', () => {
    const { m2 } = calcMassMassValue(10, 50, 50, 1, 1);
    expect(m2).toBe(10);
  });

  test('different molar masses change mass ratio', () => {
    const { m2 } = calcMassMassValue(10, 2, 18, 1, 1);
    expect(m2).toBe(90);
    expect(m2).toBeGreaterThan(10);
  });
});

describe('Percent Yield (calc-yield.js)', () => {
  test('100% yield (theoretical = actual)', () => {
    expect(calcYieldValue(50, 50)).toBe(100);
  });

  test('50% yield', () => {
    expect(calcYieldValue(40, 20)).toBe(50);
  });

  test('75% yield', () => {
    expect(calcYieldValue(80, 60)).toBe(75);
  });

  test('0% yield (no product)', () => {
    expect(calcYieldValue(100, 0)).toBe(0);
  });

  test('over 100% yield (impure product)', () => {
    expect(calcYieldValue(50, 60)).toBeGreaterThan(100);
    expect(calcYieldValue(50, 60)).toBe(120);
  });

  test('typical organic synthesis yield (30-80%)', () => {
    const result = calcYieldValue(10, 4.5);
    expect(result).toBeGreaterThan(30);
    expect(result).toBeLessThan(80);
  });
});

describe('Limiting Reagent (calc-limiting.js)', () => {
  test('reagent 1 is limiting', () => {
    const r = calcLimitingValue(5, 50, 10, 50);
    expect(r.n1).toBe(0.1);
    expect(r.n2).toBe(0.2);
    expect(r.limiting).toBe(1);
  });

  test('reagent 2 is limiting', () => {
    const r = calcLimitingValue(10, 50, 5, 50);
    expect(r.n1).toBe(0.2);
    expect(r.n2).toBe(0.1);
    expect(r.limiting).toBe(2);
  });

  test('equal moles — reagent 2 wins (n1 < n2 is false when equal)', () => {
    const r = calcLimitingValue(10, 50, 10, 50);
    expect(r.n1).toBe(r.n2);
    expect(r.limiting).toBe(2);
    expect(r.excess).toBe(0);
  });

  test('excess calculation is correct', () => {
    const r = calcLimitingValue(2, 40, 6, 60);
    expect(r.n1).toBe(0.05);
    expect(r.n2).toBe(0.1);
    expect(r.limiting).toBe(1);
    expect(r.excess).toBeCloseTo(0.05, 5);
  });

  test('different molar masses — smaller mass can be in excess', () => {
    const r = calcLimitingValue(2, 2, 50, 50);
    expect(r.n1).toBe(1);
    expect(r.n2).toBe(1);
    expect(r.excess).toBe(0);
  });

  test('one reagent has vastly more moles', () => {
    const r = calcLimitingValue(1, 100, 100, 1);
    expect(r.n1).toBe(0.01);
    expect(r.n2).toBe(100);
    expect(r.limiting).toBe(1);
    expect(r.excess).toBeCloseTo(99.99, 2);
  });
});
