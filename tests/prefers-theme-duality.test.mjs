/**
 * UXF-058-Struktur-Guard: Kein ungebundener prefers-color-scheme:dark-Drift.
 *
 * Die Site hat zwei Theme-Systeme: data-theme (light|dark|contrast, immer von
 * head.html gesetzt) und ~52 Dateien mit @media (prefers-color-scheme: dark)-
 * Blöcken. Ungebunden mischen sie sich mit data-theme='light' (UXF-057:
 * „Falsch · 0/10 Punkte" unsichtbar; 21 Verletzungen auf einer Themenseite).
 *
 * Regel: Jeder prefers-dark-Block darf NUR Selektoren mit Präfix
 * html:not([data-theme]) enthalten (reiner NO-JS-Fallback) UND muss von
 * einem [data-theme='dark']-Zwillings-Block gefolgt sein (damit das
 * Dark-Theme lokal weiter abgedunkelt wird, unabhängig vom OS).
 *
 * Generiert via scripts/ux/apply-uxf-058-prefers-theme-fallback.mjs
 * (idempotent — nach neuen prefers-Blöcken einfach erneut ausführen).
 */

import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve('myhugoapp');
const PREFIX = 'html:not([data-theme])';
const TWIN_MARK = 'UXF-058';

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

function collectTargets() {
  const targets = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(css|html)$/.test(entry.name)) targets.push(full);
    }
  };
  walk(path.join(ROOT, 'layouts'));
  walk(path.join(ROOT, 'static', 'css'));
  return targets;
}

/** Liefert [{file, index, selectors, hasTwinAfter}] für alle prefers-dark-Blöcke. */
function collectBlocks() {
  const blocks = [];
  const mediaRe = /@media[^{]*prefers-color-scheme:\s*dark[^{]*\{/g;
  for (const file of collectTargets()) {
    const src = fs.readFileSync(file, 'utf8');
    let m;
    mediaRe.lastIndex = 0;
    while ((m = mediaRe.exec(src))) {
      const open = m.index + m[0].length - 1;
      const end = findBlockEnd(src, open);
      if (end === -1) continue;
      const body = src.slice(open + 1, end);
      // Top-Level-Selektoren (nicht in verschachtelten @-Regeln)
      const sels = [];
      let i = 0;
      while (i < body.length) {
        if (body.startsWith('/*', i)) {
          const e = body.indexOf('*/', i);
          i = e === -1 ? body.length : e + 2;
          continue;
        }
        if (body[i] === '@') {
          const brace = body.indexOf('{', i);
          const e = brace === -1 ? body.length : findBlockEnd(body, brace);
          i = e + 1;
          continue;
        }
        const brace = body.indexOf('{', i);
        if (brace === -1) break;
        const sel = body
          .slice(i, brace)
          .replace(/^\s*\}?\s*/, '')
          .trim();
        if (sel)
          sels.push(
            ...sel
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
          );
        const e = findBlockEnd(body, brace);
        if (e === -1) break;
        i = e + 1;
      }
      const after = src.slice(end + 1, end + 400);
      blocks.push({
        file: path.relative(process.cwd(), file),
        selectors: sels,
        hasTwinAfter: after.includes(TWIN_MARK) || after.includes("[data-theme='dark']"),
      });
      mediaRe.lastIndex = end + 1;
    }
  }
  return blocks;
}

describe('UXF-058: prefers-color-scheme-Blöcke sind theme-gebunden', () => {
  const blocks = collectBlocks();

  it('findet prefers-dark-Blöcke (Sanity: Site hat welche)', () => {
    expect(blocks.length).toBeGreaterThan(20);
  });

  it('jeder Selektor beginnt mit html:not([data-theme])', () => {
    const offenders = blocks.flatMap((b) =>
      b.selectors
        .filter((s) => !s.startsWith(PREFIX + ' ') && !s.startsWith(PREFIX))
        .map((s) => `${b.file}: "${s}"`)
    );
    expect(
      offenders,
      `Ungebundene Selektoren (Fix: scripts/ux/apply-uxf-058-prefers-theme-fallback.mjs ausführen):\n${offenders.join('\n')}`
    ).toEqual([]);
  });

  it('auf jeden prefers-Block folgt ein [data-theme=dark]-Zwilling', () => {
    const offenders = blocks.filter((b) => !b.hasTwinAfter).map((b) => b.file);
    expect(offenders, `Blöcke ohne Dark-Zwilling:\n${offenders.join('\n')}`).toEqual([]);
  });
});
