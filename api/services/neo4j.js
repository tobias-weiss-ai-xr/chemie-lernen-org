/**
 * Neo4j driver service — singleton driver instance for the knowledge graph.
 * Lazy-initialized, reuses connection across the app lifecycle.
 */

import neo4j from 'neo4j-driver';

const NEO4J_URI = process.env.NEO4J_URI || 'bolt://chemie-neo4j:7687';
const NEO4J_USER = process.env.NEO4J_USER || 'neo4j';
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || 'chemie_knowledge_2024';
const NEO4J_DATABASE = process.env.NEO4J_DATABASE || 'chemie';

let neo4jDriver = null;

/**
 * Get or initialize the Neo4j driver singleton.
 * @returns {object} Neo4j driver instance
 */
export function getNeo4jDriver() {
  if (!neo4jDriver) {
    neo4jDriver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD), {
      connectionTimeout: 5000,
    });
  }
  return neo4jDriver;
}

/**
 * Close the Neo4j driver connection.
 */
export async function closeNeo4jDriver() {
  if (neo4jDriver) {
    await neo4jDriver.close();
    neo4jDriver = null;
  }
}

export { NEO4J_DATABASE };

/**
 * Convert a JS number to a Neo4j INTEGER parameter value.
 *
 * Neo4j 5.x rejects floats for LIMIT/SKIP and similar integer-only
 * parameters. The neo4j-driver 6.x sends plain JS numbers as FLOAT
 * (e.g. 20 → 20.0), which breaks `LIMIT $limit` with
 * "Expected 'value' to be of type INTEGER ... but found 20.0".
 * Use this helper for any integer-typed Cypher parameter.
 *
 * @param {number|string|null|undefined} val - Value to coerce to an INTEGER
 * @returns {object} neo4j Integer instance
 */
export function toNeoInt(val) {
  const n = Number.isFinite(val) ? val : Number(val);
  return neo4j.int(Number.isFinite(n) ? n : 0);
}

/**
 * Safely convert a Neo4j value to a JS number.
 * Neo4j may return Integer objects (lossless), plain numbers, or floats —
 * depending on how the property was stored. `.toNumber()` only exists on
 * Integer objects and throws for Float/Number values, so this helper
 * normalizes all of them.
 * @param {*} val - Neo4j value (Integer, number, string, or null/undefined)
 * @returns {number} numeric value or 0 for null/undefined/NaN
 */
export function toNumberSafe(val) {
  if (val == null) return 0;
  if (typeof val === 'number') return Number.isFinite(val) ? val : 0;
  if (typeof val === 'string') {
    const n = Number(val);
    return Number.isFinite(n) ? n : 0;
  }
  if (typeof val.toNumber === 'function') {
    const n = val.toNumber();
    return Number.isFinite(n) ? n : 0;
  }
  const n = Number(val);
  return Number.isFinite(n) ? n : 0;
}
