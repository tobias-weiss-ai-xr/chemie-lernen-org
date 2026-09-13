/**
 * ux14-taskfleet-config.mjs — TaskFleet Runde 14
 * UXF-051..054: „Was ist Chemie?"-Feedback des Users:
 *  - UXF-051 Video war 100vw (1440px) → Textbreite
 *  - UXF-052 Tabelle gequetscht (483px) → volle Textbreite
 *  - UXF-053 Schwierigkeits-Badge transparent im Light (weiß auf beige,
 *    1.12:1) → Selektor-Fix .label-difficulty.label-<schwierigkeit>
 *  - UXF-054 Video-Caption/zigs-Metatexte im Dark unlesbar → Overrides
 */

/** @type {Array<Object>} */
const TASKS = [
  {
    id: 'thema-fixes',
    name: 'UXF-051..054: Video/Tabelle/Badge/Caption-Fixes anwenden',
    group: 'fix-ux14',
    command: 'node scripts/ux/apply-uxf-051-to-054-thema-fixes.mjs',
    description:
      'custom.css (Video, Tabelle, Caption, zigs), dark-mode.css (Caption-Override), single.html (Badge-Selektoren).',
    timeout: 30000,
    retries: 1,
    priority: 30,
  },
  {
    id: 'verify-guards',
    name: 'Verify: UXF-051..054 Guard-Tests',
    group: 'verify-ux14',
    command: 'npx vitest run tests/thema-content-uxf051.test.js',
    description:
      'Breakout weg, Tabelle 100%, Badge-Selektoren korrekt, Caption-Kontrast beider Themes.',
    timeout: 120000,
    retries: 1,
    priority: 20,
    dependencies: ['thema-fixes'],
  },
  {
    id: 'verify-hugo',
    name: 'Verify: Hugo-Build mit Fixes',
    group: 'verify-ux14',
    command:
      'hugo --source myhugoapp --destination /tmp/hugo-ux14-verify --quiet && rm -rf /tmp/hugo-ux14-verify',
    description: 'Ein echter Hugo-Build (gleiche Prüfung wie der Pre-Push-Hook).',
    timeout: 120000,
    retries: 1,
    priority: 20,
    dependencies: ['thema-fixes'],
  },
  {
    id: 'suite-green',
    name: 'Verify: Test-Suite grün',
    group: 'verify',
    command: 'npm test',
    description: 'node/dom/jsdom-Projekte inkl. der neuen Guards müssen grün bleiben.',
    timeout: 300000,
    retries: 1,
    priority: 10,
    dependencies: ['verify-guards', 'verify-hugo'],
  },
];

export default { name: 'ux14-thema-content-fixes', tasks: TASKS, concurrency: 3 };
export { TASKS };
