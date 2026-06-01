/**
 * Unit Tests for Hess'sches Gesetz (Hess's Law Calculator)
 */

function calculateHessLaw(eductEnthalpies, productEnthalpies, eductCoeffs, productCoeffs) {
  let sumEducts = 0;
  let sumProducts = 0;
  for (let i = 0; i < eductEnthalpies.length; i++) {
    sumEducts += eductEnthalpies[i] * eductCoeffs[i];
  }
  for (let i = 0; i < productEnthalpies.length; i++) {
    sumProducts += productEnthalpies[i] * productCoeffs[i];
  }
  return sumProducts - sumEducts;
}

function combineReactions(steps) {
  // steps: array of { deltaH, factor }
  let totalDeltaH = 0;
  for (const step of steps) {
    totalDeltaH += step.deltaH * step.factor;
  }
  return totalDeltaH;
}

function reverseReaction(deltaH) {
  return -deltaH;
}

describe('Hess\'sches Gesetz Rechner', () => {
  describe('calculateHessLaw', () => {
    test('C + O₂ → CO₂: ΔH = -393,5 kJ/mol', () => {
      // ΔH_f°: C (0) + O₂ (0) → CO₂ (-393.5)
      const deltaH = calculateHessLaw([0, 0], [-393.5], [1, 1], [1]);
      expect(deltaH).toBeCloseTo(-393.5, 0);
    });

    test('H₂ + ½O₂ → H₂O: ΔH = -285,8 kJ/mol', () => {
      const deltaH = calculateHessLaw([0, 0], [-285.8], [1, 0.5], [1]);
      expect(deltaH).toBeCloseTo(-285.8, 0);
    });

    test('Bildungsenthalpie von CO: C + ½O₂ → CO', () => {
      // C + O₂ → CO₂, ΔH = -393.5
      // CO + ½O₂ → CO₂, ΔH = -283.0
      // C + ½O₂ → CO: ΔH = -393.5 - (-283.0) = -110.5
      const deltaH_CO = calculateHessLaw(
        [0, 0],  // C, O₂
        [-110.5],  // CO
        [1, 0.5],
        [1]
      );
      expect(deltaH_CO).toBeCloseTo(-110.5, 0);
    });
  });

  describe('combineReactions', () => {
    test('Hess: Summe der Teilreaktionen = Gesamtreaktion', () => {
      // Step 1: A → B, ΔH = +100
      // Step 2: B → C, ΔH = -50
      // Gesamt: A → C, ΔH = +50
      const total = combineReactions([
        { deltaH: 100, factor: 1 },
        { deltaH: -50, factor: 1 }
      ]);
      expect(total).toBe(50);
    });

    test('Reaktionen mit Faktor skalieren', () => {
      // Step 1: 2A → 2B, ΔH = +200 (faktor 1)
      // Step 2: B → C, ΔH = -50 (faktor 2)
      const total = combineReactions([
        { deltaH: 100, factor: 1 },
        { deltaH: -50, factor: 2 }
      ]);
      expect(total).toBe(0);
    });

    test('leere Schritte → ΔH = 0', () => {
      expect(combineReactions([])).toBe(0);
    });
  });

  describe('reverseReaction', () => {
    test('Umkehrung einer exothermen Reaktion ist endotherm', () => {
      expect(reverseReaction(-393.5)).toBe(393.5);
    });

    test('zweimalige Umkehrung ergibt ursprünglichen Wert', () => {
      expect(reverseReaction(reverseReaction(-100))).toBe(-100);
    });
  });
});
