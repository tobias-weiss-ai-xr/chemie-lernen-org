/**
 * verify-r3.mjs — TaskFleet-Verifikation für UXF Runde 3
 *
 *  1. node --check (Syntax) auf allen geänderten/neuen JS-Dateien
 *  2. ESLint auf den geänderten Dateien
 *  3. vitest auf entity-links + curricula-utils Tests
 *  4. Hugo-Build-Smoke (nur lokal sinnvoll — im CI separat)
 * Exit 1 bei erstem Fehler.
 */

import { execSync } from 'node:child_process';
import path from 'node:path';

const REPO_ROOT = path.resolve(import.meta.dirname, '../..');

const JS_FILES = [
  'api/routes/modulhandbuch.js',
  'myhugoapp/static/js/utils/curricula-utils.js',
  'myhugoapp/static/js/utils/entity-links.js',
  'myhugoapp/static/js/curricula-topic-search.js',
  'myhugoapp/static/js/curricula-overview.js',
  'myhugoapp/static/js/curricula-state.js',
  'myhugoapp/static/js/modulhandbuch-index.js',
  'scripts/generate-entity-slug-manifest.mjs',
];

const TEST_FILES = ['tests/entity-links.test.js', 'tests/curricula-utils.test.js'];

function run(cmd, label) {
  try {
    execSync(cmd, { cwd: REPO_ROOT, stdio: 'pipe', encoding: 'utf-8' });
    console.log(`  ✓ ${label}`);
    return true;
  } catch (err) {
    console.error(`  ✗ ${label}`);
    console.error(err.stdout || '');
    console.error(err.stderr || '');
    return false;
  }
}

let ok = true;

console.log('[verify-r3] 1/3 Syntax-Checks (node --check)');
for (const f of JS_FILES) {
  ok = run(`node --check ${f}`, f) && ok;
}

console.log('[verify-r3] 2/3 ESLint');
for (const f of JS_FILES) {
  ok = run(`npx eslint ${f}`, `eslint ${f}`) && ok;
}

console.log('[verify-r3] 3/3 Tests');
for (const t of TEST_FILES) {
  ok = run(`npx vitest run ${t}`, `vitest ${t}`) && ok;
}

if (!ok) {
  console.error('[verify-r3] FEHLGESCHLAGEN');
  process.exit(1);
}
console.log('[verify-r3] ✓ alle Checks bestanden');
