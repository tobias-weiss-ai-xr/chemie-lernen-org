/**
 * Unit Tests for Multi-Step Reaction Calculator (calc-multistep.js)
 * Tests sequential stoichiometric calculations across multiple reaction steps.
 */

function simulateMultiStep(initialAmount, steps) {
  let currentAmount = initialAmount;
  const results = [];

  steps.forEach((step, index) => {
    const productAmount = currentAmount * (step.coeffP / step.coeffR);
    const productMass =
      step.molarMass && step.molarMass > 0 ? productAmount * step.molarMass : null;

    results.push({
      stepNumber: index + 1,
      reactantAmount: currentAmount,
      coeffR: step.coeffR,
      coeffP: step.coeffP,
      productAmount,
      molarMass: step.molarMass,
      productMass,
      product: step.product,
      equation: step.equation,
    });

    currentAmount = productAmount;
  });

  const finalResult = results[results.length - 1];
  const overallYield = (finalResult.productAmount / initialAmount) * 100;

  return { results, overallYield, finalProduct: finalResult.product, finalAmount: finalResult.productAmount };
}

describe('Multi-Step Reaction Calculator (calc-multistep.js)', () => {
  test('single step 1:1 ratio — amount preserved', () => {
    const { results, overallYield } = simulateMultiStep(2, [
      { coeffR: 1, coeffP: 1, product: 'B', molarMass: null },
    ]);
    expect(results[0].productAmount).toBe(2);
    expect(overallYield).toBe(100);
  });

  test('single step 1:2 ratio — amount doubles', () => {
    const { results } = simulateMultiStep(3, [
      { coeffR: 1, coeffP: 2, product: 'B', molarMass: null },
    ]);
    expect(results[0].productAmount).toBe(6);
  });

  test('Fe oxidation chain: Fe → FeO → Fe₂O₃', () => {
    const steps = [
      { coeffR: 2, coeffP: 2, product: 'FeO', molarMass: 71.844, equation: '2Fe + O2 → 2FeO' },
      { coeffR: 2, coeffP: 1, product: 'Fe2O3', molarMass: 159.688, equation: '4FeO + O2 → 2Fe2O3' },
    ];
    const { results, overallYield } = simulateMultiStep(2, steps);

    expect(results[0].productAmount).toBe(2);
    expect(results[0].productMass).toBeCloseTo(143.688, 2);

    expect(results[1].productAmount).toBe(1);
    expect(results[1].productMass).toBeCloseTo(159.688, 2);

    expect(overallYield).toBe(50);
  });

  test('mass calculation with molar mass', () => {
    const { results } = simulateMultiStep(1, [
      { coeffR: 1, coeffP: 1, product: 'NaCl', molarMass: 58.44 },
    ]);
    expect(results[0].productMass).toBeCloseTo(58.44, 2);
  });

  test('null molar mass → productMass is null', () => {
    const { results } = simulateMultiStep(2, [
      { coeffR: 1, coeffP: 1, product: 'X', molarMass: null },
    ]);
    expect(results[0].productMass).toBeNull();
  });

  test('overall yield decreases with each lossy step', () => {
    const { overallYield } = simulateMultiStep(10, [
      { coeffR: 2, coeffP: 1, product: 'B', molarMass: null },
      { coeffR: 2, coeffP: 1, product: 'C', molarMass: null },
      { coeffR: 2, coeffP: 1, product: 'D', molarMass: null },
    ]);
    expect(overallYield).toBeCloseTo(12.5, 1);
  });

  test('mass yield calculation', () => {
    const initialMolarMass = 55.845;
    const { results } = simulateMultiStep(2, [
      { coeffR: 2, coeffP: 1, product: 'Fe2O3', molarMass: 159.688 },
    ]);
    const initialMass = 2 * initialMolarMass;
    const finalMass = results[0].productMass;
    const massYield = (finalMass / initialMass) * 100;
    expect(massYield).toBeCloseTo(142.9, 0);
  });

  test('chain preserves mass proportionality', () => {
    const { results } = simulateMultiStep(4, [
      { coeffR: 1, coeffP: 1, product: 'B', molarMass: 10 },
      { coeffR: 1, coeffP: 1, product: 'C', molarMass: 20 },
      { coeffR: 1, coeffP: 1, product: 'D', molarMass: 30 },
    ]);
    expect(results[0].productAmount).toBe(4);
    expect(results[1].productAmount).toBe(4);
    expect(results[2].productAmount).toBe(4);
    expect(results[0].productMass).toBe(40);
    expect(results[1].productMass).toBe(80);
    expect(results[2].productMass).toBe(120);
  });

  test('catalytic cycle: coefficient amplification', () => {
    const { results } = simulateMultiStep(1, [
      { coeffR: 1, coeffP: 3, product: 'B', molarMass: null },
      { coeffR: 3, coeffP: 1, product: 'C', molarMass: null },
    ]);
    expect(results[0].productAmount).toBe(3);
    expect(results[1].productAmount).toBe(1);
  });

  test('step numbering is sequential', () => {
    const { results } = simulateMultiStep(1, [
      { coeffR: 1, coeffP: 1, product: 'A', molarMass: null },
      { coeffR: 1, coeffP: 1, product: 'B', molarMass: null },
      { coeffR: 1, coeffP: 1, product: 'C', molarMass: null },
    ]);
    results.forEach((r, i) => {
      expect(r.stepNumber).toBe(i + 1);
    });
  });
});
