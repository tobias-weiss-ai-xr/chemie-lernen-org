/**
 * RAG service — Retrieval-Augmented Generation for the chat API.
 * Provides entity extraction, Neo4j context retrieval, and prompt building.
 */

import fs from 'fs';
import path from 'path';
import neo4j from 'neo4j-driver';
import pino from 'pino';
import ragHelpers from '../_rag-helpers.cjs';
import { getNeo4jDriver, NEO4J_DATABASE } from './neo4j.js';
import { getFallbackData } from './content.js';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  ...(process.env.NODE_ENV !== 'production' && {
    transport: { target: 'pino-pretty', options: { colorize: true } },
  }),
});

// ── Stop words ─────────────────────────────────────────────────

export const STOP_WORDS = new Set([
  'der',
  'die',
  'das',
  'den',
  'dem',
  'des',
  'ein',
  'eine',
  'einen',
  'einem',
  'eines',
  'und',
  'oder',
  'aber',
  'sondern',
  'doch',
  'denn',
  'also',
  'nicht',
  'kein',
  'keine',
  'ist',
  'sind',
  'war',
  'wird',
  'werden',
  'wurde',
  'wurden',
  'hat',
  'haben',
  'hast',
  'mit',
  'von',
  'aus',
  'bei',
  'nach',
  'zu',
  'zur',
  'zum',
  'in',
  'im',
  'an',
  'am',
  'auf',
  'für',
  'gegen',
  'durch',
  'über',
  'unter',
  'neben',
  'vor',
  'hinter',
  'zwischen',
  'wie',
  'als',
  'was',
  'wer',
  'wen',
  'wem',
  'wessen',
  'dass',
  'weil',
  'wenn',
  'ob',
  'the',
  'a',
  'an',
  'is',
  'are',
  'was',
  'were',
  'been',
  'have',
  'has',
  'had',
  'do',
  'does',
  'did',
  'will',
  'would',
  'can',
  'could',
  'may',
  'might',
  'shall',
  'should',
  'of',
  'to',
  'for',
  'with',
  'by',
  'at',
  'from',
  'into',
  'onto',
  'upon',
  'bitte',
  'danke',
  'gern',
  'gerne',
  'sehr',
  'vielen',
  'viel',
  'was',
  'wie',
  'wo',
  'wann',
  'warum',
  'weshalb',
  'wieso',
  'mir',
  'mich',
  'dir',
  'dich',
  'ihm',
  'ihn',
  'ihr',
  'uns',
  'euch',
  'diese',
  'dieser',
  'dieses',
  'jene',
  'jener',
  'jenes',
  'solche',
  'solcher',
  'man',
  'jemand',
  'niemand',
  'etwas',
  'nichts',
  'alle',
  'jeder',
  'jede',
  'jedes',
  'aber',
  'auch',
  'nur',
  'noch',
  'schon',
  'erst',
  'immer',
  'wieder',
  'nochmal',
  'tut',
  'tue',
  'tust',
  'tun',
  'mach',
  'mache',
  'machst',
  'machen',
  'sagen',
  'sag',
  'sage',
  'sagst',
  'sagen',
  'meinen',
  'mein',
  'meine',
]);

// ── RAG cache ──────────────────────────────────────────────────

const ragCache = new Map();
const RAG_CACHE_MAX = 100;

const { buildSystemPrompt, extractSourceNames } = ragHelpers;

export { buildSystemPrompt, extractSourceNames };

// Minimal LRU cache for RAG contexts (100 entries)
setInterval(function () {
  if (ragCache.size > RAG_CACHE_MAX) {
    ragCache.clear();
  }
}, 60000);

// ── Calc RAG index ─────────────────────────────────────────────

var _calcRagIndex = null;
function getCalcRagIndex() {
  if (_calcRagIndex) return _calcRagIndex;
  try {
    var indexPath = path.join(
      path.dirname(new URL(import.meta.url).pathname),
      '..',
      'calc-rag-index.json'
    );
    _calcRagIndex = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
  } catch (err) {
    logger.warn(
      { err: err, message: err.message || String(err) },
      '[calc-rag] Failed to load calc-rag-index.json'
    );
    _calcRagIndex = {};
  }
  return _calcRagIndex;
}

// ── Embeddings ─────────────────────────────────────────────────

var embeddings = null;
var RAG_SEMANTIC_ENABLED = process.env.RAG_SEMANTIC_ENABLED !== 'false';

// ── Entity extraction ──────────────────────────────────────────

var _cachedChatEntities = null;

/**
 * Load entity candidates from static curricula JSON files for entity extraction.
 * Returns array of {name, category, articleCount} objects.
 */
export function loadChatEntities() {
  if (_cachedChatEntities) return _cachedChatEntities;
  _cachedChatEntities = [];

  var states = [
    'bb',
    'be',
    'bw',
    'by',
    'hb',
    'he',
    'hh',
    'mv',
    'ni',
    'nw',
    'rp',
    'sh',
    'sn',
    'st',
    'th',
  ];
  var dataDir = path.join(process.cwd(), 'myhugoapp', 'data', 'curricula');
  for (var si = 0; si < states.length; si++) {
    try {
      var fp = path.join(dataDir, states[si] + '.json');
      if (!fs.existsSync(fp)) continue;
      var raw = JSON.parse(fs.readFileSync(fp, 'utf-8'));
      var sCurricula = raw.school_curricula || [];
      for (var sci = 0; sci < sCurricula.length; sci++) {
        var gls = sCurricula[sci].grade_levels || [];
        for (var gli = 0; gli < gls.length; gli++) {
          var topics = gls[gli].topics || [];
          for (var ti = 0; ti < topics.length; ti++) {
            var subTopics = topics[ti].sub_topics || [];
            for (var sti = 0; sti < subTopics.length; sti++) {
              var name = subTopics[sti].title;
              if (name && name.length >= 3) {
                _cachedChatEntities.push({
                  name: name,
                  category: 'lehrplan',
                  articleCount: (topics[ti].learning_objectives || []).length || 1,
                });
              }
            }
          }
        }
      }
    } catch {
      /* skip */
    }
  }

  try {
    var linksPath = path.join(
      process.cwd(),
      'myhugoapp',
      'data',
      'curricula',
      'content-links.json'
    );
    if (fs.existsSync(linksPath)) {
      var links = JSON.parse(fs.readFileSync(linksPath, 'utf-8'));
      for (var key in links) {
        if (key.length >= 3 && key.length <= 120) {
          _cachedChatEntities.push({
            name: key,
            category: 'topic',
            articleCount: links[key].length || 1,
          });
        }
      }
    }
  } catch {
    /* content-links.json optional */
  }

  logger.info(
    '[chat] Loaded ' + _cachedChatEntities.length + ' entity candidates from static data'
  );
  return _cachedChatEntities;
}

/**
 * ExtractEntities — Find matching entities in a user message.
 * @param {string} message - User message text
 * @param {Array<{name:string, category:string, articleCount?:number}>} entities
 * @returns {Array<{name:string, category:string, articleCount:number}>} Up to 5 matches
 */
export function extractEntities(message, entities) {
  if (!message || !entities || entities.length === 0) return [];
  var msgLower = message.toLowerCase();
  var matched = [];

  for (var i = 0; i < entities.length; i++) {
    var e = entities[i];
    if (!e.name || e.name.length < 3) continue;
    var nameLower = e.name.toLowerCase().trim();
    if (msgLower.indexOf(nameLower) !== -1) {
      matched.push({
        name: e.name,
        category: e.category || 'konzept',
        articleCount: e.articleCount || 0,
      });
    }
    if (matched.length >= 50) break;
  }

  var seen = {};
  var unique = [];
  for (var mi = 0; mi < matched.length; mi++) {
    if (!seen[matched[mi].name]) {
      seen[matched[mi].name] = true;
      unique.push(matched[mi]);
    }
  }

  unique.sort(function (a, b) {
    return (b.articleCount || 0) - (a.articleCount || 0);
  });
  return unique.slice(0, 5);
}

// ── RAG context ────────────────────────────────────────────────

/**
 * Get RAG context for a user message.
 * @param {string} message
 * @returns {Promise<string|null>}
 */
export function getRAGContext(message) {
  var tokens = message
    .toLowerCase()
    .replace(/[.,!?;:()"']/g, '')
    .split(/\s+/);
  var keywords = [];
  for (var t = 0; t < tokens.length; t++) {
    var tok = tokens[t].trim();
    if (tok.length > 2 && !STOP_WORDS.has(tok)) {
      keywords.push(tok);
    }
  }
  var uniqueKeywords = [];
  var seen = {};
  for (var k = 0; k < keywords.length; k++) {
    if (!seen[keywords[k]]) {
      seen[keywords[k]] = true;
      uniqueKeywords.push(keywords[k]);
    }
  }
  var limitedKeywords = uniqueKeywords.slice(0, 5);
  if (limitedKeywords.length === 0) return null;

  var cacheKey = limitedKeywords.join(',');
  if (ragCache.has(cacheKey)) return ragCache.get(cacheKey);

  try {
    var driver = getNeo4jDriver();
    if (driver) {
      return queryNeo4jRAG(limitedKeywords, message, cacheKey);
    }
  } catch {
    /* Neo4j unavailable */
  }

  return getRAGContextFallback(limitedKeywords);
}

async function queryNeo4jRAG(keywords, originalMessage, cacheKey) {
  try {
    var driver = getNeo4jDriver();
    var session = driver.session({
      database: NEO4J_DATABASE,
      defaultAccessMode: neo4j.session.READ,
    });
    var curriculumResult = null;
    var moduleResult = null;
    var result;
    try {
      result = await session.run(
        `MATCH (e) ${'' /* subsetWhere handled inline */} AND (
          ANY(kw IN $keywords WHERE toLower(e.name) CONTAINS kw
           OR toLower(coalesce(e.description, "")) CONTAINS kw
           OR ANY(t IN coalesce(e.tags, []) WHERE toLower(t) CONTAINS kw))
        ) ` +
          'WITH e, ' +
          '  [kw IN $keywords WHERE toLower(e.name) = kw | 10.0] + ' +
          '  [kw IN $keywords WHERE toLower(e.name) STARTS WITH kw AND toLower(e.name) <> kw | 6.0] + ' +
          '  [kw IN $keywords WHERE toLower(e.name) CONTAINS kw AND toLower(e.name) <> kw AND NOT toLower(e.name) STARTS WITH kw | 3.0] + ' +
          '  [kw IN $keywords WHERE toLower(coalesce(e.description, "")) CONTAINS kw | 2.0] + ' +
          '  [kw IN $keywords | 0.0] AS scoreParts ' +
          'WITH e, REDUCE(s = 0.0, x IN scoreParts | s + x) AS score ' +
          'OPTIONAL MATCH (e)-[r:RELATED_TO|ERFUELLT|BESTEHT_AUS|COVERS_TOPIC|FULFILLS|MENTIONS]-(related:Entity) ' +
          'WITH e, score, collect(DISTINCT related.name) AS relatedEntities, ' +
          '  collect(DISTINCT { rel: type(r), target: related.name }) AS curriculumRels ' +
          'RETURN e.name AS name, e.kategorie AS category, e.state AS state, e.grade AS grade, ' +
          '  e.school_type AS school_type, coalesce(e.objective_count, 0) AS objective_count, ' +
          '  e.description AS description, relatedEntities, score, curriculumRels ' +
          'ORDER BY score DESC, e.name LIMIT 15',
        { keywords }
      );

      try {
        curriculumResult = await session.run(
          `MATCH (t:Topic)
           WHERE ANY(kw IN $keywords WHERE toLower(t.title) CONTAINS kw OR toLower(t.slug) CONTAINS kw)
           WITH t, [kw IN $keywords WHERE toLower(t.title) CONTAINS kw | 4.0] AS sp
           WITH t, REDUCE(s = 0.0, x IN sp | s + x) AS score
           OPTIONAL MATCH (t)-[:HAS_LEARNING_OBJECTIVE]->(lo:LearningObjective)
           WITH t, score, collect(DISTINCT lo.text) AS objectives
           OPTIONAL MATCH (c:Curriculum)-[:HAS_TOPIC]->(t)
           WITH t, score, objectives, collect(DISTINCT {state: c.state_abbr, school: c.school_type}) AS curricula
           RETURN t.title AS title, t.slug AS slug, t.grade AS grade, t.state AS topicState,
                  objectives, curricula, score
           ORDER BY score DESC LIMIT 5`,
          { keywords }
        );
      } catch (curriculumErr) {
        logger.warn(
          { err: curriculumErr, message: curriculumErr.message || String(curriculumErr) },
          '[RAG] Curriculum typed-label query failed'
        );
      }

      try {
        moduleResult = await session.run(
          `MATCH (m:UniversityModule)
           WHERE ANY(kw IN $keywords WHERE
             toLower(m.module_name) CONTAINS kw
             OR toLower(coalesce(m.module_code, '')) CONTAINS kw
             OR ANY(lo IN coalesce(m.learning_outcomes, []) WHERE toLower(lo) CONTAINS kw)
             OR ANY(ct IN coalesce(m.content, []) WHERE toLower(ct) CONTAINS kw))
           WITH m, [kw IN $keywords WHERE toLower(m.module_name) CONTAINS kw | 5.0] AS sp
           WITH m, REDUCE(s = 0.0, x IN sp | s + x) AS score
           OPTIONAL MATCH (u:University)-[:OFFERS]->(m)
           OPTIONAL MATCH (m)-[:TEACHES]->(e:Entity)
           WITH m, score, u, collect(DISTINCT e.name) AS taughtEntities
           RETURN m.module_code AS module_code, m.module_name AS module_name,
                  m.ects AS ects, m.level AS level,
                  u.name AS university_name, u.short_code AS university_code,
                  taughtEntities, score
           ORDER BY score DESC LIMIT 5`,
          { keywords }
        );
      } catch (moduleErr) {
        logger.warn(
          { err: moduleErr, message: moduleErr.message || String(moduleErr) },
          '[RAG] UniversityModule query failed'
        );
      }
    } finally {
      await session.close();
    }

    // Semantic reranking
    if (RAG_SEMANTIC_ENABLED && result.records.length > 1) {
      try {
        var semanticTimer = setTimeout(function () {
          throw new Error('Semantic rerank timed out (>2s)');
        }, 2000);
        if (!embeddings) embeddings = require('../embeddings.js');
        var queryText = originalMessage || keywords.join(' ');
        var qEmbedding = await embeddings.embed(queryText);
        var textBatch = [];
        for (var ri = 0; ri < result.records.length; ri++) {
          var rRec = result.records[ri];
          var rName = rRec.get('name') || '';
          var rDesc = rRec.get('description') || '';
          textBatch.push(rName + (rDesc ? ' ' + rDesc : ''));
        }
        var resultEmbeddings = await embeddings.embedBatch(textBatch);
        var combined = [];
        for (var ri2 = 0; ri2 < result.records.length; ri2++) {
          var kwScore = result.records[ri2].get('score') || 0;
          var semScore = embeddings.cosineSimilarity(qEmbedding, resultEmbeddings[ri2]);
          combined.push({ index: ri2, kwScore: kwScore, semScore: semScore });
        }
        combined.sort(function (a, b) {
          var aTotal = a.kwScore * 0.4 + a.semScore * 0.6;
          var bTotal = b.kwScore * 0.4 + b.semScore * 0.6;
          return bTotal - aTotal;
        });
        var reranked = [];
        for (var ri3 = 0; ri3 < combined.length && ri3 < 8; ri3++) {
          reranked.push(result.records[combined[ri3].index]);
        }
        result.records = reranked;
        clearTimeout(semanticTimer);
      } catch (semErr) {
        logger.warn(
          { err: semErr, message: semErr.message || String(semErr) },
          '[RAG] Semantic rerank unavailable, using keyword order'
        );
      }
    }

    if (result.records.length === 0) {
      var fallback = getRAGContextFallback(keywords);
      if (cacheKey) ragCache.set(cacheKey, fallback);
      return fallback;
    }

    var lines = [];
    var seen = {};
    for (var i = 0; i < result.records.length; i++) {
      var rec = result.records[i];
      var name = rec.get('name');
      if (seen[name]) continue;
      seen[name] = true;
      var parts = ['- ' + name];
      var score = rec.get('score');
      if (typeof score === 'number') parts.push('Score: ' + score.toFixed(1));
      var cat = rec.get('category');
      if (cat) parts.push('Kategorie: ' + cat);
      var state = rec.get('state');
      var grade = rec.get('grade');
      var school = rec.get('school_type');
      var objCount = rec.get('objective_count');
      if (state)
        parts.push(state + (grade ? ', Klasse ' + grade : '') + (school ? ', ' + school : ''));
      if (objCount) parts.push(objCount.toNumber() + ' Lernziele');
      var desc = rec.get('description');
      if (desc && typeof desc === 'string' && desc.length > 0) {
        var shortDesc = desc.length > 200 ? desc.slice(0, 197) + '...' : desc;
        parts.push('Definition: ' + shortDesc);
      }
      var related = rec.get('relatedEntities') || [];
      var filteredRelated = related.filter(function (n) {
        return n !== null && n !== name;
      });
      if (filteredRelated.length > 0 && filteredRelated.length <= 5) {
        parts.push('verwandt: ' + filteredRelated.join(', '));
      }
      lines.push(parts.join(' | '));
    }

    if (curriculumResult && curriculumResult.records.length > 0) {
      lines.push('');
      lines.push('Lehrplan-Themen (Lernbereiche aus den Bundesland-Lehrplänen):');
      for (var ci = 0; ci < curriculumResult.records.length; ci++) {
        var cr = curriculumResult.records[ci];
        var cTitle = cr.get('title') || '';
        var cGrade = cr.get('grade');
        var cObjectives = (cr.get('objectives') || []).filter(function (o) {
          return o != null;
        });
        var cCurricula = (cr.get('curricula') || []).filter(function (c) {
          return c != null;
        });
        var cParts = ['- ' + cTitle];
        if (cGrade) cParts.push('Klasse ' + cGrade);
        if (cCurricula.length > 0) {
          var cStates = cCurricula
            .map(function (c) {
              return c.state;
            })
            .filter(Boolean)
            .join(', ');
          if (cStates) cParts.push(cStates);
        }
        if (cObjectives.length > 0) {
          var objSample = cObjectives.slice(0, 3).join('; ');
          cParts.push('Lernziele: ' + objSample + (cObjectives.length > 3 ? ' ...' : ''));
        }
        lines.push(cParts.join(' | '));
      }
    }

    if (moduleResult && moduleResult.records.length > 0) {
      lines.push('');
      lines.push(
        'Universitäre Module (internationale Modulkataloge, verknüpft mit dem Wissensgraph):'
      );
      for (var mi = 0; mi < moduleResult.records.length; mi++) {
        var mr = moduleResult.records[mi];
        var mName = mr.get('module_name') || '';
        var mCode = mr.get('module_code') || '';
        var mUni = mr.get('university_name') || mr.get('university_code') || '';
        var mEcts = mr.get('ects');
        var mLevel = mr.get('level') || '';
        var mTaught = (mr.get('taughtEntities') || []).filter(function (e) {
          return e != null;
        });
        var mParts = ['- ' + mName + ' (' + mCode + ', ' + mUni + ')'];
        if (mEcts != null) mParts.push(mEcts + ' ECTS');
        if (mLevel) mParts.push(mLevel);
        if (mTaught.length > 0) mParts.push('thematisiert: ' + mTaught.join(', '));
        lines.push(mParts.join(' | '));
      }
    }

    // Inject calculator links
    try {
      var calcIndex = getCalcRagIndex();
      var foundCalcs = [];
      for (var ci2 = 0; ci2 < keywords.length; ci2++) {
        var kw = keywords[ci2];
        if (calcIndex[kw]) {
          for (var cj = 0; cj < calcIndex[kw].length; cj++) {
            var entry = calcIndex[kw][cj];
            if (foundCalcs.indexOf(entry.url) === -1) {
              foundCalcs.push(entry.url);
              lines.push('- ' + entry.title + ' | Online-Rechner/Simulation: ' + entry.url);
            }
          }
        }
      }
    } catch (calcErr) {
      logger.warn(
        { err: calcErr, message: calcErr.message || String(calcErr) },
        '[calc-rag] Calculator lookup failed'
      );
    }

    if (lines.length === 0) {
      var fallback2 = getRAGContextFallback(keywords);
      if (cacheKey) ragCache.set(cacheKey, fallback2);
      return fallback2;
    }

    var context =
      'Folgende Entitäten aus dem Chemie-Wissensgraph sind relevant (sortiert nach Relevanz-Score):\n' +
      lines.join('\n');
    if (ragCache.size >= RAG_CACHE_MAX) ragCache.clear();
    if (cacheKey) ragCache.set(cacheKey, context);
    return context;
  } catch {
    var f = getRAGContextFallback(keywords);
    if (cacheKey) ragCache.set(cacheKey, f);
    return f;
  }
}

function getRAGContextFallback(keywords) {
  try {
    var fallback = getFallbackData();
    var matches = [];
    var seen = {};
    for (var ci = 0; ci < fallback.curricula.length; ci++) {
      var c = fallback.curricula[ci];
      if (seen[c.name]) continue;
      var nameLower = c.name.toLowerCase();
      for (var kw = 0; kw < keywords.length; kw++) {
        if (nameLower.indexOf(keywords[kw]) !== -1) {
          seen[c.name] = true;
          var parts = ['- ' + c.name + ' (Lehrplan)'];
          if (c.curriculumMeta) {
            parts.push(
              c.curriculumMeta.state +
                ', Klasse ' +
                c.curriculumMeta.grade +
                ', ' +
                c.curriculumMeta.school_type
            );
            parts.push(c.curriculumMeta.objective_count + ' Lernziele');
          }
          matches.push(parts.join(' | '));
          break;
        }
      }
    }
    for (var ei = 0; ei < fallback.entities.length; ei++) {
      var e = fallback.entities[ei];
      if (e.category === 'lehrplan') continue;
      if (seen[e.name]) continue;
      var eNameLower = e.name.toLowerCase();
      for (var kw2 = 0; kw2 < keywords.length; kw2++) {
        if (eNameLower.indexOf(keywords[kw2]) !== -1) {
          seen[e.name] = true;
          var eparts = ['- ' + e.name + ' (' + (e.category || 'Entität') + ')'];
          matches.push(eparts.join(' | '));
          break;
        }
      }
    }
    if (matches.length === 0) return null;
    return 'Folgende Entitäten aus dem Wissensgraph sind relevant:\n' + matches.join('\n');
  } catch {
    return null;
  }
}
