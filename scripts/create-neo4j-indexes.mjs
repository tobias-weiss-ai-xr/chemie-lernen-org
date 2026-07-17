#!/usr/bin/env node
/**
 * create-neo4j-indexes.mjs — Create Neo4j indexes for performance.
 *
 * Creates range and fulltext indexes for the chemie knowledge graph.
 * Idempotent: uses IF NOT EXISTS pattern.
 * Verifies with SHOW INDEXES at the end.
 *
 * Usage:  node scripts/create-neo4j-indexes.mjs
 * Env:    NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD, NEO4J_DATABASE
 */

import neo4j from 'neo4j-driver';

// ── Config ─────────────────────────────────────────────────────────────
var NEO4J_URI = process.env.NEO4J_URI || 'bolt://localhost:7687';
var NEO4J_USER = process.env.NEO4J_USER || 'neo4j';
var NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || 'chemie_knowledge_2024';
var NEO4J_DATABASE = process.env.NEO4J_DATABASE || 'chemie';

// ── Index definitions ──────────────────────────────────────────────────
var INDEXES = [
  {
    name: 'entity_name',
    description: 'Entity(name) range index',
    cypher:
      'CREATE RANGE INDEX entity_name IF NOT EXISTS FOR (n:Entity) ON (n.name)',
  },
  {
    name: 'document_url',
    description: 'Document(url) range index',
    cypher:
      'CREATE RANGE INDEX document_url IF NOT EXISTS FOR (n:Document) ON (n.url)',
  },
  {
    name: 'curriculum_state_grade',
    description: 'Curriculum(state, grade) composite range index',
    cypher:
      'CREATE RANGE INDEX curriculum_state_grade IF NOT EXISTS FOR (n:Curriculum) ON (n.state, n.grade)',
  },
  {
    name: 'content_title',
    description: 'Content(title) range index',
    cypher:
      'CREATE RANGE INDEX content_title IF NOT EXISTS FOR (n:Content) ON (n.title)',
  },
  {
    name: 'learning_objective_description',
    description: 'LearningObjective(description) fulltext index',
    cypher:
      'CREATE FULLTEXT INDEX learning_objective_description IF NOT EXISTS FOR (n:LearningObjective) ON EACH [n.description]',
  },
];

// ── Main ───────────────────────────────────────────────────────────────
async function main() {
  console.log(
    '[create-neo4j-indexes] Connecting to Neo4j: ' + NEO4J_URI
  );

  var driver = neo4j.driver(
    NEO4J_URI,
    neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD),
    {
      connectionTimeout: 10000,
    }
  );

  var session = driver.session({
    database: NEO4J_DATABASE,
    defaultAccessMode: neo4j.session.WRITE,
  });

  try {
    // ── Create indexes ──────────────────────────────────────────────
    for (var i = 0; i < INDEXES.length; i++) {
      var idx = INDEXES[i];
      console.log(
        '[create-neo4j-indexes] Creating index: ' +
          idx.name +
          ' (' +
          idx.description +
          ')...'
      );
      try {
        await session.run(idx.cypher);
        console.log('[create-neo4j-indexes]  ✓ ' + idx.name);
      } catch (err) {
        console.error(
          '[create-neo4j-indexes]  ✗ ' +
            idx.name +
            ': ' +
            err.message
        );
      }
    }

    // ── SHOW INDEXES verification ───────────────────────────────────
    console.log(
      '[create-neo4j-indexes] Verifying indexes with SHOW INDEXES...'
    );
    var result = await session.run('SHOW INDEXES');
    console.log(
      '[create-neo4j-indexes] Existing indexes (' +
        result.records.length +
        '):'
    );
    result.records.forEach(function (rec) {
      var name = rec.get('name');
      var type = rec.get('type');
      var labelsOrTypes = rec.get('labelsOrTypes');
      var properties = rec.get('properties');
      var status = rec.get('status');
      var populationPercent = rec.get('populationPercent');
      console.log(
        '  - ' +
          name +
          ' (' +
          type +
          ') on ' +
          JSON.stringify(labelsOrTypes) +
          '.' +
          JSON.stringify(properties) +
          ' [' +
          status +
          ']' +
          (populationPercent != null ? ' ' + populationPercent + '%' : '')
      );
    });

    console.log('[create-neo4j-indexes] Done.');
  } catch (err) {
    console.error(
      '[create-neo4j-indexes] ERROR: ' + err.message
    );
    process.exit(1);
  } finally {
    await session.close();
    await driver.close();
  }
}

main();
