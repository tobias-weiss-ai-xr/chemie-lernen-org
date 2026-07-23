/**
 * Unit Tests for Reaktionskinetik Simulator (Reaction Kinetics Calculator)
 */

const GAS_CONSTANT = 8.314;
const BOLTZMANN = 1.380649e-23;

function calculateAverageVelocity(T, molarMass) {
  // v = sqrt(3RT/M) (in m/s)
  const M = molarMass / 1000; // g/mol → kg/mol
  return Math.sqrt((3 * GAS_CONSTANT * T) / M);
}

function calculateRateConstant(A, Ea, T) {
  // Arrhenius: k = A * exp(-Ea / (R * T))
  return A * Math.exp(-Ea / (GAS_CONSTANT * T));
}

function maxwellBoltzmannFraction(Ea, T) {
  // Fraction of particles with energy >= Ea at temperature T
  // Simplified: exp(-Ea / (R * T))
  return Math.exp(-Ea / (GAS_CONSTANT * T));
}

function rgtRule(T1, T2) {
  // RGT rule: rate roughly doubles per 10K increase
  return Math.pow(2, (T2 - T1) / 10);
}

function collisionFrequency(T, concentration, crossSection, molarMass) {
  // Simplified collision frequency: Z = σ * v_rel * N/V
  const M = molarMass / 1000;
  const avgVel = Math.sqrt((8 * GAS_CONSTANT * T) / (Math.PI * M));
  const N = concentration * 6.022e23; // particles per m³
  return crossSection * avgVel * N;
}

describe('Reaktionskinetik Simulator', () => {
  describe('calculateAverageVelocity', () => {
    test('Stickstoff (N₂, 28 g/mol) bei 300 K', () => {
      const v = calculateAverageVelocity(300, 28);
      expect(v).toBeCloseTo(517, 0); // ~517 m/s
    });

    test('höhere Temperatur → höhere Geschwindigkeit', () => {
      const v300 = calculateAverageVelocity(300, 28);
      const v600 = calculateAverageVelocity(600, 28);
      expect(v600).toBeGreaterThan(v300);
    });

    test('schwerere Moleküle → niedrigere Geschwindigkeit', () => {
      const leicht = calculateAverageVelocity(300, 2); // H₂
      const schwer = calculateAverageVelocity(300, 32); // O₂
      expect(leicht).toBeGreaterThan(schwer);
    });
  });

  describe('calculateRateConstant (Arrhenius)', () => {
    test('k = A bei Ea = 0 (keine Barriere)', () => {
      expect(calculateRateConstant(1e13, 0, 300)).toBe(1e13);
    });

    test('höhere Temperatur → größere Rate', () => {
      const k300 = calculateRateConstant(1e13, 50000, 300);
      const k400 = calculateRateConstant(1e13, 50000, 400);
      expect(k400).toBeGreaterThan(k300);
    });

    test('höhere Aktivierungsenergie → kleinere Rate', () => {
      const kLow = calculateRateConstant(1e13, 30000, 300);
      const kHigh = calculateRateConstant(1e13, 60000, 300);
      expect(kLow).toBeGreaterThan(kHigh);
    });

    test('T = 0 → k = 0 (Division durch exp(∞))', () => {
      expect(calculateRateConstant(1e13, 50000, 0)).toBe(0);
    });
  });

  describe('maxwellBoltzmannFraction', () => {
    test('höhere Temperatur → mehr Teilchen über Ea', () => {
      const f300 = maxwellBoltzmannFraction(50000, 300);
      const f400 = maxwellBoltzmannFraction(50000, 400);
      expect(f400).toBeGreaterThan(f300);
    });

    test('Ea = 0 → alle Teilchen reaktiv', () => {
      expect(maxwellBoltzmannFraction(0, 300)).toBe(1);
    });
  });

  describe('rgtRule (Reaktionsgeschwindigkeit-Temperatur-Regel)', () => {
    test('+10 K → Faktor ~2', () => {
      expect(rgtRule(300, 310)).toBeCloseTo(2, 0);
    });

    test('+20 K → Faktor ~4', () => {
      expect(rgtRule(300, 320)).toBeCloseTo(4, 0);
    });

    test('gleiche Temperatur → Faktor 1', () => {
      expect(rgtRule(300, 300)).toBe(1);
    });
  });

  describe('collisionFrequency', () => {
    test('höhere Konzentration → mehr Kollisionen', () => {
      const niedrig = collisionFrequency(300, 0.1, 1e-19, 28);
      const hoch = collisionFrequency(300, 1.0, 1e-19, 28);
      expect(hoch).toBeGreaterThan(niedrig);
    });
  });
});
