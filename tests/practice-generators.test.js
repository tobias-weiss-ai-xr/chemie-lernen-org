/**
 * Unit Tests for Practice Mode Generators
 */

const {
  generateMolMolProblem,
  generateMassMassProblem,
  generateLimitingProblem,
  generateYieldProblem,
  checkAnswerTolerance
} = require('../myhugoapp/static/js/calculators/practice-generators.js');

describe('generateMolMolProblem', () => {
  test('should generate easy problem with whole numbers', () => {
    const result = generateMolMolProblem('easy', 12345);
    expect(result.type).toBe('mol-mol');
    expect(result.v1).toBeGreaterThanOrEqual(1);
    expect(result.v1).toBeLessThanOrEqual(3);
    expect(result.v2).toBeGreaterThanOrEqual(1);
    expect(result.v2).toBeLessThanOrEqual(3);
    expect(result.n1).toBeGreaterThanOrEqual(1);
    expect(result.n1).toBeLessThanOrEqual(10);
    expect(Number.isInteger(result.v1)).toBe(true);
    expect(Number.isInteger(result.v2)).toBe(true);
    expect(Number.isInteger(result.n1)).toBe(true);
  });

  test('should generate correct answer for 1:1 ratio', () => {
    const result = generateMolMolProblem('easy', 1);
    // With seed 1, we get predictable results
    expect(result.answer).toBe(result.n1 * (result.v2 / result.v1));
  });

  test('should generate medium problem with decimals', () => {
    const result = generateMolMolProblem('medium', 54321);
    expect(result.v1).toBeGreaterThanOrEqual(1);
    expect(result.v1).toBeLessThanOrEqual(5);
    expect(result.n1).toBeLessThanOrEqual(25);
  });

  test('should generate hard problem with larger coefficients', () => {
    const result = generateMolMolProblem('hard', 98765);
    expect(result.v1).toBeGreaterThanOrEqual(2);
    expect(result.v1).toBeLessThanOrEqual(7);
    expect(result.v2).toBeGreaterThanOrEqual(2);
    expect(result.v2).toBeLessThanOrEqual(7);
  });

  test('should always calculate answer correctly', () => {
    for (let i = 0; i < 10; i++) {
      const result = generateMolMolProblem('easy', i);
      const expected = result.n1 * (result.v2 / result.v1);
      expect(result.answer).toBeCloseTo(expected, 4);
    }
  });

  test('should include tolerance', () => {
    const result = generateMolMolProblem('easy', 11111);
    expect(result.tolerance).toBeDefined();
    expect(result.tolerance).toBe(0.01); // 1% tolerance
  });
});

describe('generateMassMassProblem', () => {
  test('should generate problem with valid structure', () => {
    const result = generateMassMassProblem('easy', 12345);
    expect(result.type).toBe('mass-mass');
    expect(result.m1).toBeDefined();
    expect(result.M1).toBeDefined();
    expect(result.M2).toBeDefined();
    expect(result.v1).toBeDefined();
    expect(result.v2).toBeDefined();
    expect(result.answer).toBeDefined();
  });

  test('should use element database', () => {
    const result = generateMassMassProblem('easy', 54321);
    expect(result.M1).toBeGreaterThan(0);
    expect(result.M2).toBeGreaterThan(0);
    expect(result.M1).toBeLessThan(200);
    expect(result.M2).toBeLessThan(200);
  });

  test('should calculate answer correctly', () => {
    const result = generateMassMassProblem('medium', 98765);
    const n1 = result.m1 / result.M1;
    const n2 = n1 * (result.v2 / result.v1);
    const expected = n2 * result.M2;
    expect(result.answer).toBeCloseTo(expected, 2);
  });

  test('should generate different problems with different seeds', () => {
    const result1 = generateMassMassProblem('easy', 1);
    const result2 = generateMassMassProblem('easy', 999);
    expect(result1.m1).not.toBe(result2.m1);
  });

  test('should have appropriate tolerance', () => {
    const result = generateMassMassProblem('easy', 11111);
    expect(result.tolerance).toBe(0.02); // 2% tolerance
  });

  test('should handle medium difficulty', () => {
    const result = generateMassMassProblem('medium', 22222);
    expect(result.m1).toBeGreaterThan(0);
    expect(result.m1).toBeLessThan(60);
  });

  test('should handle hard difficulty', () => {
    const result = generateMassMassProblem('hard', 33333);
    expect(result.v1).toBeGreaterThanOrEqual(2);
    expect(result.v2).toBeGreaterThanOrEqual(2);
  });
});

describe('generateLimitingProblem', () => {
  test('should generate problem with valid structure', () => {
    const result = generateLimitingProblem('easy', 12345);
    expect(result.type).toBe('limiting');
    expect(result.m1).toBeDefined();
    expect(result.M1).toBeDefined();
    expect(result.m2).toBeDefined();
    expect(result.M2).toBeDefined();
    expect(result.v1).toBeDefined();
    expect(result.v2).toBeDefined();
    expect(result.answer).toBeGreaterThanOrEqual(1);
    expect(result.answer).toBeLessThanOrEqual(2);
  });

  test('should correctly identify limiting reactant', () => {
    const result = generateLimitingProblem('easy', 54321);
    const n1 = result.m1 / result.M1;
    const n2 = result.m2 / result.M2;
    const ratio1 = n1 / result.v1;
    const ratio2 = n2 / result.v2;

    const expectedLimiting = ratio1 < ratio2 ? 1 : 2;
    expect(result.answer).toBe(expectedLimiting);
  });

  test('should generate valid molar masses', () => {
    const result = generateLimitingProblem('medium', 98765);
    expect(result.M1).toBeGreaterThan(0);
    expect(result.M2).toBeGreaterThan(0);
  });

  test('should handle easy difficulty', () => {
    const result = generateLimitingProblem('easy', 11111);
    expect(result.v1).toBe(1);
    expect(result.v2).toBe(1);
    expect(result.m1).toBeGreaterThanOrEqual(10);
    expect(result.m1).toBeLessThanOrEqual(100);
  });

  test('should handle medium difficulty', () => {
    const result = generateLimitingProblem('medium', 22222);
    expect(result.v1).toBeGreaterThanOrEqual(1);
    expect(result.v1).toBeLessThanOrEqual(3);
    expect(result.v2).toBeGreaterThanOrEqual(1);
    expect(result.v2).toBeLessThanOrEqual(3);
  });

  test('should handle hard difficulty', () => {
    const result = generateLimitingProblem('hard', 33333);
    expect(result.v1).toBeGreaterThanOrEqual(2);
    expect(result.v2).toBeGreaterThanOrEqual(2);
  });

  test('should produce both reactant 1 and reactant 2 as limiting', () => {
    let limiting1Count = 0;
    let limiting2Count = 0;

    for (let i = 0; i < 20; i++) {
      const result = generateLimitingProblem('easy', i);
      if (result.answer === 1) limiting1Count++;
      else limiting2Count++;
    }

    // Both should appear at least a few times
    expect(limiting1Count).toBeGreaterThan(0);
    expect(limiting2Count).toBeGreaterThan(0);
  });
});

describe('generateYieldProblem', () => {
  test('should generate problem with valid structure', () => {
    const result = generateYieldProblem('easy', 12345);
    expect(result.type).toBe('yield');
    expect(result.theoretical).toBeDefined();
    expect(result.actual).toBeDefined();
    expect(result.answer).toBeDefined();
  });

  test('should calculate yield correctly', () => {
    const result = generateYieldProblem('easy', 54321);
    const expectedYield = (result.actual / result.theoretical) * 100;
    expect(result.answer).toBeCloseTo(expectedYield, 1);
  });

  test('should generate reasonable yields', () => {
    const result = generateYieldProblem('medium', 98765);
    expect(result.answer).toBeGreaterThan(0);
    expect(result.answer).toBeLessThanOrEqual(100);
  });

  test('should handle easy difficulty with round yields', () => {
    const result = generateYieldProblem('easy', 11111);
    expect(result.theoretical).toBeGreaterThanOrEqual(10);
    expect(result.theoretical).toBeLessThanOrEqual(100);
    expect([50, 60, 70, 80, 90, 100]).toContain(result.answer);
  });

  test('should handle medium difficulty', () => {
    const result = generateYieldProblem('medium', 22222);
    expect(result.theoretical).toBeGreaterThan(0);
    expect(result.theoretical).toBeLessThan(60);
  });

  test('should handle hard difficulty', () => {
    const result = generateYieldProblem('hard', 33333);
    expect(result.theoretical).toBeLessThan(20);
  });

  test('should include tolerance', () => {
    const result = generateYieldProblem('easy', 44444);
    expect(result.tolerance).toBeDefined();
    expect(result.tolerance).toBe(0.5); // 0.5% tolerance
  });
});

describe('checkAnswerTolerance', () => {
  test('should accept exact answer', () => {
    const result = checkAnswerTolerance(10, 10, 0.01);
    expect(result).toBe(true);
  });

  test('should accept answer within tolerance', () => {
    const result = checkAnswerTolerance(10.1, 10, 0.02); // 1% error, 2% tolerance
    expect(result).toBe(true);
  });

  test('should reject answer outside tolerance', () => {
    const result = checkAnswerTolerance(10.3, 10, 0.01); // 3% error, 1% tolerance
    expect(result).toBe(false);
  });

  test('should handle small numbers', () => {
    const result = checkAnswerTolerance(0.101, 0.1, 0.02);
    expect(result).toBe(true);
  });

  test('should handle large numbers', () => {
    const result = checkAnswerTolerance(1001, 1000, 0.01);
    expect(result).toBe(true);
  });

  test('should handle zero correctly', () => {
    const result = checkAnswerTolerance(0, 0.001, 0.01);
    expect(result).toBe(false); // Division by zero case
  });

  test('should handle negative difference', () => {
    const result = checkAnswerTolerance(9.9, 10, 0.02);
    expect(result).toBe(true);
  });

  test('should be precise with 1% tolerance', () => {
    const result1 = checkAnswerTolerance(10.11, 10, 0.01);
    const result2 = checkAnswerTolerance(10.05, 10, 0.01);
    expect(result1).toBe(false); // Just outside (1.1% error)
    expect(result2).toBe(true); // Just inside (0.5% error)
  });

  test('should handle percentage tolerance', () => {
    const result = checkAnswerTolerance(85, 100, 0.2); // 15% error, 20% tolerance
    expect(result).toBe(true);
  });
});
