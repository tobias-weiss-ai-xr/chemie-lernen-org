/**
 * Fetch new entities from Knowledge Graph for last N days
 */

import neo4j from 'neo4j-driver';

const NEO4J_URI = process.env.NEO4J_URI || 'bolt://chemie-kg:7687';
const NEO4J_USER = process.env.NEO4J_USER || 'neo4j';
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || 'neo4jpassword';

const driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD));

async function fetchNewEntities(days) {
  const session = driver.session();

  const query = `
    MATCH (e:Entity)
    WHERE e.created_at > datetime() - duration('P${days}D')
    OPTIONAL MATCH (e)-[:RELATED_TO]->(r)
    WITH e, count(r) as related_count
    OPTIONAL MATCH (d:Document)-[:MENTIONS]->(e)
    WITH e, related_count, count(d) as document_count
    RETURN e
      ORDER BY document_count DESC
      LIMIT 10
  `;

  try {
    const result = await session.run(query);
    const entities = result.records.map(record => ({
      name: record.get('e').properties.name,
      description: record.get('e').properties.description || '',
      related_count: record.get('related_count'),
      document_count: record.get('document_count'),
      created_at: record.get('e').properties.created_at || new Date().toISOString()
    }));

    return entities;
  } finally {
    await session.close();
  }
}

async function main() {
  const daysArg = process.argv[2];
  const days = daysArg ? parseInt(daysArg, 10) : 7;

  const entities = await fetchNewEntities(days);

  console.log(JSON.stringify(entities, null, 2));

  await driver.close();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { fetchNewEntities };
