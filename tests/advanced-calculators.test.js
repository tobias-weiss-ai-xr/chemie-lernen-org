/**
 * Tests for Advanced Chemistry Calculators
 * Serial Dilution, Titration, and Concentration Calculations
 */

const {
  calculateSerialDilution,
  calculateDilution,
  calculateTitration,
  calculatePHFromConcentration,
  calculateHConcentrationFromPH,
  calculatePOH,
  calculateKW,
  calculateSolutionParameters,
  calculateMolarity,
  calculateMolesForMolarity,
  convertConcentration,
  ConcentrationUnits,
} = require('../myhugoapp/static/js/calculators/advanced-calculators.js');

describe('Serial Dilution Calculator', () => {
  describe('calculateSerialDilution', () => {
    test('calculates single dilution correctly', () => {
      const result = calculateSerialDilution({
        initialConcentration: 1.0,
        targetConcentration: 0.1,
        finalVolume: 100,
        numberOfDilutions: 1,
      });

      expect(result.initialConcentration).toBe(1.0);
      expect(result.targetConcentration).toBe(0.1);
      expect(result.totalDilutionFactor).toBe(10);
      expect(result.steps).toHaveLength(1);
      expect(result.steps[0].volumeOfStock).toBeCloseTo(10, 1);
      expect(result.steps[0].volumeOfDiluent).toBeCloseTo(90, 1);
    });

    test('calculates two-fold serial dilution', () => {
      const result = calculateSerialDilution({
        initialConcentration: 1.0,
        targetConcentration: 0.25,
        finalVolume: 100,
        numberOfDilutions: 2,
      });

      expect(result.numberOfDilutions).toBe(2);
      expect(result.dilutionFactorPerStep).toBe(2);
      expect(result.steps).toHaveLength(2);
      expect(result.steps[0].concentration).toBe(0.5);
      expect(result.steps[1].concentration).toBe(0.25);
    });

    test('calculates ten-fold serial dilution', () => {
      const result = calculateSerialDilution({
        initialConcentration: 1.0,
        targetConcentration: 0.001,
        finalVolume: 50,
        numberOfDilutions: 3,
      });

      expect(result.totalDilutionFactor).toBe(1000);
      expect(result.dilutionFactorPerStep).toBeCloseTo(10, 1);
      expect(result.steps).toHaveLength(3);
    });

    test('throws error for invalid initial concentration', () => {
      expect(() => {
        calculateSerialDilution({
          initialConcentration: 0,
          targetConcentration: 0.1,
          finalVolume: 100,
        });
      }).toThrow('Initial concentration must be positive');
    });

    test('throws error for target concentration >= initial', () => {
      expect(() => {
        calculateSerialDilution({
          initialConcentration: 0.1,
          targetConcentration: 0.5,
          finalVolume: 100,
        });
      }).toThrow('Target concentration must be less than initial concentration');
    });

    test('throws error for invalid volume', () => {
      expect(() => {
        calculateSerialDilution({
          initialConcentration: 1.0,
          targetConcentration: 0.1,
          finalVolume: 0,
        });
      }).toThrow('Final volume must be positive');
    });

    test('throws error for numberOfDilutions < 1', () => {
      expect(() => {
        calculateSerialDilution({
          initialConcentration: 1.0,
          targetConcentration: 0.1,
          finalVolume: 100,
          numberOfDilutions: 0,
        });
      }).toThrow('Number of dilutions must be at least 1');
    });
  });

  describe('calculateDilution', () => {
    test('calculates simple dilution using C1V1 = C2V2', () => {
      const result = calculateDilution(1.0, 10, 0.1);

      expect(result.c1).toBe(1.0);
      expect(result.v1).toBe(10);
      expect(result.c2).toBe(0.1);
      expect(result.v2).toBe(100);
      expect(result.diluentVolume).toBe(90);
      expect(result.dilutionFactor).toBe(10);
    });

    test('calculates dilution for half concentration', () => {
      const result = calculateDilution(2.0, 50, 1.0);

      expect(result.v2).toBe(100);
      expect(result.diluentVolume).toBe(50);
      expect(result.dilutionFactor).toBe(2);
    });

    test('throws error for negative values', () => {
      expect(() => calculateDilution(-1, 10, 0.1)).toThrow();
      expect(() => calculateDilution(1, -10, 0.1)).toThrow();
      expect(() => calculateDilution(1, 10, -0.1)).toThrow();
    });

    test('throws error when C2 >= C1', () => {
      expect(() => calculateDilution(0.1, 10, 0.5)).toThrow();
    });
  });
});

describe('Titration Calculator', () => {
  describe('calculateTitration', () => {
    test('calculates strong acid-strong base titration', () => {
      const result = calculateTitration({
        titrantConcentration: 0.1,
        analyteConcentration: 0.1,
        analyteVolume: 50,
        stoichiometryRatio: 1,
      });

      expect(result.molesOfAnalyte).toBeCloseTo(0.005, 6);
      expect(result.molesOfTitrant).toBeCloseTo(0.005, 6);
      expect(result.volumeOfTitrant).toBeCloseTo(50, 1);
      expect(result.totalVolume).toBe(100);
      expect(result.concentrationAtEquivalence).toBeCloseTo(0.05, 6);
    });

    test('calculates titration with different concentrations', () => {
      const result = calculateTitration({
        titrantConcentration: 0.2,
        analyteConcentration: 0.1,
        analyteVolume: 25,
      });

      expect(result.volumeOfTitrant).toBeCloseTo(12.5, 1);
      expect(result.totalVolume).toBeCloseTo(37.5, 1);
    });

    test('calculates titration with 2:1 stoichiometry', () => {
      const result = calculateTitration({
        titrantConcentration: 0.1,
        analyteConcentration: 0.1,
        analyteVolume: 50,
        stoichiometryRatio: 2,
      });

      expect(result.volumeOfTitrant).toBeCloseTo(100, 1);
    });

    test('generates titration curve', () => {
      const result = calculateTitration({
        titrantConcentration: 0.1,
        analyteConcentration: 0.1,
        analyteVolume: 50,
      });

      expect(result.titrationCurve).toBeDefined();
      expect(result.titrationCurve.length).toBeGreaterThan(20);
      expect(result.titrationCurve[0]).toHaveProperty('volumeAdded');
      expect(result.titrationCurve[0]).toHaveProperty('ph');
      expect(result.titrationCurve[0]).toHaveProperty('region');
    });

    test('throws error for invalid concentrations', () => {
      expect(() => {
        calculateTitration({
          titrantConcentration: 0,
          analyteConcentration: 0.1,
          analyteVolume: 50,
        });
      }).toThrow('Titrant concentration must be positive');
    });

    test('throws error for invalid volume', () => {
      expect(() => {
        calculateTitration({
          titrantConcentration: 0.1,
          analyteConcentration: 0,
          analyteVolume: 50,
        });
      }).toThrow('Analyte concentration must be positive');
    });

    test('throws error for invalid analyte volume', () => {
      expect(() => {
        calculateTitration({
          titrantConcentration: 0.1,
          analyteConcentration: 0.1,
          analyteVolume: 0,
        });
      }).toThrow('Analyte volume must be positive');
    });

    test('throws error for invalid stoichiometry ratio', () => {
      expect(() => {
        calculateTitration({
          titrantConcentration: 0.1,
          analyteConcentration: 0.1,
          analyteVolume: 50,
          stoichiometryRatio: 0,
        });
      }).toThrow('Stoichiometry ratio must be positive');
    });
  });

  describe('generateTitrationCurve - weak/strong combinations', () => {
    test('generates curve for weak acid-strong base', () => {
      const result = calculateTitration({
        titrantConcentration: 0.1,
        analyteConcentration: 0.1,
        analyteVolume: 50,
        acidStrength: 'weak',
        baseStrength: 'strong',
      });

      expect(result.titrationCurve).toBeDefined();
      expect(result.titrationCurve.length).toBeGreaterThan(20);
    });

    test('generates curve for strong acid-weak base', () => {
      const result = calculateTitration({
        titrantConcentration: 0.1,
        analyteConcentration: 0.1,
        analyteVolume: 50,
        acidStrength: 'strong',
        baseStrength: 'weak',
      });

      expect(result.titrationCurve).toBeDefined();
      expect(result.titrationCurve.length).toBeGreaterThan(20);
    });
  });
});

describe('pH Calculations', () => {
  describe('calculatePHFromConcentration', () => {
    test('calculates pH for strong acid', () => {
      expect(calculatePHFromConcentration(0.1)).toBeCloseTo(1, 6);
      expect(calculatePHFromConcentration(0.01)).toBeCloseTo(2, 6);
      expect(calculatePHFromConcentration(0.001)).toBeCloseTo(3, 6);
    });

    test('calculates pH for neutral solution', () => {
      expect(calculatePHFromConcentration(1e-7)).toBeCloseTo(7, 6);
    });

    test('calculates pH for base', () => {
      expect(calculatePHFromConcentration(1e-11)).toBeCloseTo(11, 6);
    });

    test('throws error for non-positive concentration', () => {
      expect(() => calculatePHFromConcentration(0)).toThrow();
      expect(() => calculatePHFromConcentration(-0.1)).toThrow();
    });
  });

  describe('calculateHConcentrationFromPH', () => {
    test('calculates H+ concentration from pH', () => {
      expect(calculateHConcentrationFromPH(1)).toBeCloseTo(0.1, 8);
      expect(calculateHConcentrationFromPH(7)).toBeCloseTo(1e-7, 12);
      expect(calculateHConcentrationFromPH(14)).toBeCloseTo(1e-14, 16);
    });

    test('throws error for out-of-range pH', () => {
      expect(() => calculateHConcentrationFromPH(-1)).toThrow();
      expect(() => calculateHConcentrationFromPH(15)).toThrow();
    });
  });

  describe('calculatePOH', () => {
    test('calculates pOH from pH', () => {
      expect(calculatePOH(7)).toBe(7);
      expect(calculatePOH(3)).toBe(11);
      expect(calculatePOH(11)).toBe(3);
    });
  });
});

describe('Concentration Unit Conversion', () => {
  describe('convertConcentration', () => {
    const molecularWeight = 58.44; // NaCl

    test('converts molar to millimolar', () => {
      expect(convertConcentration(1, ConcentrationUnits.MOLAR, ConcentrationUnits.MILLIMOLAR)).toBe(
        1000
      );
    });

    test('converts millimolar to molar', () => {
      expect(
        convertConcentration(1000, ConcentrationUnits.MILLIMOLAR, ConcentrationUnits.MOLAR)
      ).toBe(1);
    });

    test('converts molar to micromolar', () => {
      expect(
        convertConcentration(0.001, ConcentrationUnits.MOLAR, ConcentrationUnits.MICROMOLAR)
      ).toBe(1000);
    });

    test('converts PPM to molar with molecular weight', () => {
      const result = convertConcentration(
        5844,
        ConcentrationUnits.PPM,
        ConcentrationUnits.MOLAR,
        molecularWeight
      );
      expect(result).toBeCloseTo(0.1, 6);
    });

    test('converts molar to PPM', () => {
      const result = convertConcentration(
        0.1,
        ConcentrationUnits.MOLAR,
        ConcentrationUnits.PPM,
        molecularWeight
      );
      expect(result).toBeCloseTo(5844, 0);
    });

    test('converts percent to molar', () => {
      const result = convertConcentration(
        1,
        ConcentrationUnits.PERCENT,
        ConcentrationUnits.MOLAR,
        molecularWeight
      );
      expect(result).toBeCloseTo(0.171, 2);
    });

    test('converts between small units', () => {
      expect(
        convertConcentration(1, ConcentrationUnits.MICROMOLAR, ConcentrationUnits.NANOMOLAR)
      ).toBe(1000);
    });

    test('throws error for unknown unit', () => {
      expect(() => {
        convertConcentration(1, 'invalid', ConcentrationUnits.MOLAR);
      }).toThrow();
    });

    test('converts molar to nanomolar', () => {
      expect(
        convertConcentration(0.001, ConcentrationUnits.MOLAR, ConcentrationUnits.NANOMOLAR)
      ).toBe(1000000);
    });

    test('converts nanomolar to molar', () => {
      expect(
        convertConcentration(1000000, ConcentrationUnits.NANOMOLAR, ConcentrationUnits.MOLAR)
      ).toBe(0.001);
    });

    test('converts PPB to molar', () => {
      const result = convertConcentration(
        5.844,
        ConcentrationUnits.PPB,
        ConcentrationUnits.MOLAR,
        58.44
      );
      expect(result).toBeCloseTo(1e-7, 10);
    });

    test('converts molar to PPB', () => {
      const result = convertConcentration(
        0.001,
        ConcentrationUnits.MOLAR,
        ConcentrationUnits.PPB,
        58.44
      );
      expect(result).toBeCloseTo(58440, 0);
    });

    test('converts molar to percent', () => {
      const result = convertConcentration(
        1,
        ConcentrationUnits.MOLAR,
        ConcentrationUnits.PERCENT,
        100
      );
      expect(result).toBe(10);
    });

    test('throws error for unknown target unit', () => {
      expect(() => {
        convertConcentration(1, ConcentrationUnits.MOLAR, 'invalid');
      }).toThrow('Unknown target unit');
    });
  });
});

describe('Water Ionization Constant (Kw)', () => {
  describe('calculateKW', () => {
    test('calculates Kw at 25°C (298.15K)', () => {
      const kw = calculateKW(7, 298.15);
      // The formula gives approximately 1e-14 at 298.15K
      expect(kw).toBeCloseTo(1e-14, 14);
    });

    test('calculates Kw at higher temperature', () => {
      const kw = calculateKW(7, 323.15); // 50°C
      expect(kw).toBeGreaterThan(1e-14);
      expect(kw).toBeLessThan(1e-12);
    });

    test('calculates Kw at lower temperature', () => {
      const kw = calculateKW(7, 273.15); // 0°C
      expect(kw).toBeLessThan(1e-14);
    });

    test('temperature affects Kw value', () => {
      const kw25 = calculateKW(7, 298.15);
      const kw50 = calculateKW(7, 323.15);
      expect(kw50).toBeGreaterThan(kw25);
    });
  });
});

describe('Solution Calculations', () => {
  describe('calculateSolutionParameters', () => {
    const molecularWeight = 58.44; // NaCl

    test('calculates from mass and volume', () => {
      const result = calculateSolutionParameters({
        mass: 5.844,
        molecularWeight,
        volume: 1,
      });

      expect(result.moles).toBeCloseTo(0.1, 6);
      expect(result.mass).toBeCloseTo(5.844, 6);
      expect(result.concentration).toBeCloseTo(0.1, 6);
    });

    test('calculates from moles and volume', () => {
      const result = calculateSolutionParameters({
        moles: 0.5,
        molecularWeight,
        volume: 2,
      });

      expect(result.moles).toBe(0.5);
      expect(result.mass).toBeCloseTo(29.22, 2);
      expect(result.concentration).toBe(0.25);
    });

    test('calculates from concentration and volume', () => {
      const result = calculateSolutionParameters({
        concentration: 0.1,
        molecularWeight,
        volume: 1,
      });

      expect(result.moles).toBe(0.1);
      expect(result.mass).toBeCloseTo(5.844, 3);
    });

    test('calculates from mass and concentration', () => {
      const result = calculateSolutionParameters({
        mass: 11.688,
        molecularWeight,
        concentration: 0.1,
      });

      expect(result.moles).toBeCloseTo(0.2, 6);
      expect(result.volume).toBe(2);
    });

    test('throws error for invalid molecular weight', () => {
      expect(() => {
        calculateSolutionParameters({
          mass: 10,
          molecularWeight: 0,
          volume: 1,
        });
      }).toThrow('Molecular weight must be positive');
    });
  });

  describe('calculateMolarity', () => {
    test('calculates molarity correctly', () => {
      expect(calculateMolarity(0.5, 1)).toBe(0.5);
      expect(calculateMolarity(1, 2)).toBe(0.5);
      expect(calculateMolarity(2, 0.5)).toBe(4);
    });

    test('throws error for negative moles', () => {
      expect(() => calculateMolarity(-1, 1)).toThrow('Moles cannot be negative');
    });

    test('throws error for non-positive volume', () => {
      expect(() => calculateMolarity(1, 0)).toThrow('Volume must be positive');
      expect(() => calculateMolarity(1, -1)).toThrow('Volume must be positive');
    });
  });

  describe('calculateMolesForMolarity', () => {
    test('calculates moles needed for molarity', () => {
      expect(calculateMolesForMolarity(1, 1)).toBe(1);
      expect(calculateMolesForMolarity(0.5, 2)).toBe(1);
      expect(calculateMolesForMolarity(2, 0.5)).toBe(1);
    });

    test('throws error for negative molarity', () => {
      expect(() => calculateMolesForMolarity(-1, 1)).toThrow('Molarity cannot be negative');
    });

    test('throws error for non-positive volume', () => {
      expect(() => calculateMolesForMolarity(1, 0)).toThrow('Volume must be positive');
    });
  });
});
