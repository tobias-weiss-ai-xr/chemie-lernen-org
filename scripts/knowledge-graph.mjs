/**
 * Knowledge Graph (Neo4j) Integration for chemie-lernen.org
 *
 * Connects the article pipeline to Neo4j for:
 *  - Storing generated articles as Document nodes
 *  - Cross-referencing articles with chemistry entities
 *  - Retrieving context for richer article generation
 */

import neo4j from 'neo4j-driver';
import { existsSync } from 'fs';

const { int } = neo4j;

// Detect container context by /.dockerenv marker
const IN_DOCKER = existsSync('/.dockerenv');
const DEFAULT_URI = IN_DOCKER ? 'bolt://chemie-neo4j:7687' : 'bolt://localhost:7687';
const NEO4J_URI = process.env.NEO4J_URI || DEFAULT_URI;
const NEO4J_USER = 'neo4j';
const NEO4J_PASSWORD = 'chemie';

let driver = null;

function getDriver() {
  if (!driver) {
    driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD));
  }
  return driver;
}

export async function close() {
  if (driver) {
    await driver.close();
    driver = null;
  }
}

/**
 * Store a generated article as a Document node.
 * Creates: (d:Document {title, source, date, url, tags, description})
 * Links to existing Tag nodes via :HAS_TAG
 */
export async function storeArticle({ title, source, date, description, tags, url }) {
  const d = getDriver();
  const session = d.session({ database: 'chemie' });
  try {
    const result = await session.run(
      `
      MERGE (d:Document {url: $url})
      ON CREATE SET
        d.title = $title,
        d.source = $source,
        d.date = $date,
        d.description = $description,
        d.tags = $tags,
        d.type = 'article',
        d.created = timestamp()
      ON MATCH SET
        d.title = $title,
        d.date = $date,
        d.description = $description,
        d.tags = $tags,
        d.updated = timestamp()
      WITH d
      UNWIND $tags AS tagName
        MERGE (t:Tag {name: toLower(tagName)})
        MERGE (d)-[:HAS_TAG]->(t)
      RETURN d.title as title, d.url as url
      `,
      { title, source: source || 'article-pipeline', date, description, tags: tags || [], url }
    );
    return result.records[0]?.get('url');
  } finally {
    await session.close();
  }
}

/**
 * Find existing Document nodes by tag overlap.
 * Returns articles that share at least one tag with the input.
 */
export async function findRelatedByTags(tags, limit = 5) {
  const d = getDriver();
  const session = d.session({ database: 'chemie' });
  try {
    const result = await session.run(
      `
      MATCH (d:Document)-[:HAS_TAG]->(t:Tag)
      WHERE t.name IN $tags AND d.type = 'article'
      WITH d, count(t) AS matches
      ORDER BY matches DESC
      RETURN d.title as title, d.url as url, d.date as date, matches
      LIMIT $limit
      `,
      { tags: tags.map((t) => t.toLowerCase()), limit: int(limit) }
    );
    return result.records.map((r) => ({
      title: r.get('title'),
      url: r.get('url'),
      date: r.get('date'),
      matches: r.get('matches').toNumber(),
    }));
  } finally {
    await session.close();
  }
}

/**
 * Find chemistry Entity nodes matching keywords.
 * Returns entities whose name contains any keyword.
 */
export async function findEntities(keywords, limit = 10) {
  const d = getDriver();
  const session = d.session({ database: 'chemie' });
  try {
    const result = await session.run(
      `
      MATCH (e:Entity)
      WHERE any(kw IN $keywords WHERE toLower(e.name) CONTAINS kw)
      RETURN e.name as name, labels(e) as labels, e.description as description
      LIMIT $limit
      `,
      { keywords: keywords.map((k) => k.toLowerCase()), limit: int(limit) }
    );
    return result.records.map((r) => ({
      name: r.get('name'),
      labels: r.get('labels'),
      description: r.get('description'),
    }));
  } finally {
    await session.close();
  }
}

/**
 * Get popular/recent tags (for dashboard or trending topics).
 */
export async function getPopularTags(limit = 20) {
  const d = getDriver();
  const session = d.session({ database: 'chemie' });
  try {
    const result = await session.run(
      `
      MATCH (t:Tag)<-[:HAS_TAG]-(:Document {type: 'article'})
      WITH t, count(*) AS articleCount
      ORDER BY articleCount DESC
      RETURN t.name as tag, articleCount
      LIMIT $limit
      `,
      { limit: int(limit) }
    );
    return result.records.map((r) => ({
      tag: r.get('tag'),
      count: r.get('articleCount').toNumber(),
    }));
  } finally {
    await session.close();
  }
}

/**
 * Store entities mentioned in an article.
 * Creates Entity nodes (if new) and :MENTIONS relationships.
 * Links via article URL to find the Document node.
 */
export async function storeEntities(articleUrl, entityNames) {
  if (!entityNames || entityNames.length === 0) return [];
  const d = getDriver();
  const session = d.session({ database: 'chemie' });
  try {
    const result = await session.run(
      `
      MATCH (d:Document {url: $url})
      UNWIND $names AS entityName
        MERGE (e:Entity {name: toLower(entityName)})
        ON CREATE SET
          e.created = timestamp(),
          e.lastMentioned = timestamp()
        ON MATCH SET
          e.lastMentioned = timestamp()
        MERGE (d)-[:MENTIONS]->(e)
      RETURN collect(distinct e.name) as entities
      `,
      { url: articleUrl, names: entityNames.map((e) => e.toLowerCase()) }
    );
    return result.records[0]?.get('entities') || [];
  } finally {
    await session.close();
  }
}

/**
 * Ensure entity→entity co-occurrence relationships.
 * Creates RELATED_TO between all entity pairs mentioned in the same document.
 */
async function createEntityRelationships(session, entities) {
  if (!entities || entities.length < 2) return;
  await session.run(
    `
    UNWIND $entities AS e1Name
    UNWIND $entities AS e2Name
    WITH e1Name, e2Name WHERE e1Name < e2Name
      MERGE (e1:Entity {name: e1Name})
      MERGE (e2:Entity {name: e2Name})
      MERGE (e1)-[r:RELATED_TO]-(e2)
      ON CREATE SET r.weight = 1, r.created = timestamp()
      ON MATCH SET r.weight = r.weight + 1
    `,
    { entities: entities.map((e) => e.toLowerCase()) }
  );
}

/**
 * Set entity categories (kategorie) extracted from LLM output.
 * entityCategories: { entityName: category }
 */
export async function setEntityCategories(entityCategories) {
  if (!entityCategories || Object.keys(entityCategories).length === 0) return;
  const d = getDriver();
  const session = d.session({ database: 'chemie' });
  try {
    await session.run(
      `
      UNWIND $cats AS cat
        MATCH (e:Entity {name: cat.name})
        SET e.kategorie = cat.category
      `,
      {
        cats: Object.entries(entityCategories).map(([name, category]) => ({
          name: name.toLowerCase(),
          category: category.toLowerCase(),
        })),
      }
    );
  } finally {
    await session.close();
  }
}

/**
 * Combination: store article + its entities + tags in one go.
 * Also creates entity→entity co-occurrence (RELATED_TO) relationships
 * between entities mentioned in the same article.
 */
export async function storeArticleWithEntities({ title, source, date, description, tags, entities, url, entityCategories }) {
  const d = getDriver();
  const session = d.session({ database: 'chemie' });
  try {
    const result = await session.run(
      `
      MERGE (d:Document {url: $url})
      ON CREATE SET
        d.title = $title,
        d.source = $source,
        d.date = $date,
        d.description = $description,
        d.tags = $tags,
        d.type = 'article',
        d.created = timestamp()
      ON MATCH SET
        d.title = $title,
        d.date = $date,
        d.description = $description,
        d.tags = $tags,
        d.updated = timestamp()
      WITH d
      UNWIND $tags AS tagName
        MERGE (t:Tag {name: toLower(tagName)})
        MERGE (d)-[:HAS_TAG]->(t)
      WITH d
      UNWIND $entities AS entityName
        MERGE (e:Entity {name: toLower(entityName)})
        ON CREATE SET
          e.created = timestamp(),
          e.lastMentioned = timestamp()
        ON MATCH SET
          e.lastMentioned = timestamp()
        MERGE (d)-[:MENTIONS]->(e)
      RETURN d.title as title, d.url as url
      `,
      { title, source: source || 'article-pipeline', date, description, tags: tags || [], entities: (entities || []).map((e) => e.toLowerCase()), url }
    );

    // Create entity→entity co-occurrence relationships
    if (entities && entities.length >= 2) {
      await createEntityRelationships(session, entities);
    }

    // Set entity categories if provided
    if (entityCategories && Object.keys(entityCategories).length > 0) {
      await session.run(
        `
        UNWIND $cats AS cat
          MATCH (e:Entity {name: cat.name})
          SET e.kategorie = cat.category
        `,
        {
          cats: Object.entries(entityCategories).map(([name, category]) => ({
            name: name.toLowerCase(),
            category: category.toLowerCase(),
          })),
        }
      );
    }

    return result.records[0]?.get('url');
  } finally {
    await session.close();
  }
}

export default { storeArticle, storeEntities, storeArticleWithEntities, findRelatedByTags, findEntities, getPopularTags, close };
