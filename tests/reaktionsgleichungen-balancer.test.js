/**
 * tests/reaktionsgleichungen-balancer.test.js — Edgecases für den
 * Gleichungs-Ausgleicher (UXF-031/032/033).
 * Quelle: myhugoapp/static/js/reaktionsgleichungen-ausgleichen.js
 * (Dual-Export via module.exports; braucht window.ChemistryUtils)
 */
global.window = {
  ChemistryUtils: require('../myhugoapp/static/js/utils/chemistry-utils.js'),
};
const {
  parseEquation,
  getAllElements,
  solveByBruteForce,
} = require('../myhugoapp/static/js/reaktionsgleichungen-ausgleichen.js');

/** Matrix bauen wie balanceEquation() — Edukte positiv, Produkte negativ. */
function buildMatrix(equation) {
  const { reactants, products } = parseEquation(equation);
  const elements = getAllElements(reactants, products);
  const matrix = [];
  for (const el of elements) {
    const row = [];
    for (const f of reactants) row.push(window.ChemistryUtils.parseFormula(f)[el] || 0);
    for (const f of products) row.push(-(window.ChemistryUtils.parseFormula(f)[el] || 0));
    matrix.push(row);
  }
  return matrix;
}

function balance(equation) {
  return solveByBruteForce(buildMatrix(equation));
}

describe('parseEquation (UXF-031 Pfeile)', () => {
  test('Standard "=" wird gesplittet', () => {
    const { reactants, products } = parseEquation('CH4 + O2 = CO2 + H2O');
    expect(reactants).toEqual(['CH4', 'O2']);
    expect(products).toEqual(['CO2', 'H2O']);
  });

  test('Gleichgewichtspfeil "⇌" wird akzeptiert (UXF-031)', () => {
    const { reactants, products } = parseEquation('N2 + H2 ⇌ NH3');
    expect(reactants.length).toBe(2);
    expect(products).toEqual(['NH3']);
  });

  test('ASCII-Pfeil "->" wird akzeptiert (UXF-031)', () => {
    const { reactants, products } = parseEquation('H2 + O2 -> H2O');
    expect(reactants).toEqual(['H2', 'O2']);
    expect(products).toEqual(['H2O']);
  });

  test('Unicode-Pfeil "→" wird akzeptiert', () => {
    const { products } = parseEquation('H2O → H2 + O2');
    expect(products).toEqual(['H2', 'O2']);
  });

  test('kein Trenner → deutscher Fehler mit Pfeil-Hinweisen', () => {
    expect(() => parseEquation('CH4 + O2 CO2')).toThrow(
      'Ungültiges Format. Verwenden Sie "=", "->" oder "⇌"'
    );
  });

  test('zwei Trenner → Fehler', () => {
    expect(() => parseEquation('H2 = H2 = H2')).toThrow('Ungültiges Format');
  });

  test('leere Edukt-/Produktseite → Fehler', () => {
    expect(() => parseEquation('= H2O')).toThrow('muss Edukte und Produkte enthalten');
    expect(() => parseEquation('H2O =')).toThrow('muss Edukte und Produkte enthalten');
  });

  test('leere Eingabe → Fehler', () => {
    expect(() => parseEquation('')).toThrow('Ungültiges Format');
  });
});

describe('parseEquation (UXF-032 Koeffizienten)', () => {
  test('vorhandene Koeffizienten werden abgelehnt statt ignoriert', () => {
    // Vor dem Fix wurde "2 O2" stillschweigend als O2 geparsed — irreführend!
    expect(() => parseEquation('CH4 + 2 O2 = CO2 + 2 H2O')).toThrow(
      'Bitte keine Koeffizienten angeben'
    );
  });

  test('Koeffizient am Produkt wird ebenfalls abgelehnt', () => {
    expect(() => parseEquation('H2 + O2 = 2 H2O')).toThrow('keine Koeffizienten');
  });

  test('normale Formeln mit Ziffern im Inneren bleiben erlaubt', () => {
    expect(() => parseEquation('C6H12O6 + O2 = CO2 + H2O')).not.toThrow();
  });
});

describe('getAllElements', () => {
  test('vereinigt Elemente aus beiden Seiten ohne Duplikate', () => {
    const elements = getAllElements(['CH4', 'O2'], ['CO2', 'H2O']);
    expect(elements.sort()).toEqual(['C', 'H', 'O']);
  });
});

describe('solveByBruteForce (UXF-033 Komplexität)', () => {
  test('CH4 + O2 = CO2 + H2O → 1,2,1,2', () => {
    expect(balance('CH4 + O2 = CO2 + H2O')).toEqual([1, 2, 1, 2]);
  });

  test('N2 + H2 = NH3 → 1,3,2', () => {
    expect(balance('N2 + H2 = NH3')).toEqual([1, 3, 2]);
  });

  test('C6H12O6 + O2 = CO2 + H2O → 1,6,6,6', () => {
    expect(balance('C6H12O6 + O2 = CO2 + H2O')).toEqual([1, 6, 6, 6]);
  });

  test('bereits ausgeglichene Gleichung → 1,1', () => {
    expect(balance('H2O = H2O')).toEqual([1, 1]);
  });

  test('GCD-Reduktion: 2 H2 + O2-Variante wird auf kleinste Lösung gekürzt', () => {
    // H2 + O2 = H2O2 → 1,1,1 (nicht 2,2,2)
    expect(balance('H2 + O2 = H2O2')).toEqual([1, 1, 1]);
  });

  test('unausgleichbare Gleichung → null statt Endlosschleife', () => {
    // Mn-Element fehlt auf der Produktseite
    expect(balance('MnO2 = H2O')).toBeNull();
  });

  test('Grenze: 7 Stoffe laufen noch, 8+ werden in balanceEquation abgefangen', () => {
    // 7-Stoff-Grenze liegt im Guard von balanceEquation (DOM) — hier
    // prüfen wir, dass der Solver bei einer realen 6-Stoff-Gleichung
    // noch terminiert: KMnO4 + HCl = KCl + MnCl2 + H2O + Cl2
    const coeffs = balance('KMnO4 + HCl = KCl + MnCl2 + H2O + Cl2');
    expect(coeffs).toEqual([2, 16, 2, 2, 8, 5]);
  });
});
