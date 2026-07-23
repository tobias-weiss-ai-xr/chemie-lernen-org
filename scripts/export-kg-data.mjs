#!/usr/bin/env node
/**
 * export-kg-data.mjs — Neo4j → kg_data.json Export Script.
 *
 * Reads the same Cypher queries as the /api/kg-data Express endpoint
 * and writes the result to myhugoapp/data/kg_data.json.
 *
 * Usage:  node scripts/export-kg-data.mjs
 * Env:    NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD, NEO4J_DATABASE
 */

import neo4j from 'neo4j-driver';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { isCodeAnalysisName, excludeCodeEntities } from './_neo4j-subset-filter.mjs';

// NOTE: The `:Entity` label alone is NOT sufficient — code-analysis nodes
// (Variable, Function, Class, etc.) also carry the :Entity label. We MUST
// explicitly exclude them.
const CODE_ANALYSIS_LABELS = [
  'Variable',
  'Parameter',
  'Function',
  'Class',
  'File',
  'Module',
  'Interface',
  'Directory',
  'Repository',
  'Macro',
  'Struct',
  'Enum',
  'Episodic',
];

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Config ─────────────────────────────────────────────────────────────
const NEO4J_URI = process.env.NEO4J_URI || 'bolt://localhost:7687';
const NEO4J_USER = process.env.NEO4J_USER || 'neo4j';
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || 'chemie_knowledge_2024';
const NEO4J_DATABASE = process.env.NEO4J_DATABASE || 'chemie';

const TARGET = path.resolve(__dirname, '..', 'myhugoapp', 'data', 'kg_data.json');

// Configurable row limits. Defaults lifted from 500 to 5000/10000 — the
// previous hard caps silently truncated the export when the graph grew
// beyond them. Override with env vars for very large knowledge bases.
const LIMIT_ENTITIES = parseInt(process.env.LIMIT_ENTITIES || '5000', 10);
const LIMIT_ARTICLES = parseInt(process.env.LIMIT_ARTICLES || '10000', 10);
const LIMIT_CURRICULA = parseInt(process.env.LIMIT_CURRICULA || '5000', 10);
const MAX_ARTICLES_PER_ENTITY = parseInt(process.env.MAX_ARTICLES_PER_ENTITY || '20', 10);

// ── Rate-limit helper ──────────────────────────────────────────────────
function delay(ms) {
  return new Promise(function (resolve) {
    setTimeout(resolve, ms);
  });
}

async function runQuery(session, cypher, params, label, retries) {
  retries = retries || 2;
  for (var attempt = 1; attempt <= retries; attempt++) {
    try {
      var result = await session.run(cypher, params || {});
      return result;
    } catch (err) {
      if (attempt < retries && err.code && err.code === 'SessionExpired') {
        console.warn(
          '[export-kg-data] Session expired, retrying ' +
            label +
            ' (' +
            attempt +
            '/' +
            retries +
            ')...'
        );
        await delay(1000 * attempt);
        continue;
      }
      throw err;
    }
  }
}

async function main() {
  console.log('[export-kg-data] Connecting to Neo4j: ' + NEO4J_URI);

  var driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD), {
    connectionTimeout: 10000,
  });

  var session = driver.session({
    database: NEO4J_DATABASE,
    defaultAccessMode: neo4j.session.READ,
    fetchSize: 1000,
  });

  try {
    // ── 1. Entities ──────────────────────────────────────────────────
    console.log('[export-kg-data] Querying entities...');
    var entitiesResult = await runQuery(
      session,
      `
      MATCH (e:Entity)
      WHERE (e.kategorie IS NULL OR NOT (e.kategorie IN ['lernziel', 'lehrplan', 'didaktik']))
        AND NONE(lbl IN labels(e) WHERE lbl IN $excludeLabels)
        AND ${excludeCodeEntities('e')}
      OPTIONAL MATCH (e)-[:RELATED_TO|ERFUELLT]-(related:Entity)
      OPTIONAL MATCH (e)-[:BESTEHT_AUS]->(component:Entity)
      RETURN e.name as name, e.kategorie as category,
             collect(DISTINCT related.name) as relatedEntities,
             collect(DISTINCT component.name) as components,
             COUNT { (d:Document)-[:MENTIONS]->(e) } as articleCount
      ORDER BY articleCount DESC
      LIMIT $limit
      `,
      { limit: neo4j.int(LIMIT_ENTITIES), excludeLabels: CODE_ANALYSIS_LABELS },
      'entities'
    );

    var entities = entitiesResult.records
      .map(function (r, i) {
        var name = r.get('name');
        return {
          id: 'e' + i,
          name: name,
          category: r.get('category') || 'konzept',
          articles: [],
          relatedEntities: (r.get('relatedEntities') || []).filter(function (n) {
            return n !== null;
          }),
          components: (r.get('components') || []).filter(function (n) {
            return n !== null;
          }),
          articleCount: neo4j.integer.toNumber(r.get('articleCount') || 0),
        };
      })
      .filter(function (e) {
        return !isCodeAnalysisName(e.name);
      });

    // ── 2. Articles ──────────────────────────────────────────────────
    console.log('[export-kg-data] Querying articles (' + entities.length + ' entities)...');
    var entityNames = entities.map(function (e) {
      return e.name;
    });
    var articlesResult = await runQuery(
      session,
      `
      MATCH (d:Document)-[:MENTIONS]->(e:Entity)
      WHERE e.name IN $entityNames
      RETURN d.title as title, d.url as url, d.type as type,
             collect(e.name) as entities, d.date as date
      ORDER BY d.type, d.date DESC
      LIMIT $limit
      `,
      {
        entityNames: entityNames.slice(0, MAX_ARTICLES_PER_ENTITY),
        limit: neo4j.int(LIMIT_ARTICLES),
      },
      'articles'
    );

    var articles = articlesResult.records
      .map(function (r, i) {
        var url = r.get('url');
        if (!url) return null; // skip documents without URL
        return {
          id: 'a' + i,
          title: r.get('title'),
          url: url,
          type: r.get('type') || 'article',
          entities: r.get('entities') || [],
          date: r.get('date'),
        };
      })
      .filter(Boolean);

    // Link articles to entities
    entities.forEach(function (entity) {
      entity.articles = articles
        .filter(function (a) {
          return a.entities.indexOf(entity.name) !== -1;
        })
        .map(function (a) {
          return a.title;
        });
    });

    // ── 3. Curricula (lehrplan only) ──────────────────────────────────
    console.log('[export-kg-data] Querying curricula...');
    var curriculaResult = await runQuery(
      session,
      `
      MATCH (e:Entity {kategorie: 'lehrplan'})
      OPTIONAL MATCH (e)-[:RELATED_TO|ERFUELLT]-(related:Entity)
      RETURN e.name as name, e.kategorie as category,
             e.state as state, e.grade as grade,
             e.school_type as school_type,
             e.objective_count as objective_count,
             collect(DISTINCT related.name) as relatedEntities
      ORDER BY e.name
      LIMIT $limit
      `,
      { limit: neo4j.int(LIMIT_CURRICULA) },
      'curricula'
    );

    var curricula = curriculaResult.records.map(function (r, i) {
      var objCount = r.get('objective_count');
      return {
        id: 'c' + i,
        name: r.get('name'),
        category: r.get('category') || 'lehrplan',
        curriculumMeta: {
          state: r.get('state'),
          grade: r.get('grade'),
          school_type: r.get('school_type'),
          objective_count: neo4j.integer.toNumber(objCount || 0),
        },
        articles: [],
        relatedEntities: (r.get('relatedEntities') || []).filter(function (n) {
          return n !== null;
        }),
        articleCount: 0,
      };
    });

    // ── 4. Write output ──────────────────────────────────────────────
    var output = {
      exportedAt: new Date().toISOString(),
      source: 'neo4j',
      entities: entities,
      articles: articles,
      curricula: curricula,
    };

    var dir = path.dirname(TARGET);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(TARGET, JSON.stringify(output, null, 2), 'utf-8');
    console.log('[export-kg-data] Written: ' + TARGET);
    console.log(
      '[export-kg-data] ' +
        entities.length +
        ' entities, ' +
        articles.length +
        ' articles, ' +
        curricula.length +
        ' curricula'
    );
  } catch (err) {
    console.error('[export-kg-data] ERROR: ' + err.message);
    console.error('[export-kg-data] Existing file (if any) was NOT modified.');
    process.exit(1);
  } finally {
    await session.close();
    await driver.close();
  }
}

main();
