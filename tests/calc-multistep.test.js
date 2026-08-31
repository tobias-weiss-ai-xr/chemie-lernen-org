/**
 * Unit Tests for Multi-Step Reaction Calculator (calc-multistep.js)
 * Tests sequential stoichiometric calculations across multiple reaction steps.
 */

const { calculateMultiStepPure } = require('../myhugoapp/static/js/calculators/calc-multistep.js');

describe('Multi-Step Reaction Calculator (calc-multistep.js)', () => {
  test('single step 1:1 ratio — amount preserved', () => {
    const { results, overallYield } = calculateMultiStepPure(2, [
      { coeffR: 1, coeffP: 1, product: 'B', molarMass: null },
    ]);
    expect(results[0].productAmount).toBe(2);
    expect(overallYield).toBe(100);
  });

  test('single step 1:2 ratio — amount doubles', () => {
    const { results } = calculateMultiStepPure(3, [
      { coeffR: 1, coeffP: 2, product: 'B', molarMass: null },
    ]);
    expect(results[0].productAmount).toBe(6);
  });

  test('Fe oxidation chain: Fe → FeO → Fe₂O₃', () => {
    const steps = [
      { coeffR: 2, coeffP: 2, product: 'FeO', molarMass: 71.844, equation: '2Fe + O2 → 2FeO' },
      {
        coeffR: 2,
        coeffP: 1,
        product: 'Fe2O3',
        molarMass: 159.688,
        equation: '4FeO + O2 → 2Fe2O3',
      },
    ];
    const { results, overallYield } = calculateMultiStepPure(2, steps);

    expect(results[0].productAmount).toBe(2);
    expect(results[0].productMass).toBeCloseTo(143.688, 2);

    expect(results[1].productAmount).toBe(1);
    expect(results[1].productMass).toBeCloseTo(159.688, 2);

    expect(overallYield).toBe(50);
  });

  test('mass calculation with molar mass', () => {
    const { results } = calculateMultiStepPure(1, [
      { coeffR: 1, coeffP: 1, product: 'NaCl', molarMass: 58.44 },
    ]);
    expect(results[0].productMass).toBeCloseTo(58.44, 2);
  });

  test('null molar mass → productMass is null', () => {
    const { results } = calculateMultiStepPure(2, [
      { coeffR: 1, coeffP: 1, product: 'X', molarMass: null },
    ]);
    expect(results[0].productMass).toBeNull();
  });

  test('overall yield decreases with each lossy step', () => {
    const { overallYield } = calculateMultiStepPure(10, [
      { coeffR: 2, coeffP: 1, product: 'B', molarMass: null },
      { coeffR: 2, coeffP: 1, product: 'C', molarMass: null },
      { coeffR: 2, coeffP: 1, product: 'D', molarMass: null },
    ]);
    expect(overallYield).toBeCloseTo(12.5, 1);
  });

  test('mass yield calculation', () => {
    const initialMolarMass = 55.845;
    const { results } = calculateMultiStepPure(2, [
      { coeffR: 2, coeffP: 1, product: 'Fe2O3', molarMass: 159.688 },
    ]);
    const initialMass = 2 * initialMolarMass;
    const finalMass = results[0].productMass;
    const massYield = (finalMass / initialMass) * 100;
    expect(massYield).toBeCloseTo(142.9, 0);
  });

  test('chain preserves mass proportionality', () => {
    const { results } = calculateMultiStepPure(4, [
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
    const { results } = calculateMultiStepPure(1, [
      { coeffR: 1, coeffP: 3, product: 'B', molarMass: null },
      { coeffR: 3, coeffP: 1, product: 'C', molarMass: null },
    ]);
    expect(results[0].productAmount).toBe(3);
    expect(results[1].productAmount).toBe(1);
  });

  test('step numbering is sequential', () => {
    const { results } = calculateMultiStepPure(1, [
      { coeffR: 1, coeffP: 1, product: 'A', molarMass: null },
      { coeffR: 1, coeffP: 1, product: 'B', molarMass: null },
      { coeffR: 1, coeffP: 1, product: 'C', molarMass: null },
    ]);
    results.forEach((r, i) => {
      expect(r.stepNumber).toBe(i + 1);
    });
  });
});

// ── DOM-Flows (jsdom): calculateMultiStep-Handler ─────────────────────
const {
  calculateMultiStep,
  displayMultiStepResults,
} = require('../myhugoapp/static/js/calculators/calc-multistep.js');
global.showToast = jest.fn();
global.saveToHistory = jest.fn();

function stepHtml(r, p, mm, product) {
  return (
    '<div class="reaction-step">' +
    `<input class="step-coeff-r" value="${r}" />` +
    `<input class="step-coeff-p" value="${p}" />` +
    `<input class="step-molar-mass" value="${mm}" />` +
    `<input class="step-product" value="${product}" />` +
    '<input class="step-equation" value="" />' +
    '</div>'
  );
}

describe('calculateMultiStep — DOM-Handler', () => {
  beforeEach(() => {
    global.showToast.mockClear();
    document.body.innerHTML =
      '<input id="initial-amount" /><input id="initial-molar-mass" /><input id="initial-compound" />' +
      '<div id="multistep-result"></div><div id="multistep-results-content"></div>';
  });

  test('ungültige Ausgangsstoffmenge → Toast, kein Ergebnis', () => {
    document.getElementById('initial-amount').value = '-1';
    document.getElementById('initial-molar-mass').value = '100';
    calculateMultiStep();
    expect(global.showToast).toHaveBeenCalled();
    expect(document.getElementById('multistep-results-content').innerHTML).toBe('');
  });

  test('kein Reaktionsschritt → Toast', () => {
    document.getElementById('initial-amount').value = '10';
    document.getElementById('initial-molar-mass').value = '100';
    calculateMultiStep();
    expect(global.showToast).toHaveBeenCalledWith(
      expect.stringContaining('Reaktionsschritt'),
      'error'
    );
  });

  test('Koeffizient 0 in Schritt 1 → Fehler mit Schrittnummer', () => {
    document.getElementById('initial-amount').value = '10';
    document.getElementById('initial-molar-mass').value = '100';
    document.body.insertAdjacentHTML('beforeend', stepHtml('0', '1', '50', 'Zwischenprodukt'));
    calculateMultiStep();
    expect(global.showToast).toHaveBeenCalledWith(expect.stringContaining('Schritt 1'), 'error');
    expect(document.getElementById('multistep-results-content').innerHTML).toBe('');
  });

  test('Happy Path 2 Schritte: 10 mol → ×3/1 → ×1/2, Gesamtausbeute 15 %', () => {
    document.getElementById('initial-amount').value = '10';
    document.getElementById('initial-molar-mass').value = '100';
    document.getElementById('initial-compound').value = 'Start';
    document.body.insertAdjacentHTML(
      'beforeend',
      stepHtml('1', '3', '50', 'A') + stepHtml('2', '1', '25', 'B')
    );
    calculateMultiStep();
    const html = document.getElementById('multistep-results-content').innerHTML;
    expect(html).toContain('Schritt 1');
    expect(html).toContain('Schritt 2');
    expect(html).toContain('15'); // 10 → 30 → 15 => 15 %
  });

  test('XSS-Schutz: Verbindungsnamen werden escaped', () => {
    displayMultiStepResults(10, 100, '<script>alert(1)</script>', [
      {
        stepNumber: 1,
        productAmount: 5,
        product: 'A',
        reactantAmount: 10,
        coeffR: 1,
        coeffP: 1,
        molarMass: 0,
        productMass: null,
        equation: '',
      },
    ]);
    const html = document.getElementById('multistep-results-content').innerHTML;
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });
});
