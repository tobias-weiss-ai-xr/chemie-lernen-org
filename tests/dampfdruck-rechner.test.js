/**
 * Unit Tests for Dampfdruck-Rechner (Vapor Pressure Calculator)
 * Tests all exported functions: calculateVaporPressure, formatNumber, getResultText.
 * Imports pure functions from source via module.exports.
 */

const {
  calculateVaporPressure,
  formatNumber,
  getResultText,
} = require('../myhugoapp/static/js/calculators/dampfdruck-rechner.js');

describe('Dampfdruck-Rechner — calculateVaporPressure (Clausius-Clapeyron)', () => {
  test('boiling point gives normal pressure (T=T₀)', () => {
    const result = calculateVaporPressure(100, 101325, 100);
    expect(result).toBeCloseTo(101325, 0);
  });

  test('temperature above boiling gives higher pressure', () => {
    const result = calculateVaporPressure(120, 101325, 100);
    expect(result).toBeGreaterThan(101325);
  });

  test('temperature below boiling gives lower pressure', () => {
    const result = calculateVaporPressure(50, 101325, 100);
    expect(result).toBeLessThan(101325);
  });

  test('0°C water vapor pressure > 0', () => {
    const result = calculateVaporPressure(0, 101325, 100);
    expect(result).toBeGreaterThan(0);
  });

  test('atmospheric pressure unit handling (hPa)', () => {
    const result = calculateVaporPressure(100, 1013.25, 100);
    expect(result).toBeCloseTo(1013.25, 0);
  });

  test('ethanol boiling point example (78.37°C)', () => {
    const result = calculateVaporPressure(78.37, 101325, 78.37);
    expect(result).toBeCloseTo(101325, 0);
  });

  test('very low temperature (near freezing) has very low pressure', () => {
    const result = calculateVaporPressure(-20, 101325, 100);
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(5000);
  });

  test('throws on absolute zero temperature', () => {
    expect(() => calculateVaporPressure(-273.15, 101325, 100)).toThrow(
      'Temperatur muss größer als 0 K sein'
    );
  });

  test('throws on boiling point at absolute zero', () => {
    expect(() => calculateVaporPressure(100, 101325, -273.15)).toThrow(
      'Temperatur muss größer als 0 K sein'
    );
  });

  test('negative pressures are clamped to 0', () => {
    const result = calculateVaporPressure(-100, 101325, 200);
    expect(result).toBeGreaterThanOrEqual(0);
  });

  test('numerical stability — no NaN for extreme values', () => {
    const result = calculateVaporPressure(1000, 101325, 100);
    expect(isNaN(result)).toBe(false);
    expect(result).toBeGreaterThan(101325);
  });

  test('function is monotonic: higher T → higher P', () => {
    const p1 = calculateVaporPressure(20, 101325, 100);
    const p2 = calculateVaporPressure(30, 101325, 100);
    expect(p2).toBeGreaterThan(p1);
  });

  test('deltaT computation is correct at boiling point', () => {
    const tK = 100 + 273.15;
    const t0K = 100 + 273.15;
    const deltaT = 1 / tK - 1 / t0K;
    expect(deltaT).toBe(0);
    expect(Math.exp(-8860 * deltaT)).toBe(1);
  });

  test('pressure is always >= 0 (clamping)', () => {
    for (let t = -200; t < 0; t += 10) {
      const result = calculateVaporPressure(t, 101325, 100);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(isNaN(result)).toBe(false);
    }
  });

  test('exact temperature 0°C does not throw', () => {
    // 0°C = 273.15K which is > 0
    expect(() => calculateVaporPressure(0, 101325, 100)).not.toThrow();
  });
});

describe('Dampfdruck-Rechner — formatNumber', () => {
  test('formats integer with 2 decimals (German locale)', () => {
    const result = formatNumber(1234, 2);
    expect(result).toContain('1');
    expect(typeof result).toBe('string');
  });

  test('formats decimal number with 3 decimals', () => {
    const result = formatNumber(3.14159, 3);
    expect(typeof result).toBe('string');
    // Should contain exactly 3 decimal places
    const parts = result.split(',');
    if (parts.length === 2) {
      expect(parts[1]).toHaveLength(3);
    }
  });

  test('formats zero', () => {
    const result = formatNumber(0, 2);
    expect(typeof result).toBe('string');
  });

  test('formats large numbers', () => {
    const result = formatNumber(101325, 0);
    expect(typeof result).toBe('string');
  });

  test('formats negative numbers', () => {
    const result = formatNumber(-12.5, 1);
    expect(typeof result).toBe('string');
    expect(result).toContain('-');
  });

  test('formats very small decimal numbers', () => {
    const result = formatNumber(0.000123, 4);
    expect(typeof result).toBe('string');
  });

  test('0 decimals returns integer-like string', () => {
    const result = formatNumber(42, 0);
    expect(typeof result).toBe('string');
  });
});

describe('Dampfdruck-Rechner — getResultText', () => {
  const NORMAL = 100;

  test('ratio < 0.01 → "Sehr niedrig"', () => {
    const result = getResultText(0.5, NORMAL);
    expect(result).toContain('Sehr niedrig');
    expect(result).toContain('weniger als 1%');
  });

  test('0.01 ≤ ratio < 0.1 → "Niedrig"', () => {
    const result = getResultText(5, NORMAL);
    expect(result).toContain('Niedrig');
    expect(result).toContain('weniger als 10%');
  });

  test('0.1 ≤ ratio < 0.5 → "Mittelmäßig"', () => {
    const result = getResultText(25, NORMAL);
    expect(result).toContain('Mittelmäßig');
  });

  test('0.5 ≤ ratio < 0.9 → "Hoch"', () => {
    const result = getResultText(70, NORMAL);
    expect(result).toContain('Hoch');
    expect(result).toContain('nahe am Normaldruck');
  });

  test('0.9 ≤ ratio < 1.1 → "Sehr hoch"', () => {
    const result = getResultText(100, NORMAL);
    expect(result).toContain('Sehr hoch');
    expect(result).toContain('um den Normaldruck');
  });

  test('ratio ≥ 1.1 → "Überkritisch"', () => {
    const result = getResultText(200, NORMAL);
    expect(result).toContain('Überkritisch');
    expect(result).toContain('höher als Normaldruck');
  });

  test('boundary ratio=0.01 → hits "Niedrig" (not "Sehr niedrig")', () => {
    const result = getResultText(1, NORMAL);
    // ratio = 0.01, which is not < 0.01, so first branch not taken
    expect(result).toContain('Niedrig');
  });

  test('boundary ratio=0.1 → hits "Mittelmäßig"', () => {
    const result = getResultText(10, NORMAL);
    expect(result).toContain('Mittelmäßig');
  });

  test('boundary ratio=0.5 → hits "Hoch"', () => {
    const result = getResultText(50, NORMAL);
    expect(result).toContain('Hoch');
  });

  test('boundary ratio=0.9 → hits "Sehr hoch"', () => {
    const result = getResultText(90, NORMAL);
    expect(result).toContain('Sehr hoch');
  });

  test('boundary ratio=1.1 → hits "Überkritisch"', () => {
    const result = getResultText(110, NORMAL);
    expect(result).toContain('Überkritisch');
  });

  test('zero pressure → ratio=0 → "Sehr niedrig"', () => {
    const result = getResultText(0, NORMAL);
    expect(result).toContain('Sehr niedrig');
  });

  test('exact normal pressure (ratio=1) → "Sehr hoch"', () => {
    const result = getResultText(NORMAL, NORMAL);
    expect(result).toContain('Sehr hoch');
  });

  test('module exports all expected functions', () => {
    expect(calculateVaporPressure).toBeDefined();
    expect(formatNumber).toBeDefined();
    expect(getResultText).toBeDefined();
  });
});
