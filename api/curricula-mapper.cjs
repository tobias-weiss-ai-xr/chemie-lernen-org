/**
 * Curricula mapper — Part B Task 4 (+ live-schema fix).
 *
 * CentralQuery-Builder + pure record mapper for GET /api/curricula/by-state/:state.
 * Adds a per-topic `entities` list so the Curricula-Landkarte UI can chip-link
 * from every KMK topic to its Wissensnetz concepts. The KG links Topics to
 * Entities in two ways; BOTH are unioned (and additionally a text-based fallback
 * covers the observed live-data gap where neither direct relation exists):
 *   1. direct  (t)-[:COVERS_TOPIC]-(e:Entity)   (either direction, historically
 *      ambiguous — matched defensively both ways)
 *   2. indirect (t)-[:HAS_LEARNING_OBJECTIVE]->(lo)<-[:FULFILLS|FULFILLS_OBJECTIVE]
 *      -(e:Entity) — observed LIVE on Zink (COVERS_TOPIC was empty there while
 *      FULFILLS produced the curricular objectives).
 *   3. text    entity whose name occurs word-boundary in one of the topic's LO
 *      texts (EXISTS subquery; didactic: Lehrplantexte nennen die geforderten
 *      Konzepte). Text matches are filtered by a stopword list + word bounds so
 *      abbreviations/function words (e.g. "MIT") don't become graph chips.
 * All are de-duplicated (didactic caps: Lernziele ≤ 8, entities ≤ 12).
 */
'use strict';

const OBJECTIVES_CAP = 8;
const ENTITIES_CAP = 12;

/** Short function words that could false-positive as entity names in LO texts. */
const TEXT_MATCH_STOPWORDS = new Set([
  'mit', 'und', 'oder', 'der', 'die', 'das', 'ein', 'eine', 'einer', 'für',
  'von', 'auf', 'bei', 'zu', 'ist', 'sind', 'soll', 'können', 'werden',
  'nicht', 'auch', 'als', 'dass', 'es', 'im', 'am', 'in', 'den', 'dem',
]);

/** True if the entity is a meaningful text-mention candidate. */
function isTextMatchCandidate(name) {
  const n = String(name || '').trim();
  if (!n) return false;
  if (n.length < 3) return false;
  if (n.length > 80) return false;
  return !TEXT_MATCH_STOPWORDS.has(n.toLowerCase());
}

/** Cypher for the by-state tree — direct COVERS_TOPIC (both directions) UNION
 *  FULFILLS via learning objectives UNION word-boundary name mentions in LO
 *  texts.
 *
 *  PERF-2026-09-08: Das alte Text-Fallback-Matching war ein kartesisches
 *  Produkt Topic × Entity (321×14730 bei BY) mit einer pro-Paar
 *  EXISTS-Regex-Subquery — 15,8s / 44M DbHits für BY allein. Die neue
 *  Form bildet pro Topic EIN Token-Set aus den Lernziel-Texten (lower- +
 *  original-cased, damit Akronyme wie "H2O" treffen) und matched über
 *  `e4.name IN toks` mit dem entity_name_unique RANGE-Index → 0,64s /
 *  137k DbHits (24× schneller, ~320× weniger Hits). Semantik bleibt
 *  "Entity-Name als ganzes Wort in den Lernzielen" — der vorherige
 *  Regex verlangte ebenfalls Wortgrenzen; Ziffern/Bindestriche gelten
 *  als Grenze, Interpunktion wird durch replace zu Space. Textbasis ist
 *  die objectives-Sammlung (:FULFILLS) — Chips passen also zu den
 *  angezeigten Lernzielen. */
function buildByStateQuery() {
  // Interpunktion → Space, damit split(' ') ganze Wörter liefert
  // (äquivalent zur alten Wortgrenzen-Klasse [^a-zäöüß]).
  const PUNCT = ['.', ',', ';', ':', '!', '?', '(', ')', '"', "'", '/', '-', '–', '»', '«', '%'];
  const punctToSpace = (expr) =>
    PUNCT.reduce((acc, ch) => `replace(${acc}, '${ch === "'" ? "\\'" : ch}', ' ')`, expr);

  return `
MATCH (c:Curriculum {state_abbr: $state})
OPTIONAL MATCH (c)-[:HAS_SUBTOPIC]->(t:SubTopic)
OPTIONAL MATCH (t)-[:FULFILLS]->(lo:LearningObjective)
OPTIONAL MATCH (t)<-[:COVERS_TOPIC]-(e:Entity)
OPTIONAL MATCH (t)-[:COVERS_TOPIC]->(e2:Entity)
OPTIONAL MATCH (t)-[:FULFILLS]->(lo2:LearningObjective)<-[:FULFILLS|FULFILLS_OBJECTIVE]-(e3:Entity)
WITH c, t,
     collect(DISTINCT lo.text) AS objectives,
     collect(DISTINCT e.name) + collect(DISTINCT e2.name) + collect(DISTINCT e3.name) AS entities,
     reduce(s = '', x IN collect(DISTINCT lo.text) | CASE WHEN x IS NULL THEN s ELSE s + ' ' + x END) AS rawO,
     reduce(s = '', x IN collect(DISTINCT lo.text) | CASE WHEN x IS NULL THEN s ELSE s + ' ' + toLower(x) END) AS rawL
WITH c, t, objectives, entities,
     [tok IN split(${punctToSpace('rawL')}, ' ') WHERE size(tok) >= 3 AND size(tok) <= 80 | trim(tok)] +
     [tok IN split(${punctToSpace('rawO')}, ' ') WHERE size(tok) >= 3 AND size(tok) <= 80 | trim(tok)] AS toks
OPTIONAL MATCH (e4:Entity)
WHERE e4.name IN toks
WITH c, t, objectives, entities, collect(DISTINCT e4.name) AS textEnt
WITH c, t, objectives, entities + textEnt AS allEnt
RETURN c.slug AS curriculumSlug, c.school_type AS schoolType,
       t.slug AS slug, t.title AS title, t.grade AS grade,
       size([ob IN objectives WHERE ob IS NOT NULL]) AS objectiveCount,
       [ob IN objectives WHERE ob IS NOT NULL] AS objectives,
       [en IN allEnt WHERE en IS NOT NULL AND en <> ''] AS entities
ORDER BY t.grade, t.title`;
}

/**
 * Pure mapper from Cypher records (objects exposing .get(name)) to the public
 * JSON shape. Caps applied here — never in the UI.
 */
function mapCurriculumTopics(records) {
  return records.map(function (record) {
    const get = (k) => (record && typeof record.get === 'function' ? record.get(k) : record[k]);
    const rawCount = get('objectiveCount');
    const count =
      rawCount && typeof rawCount.toNumber === 'function'
        ? rawCount.toNumber()
        : Number(rawCount) || 0;
    const objectives = (get('objectives') || []).slice(0, OBJECTIVES_CAP);
    const entities = Array.from(new Set(get('entities') || [])).slice(0, ENTITIES_CAP);
    return {
      slug: get('slug'),
      title: get('title'),
      grade: get('grade'),
      schoolType: get('schoolType'),
      objectiveCount: count,
      objectives,
      entityCount: entities.length,
      entities,
    };
  });
}

module.exports = {
  buildByStateQuery,
  mapCurriculumTopics,
  isTextMatchCandidate,
  OBJECTIVES_CAP,
  ENTITIES_CAP,
};
