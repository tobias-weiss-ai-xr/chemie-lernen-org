#!/usr/bin/env node
/**
 * import-content-nodes.mjs — KG1
 *
 * Imports article/calculator/exercise references from content-links.json
 * into Neo4j as proper Content nodes connected via MENTIONS relationships.
 *
 * Creates:
 *   (:Content {url, title, type})   — one per unique URL
 *   (:Entity)-[:MENTIONS]->(:Content) — topic → content link
 *
 * Also creates INDEX on :Content(url) for fast MERGE.
 *
 * Usage:
 *   node scripts/curricula/import-content-nodes.mjs           # import
 *   node scripts/curricula/import-content-nodes.mjs --dry-run  # print only
 */

import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const NEO4J_URI = process.env.NEO4J_URI || 'bolt://chemie-neo4j:7687';
const NEO4J_USER = process.env.NEO4J_USER || 'neo4j';
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD;
const NEO4J_DATABASE = 'chemie';

const CONTENT_LINKS_PATH = join(
  __dirname,
  '..',
  '..',
  'myhugoapp',
  'data',
  'curricula',
  'content-links.json'
);

const isDryRun = process.argv.includes('--dry-run');

import { subsetWhere } from '../_neo4j-subset-filter.mjs';

/**
 * Normalize a curriculum topic name for Neo4j matching.
 * Must match import-curricula.mjs normalizeName logic.
 */
function normalizeName(raw) {
  let n = raw.toLowerCase().trim();
  n = n.replace(/^lernbereich \d+:\s*/i, '');
  n = n.replace(/\(.*?\)/g, '').trim();
  const dashIdx = n.indexOf('–');
  if (dashIdx > 0) n = n.slice(0, dashIdx).trim();
  n = n.replace(/[.,;:!?]+$/, '');
  // Remove leading "Das Fach Chemie..." boilerplate
  n = n.replace(/^das fach chemie.*?\.\.\.\.\./i, '').trim();
  return n;
}

async function run() {
  if (!NEO4J_PASSWORD) {
    console.log('[import-content-nodes] NEO4J_PASSWORD not set');
    process.exit(1);
  }

  if (!existsSync(CONTENT_LINKS_PATH)) {
    console.log('[import-content-nodes] content-links.json not found at ' + CONTENT_LINKS_PATH);
    process.exit(1);
  }

  const links = JSON.parse(readFileSync(CONTENT_LINKS_PATH, 'utf-8'));
  const topicNames = Object.keys(links);
  console.log(
    `[import-content-nodes] loaded ${topicNames.length} topic keys, ${Object.values(links).flat().length} total links`
  );

  if (isDryRun) {
    // Print statistics instead of running
    const typeCounts = {};
    const uniqueUrls = new Set();
    for (const [, items] of Object.entries(links)) {
      for (const item of items) {
        typeCounts[item.type] = (typeCounts[item.type] || 0) + 1;
        uniqueUrls.add(item.url);
      }
    }
    console.log('[import-content-nodes] DRY RUN — would create:');
    console.log(`  ${uniqueUrls.size} Content nodes (${JSON.stringify(typeCounts)})`);
    console.log(`  ~${topicNames.length} MENTIONS relationships`);
    console.log('  Sample normalized topic keys (first 8):');
    topicNames
      .slice(0, 8)
      .forEach((k) => console.log('    [' + normalizeName(k).length + '] ' + normalizeName(k)));
    console.log(
      '  Unique normalized names: ' + new Set(topicNames.map((k) => normalizeName(k))).size
    );
    console.log('  Sample links for first key:');
    const first = links[topicNames[0]];
    first
      .slice(0, 3)
      .forEach((item) =>
        console.log('    ' + item.type + ': ' + item.title + ' (' + item.url + ')')
      );
    console.log('[import-content-nodes] DRY RUN — no changes made');
    process.exit(0);
  }

  // Connect to Neo4j
  const neo4j = await import('neo4j-driver');
  const driver = neo4j.default.driver(
    NEO4J_URI,
    neo4j.default.auth.basic(NEO4J_USER, NEO4J_PASSWORD)
  );

  try {
    const session = driver.session({ database: NEO4J_DATABASE });

    // Ensure index exists
    console.log('[import-content-nodes] ensuring INDEX on :Content(url)...');
    await session.run('CREATE INDEX content_url IF NOT EXISTS FOR (c:Content) ON (c.url)');
    await session.run('CREATE INDEX content_type IF NOT EXISTS FOR (c:Content) ON (c.type)');

    // Phase 1: Collect all unique Content items
    const contentItems = {};
    for (const [, items] of Object.entries(links)) {
      for (const item of items) {
        const key = item.url;
        if (!contentItems[key]) {
          contentItems[key] = { title: item.title, type: item.type, url: item.url };
        }
      }
    }
    const contentEntries = Object.values(contentItems);
    console.log(`[import-content-nodes] ${contentEntries.length} unique Content nodes to create`);

    // Batch: MERGE Content nodes (sequentially — Neo4j 5.x requires no concurrent session.run)
    // Also applies type-specific sub-labels (Article, Calculator, Exercise).
    const SUB_LABEL_MAP = { article: 'Article', calculator: 'Calculator', exercise: 'Exercise' };
    let created = 0;
    for (let i = 0; i < contentEntries.length; i++) {
      const c = contentEntries[i];
      const subLabel = SUB_LABEL_MAP[c.type] || '';
      const setSubLabel = subLabel ? ` SET content:${subLabel}` : '';
      await session.run(
        'MERGE (content:Content {url: $url}) ' +
          `ON CREATE SET content.title = $title, content.type = $type${setSubLabel} ` +
          `ON MATCH SET content.title = $title, content.type = $type${setSubLabel} ` +
          'RETURN id(content)',
        { url: c.url, title: c.title, type: c.type }
      );
      created++;
      if (created % 100 === 0 || created === contentEntries.length) {
        console.log(`[import-content-nodes] ${created}/${contentEntries.length} Content nodes`);
      }
    }

    // Phase 2: Create MENTIONS relationships from Entity to Content
    let mentionsCreated = 0;
    let topicsMatched = 0;
    let errors = 0;
    let nameCache = {}; // normalized name → entity name from Neo4j

    for (const topicName of topicNames) {
      const items = links[topicName];
      const normName = normalizeName(topicName);
      if (!normName || normName.length < 3) {
        errors++;
        continue;
      }

      // Find matching Entity by normalized name (with caching)
      const entityScope = subsetWhere('e', ['Entity']);
      let entityName = nameCache[normName];
      if (!entityName) {
        const result = await session.run(
          `MATCH (e) ${entityScope} AND e.kategorie = "lehrplan" AND e.name CONTAINS $name RETURN e.name LIMIT 1`,
          { name: normName }
        );
        if (result.records.length === 0) {
          errors++;
          if (errors <= 5) {
            console.log(
              `  [warn] no Entity for normalized: "${normName.slice(0, 50)}" (raw: "${topicName.slice(0, 40)}")`
            );
          }
          continue;
        }
        entityName = result.records[0].get('e.name');
        nameCache[normName] = entityName;
      }

      topicsMatched++;

      // Create MENTIONS relationships for each Content item
      for (const item of items) {
        try {
          await session.run(
            'MATCH (e:Entity {name: $entityName}) ' +
              'MATCH (c:Content {url: $url}) ' +
              'MERGE (e)-[:MENTIONS]->(c)',
            { entityName, url: item.url }
          );
          mentionsCreated++;
        } catch (err) {
          console.log(`  [error] linking ${entityName} → ${item.url}: ${err.message}`);
        }
      }
    }

    console.log(`\n[import-content-nodes] DONE`);
    console.log(`  Content nodes created/merged: ${created}`);
    console.log(`  Topics matched (of ${topicNames.length}): ${topicsMatched}`);
    console.log(`  Topics unmatched: ${topicNames.length - topicsMatched - errors}`);
    console.log(`  MENTIONS relationships created: ${mentionsCreated}`);

    await session.close();
  } finally {
    await driver.close();
  }
}

run().catch((err) => {
  console.error('[import-content-nodes] FATAL:', err);
  process.exit(1);
});
