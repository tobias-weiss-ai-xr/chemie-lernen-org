/**
 * tests/chemistry-calculator-framework.test.js — Tests für das
 * ChemistryCalculator-Framework (Validierung + Wert-Parsing).
 * Quelle: myhugoapp/static/js/chemistry-calculator-framework.js
 * (Dual-Export: window.Global + module.exports)
 */
const ChemistryCalculator = require('../myhugoapp/static/js/chemistry-calculator-framework.js');

function makeCalc() {
  const calc = new ChemistryCalculator({
    title: 'Test-Rechner',
    inputFields: [
      { id: 'c1', type: 'number', label: 'c₁' },
      { id: 'name', type: 'text', label: 'Name' },
    ],
    validation: {
      c1: { type: 'number', min: 0, max: 100 },
      name: {
        validate: (v) => v.length > 2,
        errorMessage: 'Zu kurz',
      },
    },
  });
  return calc;
}

function makeField(id) {
  const wrap = document.createElement('div');
  const input = document.createElement('input');
  input.id = id;
  wrap.appendChild(input);
  document.body.appendChild(wrap);
  return input;
}

describe('ChemistryCalculator.validateInput', () => {
  let calc;
  let field;

  beforeEach(() => {
    document.body.innerHTML = '';
    calc = makeCalc();
    field = makeField('c1');
    calc.elements.c1 = field;
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('unbekanntes Feld ohne Validation-Regel → true', () => {
    expect(calc.validateInput('nirgendwo', 'x')).toBe(true);
  });

  test('gültige Zahl → true, kein Fehler sichtbar', () => {
    expect(calc.validateInput('c1', '42')).toBe(true);
    const err = field.parentNode.querySelector('.error-message');
    expect(err).toBeNull();
  });

  test('NaN → false + Fehlermeldung', () => {
    expect(calc.validateInput('c1', 'abc')).toBe(false);
    const err = field.parentNode.querySelector('.error-message');
    expect(err).not.toBeNull();
    expect(err.textContent).toContain('gültige Zahl');
    expect(field.classList.contains('error')).toBe(true);
  });

  test('min-Verletzung → false mit Grenzwert in Meldung', () => {
    expect(calc.validateInput('c1', '-5')).toBe(false);
    expect(calc.elements.c1.parentNode.querySelector('.error-message').textContent).toContain(
      'größer als 0'
    );
  });

  test('max-Verletzung → false mit Grenzwert in Meldung', () => {
    expect(calc.validateInput('c1', '150')).toBe(false);
    expect(calc.elements.c1.parentNode.querySelector('.error-message').textContent).toContain(
      'kleiner als 100'
    );
  });

  test('custom validate-Funktion + eigene errorMessage', () => {
    const nameField = makeField('name');
    calc.elements.name = nameField;
    expect(calc.validateInput('name', 'ab')).toBe(false);
    expect(calc.elements.name.parentNode.querySelector('.error-message').textContent).toBe(
      'Zu kurz'
    );
    expect(calc.validateInput('name', 'Säure')).toBe(true);
  });

  test('clearValidationError entfernt Klasse + blendet Container aus', () => {
    calc.validateInput('c1', 'abc'); // Fehler erzeugen
    calc.clearValidationError('c1');
    expect(field.classList.contains('error')).toBe(false);
    const err = field.parentNode.querySelector('.error-message');
    expect(err.style.display).toBe('none');
  });

  test('Auto-Hide nach 5s (fake timers)', () => {
    calc.validateInput('c1', 'abc');
    const err = field.parentNode.querySelector('.error-message');
    expect(err.style.display).toBe('block');
    vi.advanceTimersByTime(5000);
    expect(err.style.display).toBe('none');
    expect(field.classList.contains('error')).toBe(false);
  });
});

describe('ChemistryCalculator.parseValue', () => {
  let calc;

  beforeEach(() => {
    calc = makeCalc();
  });

  test('number: gültige Zahl', () => {
    expect(calc.parseValue('3.14', 'number')).toBeCloseTo(3.14);
  });

  test('number: NaN/Unendlich → 0', () => {
    expect(calc.parseValue('xyz', 'number')).toBe(0);
    expect(calc.parseValue('', 'number')).toBe(0);
  });

  test('select: Wert unverändert', () => {
    expect(calc.parseValue('option-a', 'select')).toBe('option-a');
  });

  test('checkbox: on/true → true, alles andere false', () => {
    expect(calc.parseValue('on', 'checkbox')).toBe(true);
    expect(calc.parseValue('true', 'checkbox')).toBe(true);
    expect(calc.parseValue('off', 'checkbox')).toBe(false);
    expect(calc.parseValue('', 'checkbox')).toBe(false);
  });

  test('text: getrimmt', () => {
    expect(calc.parseValue('  Säure  ', 'text')).toBe('Säure');
  });

  test('unbekannter Typ → text-Verhalten', () => {
    expect(calc.parseValue('  x ', 'mystery')).toBe('x');
  });
});
