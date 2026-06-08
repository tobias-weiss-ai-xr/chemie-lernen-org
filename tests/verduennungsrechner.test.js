/**
 * Unit Tests for Verdünnungsrechner (Dilution Calculator)
 * Tests the dilution law: c₁·V₁ = c₂·V₂
 */

function calculateMissingV1(c1, c2, v2) {
  if (c1 === 0) throw new Error('c1 darf nicht Null sein');
  return (c2 * v2) / c1;
}

function calculateMissingV2(c1, v1, c2) {
  if (c2 === 0) throw new Error('c2 darf nicht Null sein');
  return (c1 * v1) / c2;
}

function calculateMissingC2(c1, v1, v2) {
  if (v2 === 0) throw new Error('V2 darf nicht Null sein');
  return (c1 * v1) / v2;
}

function calculateMissingC1(c2, v2, v1) {
  if (v1 === 0) throw new Error('V1 darf nicht Null sein');
  return (c2 * v2) / v1;
}

describe('Verdünnungsrechner — Dilution Calculator (c₁·V₁ = c₂·V₂)', () => {
  // Standard dilution: from 1 M stock to 0.1 M, 10 mL
  // c₁·V₁ = c₂·V₂ → 1·V₁ = 0.1·10 → V₁ = 1 mL

  test('calculates V₁ (stock volume needed)', () => {
    const result = calculateMissingV1(1, 0.1, 10);
    expect(result).toBeCloseTo(1, 5);
  });

  test('calculates V₂ (final volume)', () => {
    const result = calculateMissingV2(1, 2, 0.5);
    expect(result).toBeCloseTo(4, 5);
  });

  test('calculates c₂ (final concentration)', () => {
    const result = calculateMissingC2(5, 10, 50);
    expect(result).toBeCloseTo(1, 5);
  });

  test('calculates c₁ (stock concentration)', () => {
    const result = calculateMissingC1(0.5, 20, 5);
    expect(result).toBeCloseTo(2, 5);
  });

  test('serial dilution: 1:10 dilution', () => {
    // c₁ = 1 M, V₁ = 1 mL, V₂ = 10 mL
    const c2 = calculateMissingC2(1, 1, 10);
    expect(c2).toBeCloseTo(0.1, 5);
    const v1 = calculateMissingV1(1, c2, 10);
    expect(v1).toBeCloseTo(1, 5);
  });

  test('identity: no dilution (c₁ = c₂, V₁ = V₂)', () => {
    expect(calculateMissingV1(1, 1, 10)).toBeCloseTo(10, 5);
    expect(calculateMissingC2(1, 10, 10)).toBeCloseTo(1, 5);
  });

  test('handles molar concentrations', () => {
    // 0.5 M stock to 0.1 M final, 50 mL final
    const v1 = calculateMissingV1(0.5, 0.1, 50);
    expect(v1).toBeCloseTo(10, 5);
  });

  test('handles mM concentrations (0.001 M)', () => {
    const result = calculateMissingC2(0.1, 0.5, 10);
    expect(result).toBeCloseTo(0.005, 6);
  });

  test('large volume dilution factor (1:1000)', () => {
    const v1 = calculateMissingV1(1, 0.001, 1000);
    expect(v1).toBeCloseTo(1, 5);
  });

  test('throws error when c₁ is zero', () => {
    expect(() => calculateMissingV1(0, 1, 10)).toThrow('c1 darf nicht Null sein');
  });

  test('throws error when c₂ is zero', () => {
    expect(() => calculateMissingV2(1, 1, 0)).toThrow('c2 darf nicht Null sein');
  });

  test('throws error when V₂ is zero', () => {
    expect(() => calculateMissingC2(1, 1, 0)).toThrow('V2 darf nicht Null sein');
  });

  test('throws error when V₁ is zero', () => {
    expect(() => calculateMissingC1(1, 1, 0)).toThrow('V1 darf nicht Null sein');
  });

  test('multi-step dilution series consistency', () => {
    // 1 M → 0.1 M → 0.01 M → 0.001 M (each 1:10)
    const step1 = calculateMissingV1(1, 0.1, 10);
    expect(step1).toBeCloseTo(1, 5);

    const c2 = calculateMissingC2(0.1, step1, 10);
    expect(c2).toBeCloseTo(0.01, 5);

    const c3 = calculateMissingC2(0.01, 1, 10);
    expect(c3).toBeCloseTo(0.001, 5);
  });

  test('conservation of moles: c₁·V₁ = c₂·V₂ always holds', () => {
    const c1 = 2.5;
    const v1 = 3;
    const v2 = 15;
    const c2 = calculateMissingC2(c1, v1, v2);
    expect(c1 * v1).toBeCloseTo(c2 * v2, 10);
  });
});
