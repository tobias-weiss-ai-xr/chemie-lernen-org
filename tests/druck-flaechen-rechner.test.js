/**
 * Unit Tests for Druck & Fläche Rechner (Pressure Calculator)
 * Pure function tests - no DOM dependencies
 */

// Re-usable calculation helpers (extracted from browser-global pattern)
function druckAusKraftFlaeche(F, A) {
  if (A <= 0) throw new Error('Fläche muss größer als 0 sein');
  if (F < 0) throw new Error('Kraft darf nicht negativ sein');
  return F / A;
}

function kraftAusDruckFlaeche(p, A) {
  if (A <= 0) throw new Error('Fläche muss größer als 0 sein');
  if (p < 0) throw new Error('Druck darf nicht negativ sein');
  return p * A;
}

function flaecheAusKraftDruck(F, p) {
  if (p <= 0) throw new Error('Druck muss größer als 0 sein');
  if (F < 0) throw new Error('Kraft darf nicht negativ sein');
  return F / p;
}

function druckHydrostatisch(rho, g, h) {
  if (rho <= 0) throw new Error('Dichte muss größer als 0 sein');
  if (h < 0) throw new Error('Höhe darf nicht negativ sein');
  return rho * g * h;
}

const PA_TO_BAR = 0.00001;
const PA_TO_ATM = 9.86923e-6;
const PA_TO_MMHG = 0.00750062;
const BAR_TO_PA = 100000;
const ATM_TO_PA = 101325;

function umrechnenDruck(wert, von, nach) {
  const toPa = {
    Pa: 1,
    kPa: 1000,
    MPa: 1000000,
    bar: BAR_TO_PA,
    mbar: 100,
    atm: ATM_TO_PA,
    mmHg: PA_TO_MMHG * ATM_TO_PA,
    Torr: 133.322,
  };
  const fromPa = {
    Pa: 1,
    kPa: 1000,
    MPa: 1000000,
    bar: BAR_TO_PA,
    mbar: 100,
    atm: ATM_TO_PA,
    mmHg: PA_TO_MMHG * ATM_TO_PA,
    Torr: 133.322,
  };
  if (!(von in toPa)) throw new Error(`Unbekannte Einheit: ${von}`);
  if (!(nach in toPa)) throw new Error(`Unbekannte Einheit: ${nach}`);
  const pa = wert * toPa[von];
  return pa / toPa[nach];
}

describe('Druck & Fläche Rechner', () => {
  describe('druckAusKraftFlaeche (p = F/A)', () => {
    test('1000 N auf 0,01 m² ergibt 100.000 Pa', () => {
      expect(druckAusKraftFlaeche(1000, 0.01)).toBe(100000);
    });

    test('500 N auf 0,1 m² ergibt 5.000 Pa', () => {
      expect(druckAusKraftFlaeche(500, 0.1)).toBe(5000);
    });

    test('größere Fläche → kleinerer Druck bei gleicher Kraft', () => {
      const kleinereFlaeche = druckAusKraftFlaeche(1000, 0.01);
      const groessereFlaeche = druckAusKraftFlaeche(1000, 0.1);
      expect(kleinereFlaeche).toBeGreaterThan(groessereFlaeche);
    });

    test('wirft Fehler bei Fläche = 0', () => {
      expect(() => druckAusKraftFlaeche(100, 0)).toThrow('muss größer als 0');
    });

    test('wirft Fehler bei negativer Kraft', () => {
      expect(() => druckAusKraftFlaeche(-50, 0.1)).toThrow('darf nicht negativ');
    });
  });

  describe('kraftAusDruckFlaeche (F = p × A)', () => {
    test('100.000 Pa × 0,01 m² = 1.000 N', () => {
      expect(kraftAusDruckFlaeche(100000, 0.01)).toBe(1000);
    });
  });

  describe('flaecheAusKraftDruck (A = F/p)', () => {
    test('1000 N / 100.000 Pa = 0,01 m²', () => {
      expect(flaecheAusKraftDruck(1000, 100000)).toBe(0.01);
    });
  });

  describe('druckHydrostatisch (p = ρgh)', () => {
    test('Wasser 10 m: 1000 × 9,81 × 10 = 98.100 Pa', () => {
      expect(druckHydrostatisch(1000, 9.81, 10)).toBeCloseTo(98100, 0);
    });

    test('Quecksilber 760 mm ≈ 101.325 Pa (Standardbedingungen)', () => {
      // ρ(Hg, 0°C) ≈ 13595 kg/m³, g = 9,80665 m/s², h = 0,76 m
      // Referenzwert: 1 atm = 101.325 Pa
      const p = druckHydrostatisch(13595, 9.80665, 0.76);
      expect(p).toBeCloseTo(101325, -1); // Differenz < 5 Pa
    });
  });

  describe('umrechnenDruck', () => {
    test('1 bar = 100.000 Pa', () => {
      expect(umrechnenDruck(1, 'bar', 'Pa')).toBeCloseTo(100000, -1);
    });

    test('1 atm = 101.325 Pa', () => {
      expect(umrechnenDruck(1, 'atm', 'Pa')).toBeCloseTo(101325, 0);
    });

    test('101.325 Pa = 1 atm', () => {
      expect(umrechnenDruck(101325, 'Pa', 'atm')).toBeCloseTo(1, 4);
    });

    test('wirft Fehler bei unbekannter Einheit', () => {
      expect(() => umrechnenDruck(100, 'xyz', 'Pa')).toThrow('Unbekannte');
    });
  });
});
