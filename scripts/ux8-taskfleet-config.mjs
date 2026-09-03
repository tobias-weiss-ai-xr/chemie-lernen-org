/**
 * ux8-taskfleet-config.mjs — TaskFleet-Konfiguration für UXF Runde 8
 * (Gleichungs-Balancer Edgecases + API-500-Härtung)
 *
 *   UXF-031  parseEquation lehnte ⇌ und "->" ab (Standard-Pfeile der
 *            Chemie!) — Split-Regex akzeptiert jetzt =, →, ⇌, ->
 *   UXF-032  Vorhandene Koeffizienten ("2 H2O") wurden stillschweigend
 *            ignoriert (parseFormula lässt führende Ziffern fallen) —
 *            jetzt klarer deutscher Fehler
 *   UXF-033  Brute-Force-Solver: (a) Freeze-Guard bei > 7 Stoffen
 *            (12^8 = 430M Iterationen = eingefrorener Tab),
 *            (b) adaptiver maxCoeff — 12 war zu klein, das Schulbeispiel
 *            KMnO4 + HCl braucht den Koeffizienten 16
 *   UXF-034  Express-Array-Param-Crash: ?state=a&state=b macht Arrays,
 *            .trim()/.toLowerCase() darauf → TypeError → 500. qs()-Helfer
 *            in 5 Route-Dateien, 20 Stellen gehärtet
 *   UXF-035  Test-Suite: 19 Edgecase-Tests für den Balancer
 *            (Pfeile, Koeffizienten, GCD-Reduktion, KMnO4-Matrix)
 */

/** @type {Array<Object>} */
const TASKS = [
  {
    id: 'r8-balancer',
    name: 'UXF-031/032/033/035: Balancer-Pfeile, Koeffizienten, Freeze-Guard, maxCoeff',
    group: 'fix-ux8',
    command: 'node scripts/ux/apply-r8-balancer.mjs',
    description:
      'reaktionsgleichungen-ausgleichen.js: ⇌/-> akzeptieren, Koeffizienten ablehnen, >7-Stoffe-Guard, adaptiver maxCoeff (16 für KMnO4), Dual-Export',
    timeout: 60000,
    retries: 1,
    priority: 30,
  },
  {
    id: 'r8-api-params',
    name: 'UXF-034: API-Array-Param-Crash (?x=a&x=b → 500) härten',
    group: 'fix-ux8',
    command: 'node scripts/ux/apply-r8-api-params.mjs',
    description:
      'qs()-Helfer in curricula/modulhandbuch/content/kg-data/learning-paths, 20 (req.query.x || \'\')-Stellen',
    timeout: 60000,
    retries: 1,
    priority: 25,
  },
  {
    id: 'r8-verify',
    name: 'Verifikation Runde 8: qs()-Matrix, Balancer-Suite, Voll-Suite, Lint, Hugo',
    group: 'verify8',
    command: 'node scripts/ux/verify-r8.mjs',
    description: 'Quell-Assertionen + qs()-Verhaltensmatrix + 19 Balancer-Tests + Voll-Suite',
    timeout: 300000,
    retries: 1,
    priority: 10,
    dependencies: ['r8-balancer', 'r8-api-params'],
  },
];

export default TASKS;
export { TASKS };
