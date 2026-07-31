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
