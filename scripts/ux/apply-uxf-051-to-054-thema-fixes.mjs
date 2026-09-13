#!/usr/bin/env node
/**
 * apply-uxf-051-to-054-thema-fixes.mjs — UX-Fixes „Was ist Chemie?"-Runde
 * (Live-Feedback 2026-09-13):
 *
 * UXF-051: Eingebettete Videos brachen mit width:100vw aus der Textbreite
 *          aus (1440px auf Desktop!) — Breakout-Regel entfernt.
 * UXF-052: Tabellen in .thema-content liefen auf ~483px statt volle
 *          Textbreite — width:100% + Zellen-Padding.
 * UXF-053: Schwierigkeits-Badges transparent im Light-Theme: single.html
 *          selektierte .label-difficulty.grundlagen, das Element heißt
 *          aber label-grundlagen → kein Match → weißer Text auf beigem
 *          Seitenhintergrund (1.12:1). Selektoren korrigiert.
 * UXF-054: Video-Caption (#666) und zigs-video-Metatexte (#777) im Dark-
 *          Theme auf dunkelgrün kaum lesbar (2.68:1) — Dark-Overrides;
 *          #777→#595959 auch im Light (4.25→6.7:1).
 *
 * Idempotent: jeder Edit nur wenn Marker fehlt.
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');
const CUSTOM = path.join(ROOT, 'myhugoapp/static/css/custom.css');
const DARK = path.join(ROOT, 'myhugoapp/static/css/dark-mode.css');
const SINGLE = path.join(ROOT, 'myhugoapp/layouts/_default/single.html');

const BREAKOUT_OLD = `/* Full viewport width breakout — videos span edge-to-edge on article pages */
@media (min-width: 768px) {
  .thema-content > .video-embed {
    width: 100vw;
    position: relative;
    left: 50%;
    margin-left: -50vw;
    margin-right: -50vw;
    max-width: none;
  }
}`;

const BREAKOUT_NEW = `/* UXF-051: Videos bleiben in der Textbreite des Artikels
   (vorher 100vw-Breakout — Video war bis zu 1440px breit). */
.thema-content > .video-embed {
  max-width: 100%;
}

/* UXF-052: Tabellen nutzen die volle Textbreite (vorher ~483px gequetscht) */
.thema-content table {
  width: 100%;
}

.thema-content th,
.thema-content td {
  padding: 10px 14px;
  vertical-align: top;
}

/* UXF-054: Überschriften-Anker erben die Überschriftenfarbe
   (vorher .text-muted-Grau #777 auf hellem Grund — 4.25:1) */
.thema-content h3 a {
  color: inherit;
}`;

const CAPTION_OLD = `.video-embed-caption {
  margin-top: 0.6rem;
  font-size: 0.9rem;
  color: #666;`;
const CAPTION_NEW = `.video-embed-caption {
  margin-top: 0.6rem;
  font-size: 0.9rem;
  color: #595959; /* UXF-054: #666 → #595959 (7.0:1 auf Weiß) */`;

const ZIGS_OLD_1 = `.zigs-video-empty {
  font-style: italic;
  color: #777;
}`;
const ZIGS_NEW_1 = `.zigs-video-empty {
  font-style: italic;
  color: #595959; /* UXF-054 */
}`;

const ZIGS_OLD_2 = `.zigs-video-source {
  margin-top: 14px;
  font-size: 0.82rem;
  color: #777;
}`;
const ZIGS_NEW_2 = `.zigs-video-source {
  margin-top: 14px;
  font-size: 0.82rem;
  color: #595959; /* UXF-054 */
}`;

const BADGE_OLD = `/* Difficulty Labels */
.label-difficulty.grundlagen {
  background-color: #1e7e34;
}

.label-difficulty.mittelstufe {
  background-color: #ffc107;
  color: #333;
}

.label-difficulty.fortgeschritten {
  background-color: #a71d2a;
}`;
const BADGE_NEW = `/* Difficulty Labels — UXF-053: Selektoren an die tatsächlichen Klassen
   (label-grundlagen etc.) angepasst. Vorher matchte kein Selektor →
   transparenter Badge mit weißem Text auf Seitenhintergrund (1.12:1). */
.label-difficulty.label-grundlagen {
  background-color: #1e7e34;
}

.label-difficulty.label-mittelstufe {
  background-color: #ffc107;
  color: #333;
}

.label-difficulty.label-fortgeschritten {
  background-color: #a71d2a;
}`;

const DARK_APPEND = `
/* UXF-054: Video-Caption + zigs-Metatexte im Dark-Theme lesbar */
[data-theme='dark'] .video-embed-caption {
  color: var(--text-secondary);
}
[data-theme='dark'] .zigs-video-source,
[data-theme='dark'] .zigs-video-empty {
  color: var(--text-secondary);
}
`;

function replaceOnce({ src, marker, oldText, newText, name }) {
  if (src.includes(marker)) return { src, changed: false };
  if (!src.includes(oldText)) return { error: `Anker nicht gefunden: ${name}` };
  return { src: src.replace(oldText, newText), changed: true };
}

export function applyFixes({ custom, dark, single }) {
  const changed = { custom: false, dark: false, single: false };
  let c = custom;
  for (const [marker, o, n, name] of [
    ['UXF-051', BREAKOUT_OLD, BREAKOUT_NEW, 'video-breakout'],
    ['#595959 (7.0:1 auf Weiß)', CAPTION_OLD, CAPTION_NEW, 'caption'],
    ['/* UXF-054 */', ZIGS_OLD_1, ZIGS_NEW_1, 'zigs-empty'],
    ['/* UXF-054 */', ZIGS_OLD_2, ZIGS_NEW_2, 'zigs-source'],
  ]) {
    const r = replaceOnce({ src: c, marker, oldText: o, newText: n, name });
    if (r.error) return { error: `custom.css: ${r.error}` };
    c = r.src;
    changed.custom = changed.custom || r.changed;
  }
  const d = replaceOnce({
    src: dark,
    marker: "[data-theme='dark'] .video-embed-caption",
    oldText: '',
    newText: '',
  });
  if (d.error) return { error: `dark-mode.css: ${d.error}` };
  let darkOut = dark;
  if (!dark.includes("[data-theme='dark'] .video-embed-caption")) {
    darkOut = dark + DARK_APPEND;
    changed.dark = true;
  }
  const s = replaceOnce({
    src: single,
    marker: 'UXF-053',
    oldText: BADGE_OLD,
    newText: BADGE_NEW,
    name: 'badge-selektoren',
  });
  if (s.error) return { error: `single.html: ${s.error}` };
  changed.single = s.changed;
  return { changed, custom: c, dark: darkOut, single: s.src };
}

const isDirectRun =
  process.argv[1] && process.argv[1].endsWith('apply-uxf-051-to-054-thema-fixes.mjs');
if (isDirectRun) {
  const custom = fs.readFileSync(CUSTOM, 'utf8');
  const dark = fs.readFileSync(DARK, 'utf8');
  const single = fs.readFileSync(SINGLE, 'utf8');
  const r = applyFixes({ custom, dark, single });
  if (r.error) {
    console.error(`apply-uxf-051-to-054: ${r.error}`);
    process.exit(1);
  }
  if (r.changed.custom) fs.writeFileSync(CUSTOM, r.custom);
  if (r.changed.dark) fs.writeFileSync(DARK, r.dark);
  if (r.changed.single) fs.writeFileSync(SINGLE, r.single);
  console.log(
    `apply-uxf-051-to-054: video/tabelle=${r.changed.custom}, dark-caption=${r.changed.dark}, badges=${r.changed.single}`
  );
}
