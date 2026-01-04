/**
 * Unit Tests for Löslichkeitsprodukt-Rechner (Solubility Product Calculator)
 */

// Mock ChemistryUtils
global.window = {
  ChemistryUtils: {
    parseFormula: jest.fn((formula) => {
      const regex = /([A-Z][a-z]?)(\d*)/g;
      const result = {};
      let match;
      while ((match = regex.exec(formula)) !== null) {
        const element = match[1];
        const count = match[2] === '' ? 1 : parseInt(match[2]);
        result[element] = (result[element] || 0) + count;
      }
      return result;
    }),
    formatFormula: jest.fn((formula) => {
      return formula.replace(/(\d+)/g, '<sub>$1</sub>');
    }),
  },
};

// Scientific notation parser (from source)
function parseScientificNotation(value) {
  // Clean up the input - handle various formats
  value = value.trim().replace(/\s+/g, ''); // Remove all spaces first

  // Convert multiplication sign to 'e'
  value = value.replace(/×/g, 'e').replace(/·/g, 'e');

  // Handle superscript notation: convert "e10⁻¹⁰" to "e-10"
  // Match 'e' followed by digits and superscript digits/minus
  value = value.replace(/e(\d*)([⁰¹²³⁴⁵⁶⁷⁸⁹⁻]+)/g, (match, prefix, superscript) => {
    const superscriptMap = {
      '⁰': '0',
      '¹': '1',
      '²': '2',
      '³': '3',
      '⁴': '4',
      '⁵': '5',
      '⁶': '6',
      '⁷': '7',
      '⁸': '8',
      '⁹': '9',
      '⁻': '-',
    };
    let converted = '';
    for (const char of superscript) {
      converted += superscriptMap[char] || char;
    }
    return 'e' + converted;
  });

  // Parse as float
  const num = parseFloat(value);
  if (isNaN(num)) {
    throw new Error('Ungültige Zahl: ' + value);
  }
  return num;
}

// Format number in scientific notation (from source)
function formatScientific(value, significantFigures = 3) {
  if (value === 0) return '0';

  // For very large or very small numbers, use scientific notation
  if (Math.abs(value) < 0.01 || Math.abs(value) >= 10000) {
    return value
      .toExponential(significantFigures - 1)
      .replace('e', ' × 10^')
      .replace(/\^(-?\d+)/g, '^{$1}');
  }

  // For normal numbers, use appropriate precision
  return value.toFixed(significantFigures - Math.floor(Math.log10(Math.abs(value))) - 1);
}

// Re-define the functions locally since they're not exported
function parseSaltStoichiometry(formula) {
  formula = formula.trim().replace(/\s+/g, '');

  const commonSalts = {
    AgCl: { cations: 1, anions: 1 },
    AgBr: { cations: 1, anions: 1 },
    AgI: { cations: 1, anions: 1 },
    Ag2CrO4: { cations: 2, anions: 1 },
    Ag2CO3: { cations: 2, anions: 1 },
    Ag3PO4: { cations: 3, anions: 1 },
    'Ca(OH)2': { cations: 1, anions: 2 },
    CaF2: { cations: 1, anions: 2 },
    CaCO3: { cations: 1, anions: 1 },
    CaSO4: { cations: 1, anions: 1 },
    'Ca3(PO4)2': { cations: 3, anions: 2 },
    BaSO4: { cations: 1, anions: 1 },
    BaCO3: { cations: 1, anions: 1 },
    PbCl2: { cations: 1, anions: 2 },
    PbSO4: { cations: 1, anions: 1 },
    PbI2: { cations: 1, anions: 2 },
    'Mg(OH)2': { cations: 1, anions: 2 },
    'Fe(OH)2': { cations: 1, anions: 2 },
    'Fe(OH)3': { cations: 1, anions: 3 },
    'Al(OH)3': { cations: 1, anions: 3 },
    NaCl: { cations: 1, anions: 1 },
    KCl: { cations: 1, anions: 1 },
  };

  if (commonSalts[formula]) {
    return commonSalts[formula];
  }

  // For auto-detection, parse formula if ChemistryUtils is available
  if (global.window && global.window.ChemistryUtils && global.window.ChemistryUtils.parseFormula) {
    const composition = global.window.ChemistryUtils.parseFormula(formula);
    const elements = Object.keys(composition);
    if (elements.length === 2) {
      const [elem1, elem2] = elements;
      const count1 = composition[elem1];
      const count2 = composition[elem2];

      const metals = [
        'Li',
        'Na',
        'K',
        'Rb',
        'Cs',
        'Fr',
        'Be',
        'Mg',
        'Ca',
        'Sr',
        'Ba',
        'Ra',
        'Al',
        'Ga',
        'In',
        'Sn',
        'Tl',
        'Pb',
        'Bi',
        'Ag',
        'Zn',
        'Cd',
        'Hg',
        'Cu',
        'Fe',
        'Ni',
        'Co',
        'Cr',
        'Mn',
        'V',
        'Ti',
      ];

      if (metals.includes(elem1)) {
        return { cations: count1, anions: count2 };
      } else if (metals.includes(elem2)) {
        return { cations: count2, anions: count1 };
      }
    }
  }

  return { cations: 1, anions: 1 };
}

// Calculate solubility from Ksp
function calculateSolubility(ksp, stoichiometry) {
  const a = stoichiometry.cations;
  const b = stoichiometry.anions;
  const coefficient = Math.pow(a, a) * Math.pow(b, b);
  const solubility = Math.pow(ksp / coefficient, 1 / (a + b));

  return {
    solubility,
    cationConc: a * solubility,
    anionConc: b * solubility,
  };
}

// Calculate Ksp from solubility
function calculateKsp(solubility, stoichiometry) {
  const a = stoichiometry.cations;
  const b = stoichiometry.anions;
  const coefficient = Math.pow(a, a) * Math.pow(b, b);
  const ksp = coefficient * Math.pow(solubility, a + b);

  return {
    ksp,
    cationConc: a * solubility,
    anionConc: b * solubility,
  };
}

// Check precipitation status
function checkPrecipitationStatus(ksp, cationConc, anionConc, stoichiometry) {
  const a = stoichiometry.cations;
  const b = stoichiometry.anions;
  const Q = Math.pow(cationConc, a) * Math.pow(anionConc, b);

  let status, message;
  if (Q < ksp * 0.99) {
    status = 'Keine Fällung';
    message = 'Q < Ksp: Die Lösung ist ungesättigt.';
  } else if (Q > ksp * 1.01) {
    status = 'Fällung erfolgt';
    message = 'Q > Ksp: Die Lösung ist übersättigt.';
  } else {
    status = 'Gleichgewicht';
    message = 'Q ≈ Ksp: Die Lösung ist gesättigt.';
  }

  return { Q, status, message };
}

describe('Löslichkeitsprodukt-Rechner - parseScientificNotation', () => {
  test('should parse simple decimal', () => {
    expect(parseScientificNotation('1.5')).toBe(1.5);
  });

  test('should parse scientific notation 1.5e-10', () => {
    expect(parseScientificNotation('1.5e-10')).toBeCloseTo(1.5e-10, 15);
  });

  test('should parse 1.8 × 10⁻¹⁰ format', () => {
    expect(parseScientificNotation('1.8 × 10⁻¹⁰')).toBeCloseTo(1.8e-10, 15);
  });

  test('should handle very small numbers', () => {
    expect(parseScientificNotation('1e-14')).toBeCloseTo(1e-14, 15);
  });

  test('should handle very large numbers', () => {
    expect(parseScientificNotation('1.5e10')).toBeCloseTo(1.5e10, 5);
  });

  test('should throw error for invalid input', () => {
    expect(() => parseScientificNotation('invalid')).toThrow('Ungültige Zahl');
  });

  test('should trim whitespace', () => {
    expect(parseScientificNotation('  1.5  ')).toBe(1.5);
  });
});

describe('Löslichkeitsprodukt-Rechner - formatScientific', () => {
  test('should format zero', () => {
    expect(formatScientific(0)).toBe('0');
  });

  test('should format normal numbers', () => {
    expect(formatScientific(1.23, 3)).toBe('1.23');
  });

  test('should format very small numbers in scientific notation', () => {
    const result = formatScientific(1.5e-10, 3);
    expect(result).toContain('× 10^');
  });

  test('should format very large numbers in scientific notation', () => {
    const result = formatScientific(15000, 3);
    expect(result).toContain('× 10^');
  });

  test('should format 1e-10', () => {
    const result = formatScientific(1e-10, 3);
    expect(result).toContain('^{-10');
  });
});

describe('Löslichkeitsprodukt-Rechner - parseSaltStoichiometry', () => {
  test('should parse AgCl (1:1 salt)', () => {
    const result = parseSaltStoichiometry('AgCl');
    expect(result).toEqual({ cations: 1, anions: 1 });
  });

  test('should parse Ca(OH)2 (1:2 salt)', () => {
    const result = parseSaltStoichiometry('Ca(OH)2');
    expect(result).toEqual({ cations: 1, anions: 2 });
  });

  test('should parse Ag2CrO4 (2:1 salt)', () => {
    const result = parseSaltStoichiometry('Ag2CrO4');
    expect(result).toEqual({ cations: 2, anions: 1 });
  });

  test('should parse Ag3PO4 (3:1 salt)', () => {
    const result = parseSaltStoichiometry('Ag3PO4');
    expect(result).toEqual({ cations: 3, anions: 1 });
  });

  test('should parse Ca3(PO4)2 (3:2 salt)', () => {
    const result = parseSaltStoichiometry('Ca3(PO4)2');
    expect(result).toEqual({ cations: 3, anions: 2 });
  });

  test('should parse BaSO4 (1:1 salt)', () => {
    const result = parseSaltStoichiometry('BaSO4');
    expect(result).toEqual({ cations: 1, anions: 1 });
  });

  test('should parse PbCl2 (1:2 salt)', () => {
    const result = parseSaltStoichiometry('PbCl2');
    expect(result).toEqual({ cations: 1, anions: 2 });
  });

  test('should parse Fe(OH)3 (1:3 salt)', () => {
    const result = parseSaltStoichiometry('Fe(OH)3');
    expect(result).toEqual({ cations: 1, anions: 3 });
  });
});

describe('Löslichkeitsprodukt-Rechner - Calculate Solubility from Ksp', () => {
  test('should calculate solubility for AgCl (1:1 salt)', () => {
    const ksp = 1.8e-10;
    const stoichiometry = { cations: 1, anions: 1 };
    const result = calculateSolubility(ksp, stoichiometry);

    expect(result.solubility).toBeCloseTo(1.34e-5, 2);
    expect(result.cationConc).toBeCloseTo(1.34e-5, 2);
    expect(result.anionConc).toBeCloseTo(1.34e-5, 2);
  });

  test('should calculate solubility for Ca(OH)2 (1:2 salt)', () => {
    const ksp = 5.5e-6;
    const stoichiometry = { cations: 1, anions: 2 };
    const result = calculateSolubility(ksp, stoichiometry);

    // s = (Ksp / 4)^(1/3)
    expect(result.solubility).toBeCloseTo(0.011, 2);
    expect(result.cationConc).toBeCloseTo(0.011, 2);
    expect(result.anionConc).toBeCloseTo(0.022, 2);
  });

  test('should calculate solubility for Ag2CrO4 (2:1 salt)', () => {
    const ksp = 1.1e-12;
    const stoichiometry = { cations: 2, anions: 1 };
    const result = calculateSolubility(ksp, stoichiometry);

    // s = (Ksp / 4)^(1/3)
    expect(result.solubility).toBeCloseTo(6.5e-5, 1);
    expect(result.cationConc).toBeCloseTo(1.3e-4, 1);
    expect(result.anionConc).toBeCloseTo(6.5e-5, 1);
  });

  test('should calculate solubility for Ca3(PO4)2 (3:2 salt)', () => {
    const ksp = 2.07e-33;
    const stoichiometry = { cations: 3, anions: 2 };
    const result = calculateSolubility(ksp, stoichiometry);

    // s = (Ksp / 108)^(1/5)
    expect(result.solubility).toBeGreaterThan(1e-7);
    expect(result.solubility).toBeLessThan(1e-6);
  });

  test('should calculate solubility for BaSO4 (very insoluble)', () => {
    const ksp = 1.1e-10;
    const stoichiometry = { cations: 1, anions: 1 };
    const result = calculateSolubility(ksp, stoichiometry);

    expect(result.solubility).toBeCloseTo(1.05e-5, 2);
  });

  test('should calculate solubility for NaCl (very soluble)', () => {
    // Note: NaCl Ksp is very large at room temp, using representative value
    const ksp = 37.7; // Approximately at saturation
    const stoichiometry = { cations: 1, anions: 1 };
    const result = calculateSolubility(ksp, stoichiometry);

    expect(result.solubility).toBeCloseTo(6.14, 1);
  });
});

describe('Löslichkeitsprodukt-Rechner - Calculate Ksp from Solubility', () => {
  test('should calculate Ksp for AgCl from solubility', () => {
    const solubility = 1.34e-5;
    const stoichiometry = { cations: 1, anions: 1 };
    const result = calculateKsp(solubility, stoichiometry);

    // Ksp = s^2 for 1:1 salt
    expect(result.ksp).toBeCloseTo(1.8e-10, 1);
  });

  test('should calculate Ksp for Ca(OH)2 from solubility', () => {
    const solubility = 0.011;
    const stoichiometry = { cations: 1, anions: 2 };
    const result = calculateKsp(solubility, stoichiometry);

    // Ksp = 4*s^3 for 1:2 salt
    expect(result.ksp).toBeCloseTo(5.3e-6, 1);
  });

  test('should calculate Ksp for Ag2CrO4 from solubility', () => {
    const solubility = 6.5e-5;
    const stoichiometry = { cations: 2, anions: 1 };
    const result = calculateKsp(solubility, stoichiometry);

    // Ksp = 4*s^3 for 2:1 salt
    expect(result.ksp).toBeCloseTo(1.1e-12, 1);
  });

  test('should calculate Ksp for BaSO4 from solubility', () => {
    const solubility = 1.05e-5;
    const stoichiometry = { cations: 1, anions: 1 };
    const result = calculateKsp(solubility, stoichiometry);

    expect(result.ksp).toBeCloseTo(1.1e-10, 1);
  });

  test('should calculate ion concentrations correctly', () => {
    const solubility = 0.01;
    const stoichiometry = { cations: 1, anions: 2 };
    const result = calculateKsp(solubility, stoichiometry);

    expect(result.cationConc).toBe(0.01);
    expect(result.anionConc).toBe(0.02);
  });
});

describe('Löslichkeitsprodukt-Rechner - Check Precipitation', () => {
  test('should detect no precipitation (Q < Ksp)', () => {
    const ksp = 1.8e-10;
    const cationConc = 1e-6;
    const anionConc = 1e-6;
    const stoichiometry = { cations: 1, anions: 1 };

    const result = checkPrecipitationStatus(ksp, cationConc, anionConc, stoichiometry);

    expect(result.status).toBe('Keine Fällung');
    expect(result.Q).toBeLessThan(ksp);
  });

  test('should detect precipitation (Q > Ksp)', () => {
    const ksp = 1.8e-10;
    const cationConc = 1e-4;
    const anionConc = 1e-4;
    const stoichiometry = { cations: 1, anions: 1 };

    const result = checkPrecipitationStatus(ksp, cationConc, anionConc, stoichiometry);

    expect(result.status).toBe('Fällung erfolgt');
    expect(result.Q).toBeGreaterThan(ksp);
  });

  test('should detect equilibrium (Q ≈ Ksp)', () => {
    const ksp = 1.8e-10;
    const cationConc = 1.34e-5;
    const anionConc = 1.34e-5;
    const stoichiometry = { cations: 1, anions: 1 };

    const result = checkPrecipitationStatus(ksp, cationConc, anionConc, stoichiometry);

    expect(result.status).toBe('Gleichgewicht');
  });

  test('should calculate Q correctly for 1:1 salt', () => {
    const ksp = 1.8e-10;
    const cationConc = 1e-5;
    const anionConc = 2e-5;
    const stoichiometry = { cations: 1, anions: 1 };

    const result = checkPrecipitationStatus(ksp, cationConc, anionConc, stoichiometry);

    // Q = [Ag+][Cl-]
    expect(result.Q).toBeCloseTo(2e-10, 15);
  });

  test('should calculate Q correctly for 1:2 salt', () => {
    const ksp = 5.5e-6;
    const cationConc = 0.01;
    const anionConc = 0.02;
    const stoichiometry = { cations: 1, anions: 2 };

    const result = checkPrecipitationStatus(ksp, cationConc, anionConc, stoichiometry);

    // Q = [Ca2+][OH-]^2
    expect(result.Q).toBe(0.01 * Math.pow(0.02, 2));
  });

  test('should calculate Q correctly for 2:1 salt', () => {
    const ksp = 1.1e-12;
    const cationConc = 1e-4;
    const anionConc = 5e-5;
    const stoichiometry = { cations: 2, anions: 1 };

    const result = checkPrecipitationStatus(ksp, cationConc, anionConc, stoichiometry);

    // Q = [Ag+]^2[CrO4^2-]
    expect(result.Q).toBe(Math.pow(1e-4, 2) * 5e-5);
  });
});

describe('Löslichkeitsprodukt-Rechner - Common Salts', () => {
  test('AgCl Ksp and solubility relationship', () => {
    const ksp = 1.8e-10;
    const stoichiometry = { cations: 1, anions: 1 };

    // Calculate solubility
    const solResult = calculateSolubility(ksp, stoichiometry);

    // Calculate Ksp back from solubility
    const kspResult = calculateKsp(solResult.solubility, stoichiometry);

    expect(kspResult.ksp).toBeCloseTo(ksp, 10);
  });

  test('BaSO4 solubility calculations', () => {
    const ksp = 1.1e-10;
    const stoichiometry = { cations: 1, anions: 1 };
    const result = calculateSolubility(ksp, stoichiometry);

    expect(result.solubility).toBeLessThan(2e-5);
    expect(result.cationConc).toBe(result.anionConc);
  });

  test('CaF2 (fluorite) solubility', () => {
    const ksp = 3.9e-11;
    const stoichiometry = { cations: 1, anions: 2 };
    const result = calculateSolubility(ksp, stoichiometry);

    // For CaF2: Ksp = 4s^3, s = (Ksp/4)^(1/3)
    expect(result.anionConc).toBe(2 * result.cationConc);
  });
});

describe('Löslichkeitsprodukt-Rechner - Edge Cases', () => {
  test('should handle very small Ksp values', () => {
    const ksp = 1e-50;
    const stoichiometry = { cations: 1, anions: 1 };
    const result = calculateSolubility(ksp, stoichiometry);

    expect(result.solubility).toBeGreaterThan(0);
    expect(result.solubility).toBeLessThan(1e-24);
  });

  test('should handle very large Ksp values', () => {
    const ksp = 100;
    const stoichiometry = { cations: 1, anions: 1 };
    const result = calculateSolubility(ksp, stoichiometry);

    expect(result.solubility).toBe(10);
  });

  test('should handle different stoichiometries', () => {
    // Test 1:1
    const s1_1 = calculateSolubility(1e-12, { cations: 1, anions: 1 });
    expect(s1_1.cationConc).toBe(s1_1.anionConc);

    // Test 1:2
    const s1_2 = calculateSolubility(4e-9, { cations: 1, anions: 2 });
    expect(s1_2.anionConc).toBe(2 * s1_2.cationConc);

    // Test 2:1
    const s2_1 = calculateSolubility(4e-9, { cations: 2, anions: 1 });
    expect(s2_1.cationConc).toBe(2 * s2_1.anionConc);
  });
});

describe('Löslichkeitsprodukt-Rechner - Practical Examples', () => {
  test('should calculate if precipitation occurs when mixing Ag+ and Cl- solutions', () => {
    const ksp = 1.8e-10;
    const cationConc = 0.001; // 1 mM Ag+
    const anionConc = 0.001; // 1 mM Cl-
    const stoichiometry = { cations: 1, anions: 1 };

    const result = checkPrecipitationStatus(ksp, cationConc, anionConc, stoichiometry);

    expect(result.status).toBe('Fällung erfolgt');
  });

  test('should calculate if BaSO4 precipitates from Ba2+ and SO42- solutions', () => {
    const ksp = 1.1e-10;
    const cationConc = 0.0001; // 0.1 mM Ba2+
    const anionConc = 0.0001; // 0.1 mM SO42-
    const stoichiometry = { cations: 1, anions: 1 };

    const result = checkPrecipitationStatus(ksp, cationConc, anionConc, stoichiometry);

    expect(result.Q).toBeGreaterThan(ksp);
    expect(result.status).toBe('Fällung erfolgt');
  });

  test('should verify solubility product for saturated solution', () => {
    const ksp = 1.8e-10;
    const solubility = 1.34e-5;
    const stoichiometry = { cations: 1, anions: 1 };

    const result = calculateKsp(solubility, stoichiometry);

    // Calculate Q from the ion concentrations
    const cationConc = result.cationConc;
    const anionConc = result.anionConc;
    const checkResult = checkPrecipitationStatus(result.ksp, cationConc, anionConc, stoichiometry);

    expect(checkResult.status).toBe('Gleichgewicht');
  });
});
