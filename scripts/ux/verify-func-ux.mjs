/**
 * verify-func-ux.mjs — TaskFleet-Verifikation für UXF Runde 2
 *
 * Prüft nach allen Apply-Tasks:
 *  1. node --check (Syntax) auf allen geänderten/neuen JS-Dateien
 *  2. ESLint auf den geänderten Dateien
 *  3. vitest auf den neuen Test-Dateien
 * Exit 1 bei erstem Fehler.
 */

import { execSync } from 'node:child_process';
import path from 'node:path';

const REPO_ROOT = path.resolve(import.meta.dirname, '../..');

const JS_FILES = [
  'myhugoapp/static/js/utils/curricula-utils.js',
  'myhugoapp/static/js/curricula-topic-search.js',
  'myhugoapp/static/js/curricula-overview.js',
  'myhugoapp/static/js/curricula-state.js',
  'myhugoapp/static/js/curricula-index.js',
];

const TEST_FILES = ['tests/curricula-utils.test.js'];

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

console.log('[verify] 1/3 Syntax-Checks (node --check)');
for (const f of JS_FILES) {
  ok = run(`node --check ${f}`, f) && ok;
}

console.log('[verify] 2/3 ESLint');
for (const f of JS_FILES) {
  ok = run(`npx eslint ${f}`, `eslint ${f}`) && ok;
}

console.log('[verify] 3/3 Tests');
for (const t of TEST_FILES) {
  ok = run(`npx vitest run ${t}`, `vitest ${t}`) && ok;
}

if (!ok) {
  console.error('[verify] FEHLGESCHLAGEN');
  process.exit(1);
}
console.log('[verify] ✓ alle Checks bestanden');
