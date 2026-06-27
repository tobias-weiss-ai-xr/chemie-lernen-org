#!/usr/bin/env node
/**
 * Link :UniversityModule nodes to :Entity and :Content nodes in the
 * central Neo4j KG via COVERS and TEACHES relationships.
 *
 * This creates two relationship types:
 *
 *   (:UniversityModule)-[:COVERS]->(:Entity)
 *     — a university module covers a chemistry topic (Entity)
 *
 *   (:Entity)<-[:TEACHES]-(:Content)
 *     — chemie-lernen.org content page teaches about an entity
 *       (this already exists as MENTIONS — we use it transitively:
 *        Module → Entity ← Content through COVERS↔MENTIONS)
 *
 * Strategy: For each module, extract subject-area keywords from the
 * module name and match them (via CONTAINS) against Entity names
 * that have kategorie = "lehrplan".
 *
 * Idempotent: uses MERGE on relationships.
 *
 * Usage:
 *   node scripts/curricula/link-module-entities.mjs
 *   node scripts/curricula/link-module-entities.mjs --dry-run
 *   node scripts/curricula/link-module-entities.mjs --source eth  # limit to one uni
 */

import neo4j from 'neo4j-driver';

const NEO4J_URI = process.env.NEO4J_URI || 'bolt://localhost:7687';
const NEO4J_USER = process.env.NEO4J_USER || 'neo4j';
const NEO4J_PASSWORD =
  process.env.NEO4J_PASSWORD || 'chemie_knowledge_2024';
const NEO4J_DATABASE = process.env.NEO4J_DATABASE || 'chemie';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const SOURCE_FILTER = args.find((a) => a.startsWith('--source='))?.slice('--source='.length);

// Keyword extraction: break a module name into subject-area keywords.
// Returns a deduplicated list of lowercase search terms.
function extractKeywords(name) {
  // Drop generic qualifiers
  const cleaned = name
    .replace(/I{1,3}V?$/i, '')      // trailing Roman numerals
    .replace(/^\d+\s*/i, '')         // leading course numbers
    .replace(/:.*$/, '')             // subtitle after colon
    .replace(/\([^)]*\)/g, '')       // parenthetical items
    .trim();

  // Common subject-area terms found in module names
  const subjects = [];
  const deTerms = [
    'allgemeine chemie', 'anorganische chemie', 'organische chemie',
    'physikalische chemie', 'analytische chemie', 'biochemie',
    'makromolekulare chemie', 'theoretische chemie', 'chemische technologie',
    'nanotechnologie', 'supramolecular chemistry', 'chemical biology',
    'bioorganische chemie', 'protein engineering', 'chemie',
  ];
  const enTerms = [
    'inorganic chemistry', 'organic chemistry', 'physical chemistry',
    'analytical chemistry', 'thermodynamics', 'kinetics',
    'quantum mechanics', 'statistical mechanics', 'biological chemistry',
  ];

  const lower = cleaned.toLowerCase();
  for (const term of [...deTerms, ...enTerms]) {
    if (lower.includes(term)) {
      subjects.push(term);
    }
  }

  // Fallback: use first two words if no subject matched
  if (subjects.length === 0) {
    const words = lower.split(/\s+/).filter(Boolean).slice(0, 2);
    if (words.length) subjects.push(words.join(' '));
  }

  return [...new Set(subjects)];
}

async function linkModules(driver) {
  const session = driver.session({ database: NEO4J_DATABASE });
  try {
    // Step 1: Get all UniversityModules, optionally filtered by source
    let moduleQuery = `
      MATCH (u:University)-[:OFFERS]->(m:UniversityModule)
      RETURN u.short_code AS univ, m.module_code AS code,
             m.module_name AS name, m.level AS level
    `;
    if (SOURCE_FILTER) {
      moduleQuery = `
        MATCH (u:University {short_code: $sourceFilter})-[:OFFERS]->(m:UniversityModule)
        RETURN u.short_code AS univ, m.module_code AS code,
               m.module_name AS name, m.level AS level
      `;
    }
    const modResult = await session.run(moduleQuery, {
      sourceFilter: SOURCE_FILTER || undefined,
    });
    const modules = modResult.records.map((r) => ({
      univ: r.get('univ'),
      code: r.get('code'),
      name: r.get('name'),
      level: r.get('level'),
    }));
    console.log(`Found ${modules.length} university module(s)`);
    if (DRY_RUN) {
      console.log('DRY-RUN: not creating relationships');
      return { modulesScanned: modules.length, relationships: 0 };
    }

    let totalRelationships = 0;

    for (const mod of modules) {
      const keywords = extractKeywords(mod.name);
      if (keywords.length === 0) {
        console.log(`  [skip] no keywords for "${mod.name}" (${mod.univ}:${mod.code})`);
        continue;
      }

      // Step 2: For each keyword, find matching Entity nodes
      for (const kw of keywords) {
        const entityResult = await session.run(
          `MATCH (e:Entity {kategorie: "lehrplan"})
           WHERE toLower(e.name) CONTAINS $kw
           RETURN e.name AS entityName, labels(e) AS labels
           LIMIT 5`,
          { kw }
        );

        for (const rec of entityResult.records) {
          const entityName = rec.get('entityName');

          // Create COVERS relationship: Module → Entity
          await session.run(
            `MATCH (m:UniversityModule {module_code: $code, university: $univ})
             MATCH (e:Entity {name: $entityName, kategorie: "lehrplan"})
             MERGE (m)-[:COVERS]->(e)`,
            { code: mod.code, univ: mod.univ, entityName }
          );
          totalRelationships++;

          // Step 3: Also create TEACHES relationship
          // Content → Module (for content that mentions the entity)
          await session.run(
            `MATCH (e:Entity {name: $entityName, kategorie: "lehrplan"})
             MATCH (e)-[:MENTIONS]->(c:Content)
             MATCH (m:UniversityModule {module_code: $code, university: $univ})
             MERGE (c)-[:TEACHES]->(m)`,
            { entityName, code: mod.code, univ: mod.univ }
          );
          totalRelationships++;
        }
      }
    }

    console.log(`Created ${totalRelationships} relationship(s)`);
    return { modulesScanned: modules.length, relationships: totalRelationships };
  } finally {
    await session.close();
  }
}

async function main() {
  console.log('=== link-module-entities.mjs ===');
  console.log(`NEO4J_URI: ${NEO4J_URI}`);
  console.log(`NEO4J_DATABASE: ${NEO4J_DATABASE}`);
  if (SOURCE_FILTER) console.log(`SOURCE_FILTER: ${SOURCE_FILTER}`);
  if (DRY_RUN) console.log('DRY RUN — no changes');

  const driver = neo4j.driver(
    NEO4J_URI,
    neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD)
  );

  try {
    const result = await linkModules(driver);
    console.log('=== result ===');
    console.log(JSON.stringify(result, null, 2));
  } catch (e) {
    console.error('Linking failed:', e.message);
    process.exit(1);
  } finally {
    await driver.close();
  }
}

main();
