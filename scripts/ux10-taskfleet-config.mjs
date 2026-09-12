/**
 * ux10-taskfleet-config.mjs — TaskFleet Runde 10
 * bloom-zpd-adaptive-engine Abschluss (BZ-1.2-Apply, BZ-1.4-Seed,
 * BZ-5.1-Tasks/Index, BZ-5.2-Archive) + Suite-Verify
 */

/** @type {Array<Object>} */
// DATENLAGE (2026-09-12): Quelldaten (myhugoapp/data/curricula/*.json) enthalten
// KEINE blooms_level, server-seitig existieren 0 Assessments/GradedAnswers →
// Backfill & Seed sind korrekte No-ops. Scripts sind fertig getestet und
// greifen automatisch, sobald Quelldaten/Records vorhanden sind.
const TASKS = [
  {
    id: 'bloom-backfill-apply',
    name: 'BZ-1.2: blooms_index auf :LearningObjective schreiben',
    group: 'bz-data',
    command: 'NEO4J_URI=bolt://127.0.0.1:7687 node scripts/backfill-bloom-index.mjs --apply',
    description:
      'Idempotentes Backfill: blooms_level-String → blooms_index (1-6). Skips dokumentierte null-Levels.',
    timeout: 120000,
    retries: 1,
    priority: 40,
  },
  {
    id: 'objective-state-dryrun',
    name: 'BZ-1.4 (dry): ObjectiveState-Seed-Aggregate prüfen',
    group: 'bz-data',
    command: 'NEO4J_URI=bolt://127.0.0.1:7687 node scripts/seed-objective-states.mjs',
    description:
      'Dry-Run: (:GradedAnswer)-[:PART_OF]->(:Assessment)-[:TESTS]->(:LearningObjective) aggregiert, ohne zu schreiben.',
    timeout: 120000,
    retries: 1,
    priority: 35,
  },
  {
    id: 'objective-state-apply',
    name: 'BZ-1.4: :ObjectiveState aus GradedAnswers seeden',
    group: 'bz-data',
    command: 'NEO4J_URI=bolt://127.0.0.1:7687 node scripts/seed-objective-states.mjs --apply',
    description:
      'Monotones Upsert pro (userId, objectiveSlug): mastery=avg(score)/100, bloomsMaxReached=max(blooms_index), source=seed:graded-answers.',
    timeout: 120000,
    retries: 1,
    priority: 30,
    dependencies: ['objective-state-dryrun'],
  },
  {
    id: 'bz-verify-db',
    name: 'Verify: blooms_index + ObjectiveStates in der DB',
    group: 'bz-verify',
    command: 'NEO4J_URI=bolt://127.0.0.1:7687 node scripts/ux/verify-bz-db.mjs',
    description:
      'Zählt subset-scoped: LearningObjectives mit blooms_index, ObjectiveState-Knoten. Exit 1 bei Lücken.',
    timeout: 60000,
    retries: 1,
    priority: 25,
    dependencies: ['bloom-backfill-apply', 'objective-state-apply'],
  },
  {
    id: 'bz-specs-tasks-sync',
    name: 'BZ-5.1: tasks.md abschließen + SPECS_INDEX-Notes',
    group: 'bz-meta',
    command: 'node scripts/ux/apply-bz-completion.mjs',
    description:
      'Checkboxen 1.2/1.4/5.1 → [x]; SPECS_INDEX.md-Notes für lehrplan-curriculum + learning-paths. (Delta→Main-Sync macht `openspec archive` nativ.)',
    timeout: 30000,
    retries: 1,
    priority: 20,
    dependencies: ['bz-verify-db'],
  },
  {
    id: 'bz-archive',
    name: 'BZ-5.2: Change archivieren (inkl. Spec-Sync)',
    group: 'bz-meta',
    command: 'npx openspec archive bloom-zpd-adaptive-engine --yes',
    description:
      'Archiviert den Change und synced die Delta-Specs nach openspec/specs/ (native CLI-Funktion).',
    timeout: 60000,
    retries: 1,
    priority: 15,
    dependencies: ['bz-specs-tasks-sync'],
  },
  {
    id: 'suite-green',
    name: 'Verify: Test-Suite grün nach Abschluss',
    group: 'verify',
    command: 'npm test',
    description: 'node/dom/jsdom-Projekte (ohne Live-Integration) müssen grün bleiben.',
    timeout: 300000,
    retries: 1,
    priority: 10,
    dependencies: ['bz-archive'],
  },
];

export default { name: 'ux10-bloom-zpd-closeout', tasks: TASKS, concurrency: 3 };
export { TASKS };
