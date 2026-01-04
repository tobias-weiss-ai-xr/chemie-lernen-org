/**
 * Unit Tests for Konzentrationsumrechner (Concentration Converter)
 */

// Concentration Converter class (from source)
class ConcentrationConverter {
  constructor(molarMass, density, temperature) {
    this.molarMass = molarMass;
    this.density = density;
    this.temperature = temperature;
  }

  fromUnit(value, unit) {
    switch (unit) {
      case 'M':
        return value / this.density;
      case 'm':
        return value * 0.999;
      case 'percent_ww':
        return ((value / 100) * 1000) / this.molarMass;
      case 'percent_vv':
        return ((value / 100) * this.density * 1000) / this.molarMass / this.density;
      case 'percent_wv':
        return (value * 10) / this.molarMass / this.density;
      case 'ppm':
        return value / 1000 / this.molarMass;
      case 'ppb':
        return value / 1000000 / this.molarMass;
      case 'g_L':
        return value / this.molarMass / this.density;
      case 'mg_L':
        return value / 1000 / this.molarMass / this.density;
      case 'mole_fraction':
        return value / 18.015;
      case 'normality':
        return value / this.density;
      default:
        throw new Error('Unbekannte Einheit: ' + unit);
    }
  }

  toUnit(molesPerKg, unit) {
    switch (unit) {
      case 'M':
        return molesPerKg * this.density;
      case 'm':
        return molesPerKg / 0.999;
      case 'percent_ww':
        return ((molesPerKg * this.molarMass) / 1000) * 100;
      case 'percent_vv':
        return ((molesPerKg * this.molarMass) / this.density / 1000) * 100;
      case 'percent_wv':
        return ((molesPerKg * this.molarMass * this.density) / 1000) * 100;
      case 'ppm':
        return molesPerKg * this.molarMass * 1000;
      case 'ppb':
        return molesPerKg * this.molarMass * 1000000;
      case 'g_L':
        return molesPerKg * this.molarMass * this.density;
      case 'mg_L':
        return molesPerKg * this.molarMass * this.density * 1000;
      case 'mole_fraction': {
        const massSolute = molesPerKg * this.molarMass;
        const massWater = 1000 - massSolute;
        const molesWater = massWater / 18.015;
        return molesPerKg / (molesPerKg + molesWater);
      }
      case 'normality':
        return molesPerKg * this.density;
      default:
        throw new Error('Unbekannte Einheit: ' + unit);
    }
  }

  convert(value, fromUnit, toUnit) {
    const molesPerKg = this.fromUnit(value, fromUnit);
    return this.toUnit(molesPerKg, toUnit);
  }
}

describe('Konzentrationsumrechner - Molar Conversions', () => {
  const molarMass = 58.44; // NaCl g/mol
  const density = 1.0; // g/mL (water)

  test('should convert M to g/L', () => {
    const converter = new ConcentrationConverter(molarMass, density, 20);
    const result = converter.convert(1, 'M', 'g_L');
    expect(result).toBeCloseTo(58.44, 2);
  });

  test('should convert M to mg/L', () => {
    const converter = new ConcentrationConverter(molarMass, density, 20);
    const result = converter.convert(1, 'M', 'mg_L');
    expect(result).toBeCloseTo(58440, 0);
  });

  test('should convert M to ppm (for dilute solutions)', () => {
    const converter = new ConcentrationConverter(molarMass, density, 20);
    const result = converter.convert(0.001, 'M', 'ppm');
    expect(result).toBeCloseTo(58.44, 2);
  });

  test('should convert g/L to M', () => {
    const converter = new ConcentrationConverter(molarMass, density, 20);
    const result = converter.convert(58.44, 'g_L', 'M');
    expect(result).toBeCloseTo(1.0, 3);
  });
});

describe('Konzentrationsumrechner - Mass Percent Conversions', () => {
  const molarMass = 58.44;
  const density = 1.0;

  test('should convert % w/w to M', () => {
    const converter = new ConcentrationConverter(molarMass, density, 20);
    // 1% w/w = 10 g/kg = 10/58.44 mol/kg = 0.171 mol/kg
    // For density 1 g/mL: 0.171 mol/L
    const result = converter.convert(1, 'percent_ww', 'M');
    expect(result).toBeCloseTo(0.171, 3);
  });

  test('should convert % w/v to M', () => {
    const converter = new ConcentrationConverter(molarMass, density, 20);
    // 1% w/v = 10 g/L = 10/58.44 mol/L
    const result = converter.convert(1, 'percent_wv', 'M');
    expect(result).toBeCloseTo(0.171, 3);
  });

  test('should convert M to % w/w', () => {
    const converter = new ConcentrationConverter(molarMass, density, 20);
    // 1 M = 58.44 g/L = 58.44 g/kg solution
    // = (58.44/1000) * 100 = 5.844%
    const result = converter.convert(1, 'M', 'percent_ww');
    expect(result).toBeCloseTo(5.844, 3);
  });
});

describe('Konzentrationsumrechner - PPM/PPB Conversions', () => {
  const molarMass = 58.44;
  const density = 1.0;

  test('should convert ppm to M (very dilute)', () => {
    const converter = new ConcentrationConverter(molarMass, density, 20);
    // 58.44 ppm = 58.44 mg/kg ≈ 58.44 mg/L (for water)
    // = 0.05844 g/L = 0.05844/58.44 mol/L = 0.001 M
    const result = converter.convert(58.44, 'ppm', 'M');
    expect(result).toBeCloseTo(0.001, 4);
  });

  test('should convert ppb to ppm', () => {
    const converter = new ConcentrationConverter(molarMass, density, 20);
    // 1000 ppb = 1 ppm
    const result = converter.convert(1000, 'ppb', 'ppm');
    expect(result).toBeCloseTo(1, 4);
  });

  test('should convert ppm to mg/L (for dilute aqueous)', () => {
    const converter = new ConcentrationConverter(molarMass, density, 20);
    // For dilute aqueous: ppm ≈ mg/L
    const result = converter.convert(100, 'ppm', 'mg_L');
    expect(result).toBeCloseTo(100, 0);
  });
});

describe('Konzentrationsumrechner - Density Effects', () => {
  test('density should not affect M to g/L conversion (same molar mass)', () => {
    const converter1 = new ConcentrationConverter(58.44, 1.0, 20);
    const converter2 = new ConcentrationConverter(58.44, 1.2, 20);

    const result1 = converter1.convert(1, 'M', 'g_L');
    const result2 = converter2.convert(1, 'M', 'g_L');

    // For M to g/L: g/L = molar_mass * M, density cancels out
    expect(result1).toBeCloseTo(58.44, 2);
    expect(result2).toBeCloseTo(58.44, 2);
  });

  test('density should affect molality to molarity conversion', () => {
    const converter1 = new ConcentrationConverter(58.44, 1.0, 20);
    const converter2 = new ConcentrationConverter(58.44, 1.2, 20);

    // Convert 1 mol/kg to M for different densities
    const result1 = converter1.convert(1, 'm', 'M');
    const result2 = converter2.convert(1, 'm', 'M');

    // Higher density should give higher molarity
    expect(result2).toBeGreaterThan(result1);
    expect(result2 / result1).toBeCloseTo(1.2, 2);
  });
});

describe('Konzentrationsumrechner - Molality vs Molarity', () => {
  const molarMass = 58.44;
  const density = 1.0;

  test('for dilute solutions, M ≈ m', () => {
    const converter = new ConcentrationConverter(molarMass, density, 20);
    const molar = converter.convert(0.01, 'M', 'm');
    expect(molar).toBeCloseTo(0.01, 3);
  });

  test('M and m should be similar but not identical', () => {
    const converter = new ConcentrationConverter(molarMass, density, 20);
    const molar = converter.convert(1, 'M', 'm');
    // Slight difference due to approximation
    expect(molar).toBeCloseTo(1.001, 3);
  });
});

describe('Konzentrationsumrechner - Common Solutions', () => {
  test('NaCl 0.9% (physiological saline)', () => {
    const converter = new ConcentrationConverter(58.44, 1.0, 20);
    // 0.9% w/v = 9 g/L = 9/58.44 M ≈ 0.154 M
    const result = converter.convert(0.9, 'percent_wv', 'M');
    expect(result).toBeCloseTo(0.154, 3);
  });

  test('should handle very dilute solutions (0.001 M)', () => {
    const converter = new ConcentrationConverter(58.44, 1.0, 20);
    const ppm = converter.convert(0.001, 'M', 'ppm');
    expect(ppm).toBeCloseTo(58.44, 2);
  });

  test('should handle concentrated solutions (5 M)', () => {
    const converter = new ConcentrationConverter(58.44, 1.0, 20);
    const percent = converter.convert(5, 'M', 'percent_ww');
    expect(percent).toBeCloseTo(29.22, 2);
  });
});

describe('Konzentrationsumrechner - Unit Symmetry', () => {
  const molarMass = 58.44;
  const density = 1.0;

  test('round-trip conversion: M -> g/L -> M', () => {
    const converter = new ConcentrationConverter(molarMass, density, 20);
    const converted = converter.convert(converter.convert(1, 'M', 'g_L'), 'g_L', 'M');
    expect(converted).toBeCloseTo(1, 4);
  });

  test('round-trip conversion: M -> ppm -> M', () => {
    const converter = new ConcentrationConverter(molarMass, density, 20);
    const converted = converter.convert(converter.convert(1, 'M', 'ppm'), 'ppm', 'M');
    expect(converted).toBeCloseTo(1, 3);
  });
});

describe('Konzentrationsumrechner - Different Substances', () => {
  test('HCl (molar mass 36.46 g/mol)', () => {
    const converter = new ConcentrationConverter(36.46, 1.0, 20);
    // 1 M HCl = 36.46 g/L
    const result = converter.convert(1, 'M', 'g_L');
    expect(result).toBeCloseTo(36.46, 2);
  });

  test('NaOH (molar mass 40.00 g/mol)', () => {
    const converter = new ConcentrationConverter(40.0, 1.0, 20);
    // 1 M NaOH = 40.00 g/L
    const result = converter.convert(1, 'M', 'g_L');
    expect(result).toBeCloseTo(40.0, 2);
  });

  test('H2SO4 (molar mass 98.08 g/mol)', () => {
    const converter = new ConcentrationConverter(98.08, 1.0, 20);
    // 1 M H2SO4 = 98.08 g/L
    const result = converter.convert(1, 'M', 'g_L');
    expect(result).toBeCloseTo(98.08, 2);
  });
});

describe('Konzentrationsumrechner - Edge Cases', () => {
  test('should handle very small concentrations', () => {
    const converter = new ConcentrationConverter(58.44, 1.0, 20);
    const result = converter.convert(1e-6, 'M', 'ppm');
    expect(result).toBeCloseTo(0.05844, 4);
  });

  test('should handle concentration of zero', () => {
    const converter = new ConcentrationConverter(58.44, 1.0, 20);
    const result = converter.convert(0, 'M', 'g_L');
    expect(result).toBe(0);
  });

  test('should throw error for unknown unit', () => {
    const converter = new ConcentrationConverter(58.44, 1.0, 20);
    expect(() => converter.convert(1, 'unknown', 'M')).toThrow('Unbekannte Einheit');
  });
});

describe('Konzentrationsumrechner - Normality (for monovalent)', () => {
  const molarMass = 58.44;
  const density = 1.0;

  test('for monovalent, N ≈ M', () => {
    const converter = new ConcentrationConverter(molarMass, density, 20);
    const result = converter.convert(1, 'M', 'normality');
    expect(result).toBeCloseTo(1, 4);
  });

  test('for monovalent, M ≈ N', () => {
    const converter = new ConcentrationConverter(molarMass, density, 20);
    const result = converter.convert(1, 'normality', 'M');
    expect(result).toBeCloseTo(1, 4);
  });
});

describe('Konzentrationsumrechner - Mole Fraction', () => {
  const molarMass = 58.44;
  const density = 1.0;

  test('should calculate mole fraction for dilute solution', () => {
    const converter = new ConcentrationConverter(molarMass, density, 20);
    const result = converter.convert(0.1, 'M', 'mole_fraction');
    // For 0.1 M NaCl: X ≈ n_solute / (n_solute + n_solvent)
    // Should be small but not zero
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(0.01);
  });

  test('should calculate mole fraction for concentrated solution', () => {
    const converter = new ConcentrationConverter(molarMass, density, 20);
    const result = converter.convert(10, 'M', 'mole_fraction');
    // For 10 M NaCl: X should be larger
    expect(result).toBeGreaterThan(0.1);
  });
});
