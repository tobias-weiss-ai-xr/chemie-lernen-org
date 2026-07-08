/**
 * Unit Tests for Verduennungsreihen-Rechner (Dilution Series Calculator)
 * Tests all exported functions: calculateDilutionSeries, formatConcentration.
 * Imports pure functions from source via module.exports.
 */

const {
  calculateDilutionSeries,
  formatConcentration,
} = require('../myhugoapp/static/js/calculators/verduennungsreihen-rechner.js');

describe('Verduennungsreihen-Rechner — calculateDilutionSeries', () => {
  test('returns correct length (numSteps + 1)', () => {
    const series = calculateDilutionSeries(1, 5);
    expect(series).toHaveLength(6);
  });

  test('step 0 has initial concentration', () => {
    const series = calculateDilutionSeries(1, 3);
    expect(series[0].concentration).toBe(1);
    expect(series[0].dilutionRatio).toBe('1:1');
    expect(series[0].dilutionFactor).toBe(1);
  });

  test('each step halves concentration', () => {
    const series = calculateDilutionSeries(1, 4);
    for (let i = 1; i < series.length; i++) {
      expect(series[i].concentration).toBeCloseTo(series[i - 1].concentration / 2, 10);
    }
  });

  test('1:8 ratio at step 3', () => {
    const series = calculateDilutionSeries(1, 5);
    expect(series[3].dilutionRatio).toBe('1:8');
    expect(series[3].dilutionFactor).toBe(8);
  });

  test('1:16 ratio at step 4', () => {
    const series = calculateDilutionSeries(1, 5);
    expect(series[4].dilutionRatio).toBe('1:16');
    expect(series[4].dilutionFactor).toBe(16);
  });

  test('handles zero initial concentration', () => {
    const series = calculateDilutionSeries(0, 3);
    series.forEach((s) => expect(s.concentration).toBe(0));
  });

  test('handles large step count (20)', () => {
    const series = calculateDilutionSeries(1, 20);
    expect(series).toHaveLength(21);
    expect(series[20].dilutionFactor).toBe(1048576);
    expect(series[20].concentration).toBeCloseTo(Math.pow(0.5, 20), 15);
  });

  test('sequence is exponentially decreasing', () => {
    const series = calculateDilutionSeries(1, 5);
    for (let i = 1; i < series.length; i++) {
      expect(series[i].concentration).toBeLessThan(series[i - 1].concentration);
    }
  });

  test('1 step produces exactly 2 entries', () => {
    const series = calculateDilutionSeries(10, 1);
    expect(series).toHaveLength(2);
    expect(series[0].concentration).toBe(10);
    expect(series[1].concentration).toBe(5);
  });

  test('small initial concentration', () => {
    const series = calculateDilutionSeries(0.001, 3);
    expect(series[0].concentration).toBeCloseTo(0.001, 6);
    expect(series[1].concentration).toBeCloseTo(0.0005, 6);
    expect(series[2].concentration).toBeCloseTo(0.00025, 6);
  });

  test('large initial concentration', () => {
    const series = calculateDilutionSeries(1000, 2);
    expect(series[0].concentration).toBe(1000);
    expect(series[2].concentration).toBe(250);
  });

  test('1:2^n formula matches', () => {
    const series = calculateDilutionSeries(1, 10);
    for (let i = 0; i <= 10; i++) {
      const expectedFactor = Math.pow(2, i);
      expect(series[i].dilutionRatio).toBe('1:' + expectedFactor);
    }
  });

  test('concentration formula: cₙ = c₀ × (1/2)ⁿ', () => {
    const series = calculateDilutionSeries(100, 5);
    for (let i = 0; i <= 5; i++) {
      expect(series[i].concentration).toBeCloseTo(100 * Math.pow(0.5, i), 10);
    }
  });

  test('numSteps = 0 returns only initial step', () => {
    const series = calculateDilutionSeries(1, 0);
    expect(series).toHaveLength(1);
    expect(series[0].concentration).toBe(1);
    expect(series[0].dilutionRatio).toBe('1:1');
  });
});

describe('Verduennungsreihen-Rechner — formatConcentration', () => {
  test('unit "mol/L" with value >= 0.001 returns exponential', () => {
    const result = formatConcentration(0.5, 'mol/L');
    expect(typeof result).toBe('string');
    expect(result).toContain('e-');
  });

  test('unit "mol/L" with value < 0.001 returns fixed format', () => {
    const result = formatConcentration(0, 'mol/L');
    expect(result).toBe('0.00');
  });

  test('unit "mM" multiplies by 1000', () => {
    const result = formatConcentration(0.001, 'mM');
    // 0.001 * 1000 = 1, which is >= 0.001 → exponential
    expect(typeof result).toBe('string');
    expect(result).toContain('e');
  });

  test('unit "μM" multiplies by 1,000,000', () => {
    const result = formatConcentration(0.000001, 'μM');
    // 0.000001 * 1000000 = 1, which is >= 0.001 → exponential
    expect(typeof result).toBe('string');
  });

  test('unit "g/L" returns same as default', () => {
    const result1 = formatConcentration(0.5, 'g/L');
    const result2 = formatConcentration(0.5, 'mol/L');
    expect(result1).toBe(result2);
  });

  test('unit "mg/mL" returns same as default', () => {
    const result1 = formatConcentration(0.5, 'mg/mL');
    const result2 = formatConcentration(0.5, 'mol/L');
    expect(result1).toBe(result2);
  });

  test('unknown unit falls to default (same as mol/L)', () => {
    const result = formatConcentration(0.5, 'unknown');
    expect(typeof result).toBe('string');
  });

  test('very small concentration in mM gives fixed format', () => {
    // 0.0000001 * 1000 = 0.0001 which is < 0.001
    const result = formatConcentration(0.0000001, 'mM');
    // value = 0.0001 which is < 0.001 → toFixed(2) → "0.00"
    expect(result).toBe('0.00');
  });

  test('zero concentration returns 0.00', () => {
    expect(formatConcentration(0, 'mol/L')).toBe('0.00');
    expect(formatConcentration(0, 'mM')).toBe('0.00');
    expect(formatConcentration(0, 'μM')).toBe('0.00');
  });

  test('negative small concentration uses toFixed', () => {
    const result = formatConcentration(-0.0000001, 'mol/L');
    // value = -0.0000001, which is not >= 0.001 and not <= -0.001
    // Actually -0.0000001 <= -0.001 is FALSE (-0.0000001 > -0.001)
    // So it goes to toFixed(2) → "-0.00"
    expect(result).toBe('-0.00');
  });

  test('negative large concentration uses exponential', () => {
    const result = formatConcentration(-0.5, 'mol/L');
    // value = -0.5, -0.5 <= -0.001 is TRUE → exponential
    expect(typeof result).toBe('string');
    expect(result).toContain('e');
  });

  test('value exactly 0.001 uses exponential', () => {
    const result = formatConcentration(0.001, 'mol/L');
    expect(typeof result).toBe('string');
  });

  test('boolean true as unit triggers default case', () => {
    // This is an edge case - passing a non-string unit
    const result = formatConcentration(0.5, true);
    expect(typeof result).toBe('string');
  });

  test('module exports both expected functions', () => {
    expect(calculateDilutionSeries).toBeDefined();
    expect(formatConcentration).toBeDefined();
    expect(typeof calculateDilutionSeries).toBe('function');
    expect(typeof formatConcentration).toBe('function');
  });
});
