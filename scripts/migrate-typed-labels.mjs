#!/usr/bin/env node
/**
 * migrate-typed-labels.mjs — SprintA-1
 *
 * Adds typed Neo4j labels to existing :Entity nodes based on kategorie:
 *
 *   :Entity {kategorie:'lehrplan'}   → + :Topic
 *   :Entity {kategorie:'lernziel'}   → + :LearningObjective
 *   :Entity {kategorie:'didaktik'}   → + :DidacticGuideline
 *
 * Also creates INDEX on each new label for fast lookups.
 *
 * Usage:
 *   node scripts/migrate-typed-labels.mjs           # run
 *   node scripts/migrate-typed-labels.mjs --dry-run # preview
 */

const NEO4J_URI = process.env.NEO4J_URI || 'bolt://chemie-neo4j:7687';
const NEO4J_USER = process.env.NEO4J_USER || 'neo4j';
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD;
const NEO4J_DATABASE = 'chemie';

const MAPPING = [
  { kategorie: 'lehrplan', label: 'Topic' },
  { kategorie: 'lernziel', label: 'LearningObjective' },
  { kategorie: 'didaktik', label: 'DidacticGuideline' },
];

const isDryRun = process.argv.includes('--dry-run');

async function run() {
  if (!NEO4J_PASSWORD) {
    console.log('[migrate-typed-labels] NEO4J_PASSWORD not set');
    process.exit(1);
  }

  const neo4j = await import('neo4j-driver');
  const driver = neo4j.default.driver(
    NEO4J_URI,
    neo4j.default.auth.basic(NEO4J_USER, NEO4J_PASSWORD),
  );

  try {
    const session = driver.session({ database: NEO4J_DATABASE });

    for (const { kategorie, label } of MAPPING) {
      const countResult = await session.run(
        'MATCH (e:Entity {kategorie: $kat}) RETURN count(e) AS cnt',
        { kat: kategorie },
      );
      const count = countResult.records[0].get('cnt').toNumber();
      console.log(`[migrate-typed-labels] ${kategorie}: ${count} nodes → :${label}`);

      if (isDryRun) continue;

      if (count === 0) {
        console.log(`  → Skipping (no nodes found)`);
        continue;
      }

      const result = await session.run(
        `MATCH (e:Entity {kategorie: $kat}) SET e:${label} RETURN count(e) AS cnt`,
        { kat: kategorie },
      );
      const updated = result.records[0].get('cnt').toNumber();
      console.log(`  → Updated ${updated} nodes with :${label}`);

      await session.run(
        `CREATE INDEX entity_${label.toLowerCase()}_name IF NOT EXISTS FOR (n:${label}) ON (n.name)`,
      );
      console.log(`  → INDEX created for :${label}(name)`);
    }

    // Verify
    console.log('\n[migrate-typed-labels] Verification:');
    for (const { label } of MAPPING) {
      const v = await session.run(
        `MATCH (n:${label}) RETURN count(n) AS cnt, labels(n) AS ls LIMIT 1`,
      );
      const cnt = v.records[0].get('cnt').toNumber();
      if (cnt > 0) {
        console.log(`  :${label}: ${cnt} nodes`);
      } else {
        console.log(`  :${label}: 0 nodes (lag — check index sync)`);
      }
    }

    await session.close();
    if (isDryRun) {
      console.log('\n[migrate-typed-labels] DRY RUN — no changes made.');
    } else {
      console.log('\n[migrate-typed-labels] Migration complete.');
    }
  } finally {
    await driver.close();
  }
}

run().catch((err) => {
  console.error('[migrate-typed-labels] FATAL:', err);
  process.exit(1);
});
