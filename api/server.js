/**
 * Chemie Chat API — Express server with rate limiting.
 * Proxies chemistry questions to LiteLLM, enforces 50 requests/IP/day.
 */
import express from 'express';
import crypto from 'crypto';
import cookieParser from 'cookie-parser';
import neo4j from 'neo4j-driver';
import fs from 'fs';
import path from 'path';
import ragHelpers from './_rag-helpers.cjs';
import { subsetWhere } from './scripts/_neo4j-subset-filter.mjs';
import FileBackedSessionStore from './session-store.js';
import authRouter, { authMiddleware, handleStripeWebhook } from './auth.js';

const PORT = process.env.PORT || 3001;
const LITELLM_URL = process.env.LITELLM_URL || 'http://litellm-proxy:4000';
const LITELLM_MODEL = process.env.LITELLM_MODEL || 'gemma-4';
const RATE_LIMIT = parseInt(process.env.RATE_LIMIT, 10) || 50; // requests per IP per day
const SESSION_TTL = 24 * 60 * 60 * 1000; // 24 hours
const MAX_MESSAGES_PER_SESSION = 50; // prevent infinite conversations
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || ''; // If set, required for /api/admin/* routes
// SESSION_DATA_PATH is read directly by session-store.js via process.env

var _calcRagIndex = null;
function getCalcRagIndex() {
  if (_calcRagIndex) return _calcRagIndex;
  try {
    var indexPath = path.join(
      path.dirname(new URL(import.meta.url).pathname),
      'calc-rag-index.json'
    );
    _calcRagIndex = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
  } catch (err) {
    console.warn('[calc-rag] Failed to load calc-rag-index.json:', err.message);
    _calcRagIndex = {};
  }
  return _calcRagIndex;
}

// In-memory rate limit store: Map<ip, { count, resetDate }>
const rateStore = new Map();

// File-backed session store: persists sessions across restarts
const sessionStore = new FileBackedSessionStore();

function getRateKey(ip) {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  return `${ip}:${today}`;
}

function checkRateLimit(ip) {
  const key = getRateKey(ip);
  const entry = rateStore.get(key);
  if (!entry) {
    rateStore.set(key, { count: 1 });
    return { allowed: true, remaining: RATE_LIMIT - 1 };
  }
  entry.count++;
  if (entry.count > RATE_LIMIT) {
    return { allowed: false, remaining: 0 };
  }
  return { allowed: true, remaining: RATE_LIMIT - entry.count };
}

// Periodically clean old entries (daily)
setInterval(() => {
  const today = new Date().toISOString().slice(0, 10);
  for (const key of rateStore.keys()) {
    if (!key.endsWith(today)) rateStore.delete(key);
  }

  // Clean old sessions
  const now = Date.now();
  for (const [sessionId, session] of sessionStore.entries()) {
    if (now - session.lastUsed > SESSION_TTL) {
      sessionStore.delete(sessionId);
    }
  }
}, 3600000); // every hour

/**
 * Generate or retrieve session ID
 */
function getSessionId(req, res) {
  // Check if session ID in cookie
  let sessionId = req.cookies?.chemie_session;

  // Generate new session if none exists
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    // Set cookie for future requests
    res.cookie('chemie_session', sessionId, {
      maxAge: SESSION_TTL,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
  }

  return sessionId;
}

/**
 * Get or create session
 */
function getSession(sessionId) {
  let session = sessionStore.get(sessionId);

  if (!session) {
    session = {
      messages: [],
      createdAt: Date.now(),
      lastUsed: Date.now(),
    };
    sessionStore.set(sessionId, session);
  } else {
    session.lastUsed = Date.now();
  }

  return session;
}

/**
 * Clean old messages from session
 */
function cleanupSessionMessages(session) {
  if (session.messages.length > MAX_MESSAGES_PER_SESSION) {
    // Keep only the most recent messages
    session.messages = session.messages.slice(-MAX_MESSAGES_PER_SESSION);
  }
}

const app = express();

// Stripe webhook MUST be before express.json() — needs raw body for signature verification
app.post(
  '/api/auth/stripe-webhook',
  express.raw({ type: 'application/json' }),
  handleStripeWebhook
);

app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());

// CORS for the chemie-lernen.org domain
app.use((req, res, next) => {
  const origin = req.headers.origin || '';
  if (origin.endsWith('chemie-lernen.org') || origin.endsWith('localhost')) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// Auth routes — register, login, logout, me
app.use('/api/auth', authRouter);

// Apply authMiddleware to set req.user from JWT for all /api/* routes
app.use('/api/*', authMiddleware);

// Admin API key check — optional, only enforced when ADMIN_API_KEY env is set
app.use('/api/admin', (req, res, next) => {
  if (!ADMIN_API_KEY) return next(); // no key configured → open
  const provided = req.headers['x-api-key'] || req.query.api_key || '';
  if (provided === ADMIN_API_KEY) return next();
  res.status(401).json({ error: 'Unauthorized — gültiger API-Key erforderlich' });
});

app.get('/api/session', (req, res) => {
  const sessionId = getSessionId(req, res);
  const session = getSession(sessionId);

  res.json({
    sessionId,
    messageCount: session.messages.length,
    sessionInfo: {
      createdAt: new Date(session.createdAt).toISOString(),
      lastUsed: new Date(session.lastUsed).toISOString(),
      maxMessages: MAX_MESSAGES_PER_SESSION,
    },
  });
});

app.post('/api/chat', async (req, res) => {
  // Rate limit check
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const rate = checkRateLimit(ip);
  res.setHeader('X-RateLimit-Remaining', rate.remaining);
  if (!rate.allowed) {
    return res.status(429).json({
      error: 'Rate limit exceeded',
      message: 'Max 50 Anfragen pro Tag. Morgen kannst du weitermachen!',
      remaining: 0,
    });
  }

  // Generate or get session ID (handles cookie)
  const sessionId = getSessionId(req, res);
  const { message, currentEntity } = req.body;
  if (!message || typeof message !== 'string' || message.length > 1000) {
    return res.status(400).json({ error: 'Invalid message' });
  }

  const acceptStreaming = req.accepts('text/event-stream');

  try {
    const session = getSession(sessionId);
    session.messages.push({ role: 'user', content: message });
    cleanupSessionMessages(session);

    var ragContext = await getRAGContext(message);
    var ragSources = [];
    if (ragContext) {
      ragSources = extractSourceNames(ragContext);
    }

    var systemPrompt = buildSystemPrompt({
      lang: req.headers['accept-language'],
      ragContext: ragContext,
      currentEntity: currentEntity,
    });

    const conversationHistory = [{ role: 'system', content: systemPrompt }, ...session.messages];

    if (!acceptStreaming) {
      const llmRes = await fetch(`${LITELLM_URL}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: LITELLM_MODEL,
          messages: conversationHistory,
          max_tokens: 2048,
          temperature: 0.5,
        }),
      });

      if (!llmRes.ok) {
        const errText = await llmRes.text();
        console.error(`[chat-api] LiteLLM error ${llmRes.status}: ${errText}`);
        return res.status(502).json({ error: 'Upstream API error' });
      }

      const data = await llmRes.json();
      const reply = data.choices?.[0]?.message?.content || 'Keine Antwort erhalten.';

      session.messages.push({ role: 'assistant', content: reply });
      cleanupSessionMessages(session);
      res.json({
        reply,
        sources: ragSources,
        remaining: rate.remaining,
        sessionId,
        messageCount: session.messages.length,
      });
      return;
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const buffer = [];
    let replyContent = '';
    try {
      const llmRes = await fetch(`${LITELLM_URL}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: LITELLM_MODEL,
          messages: conversationHistory,
          max_tokens: 2048,
          temperature: 0.5,
          stream: true,
        }),
      });

      if (!llmRes.ok) {
        const errText = await llmRes.text();
        console.error(`[chat-api] LiteLLM error ${llmRes.status}: ${errText}`);
        throw new Error(`Stream init failed: ${errText}`);
      }

      const reader = llmRes.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });

        for (const line of chunk.split('\n').filter((line) => line.startsWith('data: '))) {
          const dataLine = line.slice(6).trim();
          if (dataLine === '[DONE]') continue;

          try {
            const data = JSON.parse(dataLine);
            const delta = data.choices?.[0]?.delta?.content;
            if (delta) {
              replyContent += delta;
              buffer.push(delta);
              res.write(`data: ${JSON.stringify({ content: delta })}\n\n`);
            }
          } catch {
            console.error(`[chat-api] Failed to parse stream chunk: ${line}`);
          }
        }
      }

      res.write(
        `data: ${JSON.stringify({
          done: true,
          sources: ragSources,
          remaining: rate.remaining,
          sessionId,
          messageCount: session.messages.length + 1,
        })}\n\n`
      );
    } catch (streamErr) {
      console.error(`[chat-api] Stream failed, falling back: ${streamErr.message}`);
      while (buffer.length > 0) {
        const chunk = buffer.shift();
        if (chunk) replyContent += chunk;
      }

      res.write(
        `data: ${JSON.stringify({
          content: replyContent,
          fallback: true,
          done: true,
          sources: ragSources,
          remaining: rate.remaining,
          sessionId,
          messageCount: session.messages.length + 1,
        })}\n\n`
      );
    } finally {
      res.end();
    }

    session.messages.push({ role: 'assistant', content: replyContent });
    cleanupSessionMessages(session);
  } catch (err) {
    console.error(`[chat-api] Error: ${err.message}`);
    if (!res.headersSent && !res.writableEnded) {
      res.status(502).json({ error: 'Service unavailable' });
    }
  }
});

// ── Neo4j driver (knowledge graph) ──────────────────────────────────────
const NEO4J_URI = process.env.NEO4J_URI || 'bolt://chemie-neo4j:7687';
const NEO4J_USER = process.env.NEO4J_USER || 'neo4j';
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || 'chemie_knowledge_2024';
const NEO4J_DATABASE = process.env.NEO4J_DATABASE || 'chemie';

let neo4jDriver = null;

function getNeo4jDriver() {
  if (!neo4jDriver) {
    neo4jDriver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD), {
      connectionTimeout: 5000,
    });
  }
  return neo4jDriver;
}

// ── RAG: Build curriculum context from Neo4j (fallback: static data) ────
const STOP_WORDS = new Set([
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

// Minimal LRU cache for RAG contexts (100 entries)
const ragCache = new Map();
const RAG_CACHE_MAX = 100;

const { buildSystemPrompt, extractSourceNames } = ragHelpers;

// Semantic RAG — lazy-loaded embedding pipeline
var embeddings = null;
var RAG_SEMANTIC_ENABLED = process.env.RAG_SEMANTIC_ENABLED !== 'false';

function getRAGContext(message) {
  // Extract meaningful keywords
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
  // Deduplicate and limit
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

  // Check cache
  var cacheKey = limitedKeywords.join(',');
  if (ragCache.has(cacheKey)) return ragCache.get(cacheKey);

  // Try Neo4j first
  try {
    var driver = getNeo4jDriver();
    if (driver) {
      // We'll query Neo4j asynchronously, so we return a promise
      return queryNeo4jRAG(limitedKeywords, message, cacheKey);
    }
  } catch {
    // Neo4j unavailable, fall through to fallback
  }

  // Fallback: content-links.json + curricula
  return getRAGContextFallback(limitedKeywords, cacheKey);
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
        `MATCH (e) ${subsetWhere('e', ['Entity'])} AND (
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
          'WITH e, score, ' +
          '  collect(DISTINCT related.name) AS relatedEntities, ' +
          '  collect(DISTINCT { rel: type(r), target: related.name }) AS curriculumRels ' +
          'RETURN e.name AS name, e.kategorie AS category, ' +
          '  e.state AS state, e.grade AS grade, ' +
          '  e.school_type AS school_type, ' +
          '  coalesce(e.objective_count, 0) AS objective_count, ' +
          '  e.description AS description, ' +
          '  relatedEntities, score, ' +
          '  curriculumRels ' +
          'ORDER BY score DESC, e.name ' +
          'LIMIT 15',
        { keywords: keywords }
      );

      // Also query typed curriculum labels (Topic, LearningObjective, Curriculum)
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
           ORDER BY score DESC
           LIMIT 5`,
          { keywords: keywords }
        );
      } catch (curriculumErr) {
        console.warn('[RAG] Curriculum typed-label query failed:', curriculumErr.message);
      }

      // Also query UniversityModule nodes (international module catalogs)
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
           ORDER BY score DESC
           LIMIT 5`,
          { keywords: keywords }
        );
      } catch (moduleErr) {
        console.warn('[RAG] UniversityModule query failed:', moduleErr.message);
      }
    } finally {
      await session.close();
    }

    // Semantic reranking — embed query + batch-embed results, combine scores
    if (RAG_SEMANTIC_ENABLED && result.records.length > 1) {
      try {
        var semanticTimer = setTimeout(function () {
          throw new Error('Semantic rerank timed out (>2s)');
        }, 2000);
        if (!embeddings) embeddings = require('./embeddings.js');
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
        console.warn('[RAG] Semantic rerank unavailable, using keyword order:', semErr.message);
      }
    }

    if (result.records.length === 0) {
      var fallback = getRAGContextFallback(keywords, cacheKey);
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

    // Inject calculator links matching RAG keywords
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
      console.warn('[calc-rag] Calculator lookup failed:', calcErr.message);
    }

    if (lines.length === 0) {
      var fallback2 = getRAGContextFallback(keywords, cacheKey);
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
    var f = getRAGContextFallback(keywords, cacheKey);
    if (cacheKey) ragCache.set(cacheKey, f);
    return f;
  }
}

function getRAGContextFallback(keywords) {
  try {
    var fallback = getFallbackData();
    var matches = [];
    var seen = {};
    // Search in curricula
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
    // Search in entities
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
    var context = 'Folgende Entitäten aus dem Wissensgraph sind relevant:\n' + matches.join('\n');
    return context;
  } catch {
    return null;
  }
}

// Trim RAG cache periodically
setInterval(function () {
  if (ragCache.size > RAG_CACHE_MAX) {
    ragCache.clear();
  }
}, 60000);

/**
 * Fallback data used when Neo4j is unreachable.
 * Loads from data/kg_fallback.json to keep server.js clean.
 */
let _cachedFallbackData = null;
function getFallbackData() {
  if (_cachedFallbackData) return _cachedFallbackData;
  const fallbackPath = path.join(process.cwd(), 'data', 'kg_fallback.json');
  try {
    _cachedFallbackData = JSON.parse(fs.readFileSync(fallbackPath, 'utf-8'));
  } catch (err) {
    console.error('Failed to load kg_fallback.json:', err.message);
    _cachedFallbackData = { articles: [], entities: [] };
  }
  return _cachedFallbackData;
}

// LRU cache for /api/kg-data (5 min TTL)
const kgDataCache = new Map();
const KG_CACHE_TTL = 300000; // 5 minutes
const KG_CACHE_MAX = 20;

function getKgDataCacheKey(req) {
  return 'kg-data-' + (req.query.lehrplan === 'true' ? 'lehrplan' : 'default');
}

function getCachedKgData(key) {
  var entry = kgDataCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > KG_CACHE_TTL) {
    kgDataCache.delete(key);
    return null;
  }
  // LRU: move to end on access
  kgDataCache.delete(key);
  kgDataCache.set(key, entry);
  return entry.data;
}

function setCachedKgData(key, data) {
  if (kgDataCache.size >= KG_CACHE_MAX) {
    var oldest = kgDataCache.keys().next().value;
    if (oldest) kgDataCache.delete(oldest);
  }
  kgDataCache.set(key, { ts: Date.now(), data: data });
}

/**
 * Parse query params: search, category, type, limit, offset
 */
function parseKGParams(req) {
  const search = (req.query.search || '').toLowerCase().trim();
  const category = (req.query.category || '').toLowerCase().trim();
  const type = (req.query.type || '').toLowerCase().trim();
  const limit = Math.min(parseInt(req.query.limit) || 50, 500);
  const offset = parseInt(req.query.offset) || 0;
  return { search, category, type, limit, offset };
}

/**
 * Filter entities by search/category/type
 */
function filterEntities(entities, { search, category, type }) {
  let result = entities;
  if (search) {
    result = result.filter((e) => e.name.toLowerCase().includes(search));
  }
  if (category) {
    result = result.filter((e) => (e.category || '').toLowerCase() === category);
  }
  if (type) {
    result = result.filter((e) => (e.type || '').toLowerCase() === type);
  }
  return result;
}

/**
 * GET /api/kg-data
 * Returns knowledge graph data with optional search, filter, pagination.
 * Query params: ?search=, ?category=, ?type=, ?limit=, ?offset=
 */
app.get('/api/kg-data', async (req, res) => {
  var cacheKey = getKgDataCacheKey(req);
  var cached = getCachedKgData(cacheKey);
  if (cached) {
    console.log('[kg-data] Cache HIT for ' + cacheKey);
    return res.json(cached);
  }
  const startTime = Date.now();
  const isLehrplanMode = req.query.lehrplan === 'true';
  const params = parseKGParams(req);
  const { limit, offset } = params;

  let whereClause = '';
  let queryParams = { ...params };
  if (params.search) {
    whereClause = ' AND toLower(e.name) CONTAINS $search';
  }
  if (params.category) {
    whereClause += ' AND e.kategorie = $category';
  }

  try {
    const driver = getNeo4jDriver();
    const session = driver.session({
      database: NEO4J_DATABASE,
      defaultAccessMode: neo4j.session.READ,
      fetchSize: 1000,
    });
    const entitiesQuery = isLehrplanMode
      ? `
      MATCH (c:Curriculum)-[:HAS_TOPIC]->(t:Topic)
      OPTIONAL MATCH (t)-[:HAS_LEARNING_OBJECTIVE]->(lo:LearningObjective)
      WITH c, t, count(lo) AS objectiveCount
      ORDER BY c.state_abbr, t.title
      LIMIT 500
      RETURN t.title AS name, 'lehrplan' AS category,
             c.state AS state, c.state_abbr AS stateAbbr,
             c.school_type AS school_type,
             t.grade AS grade,
             objectiveCount AS objective_count
    `
      : `
      MATCH (e:Entity)
      WHERE (e.kategorie IS NULL OR NOT (e.kategorie IN ['lernziel', 'lehrplan', 'didaktik']))
      OPTIONAL MATCH (e)-[r:RELATED_TO|ERFUELLT]-(related:Entity)
      OPTIONAL MATCH (e)-[c:BESTEHT_AUS]->(component:Entity)
      WHERE 1=1${whereClause}
      RETURN e.name as name, e.kategorie as category, e.typ as type,
             e.symbol as symbol, e.ordnungszahl as ordnungszahl,
             collect(DISTINCT related.name) as relatedEntities,
             collect(DISTINCT component.name) as components,
             COUNT { (:Document)-[:MENTIONS]->(e) } as articleCount
      ORDER BY articleCount DESC, e.name
      SKIP ${offset}
      LIMIT ${limit}
    `;
    const entitiesResult = await session.run(entitiesQuery, queryParams);
    const entities = isLehrplanMode
      ? entitiesResult.records.map((r, i) => ({
          id: `c${i}`,
          name: r.get('name'),
          category: 'lehrplan',
          curriculumMeta: {
            state: r.get('state'),
            stateAbbr: r.get('stateAbbr'),
            grade: r.get('grade'),
            school_type: r.get('school_type'),
            objective_count: r.get('objective_count') ? r.get('objective_count').toNumber() : 0,
          },
          articles: [],
          relatedEntities: [],
          components: [],
          articleCount: 0,
        }))
      : entitiesResult.records.map((r, i) => ({
          id: `e${offset + i}`,
          name: r.get('name'),
          category: r.get('category') || 'konzept',
          articles: [],
          relatedEntities: (r.get('relatedEntities') || [])
            .filter((n) => n !== null)
            .map((name) => ({ name, weight: 1 })),
          components: (r.get('components') || []).filter((n) => n !== null),
          articleCount: r.get('articleCount') || 0,
        }));

    // Total count for pagination
    let totalEntities;
    if (isLehrplanMode) {
      const countResult = await session.run(
        'MATCH (c:Curriculum)-[:HAS_TOPIC]->(t:Topic) RETURN count(DISTINCT t.title) AS total'
      );
      totalEntities = countResult.records[0].get('total').toNumber();
    } else {
      const countResult = await session.run(
        `
        MATCH (e:Entity) WHERE 1=1${whereClause}
        RETURN count(e) AS total
      `,
        queryParams
      );
      totalEntities = countResult.records[0].get('total').toNumber();
    }

    // In lehrplan mode, also fetch KMK guidelines as didaktik entities
    if (isLehrplanMode) {
      try {
        const kmkResult = await session.run(
          `MATCH (dg:DidacticGuideline)
           OPTIONAL MATCH (dg)-[:HAS_SECTION]->(gs:GuidelineSection)
           WITH dg, collect(gs.title) AS sections
           RETURN dg.title AS name, sections
           ORDER BY dg.title`
        );
        const kmkGuidelines = kmkResult.records.map((r, i) => ({
          id: `d${i}`,
          name: r.get('name'),
          category: 'didaktik',
          articles: [],
          relatedEntities: (r.get('sections') || [])
            .filter((n) => n !== null)
            .map((name) => ({ name, weight: 1 })),
          components: [],
          articleCount: 0,
        }));
        entities.push(...kmkGuidelines);
        console.log(`[kg-data] Added ${kmkGuidelines.length} KMK guidelines`);
      } catch (kmkErr) {
        console.warn(`[kg-data] KMK guidelines query failed: ${kmkErr.message}`);
      }
    }

    // Query articles linked to entities
    const entityNames = entities.map((e) => e.name);
    const articles = [];
    if (entityNames.length > 0) {
      const articlesQuery = `
        MATCH (d:Document)-[:MENTIONS]->(e:Entity)
        WHERE e.name IN $entityNames
        RETURN d.title as title, d.url as url, d.type as type,
               collect(e.name) as entities, d.date as date
        ORDER BY d.type, d.date DESC
        LIMIT ${Math.min(limit * 2, 500)}
      `;
      const articlesResult = await session.run(articlesQuery, {
        entityNames,
      });
      for (const r of articlesResult.records) {
        articles.push({
          id: `a${articles.length}`,
          title: r.get('title'),
          url: r.get('url'),
          type: r.get('type') || 'article',
          entities: r.get('entities') || [],
          date: r.get('date'),
        });
      }
    }

    entities.forEach((entity) => {
      entity.articles = articles
        .filter((a) => a.entities.includes(entity.name))
        .map((a) => a.title);
    });

    await session.close();

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(
      `[kg-data] Neo4j: ${articles.length} articles, ${entities.length}/${totalEntities} entities in ${elapsed}s`
    );

    return res.json({
      source: 'neo4j',
      articles,
      entities,
      curricula: [],
      pagination: {
        total: totalEntities,
        limit,
        offset,
        returned: entities.length,
      },
      loadTime: parseFloat(elapsed),
    });
  } catch (err) {
    console.error(`[kg-data] Neo4j error, using fallback: ${err.message}`);

    const fallback = getFallbackData();
    let allEntities = fallback.entities;
    let allArticles = fallback.articles;

    // Apply filters to fallback data
    allEntities = filterEntities(allEntities, params);

    // Paginate
    const totalEntities = allEntities.length;
    const paginatedEntities = allEntities.slice(offset, offset + limit);

    // Get articles for paginated entities
    const entityNames = paginatedEntities.map((e) => e.name);
    const linkedArticles = allArticles.filter((a) =>
      (a.entities || []).some((en) => entityNames.includes(en))
    );

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(
      `[kg-data] Fallback: ${linkedArticles.length} articles, ${paginatedEntities.length}/${totalEntities} entities in ${elapsed}s`
    );

    return res.json({
      source: 'fallback',
      articles: linkedArticles,
      entities: paginatedEntities,
      curricula: [],
      pagination: {
        total: totalEntities,
        limit,
        offset,
        returned: paginatedEntities.length,
      },
      loadTime: parseFloat(elapsed),
    });
  }
});

/**
 * GET /api/rag-context?q=<query>
 * Returns RAG context for a given entity or topic query.
 * Used for AI-assisted learning features.
 */
app.get('/api/rag-context', async (req, res) => {
  const query = (req.query.q || '').trim();
  if (!query) {
    return res.status(400).json({ error: 'Missing required parameter: q' });
  }

  try {
    const driver = getNeo4jDriver();
    const session = driver.session({
      database: NEO4J_DATABASE,
      defaultAccessMode: neo4j.session.READ,
    });

    const result = await session.run(
      `
      MATCH (e:Entity)
      WHERE toLower(e.name) CONTAINS toLower($query)
      OPTIONAL MATCH (e)-[:RELATED_TO|ERFUELLT]-(related:Entity)
      OPTIONAL MATCH (d:Document)-[:MENTIONS]->(e)
      RETURN e.name as name, e.kategorie as category, e.typ as type,
             collect(DISTINCT related.name) as relatedEntities,
             collect(DISTINCT d.title) as documents
      LIMIT 5
      `,
      { query }
    );

    await session.close();

    const entities = result.records.map((r) => ({
      name: r.get('name'),
      category: r.get('category'),
      type: r.get('type'),
      relatedEntities: (r.get('relatedEntities') || []).filter((n) => n !== null),
      documents: (r.get('documents') || []).filter((n) => n !== null),
    }));

    res.json({
      query,
      entities,
      context: entities
        .map((e) => `${e.name} (${e.category || 'unknown'}): ${e.documents.join(', ')}`)
        .filter(Boolean),
    });
  } catch (err) {
    console.error(`[rag-context] Error: ${err.message}`);
    res.status(500).json({ error: 'Failed to retrieve RAG context' });
  }
});

/**
 * GET /api/kg-data/entity/:name
 * Returns a single entity with its full details and linked articles.
 */
app.get('/api/kg-data/entity/:name', async (req, res) => {
  const entityName = req.params.name.toLowerCase().trim();
  const startTime = Date.now();
  const isLehrplanMode = req.query.lehrplan === 'true';
  var cacheKey = entityName + (isLehrplanMode ? ':lehrplan' : '');

  try {
    const driver = getNeo4jDriver();
    const session = driver.session({
      database: NEO4J_DATABASE,
      defaultAccessMode: neo4j.session.READ,
    });

    const entityResult = await session.run(
      `
      MATCH (e:Entity {name: $name})
      OPTIONAL MATCH (e)-[r:RELATED_TO]-(related:Entity)
      OPTIONAL MATCH (e)-[c:BESTEHT_AUS]->(component:Entity)
      OPTIONAL MATCH (e)<-[g:GEHOERT_ZU]-(group:Entity)
      RETURN e.name as name, e.kategorie as category, e.typ as type,
             e.symbol as symbol, e.ordnungszahl as ordnungszahl,
             e.beschreibung as description,
             collect(DISTINCT related.name) as relatedEntities,
             collect(DISTINCT component.name) as components,
             collect(DISTINCT group.name) as groups,
             COUNT { (:Document)-[:MENTIONS]->(e) } as articleCount
    `,
      { name: entityName }
    );

    if (entityResult.records.length === 0) {
      return res.status(404).json({ error: 'Entity not found', name: entityName });
    }

    const r = entityResult.records[0];
    const entity = {
      name: r.get('name'),
      category: r.get('category') || 'konzept',
      type: r.get('type') || null,
      symbol: r.get('symbol') || null,
      ordnungszahl: r.get('ordnungszahl') ? r.get('ordnungszahl').toNumber() : null,
      description: r.get('description') || null,
      relatedEntities: (r.get('relatedEntities') || [])
        .filter((n) => n !== null)
        .map((name) => ({ name, weight: 1 })),
      components: (r.get('components') || []).filter((n) => n !== null),
      groups: (r.get('groups') || []).filter((n) => n !== null),
      articleCount: r.get('articleCount') || 0,
    };

    // Get linked articles
    const articlesResult = await session.run(
      `
      MATCH (d:Document)-[:MENTIONS]->(e:Entity {name: $name})
      RETURN d.title as title, d.url as url, d.type as type,
             d.date as date, d.description as description
      ORDER BY d.date DESC
      LIMIT 50
    `,
      { name: entityName }
    );

    const articles = articlesResult.records.map((r, i) => ({
      id: `a${i}`,
      title: r.get('title'),
      url: r.get('url'),
      type: r.get('type') || 'article',
      description: r.get('description') || null,
      date: r.get('date'),
    }));

    const entities = [entity];
    entities.forEach((ent) => {
      ent.articles = articles
        .filter((a) => a.entities && a.entities.includes(ent.name))
        .map((a) => a.title);
    });

    await session.close();

    let curriculaEntities = [];
    if (isLehrplanMode) {
      try {
        const curDriver = getNeo4jDriver();
        const curSession = curDriver.session({
          database: NEO4J_DATABASE,
          defaultAccessMode: neo4j.session.READ,
          fetchSize: 1000,
        });
        const curriculaQuery = `
          MATCH (c:Curriculum)-[:HAS_TOPIC]->(t:Topic)
          OPTIONAL MATCH (t)-[:HAS_LEARNING_OBJECTIVE]->(lo:LearningObjective)
          WITH c, t, count(lo) AS objectiveCount
          ORDER BY c.state_abbr, t.title
          LIMIT 500
          RETURN t.title AS name, 'lehrplan' AS category,
                 c.state AS state, c.state_abbr AS stateAbbr,
                 c.school_type AS school_type,
                 t.grade AS grade,
                 objectiveCount AS objective_count
        `;
        const curriculaResult = await curSession.run(curriculaQuery);
        curriculaEntities = curriculaResult.records.map((r, i) => ({
          id: `c${i}`,
          name: r.get('name'),
          category: 'lehrplan',
          curriculumMeta: {
            state: r.get('state'),
            stateAbbr: r.get('stateAbbr'),
            grade: r.get('grade'),
            school_type: r.get('school_type'),
            objective_count: r.get('objective_count') ? r.get('objective_count').toNumber() : 0,
          },
          articles: [],
          relatedEntities: [],
          articleCount: 0,
        }));
        await curSession.close();
      } catch (e) {
        console.warn(`[kg-data] Curriculum query failed: ${e.message}`);
      }

      const existingNames = new Set(entities.map((e) => e.name));
      for (const curr of curriculaEntities) {
        if (!existingNames.has(curr.name)) {
          entities.push(curr);
          existingNames.add(curr.name);
        }
      }
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(
      `[kg-data] Neo4j: ${articles.length} articles, ${entities.length} entities (${curriculaEntities.length} curricula) in ${elapsed}s`
    );

    var responseData = {
      source: 'neo4j',
      entity,
      articles,
      entities,
      curricula: isLehrplanMode ? curriculaEntities : [],
      loadTime: parseFloat(elapsed),
    };
    setCachedKgData(cacheKey, responseData);
    return res.json(responseData);
  } catch (err) {
    console.error(`[kg-data] Entity lookup error: ${err.message}`);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

    // Fallback: search in static data
    const fallback = getFallbackData();
    const entity = fallback.entities.find((e) => e.name.toLowerCase() === entityName);
    if (!entity) {
      return res
        .status(404)
        .json({ error: 'Entity not found', name: entityName, source: 'fallback' });
    }

    // In lehrplan mode, filter to only lehrplan + didaktik entities
    if (isLehrplanMode) {
      const lehrplanEntities = (fallback.curricula || []).map((c) => ({
        ...c,
        articles: [],
      }));
      const didaktikEntities = fallback.entities.filter((e) => e.category === 'didaktik');
      const combined = [...lehrplanEntities, ...didaktikEntities];

      console.log(`[kg-data] Fallback (lehrplan): ${combined.length} entities in ${elapsed}s`);
      var fbLehrplanResponse = {
        source: 'fallback',
        articles: [],
        entities: combined,
        curricula: lehrplanEntities,
        loadTime: parseFloat(elapsed),
      };
      setCachedKgData(cacheKey, fbLehrplanResponse);
      return res.json(fbLehrplanResponse);
    }

    const fallbackArticles = (fallback.articles || []).filter((a) =>
      (a.entities || []).includes(entity.name)
    );
    console.log(
      `[kg-data] Fallback: ${fallbackArticles.length} articles, ${fallback.entities.length} entities in ${elapsed}s`
    );

    var fallbackResponse = {
      source: 'fallback',
      entity,
      articles: fallbackArticles,
      loadTime: parseFloat(elapsed),
    };
    setCachedKgData(cacheKey, fallbackResponse);
    return res.json(fallbackResponse);
  }
});

/**
 * Find an entity by slug/name across all fallback data.
 */
function findEntityBySlug(slug) {
  var data = getFallbackData();
  var normalized = slug.toLowerCase().replace(/-/g, ' ');
  var entity = null;
  var fi;
  for (fi = 0; fi < data.entities.length; fi++) {
    if (data.entities[fi].name.toLowerCase() === normalized) {
      entity = data.entities[fi];
      break;
    }
  }
  if (!entity && data.curricula) {
    for (fi = 0; fi < data.curricula.length; fi++) {
      if (data.curricula[fi].name.toLowerCase() === normalized) {
        entity = data.curricula[fi];
        break;
      }
    }
  }
  return entity;
}

/**
 * Lazy-load content-links.json (article↔curriculum mapping).
 */
var _contentLinksCache = null;
async function loadContentLinks() {
  if (_contentLinksCache) return _contentLinksCache;
  try {
    var url = new URL('file://' + process.cwd() + '/myhugoapp/data/curricula/content-links.json');
    var fs = await import('fs');
    _contentLinksCache = JSON.parse(fs.readFileSync(url.pathname, 'utf8'));
  } catch (err) {
    if (err.code !== 'ENOENT') console.warn('[content-links] load error: ' + err.message);
    _contentLinksCache = {};
  }
  return _contentLinksCache;
}

/**
 * Find content links for a curriculum topic using 3-level matching:
 * 1. exact normalized name → contentLinks[topicName]
 * 2. substring match on normalized name
 * 3. keyword match (first word before hyphen)
 */
async function findContentLinks(topicName) {
  var links = await loadContentLinks();
  var results = [];
  var normName = topicName.toLowerCase().trim();
  var matched = {};

  // 1. Exact match
  if (links[normName]) {
    for (var li = 0; li < links[normName].length; li++) {
      var item = links[normName][li];
      var key = item.url + '|' + item.title;
      if (!matched[key]) {
        matched[key] = true;
        results.push(item);
      }
    }
  }

  // 2. Substring match
  for (var topic in links) {
    if (topic !== normName && topic.indexOf(normName) !== -1) {
      for (var li2 = 0; li2 < links[topic].length; li2++) {
        var item2 = links[topic][li2];
        var key2 = item2.url + '|' + item2.title;
        if (!matched[key2]) {
          matched[key2] = true;
          results.push(item2);
        }
      }
    }
  }

  // 3. Fallback: first significant keyword (before hyphen or first word)
  var firstWord = normName.replace(/[^a-z0-9]/g, ' ');
  var words = firstWord.split(' ').filter(function (w) {
    return w.length > 3;
  });
  if (words.length > 0) {
    var primary = words[0];
    for (var topic2 in links) {
      if (
        topic2 !== normName &&
        topic2.indexOf(normName) === -1 &&
        topic2.indexOf(primary) !== -1
      ) {
        for (var li3 = 0; li3 < links[topic2].length; li3++) {
          var item3 = links[topic2][li3];
          var key3 = item3.url + '|' + item3.title;
          if (!matched[key3]) {
            matched[key3] = true;
            results.push(item3);
          }
        }
      }
    }
  }

  return results;
}

/**
 * GET /api/entity/:slug — Entity detail JSON.
 */
app.get('/api/entity/:slug', async function (req, res) {
  var slug = req.params.slug;
  var entity = findEntityBySlug(slug);
  if (!entity) {
    return res.status(404).json({ error: 'Entity not found', slug: slug });
  }

  // Resolve forward related entities
  var relatedEntities = [];
  if (entity.relatedEntities && entity.relatedEntities.length > 0) {
    for (var r = 0; r < entity.relatedEntities.length; r++) {
      var ref = entity.relatedEntities[r];
      var refName = typeof ref === 'string' ? ref : ref.name;
      var related = findEntityBySlug(refName);
      if (related) {
        var copy = {
          name: related.name,
          category: related.category || 'unknown',
        };
        if (related.curriculumMeta) {
          copy.curriculumMeta = related.curriculumMeta;
        }
        relatedEntities.push(copy);
      }
    }
  }

  // Reverse-lookup: find entities that reference this one
  var data = getFallbackData();
  var reverseEntityNames = {};
  for (var ei = 0; ei < relatedEntities.length; ei++) {
    reverseEntityNames[relatedEntities[ei].name] = true;
  }
  for (var _ei = 0; _ei < data.entities.length; _ei++) {
    var candidate = data.entities[_ei];
    if (candidate.name === entity.name) continue;
    if (reverseEntityNames[candidate.name]) continue;
    if (candidate.relatedEntities && candidate.relatedEntities.length > 0) {
      for (var _r = 0; _r < candidate.relatedEntities.length; _r++) {
        var _ref = candidate.relatedEntities[_r];
        var _refName = typeof _ref === 'string' ? _ref : _ref.name;
        if (_refName.toLowerCase() === entity.name.toLowerCase()) {
          reverseEntityNames[candidate.name] = true;
          relatedEntities.push({
            name: candidate.name,
            category: candidate.category || 'unknown',
            curriculumMeta: candidate.curriculumMeta || null,
          });
          break;
        }
      }
    }
  }

  var result = {
    name: entity.name,
    category: entity.category || 'unknown',
    articles: entity.articles || [],
    articleCount: entity.articleCount || 0,
    relatedEntities: relatedEntities,
  };

  if (entity.curriculumMeta) {
    result.curriculumMeta = entity.curriculumMeta;

    // Add content links for curriculum topics
    var contentLinks = await findContentLinks(entity.name);
    if (contentLinks.length > 0) {
      result.contentLinks = contentLinks.slice(0, 30);
    }
    // Quiz/exercise links for curriculum topics
    var quizCategories = [
      { kw: 'atom', label: 'Atommodelle und Kernchemie' },
      { kw: 'bindung', label: 'Chemische Bindungen' },
      { kw: 'saeure', label: 'Säuren und Basen' },
      { kw: 'base', label: 'Säuren und Basen' },
      { kw: 'redox', label: 'Redoxreaktionen' },
      { kw: 'stoechiometrie', label: 'Stöchiometrie' },
      { kw: 'stoffmeng', label: 'Stöchiometrie' },
      { kw: 'organisch', label: 'Organische Chemie' },
      { kw: 'kohlenwasserstoff', label: 'Organische Chemie' },
      { kw: 'periodensystem', label: 'Periodensystem' },
      { kw: 'pse', label: 'Periodensystem' },
    ];
    var quizLinks = [];
    var nameLower = entity.name.toLowerCase();
    for (var qi = 0; qi < quizCategories.length; qi++) {
      if (nameLower.indexOf(quizCategories[qi].kw) !== -1) {
        quizLinks.push({
          label: quizCategories[qi].label,
          url: '/lueckentexte/',
        });
      }
    }
    // Deduplicate
    var seenLabels = {};
    result.quizLinks = [];
    for (var qi2 = 0; qi2 < quizLinks.length; qi2++) {
      if (!seenLabels[quizLinks[qi2].label]) {
        seenLabels[quizLinks[qi2].label] = true;
        result.quizLinks.push(quizLinks[qi2]);
      }
    }

    // Phase 2.4: Learning path — group content by type for progression
    var learningPath = {
      articles: [],
      calculators: [],
      exercises: [],
    };
    if (result.contentLinks) {
      for (var lpi = 0; lpi < result.contentLinks.length; lpi++) {
        var cl = result.contentLinks[lpi];
        var type = (cl.type || 'article').toLowerCase();
        if (type === 'calculator' || type === 'simulation') {
          learningPath.calculators.push(cl);
        } else if (type === 'exercise') {
          learningPath.exercises.push(cl);
        } else {
          learningPath.articles.push(cl);
        }
      }
    }
    result.learningPath = learningPath;
  }

  res.json(result);
});

/**
 * GET /entity/:slug — Entity detail page (HTML).
 */
app.get('/entity/:slug', async function (req, res) {
  var slug = req.params.slug;
  var entity = findEntityBySlug(slug);

  if (!entity) {
    return res
      .status(404)
      .send(
        '<html><body style="font-family:sans-serif;padding:2em;color:#555">' +
          '<h1>Seite nicht gefunden</h1>' +
          '<p>Die angeforderte Entität <strong>' +
          escapeHtml(slug) +
          '</strong> existiert nicht.</p>' +
          '<a href="/entity/">← Zurück zur Übersicht</a>' +
          '</body></html>'
      );
  }

  var isCurriculum = entity.category === 'lehrplan';
  var displayName = entity.name.replace(/-/g, ' ').replace(/\b\w/g, function (c) {
    return c.toUpperCase();
  });
  var catColor = '#9b59b6';
  if (!isCurriculum) {
    var colors = {
      stoff: '#e74c3c',
      konzept: '#3498db',
      reaktion: '#2ecc71',
      methode: '#f39c12',
      person: '#1abc9c',
      quelle: '#95a5a6',
      didaktik: '#2e7d32',
    };
    catColor = colors[entity.category] || '#95a5a6';
  }

  var catLabel = entity.category;
  var catLabels = {
    stoff: 'Stoff',
    konzept: 'Konzept',
    reaktion: 'Reaktion',
    methode: 'Methode',
    person: 'Person',
    quelle: 'Quelle',
    lehrplan: 'Lehrplan',
    didaktik: 'KMK-Standard',
  };
  if (catLabels[entity.category]) catLabel = catLabels[entity.category];

  var metaHtml = '';
  if (isCurriculum && entity.curriculumMeta) {
    metaHtml =
      '<div class="meta-row">' +
      '<span class="meta-label">Bundesland</span><span class="meta-value">' +
      escapeHtml(entity.curriculumMeta.state) +
      '</span></div>' +
      '<div class="meta-row"><span class="meta-label">Schulform</span><span class="meta-value">' +
      escapeHtml(entity.curriculumMeta.school_type) +
      '</span></div>' +
      '<div class="meta-row"><span class="meta-label">Klasse</span><span class="meta-value">' +
      escapeHtml(entity.curriculumMeta.grade) +
      '</span></div>' +
      '<div class="meta-row"><span class="meta-label">Lernziele</span><span class="meta-value">' +
      entity.curriculumMeta.objective_count +
      '</span></div>';
  }

  // Collect all related entities (forward + reverse lookup)
  var kmkRefs = [];
  var quelleRefs = [];
  var otherRefs = [];
  var seenRefNames = {};

  function addRef(name) {
    if (seenRefNames[name]) return;
    seenRefNames[name] = true;
    var refEntity = findEntityBySlug(name);
    if (refEntity && refEntity.category === 'didaktik') {
      kmkRefs.push(name);
    } else if (refEntity && refEntity.category === 'quelle') {
      quelleRefs.push(name);
    } else if (refEntity) {
      otherRefs.push(name);
    }
  }

  // Forward: entity.relatedEntities
  if (entity.relatedEntities && entity.relatedEntities.length > 0) {
    for (var r = 0; r < entity.relatedEntities.length; r++) {
      var ref = entity.relatedEntities[r];
      var refName = typeof ref === 'string' ? ref : ref.name;
      addRef(refName);
    }
  }
  // Reverse: find entities that reference this one
  var data = getFallbackData();
  for (var ei = 0; ei < data.entities.length; ei++) {
    var candidate = data.entities[ei];
    if (candidate.name === entity.name) continue;
    if (candidate.relatedEntities && candidate.relatedEntities.length > 0) {
      for (var ri = 0; ri < candidate.relatedEntities.length; ri++) {
        var cr = candidate.relatedEntities[ri];
        var crName = typeof cr === 'string' ? cr : cr.name;
        if (
          crName.toLowerCase() === entity.name.toLowerCase() ||
          (candidate.category === 'quelle' &&
            crName.toLowerCase().indexOf(entity.name.toLowerCase()) !== -1)
        ) {
          addRef(candidate.name);
          break;
        }
      }
    }
  }

  var quelleHtml = '';
  if (quelleRefs.length > 0) {
    quelleHtml = '<h3>📚 Quellen</h3><div class="related-list">';
    for (var qi = 0; qi < quelleRefs.length; qi++) {
      quelleHtml +=
        '<a href="/entity/' +
        slugify(quelleRefs[qi]) +
        '/" class="quelle-chip">' +
        escapeHtml(
          quelleRefs[qi].replace(/-/g, ' ').replace(/\b\w/g, function (c) {
            return c.toUpperCase();
          })
        ) +
        '</a>';
    }
    quelleHtml += '</div>';
  }

  var kmkHtml = '';
  if (kmkRefs.length > 0) {
    kmkHtml = '<h3>KMK-Bildungsstandards</h3><div class="kmk-list">';
    for (var k = 0; k < kmkRefs.length; k++) {
      kmkHtml +=
        '<a href="/entity/' +
        slugify(kmkRefs[k]) +
        '/" class="kmk-chip">' +
        escapeHtml(
          kmkRefs[k]
            .replace(/^kmk-/i, 'KMK ')
            .replace(/-/g, ' ')
            .replace(/\b\w/g, function (c) {
              return c.toUpperCase();
            })
        ) +
        '</a>';
    }
    kmkHtml += '</div>';
  }

  var otherRelatedHtml = '';
  if (otherRefs.length > 0) {
    otherRelatedHtml = '<h3>Verwandte Begriffe</h3><div class="related-list">';
    for (var r2 = 0; r2 < otherRefs.length; r2++) {
      otherRelatedHtml +=
        '<a href="/entity/' +
        slugify(otherRefs[r2]) +
        '/" class="related-chip">' +
        escapeHtml(otherRefs[r2].replace(/-/g, ' ')) +
        '</a>';
    }
    otherRelatedHtml += '</div>';
  }

  var articlesHtml = '';

  // Learning path: group content by type (articles, calculators, exercises)
  var learningPathHtml = '';
  if (isCurriculum) {
    var clinks = await findContentLinks(entity.name);
    if (clinks.length > 0) {
      var sections = { article: [], calculator: [], simulation: [], exercise: [] };
      for (var cli2 = 0; cli2 < clinks.length; cli2++) {
        var cl2 = clinks[cli2];
        var t = (cl2.type || 'article').toLowerCase();
        if (sections[t]) sections[t].push(cl2);
        else sections.article.push(cl2);
      }
      var order = ['article', 'calculator', 'simulation', 'exercise'];
      var labels = {
        article: '📖 Artikel',
        calculator: '🔬 Rechner',
        simulation: '🎮 Simulationen',
        exercise: '✏️ Übungen',
      };
      for (var si = 0; si < order.length; si++) {
        var key = order[si];
        var items = sections[key];
        if (items.length === 0) continue;
        var maxShow = Math.min(items.length, 8);
        learningPathHtml +=
          '<h3>' + labels[key] + ' (' + items.length + ')</h3><div class="content-links-list">';
        for (var li = 0; li < maxShow; li++) {
          var item = items[li];
          learningPathHtml +=
            '<a href="' +
            escapeHtml(item.url) +
            '" class="content-link-card" target="_blank" rel="noopener">' +
            '<span class="content-link-title">' +
            escapeHtml(item.title) +
            '</span>' +
            '<span class="content-link-type">' +
            escapeHtml(item.type || 'article') +
            '</span>' +
            '</a>';
        }
        if (items.length > maxShow) {
          learningPathHtml +=
            '<div class="content-link-more">+' + (items.length - maxShow) + ' weitere</div>';
        }
        learningPathHtml += '</div>';
      }
    }
  }

  if (entity.articles && entity.articles.length > 0) {
    articlesHtml = '<h3>Artikel (' + entity.articles.length + ')</h3><ul class="article-list">';
    for (var a = 0; a < entity.articles.length; a++) {
      articlesHtml += '<li>' + escapeHtml(entity.articles[a]) + '</li>';
    }
    articlesHtml += '</ul>';
  }

  // Quiz links for curriculum topics
  var quizHtml = '';
  if (isCurriculum) {
    var qCategories = [
      { kw: 'atom', label: 'Atommodelle und Kernchemie' },
      { kw: 'bindung', label: 'Chemische Bindungen' },
      { kw: 'saeure', label: 'Säuren und Basen' },
      { kw: 'base', label: 'Säuren und Basen' },
      { kw: 'redox', label: 'Redoxreaktionen' },
      { kw: 'stoechiometrie', label: 'Stöchiometrie' },
      { kw: 'stoffmeng', label: 'Stöchiometrie' },
      { kw: 'organisch', label: 'Organische Chemie' },
      { kw: 'kohlenwasserstoff', label: 'Organische Chemie' },
      { kw: 'periodensystem', label: 'Periodensystem' },
      { kw: 'pse', label: 'Periodensystem' },
    ];
    var qLinks = [];
    var nameLower = entity.name.toLowerCase();
    for (var qzi = 0; qzi < qCategories.length; qzi++) {
      if (nameLower.indexOf(qCategories[qzi].kw) !== -1) {
        if (qLinks.indexOf(qCategories[qzi].label) === -1) {
          qLinks.push(qCategories[qzi].label);
        }
      }
    }
    if (qLinks.length > 0) {
      quizHtml = '<h3>📝 Übungen zu diesem Thema</h3><div class="quiz-links-list">';
      for (var qzi2 = 0; qzi2 < qLinks.length; qzi2++) {
        quizHtml +=
          '<a href="/lueckentexte/" class="quiz-link-card" target="_blank" rel="noopener">' +
          '<span class="quiz-link-label">' +
          escapeHtml(qLinks[qzi2]) +
          '</span>' +
          '<span class="quiz-link-arrow">→</span></a>';
      }
      quizHtml += '</div>';
    }
  }

  var backLink = isCurriculum ? '/' : '/entity/';

  res.send(
    '<!DOCTYPE html>' +
      '<html lang="de">' +
      '<head><meta charset="utf-8">' +
      '<meta name="viewport" content="width=device-width,initial-scale=1">' +
      '<title>' +
      escapeHtml(displayName) +
      ' - chemie-lernen.org</title>' +
      '<style>' +
      'body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;margin:0;padding:2rem;background:#f5f5f5;color:#333}' +
      '.container{max-width:800px;margin:0 auto}' +
      '.card{background:#fff;border-radius:12px;padding:2rem;box-shadow:0 2px 8px rgba(0,0,0,0.1)}' +
      '.cat-badge{display:inline-block;padding:4px 12px;border-radius:20px;color:#fff;font-size:.85rem;font-weight:600;background:' +
      catColor +
      '}' +
      'h1{margin:.5rem 0 1.5rem;font-size:1.8rem}' +
      '.meta-section{background:#fafafa;border-radius:8px;padding:1rem;margin:1rem 0}' +
      '.meta-row{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #eee}' +
      '.meta-row:last-child{border-bottom:none}' +
      '.meta-label{font-weight:600;color:#666}' +
      '.meta-value{color:#333}' +
      '.related-list{display:flex;flex-wrap:wrap;gap:8px;margin:.5rem 0}' +
      '.related-chip{display:inline-block;padding:6px 14px;background:#e8f0fe;color:#1a73e8;border-radius:20px;text-decoration:none;font-size:.9rem}' +
      '.related-chip:hover{background:#d2e3fc}' +
      '.quelle-chip{display:inline-block;padding:6px 14px;background:#fef3e2;color:#b8860b;border-radius:20px;text-decoration:none;font-size:.85rem;border:1px solid #f0d9b5}' +
      '.quelle-chip:hover{background:#fce4b8}' +
      '.kmk-list{display:flex;flex-wrap:wrap;gap:8px;margin:.5rem 0}' +
      '.kmk-chip{display:inline-block;padding:6px 14px;background:#e8f5e9;color:#2e7d32;border-radius:20px;text-decoration:none;font-size:.85rem;border:1px solid #a5d6a7}' +
      '.kmk-chip:hover{background:#c8e6c9;border-color:#388e3c}' +
      '.kmk-chip::before{content:"✓ ";font-weight:bold}' +
      '.content-links-list{display:flex;flex-direction:column;gap:6px;margin:.5rem 0}' +
      '.content-link-card{display:flex;align-items:center;gap:8px;padding:8px 12px;background:#f8f9fa;border-radius:8px;text-decoration:none;color:#333;font-size:.9rem;border:1px solid #e9ecef;transition:all .15s}' +
      '.content-link-card:hover{background:#e8f0fe;border-color:#1a73e8;transform:translateX(3px)}' +
      '.content-link-icon{font-size:1.1rem;flex-shrink:0}' +
      '.content-link-title{flex:1;font-weight:500}' +
      '.content-link-type{font-size:.75rem;color:#888;text-transform:uppercase;letter-spacing:.5px}' +
      '.content-link-more{text-align:center;font-size:.85rem;color:#888;padding:4px}' +
      '.quiz-links-list{display:flex;flex-wrap:wrap;gap:8px;margin:.5rem 0}' +
      '.quiz-link-card{display:flex;align-items:center;gap:6px;padding:8px 14px;background:#fff3e0;border:1px solid #ffcc80;border-radius:8px;text-decoration:none;color:#e65100;font-size:.9rem;transition:all .15s}' +
      '.quiz-link-card:hover{background:#ffe0b2;border-color:#ff9800;text-decoration:none}' +
      '.quiz-link-label{flex:1;font-weight:500}' +
      '.quiz-link-arrow{font-weight:bold;font-size:1.1rem}' +
      '.curricula-context{margin:1rem 0}' +
      '.curricula-context h3{font-size:1rem;margin:1rem 0 0.5rem}' +
      '.curricula-context-stats{display:flex;gap:1rem;font-size:0.85rem;color:var(--text-muted,#666);margin-bottom:0.5rem}' +
      '.curricula-context-stats strong{color:#9b59b6}' +
      '.topic-chip{display:inline-block;padding:4px 10px;margin:3px;background:#f3e5f5;color:#7b1fa2;border-radius:14px;text-decoration:none;font-size:0.8rem;border:1px solid #ce93d8}' +
      '.topic-chip:hover{background:#e1bee7;border-color:#7b1fa2}' +
      '.objective-chip{display:inline-block;padding:3px 8px;margin:2px;background:#e8f5e9;color:#2e7d32;border-radius:10px;font-size:0.75rem;border:1px solid #a5d6a7}' +
      '.article-list{padding-left:1.2rem}' +
      '.article-list li{margin:.5rem 0;color:#555}' +
      '.back-link{display:inline-block;margin-top:1.5rem;color:#666;text-decoration:none}' +
      '.back-link:hover{color:#333}' +
      '@media(prefers-color-scheme:dark){' +
      'body{background:#1a1a2e;color:#e0e0e0}' +
      '.card{background:#16213e;box-shadow:0 2px 8px rgba(0,0,0,0.4)}' +
      '.meta-section{background:#1a1a3e}' +
      '.related-chip{background:#2a2a5e;color:#7cb3ff}' +
      '.content-link-card{background:#2a2a4e;color:#e0e0e0;border-color:#444}' +
      '.quiz-link-card{background:#3a2a1e;color:#ffb74d;border-color:#6a4a2e}' +
      '.quiz-link-card:hover{background:#4a3a2e}' +
      '.content-link-card:hover{background:#3a3a6e}' +
      '.content-link-type{color:#999}' +
      '.kmk-chip{background:#1b3a1b;color:#81c784;border-color:#2e7d32}' +
      '.quelle-chip{background:#3a2a1b;color:#f0d9b5;border-color:#b8860b}' +
      '.meta-row{border-bottom-color:#333}' +
      '.meta-label{color:#999}' +
      '.topic-chip{background:#3a2050;color:#ce93d8;border-color:#7b1fa2}' +
      '.topic-chip:hover{background:#4a2060}' +
      '.objective-chip{background:#1b3a1b;color:#81c784;border-color:#2e7d32}' +
      '.curricula-context h3{color:#e0e0e0}' +
      '}</style>' +
      '</head><body>' +
      '<div class="container">' +
      '<div class="card">' +
      '<span class="cat-badge">' +
      escapeHtml(catLabel) +
      '</span>' +
      '<h1>' +
      escapeHtml(displayName) +
      '</h1>' +
      (isCurriculum ? '<div class="meta-section">' + metaHtml + '</div>' : '') +
      quelleHtml +
      kmkHtml +
      learningPathHtml +
      quizHtml +
      otherRelatedHtml +
      articlesHtml +
      '<div id="curricula-context" class="curricula-context"></div>' +
      '<a href="' +
      backLink +
      '" class="back-link">← Zurück</a>' +
      '</div></div>' +
      '<script>' +
      'fetch("/api/entities/' +
      slugify(slug) +
      '/curricula").then(function(r){return r.json()}).then(function(d){' +
      'var el=document.getElementById("curricula-context");' +
      'if(!el||!d.coveredTopics||!d.fulfilledObjectives)return;' +
      'var ct=d.coveredTopics.filter(function(t){return t.topic});' +
      'var fo=d.fulfilledObjectives.filter(function(o){return o.objective});' +
      'if(ct.length===0&&fo.length===0)return;' +
      'var h="<h3>📚 Lehrplan-Kontext</h3>";' +
      'h+="<div class=\\"curricula-context-stats\\">";' +
      'h+="<span><strong>"+ct.length+"</strong> Themen</span>";' +
      'h+="<span><strong>"+fo.length+"</strong> Lernziele</span>";' +
      'h+="</div>";' +
      'if(ct.length>0){' +
      'h+="<div class=\\"kmk-list\\">";' +
      'for(var i=0;i<ct.length;i++){' +
      'var topicSlug=ct[i].topic.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");' +
      'h+="<a href=\\"/entity/"+topicSlug+"/\\" class=\\"topic-chip\\">"+ct[i].topic.replace(/-/g," ")+"</a>";' +
      '}' +
      'h+="</div>";' +
      '}' +
      'if(fo.length>0){' +
      'h+="<p style=\\"font-size:0.8rem;color:#888;margin:0.5rem 0 0.25rem\\">Erfüllte Lernziele</p>";' +
      'h+="<div class=\\"kmk-list\\">";' +
      'for(var j=0;j<Math.min(fo.length,20);j++){' +
      'h+="<span class=\\"objective-chip\\">"+fo[j].objective.replace(/-/g," ")+"</span>";' +
      '}' +
      'if(fo.length>20)h+="<span class=\\"objective-chip\\">+"+(fo.length-20)+" weitere</span>";' +
      'h+="</div>";' +
      '}' +
      'el.innerHTML=h;' +
      '}).catch(function(){});' +
      '</script>' +
      '</body></html>'
  );
});

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

/**
 * Graceful shutdown / error handlers
 */
process.on('SIGTERM', async () => {
  if (neo4jDriver) {
    await neo4jDriver.close();
    neo4jDriver = null;
  }
  process.exit(0);
});

process.on('unhandledRejection', (reason) => {
  console.error('[process] UNHANDLED REJECTION:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[process] UNCAUGHT EXCEPTION:', err);
});

/**
 * Find an article by slug across all content directories.
 */
var _articleCache = null;
function loadArticleIndex() {
  if (_articleCache) return _articleCache;
  _articleCache = {};
  try {
    var contentDir = path.join(process.cwd(), 'myhugoapp', 'content', 'themenbereiche');
    var dirs = fs.readdirSync(contentDir);
    for (var di = 0; di < dirs.length; di++) {
      var subDir = path.join(contentDir, dirs[di]);
      var stat = fs.statSync(subDir);
      if (!stat.isDirectory()) continue;
      var files = fs.readdirSync(subDir);
      for (var fi = 0; fi < files.length; fi++) {
        if (!files[fi].endsWith('.md')) continue;
        var filePath = path.join(subDir, files[fi]);
        var content = fs.readFileSync(filePath, 'utf8');
        var fmMatch = content.match(/^---\n([\s\S]*?)\n---\n?/);
        if (!fmMatch) continue;
        var fm = {};
        var fmLines = fmMatch[1].split('\n');
        for (var li = 0; li < fmLines.length; li++) {
          var line = fmLines[li];
          var colonIdx = line.indexOf(':');
          if (colonIdx === -1) continue;
          var key = line.slice(0, colonIdx).trim();
          var val = line.slice(colonIdx + 1).trim();
          if (val.startsWith('[') && val.endsWith(']')) {
            try {
              fm[key] = JSON.parse(val.replace(/'/g, '"'));
            } catch {
              fm[key] = val;
            }
          } else if (val === 'true') {
            fm[key] = true;
          } else if (val === 'false') {
            fm[key] = false;
          } else {
            fm[key] = val.replace(/^"(.*)"$/, '$1');
          }
        }
        var slug = files[fi].replace(/\.md$/, '');
        fm._slug = slug;
        fm._url = '/themenbereiche/' + dirs[di] + '/' + slug + '/';
        fm._category = dirs[di];
        _articleCache[slug] = fm;
      }
    }
  } catch (err) {
    console.warn('[article-index] load error: ' + err.message);
  }
  return _articleCache;
}

/**
 * GET /api/article/:slug — Article detail JSON.
 */
app.get('/api/article/:slug', function (req, res) {
  var slug = req.params.slug;
  var index = loadArticleIndex();
  var article = index[slug];
  if (!article) {
    return res.status(404).json({ error: 'Article not found', slug: slug });
  }
  res.json({
    title: article.title || '',
    description: article.description || '',
    slug: article._slug,
    url: article._url,
    tags: article.tags || [],
    icon: article.icon || '',
    difficulty: article.schwierigkeit || '',
    category: article._category || '',
    interactive: !!article.interaktiv,
  });
});

/**
 * GET /api/curricula/compare?name=X — Find matching topics across all states.
 * Returns grouped results for P3a Ländervergleich.
 */
app.get('/api/curricula/compare', function (req, res) {
  var q = (req.query.name || '').toLowerCase().trim();
  if (!q) {
    return res.json({ results: {}, query: q, count: 0 });
  }

  var fallback = getFallbackData();
  var matches = [];
  var seen = {};

  // Search in fallback curricula
  for (var ci = 0; ci < fallback.curricula.length; ci++) {
    var c = fallback.curricula[ci];
    if (c.name.toLowerCase().indexOf(q) !== -1) {
      var key = c.curriculumMeta.state + '|' + c.name;
      if (!seen[key]) {
        seen[key] = true;
        matches.push({
          name: c.name,
          state: c.curriculumMeta.state,
          grade: c.curriculumMeta.grade,
          school_type: c.curriculumMeta.school_type,
          objective_count: c.curriculumMeta.objective_count,
        });
      }
    }
  }

  // Group by state
  var grouped = {};
  for (var mi = 0; mi < matches.length; mi++) {
    var m = matches[mi];
    if (!grouped[m.state]) grouped[m.state] = [];
    grouped[m.state].push(m);
  }

  res.json({ results: grouped, query: q, count: matches.length });
});

/**
 * GET /api/admin/chat-logs — Recent chat sessions for klassencockpit.
 */
app.get('/api/admin/chat-logs', function (req, res) {
  var limit = parseInt(req.query.limit) || 20;
  var sessions = [];
  sessionStore.forEach(function (session, id) {
    var userMsgCount = 0;
    var firstQuestion = '';
    for (var mi = 0; mi < session.messages.length; mi++) {
      var msg = session.messages[mi];
      if (msg.role === 'user') {
        userMsgCount++;
        if (!firstQuestion) firstQuestion = msg.content.slice(0, 120);
      }
    }
    sessions.push({
      sessionId: id,
      messageCount: session.messages.length,
      userMessageCount: userMsgCount,
      firstQuestion: firstQuestion,
      createdAt: session.createdAt,
      lastUsed: session.lastUsed,
    });
  });
  sessions.sort(function (a, b) {
    return new Date(b.lastUsed) - new Date(a.lastUsed);
  });
  sessions = sessions.slice(0, limit);
  res.json({ totalSessions: sessions.length, sessions: sessions });
});

app.get('/api/kg-stats', async (req, res) => {
  var statsCacheKey = 'kg-stats:v1';
  var statsCached = getCachedKgData(statsCacheKey);
  if (statsCached) return res.json(statsCached);

  try {
    var driver = getNeo4jDriver();
    var session = driver.session({
      database: NEO4J_DATABASE,
      defaultAccessMode: neo4j.session.READ,
      fetchSize: 1000,
    });

    var byKatResult = await session.run(
      `MATCH (e:Entity) WHERE e.kategorie IS NOT NULL
       RETURN e.kategorie AS kat, count(e) AS n ORDER BY n DESC`
    );
    var byCategory = {};
    byKatResult.records.forEach(function (r) {
      byCategory[r.get('kat')] = r.get('n').toNumber();
    });

    var relResult = await session.run(
      `MATCH (a)-[r]->(b)
       WHERE ${subsetWhere('a')} OR ${subsetWhere('b')}
       RETURN type(r) AS t, count(r) AS n ORDER BY n DESC`
    );
    var byRelType = {};
    relResult.records.forEach(function (r) {
      byRelType[r.get('t')] = r.get('n').toNumber();
    });

    var dqResult = await session.run(
      `MATCH (e:Entity)
       WITH e,
            (e.description IS NULL OR e.description = '') AS missingDesc,
            (e.kategorie IS NULL OR e.kategorie = '') AS missingKat
       WITH count(e) AS total,
            count(CASE WHEN missingDesc THEN 1 END) AS missingDescription,
            count(CASE WHEN missingKat THEN 1 END) AS missingKategorie
       RETURN total, missingDescription, missingKategorie`
    );
    var dq = dqResult.records[0];
    var totalEntities = dq.get('total').toNumber();
    var missingDescription = dq.get('missingDescription').toNumber();
    var missingKategorie = dq.get('missingKategorie').toNumber();

    var orphanResult = await session.run(
      `MATCH (e:Entity)
       WHERE NOT (e)-[:RELATED_TO|ERFUELLT|BESTEHT_AUS|GEHOERT_ZU]-()
         AND NOT (:Document)-[:MENTIONS]->(e)
       RETURN count(e) AS n`
    );
    var orphans = orphanResult.records[0].get('n').toNumber();

    var danglingResult = await session.run(
      `MATCH (a:Entity)-[r:RELATED_TO]->(b)
       WHERE b IS NULL
       RETURN count(r) AS n`
    );
    var dangling = danglingResult.records[0].get('n').toNumber();

    var dupResult = await session.run(
      `MATCH (e:Entity)
       WITH toLower(e.name) AS lname, collect(e) AS nodes
       WHERE size(nodes) > 1
       RETURN count(*) AS n`
    );
    var duplicates = dupResult.records[0].get('n').toNumber();

    // Curriculum coverage metrics
    var currCoverage = { totalTopics: 0, totalObjectives: 0, linkedEntities: 0, contentNodes: 0 };
    try {
      var ccResult = await session.run(`MATCH (t:Topic) RETURN count(t) AS topics`);
      currCoverage.totalTopics = ccResult.records[0].get('topics').toNumber();

      var objResult = await session.run(
        `MATCH (lo:LearningObjective) RETURN count(lo) AS objectives`
      );
      currCoverage.totalObjectives = objResult.records[0].get('objectives').toNumber();

      var linkResult = await session.run(
        `MATCH (e:Entity)-[:COVERS_TOPIC]->(:Topic)
         RETURN count(DISTINCT e) AS linked`
      );
      currCoverage.linkedEntities = linkResult.records[0].get('linked').toNumber();

      var contentNodeResult = await session.run(`MATCH (c:Content) RETURN count(c) AS cnt`);
      currCoverage.contentNodes = contentNodeResult.records[0].get('cnt').toNumber();
    } catch (ccErr) {
      console.warn('[kg-stats] curriculum coverage query failed:', ccErr.message);
    }

    await session.close();

    var payload = {
      source: 'neo4j',
      generatedAt: new Date().toISOString(),
      totals: {
        entities: totalEntities,
        relations: Object.values(byRelType).reduce(function (a, b) {
          return a + b;
        }, 0),
      },
      byCategory: byCategory,
      byRelType: byRelType,
      curriculumCoverage: currCoverage,
      quality: {
        missingDescription: missingDescription,
        missingKategorie: missingKategorie,
        orphans: orphans,
        danglingRefs: dangling,
        duplicateNames: duplicates,
        descriptionCoveragePct:
          totalEntities > 0
            ? Math.round(((totalEntities - missingDescription) / totalEntities) * 1000) / 10
            : 0,
        kategorieCoveragePct:
          totalEntities > 0
            ? Math.round(((totalEntities - missingKategorie) / totalEntities) * 1000) / 10
            : 0,
      },
    };

    setCachedKgData(statsCacheKey, payload, 300);
    res.json(payload);
  } catch (err) {
    console.error('[kg-stats] ERROR:', err.message);
    res.status(503).json({
      error: 'kg-stats unavailable',
      message: err.message,
    });
  }
});

/**
 * GET /api/curricula/states — List all states with curriculum data.
 * Returns: [{ state, stateName, topicCount }] sorted by state.
 */
app.get('/api/curricula/states', async (req, res) => {
  try {
    const driver = getNeo4jDriver();
    const session = driver.session({
      database: NEO4J_DATABASE,
      defaultAccessMode: neo4j.session.READ,
    });
    const result = await session.run(
      `MATCH (c:Curriculum)
       WITH c.state_abbr AS state, c.state AS stateName,
            count(c) AS curriculumCount
       RETURN state, stateName, curriculumCount
       ORDER BY state`
    );
    await session.close();
    const states = result.records.map((r) => ({
      state: r.get('state'),
      stateName: r.get('stateName'),
      curriculumCount: r.get('curriculumCount').toNumber(),
    }));
    res.json({ source: 'neo4j', states, count: states.length });
  } catch (err) {
    console.error('[curricula/states] Neo4j error:', err.message);
    try {
      const fb = getFallbackData();
      const seen = {};
      const states = [];
      for (const c of fb.curricula) {
        if (c.curriculumMeta && !seen[c.curriculumMeta.state]) {
          seen[c.curriculumMeta.state] = true;
          states.push({
            state: c.curriculumMeta.state,
            stateName: c.curriculumMeta.state,
            curriculumCount: 1,
          });
        }
      }
      res.json({ source: 'fallback', states, count: states.length });
    } catch {
      res.status(503).json({ error: 'Curriculum data unavailable' });
    }
  }
});

/**
 * GET /api/curricula/topics — List curriculum topics with optional filters.
 * Query params: ?state=, ?grade=, ?schoolType=, ?search=, ?limit=, ?offset=
 */
app.get('/api/curricula/topics', async (req, res) => {
  const state = (req.query.state || '').trim();
  const grade = (req.query.grade || '').trim();
  const schoolType = (req.query.schoolType || '').trim();
  const search = (req.query.search || '').toLowerCase().trim();
  const limit = Math.min(parseInt(req.query.limit) || 200, 1000);
  const offset = parseInt(req.query.offset) || 0;

  try {
    const driver = getNeo4jDriver();
    const session = driver.session({
      database: NEO4J_DATABASE,
      defaultAccessMode: neo4j.session.READ,
      fetchSize: 1000,
    });

    let matchClause = 'MATCH (c:Curriculum)-[:HAS_TOPIC]->(t:Topic)';
    let whereClause = 'WHERE 1=1';
    const params = {};
    if (state) {
      whereClause += ' AND c.state_abbr = $state';
      params.state = state;
    }
    if (grade) {
      whereClause += ' AND t.grade = $grade';
      params.grade = grade;
    }
    if (schoolType) {
      whereClause += ' AND c.school_type = $schoolType';
      params.schoolType = schoolType;
    }
    if (search) {
      whereClause += ' AND toLower(t.title) CONTAINS $search';
      params.search = search;
    }

    const countResult = await session.run(
      `${matchClause} ${whereClause} RETURN count(t) AS total`,
      params
    );
    const total = countResult.records[0].get('total').toNumber();

    const result = await session.run(
      `${matchClause} ${whereClause}
       OPTIONAL MATCH (t)-[:HAS_LEARNING_OBJECTIVE]->(lo:LearningObjective)
       WITH t, c, count(DISTINCT lo) AS objectiveCount
       RETURN t.slug AS slug, t.title AS title, t.grade AS grade,
              c.state_abbr AS state, c.school_type AS schoolType,
              objectiveCount
       ORDER BY c.state_abbr, t.grade, t.title
       SKIP ${offset} LIMIT ${limit}`,
      params
    );
    await session.close();

    const topics = result.records.map((r) => ({
      slug: r.get('slug'),
      title: r.get('title'),
      state: r.get('state'),
      grade: r.get('grade'),
      schoolType: r.get('schoolType'),
      objectiveCount: r.get('objectiveCount').toNumber(),
    }));
    res.json({ source: 'neo4j', topics, total, limit, offset });
  } catch (err) {
    console.error('[curricula/topics] Neo4j error:', err.message);
    try {
      const fb = getFallbackData();
      let topics = fb.curricula.map((c) => ({
        slug: c.name,
        title: c.name,
        state: c.curriculumMeta.state,
        grade: c.curriculumMeta.grade,
        schoolType: c.curriculumMeta.school_type,
        objectiveCount: c.curriculumMeta.objective_count,
      }));
      if (state) topics = topics.filter((t) => t.state === state);
      if (grade) topics = topics.filter((t) => t.grade === grade);
      if (search) topics = topics.filter((t) => (t.title || '').includes(search));
      const total = topics.length;
      topics = topics.slice(offset, offset + limit);
      res.json({ source: 'fallback', topics, total, limit, offset });
    } catch {
      res.status(503).json({ error: 'Curriculum topics unavailable' });
    }
  }
});

/**
 * GET /api/curricula/objectives — List learning objectives.
 * Query params: ?topic=, ?search=, ?limit=, ?offset=
 */
app.get('/api/curricula/objectives', async (req, res) => {
  const topic = (req.query.topic || '').trim();
  const search = (req.query.search || '').toLowerCase().trim();
  const limit = Math.min(parseInt(req.query.limit) || 200, 1000);
  const offset = parseInt(req.query.offset) || 0;

  try {
    const driver = getNeo4jDriver();
    const session = driver.session({
      database: NEO4J_DATABASE,
      defaultAccessMode: neo4j.session.READ,
      fetchSize: 1000,
    });

    let matchClause = 'MATCH (lo:LearningObjective)';
    let whereClause = 'WHERE 1=1';
    const params = {};
    if (topic) {
      matchClause = 'MATCH (t:Topic)-[:HAS_LEARNING_OBJECTIVE]->(lo:LearningObjective)';
      whereClause += ' AND (t.slug CONTAINS $topic OR t.title CONTAINS $topic)';
      params.topic = topic;
    }
    if (search) {
      whereClause += ' AND toLower(lo.text) CONTAINS $search';
      params.search = search;
    }

    const countResult = await session.run(
      `${matchClause} ${whereClause} RETURN count(lo) AS total`,
      params
    );
    const total = countResult.records[0].get('total').toNumber();

    const result = await session.run(
      `${matchClause} ${whereClause}
       OPTIONAL MATCH (t:Topic)-[:HAS_LEARNING_OBJECTIVE]->(lo)
       OPTIONAL MATCH (c:Curriculum)-[:HAS_TOPIC]->(t)
       RETURN lo.slug AS slug, lo.text AS text,
              t.slug AS topicSlug, t.title AS topicTitle,
              c.state_abbr AS state, t.grade AS grade
       ORDER BY lo.text
       SKIP ${offset} LIMIT ${limit}`,
      params
    );
    await session.close();

    const objectives = result.records.map((r) => ({
      slug: r.get('slug'),
      text: r.get('text'),
      topicSlug: r.get('topicSlug'),
      topicTitle: r.get('topicTitle'),
      state: r.get('state'),
      grade: r.get('grade'),
    }));
    res.json({ source: 'neo4j', objectives, total, limit, offset });
  } catch (err) {
    console.error('[curricula/objectives] Neo4j error:', err.message);
    res.status(503).json({ error: 'Learning objectives unavailable' });
  }
});

/**
 * GET /api/curricula/by-state/:state — Full curriculum tree for a state.
 * Returns all topics for the given state (2-letter code, e.g. "NW", "BY"),
 * each with its learning objectives and linked content.
 */
app.get('/api/curricula/by-state/:state', async (req, res) => {
  const state = req.params.state.toUpperCase();
  if (!state || state.length !== 2) {
    return res.status(400).json({ error: 'Invalid state code', state });
  }

  try {
    var driver = getNeo4jDriver();
    var session = driver.session({
      database: NEO4J_DATABASE,
      defaultAccessMode: neo4j.session.READ,
      fetchSize: 5000,
    });

    const result = await session.run(
      `MATCH (c:Curriculum {state_abbr: $state})
       OPTIONAL MATCH (c)-[:HAS_TOPIC]->(t:Topic)
       OPTIONAL MATCH (t)-[:HAS_LEARNING_OBJECTIVE]->(lo:LearningObjective)
       WITH c, t, collect(DISTINCT lo.text) AS objectives
       RETURN c.slug AS curriculumSlug, c.school_type AS schoolType,
              t.slug AS slug, t.title AS title, t.grade AS grade,
              size(objectives) AS objectiveCount,
              [ob IN objectives WHERE ob IS NOT NULL] AS objectives
       ORDER BY t.grade, t.title`,
      { state }
    );
    await session.close();

    const topics = result.records.map(function (r) {
      return {
        slug: r.get('slug'),
        title: r.get('title'),
        grade: r.get('grade'),
        schoolType: r.get('schoolType'),
        objectiveCount: r.get('objectiveCount').toNumber(),
        objectives: r.get('objectives'),
      };
    });

    res.json({
      source: 'neo4j',
      state,
      topicCount: topics.length,
      totalObjectives: topics.reduce((s, t) => s + t.objectiveCount, 0),
      topics,
    });
  } catch (err) {
    console.error('[curricula/by-state] Neo4j error:', err.message);
    try {
      var fb = getFallbackData();
      var fTopics = fb.curricula.filter(function (c) {
        return c.curriculumMeta && c.curriculumMeta.state === state;
      });
      res.json({
        source: 'fallback',
        state,
        topicCount: fTopics.length,
        totalObjectives: fTopics.reduce(function (s, t) {
          return s + (t.curriculumMeta.objective_count || 0);
        }, 0),
        topics: fTopics.map(function (c) {
          return {
            name: c.name,
            grade: c.curriculumMeta.grade,
            schoolType: c.curriculumMeta.school_type,
            displayName: c.name,
            objectiveCount: c.curriculumMeta.objective_count || 0,
            objectives: [],
            contentLinks: [],
          };
        }),
      });
    } catch {
      res.status(503).json({ error: 'Curriculum data unavailable' });
    }
  }
});

/**
 * GET /api/curricula/by-state/:state/grade/:grade — Topics for a specific state and grade.
 * Returns topics with objectives and content links, filtered by grade level.
 */
app.get('/api/curricula/by-state/:state/grade/:grade', async (req, res) => {
  const state = req.params.state.toUpperCase();
  const grade = req.params.grade;
  if (!state || state.length !== 2) {
    return res.status(400).json({ error: 'Invalid state code', state });
  }

  try {
    const driver = getNeo4jDriver();
    const session = driver.session({
      database: NEO4J_DATABASE,
      defaultAccessMode: neo4j.session.READ,
      fetchSize: 5000,
    });

    const result = await session.run(
      `MATCH (c:Curriculum {state_abbr: $state})
       MATCH (c)-[:HAS_TOPIC]->(t:Topic {grade: $grade})
       OPTIONAL MATCH (t)-[:HAS_LEARNING_OBJECTIVE]->(lo:LearningObjective)
       WITH t, collect(DISTINCT lo.text) AS objectives
       RETURN t.slug AS slug, t.title AS title, t.grade AS grade,
              size(objectives) AS objectiveCount,
              [ob IN objectives WHERE ob IS NOT NULL] AS objectives
       ORDER BY t.title`,
      { state, grade }
    );
    await session.close();

    const topics = result.records.map(function (r) {
      return {
        slug: r.get('slug'),
        title: r.get('title'),
        grade: r.get('grade'),
        objectiveCount: r.get('objectiveCount').toNumber(),
        objectives: r.get('objectives'),
      };
    });

    res.json({
      source: 'neo4j',
      state,
      grade,
      topicCount: topics.length,
      totalObjectives: topics.reduce((s, t) => s + t.objectiveCount, 0),
      topics,
    });
  } catch (err) {
    console.error('[curricula/by-state/grade] Neo4j error:', err.message);
    res.status(503).json({ error: 'Curriculum data unavailable' });
  }
});

/**
 * GET /api/curricula/topic/:slug/articles — Content nodes covering a curriculum topic.
 * Returns articles/calculators linked via COVERS_TOPIC or :RELATED_TO to the given topic.
 */
app.get('/api/curricula/topic/:slug/articles', async (req, res) => {
  const slug = decodeURIComponent(req.params.slug).trim();
  if (!slug) {
    return res.status(400).json({ error: 'Topic slug required' });
  }

  try {
    const driver = getNeo4jDriver();
    const session = driver.session({
      database: NEO4J_DATABASE,
      defaultAccessMode: neo4j.session.READ,
    });

    const result = await session.run(
      `MATCH (t:Topic) WHERE t.slug CONTAINS $slug OR t.title CONTAINS $slug
       OPTIONAL MATCH (e:Entity)-[:COVERS_TOPIC]->(t)
       OPTIONAL MATCH (t)-[:RELATED_TO]->(e:Entity)
       OPTIONAL MATCH (e)-[:MENTIONS]->(c:Content)
       RETURN t.slug AS topicSlug, t.title AS title, t.grade AS grade,
              collect(DISTINCT {name: e.name, kategorie: e.kategorie}) AS coveringEntities,
              collect(DISTINCT {url: c.url, title: c.title, type: c.type}) AS contentLinks`,
      { slug }
    );
    await session.close();

    if (result.records.length === 0) {
      return res.status(404).json({ error: 'Topic not found', slug });
    }

    const row = result.records[0];
    res.json({
      source: 'neo4j',
      topic: {
        slug: row.get('topicSlug'),
        title: row.get('title'),
        grade: row.get('grade'),
      },
      coveringEntities: row.get('coveringEntities').filter((e) => e.name),
      contentLinks: row.get('contentLinks').filter((c) => c.url),
    });
  } catch (err) {
    console.error('[curricula/topic/articles] Neo4j error:', err.message);
    res.status(503).json({ error: 'Topic articles unavailable' });
  }
});

/**
 * GET /api/curricula/objective/:slug/articles — Content that FULFILLS a learning objective.
 * Returns entities and content nodes linked via FULFILLS + MENTIONS.
 */
app.get('/api/curricula/objective/:slug/articles', async (req, res) => {
  const slug = decodeURIComponent(req.params.slug).trim();
  if (!slug) {
    return res.status(400).json({ error: 'Objective slug required' });
  }

  try {
    const driver = getNeo4jDriver();
    const session = driver.session({
      database: NEO4J_DATABASE,
      defaultAccessMode: neo4j.session.READ,
    });

    const result = await session.run(
      `MATCH (lo:LearningObjective) WHERE lo.slug CONTAINS $slug OR lo.text CONTAINS $slug
       OPTIONAL MATCH (e:Entity)-[:FULFILLS]->(lo)
       OPTIONAL MATCH (e)-[:MENTIONS]->(c:Content)
       OPTIONAL MATCH (t:Topic)-[:HAS_LEARNING_OBJECTIVE]->(lo)
       RETURN lo.slug AS objSlug, lo.text AS text,
              t.slug AS topicSlug, t.title AS topicTitle,
              collect(DISTINCT {name: e.name, kategorie: e.kategorie}) AS fulfillingEntities,
              collect(DISTINCT {url: c.url, title: c.title, type: c.type}) AS contentLinks`,
      { slug }
    );
    await session.close();

    if (result.records.length === 0) {
      return res.status(404).json({ error: 'Objective not found', slug });
    }

    const row = result.records[0];
    res.json({
      source: 'neo4j',
      objective: {
        slug: row.get('objSlug'),
        text: row.get('text'),
        topic: row.get('topicSlug'),
        topicTitle: row.get('topicTitle'),
      },
      fulfillingEntities: row.get('fulfillingEntities').filter((e) => e.name),
      contentLinks: row.get('contentLinks').filter((c) => c.url),
    });
  } catch (err) {
    console.error('[curricula/objective/articles] Neo4j error:', err.message);
    res.status(503).json({ error: 'Objective articles unavailable' });
  }
});

/**
 * GET /api/entities/:name/curricula — Curriculum context for an entity.
 * Shows which topics this entity COVERS_TOPIC, which objectives it FULFILLS,
 * and which Content nodes it MENTIONS.
 */
app.get('/api/entities/:name/curricula', async (req, res) => {
  const nameParam = decodeURIComponent(req.params.name).trim();

  try {
    const driver = getNeo4jDriver();
    const session = driver.session({
      database: NEO4J_DATABASE,
      defaultAccessMode: neo4j.session.READ,
    });

    const result = await session.run(
      `MATCH (e:Entity)
       WHERE toLower(e.name) = toLower($name)
       OPTIONAL MATCH (e)-[:COVERS_TOPIC]->(t:Topic)
       OPTIONAL MATCH (e)-[:FULFILLS]->(lo:LearningObjective)
       OPTIONAL MATCH (e)-[:MENTIONS]->(c:Content)
       OPTIONAL MATCH (t2:Topic)-[:HAS_LEARNING_OBJECTIVE]->(lo)
       RETURN e.name AS name, e.kategorie AS kategorie,
              collect(DISTINCT {
                slug: t.slug, title: t.title,
                state: t.state, grade: t.grade
              }) AS coveredTopics,
              collect(DISTINCT {
                slug: lo.slug, text: lo.text,
                topicSlug: t2.slug, topicTitle: t2.title
              }) AS fulfilledObjectives,
              collect(DISTINCT {
                url: c.url, title: c.title, type: c.type
              }) AS contentLinks`,
      { name: nameParam }
    );
    await session.close();

    if (result.records.length === 0 || !result.records[0].get('name')) {
      return res.status(404).json({ error: 'Entity not found', name: nameParam });
    }

    const r = result.records[0];
    const coveredTopics = (r.get('coveredTopics') || []).filter((t) => t.slug != null);
    const fulfilledObjectives = (r.get('fulfilledObjectives') || []).filter((o) => o.slug != null);
    const contentLinks = (r.get('contentLinks') || []).filter((c) => c.url !== null);

    res.json({
      source: 'neo4j',
      entity: {
        name: r.get('name'),
        kategorie: r.get('kategorie'),
      },
      coveredTopics,
      fulfilledObjectives,
      contentLinks,
      stats: {
        coveredTopics: coveredTopics.length,
        fulfilledObjectives: fulfilledObjectives.length,
        contentLinks: contentLinks.length,
      },
    });
  } catch (err) {
    console.error('[entities/curricula] Neo4j error:', err.message);
    res.status(503).json({ error: 'Curriculum context unavailable' });
  }
});

/**
 * GET /api/curricula/linked-entities — Entity names linked to curriculum data.
 * Returns entity names that have COVERS_TOPIC or FULFILLS relationships.
 * Used by the Wissensnetz "Lehrplan" filter chip.
 */
app.get('/api/curricula/linked-entities', async (req, res) => {
  try {
    const driver = getNeo4jDriver();
    const session = driver.session({
      database: NEO4J_DATABASE,
      defaultAccessMode: neo4j.session.READ,
    });

    const result = await session.run(
      `MATCH (e:Entity)-[:COVERS_TOPIC|FULFILLS]->()
       RETURN collect(DISTINCT e.name) AS names`
    );
    await session.close();

    const names = (result.records[0]?.get('names') || []).map((n) => n);
    res.json({ names, count: names.length });
  } catch (err) {
    console.error('[curricula/linked-entities] Neo4j error:', err.message);
    res.status(503).json({ error: 'Linked entities unavailable', names: [], count: 0 });
  }
});

/**
 * GET /api/content — List Content nodes.
 * Query params: ?type= (article|calculator), ?search=, ?limit=, ?offset=
 */
app.get('/api/content', async (req, res) => {
  const type = (req.query.type || '').trim();
  const search = (req.query.search || '').toLowerCase().trim();
  const limit = Math.min(parseInt(req.query.limit) || 50, 500);
  const offset = parseInt(req.query.offset) || 0;

  try {
    const driver = getNeo4jDriver();
    const session = driver.session({
      database: NEO4J_DATABASE,
      defaultAccessMode: neo4j.session.READ,
    });

    let whereExtra = '';
    const params = {};
    if (type) {
      whereExtra = ' AND c.type = $type';
      params.type = type;
    }
    if (search) {
      whereExtra += ' AND toLower(c.title) CONTAINS $search';
      params.search = search;
    }

    const result = await session.run(
      `MATCH (c:Content)
       WHERE true${whereExtra}
       RETURN c.url AS url, c.title AS title, c.type AS type,
              labels(c) AS labels
       ORDER BY c.type, c.title
       SKIP ${offset} LIMIT ${limit}`,
      params
    );
    await session.close();

    const items = result.records.map((r) => ({
      url: r.get('url'),
      title: r.get('title'),
      type: r.get('type'),
      labels: r.get('labels'),
    }));
    res.json({ source: 'neo4j', items, count: items.length, limit, offset });
  } catch (err) {
    console.error('[content] Neo4j error:', err.message);
    try {
      const links = await loadContentLinks();
      const seen = {};
      const items = [];
      for (const [, entries] of Object.entries(links)) {
        for (const item of entries) {
          const key = item.url;
          if (seen[key]) continue;
          seen[key] = true;
          if (type && item.type !== type) continue;
          if (search && !item.title.toLowerCase().includes(search)) continue;
          items.push({ url: item.url, title: item.title, type: item.type, labels: ['Content'] });
        }
      }
      const total = items.length;
      const paginated = items.slice(offset, offset + limit);
      res.json({
        source: 'fallback',
        items: paginated,
        total,
        count: paginated.length,
        limit,
        offset,
      });
    } catch {
      res.status(503).json({ error: 'Content list unavailable' });
    }
  }
});

/**
 * GET /api/didaktik — List didactic guidelines (KMK standards).
 * Query params: ?institution=, ?search=, ?limit=
 */
app.get('/api/didaktik', async (req, res) => {
  const institution = (req.query.institution || '').trim();
  const search = (req.query.search || '').toLowerCase().trim();
  const limit = Math.min(parseInt(req.query.limit) || 50, 500);

  try {
    const driver = getNeo4jDriver();
    const session = driver.session({
      database: NEO4J_DATABASE,
      defaultAccessMode: neo4j.session.READ,
    });

    let whereClause = '';
    const params = {};
    if (institution) {
      whereClause += ' AND toLower(dg.institution) CONTAINS $institution';
      params.institution = institution.toLowerCase();
    }
    if (search) {
      whereClause +=
        ' AND (toLower(dg.title) CONTAINS $search OR toLower(dg.name) CONTAINS $search)';
      params.search = search;
    }

    const result = await session.run(
      `MATCH (dg:DidacticGuideline)
       WHERE 1=1${whereClause}
       OPTIONAL MATCH (dg)-[:HAS_SECTION]->(gs:GuidelineSection)
       WITH dg, count(gs) AS sectionCount
       RETURN dg.name AS name, dg.title AS title,
              dg.source_type AS sourceType, dg.institution AS institution,
              dg.url AS url, dg.section_count AS sectionCountDb,
              sectionCount AS sectionCountActual
       ORDER BY dg.title
       LIMIT ${limit}`,
      params
    );
    await session.close();
    const items = result.records.map((r) => ({
      name: r.get('name'),
      title: r.get('title'),
      sourceType: r.get('sourceType'),
      institution: r.get('institution'),
      url: r.get('url'),
      sectionCount: r.get('sectionCountActual').toNumber(),
    }));
    res.json({ source: 'neo4j', items, count: items.length });
  } catch (err) {
    console.error('[didaktik] Neo4j error:', err.message);
    res.status(503).json({ error: 'Didaktik data unavailable' });
  }
});

/**
 * GET /api/modulhandbuch/universities — List all indexed universities.
 */
app.get('/api/modulhandbuch/universities', async (req, res) => {
  try {
    const driver = getNeo4jDriver();
    const session = driver.session({
      database: NEO4J_DATABASE,
      defaultAccessMode: neo4j.session.READ,
    });
    const result = await session.run(
      `MATCH (u:University)
       RETURN u.short_code AS shortCode, u.name AS name, u.country AS country,
              u.city AS city, u.website AS website
       ORDER BY u.name`
    );
    await session.close();
    const seen = new Map();
    result.records.forEach((r) => {
      const name = r.get('name');
      if (!seen.has(name)) {
        seen.set(name, {
          shortCode: r.get('shortCode'),
          name: name,
          country: r.get('country'),
          city: r.get('city'),
          website: r.get('website'),
        });
      }
    });
    res.json({
      source: 'neo4j',
      universities: Array.from(seen.values()),
    });
  } catch (err) {
    console.error('[modulhandbuch/universities] Neo4j error:', err.message);
    res.status(503).json({ error: 'University data unavailable' });
  }
});

/**
 * GET /api/modulhandbuch/university/:shortCode — Single university with its modules.
 */
app.get('/api/modulhandbuch/university/:shortCode', async (req, res) => {
  const shortCode = req.params.shortCode.toUpperCase().trim();
  try {
    const driver = getNeo4jDriver();
    const session = driver.session({
      database: NEO4J_DATABASE,
      defaultAccessMode: neo4j.session.READ,
    });
    const result = await session.run(
      `MATCH (u:University {short_code: $code})
       OPTIONAL MATCH (u)-[:OFFERS_DEGREE]->(d:Degree)
       OPTIONAL MATCH (m:UniversityModule {university: $code})
       RETURN u, collect(DISTINCT d{.*}) AS degrees,
              collect(DISTINCT m{.*}) AS modules`,
      { code: shortCode }
    );
    await session.close();
    if (!result.records.length) return res.status(404).json({ error: 'University not found' });
    const r = result.records[0];
    const u = r.get('u');
    if (!u) return res.status(404).json({ error: 'University not found' });
    res.json({
      source: 'neo4j',
      university: {
        shortCode: u.properties.short_code,
        name: u.properties.name,
        country: u.properties.country,
        city: u.properties.city,
        website: u.properties.website,
      },
      degrees: r.get('degrees').filter((d) => d.name),
      modules: r
        .get('modules')
        .filter((m) => m.module_code)
        .map((m) => ({
          code: m.module_code,
          name: m.module_name,
          ects: m.ects,
          level: m.level,
          degree: m.degree,
          semesterOffered: m.semester_offered,
        })),
    });
  } catch (err) {
    console.error('[modulhandbuch/university] Neo4j error:', err.message);
    res.status(503).json({ error: 'University data unavailable' });
  }
});

/**
 * GET /api/modulhandbuch/module/:univCode/:moduleCode — Single module detail.
 */
app.get('/api/modulhandbuch/module/:univCode/:moduleCode', async (req, res) => {
  const univCode = req.params.univCode.toLowerCase().trim();
  const moduleCode = req.params.moduleCode.trim();
  try {
    const driver = getNeo4jDriver();
    const session = driver.session({
      database: NEO4J_DATABASE,
      defaultAccessMode: neo4j.session.READ,
    });
    const result = await session.run(
      `MATCH (m:UniversityModule {module_code: $code, university: $univ})
       OPTIONAL MATCH (m)-[:CARRIES]->(e:ECTS)
       OPTIONAL MATCH (m)-[:PART_OF]->(d:Degree)
       OPTIONAL MATCH (off:ModuleOffering {module_code: $code, university: $univ})-[:TAUGHT_BY]->(l:Lecturer)
       RETURN m, e{.*} AS ects, d{.*} AS degree,
              collect(DISTINCT {semester: off.semester, year: off.year, lecturer: l.name}) AS offerings`,
      { code: moduleCode, univ: univCode }
    );
    await session.close();
    if (!result.records.length) return res.status(404).json({ error: 'Module not found' });
    const r = result.records[0];
    const m = r.get('m');
    if (!m) return res.status(404).json({ error: 'Module not found' });
    res.json({
      source: 'neo4j',
      module: {
        code: m.properties.module_code,
        name: m.properties.module_name,
        ects: m.properties.ects,
        workloadHours: m.properties.workload_hours,
        language: m.properties.language,
        level: m.properties.level,
        degree: m.properties.degree,
        university: m.properties.university,
        semesterOffered: m.properties.semester_offered,
        learningOutcomes: m.properties.learning_outcomes,
        content: m.properties.content,
        prerequisites: m.properties.prerequisites,
        examination: m.properties.examination,
        url: m.properties.url,
      },
      ects: r.get('ects').credits
        ? { credits: r.get('ects').credits, workloadHours: r.get('ects').workload_hours }
        : null,
      degree: r.get('degree').name ? r.get('degree') : null,
      offerings: r.get('offerings').filter((o) => o.semester),
    });
  } catch (err) {
    console.error('[modulhandbuch/module] Neo4j error:', err.message);
    res.status(503).json({ error: 'Module data unavailable' });
  }
});

/**
 * GET /api/modulhandbuch/search — Search modules across all universities.
 * Query params: ?q= (required), ?limit=, ?offset=
 */
app.get('/api/modulhandbuch/search', async (req, res) => {
  const q = (req.query.q || '').toLowerCase().trim();
  if (!q) return res.status(400).json({ error: 'Query param "q" is required' });
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const offset = parseInt(req.query.offset) || 0;
  try {
    const driver = getNeo4jDriver();
    const session = driver.session({
      database: NEO4J_DATABASE,
      defaultAccessMode: neo4j.session.READ,
      fetchSize: 200,
    });
    const [result, totalResult] = await Promise.all([
      session.run(
        `MATCH (m:UniversityModule)
         WHERE toLower(m.module_name) CONTAINS $q OR toLower(m.module_code) CONTAINS $q
         RETURN m.module_code AS code, m.module_name AS name, m.university AS university,
                m.ects AS ects, m.level AS level, m.degree AS degree
         ORDER BY m.university, m.module_name
         SKIP ${offset} LIMIT ${limit}`,
        { q }
      ),
      session.run(
        `MATCH (m:UniversityModule)
         WHERE toLower(m.module_name) CONTAINS $q OR toLower(m.module_code) CONTAINS $q
         RETURN count(m) AS total`,
        { q }
      ),
    ]);
    await session.close();
    res.json({
      source: 'neo4j',
      modules: result.records.map((r) => ({
        code: r.get('code'),
        name: r.get('name'),
        university: r.get('university'),
        ects: r.get('ects'),
        level: r.get('level'),
        degree: r.get('degree'),
      })),
      total: totalResult.records[0].get('total').toNumber(),
      limit,
      offset,
    });
  } catch (err) {
    console.error('[modulhandbuch/search] Neo4j error:', err.message);
    res.status(503).json({ error: 'Search unavailable' });
  }
});

/**
 * GET /api/modulhandbuch/teaches/:entityName — Modules that teach a chemie concept.
 */
app.get('/api/modulhandbuch/teaches/:entityName', async (req, res) => {
  const entityName = req.params.entityName.toLowerCase().trim();
  try {
    const driver = getNeo4jDriver();
    const session = driver.session({
      database: NEO4J_DATABASE,
      defaultAccessMode: neo4j.session.READ,
    });
    const result = await session.run(
      `MATCH (e:Entity)<-[:TEACHES]-(m:UniversityModule)
       WHERE toLower(e.name) = $name
       RETURN m.module_code AS code, m.module_name AS name, m.university AS university,
              m.ects AS ects, m.level AS level, m.url AS url, e.name AS entityName`,
      { name: entityName }
    );
    await session.close();
    res.json({
      source: 'neo4j',
      entityName,
      modules: result.records.map((r) => ({
        code: r.get('code'),
        name: r.get('name'),
        university: r.get('university'),
        ects: r.get('ects'),
        level: r.get('level'),
        url: r.get('url'),
      })),
    });
  } catch (err) {
    console.error('[modulhandbuch/teaches] Neo4j error:', err.message);
    res.status(503).json({ error: 'Teaches data unavailable' });
  }
});

/**
 * GET /api/entities/:name/universities — Universities whose modules teach a given entity.
 * Used by entity/single.html "Universitäten" section (MH-22).
 */
app.get('/api/entities/:name/universities', async (req, res) => {
  const entityName = req.params.name.toLowerCase().trim();
  try {
    const driver = getNeo4jDriver();
    const session = driver.session({
      database: NEO4J_DATABASE,
      defaultAccessMode: neo4j.session.READ,
    });
    const result = await session.run(
      `MATCH (e:Entity)<-[:TEACHES]-(m:UniversityModule)
       WHERE toLower(e.name) = $name
       OPTIONAL MATCH (u:University {short_code: m.university})
       RETURN u.short_code AS uniCode, u.name AS uniName, u.country AS country,
              m.module_code AS code, m.module_name AS name, m.level AS level,
              m.ects AS ects, m.url AS url
       ORDER BY u.name, m.module_name`,
      { name: entityName }
    );
    await session.close();

    const byUniversity = new Map();
    result.records.forEach((r) => {
      const uniCode = r.get('uniCode') || r.get('uniName') || 'unknown';
      if (!byUniversity.has(uniCode)) {
        byUniversity.set(uniCode, {
          shortCode: uniCode,
          name: r.get('uniName') || uniCode,
          country: r.get('country') || '',
          modules: [],
        });
      }
      byUniversity.get(uniCode).modules.push({
        code: r.get('code'),
        name: r.get('name'),
        level: r.get('level'),
        ects: r.get('ects'),
        url: r.get('url'),
      });
    });

    res.json({
      source: 'neo4j',
      entityName,
      universities: Array.from(byUniversity.values()),
      totalModules: result.records.length,
    });
  } catch (err) {
    console.error('[entities/name/universities] Neo4j error:', err.message);
    res.status(503).json({ error: 'University data unavailable' });
  }
});

/**
 * GET /api/studienvergleich/compare — Compare modules between two universities.
 * Query params:
 *   u1=<shortCode>       — First university (required, e.g. "TUM")
 *   u2=<shortCode>       — Second university (required, e.g. "MIT")
 *   level=<BSc|MSc|PhD>  — Optional: filter by degree level
 *   topic=<keyword>       — Optional: filter modules containing keyword
 *
 * Returns a structured comparison matrix grouped by topic area.
 */
app.get('/api/studienvergleich/compare', async (req, res) => {
  const u1 = (req.query.u1 || '').trim().toUpperCase();
  const u2 = (req.query.u2 || '').trim().toUpperCase();
  const levelFilter = (req.query.level || '').trim().toUpperCase();
  const keyword = (req.query.topic || '').trim().toLowerCase();

  if (!u1 || !u2) {
    return res.status(400).json({ error: 'Both u1 and u2 query params are required' });
  }

  try {
    const driver = getNeo4jDriver();
    const session = driver.session({
      database: NEO4J_DATABASE,
      defaultAccessMode: neo4j.session.READ,
    });

    // Fetch modules for both universities
    const baseCypher = `
      MATCH (m:UniversityModule {university: $univ})
      ${levelFilter ? 'WHERE toUpper(m.level) = toUpper($level)' : ''}
      RETURN m.module_code AS code, m.module_name AS name,
             m.ects AS ects, m.level AS level, m.degree AS degree,
             m.url AS url, m.language AS language
      ORDER BY m.module_name
    `;
    const params1 = { univ: u1 };
    const params2 = { univ: u2 };
    if (levelFilter) {
      params1.level = levelFilter;
      params2.level = levelFilter;
    }

    const result1 = await session.run(baseCypher, params1);
    const result2 = await session.run(baseCypher, params2);
    await session.close();

    const mapRecord = (r) => ({
      code: r.get('code'),
      name: r.get('name'),
      ects: r.get('ects')
        ? r.get('ects').toNumber
          ? r.get('ects').toNumber()
          : r.get('ects')
        : null,
      level: r.get('level'),
      degree: r.get('degree'),
      url: r.get('url'),
      language: r.get('language'),
    });

    const modules1 = result1.records.map(mapRecord);
    const modules2 = result2.records.map(mapRecord);

    // Build module matrix: find common modules by keyword overlap in name
    // and list unique-to-each modules
    const common = [];
    const only1 = [];
    const only2 = [];

    // Bilingual chemistry keyword map (German → English) for cross-language matching.
    // TUM uses German module names, ETH uses English — this normalizes both to
    // English so "Anorganische Chemie" matches "Inorganic Chemistry".
    const DE_EN_MAP = {
      anorganische: 'inorganic',
      organische: 'organic',
      physikalische: 'physical',
      chemie: 'chemistry',
      biochemie: 'biochemistry',
      biologie: 'biology',
      mathematik: 'mathematics',
      physik: 'physics',
      chemiker: 'chemist',
      praktikum: 'lab',
      analytische: 'analytical',
      theoretische: 'theoretical',
      technische: 'technical',
      molekulare: 'molecular',
      quanten: 'quantum',
      spektroskopie: 'spectroscopy',
      katalyse: 'catalysis',
      polymer: 'polymer',
      biotechnologie: 'biotechnology',
      umwelt: 'environmental',
      elektrochemie: 'electrochemistry',
      photochemie: 'photochemistry',
      makromolekulare: 'macromolecular',
      metall: 'metal',
      kristall: 'crystal',
      thermodynamik: 'thermodynamics',
      kinetik: 'kinetics',
      synthese: 'synthesis',
      nanostruktur: 'nanostructure',
      oberfläche: 'surface',
      festkörper: 'solid',
      kernchemie: 'nuclear',
      computerchemie: 'computational',
      stoffwechsel: 'metabolism',
      zellbiologie: 'cell',
      enzym: 'enzyme',
      protein: 'protein',
      bioanorganische: 'bioinorganic',
      bioorganische: 'bioorganic',
      medizinische: 'medical',
      lebensmittel: 'food',
      geochemie: 'geochemistry',
      photoelektronen: 'photoelectron',
      röntgen: 'xray',
      magnetische: 'magnetic',
      kernspin: 'nmr',
      nanomaterialien: 'nanomaterials',
      wissenschaftliches: 'scientific',
      rechnen: 'computing',
      programmierung: 'programming',
      informatik: 'informatics',
      molekül: 'molecule',
      reaktion: 'reaction',
      verfahrenstechnik: 'process',
      ingenieurwesen: 'engineering',
      grundlagen: 'fundamentals',
      grundpraktikum: 'basiclab',
      strukturaufklärung: 'structureelucidation',
      struktur: 'structure',
      funktion: 'function',
      werkstoff: 'material',
      werkstoffe: 'materials',
      verbundwerkstoff: 'composite',
      grenzflächen: 'interfaces',
      oberflächen: 'surfaces',
      nanostrukturierte: 'nanostructured',
      nanotechnologie: 'nanotechnology',
      koordinationschemie: 'coordination',
      supramolekular: 'supramolecular',
      heterocyclen: 'heterocycles',
      wirkstoff: 'drug',
      wirkstoffkunde: 'pharmacology',
      biomedizinische: 'biomedical',
      lebenswissenschaften: 'lifesciences',
      bioverfahrenstechnik: 'bioprocess',
      biokatalyse: 'biocatalysis',
      biopolymere: 'biopolymers',
      enzymtechnologie: 'enzymetechnology',
      proteinchemie: 'proteinchemistry',
      membranproteine: 'membraneproteins',
      säugetier: 'mammalian',
      stoffströme: 'materialflows',
      klinische: 'clinical',
      medizin: 'medicine',
      pharmakologie: 'pharmacology',
      toxikologie: 'toxicology',
      pharmazeutische: 'pharmaceutical',
      radiochemie: 'radiochemistry',
      radioaktivität: 'radioactivity',
      radioanalytik: 'radioanalysis',
      radiopharmazie: 'radiopharmacy',
      photokatalyse: 'photocatalysis',
      elektrochemisches: 'electrochemical',
      elektronische: 'electronic',
      elektronenmikroskopie: 'electronmicroscopy',
      roentgen: 'xray',
      synchrotron: 'synchrotron',
      quantendynamik: 'quantumdynamics',
      quantenmechanik: 'quantummechanics',
      gruppentheorie: 'grouptheory',
      festkoerper: 'solidstate',
      festkörperchemie: 'solidstatechemistry',
      festkörpermaterialien: 'solidstatematerials',
      festkörpertheorie: 'solidstatetheory',
      polymerisation: 'polymerization',
      polymerphysik: 'polymerphysics',
      hochleistungspolymere: 'highperformancepolymers',
      hybridmaterialien: 'hybridmaterials',
      umweltschutz: 'environmentalprotection',
      ressourcen: 'resources',
      nachhaltige: 'sustainable',
      industrielle: 'industrial',
      reaktionstechnik: 'reactionengineering',
      technisch: 'technical',
      maschinelles: 'machine',
      lernende: 'learning',
      wissenschaft: 'science',
      programmieren: 'programming',
      numerische: 'numerical',
      simulation: 'simulation',
      modellbildung: 'modeling',
      bioinformatik: 'bioinformatics',
      automatisierung: 'automation',
      visualisierung: 'visualization',
      daten: 'data',
      prozesse: 'processes',
      moleküle: 'molecules',
      reaktivität: 'reactivity',
      synthesemethoden: 'synthesismethods',
      katalysator: 'catalyst',
      katalytische: 'catalytic',
      verfahren: 'methods',
      prozess: 'process',
      energie: 'energy',
      materialwissenschaften: 'materialsscience',
      oberflächenspektroskopie: 'surfacespectroscopy',
      mikroskopie: 'microscopy',
      massenspektrometrie: 'massspectrometry',
      biomolekulare: 'biomolecular',
      chiroptik: 'chiroptics',
      nanopartikel: 'nanoparticles',
      farbzentren: 'colorcenters',
      theroretisch: 'theoretical',
      experimentalphysik: 'experimentalphysics',
      mathematische: 'mathematical',
      bauchemie: 'constructionchemistry',
      anorganik: 'inorganics',
      bindemittel: 'binders',
    };

    const stopWords = new Set([
      'the',
      'of',
      'in',
      'and',
      'to',
      'a',
      'an',
      'for',
      'i',
      'ii',
      'iii',
      '1',
      '2',
      '3',
      'introductory',
      'introduction',
      'principles',
      'advanced',
      'der',
      'die',
      'das',
      'den',
      'dem',
      'des',
      'ein',
      'eine',
      'einer',
      'eines',
      'und',
      'oder',
      'mit',
      'auf',
      'bei',
      'von',
      'aus',
      'an',
      'zu',
      'als',
      'nach',
      'vor',
      'durch',
      'über',
      'fur',
      'für',
      'um',
      'nicht',
      'auch',
      'werden',
      'wird',
      'wurde',
      'sich',
      'ihr',
      'ihre',
      'seine',
      'seinen',
      'durch',
      'gegen',
      'bis',
      'ohne',
      'zwischen',
      'unter',
      'über',
      'neben',
      'sowie',
      'aber',
      'wenn',
      'dann',
      'damit',
      'dazu',
      'davon',
      'daran',
      'dieser',
      'diese',
      'dieses',
      'allen',
      'alle',
      'allem',
      'jeder',
      'jede',
      'jedes',
      'beide',
      'beiden',
      'grundlagen',
      'grundlegende',
      'vertiefung',
      'vertiefungs',
      'modul',
      'vorlesung',
      'ubung',
      'übung',
      'seminar',
      'praktikum',
      'fortgeschrittene',
      'fortgeschritten',
      'einführung',
      'einfuhrung',
      'einführungs',
      'weiterführende',
      'erweiterte',
      'erweitert',
      'speziell',
      'spezielle',
      'spezial',
      'aktuell',
      'aktuelle',
      'teil',
      'teile',
      'teil1',
      'teil2',
      'teil3',
      'i',
      'ii',
      'iii',
      'allgemein',
      'allgemeine',
      'grund',
      'grundkurs',
      'aufbau',
      'praxis',
      'praktische',
      'theorie',
      'theoretische',
      'übersicht',
      'uberblick',
      'anwendung',
      'anwendungen',
      'anwendungsrelevante',
      'aspekte',
      'aspekt',
      'konzepte',
      'konzept',
      'prinzipien',
      'prinzip',
      'methode',
      'methoden',
      'moderne',
      'modern',
    ]);

    const normalizeWords = (name) => {
      return name
        .toLowerCase()
        .split(/[\s,.\-–—/:]+/)
        .map((w) => DE_EN_MAP[w] || w) // map German → English first
        .filter((w) => w.length > 2 && !stopWords.has(w));
    };

    modules1.forEach((m1) => {
      const words1 = normalizeWords(m1.name);
      let bestMatch = null;
      let bestScore = 0;
      let codeMatched = false;

      modules2.forEach((m2) => {
        if (m1.level !== m2.level) return;

        if (m1.code && m2.code && m1.code.toUpperCase() === m2.code.toUpperCase()) {
          if (!codeMatched || m1.name.length > bestMatch.name.length) {
            bestMatch = m2;
            bestScore = 999;
            codeMatched = true;
          }
          return;
        }
        const words2 = normalizeWords(m2.name);
        const overlap = words1.filter((w) => words2.includes(w)).length;
        // Overlap ratio: fraction of the shorter word list that overlaps
        const maxLen = Math.max(words1.length, words2.length);
        const ratio = maxLen > 0 ? overlap / maxLen : 0;
        // minOverlap: single-word modules match on 1, multi-word need 2+
        const minOverlap = words1.length === 1 && words2.length === 1 ? 1 : 2;
        // Require overlap >= minOverlap AND ratio > 0.3 to prevent catch-all false matches
        if (overlap > bestScore && overlap >= minOverlap && ratio > 0.3) {
          bestScore = overlap;
          bestMatch = m2;
        }
      });

      if (bestMatch) {
        common.push({
          topic: m1.name.length < 60 ? m1.name : words1.slice(0, 4).join(' '),
          module1: m1,
          module2: bestMatch,
          matchScore: codeMatched ? 999 : bestScore,
        });
      } else {
        only1.push(m1);
      }
    });

    // Modules in u2 that had no match in u1
    const matchedCodes2 = new Set(common.map((c) => c.module2.code));
    modules2.forEach((m2) => {
      if (!matchedCodes2.has(m2.code)) {
        only2.push(m2);
      }
    });

    // Apply keyword filter post-hoc (on text fields)
    const filterByKeyword = (arr) => {
      if (!keyword) return arr;
      return arr.filter(
        (m) =>
          m.name.toLowerCase().includes(keyword) ||
          (m.code && m.code.toLowerCase().includes(keyword))
      );
    };

    res.json({
      source: 'neo4j',
      university1: u1,
      university2: u2,
      level: levelFilter || null,
      topic: keyword || null,
      stats: {
        total1: modules1.length,
        total2: modules2.length,
        common: common.length,
        unique1: only1.length,
        unique2: only2.length,
      },
      matrix: {
        commonTopics: common.filter(
          (c) => filterByKeyword([c.module1]).length > 0 || filterByKeyword([c.module2]).length > 0
        ),
        unique1: filterByKeyword(only1),
        unique2: filterByKeyword(only2),
      },
      universities: {
        [u1]: modules1,
        [u2]: modules2,
      },
    });
  } catch (err) {
    console.error('[studienvergleich/compare] Neo4j error:', err.message);
    res.status(503).json({ error: 'Comparison data unavailable' });
  }
});

// ── Quiz API ───────────────────────────────────────────────────

app.get('/api/quizzes/:topic', async (req, res) => {
  const topic = req.params.topic.trim();

  try {
    let questions = [];
    try {
      const qPath = path.join(process.cwd(), 'data', 'quiz-questions.json');
      const raw = fs.readFileSync(qPath, 'utf-8');
      const parsed = JSON.parse(raw);
      questions = parsed.questions || [];
    } catch (loadErr) {
      console.warn('[quiz-api] Failed to load quiz questions:', loadErr.message);
    }

    if (questions.length === 0) {
      return res.status(503).json({ error: 'Quiz questions unavailable' });
    }

    let filtered;
    if (topic === 'alle') {
      filtered = questions.slice();
    } else {
      filtered = questions.filter((q) => q.topic === topic);
      if (filtered.length === 0) {
        return res.status(404).json({ error: 'Topic not found', topic });
      }
    }

    for (let i = filtered.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [filtered[i], filtered[j]] = [filtered[j], filtered[i]];
    }

    const sanitized = filtered.map((q) => {
      const qCopy = Object.assign({}, q);
      delete qCopy.correctIndex;
      delete qCopy.correctIndices;
      delete qCopy.correctAnswer;
      delete qCopy.acceptedAnswers;
      return qCopy;
    });

    res.json({
      topic,
      total: sanitized.length,
      questions: sanitized,
    });
  } catch (err) {
    console.error('[quiz-api] Error:', err.message);
    res.status(500).json({ error: 'Failed to load quiz questions' });
  }
});

app.put('/api/quiz-results', async (req, res) => {
  const { topic, score, total, answers, time } = req.body;
  if (!topic || score === undefined || !total) {
    return res.status(400).json({ error: 'Missing required fields: topic, score, total' });
  }

  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;

  const result = {
    topic,
    score,
    total,
    percentage,
    answers: answers || [],
    time: time || 0,
  };

  if (req.user && req.user.id) {
    const { addQuizResult } = await import('./auth-db.js');
    const saveResult = addQuizResult(req.user.id, result);
    if (!saveResult.ok) {
      console.warn('[quiz-api] Failed to save result:', saveResult.error);
    }
  }

  res.json({ ok: true, result });
});

app.get('/api/quiz-results', async (req, res) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ error: 'Authentifizierung erforderlich' });
  }

  try {
    const { getQuizResults } = await import('./auth-db.js');
    const results = getQuizResults(req.user.id);
    res.json({ results });
  } catch (err) {
    console.error('[quiz-api] Error loading results:', err.message);
    res.status(500).json({ error: 'Failed to load quiz results' });
  }
});

app.get('/api/health', async (req, res) => {
  var neo4jOk;
  var entityCount = 0;
  try {
    var driver = getNeo4jDriver();
    var session = driver.session({ database: NEO4J_DATABASE, defaultAccessMode: 'READ' });
    var result = await session.run('MATCH (e:Entity) RETURN count(e) as cnt');
    entityCount = result.records[0].get('cnt').toNumber();
    neo4jOk = true;
    await session.close();
  } catch {
    neo4jOk = false;
  }
  var litellmOk;
  try {
    var litellmRes = await fetch(LITELLM_URL.replace('/chat/completions', '/health'), {
      signal: AbortSignal.timeout(3000),
    });
    litellmOk = litellmRes.ok;
  } catch {
    litellmOk = false;
  }
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    neo4j: neo4jOk ? 'connected' : 'unavailable',
    entityCount: entityCount,
    litellm: litellmOk ? 'connected' : 'unavailable',
    model: LITELLM_MODEL,
    version: '2.0',
  });
});

app.listen(PORT, () => {
  console.log(`[chat-api] Listening on port ${PORT}`);
  console.log(`[chat-api] LiteLLM: ${LITELLM_URL}, Model: ${LITELLM_MODEL}`);
});
