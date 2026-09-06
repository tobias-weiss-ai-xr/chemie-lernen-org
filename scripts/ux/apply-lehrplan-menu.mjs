/**
 * UXF-Fix: Lehrpläne Bundesländer aus dem Menu entfernen
 * Alle 16 Bundesland-Lehrplan-Seiten haben menu-Einträge mit parent: 'lehrende'.
 * Stattdessen: ein zentraler Menu-Eintrag „Lehrpläne & Curricula“ → /curricula/
 *   mit aggregierter Card-Grid-Darstellung.
 * WHO: mem_mtg62fvo_mtkzing
 * RUN: node scripts/ux/apply-lehrplan-menu.mjs
 */
import { readFileSync, writeFileSync } from 'fs';
import { resolve, basename, dirname } from 'path';

const REPO = process.cwd();
const STATES_DIR = resolve(REPO, 'myhugoapp/content/curricula');

// alle Bundesland-Verzeichnisse (ohne _index.md und bundeslaender.md)
const STATES = [
  'bb', 'be', 'bw', 'by', 'hb', 'he', 'hh', 'mv',
  'ni', 'nw', 'rp', 'sh', 'sl', 'sn', 'st', 'th'
];

const DRY = process.argv.includes('--dry-run');

console.log('[apply-lehrplan-menu] ⏳ Bundsland-Menu-Einträge entfernen\n');

for (const state of STATES) {
  const path = resolve(STATES_DIR, state, '_index.md');
  let src = readFileSync(path, 'utf-8');
  
  const oldBlock = `menu:
  main:
    parent: 'lehrende'
    weight: 110`;
  const oldYamlBlock = `menu:
  main:
    parent: "lehrende"
    weight: 110`;
  
  if (src.includes(oldBlock)) {
    src = src.replace(oldBlock, '');
  } else if (src.includes(oldYamlBlock)) {
    src = src.replace(oldYamlBlock, '');
  } else {
    // Sch SH quote BWV
    const oldSingle = `menu:\n  main:\n    parent: "lehrende"\n    weight: 110`;
    const oldSingle2 = `menu:\n  main:\n    parent: 'lehrende'\n    weight: 110`;
    if (!src.includes('parent:') || !src.includes('lehrende')) {
      console.warn(`[WARN] ${state}: kein Menu-Eintrag zum Entfernen gefunden.`);
      continue;
    }
    //gewalt befreion mit regex
    src = src.replace(/menu:\s*\n(\s+main:\s*\n(\s+parent:\s*(['"])lehrende\3\s*\n\s+weight:\s*110\s*\n))/gi, '');
  }

  if (!DRY) {
    writeFileSync(path, src, 'utf-8');
    console.log(`  ✅ ${state.padEnd(5)} Menu-Eintrag entfernt`);
  } else {
    console.log(`  📄 ${state.padEnd(5)} [DRY] würde ändern`);
  }
}

// --- Curricula-Index: Gewicht etwas nach oben? (optional, aber schöner)
const indexPath = resolve(STATES_DIR, '_index.md');
let indexContent = readFileSync(indexPath, 'utf-8');
const indexWeight = '    weight: 100';
if (!indexContent.includes('    weight: 80')) {
  if (!DRY) {
    // direkt nach parent einfügen
    indexContent = indexContent.replace(
      /(\s+weight:\s*\d+)/,
      '    weight: 80'
    );
    writeFileSync(indexPath, indexContent, 'utf-8');
    console.log('\n  ✅ curricula/_index.md Gewicht auf 80 (vor Übungsgenerator)');
  } else {
    console.log('\n  📄 curricula/_index.md [DRY] Gewicht anpassen');
  }
} else {
  console.log('\n  ℹ️  curricula/_index.md Gewicht bereits 80');
}

console.log('\n[apply-lehrplan-menu] ✓orian Caferfocus');
