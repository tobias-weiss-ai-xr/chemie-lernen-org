#!/usr/bin/env node
/**
 * UXF-058: @media (prefers-color-scheme: dark)-Blöcke an
 * html:not([data-theme]) binden UND als [data-theme='dark']-Zwillinge
 * doppeln.
 *
 * Problem: Die Site hat ZWEI parallele Theme-Systeme —
 *   1. data-theme (light|dark|contrast) via localStorage + head.html-Init
 *      (setzt data-theme IMMER, Default 'dark')
 *   2. ~52 Dateien mit eigenen @media (prefers-color-scheme: dark)-Blöcken,
 *      die unabhängig von data-theme griffen.
 * Zwei Fehlerklassen:
 *   a) OS-Dark + data-theme='light' mischten beide → Text #e0e0e0 auf
 *      hellem Seiten-BG (1.18:1, 21 Verletzungen auf einer Themenseite).
 *   b) Die Blöcke waren die einzige Dark-Abdunklung vieler lokaler
 *      Komponenten (Sidebar, TOC, hint-button …) — ohne Zwilling wäre
 *      data-theme='dark' dort hell geblieben.
 *
 * Fix: Jede Regel erhält DUAL-Selektoren:
 *   html:not([data-theme]) X, [data-theme='dark'] X { … }
 * → no-JS: prefers-Fallback ✓  dark-Theme: Zwilling ✓  light: sauber hell ✓
 *
 * Idempotent: bereits duale Selektoren werden übersprungen.
 * Keyframes/Font-Face innerhalb der Blöcke bleiben unberührt.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const PREFIX = 'html:not([data-theme])';
const TWIN = "[data-theme='dark']";
const isDone = (s) => s.startsWith(PREFIX + ' ') || s.startsWith(TWIN + ' ');
const MEDIA_RE = /@media[^{]*prefers-color-scheme:\s*dark[^{]*\{/g;

const targets = [
  ...fs
    .readdirSync(path.join(ROOT, 'myhugoapp/layouts'), { recursive: true })
    .filter((f) => f.endsWith('.html'))
    .map((f) => path.join('myhugoapp/layouts', f)),
  ...fs
    .readdirSync(path.join(ROOT, 'myhugoapp/static/css'))
    .filter((f) => f.endsWith('.css'))
    .map((f) => path.join('myhugoapp/static/css', f)),
];

/** Findet Block-Ende (matching '}') ab Index der öffnenden '{'. */
function findBlockEnd(src, openIdx) {
  let depth = 0;
  for (let i = openIdx; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

/** Präfixt alle Top-Level-Selektoren in einem @media-Body. */
function prefixSelectors(body, mode) {
  let out = '';
  let i = 0;
  while (i < body.length) {
    // Kommentare 1:1 übernehmen
    if (body.startsWith('/*', i)) {
      const end = body.indexOf('*/', i);
      const stop = end === -1 ? body.length : end + 2;
      out += body.slice(i, stop);
      i = stop;
      continue;
    }
    // Verschachtelte @-Regeln (@media, @supports, @keyframes …) unberührt lassen
    if (body[i] === '@') {
      const brace = body.indexOf('{', i);
      if (brace === -1) break;
      const end = findBlockEnd(body, brace);
      out += body.slice(i, end + 1);
      i = end + 1;
      continue;
    }
    // Normale Regel: Selektor bis '{'
    const brace = body.indexOf('{', i);
    if (brace === -1) {
      out += body.slice(i);
      break;
    }
    let sel = body.slice(i, brace);
    // schließende '}' vom Vorgänger gehört nicht zum Selektor
    sel = sel.replace(/^\s*\}?\s*/, '');
    const trailing = sel.match(/\s*$/)[0];
    sel = sel.trimEnd();
    if (sel) {
      const prefixed = sel
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .map((s) => {
          if (isDone(s)) return s;
          return mode === 'media' ? PREFIX + ' ' + s : TWIN + ' ' + s;
        })
        .join(', ');
      out += prefixed + trailing + '{';
    } else {
      out += body.slice(i, brace + 1);
    }
    const end = findBlockEnd(body, brace);
    if (end === -1) {
      out += body.slice(brace + 1);
      break;
    }
    out += body.slice(brace + 1, end + 1);
    i = end + 1;
  }
  return out;
}

let changedFiles = 0;
const TWIN_MARKER = '\n/* UXF-058: data-theme=dark-Zwilling des obigen prefers-Blocks */\n';
for (const rel of targets) {
  const abs = path.join(ROOT, rel);
  let src = fs.readFileSync(abs, 'utf8');
  const original = src;
  let m;
  MEDIA_RE.lastIndex = 0;
  while ((m = MEDIA_RE.exec(src))) {
    const openIdx = m.index + m[0].length - 1;
    const end = findBlockEnd(src, openIdx);
    if (end === -1) continue;
    const body = src.slice(openIdx + 1, end);
    const newBody = prefixSelectors(body, 'media');
    // Der Twin muss AUSSERHALB des Media-Blocks stehen, damit er bei
    // data-theme='dark' unabhängig von der OS-Einstellung greift.
    const hasTwin = src.slice(end + 1).startsWith(TWIN_MARKER);
    let insert = '';
    if (!hasTwin && newBody !== body) insert = TWIN_MARKER + prefixSelectors(body, 'twin');
    if (newBody !== body || insert) {
      src = src.slice(0, openIdx + 1) + newBody + '}' + insert + src.slice(end + 1);
      MEDIA_RE.lastIndex = m.index + m[0].length + newBody.length + 1 + insert.length;
    }
  }
  if (src !== original) {
    fs.writeFileSync(abs, src);
    changedFiles++;
    console.log('angepasst:', rel);
  }
}
console.log(`\n${changedFiles} Datei(en) angepasst (idempotent; erneuter Lauf = 0 Änderungen).`);
