/**
 * verify-r7.mjs — TaskFleet-Verifikation für UXF Runde 7
 *  1. Syntax-Checks (geänderte Quellen)
 *  2. ESLint (Quellen + neue Tests)
 *  3. formatFormula-XSS-Regression (beide Kopien)
 *  4. Neue Testsuiten + Voll-Suite
 *  5. Hugo-Build
 */

import { execSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
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
    console.error(String(err.stdout || '').slice(0, 800));
    console.error(String(err.stderr || '').slice(0, 800));
    return false;
  }
}

console.log('[verify-r7] 1/5 Syntax-Checks');
const SOURCES = [
  'myhugoapp/static/js/utils/chemistry-utils.js',
  'myhugoapp/static/js/reaktionsgleichungen-ausgleichen.js',
  'myhugoapp/static/js/chemistry-calculator-framework.js',
  'myhugoapp/static/js/quiz-ui.js',
];
for (const f of SOURCES) ok = run(`node --check ${f}`, f) && ok;

console.log('[verify-r7] 2/5 ESLint');
for (const f of SOURCES) ok = run(`npx eslint ${f}`, `eslint ${f}`) && ok;
ok = run('npx eslint tests/chemistry-calculator-framework.test.js tests/lazy-loader.test.js tests/quiz-ui.test.js', 'eslint neue Tests') && ok;

console.log('[verify-r7] 3/5 formatFormula-XSS-Regression');
{
  const probe = `
const cu = require('./myhugoapp/static/js/utils/chemistry-utils.js');
const payloads = ['<img src=x onerror=alert(1)>', 'H<svg onload=alert(1)>2', 'H2O<script>x</script>', '" onmouseover="x', "H2O' onclick='y"];
let bad = 0;
for (const p of payloads) {
  const out = cu.formatFormula(p).replace(/<\\/?sub>/g, '');
  if (out.includes('<') || out.includes('"') || out.includes("'")) bad++;
}
if (bad) { console.error(bad + ' Payloads nicht neutralisiert'); process.exit(1); }
console.log('alle ' + payloads.length + ' Payloads neutralisiert (utils)');
`;
  // spawnSync ohne Shell (node -e via Shell zerstört \n-Escapes)
  const probeRes = spawnSync(process.execPath, ['-e', probe], {
    cwd: REPO_ROOT,
    encoding: 'utf-8',
  });
  if (probeRes.status === 0) {
    console.log('  ✓ chemistry-utils.js formatFormula (5 Payloads)');
  } else {
    console.error('  ✗ utils-Payloads:', String(probeRes.stderr).slice(0, 300));
    ok = false;
  }

  // Lokale Kopie in reaktionsgleichungen: Quell-Muster
  const reaktion = fs.readFileSync(
    path.join(REPO_ROOT, 'myhugoapp/static/js/reaktionsgleichungen-ausgleichen.js'),
    'utf-8'
  );
  if (reaktion.includes("'&#39;'") && reaktion.includes('UXF-029')) {
    console.log('  ✓ reaktionsgleichungen-ausgleichen.js lokale Kopie escaped');
  } else {
    console.error('  ✗ lokale formatFormula-Kopie nicht escaped');
    ok = false;
  }
}

console.log('[verify-r7] 4/5 Tests');
ok = run('npx vitest run tests/chemistry-utils.test.js tests/chemistry-calculator-framework.test.js tests/lazy-loader.test.js tests/quiz-ui.test.js', 'neue + XSS-Testsuiten') && ok;
ok = run('npm run test:unit', 'Voll-Suite (test:unit)') && ok;

console.log('[verify-r7] 5/5 Hugo');
ok = run('hugo --quiet --destination /tmp/hugo-r7-verify', 'Hugo-Build', path.join(REPO_ROOT, 'myhugoapp')) && ok;

if (!ok) {
  console.error('[verify-r7] FEHLGESCHLAGEN');
  process.exit(1);
}
console.log('[verify-r7] ✓ alle Checks bestanden');
