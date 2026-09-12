#!/usr/bin/env node
/**
 * apply-uxf-044-pse-alias.mjs — UXF-044: gängige PSE-URLs als Hugo-Aliase.
 *
 * /periodensystem/, /pse/ und /periodentafel/ sind naheliegende Nutzer-URLs,
 * die bisher 404 lieferten. Hugo-Aliase erzeugen Redirect-Seiten auf die
 * kanonische Seite /perioden-system-der-elemente/.
 *
 * Idempotent: setzt den aliases-Block nur, wenn er fehlt.
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');
const MD = path.join(ROOT, 'myhugoapp/content/perioden-system-der-elemente.md');

export const ALIASES = ['periodensystem', 'pse', 'periodentafel'];

export function applyAliases(md) {
  if (/^aliases:/m.test(md)) return { changed: false, md };
  const block = `aliases:\n${ALIASES.map((a) => `  - "/${a}/"`).join('\n')}\n`;
  return { changed: true, md: md.replace(/^---\n/, `---\n${block}`) };
}

const isDirectRun = process.argv[1] && process.argv[1].endsWith('apply-uxf-044-pse-alias.mjs');
if (isDirectRun) {
  const before = fs.readFileSync(MD, 'utf8');
  const { changed, md } = applyAliases(before);
  if (changed) fs.writeFileSync(MD, md);
  console.log(
    `apply-uxf-044-pse-alias: aliases ${changed ? 'gesetzt' : 'bereits vorhanden'} (${ALIASES.join(', ')})`
  );
}
