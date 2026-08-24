#!/usr/bin/env node
/**
 * ensure-hubs-manifest.mjs
 *
 * Generates a valid Web App Manifest for the Hubs instance
 * (hubs.chemie-lernen.org). Without it the browser logs:
 *
 *   Manifest fetch from https://hubs.chemie-lernen.org/manifest.webmanifest
 *   failed, code 404
 *
 * ── ROOT CAUSE ────────────────────────────────────────────────────────────
 * hubs-client (a Mozilla Hubs fork) is served by `webpack serve` in dev mode.
 * Its webpack config has NO `devServer.static` directory and NO generic
 * public-folder CopyPlugin rule — only specific `from:/to:` rewrites for
 * /link, /scenes, /avatars, … and ESM entry copies. index.html *references*
 * `/manifest.webmanifest`, but the build never emits it, so the browser gets
 * a permanent 404. Files dropped into /code/dist on disk are NOT served
 * either (dev-server serves the in-memory compilation only).
 *
 * The manifest can only be served by making it part of the webpack
 * compilation. This script produces the file; the deploy must add a copy
 * rule + restart the service (see DEPLOY STEP below).
 *
 * ── DEPLOY STEP (in the hubs-compose repo / /code volume) ───────────────────
 *   1. Write this manifest to /code/src/public/manifest.webmanifest
 *      (this script does that when run with --apply-in-container, or just
 *       copy the printed JSON there).
 *   2. Add a CopyPlugin pattern so webpack copies src/public → dist:
 *        new CopyWebpackPlugin({
 *          patterns: [
 *            ...existingPatterns,
 *            { from: 'src/public', to: '.' },
 *          ],
 *        });
 *      (MERGE with the existing patterns — do NOT replace them.)
 *   3. Restart hubs-client:
 *        docker compose -f docker-compose.hubs.yml restart hubs-client
 *
 * ── USAGE ──────────────────────────────────────────────────────────────────
 *   node scripts/ensure-hubs-manifest.mjs                 # print to stdout
 *   node scripts/ensure-hubs-manifest.mjs OUT.json       # write to file
 *   node scripts/ensure-hubs-manifest.mjs --apply-in-container
 *        # write into /code/src/public/manifest.webmanifest (run inside the
 *        # hubs-client container or with that path mounted)
 */

import fs from 'node:fs';
import path from 'node:path';

const ICON_SRC = process.env.HUBS_ICON_SRC || '/assets/images/hubs-logo-05a5b36fc1fd40c0474d..png';
const APPLY_IN_CONTAINER = process.argv.includes('--apply-in-container');
// slice(2) drops [node, scriptPath] so we only look at real CLI args.
const OUT_ARG = process.argv.slice(2).find((a) => !a.startsWith('-'));

const manifest = {
  name: 'Chemie Lernen Hubs',
  short_name: 'ChemieHubs',
  description: 'Gemeinsam in 3D lernen — Chemie-Lernen.org in Mozilla Hubs',
  start_url: '/',
  scope: '/',
  display: 'standalone',
  background_color: '#10141f',
  theme_color: '#2d6a4f',
  orientation: 'any',
  icons: [
    {
      src: ICON_SRC,
      sizes: '512x512',
      type: 'image/png',
      purpose: 'any',
    },
  ],
};

const json = JSON.stringify(manifest, null, 2) + '\n';

if (APPLY_IN_CONTAINER) {
  const dest = '/code/src/public/manifest.webmanifest';
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, json);
  console.log(`Wrote hubs manifest -> ${dest}`);
  console.log('Next: add a CopyPlugin { from: "src/public", to: "." } rule and restart hubs-client.');
} else if (OUT_ARG) {
  fs.mkdirSync(path.dirname(path.resolve(OUT_ARG)), { recursive: true });
  fs.writeFileSync(OUT_ARG, json);
  console.log(`Wrote hubs manifest -> ${path.resolve(OUT_ARG)}`);
} else {
  process.stdout.write(json);
}
