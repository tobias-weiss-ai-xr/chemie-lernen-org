#!/usr/bin/env node
/**
 * Delete orphaned garbage SubTopics (no incoming HAS_SUBTOPIC)
 * These are from failed PDF scrapes and have been disconnected.
 */
import neo4j from 'neo4j-driver';

const NEO4J_URI = process.env.NEO4J_URI || 'bolt://localhost:7688';
const NEO4J_USER = process.env.NEO4J_USER || 'neo4j';
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || 'chemie_knowledge_2024';
const NEO4J_DATABASE = process.env.NEO4J_DATABASE || 'chemie';

const DRY_RUN = process.argv.includes('--dry-run');

const ORPHANED_GARBAGE_SLUGS = new Set([
  'HH-gymnasium-sek-i-kompetenzen-und-inhalte-des-faches-chemie-topic',
  'HB-gymnasiale-oberstufe-gyo-gymnasiale-oberstufe-chemie-topic',
  'TH-gymnasium-ahr-bildungsstandards-im-fach-chemie-fuer-die-allgemeine-hochsch-topic',
  'ST-gymnasium-das-dreistuendige-wahlpflichtfach-entspricht-dem-grundlegend-topic',
  'HE-gymnasium-oberstufe-bildungsstandards-und-unterrichtsinhalte-topic',
  'HE-gymnasium-oberstufe-wiesbaden-topic',  // Also garbage
]);

async function main() {
  console.log('=== Delete orphaned garbage SubTopics ===');
  console.log('DRY_RUN:', DRY_RUN);

  const driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD));
  const session = driver.session({ database: NEO4J_DATABASE });

  try {
    // Find orphaned or garbage SubTopics
    const result = await session.run(
      `MATCH (st:SubTopic)
       WHERE st.slug IN $slugs
       OPTIONAL MATCH (c:Curriculum)-[:HAS_SUBTOPIC]->(st)
       WITH st, count(c) as currCount, count{(st)-[:FULFILLS]->()} as loCount
       RETURN st.slug as slug, st.title as title, currCount as currCount, loCount as loCount`,
      { slugs: Array.from(ORPHANED_GARBAGE_SLUGS) }
    );

    const orphans = result.records.map(r => ({
      slug: r.get('slug'),
      title: r.get('title'),
      currCount: r.get('currCount'),
      loCount: r.get('loCount'),
    }));

    console.log(`Found ${orphans.length} orphaned/garbage SubTopics:`);
    orphans.forEach(o => console.log(`  ${o.slug.slice(0, 60)} - "${o.title}" (curr=${o.currCount}, LOs=${o.loCount})`));

    if (DRY_RUN) {
      console.log('\nDry run - nothing deleted.');
      return;
    }

    for (const o of orphans) {
      console.log(`\nDeleting ${o.slug}...`);
      
      // First delete all relationships FROM the SubTopic
      // This includes FULFILLS and any others
      await session.run(
        `MATCH (st:SubTopic {slug: $slug})-[r]->() DELETE r`,
        { slug: o.slug }
      );
      console.log(`  → Deleted outgoing relationships`);

      // Then delete all relationships TO the SubTopic  
      await session.run(
        `MATCH ()-[r]->(st:SubTopic {slug: $slug}) DELETE r`,
        { slug: o.slug }
      );
      console.log(`  → Deleted incoming relationships`);

      // Finally delete the SubTopic itself
      await session.run(
        `MATCH (st:SubTopic {slug: $slug}) DELETE st`,
        { slug: o.slug }
      );
      console.log(`  → Deleted SubTopic`);
    }

    console.log('\nDone!');

  } finally {
    await session.close();
    await driver.close();
  }
}

main().catch(console.error);
