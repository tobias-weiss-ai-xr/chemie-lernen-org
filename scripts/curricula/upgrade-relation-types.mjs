/**
 * upgrade-relation-types.mjs — KG3: Upgrade generic RELATED_TO to specific types.
 *
 * Current mappings:
 *   didaktik-[:RELATED_TO]-lehrplan → ERFUELLT (bidirectional)
 *   All other RELATED_TO          → keep as-is (future: BESCHREIBT for konzept→reaktion)
 *
 * Run:  NEO4J_URI="bolt://localhost:7687" NEO4J_PASSWORD="..." node scripts/curricula/upgrade-relation-types.mjs
 * Flags: --dry-run to preview, --force to execute
 */

const NEO4J_URI = process.env.NEO4J_URI || 'bolt://chemie-neo4j:7687';
const NEO4J_USER = process.env.NEO4J_USER || 'neo4j';
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || 'chemie_knowledge_2024';
const NEO4J_DATABASE = process.env.NEO4J_DATABASE || 'chemie';
const DRY_RUN = process.argv.includes('--dry-run');
const FORCE = process.argv.includes('--force');

if (!DRY_RUN && !FORCE) {
  console.error('[upgrade-relations] Use --dry-run to preview or --force to execute');
  process.exit(1);
}

async function run() {
  const neo4j = await import('neo4j-driver');
  const driver = neo4j.default.driver(
    NEO4J_URI,
    neo4j.default.auth.basic(NEO4J_USER, NEO4J_PASSWORD),
  );

  try {
    const session = driver.session({ database: NEO4J_DATABASE });

    // Phase 1: Count existing RELATED_TO by pair
    const countResult = await session.run(
      `MATCH (a)-[r:RELATED_TO]->(b)
       RETURN a.kategorie + '→' + b.kategorie AS pair, count(*) AS cnt
       ORDER BY cnt DESC`,
    );
    console.log('[upgrade-relations] Current RELATED_TO distribution:');
    for (const rec of countResult.records) {
      console.log(`  ${rec.get('pair')}: ${rec.get('cnt')}`);
    }

    // Phase 2: Upgrade didaktik↔lehrplan to ERFUELLT (bidirectional)
    console.log('\n[upgrade-relations] Phase 2: didaktik↔lehrplan → ERFUELLT');

    // Count all pairs in both directions
    const pairCount = await session.run(
      `MATCH (a:Entity)-[r:RELATED_TO]->(b:Entity)
       WHERE (a.kategorie='didaktik' AND b.kategorie='lehrplan')
          OR (a.kategorie='lehrplan' AND b.kategorie='didaktik')
       RETURN count(*) AS cnt`,
    );
    console.log(`  Found ${pairCount.records[0].get('cnt')} bidirectional pairs`);

    if (DRY_RUN) {
      const pairs = await session.run(
        `MATCH (a:Entity {kategorie:'didaktik'})-[r:RELATED_TO]->(b:Entity {kategorie:'lehrplan'})
         RETURN a.name AS src, b.name AS tgt LIMIT 3`,
      );
      console.log('  [dry-run] Would: DELETE RELATED_TO, CREATE (a)-[:ERFUELLT]->(b)');
      for (const rec of pairs.records) {
        console.log(`    ERFUELLT: "${rec.get('src').slice(0, 50)}" ↔ "${rec.get('tgt').slice(0, 50)}"`);
      }
    } else {
      // Replace all didaktik↔lehrplan RELATED_TO with ERFUELLT
      const result = await session.run(
        `MATCH (a:Entity)-[r:RELATED_TO]->(b:Entity)
         WHERE (a.kategorie='didaktik' AND b.kategorie='lehrplan')
            OR (a.kategorie='lehrplan' AND b.kategorie='didaktik')
         WITH a, b, r LIMIT 1000
         DELETE r
         MERGE (a)-[:ERFUELLT]->(b)
         RETURN count(*) AS cnt`,
      );
      console.log(`  Created ERFUELLT relationships: ${result.records[0].get('cnt')}`);
    }

    // Phase 3: Keep all non-didaktik↔lehrplan RELATED_TO as-is
    const remaining = await session.run(
      `MATCH (a)-[r:RELATED_TO]->(b)
       WHERE a.kategorie <> 'didaktik' OR b.kategorie <> 'lehrplan'
       RETURN count(*) AS cnt`,
    );
    console.log(`\n[upgrade-relations] Remaining RELATED_TO (untouched): ${remaining.records[0].get('cnt')}`);

    // Summary
    const finalRels = await session.run(
      `MATCH ()-[r]->()
       RETURN type(r) AS relType, count(*) AS cnt
       ORDER BY cnt DESC
       LIMIT 10`,
    );
    console.log('\n[upgrade-relations] Final relationship distribution:');
    for (const rec of finalRels.records) {
      console.log(`  ${rec.get('relType')}: ${rec.get('cnt')}`);
    }

    await session.close();
  } finally {
    await driver.close();
  }
}

run().catch((err) => {
  console.error('[upgrade-relations] FATAL:', err);
  process.exit(1);
});
