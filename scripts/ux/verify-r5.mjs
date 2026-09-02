/**
 * verify-r5.mjs — TaskFleet-Verifikation für UXF Runde 5
 *  1. node --check auf geänderten JS-Dateien + extrahiertem 404-Script
 *  2. ESLint auf denselben
 *  3. vitest (Regression)
 * Exit 1 bei erstem Fehler.
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const REPO_ROOT = path.resolve(import.meta.dirname, '../..');

const JS_FILES = [
  'myhugoapp/static/js/quiz-ui.js',
  'myhugoapp/static/js/modulhandbuch-index.js',
  'myhugoapp/static/js/search-shortcut.js',
];

const TEST_FILES = ['tests/entity-links.test.js', 'tests/curricula-utils.test.js'];

function run(cmd, label, cwd) {
  try {
    execSync(cmd, { cwd: cwd || REPO_ROOT, stdio: 'pipe', encoding: 'utf-8' });
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

console.log('[verify-r5] 1/3 Syntax-Checks');
for (const f of JS_FILES) {
  ok = run(`node --check ${f}`, f) && ok;
}
// Inline-<script> aus dem 404-Layout extrahieren und prüfen
{
  const p404 = path.join(REPO_ROOT, 'myhugoapp/layouts/404.html');
  const html = fs.readFileSync(p404, 'utf-8');
  const m = html.match(/<script>([\s\S]*?)<\/script>/);
  if (!m) {
    console.error('  ✗ 404.html: kein <script>-Block gefunden');
    ok = false;
  } else {
    const tmp = path.join(os.tmpdir(), 'nf404-check.js');
    fs.writeFileSync(tmp, m[1]);
    ok = run(`node --check ${tmp}`, 'layouts/404.html (inline script)') && ok;
  }
}
// Hugo-Template-Smoke: 404.html wird gerendert?
{
  try {
    execSync('hugo --quiet --destination /tmp/hugo-r5-verify', {
      cwd: path.join(REPO_ROOT, 'myhugoapp'),
      stdio: 'pipe',
    });
    const built = fs.existsSync('/tmp/hugo-r5-verify/404.html');
    console.log(built ? '  ✓ Hugo rendert 404.html' : '  ✗ Hugo rendert KEIN 404.html');
    ok = ok && built;
  } catch {
    console.error('  ✗ Hugo-Build fehlgeschlagen');
    ok = false;
  }
}

console.log('[verify-r5] 2/3 ESLint');
for (const f of JS_FILES) {
  ok = run(`npx eslint ${f}`, `eslint ${f}`) && ok;
}

console.log('[verify-r5] 3/3 Tests');
for (const t of TEST_FILES) {
  ok = run(`npx vitest run ${t}`, `vitest ${t}`) && ok;
}

if (!ok) {
  console.error('[verify-r5] FEHLGESCHLAGEN');
  process.exit(1);
}
console.log('[verify-r5] ✓ alle Checks bestanden');
