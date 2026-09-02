#!/usr/bin/env node
/**
 * generate-entity-slug-manifest.mjs — UXF-011c (CI-Step)
 *
 * Schreibt die Liste ALLER existierenden Entity-Slugs (Verzeichnisse unter
 * myhugoapp/content/entity/) als kompaktes JSON nach
 * myhugoapp/static/js/entity-slugs.json. Das Frontend
 * (static/js/utils/entity-links.js) prüft Topic-Links dagegen, um 404s zu
 * vermeiden (Fallback: Pagefind-Suche).
 *
 * Läuft im CI nach generate-entity-pages.mjs; lokal idempotent.
 */

import fs from 'node:fs';
import path from 'node:path';

const REPO_ROOT = path.resolve(import.meta.dirname, '..');
const ENTITY_DIR = path.join(REPO_ROOT, 'myhugoapp/content/entity');
const OUT_FILE = path.join(REPO_ROOT, 'myhugoapp/static/js/entity-slugs.json');

if (!fs.existsSync(ENTITY_DIR)) {
  console.error('[entity-slugs] Verzeichnis fehlt:', ENTITY_DIR);
  process.exit(1);
}

const slugs = fs
  .readdirSync(ENTITY_DIR, { withFileTypes: true })
  .filter((d) => d.isDirectory() && !d.name.startsWith('_'))
  .map((d) => d.name)
  .sort();

fs.writeFileSync(OUT_FILE, JSON.stringify(slugs));
console.log(`[entity-slugs] ✓ ${slugs.length} Slugs → ${path.relative(REPO_ROOT, OUT_FILE)}`);
