#!/usr/bin/env node
/**
 * generate-chemie-raeume-manifest.mjs
 *
 * Reproducible generator for the "Chemie Räume" element-room manifest.
 * Reads the WebXR app's element data (hello-webxr-master) and emits a JSON
 * manifest listing every element with its deep-linkable room URL. The
 * chemie-lernen.org directory page (/chemie-raeume/) consumes this manifest.
 *
 * Usage:
 *   node scripts/generate-chemie-raeume-manifest.mjs [ELEMENTS_SRC] [OUT_JSON]
 *   APP_BASE_URL=https://chemie-lernen.org/hello-webxr node scripts/generate-chemie-raeume-manifest.mjs
 *
 * Re-run whenever element data changes — output is committed so the directory
 * page works without a build step.
 */
import fs from 'node:fs';
import path from 'node:path';

const ELEMENTS_SRC =
  process.argv[2] ||
  process.env.ELEMENTS_SRC ||
  '/opt/git/hello-webxr-master/src/data/elements.ts';
const APP_BASE_URL = process.env.APP_BASE_URL || 'https://chemie-lernen.org/hello-webxr';
const OUT =
  process.argv[3] ||
  path.resolve(process.cwd(), 'myhugoapp/static/data/chemie-raeume-manifest.json');

if (!fs.existsSync(ELEMENTS_SRC)) {
  console.error(`ELEMENTS source not found: ${ELEMENTS_SRC}`);
  process.exit(1);
}

const text = fs.readFileSync(ELEMENTS_SRC, 'utf8');

// Restrict to the ELEMENTS array only (exclude EXPERIMENTAL_ROOMS).
const start = text.indexOf('export const ELEMENTS');
const end = text.indexOf('export const EXPERIMENTAL_ROOMS');
const elementsText = text.slice(start, end > -1 ? end : text.length);

// Split on each `symbol: 'X'` entry. Drop the preamble before the first one.
const fragments = elementsText.split(/symbol:\s*'/).slice(1);

const elements = [];
for (const frag of fragments) {
  const symbol = frag.slice(0, frag.indexOf("'"));
  if (!symbol) continue;
  const name = (frag.match(/name:\s*'([^']*)'/) || [])[1] || '';
  const group = (frag.match(/group:\s*'([^']+)'/) || [])[1] || '';
  const period = (frag.match(/period:\s*(\d+)/) || [])[1];
  const groupNumber = (frag.match(/groupNumber:\s*(\d+)/) || [])[1];
  const theme = (frag.match(/theme:\s*'([^']+)'/) || [])[1] || '';
  elements.push({
    symbol,
    name,
    group,
    period: period ? Number(period) : null,
    groupNumber: groupNumber ? Number(groupNumber) : null,
    theme,
    roomUrl: `${APP_BASE_URL}/?room=${symbol}`,
    hubRoomUrl: null,
  });
}

elements.sort((a, b) => a.symbol.localeCompare(b.symbol));

const manifest = {
  generatedAt: new Date().toISOString(),
  appBaseUrl: APP_BASE_URL,
  count: elements.length,
  elements,
};

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(manifest, null, 2) + '\n');
console.log(`Wrote ${elements.length} element rooms to ${OUT}`);
