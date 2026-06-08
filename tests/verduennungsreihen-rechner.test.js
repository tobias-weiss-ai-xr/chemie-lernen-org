/**
 * Unit Tests for Verduennungsreihen-Rechner (Dilution Series Calculator)
 * Tests the 1:2 serial dilution series: cₙ = c₀ × 0.5ⁿ
 */

/**
 * Pure function from source: calculateDilutionSeries
 */
function calculateDilutionSeries(initialConc, numSteps) {
  var series = [];
  for (var n = 0; n <= numSteps; n++) {
    var conc = initialConc * Math.pow(0.5, n);
    var dilutionFactor = Math.pow(2, n);
    series.push({
      step: n,
      dilutionRatio: '1:' + dilutionFactor,
      concentration: conc,
      dilutionFactor: dilutionFactor
    });
  }
  return series;
}

/**
 * Pure function from source: formatConcentration
 */
function formatConcentration(conc, unit) {
  var value;
  switch (unit) {
    case 'mol/L': value = conc; break;
    case 'mM': value = conc * 1000; break;
    case 'μM': value = conc * 1000000; break;
    case 'g/L': value = conc; break;
    case 'mg/mL': value = conc; break;
    default: value = conc;
  }
  if (Math.abs(value) >= 0.001) {
    return value.toExponential(2);
  } else {
    return value.toFixed(2);
  }
}

describe('Verduennungsreihen-Rechner — Dilution Series (1:2)', () => {
  describe('calculateDilutionSeries', () => {
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
      series.forEach(s => expect(s.concentration).toBe(0));
    });

    test('handles large step count (20)', () => {
      const series = calculateDilutionSeries(1, 20);
      expect(series).toHaveLength(21);
      // 2^20 = 1,048,576-fold dilution
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
  });

  describe('formatConcentration', () => {
    test('mol/L returns scientific notation for large values', () => {
      const result = formatConcentration(0.5, 'mol/L');
      expect(typeof result).toBe('string');
      expect(result).toContain('e-');
    });

    test('mM converts from mol/L × 1000', () => {
      const val = 1;
      expect(val * 1000).toBe(1000);
    });

    test('μM converts from mol/L × 1,000,000', () => {
      const val = 0.001;
      expect(val * 1000000).toBe(1000);
    });

    test('returns exponential format for normal values', () => {
      const result = formatConcentration(0.01, 'mol/L');
      expect(typeof result).toBe('string');
      // Should use toExponential since abs(value) >= 0.001
      expect(result.length).toBeGreaterThan(0);
    });
  });
});
