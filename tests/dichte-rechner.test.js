/**
 * Unit Tests for Dichte-Rechner (Density Calculator)
 * Tests the core formula: ρ = m / V
 */

function calculateDensity(mass, volume) {
  if (volume === 0) {
    throw new Error('Volumen darf nicht Null sein.');
  }
  if (isNaN(mass) || isNaN(volume)) {
    throw new Error('Ungültige Eingabe');
  }
  return mass / volume;
}

describe('Dichte-Rechner — Density Calculator', () => {
  test('calculates density from mass and volume', () => {
    const result = calculateDensity(10, 5);
    expect(result).toBe(2);
  });

  test('water density at 4°C (1 g/mL)', () => {
    const result = calculateDensity(100, 100);
    expect(result).toBe(1);
  });

  test('iron density ~7.87 g/cm³', () => {
    const result = calculateDensity(78.7, 10);
    expect(result).toBeCloseTo(7.87, 2);
  });

  test('mercury density ~13.6 g/mL', () => {
    const result = calculateDensity(13.6, 1);
    expect(result).toBeCloseTo(13.6, 1);
  });

  test('handles large values', () => {
    const result = calculateDensity(1000000, 1000);
    expect(result).toBe(1000);
  });

  test('handles decimal values', () => {
    const result = calculateDensity(0.5, 0.25);
    expect(result).toBe(2);
  });

  test('handles very small values (gas density)', () => {
    const result = calculateDensity(0.0018, 1);
    expect(result).toBeCloseTo(0.0018, 4);
  });

  test('returns zero for zero mass', () => {
    const result = calculateDensity(0, 10);
    expect(result).toBe(0);
  });

  test('throws error when volume is zero', () => {
    expect(() => calculateDensity(10, 0)).toThrow('Volumen darf nicht Null sein.');
  });

  test('throws error when inputs are NaN', () => {
    expect(() => calculateDensity(NaN, 5)).toThrow('Ungültige Eingabe');
    expect(() => calculateDensity(5, NaN)).toThrow('Ungültige Eingabe');
  });

  test('negative mass (assumed valid)', () => {
    const result = calculateDensity(-10, 5);
    expect(result).toBe(-2);
  });

  test('negative volume', () => {
    const result = calculateDensity(10, -5);
    expect(result).toBe(-2);
  });

  test('toFixed(3) matches display format', () => {
    const density = calculateDensity(2, 3);
    expect(density.toFixed(3)).toBe('0.667');
  });
});
