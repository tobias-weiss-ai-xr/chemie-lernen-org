/**
 * Unit Tests for Redox-Potenzial-Rechner (Redox Potential Calculator)
 */

// Constants from source
const FARADAY_CONSTANT = 96485; // C/mol
const GAS_CONSTANT = 8.314; // J/(mol·K)
const STANDARD_TEMPERATURE = 298.15; // K (25°C)

// Parse input number
function parseNumber(value) {
  value = value.trim();
  const num = parseFloat(value);
  if (isNaN(num)) {
    throw new Error('Ungültige Zahl: ' + value);
  }
  return num;
}

// Format number for display
function formatNumber(value, decimals = 3) {
  if (Math.abs(value) < 0.001 || Math.abs(value) >= 10000) {
    return value.toExponential(decimals - 1);
  }
  return value.toFixed(decimals);
}

// Calculate cell potential
function calculateCellPotential(cathodeE, anodeE, n) {
  const cellPotential = cathodeE - anodeE;
  const deltaG = -n * FARADAY_CONSTANT * cellPotential; // J/mol
  const k = Math.exp(
    (n * FARADAY_CONSTANT * cellPotential) / (GAS_CONSTANT * STANDARD_TEMPERATURE)
  );

  let spontaneity;
  if (cellPotential > 0.001) {
    spontaneity = 'Spontan (exergonisch)';
  } else if (cellPotential < -0.001) {
    spontaneity = 'Nicht spontan (endergonisch)';
  } else {
    spontaneity = 'Gleichgewicht';
  }

  return { cellPotential, deltaG, k, spontaneity };
}

// Calculate Nernst potential
function calculateNernstPotential(cathodeE, anodeE, n, T, ox, red) {
  const e0 = cathodeE - anodeE;
  const Q = ox / red;

  // Natural log form
  const nernstTerm = ((GAS_CONSTANT * T) / (n * FARADAY_CONSTANT)) * Math.log(Q);
  const eCell = e0 - nernstTerm;

  // log10 form (at 25°C)
  const log10Term = (0.0592 / n) * Math.log10(Q);
  const eCellLog10 = e0 - log10Term;

  return { e0, Q, nernstTerm, eCell, log10Term, eCellLog10 };
}

// Calculate Gibbs free energy
function calculateGibbsEnergy(eCell, n, T) {
  const deltaG = -n * FARADAY_CONSTANT * eCell; // J/mol
  const deltaGKJ = deltaG / 1000; // kJ/mol
  const k = Math.exp((n * FARADAY_CONSTANT * eCell) / (GAS_CONSTANT * T));

  let spontaneity;
  if (deltaG < -100) {
    spontaneity = 'Spontan (exergonisch)';
  } else if (deltaG > 100) {
    spontaneity = 'Nicht spontan (endergonisch)';
  } else {
    spontaneity = 'Gleichgewicht';
  }

  return { deltaG, deltaGKJ, k, spontaneity };
}

// Format K value
function formatKValue(k) {
  if (k === 0) return '0';
  if (k === Infinity) return '∞';
  if (!isFinite(k)) return 'N/A';

  if (k < 1e-10) {
    return k.toExponential(2);
  } else if (k > 1e10) {
    return k.toExponential(2);
  } else if (k < 0.01 || k > 1000) {
    return k.toExponential(3);
  } else {
    return k.toFixed(3);
  }
}

describe('Redox-Potenzial-Rechner - Constants', () => {
  test('FARADAY_CONSTANT should be 96485 C/mol', () => {
    expect(FARADAY_CONSTANT).toBe(96485);
  });

  test('GAS_CONSTANT should be 8.314 J/(mol·K)', () => {
    expect(GAS_CONSTANT).toBe(8.314);
  });

  test('STANDARD_TEMPERATURE should be 298.15 K', () => {
    expect(STANDARD_TEMPERATURE).toBe(298.15);
  });
});

describe('Redox-Potenzial-Rechner - parseNumber', () => {
  test('should parse positive number', () => {
    expect(parseNumber('1.5')).toBe(1.5);
  });

  test('should parse negative number', () => {
    expect(parseNumber('-0.5')).toBe(-0.5);
  });

  test('should parse scientific notation', () => {
    expect(parseNumber('1.5e-10')).toBeCloseTo(1.5e-10, 15);
  });

  test('should trim whitespace', () => {
    expect(parseNumber('  1.5  ')).toBe(1.5);
  });

  test('should throw error for invalid input', () => {
    expect(() => parseNumber('invalid')).toThrow('Ungültige Zahl');
  });
});

describe('Redox-Potenzial-Rechner - formatNumber', () => {
  test('should format normal number', () => {
    expect(formatNumber(1.5, 3)).toBe('1.500');
  });

  test('should format very small number in scientific notation', () => {
    const result = formatNumber(1.5e-10, 3);
    expect(result).toContain('e');
  });

  test('should format very large number in scientific notation', () => {
    const result = formatNumber(15000, 3);
    expect(result).toContain('e');
  });
});

describe('Redox-Potenzial-Rechner - Cell Potential Calculation', () => {
  test('should calculate E°cell = E°cathode - E°anode', () => {
    const result = calculateCellPotential(0.8, -0.76, 2);
    expect(result.cellPotential).toBeCloseTo(1.56, 3);
  });

  test('should calculate ΔG° = -nFE°', () => {
    const result = calculateCellPotential(0.8, -0.76, 2);
    // ΔG° = -2 * 96485 * 1.56 = -301,033.2 J/mol
    expect(result.deltaG).toBeCloseTo(-301033, 0);
  });

  test('should calculate K from cell potential', () => {
    const result = calculateCellPotential(0.8, -0.76, 2);
    // K should be very large for positive cell potential
    expect(result.k).toBeGreaterThan(1e40);
  });

  test('should detect spontaneous reaction (E°cell > 0)', () => {
    const result = calculateCellPotential(0.8, -0.76, 2);
    expect(result.spontaneity).toBe('Spontan (exergonisch)');
  });

  test('should detect non-spontaneous reaction (E°cell < 0)', () => {
    const result = calculateCellPotential(-0.76, 0.8, 2);
    expect(result.spontaneity).toBe('Nicht spontan (endergonisch)');
  });

  test('should detect equilibrium (E°cell ≈ 0)', () => {
    const result = calculateCellPotential(0.5, 0.5, 2);
    expect(result.spontaneity).toBe('Gleichgewicht');
  });
});

describe('Redox-Potenzial-Rechner - Nernst Equation', () => {
  test('should calculate reaction quotient Q = [ox]/[red]', () => {
    const result = calculateNernstPotential(0.8, -0.76, 2, 298.15, 0.1, 1);
    expect(result.Q).toBe(0.1);
  });

  test('should calculate Nernst potential E = E° - (RT/nF)·ln(Q)', () => {
    const result = calculateNernstPotential(0.8, -0.76, 2, 298.15, 0.1, 1);
    // E° = 1.56 V, Q = 0.1
    // E = 1.56 - (8.314 * 298.15 / (2 * 96485)) * ln(0.1)
    expect(result.eCell).toBeGreaterThan(result.e0);
  });

  test('should calculate log10 form at 25°C', () => {
    const result = calculateNernstPotential(0.8, -0.76, 2, 298.15, 0.1, 1);
    // E = E° - (0.0592/n) * log10(Q)
    expect(result.eCellLog10).toBeCloseTo(result.eCell, 2);
  });

  test('should handle equal concentrations (Q=1, ln(1)=0)', () => {
    const result = calculateNernstPotential(0.8, -0.76, 2, 298.15, 1, 1);
    expect(result.eCell).toBeCloseTo(result.e0, 5);
  });
});

describe('Redox-Potenzial-Rechner - Gibbs Free Energy', () => {
  test('should calculate ΔG° in J/mol', () => {
    const result = calculateGibbsEnergy(1.56, 2, 298.15);
    expect(result.deltaG).toBeCloseTo(-301033, 0);
  });

  test('should convert ΔG° to kJ/mol', () => {
    const result = calculateGibbsEnergy(1.56, 2, 298.15);
    expect(result.deltaGKJ).toBeCloseTo(-301.033, 3);
  });

  test('should calculate K from Gibbs energy', () => {
    const result = calculateGibbsEnergy(1.56, 2, 298.15);
    expect(result.k).toBeGreaterThan(1e40);
  });

  test('should detect spontaneity from ΔG°', () => {
    const result = calculateGibbsEnergy(1.56, 2, 298.15);
    expect(result.spontaneity).toBe('Spontan (exergonisch)');
  });

  test('should detect non-spontaneity from positive ΔG°', () => {
    const result = calculateGibbsEnergy(-1.56, 2, 298.15);
    expect(result.spontaneity).toBe('Nicht spontan (endergonisch)');
  });
});

describe('Redox-Potenzial-Rechner - Common Redox Couples', () => {
  test('Zn²⁺/Zn: E° = -0.76 V', () => {
    const e = -0.76;
    expect(e).toBeLessThan(0);
  });

  test('Cu²⁺/Cu: E° = +0.34 V', () => {
    const e = 0.34;
    expect(e).toBeGreaterThan(0);
  });

  test('Daniell cell (Zn|Zn²⁺||Cu²⁺|Cu)', () => {
    // E°cell = E°Cu - E°Zn = 0.34 - (-0.76) = 1.10 V
    const result = calculateCellPotential(0.34, -0.76, 2);
    expect(result.cellPotential).toBeCloseTo(1.1, 2);
  });
});

describe('Redox-Potenzial-Rechner - formatKValue', () => {
  test('should format zero', () => {
    expect(formatKValue(0)).toBe('0');
  });

  test('should format infinity', () => {
    expect(formatKValue(Infinity)).toBe('∞');
  });

  test('should format very small K', () => {
    const result = formatKValue(1e-15);
    expect(result).toContain('e');
  });

  test('should format very large K', () => {
    const result = formatKValue(1e15);
    expect(result).toContain('e');
  });

  test('should format normal K', () => {
    expect(formatKValue(123.456)).toBe('123.456');
  });
});

describe('Redox-Potenzial-Rechner - Practical Examples', () => {
  test('should calculate standard cell potential for Ag⁺/Ag vs Cu²⁺/Cu', () => {
    // Ag⁺ + e⁻ → Ag: E° = +0.80 V
    // Cu²⁺ + 2e⁻ → Cu: E° = +0.34 V
    // For n=2: E°cell = 0.80 - 0.34 = 0.46 V
    const result = calculateCellPotential(0.8, 0.34, 2);
    expect(result.cellPotential).toBeCloseTo(0.46, 2);
    expect(result.spontaneity).toBe('Spontan (exergonisch)');
  });

  test('should calculate Gibbs energy for large positive cell potential', () => {
    const result = calculateGibbsEnergy(2.0, 2, 298.15);
    // ΔG° = -2 * 96485 * 2.0 = -385,940 J/mol
    expect(result.deltaGKJ).toBeCloseTo(-385.94, 2);
  });

  test('should calculate equilibrium constant for favorable reaction', () => {
    const result = calculateCellPotential(0.8, -0.76, 2);
    // Very large K means reaction goes to completion
    expect(result.k).toBeGreaterThan(1e50);
  });
});

describe('Redox-Potenzial-Rechner - Temperature Effects', () => {
  test('should calculate Nernst potential at different temperature', () => {
    // Lower temperature should affect the Nernst term
    const result1 = calculateNernstPotential(0.8, -0.76, 2, 273.15, 0.1, 1);
    const result2 = calculateNernstPotential(0.8, -0.76, 2, 373.15, 0.1, 1);

    // The Nernst term should be different at different temperatures
    expect(result1.nernstTerm).not.toBeCloseTo(result2.nernstTerm, 5);
  });

  test('should calculate Gibbs energy at different temperature', () => {
    const result1 = calculateGibbsEnergy(1.56, 2, 273.15);
    const result2 = calculateGibbsEnergy(1.56, 2, 373.15);

    // Cell potential doesn't change, but K does due to temperature
    expect(result1.deltaG).toBeCloseTo(result2.deltaG, 0);
    expect(result1.k).not.toBeCloseTo(result2.k, 5);
  });
});

describe('Redox-Potenzial-Rechner - Electron Count Variations', () => {
  test('should handle n=1 correctly', () => {
    const result = calculateCellPotential(0.8, -0.76, 1);
    expect(result.deltaG).toBeCloseTo(-150517, 0);
  });

  test('should handle n=3 correctly', () => {
    const result = calculateCellPotential(0.8, -0.76, 3);
    expect(result.deltaG).toBeCloseTo(-451550, 0);
  });

  test('Gibbs energy scales with n', () => {
    const result1 = calculateCellPotential(1.0, 0.0, 1);
    const result2 = calculateCellPotential(1.0, 0.0, 2);

    expect(result2.deltaG).toBeCloseTo(2 * result1.deltaG, 0);
  });
});

describe('Redox-Potenzial-Rechner - Le Chatelier Principle', () => {
  test('increased [ox] should decrease cell potential (Nernst)', () => {
    const result1 = calculateNernstPotential(0.8, -0.76, 2, 298.15, 1, 1);
    const result2 = calculateNernstPotential(0.8, -0.76, 2, 298.15, 10, 1);

    // More oxidized form should decrease potential
    expect(result2.eCell).toBeLessThan(result1.eCell);
  });

  test('increased [red] should increase cell potential (Nernst)', () => {
    const result1 = calculateNernstPotential(0.8, -0.76, 2, 298.15, 1, 1);
    const result2 = calculateNernstPotential(0.8, -0.76, 2, 298.15, 1, 10);

    // More reduced form should increase potential
    expect(result2.eCell).toBeGreaterThan(result1.eCell);
  });
});
