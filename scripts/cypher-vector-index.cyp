/**
 * cypher-vector-index.cyp — Neo4j vector index creation for semantic search.
 *
 * Creates vector indexes on Entity, Topic, UniversityModule, and Content nodes
 * to support semantic search via db.index.vector.queryNodes().
 *
 * Usage in Neo4j Browser or cypher-shell:
 *   :source scripts/cypher-vector-index.cyp
 *
 * Or via curl:
 *   curl -X POST http://localhost:7474/db/neo4j/tx/commit \
 *     -H "Content-Type: application/json" \
 *     -H "Authorization: Basic $(echo -n 'neo4j:password' | base64)" \
 *     -d '{"statements": ["source scripts/cypher-vector-index.cyp"]}'
 *
 * Requirements:
 *   - Neo4j 5.26+ (vector index support)
 *   - Embeddings must already exist as node properties (use update-embeddings.mjs)
 *
 * Idempotent: uses IF NOT EXISTS. Safe to re-run.
 */

// ── Vector index configuration ──────────────────────────────────────────────
// Embedding dimension (all-MiniLM-L6-v2 = 384)
:param vectorDimension => 384;

// Similarity function: cosine, euclidean, or dotproduct
:param similarityFunction => 'cosine';

// ── Entity vector index ────────────────────────────────────────────────────
// Used for semantic search on chemistry concepts, substances, reactions, etc.
// Embeddings stored in: n.embedding (Float[])
// Fallback text: n.name + ' ' + n.description

CREATE VECTOR INDEX entity_embeddings IF NOT EXISTS
FOR (n:Entity)
ON (n.embedding)
OPTIONS { indexConfig: { vectorDimension: $vectorDimension, similarityFunction: $similarityFunction } };

// Verify Entity index
SHOW INDEXES YIELD name, type, entityType, labelsOrTypes, properties, options
WHERE name = 'entity_embeddings'
RETURN *;

// ── Topic vector index ─────────────────────────────────────────────────────
// Used for semantic search on curriculum topics
// Embeddings stored in: n.embedding (Float[])
// Fallback text: n.title

CREATE VECTOR INDEX topic_embeddings IF NOT EXISTS
FOR (n:Topic)
ON (n.embedding)
OPTIONS { indexConfig: { vectorDimension: $vectorDimension, similarityFunction: $similarityFunction } };

// Verify Topic index
SHOW INDEXES YIELD name, type, entityType, labelsOrTypes, properties, options
WHERE name = 'topic_embeddings'
RETURN *;

// ── UniversityModule vector index ──────────────────────────────────────────
// Used for semantic search on university modules (international catalog)
// Embeddings stored in: n.embedding (Float[])
// Fallback text: n.module_name + ' ' + n.description + ' ' + n.learning_outcomes

CREATE VECTOR INDEX universitymodule_embeddings IF NOT EXISTS
FOR (n:UniversityModule)
ON (n.embedding)
OPTIONS { indexConfig: { vectorDimension: $vectorDimension, similarityFunction: $similarityFunction } };

// Verify UniversityModule index
SHOW INDEXES YIELD name, type, entityType, labelsOrTypes, properties, options
WHERE name = 'universitymodule_embeddings'
RETURN *;

// ── Content vector index ───────────────────────────────────────────────────
// Used for semantic search on content pages (articles, guides)
// Embeddings stored in: n.embedding (Float[])
// Fallback text: n.title + ' ' + n.description

CREATE VECTOR INDEX content_embeddings IF NOT EXISTS
FOR (n:Content)
ON (n.embedding)
OPTIONS { indexConfig: { vectorDimension: $vectorDimension, similarityFunction: $similarityFunction } };

// Verify Content index
SHOW INDEXES YIELD name, type, entityType, labelsOrTypes, properties, options
WHERE name = 'content_embeddings'
RETURN *;

// ── Summary of all vector indexes ──────────────────────────────────────────
SHOW INDEXES YIELD name, type, entityType, labelsOrTypes, properties, options
WHERE type = 'VECTOR'
RETURN *
ORDER BY name;

// ── Example semantic search queries (for documentation) ────────────────────
/*
// Query Entity nodes by semantic similarity
CALL db.index.vector.queryNodes('entity_embeddings', 10, $embedding)
YIELD node, score
RETURN node.name AS name, node.description AS description, score
ORDER BY score DESC;

// Query multiple label types
CALL db.index.vector.queryNodes('entity_embeddings', 5, $embedding)
YIELD node, score
WHERE node:Entity
RETURN node.name AS name, 'Entity' AS label, score
UNION
CALL db.index.vector.queryNodes('topic_embeddings', 5, $embedding)
YIELD node, score
WHERE node:Topic
RETURN node.title AS name, 'Topic' AS label, score
ORDER BY score DESC
LIMIT 10;
*/