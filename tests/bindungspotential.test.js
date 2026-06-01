/**
 * Unit Tests for Bindungspotential (Binding Potential Calculator)
 */

function morsePotential(De, a, r, r0) {
  const exponent = -a * (r - r0);
  return De * Math.pow(1 - Math.exp(exponent), 2);
}

function calculateActivationEnergy(Euebergang, Eedukt) {
  return Euebergang - Eedukt;
}

function calculateReactionEnthalpy(Eprodukt, Eedukt) {
  return Eprodukt - Eedukt;
}

function classifyReaction(deltaH) {
  if (deltaH < 0) return 'exotherm';
  if (deltaH > 0) return 'endotherm';
  return 'neutral';
}

describe('Bindungspotential Rechner', () => {
  describe('morsePotential', () => {
    test('Minimum am Gleichgewichtsabstand r = r0', () => {
      const De = 100;
      const a = 2;
      const r0 = 0.15;  // nm
      const E = morsePotential(De, a, r0, r0);
      expect(E).toBeCloseTo(0, 10);  // Minimum at equilibrium
    });

    test('steigt bei Annäherung (Abstoßungsbereich)', () => {
      const E_nah = morsePotential(100, 2, 0.05, 0.15);
      const E_gleich = morsePotential(100, 2, 0.15, 0.15);
      expect(E_nah).toBeGreaterThan(E_gleich);
    });

    test('Annäherung an De bei sehr großem Abstand', () => {
      const De = 100;
      const E = morsePotential(De, 2, 5.0, 0.15);
      expect(E).toBeCloseTo(De, 0);
    });

    test('größeres a → steilerer Potentialtopf', () => {
      const steil = morsePotential(100, 3, 0.1, 0.15);
      const flach = morsePotential(100, 1, 0.1, 0.15);
      expect(steil).toBeGreaterThan(flach);
    });
  });

  describe('calculateActivationEnergy', () => {
    test('Aktivierungsenergie = Übergangszustand - Edukte', () => {
      expect(calculateActivationEnergy(150, 50)).toBe(100);
    });

    test('keine Aktivierungsbarriere bei Ea = 0', () => {
      expect(calculateActivationEnergy(50, 50)).toBe(0);
    });
  });

  describe('calculateReactionEnthalpy', () => {
    test('exotherme Reaktion: ΔH < 0', () => {
      const deltaH = calculateReactionEnthalpy(30, 100);
      expect(deltaH).toBe(-70);
      expect(classifyReaction(deltaH)).toBe('exotherm');
    });

    test('endotherme Reaktion: ΔH > 0', () => {
      const deltaH = calculateReactionEnthalpy(100, 30);
      expect(deltaH).toBe(70);
      expect(classifyReaction(deltaH)).toBe('endotherm');
    });

    test('neutrale Reaktion: ΔH = 0', () => {
      expect(classifyReaction(0)).toBe('neutral');
    });
  });
});
