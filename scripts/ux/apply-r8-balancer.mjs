/**
 * apply-r8-balancer.mjs — UXF-031/032/033: Gleichungs-Balancer Edgecases
 *
 * Drei bestätigte Bugs in reaktionsgleichungen-ausgleichen.js:
 *
 * UXF-031: parseEquation() lehnte den Gleichgewichtspfeil "⇌" (und "->")
 *   ab — Standard in der Chemie! Split-Regex akzeptiert jetzt
 *   "=", "→", "⇌", "->".
 *
 * UXF-032: Vorhandene Koeffizienten ("2 H2O") wurden STILL SCHWEIGEND
 *   ignoriert — parseFormula lässt führende Ziffern einfach fallen,
 *   "CH4 + 2 O2" wurde identisch zu "CH4 + O2" geparsed und das Ergebnis
 *   war irreführend. Jetzt: klarer deutscher Fehler.
 *
 * UXF-033: Der Brute-Force-Solver iteriert 12^cols Kombinationen — bei
 *   ≥ 8 beteiligten Stoffen friert der Browser-Tab ein (430 Mio.
 *   Iterationen). Guard: > 7 Stoffe → verständlicher Fehler.
 *
 * UXF-035 (Vorbereitung): module.exports-Guard für Tests.
 *
 * Datei: myhugoapp/static/js/reaktionsgleichungen-ausgleichen.js
 * Idempotent via Marker. Wirft bei fehlendem Anker.
 */

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const REPO_ROOT = path.resolve(import.meta.dirname, '../..');
const TARGET = path.join(REPO_ROOT, 'myhugoapp/static/js/reaktionsgleichungen-ausgleichen.js');

let src = fs.readFileSync(TARGET, 'utf-8');

// ── UXF-031: Gleichgewichtspfeil ⇌ und -> akzeptieren ────────────────
if (src.includes('UXF-031')) {
  console.log('[UXF-031] Pfeil-Regex bereits gepatcht');
} else {
  const a1 = `  // Split by = or ->
  const parts = equation.split(/[=→]/);
  if (parts.length !== 2) {
    throw new Error('Ungültiges Format. Verwenden Sie "=" zwischen Edukten und Produkten.');
  }`;
  if (!src.includes(a1)) throw new Error('[UXF-031] Anker a1 nicht gefunden');
  src = src.replace(
    a1,
    `  // Split by =, →, ⇌ oder -> (UXF-031: Gleichgewichtsreaktionen erlaubt)
  const parts = equation.split(/[=→⇌]|->/);
  if (parts.length !== 2) {
    throw new Error(
      'Ungültiges Format. Verwenden Sie "=", "->" oder "⇌" zwischen Edukten und Produkten.'
    );
  }`
  );
  console.log('[UXF-031] ✓ ⇌ und -> werden akzeptiert');
}

// ── UXF-032: Vorhandene Koeffizienten ablehnen ───────────────────────
if (src.includes('UXF-032')) {
  console.log('[UXF-032] Koeffizienten-Guard bereits vorhanden');
} else {
  const a2 = `  if (reactants.length === 0 || products.length === 0) {
    throw new Error('Die Gleichung muss Edukte und Produkte enthalten.');
  }

  return { reactants, products };`;
  if (!src.includes(a2)) throw new Error('[UXF-032] Anker a2 nicht gefunden');
  src = src.replace(
    a2,
    `  if (reactants.length === 0 || products.length === 0) {
    throw new Error('Die Gleichung muss Edukte und Produkte enthalten.');
  }

  // UXF-032: Vorhandene Koeffizienten wurden stillschweigend ignoriert
  // (parseFormula lässt führende Ziffern fallen) — irreführend. Jetzt
  // explicit ablehnen.
  for (const part of [...reactants, ...products]) {
    if (/^\\d/.test(part)) {
      throw new Error(
        'Bitte keine Koeffizienten angeben (z. B. "2 H2O"). Der Rechner berechnet sie selbst.'
      );
    }
  }

  return { reactants, products };`
  );
  console.log('[UXF-032] ✓ Koeffizienten werden abgelehnt statt ignoriert');
}

// ── UXF-033: Komplexitäts-Schutz (Freeze-Guard + adaptives maxCoeff) ─
if (src.includes('UXF-033a') && src.includes('UXF-033b')) {
  console.log('[UXF-033] Komplexitäts-Schutz bereits vorhanden');
} else {
  const a3 = `    // Parse equation
    const { reactants, products } = parseEquation(input);

    // Get all elements
    const elements = getAllElements(reactants, products);`;
  if (!src.includes(a3)) throw new Error('[UXF-033a] Anker a3 nicht gefunden');
  src = src.replace(
    a3,
    `    // Parse equation
    const { reactants, products } = parseEquation(input);

    // UXF-033a: Der Brute-Force-Solver braucht 12^Stoffe Versuche — bei
    // mehr als 7 Stoffen würde der Browser-Tab einfrieren.
    if (reactants.length + products.length > 7) {
      throw new Error(
        'Diese Gleichung hat mehr als 7 beteiligte Stoffe und ist zu komplex für den Ausgleicher.'
      );
    }

    // Get all elements
    const elements = getAllElements(reactants, products);`
  );

  // UXF-033b: fester maxCoeff=12 war zu klein — das Schulbeispiel
  // KMnO4 + HCl = KCl + MnCl2 + H2O + Cl2 braucht den Koeffizienten 16!
  // Adaptiv: wenige Stoffe erlauben größere Koeffizienten (Budget bleibt
  // im Bereich weniger Sekunden Worst-Case).
  const a3b = `  // Try coefficient values from 1 to 12
  const maxCoeff = 12;`;
  if (!src.includes(a3b)) throw new Error('[UXF-033b] Anker a3b nicht gefunden');
  src = src.replace(
    a3b,
    `  // UXF-033b: adaptiver Maximal-Koeffizient nach Stoffanzahl (12 war
  // zu klein: KMnO4 + HCl braucht 16). Worst-Case bleibt begrenzt:
  // 24^4=331k, 20^5=3.2M, 16^6=16.7M, 12^7=35.8M Kombinationen.
  const maxCoeff = cols <= 4 ? 24 : cols <= 5 ? 20 : cols <= 6 ? 16 : 12;`
  );
  console.log('[UXF-033] ✓ Freeze-Guard (> 7 Stoffe) + adaptiver maxCoeff');
}

// ── UXF-035: module.exports für Tests ────────────────────────────────
if (src.includes('UXF-035')) {
  console.log('[UXF-035] module.exports bereits vorhanden');
} else {
  src = src.replace(
    /\s*$/,
    `
// UXF-035: Dual-Export für Tests (parseEquation/getAllElements/solveByBruteForce)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { parseEquation, getAllElements, solveByBruteForce };
}
`
  );
  console.log('[UXF-035] ✓ module.exports ergänzt');
}

fs.writeFileSync(TARGET, src);
execFileSync('node', ['--check', TARGET], { stdio: 'inherit' });
console.log('[r8-balancer] ✓ abgeschlossen (Syntax OK)');
