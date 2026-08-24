#!/usr/bin/env node
/**
 * setup-hubs-client.mjs
 *
 * Idempotent production setup for the hubs-client container. Run INSIDE the
 * hubs-client container (or with /code mounted). Makes the static-file serving
 * (scripts/hubs-static-server.py) + PWA manifest work:
 *
 *   1) Writes /code/src/public/manifest.webmanifest  (copied to dist by webpack)
 *   2) Adds a CopyPlugin rule (src/public -> dist root) to webpack.config.js
 *      so the manifest is actually emitted (fixes the 404).
 *
 * Safe to re-run: skips either step if already applied. Exits non-zero only if
 * the webpack.config.js structure changed and the patch can no longer apply.
 */
const fs = require('fs');
const path = require('path');

const CONFIG = '/code/webpack.config.js';
const PUBLIC_DIR = '/code/src/public';

const ICON_SRC =
  process.env.HUBS_ICON_SRC || '/assets/images/hubs-logo-05a5b36fc1fd40c0474d..png';

const manifest = JSON.stringify(
  {
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
  },
  null,
  2
);

fs.mkdirSync(PUBLIC_DIR, { recursive: true });
fs.writeFileSync(path.join(PUBLIC_DIR, 'manifest.webmanifest'), manifest + '\n');
console.log('wrote', path.join(PUBLIC_DIR, 'manifest.webmanifest'));

// 2) Add CopyPlugin rule if missing.
let s = fs.readFileSync(CONFIG, 'utf8');
const needle = `      new CopyWebpackPlugin({
        patterns: [
          {
            from: "src/schema.toml",
            to: "schema.toml"
          }
        ]
      }),`;

if (s.includes('src/public')) {
  console.log('CopyPlugin src/public rule already present — skipping');
} else if (!s.includes(needle)) {
  console.error(
    'webpack.config.js structure changed; cannot auto-apply src/public copy rule'
  );
  process.exit(1);
} else {
  const replacement = needle.replace(
    '{\n            from: "src/schema.toml",\n            to: "schema.toml"\n          }',
    '{\n            from: "src/schema.toml",\n            to: "schema.toml"\n          },\n          {\n            from: "src/public",\n            to: ".",\n            noErrorOnMissing: true\n          }'
  );
  s = s.replace(needle, replacement);
  fs.writeFileSync(CONFIG, s);
  console.log('patched webpack.config.js with src/public copy rule');
}
