/**
 * Unit Tests für calc-equation-parser.js — das ECHTE Modul.
 *
 * Ersetzt die früheren Regex-Inline-Tests (die testeten nur nachgebaute
 * Ausdrücke, nie den Produktionsparser). parseChemicalEquation wird per
 * require() geladen — zählt für die Coverage.
 */

const {
  parseChemicalEquation,
  parseSide,
  parseCompound,
} = require('../myhugoapp/static/js/calculators/calc-equation-parser.js');

describe('parseCompound — Koeffizienten-Extraktion', () => {
  test('expliziter Koeffizient: "2 H2O" → coefficient 2, formula H2O', () => {
    expect(parseCompound('2 H2O')).toEqual({
      coefficient: 2,
      formula: 'H2O',
      hasExplicitCoefficient: true,
    });
  });

  test('impliziter Koeffizient: "H2O" → coefficient 1, nicht explizit', () => {
    expect(parseCompound('H2O')).toEqual({
      coefficient: 1,
      formula: 'H2O',
      hasExplicitCoefficient: false,
    });
  });

  test('Koeffizient ohne Leerzeichen: "2H2O" wird erkannt', () => {
    expect(parseCompound('2H2O')).toEqual({
      coefficient: 2,
      formula: 'H2O',
      hasExplicitCoefficient: true,
    });
  });

  test('Dezimal-Koeffizient: "0.5 O2"', () => {
    expect(parseCompound('0.5 O2')).toEqual({
      coefficient: 0.5,
      formula: 'O2',
      hasExplicitCoefficient: true,
    });
  });

  test('Klammern in der Formel bleiben erhalten: "Ca(OH)2"', () => {
    expect(parseCompound('Ca(OH)2').formula).toBe('Ca(OH)2');
  });

  test('unpassende Eingabe (z. B. "2 H 2 O") → Rohformel, Koeffizient 1', () => {
    const r = parseCompound('2 H 2 O');
    expect(r.coefficient).toBe(1);
    expect(r.hasExplicitCoefficient).toBe(false);
  });
});

describe('parseSide — Seiten-Zerlegung', () => {
  test('"2 H2 + O2" → zwei Verbindungen mit Koeffizienten', () => {
    expect(parseSide('2 H2 + O2')).toEqual([
      { coefficient: 2, formula: 'H2', hasExplicitCoefficient: true },
      { coefficient: 1, formula: 'O2', hasExplicitCoefficient: false },
    ]);
  });

  test('Pluszeichen am Rand wird toleriert ("A + B +")', () => {
    expect(parseSide('A + B +')).toHaveLength(2);
  });

  test('leere Seite wirft Fehler', () => {
    expect(() => parseSide('')).toThrow('Leere Seite');
  });

  test('nur Pluszeichen wirft Fehler', () => {
    expect(() => parseSide('+ +')).toThrow('Keine Verbindungen');
  });
});

describe('parseChemicalEquation — Vollständige Gleichungen', () => {
  test('"2 H2 + O2 -> 2 H2O" mit ASCII-Pfeil', () => {
    const r = parseChemicalEquation('2 H2 + O2 -> 2 H2O');
    expect(r.totalReactants).toBe(2);
    expect(r.totalProducts).toBe(1);
    expect(r.reactants[0]).toMatchObject({ coefficient: 2, formula: 'H2' });
    expect(r.products[0]).toMatchObject({ coefficient: 2, formula: 'H2O' });
  });

  test('Unicode-Pfeil "→"', () => {
    const r = parseChemicalEquation('N2 + 3 H2 → 2 NH3');
    expect(r.reactants).toHaveLength(2);
    expect(r.products[0].formula).toBe('NH3');
    expect(r.products[0].coefficient).toBe(2);
  });

  test('Gleichheitszeichen als Trenner', () => {
    const r = parseChemicalEquation('H2 + Cl2 = 2 HCl');
    expect(r.totalProducts).toBe(1);
    expect(r.products[0].formula).toBe('HCl');
  });

  test('ohne Reaktionspfeil → Fehler mit Hinweis', () => {
    expect(() => parseChemicalEquation('H2 O2 H2O')).toThrow('Reaktionspfeil');
  });

  test('leere Produktseite → Fehler', () => {
    expect(() => parseChemicalEquation('H2 + O2 ->')).toThrow();
  });

  test('Ionen mit Superscript-Ladung bleiben erhalten (Split nur auf "+")', () => {
    // Achtung: „Ag+“ würde am Plus getrennt — Seiten-Split ist "+".
    // Superscript-Zeichen (wie auf der Seite gerendert) überleben dagegen.
    const r = parseChemicalEquation('Ag⁺ + Cl⁻ -> AgCl');
    expect(r.reactants[0].formula).toBe('Ag⁺');
    expect(r.reactants[1].formula).toBe('Cl⁻');
  });
});

// ── UI-Flows (jsdom) ─────────────────────────────────────────────────
const ui = require('../myhugoapp/static/js/calculators/calc-equation-parser.js');
global.showToast = jest.fn();

describe('parseEquation — Wrapper über Eingabefeld', () => {
  beforeEach(() => {
    global.showToast.mockClear();
    Element.prototype.scrollIntoView = jest.fn();
    document.body.innerHTML =
      '<input id="equation-parser-input" /><div id="parsed-coefficients"></div>' +
      '<div id="apply-buttons"></div><div id="parser-result"></div>' +
      '<div id="parsed-reactants"></div><div id="parsed-products"></div>' +
      '<a href="#mol-mol"></a><a href="#masse-masse"></a><div class="calculator-panel"></div><div class="calculator-panel"></div>' +
      '<input id="mol-coeff-r" /><input id="mol-coeff-p" />' +
      '<input id="mass-coeff-r" /><input id="mass-coeff-p" />';
  });

  test('gültige Gleichung rendert Koeffizienten und Apply-Buttons', () => {
    // Buttons erscheinen nur bei exakt 1 Edukt + 1 Produkt
    document.getElementById('equation-parser-input').value = '2 A -> 3 B';
    ui.parseEquation();
    expect(document.getElementById('parsed-coefficients').innerHTML).not.toBe('');
    expect(document.getElementById('apply-buttons').innerHTML).toContain(
      'applyCoefficientsToMolMol'
    );
    expect(document.getElementById('parser-result').style.display).toBe('block');
  });

  test('leere Eingabe → Toast, kein Rendern', () => {
    document.getElementById('equation-parser-input').value = '';
    ui.parseEquation();
    expect(global.showToast).toHaveBeenCalled();
    expect(document.getElementById('parsed-coefficients').innerHTML).toBe('');
  });

  test('ungültige Gleichung → Fehler-Toast', () => {
    document.getElementById('equation-parser-input').value = 'kein pfeil hier';
    ui.parseEquation();
    expect(global.showToast).toHaveBeenCalledWith(expect.stringContaining('Fehler'), 'error');
  });

  test('applyCoefficientsToMolMol schreibt ν in die Eingabefelder + Toast', () => {
    ui.applyCoefficientsToMolMol(2, 3);
    expect(document.getElementById('mol-coeff-r').value).toBe('2');
    expect(document.getElementById('mol-coeff-p').value).toBe('3');
    expect(global.showToast).toHaveBeenCalledWith(expect.stringContaining('2'), 'success');
  });

  test('applyCoefficientsToMassMass schreibt ν in die Massenfelder', () => {
    ui.applyCoefficientsToMassMass(3, 2);
    expect(document.getElementById('mass-coeff-r').value).toBe('3');
    expect(document.getElementById('mass-coeff-p').value).toBe('2');
  });
});
