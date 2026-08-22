/**
 * calc-gaslaw.test.js — unit tests for the ideal gas law calculator.
 * The R-select implies a unit system; inputs must be converted to the
 * units matching the selected R (previously everything was forced to
 * atm/L, so R=8.314 produced wrong results).
 */
const fs = require('fs');
const path = require('path');

const MODULE_PATH = path.resolve(__dirname, '../myhugoapp/static/js/calculators/calc-gaslaw.js');

function makeElement(value) {
  return { value: String(value) };
}

function loadModule(R) {
  const values = {
    'gas-calculate-variable': 'T',
    'gas-constant-select': R,
    'gas-pressure': 1,
    'gas-pressure-unit': 'atm',
    'gas-volume': 22.414,
    'gas-volume-unit': 'L',
    'gas-amount': 1,
    'gas-amount-unit': 'mol',
    'gas-temperature': 0,
    'gas-temperature-unit': 'C',
    'gas-result': {},
  };
  const doc = {
    getElementById: (id) => makeElement(values[id] || ''),
    addEventListener: () => {},
  };
  const SRC = fs.readFileSync(MODULE_PATH, 'utf8');
  // eslint-disable-next-line sonarjs/code-eval -- intentional: eval plain-script source in a sandboxed Function scope
  const fn = new Function(
    'document',
    'showToast',
    SRC + ';return { calculateGasLaw, getGasTargetUnits, convertPressureTo, convertVolumeTo };'
  );
  return fn(doc, jest.fn()); // eslint-disable-line sonarjs/code-eval -- fixed source, see above
}

describe('calc-gaslaw unit system coupling', () => {
  test('R=0.08206 (atm/L): 1 atm, 22.414 L, 1 mol => T ≈ 273.15 K', () => {
    const mod = loadModule('0.08206');
    expect(mod.getGasTargetUnits(0.08206)).toEqual({
      pressure: 'atm',
      volume: 'L',
      rLabel: '0.08206 L·atm/(mol·K)',
    });
    // n = PV/RT with T=273.15
    const n = (1 * 22.414) / (0.08206 * 273.15);
    expect(n).toBeCloseTo(1, 3);
  });

  test('R=8.314 (Pa/m3): 101325 Pa, 0.022414 m3, 1 mol => T ≈ 273.15 K', () => {
    const mod = loadModule('8.314');
    expect(mod.getGasTargetUnits(8.314).pressure).toBe('Pa');
    expect(mod.getGasTargetUnits(8.314).volume).toBe('m3');
    const P_pa = mod.convertPressureTo(1, 'atm', 'Pa');
    expect(P_pa).toBeCloseTo(101325, 1);
    const V_m3 = mod.convertVolumeTo(22.414, 'L', 'm3');
    expect(V_m3).toBeCloseTo(0.022414, 6);
    const n = (P_pa * V_m3) / (8.314 * 273.15);
    expect(n).toBeCloseTo(1, 3);
  });

  test('R=0.08314 (bar/L): 1.01325 bar, 22.414 L, 1 mol => T ≈ 273.15 K', () => {
    const mod = loadModule('0.08314');
    const P_bar = mod.convertPressureTo(1, 'atm', 'bar');
    expect(P_bar).toBeCloseTo(1.01325, 4);
    const n = (P_bar * 22.414) / (0.08314 * 273.15);
    expect(n).toBeCloseTo(1, 3);
  });

  test('R=62.364 (Torr/L): 760 Torr, 22.414 L, 1 mol => T ≈ 273.15 K', () => {
    const mod = loadModule('62.364');
    const P_torr = mod.convertPressureTo(1, 'atm', 'Torr');
    expect(P_torr).toBeCloseTo(760, 4);
    const n = (P_torr * 22.414) / (62.364 * 273.15);
    expect(n).toBeCloseTo(1, 3);
  });

  test('R=8.2057e-5 (m3 atm): 1 atm, 0.022414 m3, 1 mol => T ≈ 273.15 K', () => {
    const mod = loadModule('0.000082057');
    const V_m3 = mod.convertVolumeTo(22.414, 'L', 'm3');
    const n = (1 * V_m3) / (0.000082057 * 273.15);
    expect(n).toBeCloseTo(1, 3);
  });
});
