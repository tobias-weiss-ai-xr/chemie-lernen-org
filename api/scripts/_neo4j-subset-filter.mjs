#!/usr/bin/env node
/**
 * _neo4j-subset-filter.mjs — Central subset filter helper for the Neo4j KG.
 *
 * The `chemie` database (bolt://chemie-neo4j:7687, database name `chemie`)
 * is the **central knowledge graph** — it contains multiple subsets:
 *
 *   - Chemie subset: `Entity | Document | Tag | Content | Curriculum |
 *       Topic | SubTopic | LearningObjective | DidacticGuideline |
 *       GuidelineSection | LearningPath`
 *   - Code-analysis subset: ~683k nodes (Variable, Parameter, Function,
 *       Class, File, Module, Interface, …)
 *   - Modulhandbuch subset (planned): `University | Module | …`
 *   - More planned
 *
 * ALL chemie queries MUST scope to the chemie label set via subsetMatch()
 * to avoid leaking nodes from other subsets.
 *
 * Usage:
 *   import { subsetMatch, CHEMIE_LABELS } from '../scripts/_neo4j-subset-filter.mjs';
 *
 *   const session = driver.session({ database: 'chemie' });
 *   const result = await session.run(
 *     `MATCH (e) ${subsetMatch('e')}
 *      AND e.kategorie = 'konzept'
 *      RETURN e.name LIMIT 10`,
 *     {}
 *   );
 *
 * @module _neo4j-subset-filter
 */

// ── Chemie label set ───────────────────────────────────────────────────
// All labels that belong to the chemie subset. Every chemie-scoped Cypher
// query filters to these labels via subsetMatch().
export const CHEMIE_LABELS = [
  'Entity',
  'Document',
  'Tag',
  'Content',
  'Curriculum',
  'Topic',
  'SubTopic',
  'LearningObjective',
  'DidacticGuideline',
  'GuidelineSection',
  'LearningPath',
  'University',
  'UniversityModule',
  'Lecturer',
  'ModuleOffering',
  'Degree',
  'ECTS',
];

// Memoize the resolved WHERE clause strings so we don't join on every call.
const _matchCache = new Map();

/**
 * Resolve label aliases to concrete label sets.
 *
 * 'chemie' → the full CHEMIE_LABELS array
 * A specific label → [that label] (identity)
 */
function resolveLabels(labelsOrAlias) {
  if (Array.isArray(labelsOrAlias)) return labelsOrAlias;
  if (labelsOrAlias === 'chemie') return CHEMIE_LABELS;
  return [labelsOrAlias];
}

/**
 * Build the conditions array for a Cypher WHERE clause.
 * @param {string} ref - The Cypher variable to scope (e.g. 'n', 'e', 'd')
 * @param {string[]} labels - Array of label names
 * @returns {string} Cypher WHERE condition fragment
 */
function buildCondition(ref, labels) {
  return labels.map((l) => `${ref}:${l}`).join(' OR ');
}

/**
 * Generate a Cypher WHERE clause fragment scoping `ref` to the given labels.
 *
 * @param {string} ref - The Cypher variable/alias to scope
 * @param {string|string[]} [subset='chemie'] - Which subset to scope to.
 *   Pass 'chemie' (default) for the chemie subset, or a specific label array.
 * @returns {string} Cypher WHERE clause fragment, e.g. "WHERE (n:Entity OR n:Document)"
 *
 * @example
 *   // Scope entity query to chemie subset
 *   `MATCH (e) ${subsetMatch('e')} RETURN e.name`
 *
 *   // Scope to a single label
 *   `MATCH (d) ${subsetMatch('d', ['Document'])} RETURN d.title`
 */
export function subsetMatch(ref, subset) {
  const cacheKey = `${ref}:${JSON.stringify(subset || 'chemie')}`;
  const cached = _matchCache.get(cacheKey);
  if (cached) return cached;

  const labels = resolveLabels(subset || 'chemie');
  const result = `WHERE (${buildCondition(ref, labels)})`;
  _matchCache.set(cacheKey, result);
  return result;
}

/**
 * Generate a Cypher WHERE predicate that can be AND-ed with other conditions.
 * Unlike subsetMatch(), this returns just the parenthesised predicate
 * WITHOUT the `WHERE` keyword, so it can be combined:
 *
 *   WHERE ${subsetWhere('e')} AND e.kategorie = 'konzept'
 *
 * @param {string} ref - The Cypher variable to scope
 * @param {string|string[]} [subset='chemie'] - Which subset labels to scope to
 * @returns {string} Cypher predicate fragment, e.g. "(n:Entity OR n:Document)"
 */
export function subsetWhere(ref, subset) {
  const labels = resolveLabels(subset || 'chemie');
  return `(${buildCondition(ref, labels)})`;
}

/**
 * Check whether a given Cypher variable or node belongs to the chemie subset
 * by inspecting its labels. Useful in WITH clauses or post-processing.
 *
 * Usage in Cypher:
 *   WITH n, [l IN labels(n) WHERE l IN $chemieLabels] AS chemieLabels
 *   WHERE size(chemieLabels) > 0
 *
 * @returns {string[]} The array of chemie labels (for use as a Cypher $param)
 */
export function getChemieLabelsArray() {
  return CHEMIE_LABELS;
}

// ── Code-Analysis Name-Pattern Exclusion ────────────────────────────────
// Some nodes carry only `:Entity` with no chemie-specific label and no
// `kategorie` — these are often code-analysis entities leaked into the
// chemie subset. These patterns serve as a heuristic fallback.

export const CODE_ANALYSIS_NAME_PATTERNS = [
  'algorithm',
  'graph-',
  'network-',
  'data-structure',
  'vertex-',
  'edge-',
  'sorting',
  'traversal',
  'binary-',
  'hash-',
  '-queue',
  '-stack',
  'heap-',
  'tree-',
  'breadth-first',
  'depth-first',
  'shortest-path',
  'cycle-',
  'bipartite',
  'coloring',
  'matching',
  'dijkstra',
  'bellman-ford',
  'prim-',
  'kruskal',
  'floyd-warshall',
  'topological',
  'backtracking',
  'divide-and-conquer',
  'dynamic-programming',
  'greedy-',
  'priority-queue',
  'priority queue',
  'binary tree',
  'hash table',
  'data structure',
  'two-sum',
  'linked-list',
  'linked list',
  'linked list',
  'big-o',
  'time-complexity',
  'space-complexity',
  'bst ',
  'avl ',
  ' dfs ',
  ' bfs ',
  'lru ',
];

/**
 * Build a Cypher predicate to exclude code-analysis entities by name pattern.
 * @param {string} ref - The Cypher variable to scope
 * @returns {string} Cypher predicate, e.g. "NOT (n.name =~ '.*(?i:algorithm|graph-).*')"
 */
export function excludeCodeEntities(ref) {
  const joined = CODE_ANALYSIS_NAME_PATTERNS.join('|');
  return `NOT (${ref}.name =~ '.*(?i:${joined}).*')`;
}

/**
 * Runtime check whether an entity name matches code-analysis patterns.
 * @param {string} name - The entity name to check
 * @returns {boolean}
 */
export function isCodeAnalysisName(name) {
  if (!name || typeof name !== 'string') return false;
  // Strip parentheses and lowercase for matching
  var normalized = name.replace(/[()]/g, ' ').toLowerCase();
  return CODE_ANALYSIS_NAME_PATTERNS.some(function (p) {
    return normalized.indexOf(p.toLowerCase()) !== -1;
  });
}
