#!/usr/bin/env node
/**
 * generate-entity-pages.mjs
 *
 * Reads kg_data.json (exported from Neo4j by export-kg-data.mjs) and
 * generates Hugo markdown pages for each entity. The layout template
 * (layouts/entity/single.html) handles rendering.
 *
 * The 54 stub entity markdowns currently in the repo are leftovers from
 * a previous successful export. Re-running this script regenerates them
 * all from the latest data — no manual curation needed.
 *
 * German descriptions are generated from a template if the entity has no
 * description in the KG, using the entity name, kategorie, and the count
 * of articles that mention it. This gives every entity at least a 1-sentence
 * stub instead of an empty body.
 */
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
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
  if (s === null || s === undefined) return '';
  return String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

const KAT_LABELS = {
  stoff: 'Stoff',
  konzept: 'Konzept',
  reaktion: 'Reaktion',
  methode: 'Methode',
  person: 'Person',
  quelle: 'Quelle',
  lehrplan: 'Lehrplan',
  didaktik: 'KMK-Standard',
  lernziel: 'Lernziel',
};

/**
 * Build a short German description for an entity if none is provided.
 * This is intentionally formulaic — better than nothing, and easy to
 * override later by setting `entity.description` in the export.
 */
function defaultDescription(entity) {
  const name = entity.name;
  const cat = KAT_LABELS[entity.category] || entity.category || 'Fachbegriff';
  const articleCount = entity.articleCount || 0;
  const relatedCount = (entity.relatedEntities || []).length;
  const articlePhrase =
    articleCount === 1 ? 'einem Artikel' : `${articleCount} Artikeln`;
  const relatedPhrase =
    relatedCount === 0
      ? ''
      : relatedCount === 1
        ? ' und ist mit einem weiteren Fachbegriff verknüpft'
        : ` und ist mit ${relatedCount} weiteren Fachbegriffen verknüpft`;
  return `Fachbegriff „${name}“ (${cat}) — beschrieben in ${articlePhrase} auf chemie-lernen.org${relatedPhrase}.`;
}

function articleListForBody(articles) {
  if (!articles || articles.length === 0) return '';
  const list = articles
    .slice(0, 5)
    .map((a) => `- [${a.title}](${a.url || '/'})`)
    .join('\n');
  return `## Verknüpfte Artikel\n\n${list}\n`;
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

  // Build slug → entity lookup
  const entitiesBySlug = new Map();
  for (const entity of entities) {
    entitiesBySlug.set(slugify(entity.name), entity);
  }

  // Collect slugs that should exist. Anything else in the dir (besides
  // the 3 hand-written element markdowns) is removed to keep the
  // generated directory in sync with the data.
  const slugsToKeep = new Set(entitiesBySlug.keys());
  // Preserve the 3 hand-written element markdowns
  const HAND_WRITTEN = new Set(['kohlenstoff', 'palladium', 'platin']);
  HAND_WRITTEN.forEach((s) => slugsToKeep.add(s));

  let removed = 0;
  try {
    const entries = await (await import('node:fs/promises')).readdir(ENTITY_DIR);
    for (const entry of entries) {
      if (!slugsToKeep.has(entry)) {
        await rm(join(ENTITY_DIR, entry), { recursive: true, force: true });
        removed++;
      }
    }
  } catch {
    // ENTITY_DIR may not exist yet — first run
  }

  let generated = 0;
  let updated = 0;
  for (const entity of entities) {
    const slug = slugify(entity.name);
    if (HAND_WRITTEN.has(slug)) continue; // don't touch the 3 element markdowns

    const pageDir = join(ENTITY_DIR, slug);
    const pageFile = join(pageDir, 'index.md');

    const category = entity.category || 'konzept';
    const articleCount = entity.articleCount || 0;
    const relatedCount = (entity.relatedEntities || []).length;
    const relatedNames = (entity.relatedEntities || [])
      .map((r) => (typeof r === 'string' ? r : r.name))
      .filter(Boolean)
      .slice(0, 50); // cap to keep frontmatter sane
    const components = (entity.components || []).slice(0, 20);
    const description = entity.description || defaultDescription(entity);

    const frontmatter = [
      '---',
      `title: "${escapeYaml(entity.name)}"`,
      `description: "${escapeYaml(description)}"`,
      `date: 2026-06-26`,
      `slug: "${escapeYaml(slug)}"`,
      `category: "${escapeYaml(category)}"`,
      `articleCount: ${articleCount}`,
      `relatedCount: ${relatedCount}`,
      relatedNames.length > 0
        ? `relatedEntities:\n${relatedNames.map((n) => `  - "${escapeYaml(n)}"`).join('\n')}`
        : 'relatedEntities: []',
      components.length > 0
        ? `components:\n${components.map((c) => `  - "${escapeYaml(c)}"`).join('\n')}`
        : 'components: []',
      '---',
      '',
      articleListForBody(entity.articles || []),
    ].join('\n');

    // Check if it already exists with the same content (skip needless writes)
    let existed = false;
    try {
      const existing = await readFile(pageFile, 'utf-8');
      existed = true;
      if (existing === frontmatter) continue;
    } catch {
      // new
    }

    await mkdir(pageDir, { recursive: true });
    await writeFile(pageFile, frontmatter, 'utf-8');
    if (existed) updated++;
    else generated++;
  }

  console.log(
    `Entity pages: ${generated} new, ${updated} updated, ${removed} removed, in ${ENTITY_DIR}`
  );
}

main().catch((err) => {
  console.error('Entity page generation failed:', err.message);
  process.exit(1);
});
