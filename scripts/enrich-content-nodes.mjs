#!/usr/bin/env node
/**
 * enrich-content-nodes.mjs — ELP-10
 *
 * Enriches existing :Content nodes with curriculum linkage properties:
 *   - `states[]` — which states reference this content
 *   - `matched_keywords[]` — keywords that triggered the link
 *   - `link_score` — quality score of the mapping
 *
 * Reads myhugoapp/data/curricula/content-neo4j-mapping.json and updates
 * matching :Content nodes via their `url` property.
 *
 * Idempotent: uses SET (not MERGE) on existing nodes. Safe to re-run.
 * Safety: No DETACH DELETE. Exits 0 on partial success.
 *
 * Usage:
 *   node scripts/enrich-content-nodes.mjs
 *   node scripts/enrich-content-nodes.mjs --dry-run
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import neo4j from 'neo4j-driver';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const MAPPING_FILE = path.join(REPO_ROOT, 'myhugoapp', 'data', 'curricula', 'content-neo4j-mapping.json');

const NEO4J_URI = process.env.NEO4J_URI || 'bolt://chemie-neo4j:7687';
const NEO4J_USER = process.env.NEO4J_USER || 'neo4j';
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || 'chemie_knowledge_2024';
const NEO4J_DATABASE = process.env.NEO4J_DATABASE || 'chemie';

const DRY_RUN = process.argv.includes('--dry-run');

function loadMapping() {
  if (!fs.existsSync(MAPPING_FILE)) {
    console.error(`Mapping file not found: ${MAPPING_FILE}`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(MAPPING_FILE, 'utf-8'));
}

async function main() {
  console.log('=== enrich-content-nodes.mjs ===');
  console.log(`NEO4J_URI: ${NEO4J_URI}`);
  console.log(`NEO4J_DATABASE: ${NEO4J_DATABASE}`);
  console.log(`DRY_RUN: ${DRY_RUN}`);
  console.log();

  const mapping = loadMapping();
  console.log(`Loaded ${Object.keys(mapping).length} mapping entries from ${MAPPING_FILE}\n`);

  // Aggregate by URL: collect all states/keywords/scores per content URL
  const byUrl = new Map();
  for (const [, links] of Object.entries(mapping)) {
    for (const link of links) {
      const url = link.url;
      if (!byUrl.has(url)) {
        byUrl.set(url, { url, title: link.title, type: link.type, states: [], keywords: new Set(), maxScore: 0 });
      }
      const entry = byUrl.get(url);
      if (link.states) {
        for (const s of link.states) {
          if (!entry.states.includes(s)) entry.states.push(s);
        }
      }
      if (link.matchedKeywords) {
        for (const kw of link.matchedKeywords) entry.keywords.add(kw);
      }
      entry.maxScore = Math.max(entry.maxScore, link.score || 0);
    }
  }

  console.log(`Unique content URLs: ${byUrl.size}\n`);

  if (DRY_RUN) {
    console.log('=== DRY RUN ===');
    let count = 0;
    for (const [url, data] of byUrl) {
      if (count < 20) {
        console.log(`  ${url}`);
        console.log(`    title: ${data.title}`);
        console.log(`    states: [${data.states.join(', ')}]`);
        console.log(`    keywords: [${[...data.keywords].slice(0, 5).join(', ')}]`);
        console.log(`    maxScore: ${data.maxScore}`);
      }
      count++;
    }
    console.log(`\n  ... ${count} total content nodes to enrich`);
    return;
  }

  const driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD), {
    connectionTimeout: 30000,
    maxConnectionLifetime: 300000,
  });

  try {
    const session = driver.session({ database: NEO4J_DATABASE });
    try {
      let updated = 0;
      let notFound = 0;

      for (const [url, data] of byUrl) {
        const result = await session.run(
          `MATCH (c:Content {url: $url})
           SET c.curriculum_states = $states,
               c.matched_keywords = $keywords,
               c.link_score = $score
           RETURN c.url AS url`,
          {
            url,
            states: data.states,
            keywords: [...data.keywords],
            score: data.maxScore,
          }
        );

        if (result.records.length > 0) {
          updated++;
        } else {
          notFound++;
        }
      }

      console.log(`Updated: ${updated} Content nodes`);
      if (notFound > 0) {
        console.log(`Not found in KG: ${notFound} URLs (content may not be imported yet)`);
      }
      console.log('\nDone.');
    } finally {
      await session.close();
    }
  } catch (err) {
    console.error('Enrich error (continuing to exit 0):', err.message);
  } finally {
    await driver.close();
  }
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
