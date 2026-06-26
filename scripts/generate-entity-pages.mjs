#!/usr/bin/env node
/**
 * generate-entity-pages.mjs
 * Reads kg_data.json and generates minimal Hugo markdown pages
 * for each entity. The layout template (entity/single.html) handles rendering.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');
const DATA_FILE = join(REPO_ROOT, 'myhugoapp', 'data', 'kg_data.json');
const ENTITY_DIR = join(REPO_ROOT, 'myhugoapp', 'content', 'entity');

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

function escapeYaml(s) {
  return s.replace(/"/g, '\\"');
}

async function main() {
  let raw;
  try {
    raw = await readFile(DATA_FILE, 'utf-8');
  } catch {
    console.log('kg_data.json not found at ' + DATA_FILE + '. Skipping entity page generation.');
    return;
  }
  const { entities } = JSON.parse(raw);

  if (!entities || entities.length === 0) {
    console.log('No entities found in kg_data.json. Nothing to generate.');
    return;
  }

  let generated = 0;
  for (const entity of entities) {
    const slug = slugify(entity.name);
    const pageDir = join(ENTITY_DIR, slug);
    const pageFile = join(pageDir, 'index.md');

    const category = entity.category || 'konzept';
    const articleCount = entity.articleCount || 0;
    const relatedCount = (entity.relatedEntities || []).length;

    const frontmatter = `---
title: "${escapeYaml(entity.name)}"
description: "Fachbegriff: ${escapeYaml(entity.name)} — ${articleCount} Artikel auf chemie-lernen.org"
date: 2026-06-03
slug: "${escapeYaml(slug)}"
category: "${escapeYaml(category)}"
articleCount: ${articleCount}
relatedCount: ${relatedCount}
---
`;

    await mkdir(pageDir, { recursive: true });
    await writeFile(pageFile, frontmatter);
    generated++;
  }

  console.log(`Generated ${generated} entity pages in ${ENTITY_DIR}`);
}

main().catch((err) => {
  console.error('Entity page generation failed:', err.message);
  process.exit(1);
});
