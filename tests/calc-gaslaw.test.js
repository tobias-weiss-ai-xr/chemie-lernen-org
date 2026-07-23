const {
  convertPressureToAtm,
  convertVolumeToLiters,
  convertAmountToMoles,
  convertToKelvin,
  convertFromKelvin,
} = require('../myhugoapp/static/js/calculators/calc-gaslaw.js');

function solveGasLaw(P_atm, V_L, n_mol, T_K, R, solveFor) {
  switch (solveFor) {
    case 'n':
      return (P_atm * V_L) / (R * T_K);
    case 'P':
      return (n_mol * R * T_K) / V_L;
    case 'V':
      return (n_mol * R * T_K) / P_atm;
    case 'T':
      return (P_atm * V_L) / (n_mol * R);
    default:
      throw new Error('Unknown variable: ' + solveFor);
  }
}

describe('Gas Law Calculator — Unit Conversions', () => {
  describe('Pressure conversions', () => {
    test('atm is identity', () => {
      expect(convertPressureToAtm(1, 'atm')).toBe(1);
    });

    test('bar to atm', () => {
      expect(convertPressureToAtm(1, 'bar')).toBeCloseTo(0.986923, 5);
    });

    test('Pa to atm', () => {
      expect(convertPressureToAtm(101325, 'Pa')).toBeCloseTo(1, 5);
    });

    test('kPa to atm', () => {
      expect(convertPressureToAtm(101.325, 'kPa')).toBeCloseTo(1, 5);
    });

    test('Torr to atm', () => {
      expect(convertPressureToAtm(760, 'Torr')).toBeCloseTo(1, 5);
    });

    test('mmHg to atm (same as Torr)', () => {
      expect(convertPressureToAtm(760, 'mmHg')).toBeCloseTo(1, 5);
    });

    test('unknown unit returns value unchanged', () => {
      expect(convertPressureToAtm(42, 'psi')).toBe(42);
    });
  });

  describe('Volume conversions', () => {
    test('L is identity', () => {
      expect(convertVolumeToLiters(1, 'L')).toBe(1);
    });

    test('mL to L', () => {
      expect(convertVolumeToLiters(500, 'mL')).toBe(0.5);
    });

    test('m³ to L', () => {
      expect(convertVolumeToLiters(1, 'm3')).toBe(1000);
    });

    test('cm³ to L (same as mL)', () => {
      expect(convertVolumeToLiters(250, 'cm3')).toBe(0.25);
    });
  });

  describe('Amount conversions', () => {
    test('mol is identity', () => {
      expect(convertAmountToMoles(1, 'mol')).toBe(1);
    });

    test('mmol to mol', () => {
      expect(convertAmountToMoles(500, 'mmol')).toBe(0.5);
    });
  });

  describe('Temperature conversions', () => {
    test('Kelvin is identity', () => {
      expect(convertToKelvin(300, 'K')).toBe(300);
    });

    test('Celsius to Kelvin', () => {
      expect(convertToKelvin(0, 'C')).toBeCloseTo(273.15, 2);
      expect(convertToKelvin(25, 'C')).toBeCloseTo(298.15, 2);
      expect(convertToKelvin(-273.15, 'C')).toBeCloseTo(0, 2);
    });

    test('Fahrenheit to Kelvin', () => {
      expect(convertToKelvin(32, 'F')).toBeCloseTo(273.15, 2);
      expect(convertToKelvin(212, 'F')).toBeCloseTo(373.15, 2);
    });

    test('convertFromKelvin', () => {
      expect(convertFromKelvin(273.15)).toBeCloseTo(0, 2);
      expect(convertFromKelvin(373.15)).toBeCloseTo(100, 2);
    });
  });
});

describe('Gas Law Calculator — PV = nRT', () => {
  const R = 0.08206; // L·atm/(mol·K)

  test('STP: 1 mol at 273.15 K, 1 atm → V = 22.414 L', () => {
    const V = solveGasLaw(1, null, 1, 273.15, R, 'V');
    expect(V).toBeCloseTo(22.414, 1);
  });

  test('solve for n: P=2.5 atm, V=10 L, T=298.15 K', () => {
    const n = solveGasLaw(2.5, 10, null, 298.15, R, 'n');
    expect(n).toBeCloseTo(1.0218, 3);
  });

  test('solve for P: n=1 mol, V=22.414 L, T=273.15 K → P ≈ 1 atm', () => {
    const P = solveGasLaw(null, 22.414, 1, 273.15, R, 'P');
    expect(P).toBeCloseTo(1, 3);
  });

  test('solve for T: P=1 atm, V=22.414 L, n=1 mol → T ≈ 273.15 K', () => {
    const T = solveGasLaw(1, 22.414, 1, null, R, 'T');
    expect(T).toBeCloseTo(273.15, 1);
  });

  test('higher pressure → fewer moles (inverse)', () => {
    const n_low = solveGasLaw(1, 10, null, 298.15, R, 'n');
    const n_high = solveGasLaw(10, 10, null, 298.15, R, 'n');
    expect(n_high).toBeGreaterThan(0);
    expect(n_high).toBeGreaterThan(n_low);
  });

  test('higher temperature → more volume (direct)', () => {
    const V_cold = solveGasLaw(1, null, 1, 200, R, 'V');
    const V_hot = solveGasLaw(1, null, 1, 400, R, 'V');
    expect(V_hot).toBeGreaterThan(V_cold);
    expect(V_hot / V_cold).toBeCloseTo(2, 2);
  });

  test('SATP: 1 mol at 298.15 K, 1 bar → V ≈ 24.47 L', () => {
    const P_atm = convertPressureToAtm(1, 'bar');
    const V = solveGasLaw(P_atm, null, 1, 298.15, R, 'V');
    expect(V).toBeCloseTo(24.47, 0);
  });

  test('throws on unknown variable', () => {
    expect(() => solveGasLaw(1, 1, 1, 300, R, 'X')).toThrow('Unknown variable');
  });
});
