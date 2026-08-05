/**
 * Unit Tests for UnitConverter
 * Tests the chemistry unit conversion utility across 5 dimensions
 */

const UnitConverter = require('../myhugoapp/static/js/utils/unit-converter.js');

// ============================================================================
// Pressure conversions
// ============================================================================
describe('UnitConverter — Pressure', () => {
  test('Pa to kPa should divide by 1000', () => {
    expect(UnitConverter.convert(1000, 'Pa', 'kPa', 'pressure')).toBeCloseTo(1, 5);
  });

  test('atm to Pa should multiply by 101325', () => {
    expect(UnitConverter.convert(1, 'atm', 'Pa', 'pressure')).toBeCloseTo(101325, 1);
  });

  test('bar to atm should convert accurately', () => {
    const result = UnitConverter.convert(1, 'bar', 'atm', 'pressure');
    // 1 bar = 100000 Pa; 1 atm = 101325 Pa → 1 bar = 100000/101325 atm
    expect(result).toBeCloseTo(0.986923, 4);
  });

  test('mmHg to Pa round-trip', () => {
    const mmHg = 760;
    const pa = UnitConverter.convert(mmHg, 'mmHg', 'Pa', 'pressure');
    // 760 mmHg × 133.322 = 101324.72 Pa
    expect(pa).toBeCloseTo(101324.72, 1);
    const back = UnitConverter.convert(pa, 'Pa', 'mmHg', 'pressure');
    expect(back).toBeCloseTo(mmHg, 1);
  });

  test('psi to bar conversion', () => {
    // 1 psi ≈ 0.0689476 bar
    expect(UnitConverter.convert(1, 'psi', 'bar', 'pressure')).toBeCloseTo(0.0689476, 4);
  });

  test('same unit returns identity', () => {
    expect(UnitConverter.convert(42, 'Pa', 'Pa', 'pressure')).toBe(42);
  });
});

// ============================================================================
// Volume conversions
// ============================================================================
describe('UnitConverter — Volume', () => {
  test('L to mL should multiply by 1000', () => {
    expect(UnitConverter.convert(1, 'L', 'mL', 'volume')).toBe(1000);
  });

  test('mL to L should divide by 1000', () => {
    expect(UnitConverter.convert(500, 'mL', 'L', 'volume')).toBe(0.5);
  });

  test('L to m³ should divide by 1000', () => {
    expect(UnitConverter.convert(1000, 'L', 'm³', 'volume')).toBe(1);
  });

  test('gal to L conversion', () => {
    // 1 US gal = 3.78541 L
    expect(UnitConverter.convert(1, 'gal', 'L', 'volume')).toBeCloseTo(3.78541, 4);
  });

  test('m³ to mL round-trip', () => {
    const m3 = 0.001;
    const mL = UnitConverter.convert(m3, 'm³', 'mL', 'volume');
    expect(mL).toBe(1000);
    const back = UnitConverter.convert(mL, 'mL', 'm³', 'volume');
    expect(back).toBeCloseTo(m3, 10);
  });
});

// ============================================================================
// Temperature conversions
// ============================================================================
describe('UnitConverter — Temperature', () => {
  test('0°C should be 273.15 K', () => {
    expect(UnitConverter.convert(0, '°C', 'K', 'temperature')).toBeCloseTo(273.15, 2);
  });

  test('100°C should be 373.15 K', () => {
    expect(UnitConverter.convert(100, '°C', 'K', 'temperature')).toBeCloseTo(373.15, 2);
  });

  test('273.15 K should be 0°C', () => {
    expect(UnitConverter.convert(273.15, 'K', '°C', 'temperature')).toBeCloseTo(0, 2);
  });

  test('32°F should be 0°C', () => {
    expect(UnitConverter.convert(32, '°F', '°C', 'temperature')).toBeCloseTo(0, 2);
  });

  test('212°F should be 100°C', () => {
    expect(UnitConverter.convert(212, '°F', '°C', 'temperature')).toBeCloseTo(100, 2);
  });

  test('0 K should be -273.15°C (absolute zero)', () => {
    expect(UnitConverter.convert(0, 'K', '°C', 'temperature')).toBeCloseTo(-273.15, 2);
  });

  test('°C to °F round-trip', () => {
    const original = 25;
    const f = UnitConverter.convert(original, '°C', '°F', 'temperature');
    const back = UnitConverter.convert(f, '°F', '°C', 'temperature');
    expect(back).toBeCloseTo(original, 4);
  });

  test('-40°F = -40°C (unique coincidence)', () => {
    const c = UnitConverter.convert(-40, '°F', '°C', 'temperature');
    expect(c).toBeCloseTo(-40, 2);
  });
});

// ============================================================================
// Concentration conversions
// ============================================================================
describe('UnitConverter — Concentration', () => {
  test('1 M should be 1 mol/L', () => {
    expect(UnitConverter.convert(1, 'M', 'mol/L', 'concentration')).toBe(1);
  });

  test('1 M to mM should multiply by 1000', () => {
    expect(UnitConverter.convert(1, 'M', 'mM', 'concentration')).toBe(1000);
  });

  test('1000 mM to M should be 1', () => {
    expect(UnitConverter.convert(1000, 'mM', 'M', 'concentration')).toBe(1);
  });
});

// ============================================================================
// Mass conversions
// ============================================================================
describe('UnitConverter — Mass', () => {
  test('kg to g should multiply by 1000', () => {
    expect(UnitConverter.convert(1, 'kg', 'g', 'mass')).toBe(1000);
  });

  test('g to mg should multiply by 1000', () => {
    expect(UnitConverter.convert(1, 'g', 'mg', 'mass')).toBe(1000);
  });

  test('mg to g should divide by 1000', () => {
    expect(UnitConverter.convert(500, 'mg', 'g', 'mass')).toBe(0.5);
  });

  test('lb to g conversion', () => {
    expect(UnitConverter.convert(1, 'lb', 'g', 'mass')).toBeCloseTo(453.592, 2);
  });

  test('oz to g conversion', () => {
    expect(UnitConverter.convert(1, 'oz', 'g', 'mass')).toBeCloseTo(28.3495, 2);
  });

  test('kg to lb round-trip', () => {
    const kg = 5;
    const lb = UnitConverter.convert(kg, 'kg', 'lb', 'mass');
    const back = UnitConverter.convert(lb, 'lb', 'kg', 'mass');
    expect(back).toBeCloseTo(kg, 4);
  });
});

// ============================================================================
// detectUnit parsing
// ============================================================================
describe('UnitConverter — detectUnit', () => {
  test('should parse "100 g/L"', () => {
    const result = UnitConverter.detectUnit('100 g/L');
    expect(result).toEqual({ value: 100, unit: 'g/L', dimension: 'concentration' });
  });

  test('should parse "25°C"', () => {
    const result = UnitConverter.detectUnit('25°C');
    expect(result).toEqual({ value: 25, unit: '°C', dimension: 'temperature' });
  });

  test('should parse "1.5 atm"', () => {
    const result = UnitConverter.detectUnit('1.5 atm');
    expect(result).toEqual({ value: 1.5, unit: 'atm', dimension: 'pressure' });
  });

  test('should parse "0,5 L" with decimal comma', () => {
    const result = UnitConverter.detectUnit('0,5 L');
    expect(result).toEqual({ value: 0.5, unit: 'L', dimension: 'volume' });
  });

  test('should parse "2e3 mmHg" with scientific notation', () => {
    const result = UnitConverter.detectUnit('2e3 mmHg');
    expect(result).toEqual({ value: 2000, unit: 'mmHg', dimension: 'pressure' });
  });

  test('should parse "100 mL"', () => {
    const result = UnitConverter.detectUnit('100 mL');
    expect(result).toEqual({ value: 100, unit: 'mL', dimension: 'volume' });
  });

  test('should parse "500 g"', () => {
    const result = UnitConverter.detectUnit('500 g');
    expect(result).toEqual({ value: 500, unit: 'g', dimension: 'mass' });
  });

  test('should return null for bare number', () => {
    expect(UnitConverter.detectUnit('42')).toBeNull();
  });

  test('should return null for empty string', () => {
    expect(UnitConverter.detectUnit('')).toBeNull();
  });

  test('should return null for non-string input', () => {
    expect(UnitConverter.detectUnit(42)).toBeNull();
    expect(UnitConverter.detectUnit(null)).toBeNull();
    expect(UnitConverter.detectUnit(undefined)).toBeNull();
  });

  test('should handle "1 M" without slash', () => {
    const result = UnitConverter.detectUnit('1 M');
    expect(result).toEqual({ value: 1, unit: 'M', dimension: 'concentration' });
  });

  test('should parse "1000 m³"', () => {
    const result = UnitConverter.detectUnit('1000 m³');
    expect(result).toEqual({ value: 1000, unit: 'm³', dimension: 'volume' });
  });

  test('should parse "1.0 kg"', () => {
    const result = UnitConverter.detectUnit('1.0 kg');
    expect(result).toEqual({ value: 1, unit: 'kg', dimension: 'mass' });
  });
});

// ============================================================================
// getAvailableUnits
// ============================================================================
describe('UnitConverter — getAvailableUnits', () => {
  test('pressure should have 6 units', () => {
    const units = UnitConverter.getAvailableUnits('pressure');
    expect(units.map((u) => u.unit).sort()).toEqual(['Pa', 'atm', 'bar', 'kPa', 'mmHg', 'psi']);
  });

  test('volume should have 4 units', () => {
    const units = UnitConverter.getAvailableUnits('volume');
    expect(units.map((u) => u.unit).sort()).toEqual(['L', 'gal', 'mL', 'm³']);
  });

  test('temperature should have 3 units', () => {
    const units = UnitConverter.getAvailableUnits('temperature');
    expect(units.map((u) => u.unit).sort()).toEqual(['K', '°C', '°F']);
  });

  test('concentration should have 6 units', () => {
    const units = UnitConverter.getAvailableUnits('concentration');
    expect(units.map((u) => u.unit).sort()).toEqual(['%', 'M', 'g/L', 'mM', 'mg/mL', 'mol/L']);
  });

  test('mass should have 5 units', () => {
    const units = UnitConverter.getAvailableUnits('mass');
    expect(units.map((u) => u.unit).sort()).toEqual(['g', 'kg', 'lb', 'mg', 'oz']);
  });
});

// ============================================================================
// Edge cases & error handling
// ============================================================================
describe('UnitConverter — Edge cases', () => {
  test('convert with zero value', () => {
    expect(UnitConverter.convert(0, 'L', 'mL', 'volume')).toBe(0);
    expect(UnitConverter.convert(0, '°C', 'K', 'temperature')).toBeCloseTo(273.15, 2);
  });

  test('convert with negative value', () => {
    expect(UnitConverter.convert(-10, '°C', 'K', 'temperature')).toBeCloseTo(263.15, 2);
  });

  test('convert with large value', () => {
    expect(UnitConverter.convert(1000000, 'Pa', 'kPa', 'pressure')).toBe(1000);
  });

  test('throw error for unknown dimension', () => {
    expect(() => {
      UnitConverter.convert(1, 'm', 'km', 'length');
    }).toThrow('Unbekannte Dimension');
  });

  test('throw error for unknown unit in dimension', () => {
    expect(() => {
      UnitConverter.convert(1, 'Pa', 'xyz', 'pressure');
    }).toThrow('Unbekannte Einheit');
  });

  test('throw error for non-numeric value', () => {
    expect(() => {
      UnitConverter.convert('abc', 'Pa', 'kPa', 'pressure');
    }).toThrow('Ungültiger Wert');
  });

  test('throw error for NaN value', () => {
    expect(() => {
      UnitConverter.convert(NaN, 'Pa', 'kPa', 'pressure');
    }).toThrow('Ungültiger Wert');
  });

  test('throw error for Infinity value', () => {
    expect(() => {
      UnitConverter.convert(Infinity, 'L', 'mL', 'volume');
    }).toThrow('Ungültiger Wert');
  });
});

// ============================================================================
// sameDimension
// ============================================================================
describe('UnitConverter — sameDimension', () => {
  test('Pa and atm are same dimension', () => {
    expect(UnitConverter.sameDimension('Pa', 'atm')).toBe(true);
  });

  test('L and gal are same dimension', () => {
    expect(UnitConverter.sameDimension('L', 'gal')).toBe(true);
  });

  test('L and g are different dimensions', () => {
    expect(UnitConverter.sameDimension('L', 'g')).toBe(false);
  });

  test('°C and K are same dimension', () => {
    expect(UnitConverter.sameDimension('°C', 'K')).toBe(true);
  });
});

// ============================================================================
// getDimensions
// ============================================================================
describe('UnitConverter — getDimensions', () => {
  test('should return all 5 dimensions', () => {
    const dims = UnitConverter.getDimensions();
    expect(dims).toHaveLength(5);
    const names = dims.map((d) => d.name).sort();
    expect(names).toEqual(['concentration', 'mass', 'pressure', 'temperature', 'volume']);
  });

  test('each dimension has name, label, and baseUnit', () => {
    const dims = UnitConverter.getDimensions();
    dims.forEach((d) => {
      expect(d).toHaveProperty('name');
      expect(d).toHaveProperty('label');
      expect(d).toHaveProperty('baseUnit');
      expect(typeof d.name).toBe('string');
      expect(typeof d.label).toBe('string');
      expect(typeof d.baseUnit).toBe('string');
    });
  });
});
