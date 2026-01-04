/**
 * Unit Tests for pH-Rechner (pH Calculator)
 */

// pH calculation utilities extracted for testing
const KW_25C = 1e-14; // Water ion product at 25°C

// Calculate pH from H+ concentration
function calculatePHFromHPlus(hplus) {
  if (isNaN(hplus) || hplus <= 0) {
    throw new Error('Invalid H+ concentration');
  }
  const ph = -Math.log10(hplus);
  return Math.max(0, Math.min(14, ph));
}

// Calculate pH from OH- concentration
function calculatePHFromOHMinus(ohminus) {
  if (isNaN(ohminus) || ohminus <= 0) {
    throw new Error('Invalid OH- concentration');
  }
  const poh = -Math.log10(ohminus);
  const ph = 14 - poh;
  return Math.max(0, Math.min(14, ph));
}

// Calculate pH from pOH
function calculatePHFromPOH(poh) {
  if (isNaN(poh) || poh < 0 || poh > 14) {
    throw new Error('Invalid pOH value');
  }
  return 14 - poh;
}

// Calculate pOH from pH
function calculatePOHFromPH(ph) {
  if (isNaN(ph) || ph < 0 || ph > 14) {
    throw new Error('Invalid pH value');
  }
  return 14 - ph;
}

// Calculate H+ concentration from pH
function calculateHPlusFromPH(ph) {
  if (isNaN(ph) || ph < 0 || ph > 14) {
    throw new Error('Invalid pH value');
  }
  return Math.pow(10, -ph);
}

// Calculate OH- concentration from pH
function calculateOHMinusFromPH(ph) {
  if (isNaN(ph) || ph < 0 || ph > 14) {
    throw new Error('Invalid pH value');
  }
  const poh = 14 - ph;
  return Math.pow(10, -poh);
}

// Get pH description
function getPHDescription(ph) {
  if (ph < 2) return 'Sehr stark sauer';
  if (ph < 4) return 'Stark sauer';
  if (ph < 6) return 'Sauer';
  if (ph === 7) return 'Neutral';
  if (ph < 8) return 'Fast neutral';
  if (ph < 11) return 'Basisch';
  return 'Stark basisch';
}

describe('pH-Rechner - Constants', () => {
  test('KW_25C should be correct value', () => {
    expect(KW_25C).toBe(1e-14);
  });
});

describe('pH-Rechner - Calculate pH from H+ concentration', () => {
  test('should calculate pH for neutral solution [H+] = 1e-7 M', () => {
    const hplus = 1e-7;
    const ph = calculatePHFromHPlus(hplus);
    expect(ph).toBeCloseTo(7.0, 2);
  });

  test('should calculate pH for acidic solution [H+] = 1e-3 M', () => {
    const hplus = 1e-3;
    const ph = calculatePHFromHPlus(hplus);
    expect(ph).toBeCloseTo(3.0, 2);
  });

  test('should calculate pH for basic solution [H+] = 1e-11 M', () => {
    const hplus = 1e-11;
    const ph = calculatePHFromHPlus(hplus);
    expect(ph).toBeCloseTo(11.0, 2);
  });

  test('should calculate pH for [H+] = 0.1 M', () => {
    const hplus = 0.1;
    const ph = calculatePHFromHPlus(hplus);
    expect(ph).toBeCloseTo(1.0, 2);
  });

  test('should calculate pH for [H+] = 1e-6 M', () => {
    const hplus = 1e-6;
    const ph = calculatePHFromHPlus(hplus);
    expect(ph).toBeCloseTo(6.0, 2);
  });

  test('should calculate pH for [H+] = 1e-12 M', () => {
    const hplus = 1e-12;
    const ph = calculatePHFromHPlus(hplus);
    expect(ph).toBeCloseTo(12.0, 2);
  });

  test('should handle very high [H+] = 1 M', () => {
    const hplus = 1;
    const ph = calculatePHFromHPlus(hplus);
    expect(ph).toBeCloseTo(0.0, 2);
  });

  test('should handle very low [H+] = 1e-14 M', () => {
    const hplus = 1e-14;
    const ph = calculatePHFromHPlus(hplus);
    expect(ph).toBeCloseTo(14.0, 2);
  });

  test('should clamp pH to maximum 14', () => {
    const hplus = 1e-15;
    const ph = calculatePHFromHPlus(hplus);
    expect(ph).toBe(14);
  });

  test('should clamp pH to minimum 0', () => {
    const hplus = 10;
    const ph = calculatePHFromHPlus(hplus);
    expect(ph).toBe(0);
  });

  test('should throw error for negative H+ concentration', () => {
    expect(() => calculatePHFromHPlus(-1)).toThrow('Invalid H+ concentration');
  });

  test('should throw error for zero H+ concentration', () => {
    expect(() => calculatePHFromHPlus(0)).toThrow('Invalid H+ concentration');
  });

  test('should throw error for NaN H+ concentration', () => {
    expect(() => calculatePHFromHPlus(NaN)).toThrow('Invalid H+ concentration');
  });
});

describe('pH-Rechner - Calculate pH from OH- concentration', () => {
  test('should calculate pH for neutral solution [OH-] = 1e-7 M', () => {
    const ohminus = 1e-7;
    const ph = calculatePHFromOHMinus(ohminus);
    expect(ph).toBeCloseTo(7.0, 2);
  });

  test('should calculate pH for basic solution [OH-] = 1e-3 M', () => {
    const ohminus = 1e-3;
    const ph = calculatePHFromOHMinus(ohminus);
    expect(ph).toBeCloseTo(11.0, 2);
  });

  test('should calculate pH for acidic solution [OH-] = 1e-11 M', () => {
    const ohminus = 1e-11;
    const ph = calculatePHFromOHMinus(ohminus);
    expect(ph).toBeCloseTo(3.0, 2);
  });

  test('should calculate pH for [OH-] = 0.1 M', () => {
    const ohminus = 0.1;
    const ph = calculatePHFromOHMinus(ohminus);
    expect(ph).toBeCloseTo(13.0, 2);
  });

  test('should calculate pH for [OH-] = 1e-6 M', () => {
    const ohminus = 1e-6;
    const ph = calculatePHFromOHMinus(ohminus);
    expect(ph).toBeCloseTo(8.0, 2);
  });

  test('should calculate pH for [OH-] = 1e-12 M', () => {
    const ohminus = 1e-12;
    const ph = calculatePHFromOHMinus(ohminus);
    expect(ph).toBeCloseTo(2.0, 2);
  });

  test('should handle very high [OH-] = 1 M', () => {
    const ohminus = 1;
    const ph = calculatePHFromOHMinus(ohminus);
    expect(ph).toBeCloseTo(14.0, 2);
  });

  test('should clamp pH to minimum 0 for very low [OH-]', () => {
    const ohminus = 1e-15;
    const ph = calculatePHFromOHMinus(ohminus);
    expect(ph).toBe(0);
  });

  test('should throw error for negative OH- concentration', () => {
    expect(() => calculatePHFromOHMinus(-1)).toThrow('Invalid OH- concentration');
  });

  test('should throw error for zero OH- concentration', () => {
    expect(() => calculatePHFromOHMinus(0)).toThrow('Invalid OH- concentration');
  });
});

describe('pH-Rechner - Calculate pH from pOH', () => {
  test('should calculate pH for pOH = 7 (neutral)', () => {
    const poh = 7;
    const ph = calculatePHFromPOH(poh);
    expect(ph).toBe(7);
  });

  test('should calculate pH for pOH = 3 (basic)', () => {
    const poh = 3;
    const ph = calculatePHFromPOH(poh);
    expect(ph).toBe(11);
  });

  test('should calculate pH for pOH = 11 (acidic)', () => {
    const poh = 11;
    const ph = calculatePHFromPOH(poh);
    expect(ph).toBe(3);
  });

  test('should calculate pH for pOH = 0 (very basic)', () => {
    const poh = 0;
    const ph = calculatePHFromPOH(poh);
    expect(ph).toBe(14);
  });

  test('should calculate pH for pOH = 14 (very acidic)', () => {
    const poh = 14;
    const ph = calculatePHFromPOH(poh);
    expect(ph).toBe(0);
  });

  test('should calculate pH for pOH = 4', () => {
    const poh = 4;
    const ph = calculatePHFromPOH(poh);
    expect(ph).toBe(10);
  });

  test('should calculate pH for pOH = 10', () => {
    const poh = 10;
    const ph = calculatePHFromPOH(poh);
    expect(ph).toBe(4);
  });

  test('should handle fractional pOH values', () => {
    const poh = 7.5;
    const ph = calculatePHFromPOH(poh);
    expect(ph).toBe(6.5);
  });

  test('should throw error for negative pOH', () => {
    expect(() => calculatePHFromPOH(-1)).toThrow('Invalid pOH value');
  });

  test('should throw error for pOH > 14', () => {
    expect(() => calculatePHFromPOH(15)).toThrow('Invalid pOH value');
  });
});

describe('pH-Rechner - Calculate pOH from pH', () => {
  test('should calculate pOH for pH = 7 (neutral)', () => {
    const ph = 7;
    const poh = calculatePOHFromPH(ph);
    expect(poh).toBe(7);
  });

  test('should calculate pOH for pH = 3 (acidic)', () => {
    const ph = 3;
    const poh = calculatePOHFromPH(ph);
    expect(poh).toBe(11);
  });

  test('should calculate pOH for pH = 11 (basic)', () => {
    const ph = 11;
    const poh = calculatePOHFromPH(ph);
    expect(poh).toBe(3);
  });

  test('should calculate pOH for pH = 0', () => {
    const ph = 0;
    const poh = calculatePOHFromPH(ph);
    expect(poh).toBe(14);
  });

  test('should calculate pOH for pH = 14', () => {
    const ph = 14;
    const poh = calculatePOHFromPH(ph);
    expect(poh).toBe(0);
  });

  test('should handle fractional pH values', () => {
    const ph = 7.5;
    const poh = calculatePOHFromPH(ph);
    expect(poh).toBe(6.5);
  });
});

describe('pH-Rechner - Calculate H+ concentration from pH', () => {
  test('should calculate [H+] for pH = 7', () => {
    const ph = 7;
    const hplus = calculateHPlusFromPH(ph);
    expect(hplus).toBeCloseTo(1e-7, 15);
  });

  test('should calculate [H+] for pH = 3', () => {
    const ph = 3;
    const hplus = calculateHPlusFromPH(ph);
    expect(hplus).toBeCloseTo(1e-3, 15);
  });

  test('should calculate [H+] for pH = 11', () => {
    const ph = 11;
    const hplus = calculateHPlusFromPH(ph);
    expect(hplus).toBeCloseTo(1e-11, 15);
  });

  test('should calculate [H+] for pH = 1', () => {
    const ph = 1;
    const hplus = calculateHPlusFromPH(ph);
    expect(hplus).toBeCloseTo(0.1, 5);
  });

  test('should calculate [H+] for pH = 0 (very acidic)', () => {
    const ph = 0;
    const hplus = calculateHPlusFromPH(ph);
    expect(hplus).toBeCloseTo(1.0, 5);
  });

  test('should calculate [H+] for pH = 14 (very basic)', () => {
    const ph = 14;
    const hplus = calculateHPlusFromPH(ph);
    expect(hplus).toBeCloseTo(1e-14, 15);
  });

  test('should handle fractional pH values', () => {
    const ph = 7.3;
    const hplus = calculateHPlusFromPH(ph);
    expect(hplus).toBeCloseTo(5.01e-8, 2);
  });
});

describe('pH-Rechner - Calculate OH- concentration from pH', () => {
  test('should calculate [OH-] for pH = 7', () => {
    const ph = 7;
    const ohminus = calculateOHMinusFromPH(ph);
    expect(ohminus).toBeCloseTo(1e-7, 15);
  });

  test('should calculate [OH-] for pH = 11 (basic)', () => {
    const ph = 11;
    const ohminus = calculateOHMinusFromPH(ph);
    expect(ohminus).toBeCloseTo(1e-3, 15);
  });

  test('should calculate [OH-] for pH = 3 (acidic)', () => {
    const ph = 3;
    const ohminus = calculateOHMinusFromPH(ph);
    expect(ohminus).toBeCloseTo(1e-11, 15);
  });

  test('should calculate [OH-] for pH = 14 (very basic)', () => {
    const ph = 14;
    const ohminus = calculateOHMinusFromPH(ph);
    expect(ohminus).toBeCloseTo(1.0, 5);
  });

  test('should calculate [OH-] for pH = 0 (very acidic)', () => {
    const ph = 0;
    const ohminus = calculateOHMinusFromPH(ph);
    expect(ohminus).toBeCloseTo(1e-14, 15);
  });
});

describe('pH-Rechner - pH + pOH = 14 relationship', () => {
  test('pH and pOH should sum to 14 for neutral solution', () => {
    const ph = 7;
    const poh = calculatePOHFromPH(ph);
    expect(ph + poh).toBe(14);
  });

  test('pH and pOH should sum to 14 for acidic solution', () => {
    const ph = 2;
    const poh = calculatePOHFromPH(ph);
    expect(ph + poh).toBe(14);
  });

  test('pH and pOH should sum to 14 for basic solution', () => {
    const ph = 12;
    const poh = calculatePOHFromPH(ph);
    expect(ph + poh).toBe(14);
  });

  test('pH and pOH should sum to 14 for fractional values', () => {
    const ph = 7.5;
    const poh = calculatePOHFromPH(ph);
    expect(ph + poh).toBe(14);
  });
});

describe('pH-Rechner - [H+][OH-] = Kw relationship', () => {
  test('ion product should equal Kw at pH 7', () => {
    const ph = 7;
    const hplus = calculateHPlusFromPH(ph);
    const ohminus = calculateOHMinusFromPH(ph);
    expect(hplus * ohminus).toBeCloseTo(KW_25C, 15);
  });

  test('ion product should equal Kw at pH 3', () => {
    const ph = 3;
    const hplus = calculateHPlusFromPH(ph);
    const ohminus = calculateOHMinusFromPH(ph);
    expect(hplus * ohminus).toBeCloseTo(KW_25C, 14);
  });

  test('ion product should equal Kw at pH 11', () => {
    const ph = 11;
    const hplus = calculateHPlusFromPH(ph);
    const ohminus = calculateOHMinusFromPH(ph);
    expect(hplus * ohminus).toBeCloseTo(KW_25C, 14);
  });
});

describe('pH-Rechner - pH Descriptions', () => {
  test('should return "Sehr stark sauer" for pH < 2', () => {
    expect(getPHDescription(1)).toBe('Sehr stark sauer');
    expect(getPHDescription(0)).toBe('Sehr stark sauer');
  });

  test('should return "Stark sauer" for 2 <= pH < 4', () => {
    expect(getPHDescription(2)).toBe('Stark sauer');
    expect(getPHDescription(3)).toBe('Stark sauer');
  });

  test('should return "Sauer" for 4 <= pH < 6', () => {
    expect(getPHDescription(4)).toBe('Sauer');
    expect(getPHDescription(5)).toBe('Sauer');
  });

  test('should return "Neutral" for pH = 7', () => {
    expect(getPHDescription(7)).toBe('Neutral');
  });

  test('should return "Fast neutral" for 7 < pH < 8', () => {
    expect(getPHDescription(7.5)).toBe('Fast neutral');
  });

  test('should return "Basisch" for 8 <= pH < 11', () => {
    expect(getPHDescription(8)).toBe('Basisch');
    expect(getPHDescription(10)).toBe('Basisch');
  });

  test('should return "Stark basisch" for pH >= 11', () => {
    expect(getPHDescription(11)).toBe('Stark basisch');
    expect(getPHDescription(14)).toBe('Stark basisch');
  });
});

describe('pH-Rechner - Common Solutions', () => {
  test('should calculate pH of gastric acid (HCl, 0.01 M)', () => {
    const hplus = 0.01;
    const ph = calculatePHFromHPlus(hplus);
    expect(ph).toBeCloseTo(2.0, 2);
  });

  test('should calculate pH of lemon juice (approximately pH 2.2)', () => {
    const ph = 2.2;
    const hplus = calculateHPlusFromPH(ph);
    expect(hplus).toBeCloseTo(0.0063, 3);
  });

  test('should calculate pH of coffee (approximately pH 5)', () => {
    const ph = 5;
    const hplus = calculateHPlusFromPH(ph);
    expect(hplus).toBeCloseTo(1e-5, 15);
  });

  test('should calculate pH of pure water (pH 7)', () => {
    const hplus = 1e-7;
    const ph = calculatePHFromHPlus(hplus);
    expect(ph).toBeCloseTo(7.0, 2);
  });

  test('should calculate pH of blood (approximately pH 7.4)', () => {
    const ph = 7.4;
    const hplus = calculateHPlusFromPH(ph);
    expect(hplus).toBeCloseTo(3.98e-8, 2);
  });

  test('should calculate pH of seawater (approximately pH 8.1)', () => {
    const ph = 8.1;
    const hplus = calculateHPlusFromPH(ph);
    expect(hplus).toBeCloseTo(7.94e-9, 2);
  });

  test('should calculate pH of soap solution (approximately pH 10)', () => {
    const ph = 10;
    const ohminus = calculateOHMinusFromPH(ph);
    expect(ohminus).toBeCloseTo(1e-4, 14);
  });

  test('should calculate pH of bleach (approximately pH 12.5)', () => {
    const ph = 12.5;
    const ohminus = calculateOHMinusFromPH(ph);
    expect(ohminus).toBeCloseTo(0.0316, 3);
  });
});

describe('pH-Rechner - Edge Cases', () => {
  test('should handle very small pH changes', () => {
    const ph1 = calculatePHFromHPlus(1e-7);
    const ph2 = calculatePHFromHPlus(1.1e-7);
    const difference = Math.abs(ph2 - ph1);
    expect(difference).toBeLessThan(0.05);
  });

  test('should handle exponential range of H+ values', () => {
    const h1 = 1e-14;
    const h2 = 1;
    const ph1 = calculatePHFromHPlus(h1);
    const ph2 = calculatePHFromHPlus(h2);
    expect(ph1 - ph2).toBeCloseTo(14, 1);
  });

  test('should maintain pH + pOH = 14 across entire range', () => {
    for (let i = 0; i <= 14; i += 0.5) {
      const poh = calculatePOHFromPH(i);
      expect(i + poh).toBeCloseTo(14, 10);
    }
  });

  test('should verify Kw = [H+][OH-] across entire range', () => {
    for (let ph = 0; ph <= 14; ph += 2) {
      const hplus = calculateHPlusFromPH(ph);
      const ohminus = calculateOHMinusFromPH(ph);
      const kw = hplus * ohminus;
      expect(kw).toBeCloseTo(KW_25C, 13);
    }
  });
});

describe('pH-Rechner - Practical Examples', () => {
  test('strong acid HCl 0.001 M should have pH = 3', () => {
    const hplus = 0.001;
    const ph = calculatePHFromHPlus(hplus);
    expect(ph).toBeCloseTo(3.0, 2);
    expect(getPHDescription(ph)).toBe('Stark sauer');
  });

  test('strong base NaOH 0.001 M should have pH = 11', () => {
    const ohminus = 0.001;
    const ph = calculatePHFromOHMinus(ohminus);
    expect(ph).toBeCloseTo(11.0, 2);
    expect(getPHDescription(ph)).toBe('Stark basisch');
  });

  test('dilute HCl solution (pH 4)', () => {
    const ph = 4;
    const hplus = calculateHPlusFromPH(ph);
    expect(hplus).toBeCloseTo(1e-4, 15);
  });

  test('dilute NaOH solution (pH 10)', () => {
    const ph = 10;
    const ohminus = calculateOHMinusFromPH(ph);
    expect(ohminus).toBeCloseTo(1e-4, 15);
  });
});
