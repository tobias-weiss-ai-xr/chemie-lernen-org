/**
 * Unit Tests for Chemisches Gleichgewicht (Chemical Equilibrium Calculator)
 */

function calculateKc(productConcs, eductConcs, productCoeffs, eductCoeffs) {
  if (productConcs.length !== productCoeffs.length ||
      eductConcs.length !== eductCoeffs.length) {
    throw new Error('Ungültige Eingabe: Konzentrationen und Koeffizienten müssen gleich viele Elemente haben');
  }
  let produktTerm = 1;
  let eduktTerm = 1;
  for (let i = 0; i < productConcs.length; i++) {
    produktTerm *= Math.pow(productConcs[i], productCoeffs[i]);
  }
  for (let i = 0; i < eductConcs.length; i++) {
    eduktTerm *= Math.pow(eductConcs[i], eductCoeffs[i]);
  }
  if (eduktTerm <= 0) throw new Error('Eduktkonzentrationen dürfen nicht 0 sein');
  return produktTerm / eduktTerm;
}

function calculateReactionQuotient(Q, Kc) {
  if (Q < Kc) return 'nach rechts (Produkte)';
  if (Q > Kc) return 'nach links (Edukte)';
  return 'im Gleichgewicht';
}

function leChatelierConcentration(change, side) {
  // change: 'increase' or 'decrease'
  // side: 'educts' or 'products'
  if (change === 'increase') {
    return side === 'educts' ? 'Gleichgewicht verschiebt sich nach rechts' : 'Gleichgewicht verschiebt sich nach links';
  }
  if (change === 'decrease') {
    return side === 'educts' ? 'Gleichgewicht verschiebt sich nach links' : 'Gleichgewicht verschiebt sich nach rechts';
  }
  throw new Error('Ungültige Änderung');
}

function calculateKpFromKc(Kc, deltaN, R, T) {
  return Kc * Math.pow(R * T, deltaN);
}

describe('Chemisches Gleichgewicht Rechner', () => {
  describe('calculateKc (Massenwirkungsgesetz)', () => {
    test('H₂ + I₂ ⇌ 2HI mit Kc = 54 bei 425°C', () => {
      // [HI] = 0.5, [H₂] = 0.1, [I₂] = 0.1 → Kc = 0.5^2 / (0.1 * 0.1) = 25
      const Kc = calculateKc([0.5], [0.1, 0.1], [2], [1, 1]);
      expect(Kc).toBeCloseTo(25, 5);
    });

    test('einfache Reaktion A ⇌ B mit Kc = 2', () => {
      const Kc = calculateKc([2], [1], [1], [1]);
      expect(Kc).toBe(2);
    });

    test('wirft Fehler bei Eduktkonzentration = 0', () => {
      expect(() => calculateKc([1], [0], [1], [1])).toThrow('dürfen nicht 0');
    });

    test('wirft Fehler bei falscher Array-Länge', () => {
      expect(() => calculateKc([1, 2], [1], [1], [1])).toThrow('Ungültige Eingabe');
    });
  });

  describe('calculateReactionQuotient', () => {
    test('Q < Kc → Reaktion läuft nach rechts', () => {
      expect(calculateReactionQuotient(10, 50)).toBe('nach rechts (Produkte)');
    });

    test('Q > Kc → Reaktion läuft nach links', () => {
      expect(calculateReactionQuotient(50, 10)).toBe('nach links (Edukte)');
    });

    test('Q = Kc → im Gleichgewicht', () => {
      expect(calculateReactionQuotient(25, 25)).toBe('im Gleichgewicht');
    });
  });

  describe('leChatelierConcentration', () => {
    test('Erhöhung der Eduktkonzentration → Verschiebung nach rechts', () => {
      expect(leChatelierConcentration('increase', 'educts'))
        .toBe('Gleichgewicht verschiebt sich nach rechts');
    });

    test('Erhöhung der Produktkonzentration → Verschiebung nach links', () => {
      expect(leChatelierConcentration('increase', 'products'))
        .toBe('Gleichgewicht verschiebt sich nach links');
    });

    test('Erniedrigung der Eduktkonzentration → Verschiebung nach links', () => {
      expect(leChatelierConcentration('decrease', 'educts'))
        .toBe('Gleichgewicht verschiebt sich nach links');
    });
  });

  describe('calculateKpFromKc', () => {
    test('Kp = Kc wenn Δn = 0', () => {
      expect(calculateKpFromKc(25, 0, 8.314, 298)).toBe(25);
    });

    test('Δn > 0 → Kp > Kc', () => {
      const Kp = calculateKpFromKc(25, 1, 8.314, 298);
      expect(Kp).toBeGreaterThan(25);
    });
  });
});
