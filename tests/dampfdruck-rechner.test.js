/**
 * Unit Tests for Dampfdruck-Rechner (Vapor Pressure Calculator)
 * Tests the Clausius-Clapeyron approximation: P = P₀ * exp(-8860 * (1/T - 1/T₀))
 */

function calculateVaporPressure(temperatureC, normalPressure, boilingPointC) {
  var temperatureK = temperatureC + 273.15;
  var boilingPointK = boilingPointC + 273.15;

  if (temperatureK <= 0 || boilingPointK <= 0) {
    throw new Error('Temperatur muss größer als 0 K sein');
  }

  var deltaT = 1 / temperatureK - 1 / boilingPointK;
  var pressure = normalPressure * Math.exp(-8860 * deltaT);
  pressure = Math.max(0, pressure);
  return pressure;
}

describe('Dampfdruck-Rechner — Vapor Pressure (Clausius-Clapeyron)', () => {
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
    expect(() => calculateVaporPressure(-273.15, 101325, 100))
      .toThrow('Temperatur muss größer als 0 K sein');
  });

  test('throws on boiling point at absolute zero', () => {
    expect(() => calculateVaporPressure(100, 101325, -273.15))
      .toThrow('Temperatur muss größer als 0 K sein');
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
});
