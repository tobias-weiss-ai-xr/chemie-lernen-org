/**
 * Verify UXF-043: Dropdown statt Card-Grid
 */
import { readFileSync } from 'fs';
import { resolve } from 'path';

const REPO = process.cwd();
const HTML_FILE = resolve(REPO, 'myhugoapp/layouts/_default/curricula-index.html');

let ok = true;
const html = readFileSync(HTML_FILE, 'utf-8');

// 1. Dropdown exists
if (!html.includes('id="state-select"')) {
  console.log('  ✗ Dropdown select fehlt'); ok = false;
} else {
  console.log('  ✅ Dropdown-Element vorhanden');
}

// 2. onchange Navigation
if (!html.includes("onchange=\"if(this.value)location.href='/curricula/'")) {
  console.log('  ✗ onchange-Navigation fehlt'); ok = false;
} else {
  console.log('  ✅ onchange-Navigation vorhanden');
}

// 3. Alle 16 Bundesländer als Options
const expected = ['bw','by','be','bb','hb','hh','he','mv','ni','nw','rp','sl','sn','st','sh','th'];
for (const code of expected) {
  if (!html.includes(`value="${code}"`)) {
    console.log(`  ✗ Option ${code} fehlt`); ok = false;
  }
}
if (ok) console.log('  ✅ Alle 16 Bundesländer als Options');

// 4. CSS für Dropdown
if (!html.includes('bundesland-dropdown') || !html.includes('bundesland-dropdown select')) {
  console.log('  ✗ Dropdown-CSS fehlt'); ok = false;
} else {
  console.log('  ✅ Dropdown-CSS vorhanden');
}

console.log(`\n[verify-lehrplan-dropdown] ${ok ? '✅ PASS' : '❌ FAIL'}`);
process.exit(ok ? 0 : 1);
