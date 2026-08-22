#!/usr/bin/env node
/**
 * build-search-index.mjs
 *
 * Builds a Lunr.js full-text search index from kg_data.json for entity search.
 * Output: myhugoapp/static/search/entity-index.json
 *
 * Usage: node scripts/build-search-index.mjs
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import lunr from 'lunr';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');
const DATA_FILE = join(REPO_ROOT, 'myhugoapp', 'data', 'kg_data.json');
const OUTPUT_DIR = join(REPO_ROOT, 'myhugoapp', 'static', 'search');
const OUTPUT_FILE = join(OUTPUT_DIR, 'entity-index.json');

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[ä]/g, 'ae')
    .replace(/[ö]/g, 'oe')
    .replace(/[ü]/g, 'ue')
    .replace(/[ß]/g, 'ss')
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

async function main() {
  let raw;
  try {
    raw = await readFile(DATA_FILE, 'utf-8');
  } catch {
    console.log('kg_data.json not found. Skipping search index build.');
    return;
  }

  const { entities } = JSON.parse(raw);

  if (!entities || entities.length === 0) {
    console.log('No entities found. Skipping search index build.');
    return;
  }

  const entityDocuments = entities.map((entity) => ({
    id: slugify(entity.name),
    name: entity.name,
    category: entity.category || '',
    description: entity.description || '',
    slug: slugify(entity.name),
    url: `/entity/${slugify(entity.name)}/`,
    articleCount: entity.articleCount || 0,
    relatedCount: (entity.relatedEntities || []).length,
  }));

  const idx = lunr(function () {
    this.ref('id');
    this.field('name', { boost: 10 });
    this.field('category', { boost: 2 });
    this.field('description');
    this.field('slug');

    for (const doc of entityDocuments) {
      this.add(doc);
    }
  });

  const indexData = {
    index: idx.toJSON(),
    entities: entityDocuments.map((e) => ({
      id: e.id,
      name: e.name,
      category: e.category,
      slug: e.slug,
      url: e.url,
      articleCount: e.articleCount,
    })),
    builtAt: new Date().toISOString(),
    entityCount: entityDocuments.length,
  };

  await mkdir(OUTPUT_DIR, { recursive: true });
  await writeFile(OUTPUT_FILE, JSON.stringify(indexData, null, 2), 'utf-8');

  console.log(`Search index built: ${entityDocuments.length} entities → ${OUTPUT_FILE}`);
}

main().catch((err) => {
  console.error('Search index build failed:', err.message);
  process.exit(1);
});
