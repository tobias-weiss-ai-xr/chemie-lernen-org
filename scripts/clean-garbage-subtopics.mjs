#!/usr/bin/env node
/**
 * Clean garbage SubTopics with >500 LearningObjectives
 * These are catch-all nodes from failed PDF scrapes.
 * 
 * Safely removes FULFILLS relationships from garbage SubTopics.
 * Does NOT delete the SubTopics or LOs (preserves data).
 */
import neo4j from 'neo4j-driver';

const NEO4J_URI = process.env.NEO4J_URI || 'bolt://localhost:7688';
const NEO4J_USER = process.env.NEO4J_USER || 'neo4j';
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || 'chemie_knowledge_2024';
const NEO4J_DATABASE = process.env.NEO4J_DATABASE || 'chemie';

const DRY_RUN = process.argv.includes('--dry-run');

const CLEAR_GARBAGE_SLUGS = new Set([
  'HH-gymnasium-sek-i-kompetenzen-und-inhalte-des-faches-chemie-topic',
  'HB-gymnasiale-oberstufe-gyo-gymnasiale-oberstufe-chemie-topic',
  'TH-gymnasium-ahr-bildungsstandards-im-fach-chemie-fuer-die-allgemeine-hochsch-topic',
  'ST-gymnasium-das-dreistuendige-wahlpflichtfach-entspricht-dem-grundlegend-topic',
  'HE-gymnasium-oberstufe-bildungsstandards-und-unterrichtsinhalte-topic',
]);

async function main() {
  console.log('=== Clean garbage SubTopics ===');
  console.log('DRY_RUN:', DRY_RUN);

  const driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD));
  const session = driver.session({ database: NEO4J_DATABASE });

  try {
    // Find clear garbage SubTopics by exact slug match
    const result = await session.run(
      `MATCH (st:SubTopic)
       WHERE st.slug IN $slugs
       WITH st
       OPTIONAL MATCH (st)-[:FULFILLS]->(lo:LearningObjective)
       WITH st, count(lo) as loCount
       RETURN st.slug as slug, st.title as title, loCount
       ORDER BY loCount DESC`,
      { slugs: Array.from(CLEAR_GARBAGE_SLUGS) }
    );

    const garbage = result.records.map(r => ({
      slug: r.get('slug'),
      title: r.get('title'),
      loCount: r.get('loCount'),
    }));

    console.log(`Found ${garbage.length} garbage SubTopics:`);
    garbage.forEach(g => console.log(`  ${g.slug.slice(0, 60)} - ${g.title} (${g.loCount} LOs)`));

    if (DRY_RUN) {
      console.log('\nDry run - nothing deleted.');
      return;
    }

    // First, preserve the LOs by disconnecting them from garbage SubTopics
    for (const g of garbage) {
      console.log(`\nCleaning ${g.slug} (${g.loCount} LOs)...`);
      
      // Remove FULFILLS relationships from this SubTopic
      const deleteRelResult = await session.run(
        `MATCH (st:SubTopic {slug: $slug})-[r:FULFILLS]->(lo:LearningObjective)
         DELETE r
         RETURN count(*) as deletedRels`,
        { slug: g.slug }
      );
      const deletedRels = deleteRelResult.records[0].get('deletedRels');
      console.log(`  → Deleted ${deletedRels} FULFILLS relationships`);

      // Remove COVERS_TOPIC relationships TO this SubTopic
      const deleteCoversResult = await session.run(
        `MATCH (e:Entity)-[r:COVERS_TOPIC]->(st:SubTopic {slug: $slug})
         DELETE r
         RETURN count(*) as deletedCovers`,
        { slug: g.slug }
      );
      const deletedCovers = deleteCoversResult.records[0].get('deletedCovers');
      console.log(`  → Deleted ${deletedCovers} COVERS_TOPIC relationships`);

      // Check if this state has other valid SubTopics
      const validCheck = await session.run(
        `MATCH (c:Curriculum)-[:HAS_SUBTOPIC]->(st2:SubTopic)
         WHERE split(c.slug, '-')[0] = split($slug, '-')[0]
         AND st2.slug <> $slug
         RETURN count(st2) as otherTopics`,
        { slug: g.slug }
      );
      const otherTopics = validCheck.records[0].get('otherTopics');
      const state = g.slug.split('-')[0];
      
      // If state has NO other topics, delete the SubTopic and its curriculum relationships
      if (otherTopics === 0) {
        await session.run(
          `MATCH (c:Curriculum)-[r:HAS_SUBTOPIC]->(st:SubTopic {slug: $slug})
           DELETE r, st`,
          { slug: g.slug }
        );
        console.log(`  → Deleted SubTopic and HAS_SUBTOPIC relationship (state ${state} has no other topics)`);
      } else {
        // If state has other valid topics, keep SubTopic but orphan it
        await session.run(
          `MATCH (c:Curriculum)-[r:HAS_SUBTOPIC]->(st:SubTopic {slug: $slug})
           DELETE r`,
          { slug: g.slug }
        );
        console.log(`  → Orphaned SubTopic (state ${state} has ${otherTopics} other topics)`);
      }
    }

    console.log('\nDone!');

  } finally {
    await session.close();
    await driver.close();
  }
}

main().catch(console.error);
