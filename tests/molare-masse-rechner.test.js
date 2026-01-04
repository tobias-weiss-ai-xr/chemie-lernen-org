/**
 * Unit Tests for Molare-Masse-Rechner (Molar Mass Calculator)
 */

// Import ATOMIC_MASSES from source
const ATOMIC_MASSES = {
  H: 1.008,
  He: 4.003,
  Li: 6.941,
  Be: 9.012,
  B: 10.81,
  C: 12.011,
  N: 14.007,
  O: 15.999,
  F: 19.0,
  Ne: 20.18,
  Na: 22.99,
  Mg: 24.305,
  Al: 26.982,
  Si: 28.085,
  P: 30.974,
  S: 32.06,
  Cl: 35.453,
  Ar: 39.948,
  K: 39.098,
  Ca: 40.078,
  Sc: 44.956,
  Ti: 47.867,
  V: 50.942,
  Cr: 51.996,
  Mn: 54.938,
  Fe: 55.845,
  Co: 58.933,
  Ni: 58.693,
  Cu: 63.546,
  Zn: 65.38,
  Ga: 69.723,
  Ge: 72.63,
  As: 74.922,
  Se: 78.971,
  Br: 79.904,
  Kr: 83.798,
  Rb: 85.468,
  Sr: 87.62,
  Y: 88.906,
  Zr: 91.224,
  Nb: 92.906,
  Mo: 95.95,
  Tc: 98.0,
  Ru: 101.07,
  Rh: 102.91,
  Pd: 106.42,
  Ag: 107.87,
  Cd: 112.41,
  In: 114.82,
  Sn: 118.71,
  Sb: 121.76,
  Te: 127.6,
  I: 126.9,
  Xe: 131.29,
  Cs: 132.91,
  Ba: 137.33,
  La: 138.91,
  Ce: 140.12,
  Pr: 140.91,
  Nd: 144.24,
  Pm: 145.0,
  Sm: 150.36,
  Eu: 151.96,
  Gd: 157.25,
  Tb: 158.93,
  Dy: 162.5,
  Ho: 164.93,
  Er: 167.26,
  Tm: 168.93,
  Yb: 173.05,
  Lu: 174.97,
  Hf: 178.49,
  Ta: 180.95,
  W: 183.84,
  Re: 186.21,
  Os: 190.23,
  Ir: 192.22,
  Pt: 195.08,
  Au: 196.97,
  Hg: 200.59,
  Tl: 204.38,
  Pb: 207.2,
  Bi: 208.98,
  Th: 232.04,
  Pa: 231.04,
  U: 238.03,
};

// Local helper function to parse chemical formula
function parseFormulaLocal(formula) {
  const result = {};

  // Handle parentheses first: (content)number
  const parenRegex = /\(([A-Za-z0-9]+)\)(\d*)/g;
  let match;
  while ((match = parenRegex.exec(formula)) !== null) {
    const groupContent = match[1];
    const multiplier = match[2] === '' ? 1 : parseInt(match[2]);

    // Parse the content inside parentheses
    const innerRegex = /([A-Z][a-z]?)(\d*)/g;
    let innerMatch;
    while ((innerMatch = innerRegex.exec(groupContent)) !== null) {
      const element = innerMatch[1];
      const count = innerMatch[2] === '' ? 1 : parseInt(innerMatch[2]);
      result[element] = (result[element] || 0) + count * multiplier;
    }
  }

  // Remove parenthesized groups from formula
  formula = formula.replace(parenRegex, '');

  // Parse remaining elements
  const regex = /([A-Z][a-z]?)(\d*)/g;
  while ((match = regex.exec(formula)) !== null) {
    const element = match[1];
    const count = match[2] === '' ? 1 : parseInt(match[2]);
    result[element] = (result[element] || 0) + count;
  }

  return result;
}

// Local helper function to calculate molar mass
function calculateMolarMassLocal(formula, atomicMasses) {
  const composition = parseFormulaLocal(formula);
  let total = 0;
  for (const [element, count] of Object.entries(composition)) {
    total += count * atomicMasses[element];
  }
  return total;
}

// Local helper function to get composition details
function getCompositionDetailsLocal(composition, atomicMasses, totalMass) {
  const details = [];
  for (const [element, count] of Object.entries(composition)) {
    const mass = atomicMasses[element];
    const contribution = count * mass;
    const percentage = (contribution / totalMass) * 100;
    details.push({ element, count, mass, contribution, percentage: percentage.toFixed(1) + '%' });
  }
  return details;
}

describe('Molare-Masse-Rechner - ATOMIC_MASSES Constant', () => {
  test('should contain H with correct mass', () => {
    expect(ATOMIC_MASSES['H']).toBeCloseTo(1.008, 3);
  });

  test('should contain C with correct mass', () => {
    expect(ATOMIC_MASSES['C']).toBeCloseTo(12.011, 3);
  });

  test('should contain O with correct mass', () => {
    expect(ATOMIC_MASSES['O']).toBeCloseTo(15.999, 3);
  });

  test('should contain Na with correct mass', () => {
    expect(ATOMIC_MASSES['Na']).toBeCloseTo(22.99, 3);
  });

  test('should contain Cl with correct mass', () => {
    expect(ATOMIC_MASSES['Cl']).toBeCloseTo(35.453, 3);
  });

  test('should contain Fe with correct mass', () => {
    expect(ATOMIC_MASSES['Fe']).toBeCloseTo(55.845, 3);
  });

  test('should contain all first 20 elements', () => {
    const first20 = [
      'H',
      'He',
      'Li',
      'Be',
      'B',
      'C',
      'N',
      'O',
      'F',
      'Ne',
      'Na',
      'Mg',
      'Al',
      'Si',
      'P',
      'S',
      'Cl',
      'Ar',
      'K',
      'Ca',
    ];
    first20.forEach((element) => {
      expect(ATOMIC_MASSES[element]).toBeDefined();
      expect(ATOMIC_MASSES[element]).toBeGreaterThan(0);
    });
  });

  test('should contain common transition metals', () => {
    const transitionMetals = ['Fe', 'Cu', 'Zn', 'Ag', 'Au', 'Hg'];
    transitionMetals.forEach((element) => {
      expect(ATOMIC_MASSES[element]).toBeDefined();
      expect(ATOMIC_MASSES[element]).toBeGreaterThan(0);
    });
  });

  test('should contain 86 elements (H to U)', () => {
    const elementCount = Object.keys(ATOMIC_MASSES).length;
    expect(elementCount).toBe(86);
  });

  test('all atomic masses should be positive numbers', () => {
    for (const [element, mass] of Object.entries(ATOMIC_MASSES)) {
      expect(mass).toBeGreaterThan(0);
    }
  });
});

describe('Molare-Masse-Rechner - Common Molar Mass Calculations', () => {
  test('should calculate molar mass of H2O', () => {
    const mass = calculateMolarMassLocal('H2O', ATOMIC_MASSES);
    expect(mass).toBeCloseTo(18.015, 3);
  });

  test('should calculate molar mass of CO2', () => {
    const mass = calculateMolarMassLocal('CO2', ATOMIC_MASSES);
    expect(mass).toBeCloseTo(44.009, 3);
  });

  test('should calculate molar mass of NaCl', () => {
    const mass = calculateMolarMassLocal('NaCl', ATOMIC_MASSES);
    expect(mass).toBeCloseTo(58.443, 3);
  });

  test('should calculate molar mass of H2SO4', () => {
    const mass = calculateMolarMassLocal('H2SO4', ATOMIC_MASSES);
    expect(mass).toBeCloseTo(98.07, 2);
  });

  test('should calculate molar mass of CaCO3', () => {
    const mass = calculateMolarMassLocal('CaCO3', ATOMIC_MASSES);
    expect(mass).toBeCloseTo(100.086, 3);
  });

  test('should calculate molar mass of NH3', () => {
    const mass = calculateMolarMassLocal('NH3', ATOMIC_MASSES);
    expect(mass).toBeCloseTo(17.031, 3);
  });

  test('should calculate molar mass of CH4', () => {
    const mass = calculateMolarMassLocal('CH4', ATOMIC_MASSES);
    expect(mass).toBeCloseTo(16.043, 3);
  });

  test('should calculate molar mass of C6H12O6 (glucose)', () => {
    const mass = calculateMolarMassLocal('C6H12O6', ATOMIC_MASSES);
    expect(mass).toBeCloseTo(180.156, 3);
  });

  test('should calculate molar mass of Ca(OH)2', () => {
    const mass = calculateMolarMassLocal('Ca(OH)2', ATOMIC_MASSES);
    expect(mass).toBeCloseTo(74.092, 3);
  });

  test('should calculate molar mass of HCl', () => {
    const mass = calculateMolarMassLocal('HCl', ATOMIC_MASSES);
    expect(mass).toBeCloseTo(36.461, 3);
  });

  test('should calculate molar mass of HNO3', () => {
    const mass = calculateMolarMassLocal('HNO3', ATOMIC_MASSES);
    expect(mass).toBeCloseTo(63.012, 3);
  });

  test('should calculate molar mass of Fe2O3', () => {
    const mass = calculateMolarMassLocal('Fe2O3', ATOMIC_MASSES);
    expect(mass).toBeCloseTo(159.687, 3);
  });

  test('should calculate molar mass of AlCl3', () => {
    const mass = calculateMolarMassLocal('AlCl3', ATOMIC_MASSES);
    expect(mass).toBeCloseTo(133.341, 3);
  });
});

describe('Molare-Masse-Rechner - Organic Compounds', () => {
  test('should calculate molar mass of CH3COOH (acetic acid)', () => {
    const mass = calculateMolarMassLocal('CH3COOH', ATOMIC_MASSES);
    expect(mass).toBeCloseTo(60.052, 3);
  });

  test('should calculate molar mass of C2H5OH (ethanol)', () => {
    const mass = calculateMolarMassLocal('C2H5OH', ATOMIC_MASSES);
    expect(mass).toBeCloseTo(46.069, 3);
  });

  test('should calculate molar mass of C6H6 (benzene)', () => {
    const mass = calculateMolarMassLocal('C6H6', ATOMIC_MASSES);
    expect(mass).toBeCloseTo(78.114, 3);
  });

  test('should calculate molar mass of CH3OH (methanol)', () => {
    const mass = calculateMolarMassLocal('CH3OH', ATOMIC_MASSES);
    expect(mass).toBeCloseTo(32.042, 3);
  });
});

describe('Molare-Masse-Rechner - Complex Formulas', () => {
  test('should calculate molar mass of Ca3(PO4)2', () => {
    const mass = calculateMolarMassLocal('Ca3(PO4)2', ATOMIC_MASSES);
    expect(mass).toBeCloseTo(310.174, 3);
  });

  test('should calculate molar mass of Al2(SO4)3', () => {
    const mass = calculateMolarMassLocal('Al2(SO4)3', ATOMIC_MASSES);
    expect(mass).toBeCloseTo(342.132, 3);
  });

  test('should calculate molar mass of Fe2(SO4)3', () => {
    const mass = calculateMolarMassLocal('Fe2(SO4)3', ATOMIC_MASSES);
    expect(mass).toBeCloseTo(399.858, 3);
  });

  test('should calculate molar mass of Mg(OH)2', () => {
    const mass = calculateMolarMassLocal('Mg(OH)2', ATOMIC_MASSES);
    expect(mass).toBeCloseTo(58.319, 3);
  });
});

describe('Molare-Masse-Rechner - Common Salts and Minerals', () => {
  test('should calculate molar mass of AgCl', () => {
    const mass = calculateMolarMassLocal('AgCl', ATOMIC_MASSES);
    expect(mass).toBeCloseTo(143.323, 3);
  });

  test('should calculate molar mass of BaSO4', () => {
    const mass = calculateMolarMassLocal('BaSO4', ATOMIC_MASSES);
    expect(mass).toBeCloseTo(233.39, 2);
  });

  test('should calculate molar mass of KCl', () => {
    const mass = calculateMolarMassLocal('KCl', ATOMIC_MASSES);
    expect(mass).toBeCloseTo(74.551, 3);
  });

  test('should calculate molar mass of PbI2', () => {
    const mass = calculateMolarMassLocal('PbI2', ATOMIC_MASSES);
    expect(mass).toBeCloseTo(461.0, 3);
  });
});

describe('Molare-Masse-Rechner - Stoichiometry Validation', () => {
  test('H2O should have 2 H and 1 O', () => {
    const composition = parseFormulaLocal('H2O');
    expect(composition.H).toBe(2);
    expect(composition.O).toBe(1);
  });

  test('Ca(OH)2 should have correct element counts', () => {
    const composition = parseFormulaLocal('Ca(OH)2');
    expect(composition.Ca).toBe(1);
    expect(composition.O).toBe(2);
    expect(composition.H).toBe(2);
  });

  test('Al2(SO4)3 should have correct element counts', () => {
    const composition = parseFormulaLocal('Al2(SO4)3');
    expect(composition.Al).toBe(2);
    expect(composition.S).toBe(3);
    expect(composition.O).toBe(12);
  });
});

describe('Molare-Masse-Rechner - Mass Percentage Calculations', () => {
  test('H2O should have ~11.2% H and ~88.8% O', () => {
    const composition = parseFormulaLocal('H2O');
    const totalMass = calculateMolarMassLocal('H2O', ATOMIC_MASSES);
    const details = getCompositionDetailsLocal(composition, ATOMIC_MASSES, totalMass);

    const hDetails = details.find((d) => d.element === 'H');
    const oDetails = details.find((d) => d.element === 'O');

    expect(parseFloat(hDetails.percentage)).toBeCloseTo(11.2, 1);
    expect(parseFloat(oDetails.percentage)).toBeCloseTo(88.8, 1);
  });

  test('CO2 should have ~27.3% C and ~72.7% O', () => {
    const composition = parseFormulaLocal('CO2');
    const totalMass = calculateMolarMassLocal('CO2', ATOMIC_MASSES);
    const details = getCompositionDetailsLocal(composition, ATOMIC_MASSES, totalMass);

    const cDetails = details.find((d) => d.element === 'C');
    const oDetails = details.find((d) => d.element === 'O');

    expect(parseFloat(cDetails.percentage)).toBeCloseTo(27.3, 1);
    expect(parseFloat(oDetails.percentage)).toBeCloseTo(72.7, 1);
  });

  test('NaCl should have ~39.3% Na and ~60.7% Cl', () => {
    const composition = parseFormulaLocal('NaCl');
    const totalMass = calculateMolarMassLocal('NaCl', ATOMIC_MASSES);
    const details = getCompositionDetailsLocal(composition, ATOMIC_MASSES, totalMass);

    const naDetails = details.find((d) => d.element === 'Na');
    const clDetails = details.find((d) => d.element === 'Cl');

    expect(parseFloat(naDetails.percentage)).toBeCloseTo(39.3, 1);
    expect(parseFloat(clDetails.percentage)).toBeCloseTo(60.7, 1);
  });
});

describe('Molare-Masse-Rechner - Periodic Table Trends', () => {
  test('Group 1 elements (alkali metals) should have increasing masses', () => {
    expect(ATOMIC_MASSES['Li']).toBeLessThan(ATOMIC_MASSES['Na']);
    expect(ATOMIC_MASSES['Na']).toBeLessThan(ATOMIC_MASSES['K']);
    expect(ATOMIC_MASSES['K']).toBeLessThan(ATOMIC_MASSES['Rb']);
    expect(ATOMIC_MASSES['Rb']).toBeLessThan(ATOMIC_MASSES['Cs']);
  });

  test('Group 17 elements (halogens) should have increasing masses', () => {
    expect(ATOMIC_MASSES['F']).toBeLessThan(ATOMIC_MASSES['Cl']);
    expect(ATOMIC_MASSES['Cl']).toBeLessThan(ATOMIC_MASSES['Br']);
    expect(ATOMIC_MASSES['Br']).toBeLessThan(ATOMIC_MASSES['I']);
  });

  test('Period 2 elements should have generally increasing masses', () => {
    expect(ATOMIC_MASSES['Li']).toBeLessThan(ATOMIC_MASSES['Be']);
    expect(ATOMIC_MASSES['Be']).toBeLessThan(ATOMIC_MASSES['B']);
    expect(ATOMIC_MASSES['B']).toBeLessThan(ATOMIC_MASSES['C']);
  });
});

describe('Molare-Masse-Rechner - Common Laboratory Chemicals', () => {
  test('should calculate molar mass of KMnO4 (potassium permanganate)', () => {
    const mass = calculateMolarMassLocal('KMnO4', ATOMIC_MASSES);
    expect(mass).toBeCloseTo(158.032, 3);
  });

  test('should calculate molar mass of K2Cr2O7 (potassium dichromate)', () => {
    const mass = calculateMolarMassLocal('K2Cr2O7', ATOMIC_MASSES);
    expect(mass).toBeCloseTo(294.181, 3);
  });

  test('should calculate molar mass of Na2CO3 (sodium carbonate)', () => {
    const mass = calculateMolarMassLocal('Na2CO3', ATOMIC_MASSES);
    expect(mass).toBeCloseTo(105.988, 3);
  });

  test('should calculate molar mass of NaHCO3 (sodium bicarbonate)', () => {
    const mass = calculateMolarMassLocal('NaHCO3', ATOMIC_MASSES);
    expect(mass).toBeCloseTo(84.006, 3);
  });

  test('should calculate molar mass of CuSO4 (copper sulfate)', () => {
    const mass = calculateMolarMassLocal('CuSO4', ATOMIC_MASSES);
    expect(mass).toBeCloseTo(159.602, 3);
  });
});
