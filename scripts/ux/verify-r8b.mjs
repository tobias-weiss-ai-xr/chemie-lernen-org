/**
 * verify-r8b.mjs — Verifikation Runde 8b (Labor black-plane Hotfix)
 *  1. Syntax + ESLint (lab-engine.js, Tests, Apply-Script)
 *  2. Labor-Test-Suite (7 TDD-Tests)
 *  3. Voll-Suite (test:unit)
 *  4. Hugo-Build
 */

import { execSync } from 'node:child_process';
import path from 'node:path';

const REPO_ROOT = path.resolve(import.meta.dirname, '../..');
let ok = true;

function run(cmd, label, cwd) {
  try {
    execSync(cmd, { cwd: cwd || REPO_ROOT, stdio: 'pipe', encoding: 'utf-8' });
    console.log(`  ✓ ${label}`);
    return true;
  } catch (err) {
    console.error(`  ✗ ${label}`);
    console.error(String(err.stdout || '').slice(0, 600));
    console.error(String(err.stderr || '').slice(0, 600));
    return false;
  }
}

console.log('[verify-r8b] 1/4 Syntax + ESLint');
const LAB = 'myhugoapp/static/js/virtual-lab/lab-engine.js';
ok = run(`node --check ${LAB}`, LAB) && ok;
ok = run(`npx eslint ${LAB}`, `eslint ${LAB}`) && ok;
ok = run('npx eslint tests/virtual-lab-lab-engine.test.js', 'eslint Labor-Tests') && ok;

console.log('[verify-r8b] 2/4 Labor-Test-Suite (TDD)');
ok = run('npx vitest run tests/virtual-lab-lab-engine.test.js', '7 Labor-Tests') && ok;

console.log('[verify-r8b] 3/4 Voll-Suite');
ok = run('npm run test:unit', 'Voll-Suite (test:unit)') && ok;

console.log('[verify-r8b] 4/4 Hugo');
ok =
  run('hugo --quiet --destination /tmp/hugo-r8b-verify', 'Hugo-Build', path.join(REPO_ROOT, 'myhugoapp')) &&
  ok;

if (!ok) {
  console.error('[verify-r8b] FEHLGESCHLAGEN');
  process.exit(1);
}
console.log('[verify-r8b] ✓ alle Checks bestanden');
