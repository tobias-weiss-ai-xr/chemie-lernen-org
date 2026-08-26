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
import { slugify, rawSlug } from './lib/slugs.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');
const DATA_FILE = join(REPO_ROOT, 'myhugoapp', 'data', 'kg_data.json');
const ENTITY_DIR = join(REPO_ROOT, 'myhugoapp', 'content', 'entity');

/**
 * Legacy redirects for historical dead entity links (observed 2026-08-27):
 * map legacy href slug → canonical entity NAME(s). The alias is only
 * emitted on the page whose canonical slug matches slugify(targetName),
 * so it degrades gracefully if the target entity does not exist.
 */
const LEGACY_ALIASES = {
  // Legacy URLs observed as dead links (2026-08-27). Umlaut URLs of real
  // umlaut-named entities (e.g. 'Friedrich Wöhler' → friedrich-wöhler) are
  // auto-covered by the rawSlug aliases below; these cover names that are
  // ASCII-normalized in the current export or use non-canonical punctuation.
  'eiseni': ['Eisen'],
  'gilbert-n.-lewis': ['Gilbert N. Lewis'],
  'eiseniii-oxid-fe2o3': ['Eisen(III)-oxid (Fe2O3)'],
  'essigsaeure': ['Essigsaeure (CH3COOH)'],
  'essigsäure': ['Essigsaeure (CH3COOH)'],
  'hydrathuelle': ['Hydrathuelle'],
  'hydrathülle': ['Hydrathuelle'],
  'carbonsaeuren': ['Carbonsaeuren'],
  'carbonsäuren': ['Carbonsaeuren'],
};

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
  const articlePhrase = articleCount === 1 ? 'einem Artikel' : `${articleCount} Artikeln`;
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
    .map((a) => {
      const title = typeof a === 'string' ? a : a.title;
      const url = typeof a === 'string' ? '' : a.url || '';
      return title ? `- [${title}](${url || '/'})` : null;
    })
    .filter(Boolean)
    .join('\n');
  return list ? `## Verknüpfte Artikel\n\n${list}\n` : '';
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
  // the hand-written element markdowns and special files) is removed
  // to keep the generated directory in sync with the data.
  const slugsToKeep = new Set(entitiesBySlug.keys());
  // Preserve hand-written element markdowns
  const HAND_WRITTEN = new Set(['kohlenstoff', 'palladium', 'platin']);
  HAND_WRITTEN.forEach((s) => slugsToKeep.add(s));
  // Preserve section index files
  const KEEP_FILES = new Set(['_index.md', '_index.html', '.gitkeep', '.gitignore']);
  KEEP_FILES.forEach((s) => slugsToKeep.add(s));

  let removed = 0;
  try {
    const entries = await (
      await import('node:fs/promises')
    ).readdir(ENTITY_DIR, { withFileTypes: true });
    for (const entry of entries) {
      if (!slugsToKeep.has(entry.name)) {
        // Only remove directories (entity pages) and known stub files
        if (entry.isDirectory() || entry.isFile()) {
          await rm(join(ENTITY_DIR, entry.name), { recursive: true, force: true });
          removed++;
        }
      }
    }
  } catch {
    // ENTITY_DIR may not exist yet — first run
  }

  const BATCH_SIZE = 100;
  let generated = 0;
  let updated = 0;
  let skipped = 0;

  async function writeEntityPage(entity) {
    const slug = slugify(entity.name);
    if (HAND_WRITTEN.has(slug)) return { type: 'skipped' };

    const pageDir = join(ENTITY_DIR, slug);
    const pageFile = join(pageDir, 'index.md');

    const category = entity.category || 'konzept';
    const articleCount = entity.articleCount || 0;
    const relatedCount = (entity.relatedEntities || []).length;
    // Weight-sorted, safety-capped; the TEMPLATE applies the didactic chip
    // caps per section (Quellen ≤ 8, Verwandte ≤ 10, KMK alle).
    const relatedNames = (entity.relatedEntities || [])
      .map((r) =>
        typeof r === 'string'
          ? { name: r, weight: 0 }
          : { name: r.name, weight: r.weight || 0 }
      )
      .filter((r) => r.name)
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 50)
      .map((r) => r.name);
    const relatedSlugs = {};
    for (const n of relatedNames) relatedSlugs[n] = slugify(n);
    const componentSlugs = {};
    for (const c of (entity.components || []).slice(0, 10)) {
      const cName = typeof c === 'string' ? c : c.name;
      if (cName) componentSlugs[cName] = slugify(cName);
    }
    const components = Object.keys(componentSlugs);
    // Legacy redirects: umlaut variant of the raw name + observed dead URLs
    // (uses the loop-level `slug` declared below)
    const aliases = [];
    if (rawSlug(entity.name) !== slug) {
      aliases.push('/entity/' + rawSlug(entity.name) + '/');
    }
    for (const [legacySlug, targetNames] of Object.entries(LEGACY_ALIASES)) {
      for (const targetName of targetNames) {
        if (slugify(targetName) === slug) aliases.push('/entity/' + legacySlug + '/');
      }
    }
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
      Object.keys(relatedSlugs).length > 0
        ? `relatedSlugs:\n${relatedNames.map((n) => `  "${escapeYaml(n)}": "${relatedSlugs[n]}"`).join('\n')}`
        : '',
      Object.keys(componentSlugs).length > 0
        ? `componentSlugs:\n${Object.keys(componentSlugs)
            .map((c) => `  "${escapeYaml(c)}": "${componentSlugs[c]}"`)
            .join('\n')}`
        : '',
      aliases.length > 0
        ? `aliases:\n${aliases.map((a) => `  - "${a}"`).join('\n')}`
        : '',
      '---',
      '',
      articleListForBody(entity.articles || []),
    ].join('\n');

    let existed = false;
    try {
      const existing = await readFile(pageFile, 'utf-8');
      existed = true;
      if (existing === frontmatter) return { type: 'skipped' };
    } catch {
      // new
    }

    await mkdir(pageDir, { recursive: true });
    await writeFile(pageFile, frontmatter, 'utf-8');
    return { type: existed ? 'updated' : 'generated' };
  }

  async function processBatch(batch) {
    const results = await Promise.all(batch.map((entity) => writeEntityPage(entity)));
    return results;
  }

  const batches = [];
  for (let i = 0; i < entities.length; i += BATCH_SIZE) {
    batches.push(entities.slice(i, i + BATCH_SIZE));
  }

  for (const batch of batches) {
    const results = await processBatch(batch);
    for (const result of results) {
      if (result.type === 'generated') generated++;
      else if (result.type === 'updated') updated++;
      else if (result.type === 'skipped') skipped++;
    }
  }

  console.log(
    `Entity pages: ${generated} new, ${updated} updated, ${skipped} skipped (same content), ${removed} removed, in ${ENTITY_DIR}`
  );
}

main().catch((err) => {
  console.error('Entity page generation failed:', err.message);
  process.exit(1);
});
