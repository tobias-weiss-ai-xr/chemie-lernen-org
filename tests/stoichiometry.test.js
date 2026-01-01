/**
 * Unit Tests for Stoichiometry Calculator Functions
 */

const {
  parseFormula,
  calcMolToMol,
  calcMassToMass,
  calcLimitingReactant,
  calcPercentYield,
  calcGasLaw,
  convertToKelvin
} = require('../myhugoapp/static/js/calculators/stoichiometry.js');

describe('parseFormula', () => {
  test('should parse simple formula H2O', () => {
    const result = parseFormula('H2O');
    expect(result).toEqual({ H: 2, O: 1 });
  });

  test('should parse CO2', () => {
    const result = parseFormula('CO2');
    expect(result).toEqual({ C: 1, O: 2 });
  });

  test('should parse formula without subscript', () => {
    const result = parseFormula('H2');
    expect(result).toEqual({ H: 2 });
  });

  test('should parse NH3', () => {
    const result = parseFormula('NH3');
    expect(result).toEqual({ N: 1, H: 3 });
  });

  test('should parse formula with parentheses', () => {
    const result = parseFormula('Ca(OH)2');
    expect(result).toEqual({ Ca: 1, O: 2, H: 2 });
  });

  test('should parse complex formula Ca(NO3)2', () => {
    const result = parseFormula('Ca(NO3)2');
    expect(result).toEqual({ Ca: 1, N: 2, O: 6 });
  });

  test('should handle multiple occurrences of same element', () => {
    const result = parseFormula('CH3COOH');
    expect(result.C).toBe(2);
    expect(result.H).toBe(4);
    expect(result.O).toBe(2);
  });
});

describe('calcMolToMol', () => {
  test('should calculate 1:1 ratio correctly', () => {
    const result = calcMolToMol(5, 1, 1);
    expect(result).toBe(5);
  });

  test('should calculate 2:1 ratio correctly', () => {
    const result = calcMolToMol(5, 2, 1);
    expect(result).toBe(2.5);
  });

  test('should calculate 1:2 ratio correctly', () => {
    const result = calcMolToMol(3, 1, 2);
    expect(result).toBe(6);
  });

  test('should handle decimal values', () => {
    const result = calcMolToMol(2.5, 2, 3);
    expect(result).toBeCloseTo(3.75, 4);
  });

  test('should throw error for non-numeric input', () => {
    expect(() => calcMolToMol('abc', 1, 1)).toThrow('All parameters must be numbers');
  });

  test('should throw error for zero reactant coefficient', () => {
    expect(() => calcMolToMol(5, 0, 1)).toThrow('Reactant coefficient cannot be zero');
  });

  test('should calculate water formation 2H2 + O2 -> 2H2O', () => {
    const result = calcMolToMol(5, 2, 2);
    expect(result).toBe(5);
  });
});

describe('calcMassToMass', () => {
  test('should calculate simple mass conversion', () => {
    const result = calcMassToMass(2, 2, 18, 1, 1);
    expect(result.n1).toBe(1);
    expect(result.n2).toBe(1);
    expect(result.m2).toBe(18);
  });

  test('should handle coefficient ratios', () => {
    const result = calcMassToMass(4, 2, 18, 2, 2);
    expect(result.n1).toBe(2);
    expect(result.n2).toBe(2);
    expect(result.m2).toBe(36);
  });

  test('should calculate water formation from hydrogen', () => {
    const result = calcMassToMass(4, 2.016, 18.015, 2, 2);
    expect(result.n1).toBeCloseTo(1.984, 3);
    expect(result.m2).toBeCloseTo(35.74, 2);
  });

  test('should handle decimal inputs', () => {
    const result = calcMassToMass(10.5, 12.01, 44.01, 1, 1);
    expect(result.m2).toBeCloseTo(38.48, 2);
  });

  test('should throw error for non-numeric input', () => {
    expect(() => calcMassToMass('abc', 2, 18, 1, 1)).toThrow('All parameters must be numbers');
  });

  test('should throw error for zero molar mass', () => {
    expect(() => calcMassToMass(4, 0, 18, 1, 1)).toThrow('Molar masses cannot be zero');
  });

  test('should throw error for zero reactant coefficient', () => {
    expect(() => calcMassToMass(4, 2, 18, 0, 1)).toThrow('Reactant coefficient cannot be zero');
  });
});

describe('calcLimitingReactant', () => {
  test('should identify reactant 1 as limiting', () => {
    const result = calcLimitingReactant(4, 2, 1, 4, 2, 1);
    expect(result.limitingReactant).toBe(2); // Equal ratios, defaults to 2
  });

  test('should identify reactant 2 as limiting', () => {
    const result = calcLimitingReactant(28, 28, 1, 10, 2, 3);
    expect(result.limitingReactant).toBe(1); // N2 is limiting (ratio1 < ratio2)
  });

  test('should handle equal ratios', () => {
    const result = calcLimitingReactant(28, 28, 1, 4, 2, 1);
    expect(result.limitingReactant).toBe(1); // N2 is limiting (ratio1 < ratio2)
  });

  test('should calculate correct mole amounts', () => {
    const result = calcLimitingReactant(28, 28.02, 1, 10, 2.016, 3);
    expect(result.n1).toBeCloseTo(0.999, 3);
    expect(result.n2).toBeCloseTo(4.96, 2);
  });

  test('should handle Haber process example', () => {
    const result = calcLimitingReactant(28, 28.02, 1, 10, 2.016, 3);
    expect(result.limitingReactant).toBe(1); // N2 is limiting
    expect(result.ratio1).toBeCloseTo(1.00, 2); // n1/v1 = 0.999/1
    expect(result.ratio2).toBeCloseTo(1.65, 2); // n2/v2 = 4.96/3
  });

  test('should throw error for non-numeric input', () => {
    expect(() => calcLimitingReactant('abc', 2, 1, 4, 2, 1)).toThrow('All parameters must be numbers');
  });

  test('should throw error for zero molar mass', () => {
    expect(() => calcLimitingReactant(4, 0, 1, 4, 2, 1)).toThrow('Molar masses cannot be zero');
  });
});

describe('calcPercentYield', () => {
  test('should calculate 100% yield', () => {
    const result = calcPercentYield(10, 10);
    expect(result).toBe(100);
  });

  test('should calculate 50% yield', () => {
    const result = calcPercentYield(20, 10);
    expect(result).toBe(50);
  });

  test('should calculate yield greater than 100%', () => {
    const result = calcPercentYield(10, 12);
    expect(result).toBe(120);
  });

  test('should handle decimal values', () => {
    const result = calcPercentYield(2.53, 2.1);
    expect(result).toBeCloseTo(83.0, 1);
  });

  test('should calculate 83% yield for copper example', () => {
    const result = calcPercentYield(2.53, 2.1);
    expect(result).toBeCloseTo(83.0, 0);
  });

  test('should throw error for non-numeric input', () => {
    expect(() => calcPercentYield('abc', 10)).toThrow('All parameters must be numbers');
  });

  test('should throw error for zero theoretical yield', () => {
    expect(() => calcPercentYield(0, 10)).toThrow('Theoretical yield cannot be zero');
  });

  test('should handle zero actual yield', () => {
    const result = calcPercentYield(10, 0);
    expect(result).toBe(0);
  });
});

describe('calcGasLaw', () => {
  const R = 0.0821;

  test('should calculate moles (n) from PV = nRT', () => {
    const result = calcGasLaw({ P: 1, V: 22.4, T: 273.15 }, 'n');
    expect(result).toBeCloseTo(1.0, 1);
  });

  test('should calculate volume (V) from PV = nRT', () => {
    const result = calcGasLaw({ n: 1, T: 273.15, P: 1 }, 'V');
    expect(result).toBeCloseTo(22.4, 1);
  });

  test('should calculate pressure (P) from PV = nRT', () => {
    const result = calcGasLaw({ n: 1, T: 273.15, V: 22.4 }, 'P');
    expect(result).toBeCloseTo(1.0, 2);
  });

  test('should calculate temperature (T) from PV = nRT', () => {
    const result = calcGasLaw({ P: 1, V: 22.4, n: 1 }, 'T');
    expect(result).toBeCloseTo(272.8, 0);
  });

  test('should handle STP conditions', () => {
    const result = calcGasLaw({ P: 1, V: 22.4, T: 273.15 }, 'n');
    expect(result).toBeCloseTo(1.0, 2);
  });

  test('should throw error when calculating n without P', () => {
    expect(() => calcGasLaw({ V: 22.4, T: 273.15 }, 'n'))
      .toThrow('P, V, and T are required to calculate n');
  });

  test('should throw error for invalid calculate parameter', () => {
    expect(() => calcGasLaw({ P: 1, V: 22.4, T: 273.15 }, 'X'))
      .toThrow('Invalid calculate parameter');
  });

  test('should handle decimal values', () => {
    const result = calcGasLaw({ P: 2.5, V: 10, T: 300 }, 'n');
    const expected = (2.5 * 10) / (0.0821 * 300);
    expect(result).toBeCloseTo(expected, 3);
  });
});

describe('convertToKelvin', () => {
  test('should convert Celsius to Kelvin', () => {
    const result = convertToKelvin(0, 'C');
    expect(result).toBeCloseTo(273.15, 2);
  });

  test('should convert Celsius to Kelvin for room temperature', () => {
    const result = convertToKelvin(25, 'C');
    expect(result).toBeCloseTo(298.15, 2);
  });

  test('should return Kelvin unchanged', () => {
    const result = convertToKelvin(273.15, 'K');
    expect(result).toBe(273.15);
  });

  test('should convert Fahrenheit to Kelvin', () => {
    const result = convertToKelvin(32, 'F');
    expect(result).toBeCloseTo(273.15, 2);
  });

  test('should convert Fahrenheit to Kelvin for room temp', () => {
    const result = convertToKelvin(77, 'F');
    expect(result).toBeCloseTo(298.15, 2);
  });

  test('should handle negative Celsius', () => {
    const result = convertToKelvin(-273.15, 'C');
    expect(result).toBeCloseTo(0, 2);
  });

  test('should throw error for non-numeric temperature', () => {
    expect(() => convertToKelvin('abc', 'C')).toThrow('Temperature must be a number');
  });

  test('should throw error for invalid unit', () => {
    expect(() => convertToKelvin(25, 'X')).toThrow('Invalid unit');
  });

  test('should handle decimal temperatures', () => {
    const result = convertToKelvin(25.5, 'C');
    expect(result).toBeCloseTo(298.65, 2);
  });
});
