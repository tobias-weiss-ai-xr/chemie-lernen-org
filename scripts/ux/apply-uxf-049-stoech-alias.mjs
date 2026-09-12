#!/usr/bin/env node
/**
 * apply-uxf-049-stoech-alias.mjs — UXF-049: /stoechiometrie/ als Hugo-Alias
 * auf /stoechiometrie-rechner/ (naheliegende URL statt 404).
 *
 * Idempotent: aliases-Block nur setzen wenn fehlt.
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');
const MD = path.join(ROOT, 'myhugoapp/content/stoechiometrie-rechner/_index.md');

export function applyAliases(md) {
  if (/^aliases:/m.test(md)) return { changed: false, md };
  const block = 'aliases:\n  - "/stoechiometrie/"\n  - "/stoichiometrie/"\n';
  return { changed: true, md: md.replace(/^---\n/, `---\n${block}`) };
}

const isDirectRun = process.argv[1] && process.argv[1].endsWith('apply-uxf-049-stoech-alias.mjs');
if (isDirectRun) {
  const before = fs.readFileSync(MD, 'utf8');
  const { changed, md } = applyAliases(before);
  if (changed) fs.writeFileSync(MD, md);
  console.log(
    `apply-uxf-049-stoech-alias: aliases ${changed ? 'gesetzt' : 'bereits vorhanden'} (/stoechiometrie/, /stoichiometrie/)`
  );
}
