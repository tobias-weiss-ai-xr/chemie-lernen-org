/**
 * apply-r6-404.mjs — UXF-025: 404-Redirect auch für tiefe Curricula-Pfade
 *
 * Bisher fängt die Smart-404 nur EXAKT /curricula/{xy}/ ab. Alte Bookmarks
 * auf generierte Tiefen-URLs (/curricula/by/gymnasium/.../) liefen in die
 * nackte 404. Neu:
 *   - /curricula/{valider-state}/...  → /curricula/{state}/
 *   - /curricula/{unbekannt}/...      → /curricula/ (Übersicht, wie bisher)
 *   - index.html-Segmente werden ignoriert
 *
 * WICHTIG: apply-r5-404.mjs schreibt die Datei komplett neu — die Logik
 * wurde DORT gespiegelt, damit ein erneuter Full-Rewrite den Fix erhält.
 * Dieses Skript patcht idempotent (Marker UXF-025) mit exakten Ankern.
 */

import fs from 'node:fs';
import path from 'node:path';

const REPO_ROOT = path.resolve(import.meta.dirname, '../..');
const FILE = path.join(REPO_ROOT, 'myhugoapp/layouts/404.html');
const R5_SCRIPT = path.join(REPO_ROOT, 'scripts/ux/apply-r5-404.mjs');

function fail(anchor) {
  throw new Error(`[UXF-025] Anker nicht gefunden: "${anchor}"`);
}

// ── 1. Template patchen ──────────────────────────────────────────────
{
  let src = fs.readFileSync(FILE, 'utf-8');
  if (src.includes('UXF-025')) {
    console.log('[UXF-025] Template bereits gepatcht');
  } else {
    const a1 = `  // Ungültige Curricula-Pfade: /curricula/{xy}/ mit xy ≠ State-Code
  var STATES = ['bb','be','bw','by','hb','he','hh','mv','ni','nw','rp','sh','sl','sn','st','th'];
  var curMatch = path.match(/^\\/curricula\\/([^\\/]+)\\/?$/);
  if (curMatch && curMatch[1] && STATES.indexOf(curMatch[1].toLowerCase()) === -1) {
    showRedirectHint('/curricula/', 'Lehrplan-Übersicht');
  }`;
    if (!src.includes(a1)) fail(a1);
    src = src.replace(
      a1,
      `  // Curricula-Pfade: valider State (+ beliebige Tiefe) → State-Seite,
  // unbekanntes Segment → Übersicht (UXF-025)
  var STATES = ['bb','be','bw','by','hb','he','hh','mv','ni','nw','rp','sh','sl','sn','st','th'];
  var curMatch = path.match(/^\\/curricula\\/([^\\/]+)(?:\\/(.*))?\\/?$/);
  if (curMatch && curMatch[1] && curMatch[1] !== 'index.html') {
    var stateSeg = curMatch[1].toLowerCase();
    var deepSeg = curMatch[2] || '';
    if (STATES.indexOf(stateSeg) !== -1) {
      // State ok — tiefe Pfade (alte generierte Seiten) zur State-Übersicht
      if (deepSeg && deepSeg !== 'index.html') {
        showRedirectHint(
          '/curricula/' + stateSeg + '/',
          'Lehrplan ' + stateSeg.toUpperCase()
        );
      }
    } else {
      showRedirectHint('/curricula/', 'Lehrplan-Übersicht');
    }
  }`
    );
    fs.writeFileSync(FILE, src);
    console.log('[UXF-025] ✓ Template gepatcht (Deep-Path-Redirects)');
  }
}

// ── 2. apply-r5-404.mjs spiegeln (Full-Rewrite-Schutz) ──────────────
{
  let src = fs.readFileSync(R5_SCRIPT, 'utf-8');
  if (src.includes('UXF-025')) {
    console.log('[UXF-025] apply-r5-404 bereits gespiegelt');
  } else {
    const a2 = `  // Ungültige Curricula-Pfade: /curricula/{xy}/ mit xy ≠ State-Code
  var STATES = ['bb','be','bw','by','hb','he','hh','mv','ni','nw','rp','sh','sl','sn','st','th'];
  var curMatch = path.match(/^\\\\/curricula\\\\/([^\\\\/]+)\\\\/?$/);
  if (curMatch && curMatch[1] && STATES.indexOf(curMatch[1].toLowerCase()) === -1) {
    showRedirectHint('/curricula/', 'Lehrplan-Übersicht');
  }`;
    if (!src.includes(a2)) fail(a2);
    src = src.replace(
      a2,
      `  // Curricula-Pfade: valider State (+ beliebige Tiefe) → State-Seite,
  // unbekanntes Segment → Übersicht (UXF-025)
  var STATES = ['bb','be','bw','by','hb','he','hh','mv','ni','nw','rp','sh','sl','sn','st','th'];
  var curMatch = path.match(/^\\\\/curricula\\\\/([^\\\\/]+)(?:\\\\/(.*))?\\\\/?$/);
  if (curMatch && curMatch[1] && curMatch[1] !== 'index.html') {
    var stateSeg = curMatch[1].toLowerCase();
    var deepSeg = curMatch[2] || '';
    if (STATES.indexOf(stateSeg) !== -1) {
      // State ok — tiefe Pfade (alte generierte Seiten) zur State-Übersicht
      if (deepSeg && deepSeg !== 'index.html') {
        showRedirectHint(
          '/curricula/' + stateSeg + '/',
          'Lehrplan ' + stateSeg.toUpperCase()
        );
      }
    } else {
      showRedirectHint('/curricula/', 'Lehrplan-Übersicht');
    }
  }`
    );
    fs.writeFileSync(R5_SCRIPT, src);
    console.log('[UXF-025] ✓ apply-r5-404 gespiegelt');
  }
}

console.log('[r6-404] ✓ abgeschlossen');
