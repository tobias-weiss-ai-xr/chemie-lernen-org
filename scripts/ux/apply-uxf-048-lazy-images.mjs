#!/usr/bin/env node
/**
 * apply-uxf-048-lazy-images.mjs — UXF-048: below-the-fold-Bilder lazy laden.
 *
 * - footer.html: Liberapay-Badge (external, ganz unten)
 * - content/_index.md: QR-Code (weit unten auf der Startseite)
 *
 * Idempotent: Edits nur wenn Marker fehlt.
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');
const FOOTER = path.join(ROOT, 'myhugoapp/layouts/partials/footer.html');
const INDEX = path.join(ROOT, 'myhugoapp/content/_index.md');

const FOOTER_OLD =
  '<img src="https://img.shields.io/liberapay/patrons/tobias-weiss-ai-xr.svg?logo=liberapay" alt="Liberapay" class="footer-icon">';
const FOOTER_NEW =
  '<img src="https://img.shields.io/liberapay/patrons/tobias-weiss-ai-xr.svg?logo=liberapay" alt="Liberapay" class="footer-icon" loading="lazy" decoding="async">';

const INDEX_OLD = '![QR-Code chemie-lernen Android-App](/qr-chemie-lernen.png)';
const INDEX_NEW =
  '<img src="/qr-chemie-lernen.png" alt="QR-Code chemie-lernen Android-App" loading="lazy" decoding="async" />';
const INDEX_MARKER = 'UXF-048';

export function applyLazy({ footer, index }) {
  const changed = { footer: false, index: false };
  let footerOut = footer;
  let indexOut = index;
  if (footer.includes(FOOTER_OLD)) {
    footerOut = footer.replace(FOOTER_OLD, FOOTER_NEW);
    changed.footer = true;
  }
  if (index.includes(INDEX_OLD)) {
    indexOut = index.replace(
      INDEX_OLD,
      `<!-- ${INDEX_MARKER}: lazy statt Markdown-img -->\n${INDEX_NEW}`
    );
    changed.index = true;
  }
  return { changed, footer: footerOut, index: indexOut };
}

const isDirectRun = process.argv[1] && process.argv[1].endsWith('apply-uxf-048-lazy-images.mjs');
if (isDirectRun) {
  const footer = fs.readFileSync(FOOTER, 'utf8');
  const index = fs.readFileSync(INDEX, 'utf8');
  const r = applyLazy({ footer, index });
  if (r.changed.footer) fs.writeFileSync(FOOTER, r.footer);
  if (r.changed.index) fs.writeFileSync(INDEX, r.index);
  console.log(
    `apply-uxf-048-lazy-images: footer ${r.changed.footer ? 'lazy ✓' : 'bereits lazy'}, startseite ${r.changed.index ? 'lazy ✓' : 'bereits lazy'}`
  );
}
