/**
 * calc-gaslaw.test.js — unit tests for the ideal gas law calculator.
 * The R-select implies a unit system; inputs must be converted to the
 * units matching the selected R (previously everything was forced to
 * atm/L, so R=8.314 produced wrong results).
 *
 * Geladen per require() über die module.exports-Brücke (jsdom liefert
 * document/localStorage) — zählt für die Coverage-Instrumentierung.
 */

const calc = require('../myhugoapp/static/js/calculators/calc-gaslaw.js');

// showToast/saveToHistory sind Site-Globals aus anderen Scripts (Shared-
// globals-Pattern; siehe AGENTS.md) — hier als Stubs bereitgestellt.
global.showToast = jest.fn();
global.saveToHistory = jest.fn();

const GAS_IDS = [
  'kelvin-value',
  'gas-calculate-variable',
  'gas-constant-select',
  'gas-pressure',
  'gas-pressure-unit',
  'gas-volume',
  'gas-volume-unit',
  'gas-amount',
  'gas-amount-unit',
  'gas-temperature',
  'gas-temperature-unit',
  'gas-result',
  'gas-result-content',
];

function setGasDOM(values) {
  document.body.innerHTML = GAS_IDS.map((id) => `<div id="${id}"></div>`).join('');
  for (const id of GAS_IDS) {
    document.getElementById(id).value = values[id] !== undefined ? String(values[id]) : '';
  }
}

describe('calc-gaslaw unit system coupling', () => {
  test('R=0.08206 (atm/L): 1 atm, 22.414 L, 1 mol => T ≈ 273.15 K', () => {
    expect(calc.getGasTargetUnits(0.08206)).toEqual({
      pressure: 'atm',
      volume: 'L',
      rLabel: '0.08206 L·atm/(mol·K)',
    });
    // n = PV/RT with T=273.15
    const n = (1 * 22.414) / (0.08206 * 273.15);
    expect(n).toBeCloseTo(1, 3);
  });

  test('R=8.314 (Pa/m3): 101325 Pa, 0.022414 m3, 1 mol => T ≈ 273.15 K', () => {
    expect(calc.getGasTargetUnits(8.314).pressure).toBe('Pa');
    expect(calc.getGasTargetUnits(8.314).volume).toBe('m3');
    const P_pa = calc.convertPressureTo(1, 'atm', 'Pa');
    expect(P_pa).toBeCloseTo(101325, 1);
    const V_m3 = calc.convertVolumeTo(22.414, 'L', 'm3');
    expect(V_m3).toBeCloseTo(0.022414, 6);
    const n = (P_pa * V_m3) / (8.314 * 273.15);
    expect(n).toBeCloseTo(1, 3);
  });

  test('R=0.08314 (bar/L): 1.01325 bar, 22.414 L, 1 mol => T ≈ 273.15 K', () => {
    const P_bar = calc.convertPressureTo(1, 'atm', 'bar');
    expect(P_bar).toBeCloseTo(1.01325, 4);
    const n = (P_bar * 22.414) / (0.08314 * 273.15);
    expect(n).toBeCloseTo(1, 3);
  });

  test('R=62.364 (Torr/L): 760 Torr, 22.414 L, 1 mol => T ≈ 273.15 K', () => {
    const P_torr = calc.convertPressureTo(1, 'atm', 'Torr');
    expect(P_torr).toBeCloseTo(760, 4);
    const n = (P_torr * 22.414) / (62.364 * 273.15);
    expect(n).toBeCloseTo(1, 3);
  });

  test('R=8.2057e-5 (m3 atm): 1 atm, 0.022414 m3, 1 mol => T ≈ 273.15 K', () => {
    const V_m3 = calc.convertVolumeTo(22.414, 'L', 'm3');
    const n = (1 * V_m3) / (0.000082057 * 273.15);
    expect(n).toBeCloseTo(1, 3);
  });
});

describe('calculateGasLaw — End-to-End über jsdom-DOM', () => {
  test('löst n: 1 atm, 22.414 L, 0 °C, R=0.08206 => n ≈ 1.0000 mol', () => {
    setGasDOM({
      'gas-calculate-variable': 'n',
      'gas-constant-select': '0.08206',
      'gas-pressure': 1,
      'gas-pressure-unit': 'atm',
      'gas-volume': 22.414,
      'gas-volume-unit': 'L',
      'gas-amount': 1,
      'gas-amount-unit': 'mol',
      'gas-temperature': 0,
      'gas-temperature-unit': 'C',
    });
    calc.calculateGasLaw();
    const html = document.getElementById('gas-result-content').innerHTML;
    expect(html).toContain('1.0000');
    expect(html).toContain('mol');
  });

  test('löst T in SI-Einheiten: 101325 Pa, 22.414 L, 1 mol, R=8.314 => T ≈ 273.15 K', () => {
    setGasDOM({
      'gas-calculate-variable': 'T',
      'gas-constant-select': '8.314',
      'gas-pressure': 101325,
      'gas-pressure-unit': 'Pa',
      'gas-volume': 22.414,
      'gas-volume-unit': 'L',
      'gas-amount': 1,
      'gas-amount-unit': 'mol',
      'gas-temperature': 273.15,
      'gas-temperature-unit': 'K',
    });
    calc.calculateGasLaw();
    const html = document.getElementById('gas-result-content').innerHTML;
    expect(html).toContain('273.1');
    expect(html).toContain('K');
  });

  test('ungültige Temperatur (0 K absolut, Umrechnung C=−273,15) => Toast statt Crash', () => {
    setGasDOM({
      'gas-calculate-variable': 'n',
      'gas-constant-select': '0.08206',
      'gas-pressure': 1,
      'gas-pressure-unit': 'atm',
      'gas-volume': 22.414,
      'gas-volume-unit': 'L',
      'gas-amount': 1,
      'gas-amount-unit': 'mol',
      'gas-temperature': -273.15,
      'gas-temperature-unit': 'C',
    });
    expect(() => calc.calculateGasLaw()).not.toThrow();
    expect(document.getElementById('gas-result-content').innerHTML).toBe('');
  });

  test('fehlende Eingabe (NaN) => Toast statt Crash', () => {
    setGasDOM({
      'gas-calculate-variable': 'P',
      'gas-constant-select': '0.08206',
      'gas-pressure': 1,
      'gas-pressure-unit': 'atm',
      'gas-volume': '',
      'gas-volume-unit': 'L',
      'gas-amount': 1,
      'gas-amount-unit': 'mol',
      'gas-temperature': 25,
      'gas-temperature-unit': 'C',
    });
    expect(() => calc.calculateGasLaw()).not.toThrow();
    expect(document.getElementById('gas-result-content').innerHTML).toBe('');
  });
});

describe('Einheiten-Konverter (Zweigmatrix)', () => {
  test.each([
    ['Pa', 101325, 1],
    ['kPa', 101.325, 1],
    ['bar', 1.01325, 1],
    ['Torr', 760, 1],
    ['mmHg', 760, 1],
    // ('psi' wird von convertPressureToAtm nicht unterstützt — Passthrough)
  ])('convertPressureToAtm: %s-%s => 1 atm', (unit, value, expected) => {
    expect(calc.convertPressureToAtm(value, unit)).toBeCloseTo(expected, 2);
  });

  test.each([
    ['L', 22.414, 22.414],
    ['mL', 22414, 22.414],
    ['m3', 0.022414, 22.414],
  ])('convertVolumeToLiters: %s => L', (unit, value, expected) => {
    expect(calc.convertVolumeToLiters(value, unit)).toBeCloseTo(expected, 4);
  });

  test.each([
    ['mol', 1, 1],
    ['mmol', 1000, 1],
  ])('convertAmountToMoles: %s => mol', (unit, value, expected) => {
    expect(calc.convertAmountToMoles(value, unit)).toBeCloseTo(expected, 6);
  });

  test.each([
    ['K', 273.15, 273.15],
    ['C', 0, 273.15],
    ['F', 32, 273.15],
  ])('convertToKelvin: %s => K (wasserfest)', (unit, value, expected) => {
    expect(calc.convertToKelvin(value, unit)).toBeCloseTo(expected, 4);
  });

  test('convertFromKelvin(310.15) => 37 °C', () => {
    expect(calc.convertFromKelvin(310.15)).toBeCloseTo(37, 4);
  });

  test('atmToUnit rundet die Einheitenfamilie korrekt', () => {
    expect(calc.atmToUnit(2, 'Pa')).toBeCloseTo(202650, 0);
    expect(calc.atmToUnit(2, 'kPa')).toBeCloseTo(202.65, 2);
    expect(calc.atmToUnit(2, 'Torr')).toBeCloseTo(1520, 0);
  });
});

describe('Preset-Loader & Kelvin-Anzeige', () => {
  test('loadSTP füllt Normbedingungen (1 atm, 22.414 L, 0 °C) + 273.15 K', () => {
    setGasDOM({});
    calc.loadSTP();
    expect(String(document.getElementById('gas-pressure').value)).toBe('1');
    expect(document.getElementById('gas-pressure-unit').value).toBe('atm');
    expect(String(document.getElementById('gas-volume').value)).toBe('22.414');
    expect(String(document.getElementById('gas-temperature').value)).toBe('0');
    expect(document.getElementById('kelvin-value').textContent).toBe('273.15');
  });

  test('loadSATP füllt Standardbedingungen (1 bar, 24.789 L, 25 °C) + 298.15 K', () => {
    setGasDOM({});
    calc.loadSATP();
    expect(document.getElementById('gas-pressure-unit').value).toBe('bar');
    expect(document.getElementById('gas-constant-select').value).toBe('0.08314');
    expect(document.getElementById('kelvin-value').textContent).toBe('298.15');
  });

  test('loadGasExample: 2.5 atm, 10 L, 25 °C, Zielgröße n', () => {
    setGasDOM({});
    calc.loadGasExample();
    expect(String(document.getElementById('gas-pressure').value)).toBe('2.5');
    expect(document.getElementById('gas-calculate-variable').value).toBe('n');
  });

  test('convertTemperatureToKelvin: F-Zweig (212 °F → 373.15 K)', () => {
    setGasDOM({ 'gas-temperature': 212, 'gas-temperature-unit': 'F' });
    calc.convertTemperatureToKelvin();
    expect(document.getElementById('kelvin-value').textContent).toBe('373.15');
  });

  test('convertTemperatureToKelvin: K-Durchreichung und NaN → "-"', () => {
    setGasDOM({ 'gas-temperature': 310, 'gas-temperature-unit': 'K' });
    calc.convertTemperatureToKelvin();
    expect(document.getElementById('kelvin-value').textContent).toBe('310.00');
    setGasDOM({ 'gas-temperature': '', 'gas-temperature-unit': 'K' });
    calc.convertTemperatureToKelvin();
    expect(document.getElementById('kelvin-value').textContent).toBe('-');
  });
});
