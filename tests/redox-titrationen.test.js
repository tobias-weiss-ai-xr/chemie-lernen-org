/**
 * Regression tests for redox-titrationen.js titration curve generation.
 *
 * Two real bugs were fixed here:
 * 1. Loop bound used `analyteVolume * N` instead of the equivalence
 *    volume — curves were cut off before the equivalence point whenever
 *    the titrant was more dilute than the analyte (e.g. 0.001 M Ce4+
 *    against 25 mL 0.01 M analyte: equiv = 250 mL, loop stopped at 50 mL).
 * 2. simulatePotentiometricTitration compared `totalVol` (analyte +
 *    titrant volume) against `equivVolume` (titrant volume) — a unit
 *    mismatch that made the pre-equivalence branch unreachable.
 */

const fs = require('fs');
const path = require('path');

const SRC = fs.readFileSync(
  path.join(__dirname, '..', 'myhugoapp', 'static', 'js', 'redox-titrationen.js'),
  'utf8'
);

function loadModule(mocks) {
  const captured = {};
  // Evaluate the plain script source inside a Function scope. The source is a
  // browser-global script (no import/export), so this is safe. Its functions
  // resolve document + plot fns from the injected parameters.
  // eslint-disable-next-line sonarjs/code-eval -- intentional: eval browser-global script source in a sandboxed Function scope
  const fn = new Function(
    'document',
    'showToast',
    '_plotPermanganat',
    '_plotCer',
    '_plotPotential',
    SRC +
      '\n;plotPermanganatChart = _plotPermanganat;' +
      '\n;plotCerChart = _plotCer;' +
      '\n;plotPotentialChart = _plotPotential;' +
      '\n;return { simulatePermanganatTitration, simulateCerS4Titration, simulatePotentiometricTitration };'
  );
  // eslint-disable-next-line sonarjs/code-eval -- intentional: build the evaluated source from a fixed file, not user input
  const funcs = fn(
    mocks.document,
    mocks.showToast || function () {},
    function (points, equiv) {
      captured.permanganat = { points, equiv };
    },
    function (points, equiv) {
      captured.cer = { points, equiv };
    },
    function (points, equiv) {
      captured.potentiometric = { points, equiv };
    }
  );
  return { captured, funcs };
}

function makeDocument(values) {
  const els = {};
  for (const [id, value] of Object.entries(values)) {
    els[id] = { value: String(value) };
  }
  return {
    getElementById: (id) => {
      if (els[id]) return els[id];
      // Generic stub for result/display elements
      const stub = {
        value: '',
        style: { display: '' },
        textContent: '',
        innerHTML: '',
        setAttribute: () => {},
      };
      els[id] = stub;
      return stub;
    },
  };
}

describe('redox-titrationen.js titration curves', () => {
  test('permanganat: curve extends to 2x equivalence volume even for dilute titrant', () => {
    // Analyte 0.1 M x 50 mL oxalate (n=2), KMnO4 0.002 M (n=5) -> equiv = 1000 mL
    const doc = makeDocument({
      'permanganat-analyte-conc': 0.1,
      'permanganat-analyte-volume': 50,
      'permanganat-titrant-conc': 0.002,
      'permanganat-stepsize': 20,
      'permanganat-target-analyte': 'oxalate',
    });
    const { captured, funcs } = loadModule({ document: doc });
    funcs.simulatePermanganatTitration();

    expect(captured.permanganat).toBeDefined();
    const xs = captured.permanganat.points.map((p) => p.x);
    const maxX = Math.max(...xs);
    // Curve must reach beyond equivalence (1000 mL) — the old bound was 150 mL
    expect(maxX).toBeGreaterThan(1000);
    expect(maxX).toBeLessThanOrEqual(2000); // 2x equiv = 2000 mL
  });

  test('cer: curve reaches the equivalence point with 0.001 M titrant', () => {
    // 25 mL 0.01 M analyte, Ce4+ 0.001 M -> equiv = 250 mL
    const doc = makeDocument({
      'cers4-analyte-conc': 0.01,
      'cers4-analyte-volume': 25,
      'cers4-strength': '0.001',
      'cers4-stepsize': 5,
    });
    const { captured, funcs } = loadModule({ document: doc });
    funcs.simulateCerS4Titration();

    expect(captured.cer).toBeDefined();
    expect(captured.cer.equiv).toBeCloseTo(250, 5);
    const xs = captured.cer.points.map((p) => p.x);
    expect(Math.max(...xs)).toBeGreaterThan(250);
  });

  test('potentiometric: pre-equivalence branch is reachable (region logic)', () => {
    // 25 mL 0.01 M analyte, 0.01 M titrant -> equiv = 25 mL
    const doc = makeDocument({
      'potentiometry-analyte-conc': 0.01,
      'potentiometry-analyte-volume': 25,
      'potentiometry-titrant-conc': 0.01,
      'potentiometry-stepsize': 0.5,
      'potentiometry-redox-pair': 'fe2+',
    });
    const { captured, funcs } = loadModule({ document: doc });
    funcs.simulatePotentiometricTitration();

    expect(captured.potentiometric).toBeDefined();
    expect(captured.potentiometric.equiv).toBeCloseTo(25, 5);
    const points = captured.potentiometric.points;
    // Points exist before AND after the equivalence volume
    const before = points.filter((p) => p.x > 0 && p.x < 25);
    const after = points.filter((p) => p.x > 25);
    expect(before.length).toBeGreaterThan(0);
    expect(after.length).toBeGreaterThan(0);
    // Curve reaches beyond equivalence (old bound was 75 mL = 3x analyte; now 2x equiv = 50)
    expect(Math.max(...points.map((p) => p.x))).toBeLessThanOrEqual(50);
  });
});
