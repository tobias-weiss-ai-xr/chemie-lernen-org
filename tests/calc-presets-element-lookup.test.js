/**
 * Unit Tests for Calculator Presets (calc-presets.js) and Element Lookup (calc-element-lookup.js)
 * Validates preset data integrity and element database accuracy.
 */

const { presets, massPresets } = require('../myhugoapp/static/js/calculators/calc-presets.js');
const { elementDatabase } = require('../myhugoapp/static/js/calculators/calc-element-lookup.js');

describe('Calculator Presets (calc-presets.js)', () => {
  test('all presets have required fields', () => {
    Object.entries(presets).forEach(([key, preset]) => {
      expect(preset.name).toBeDefined();
      expect(preset.equation).toBeDefined();
      expect(preset.v1).toBeGreaterThan(0);
      expect(preset.v2).toBeGreaterThan(0);
      expect(preset.example).toBeGreaterThan(0);
    });
  });

  test('all mass presets have required fields', () => {
    Object.entries(massPresets).forEach(([key, preset]) => {
      expect(preset.name).toBeDefined();
      expect(preset.v1).toBeGreaterThan(0);
      expect(preset.v2).toBeGreaterThan(0);
      expect(preset.m1).toBeGreaterThan(0);
      expect(preset.M1).toBeGreaterThan(0);
      expect(preset.M2).toBeGreaterThan(0);
    });
  });

  test('water preset: balanced equation 2H₂ + O₂ → 2H₂O', () => {
    expect(presets.water.v1).toBe(2);
    expect(presets.water.v2).toBe(2);
  });

  test('ammonia preset: 1:2 coefficient ratio', () => {
    expect(presets.ammonia.v1).toBe(1);
    expect(presets.ammonia.v2).toBe(2);
  });

  test('photosynthesis: 6:1 coefficient ratio', () => {
    expect(presets.photosynthesis.v1).toBe(6);
    expect(presets.photosynthesis.v2).toBe(1);
  });

  test('mass preset molar masses are physically correct', () => {
    expect(massPresets.water.M1).toBe(2);
    expect(massPresets.water.M2).toBe(18);
    expect(massPresets.methane.M2).toBe(44);
    expect(massPresets.ammonia.M2).toBe(17);
  });

  test('sodium mass preset: Na molar mass = 23 g/mol', () => {
    expect(massPresets.sodium.M1).toBe(23);
    expect(massPresets.sodium.M2).toBe(40);
  });

  test('5 presets defined', () => {
    expect(Object.keys(presets)).toHaveLength(5);
    expect(Object.keys(massPresets)).toHaveLength(5);
  });

  test('mol-mol calculation with each preset gives valid result', () => {
    Object.entries(presets).forEach(([key, preset]) => {
      const n2 = preset.example * (preset.v2 / preset.v1);
      expect(n2).toBeGreaterThan(0);
      expect(isFinite(n2)).toBe(true);
    });
  });
});

describe('Element Database (calc-element-lookup.js)', () => {
  test('hydrogen mass ≈ 1.008', () => {
    expect(elementDatabase.H.mass).toBeCloseTo(1.008, 3);
  });

  test('carbon mass ≈ 12.011', () => {
    expect(elementDatabase.C.mass).toBeCloseTo(12.011, 3);
  });

  test('oxygen mass ≈ 15.999', () => {
    expect(elementDatabase.O.mass).toBeCloseTo(15.999, 3);
  });

  test('iron mass ≈ 55.845', () => {
    expect(elementDatabase.Fe.mass).toBeCloseTo(55.845, 3);
  });

  test('gold mass ≈ 196.97', () => {
    expect(elementDatabase.Au.mass).toBeCloseTo(196.97, 2);
  });

  test('chlorine mass ≈ 35.45', () => {
    expect(elementDatabase.Cl.mass).toBeCloseTo(35.45, 2);
  });

  test('atomic numbers are positive integers', () => {
    Object.values(elementDatabase).forEach((el) => {
      expect(el.number).toBeGreaterThan(0);
      expect(Number.isInteger(el.number)).toBe(true);
    });
  });

  test('symbols match keys', () => {
    Object.entries(elementDatabase).forEach(([key, el]) => {
      expect(el.symbol).toBe(key);
    });
  });

  test('all elements have German names', () => {
    Object.values(elementDatabase).forEach((el) => {
      expect(el.name).toBeTruthy();
      expect(el.name.length).toBeGreaterThan(2);
    });
  });

  test('heavier elements have higher atomic numbers (general trend)', () => {
    expect(elementDatabase.Au.number).toBeGreaterThan(elementDatabase.Fe.number);
    expect(elementDatabase.Fe.number).toBeGreaterThan(elementDatabase.C.number);
  });

  test('Cl has correct atomic number 17', () => {
    expect(elementDatabase.Cl.number).toBe(17);
  });
});
