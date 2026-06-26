/**
 * Chemie Chat API — Express server with rate limiting.
 * Proxies chemistry questions to LiteLLM, enforces 10 requests/IP/day.
 */
import express from 'express';
import crypto from 'crypto';
import cookieParser from 'cookie-parser';
import neo4j from 'neo4j-driver';
import fs from 'fs';
import path from 'path';
import ragHelpers from './_rag-helpers.cjs';

const PORT = process.env.PORT || 3001;
const LITELLM_URL = process.env.LITELLM_URL || 'http://litellm-proxy:4000';
const LITELLM_MODEL = process.env.LITELLM_MODEL || 'gemma-4';
const RATE_LIMIT = 50; // requests per IP per day
const SESSION_TTL = 24 * 60 * 60 * 1000; // 24 hours
const MAX_MESSAGES_PER_SESSION = 50; // prevent infinite conversations

// In-memory rate limit store: Map<ip, { count, resetDate }>
const rateStore = new Map();

// In-memory session store: Map<sessionId, { messages, createdAt, lastUsed }>
const sessionStore = new Map();

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
      return queryNeo4jRAG(limitedKeywords, cacheKey);
    }
  } catch {
    // Neo4j unavailable, fall through to fallback
  }

  // Fallback: content-links.json + curricula
  return getRAGContextFallback(limitedKeywords, cacheKey);
}

async function queryNeo4jRAG(keywords, cacheKey) {
  try {
    var driver = getNeo4jDriver();
    var session = driver.session({
      database: NEO4J_DATABASE,
      defaultAccessMode: neo4j.session.READ,
    });
    var result;
    try {
      result = await session.run(
        'MATCH (e:Entity) ' +
          'WHERE ANY(kw IN $keywords WHERE toLower(e.name) CONTAINS kw ' +
          '   OR toLower(coalesce(e.description, "")) CONTAINS kw ' +
          '   OR ANY(t IN coalesce(e.tags, []) WHERE toLower(t) CONTAINS kw)) ' +
          'WITH e, ' +
          '  [kw IN $keywords WHERE toLower(e.name) = kw | 10.0] + ' +
          '  [kw IN $keywords WHERE toLower(e.name) STARTS WITH kw AND toLower(e.name) <> kw | 6.0] + ' +
          '  [kw IN $keywords WHERE toLower(e.name) CONTAINS kw AND toLower(e.name) <> kw AND NOT toLower(e.name) STARTS WITH kw | 3.0] + ' +
          '  [kw IN $keywords WHERE toLower(coalesce(e.description, "")) CONTAINS kw | 2.0] + ' +
          '  [kw IN $keywords | 0.0] AS scoreParts ' +
          'WITH e, REDUCE(s = 0.0, x IN scoreParts | s + x) AS score ' +
          'OPTIONAL MATCH (e)-[r:RELATED_TO|ERFUELLT|BESTEHT_AUS]-(related:Entity) ' +
          'WITH e, score, ' +
          '  collect(DISTINCT related.name) AS relatedEntities ' +
          'RETURN e.name AS name, e.kategorie AS category, ' +
          '  e.state AS state, e.grade AS grade, ' +
          '  e.school_type AS school_type, ' +
          '  coalesce(e.objective_count, 0) AS objective_count, ' +
          '  e.description AS description, ' +
          '  relatedEntities, score ' +
          'ORDER BY score DESC, e.name ' +
          'LIMIT 10',
        { keywords: keywords }
      );
    } finally {
      await session.close();
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
 */
function getFallbackData() {
  var fallback = {
    articles: [
      {
        id: 'a0',
        title: 'Energetische Baupläne diversifizieren Proteinfunktion',
        url: 'https://chemie-lernen.org/posts/2026-06-08-energetische-bauplaene-diversifizieren-proteinfunktion-bei-konservierter-faltung/',
        entities: ['allosterie', 'ligandenempfindlichkeit', 'transportproteine'],
        date: '2026-06-08T02:43:40+02:00',
      },
      {
        id: 'a1',
        title: 'Neuer Kristall erzeugt magnetische Skyrmionen-Strukturen',
        url: 'https://chemie-lernen.org/posts/2026-06-08-neuer-kristall-erzeugt-magnetische-skyrmionen-strukturen/',
        entities: ['kristallstruktur', 'magnetische ordnung', 'datenspeicherung'],
        date: '2026-06-08T02:43:06+02:00',
      },
      {
        id: 'a2',
        title: 'Magnetfeld verdreifacht Ammoniakausbeute bei Elektrokatalyse',
        url: 'https://chemie-lernen.org/posts/2026-06-07-magnetfeld-verdreifacht-ammoniakausbeute-bei-elektrokatalyse/',
        entities: ['ammoniak', 'elektrokatalyse', 'cobaltferrit'],
        date: '2026-06-07T02:44:22+02:00',
      },
      {
        id: 'a3',
        title: 'Neue Kristallsaatkerne steigern Perowskit-Solarzellen auf 23 % Effizienz',
        url: 'https://chemie-lernen.org/posts/2026-06-08-neue-kristallsaatkerne-steigern-perowskit-solarzellen-auf-23-effizienz/',
        entities: ['perowskit-solarzellen', 'kristallisation', 'materialwissenschaft'],
        date: '2026-06-08T02:42:34+02:00',
      },
      {
        id: 'a4',
        title: '50 Jahre Rätsel: Proteine verlieren Hydrathülle durch Säure',
        url: 'https://chemie-lernen.org/posts/2026-06-05-50-jahre-raetsel-proteine-verlieren-hydrathuelle-durch-saeure/',
        entities: ['hydrathülle', 'proteine', 'ph-wert'],
        date: '2026-06-05T02:42:39+02:00',
      },
      {
        id: 'a5',
        title: 'Künstliche Intelligenz findet neue Katalysatoren für Wasserstoffproduktion',
        url: 'https://chemie-lernen.org/posts/2026-06-08-ki-findet-neue-katalysatoren/',
        entities: ['katalysatoren', 'wasserstoffproduktion', 'ki'],
        date: '2026-06-08T02:45:00+02:00',
      },
      {
        id: 'a6',
        title: 'Quantencomputer berechnen Molekülstrukturen in Rekordzeit',
        url: 'https://chemie-lernen.org/posts/2026-06-08-quantencomputer-molekuel/',
        entities: ['quantencomputer', 'molekülstrukturen', 'berechnungen'],
        date: '2026-06-08T02:46:00+02:00',
      },
      {
        id: 'a7',
        title: 'Neue Legierung macht Motoren 30% effizienter',
        url: 'https://chemie-lernen.org/posts/2026-06-08-neue-legierung-motoren/',
        entities: ['legierung', 'motoren', 'effizienz'],
        date: '2026-06-08T02:47:00+02:00',
      },
      {
        id: 'a8',
        title: 'Solarzellen aus organischem Material erreichen 18% Wirkungsgrad',
        url: 'https://chemie-lernen.org/posts/2026-06-08-solarzellen-organisch/',
        entities: ['solarzellen', 'organische materialien', 'wirkungsgrad'],
        date: '2026-06-08T02:48:00+02:00',
      },
      {
        id: 'a9',
        title: 'Wissenschaftler entdecken neue Art chemischer Bindung',
        url: 'https://chemie-lernen.org/posts/2026-06-08-neue-bindung/',
        entities: ['chemische bindung', 'molekülphysik', 'neuentdeckung'],
        date: '2026-06-08T02:49:00+02:00',
      },
    ],
    entities: [
      {
        id: 'e0',
        name: 'allosterie',
        category: 'konzept',
        articles: ['Energetische Baupläne diversifizieren Proteinfunktion'],
        relatedEntities: ['ligandenempfindlichkeit'],
        articleCount: 1,
      },
      {
        id: 'e1',
        name: 'kristallstruktur',
        category: 'konzept',
        articles: ['Neuer Kristall erzeugt magnetische Skyrmionen-Strukturen'],
        relatedEntities: ['magnetische ordnung'],
        articleCount: 1,
      },
      {
        id: 'e2',
        name: 'ammoniak',
        category: 'stoff',
        articles: ['Magnetfeld verdreifacht Ammoniakausbeute bei Elektrokatalyse'],
        relatedEntities: ['elektrokatalyse'],
        articleCount: 1,
      },
      {
        id: 'e3',
        name: 'elektrokatalyse',
        category: 'reaktion',
        articles: ['Magnetfeld verdreifacht Ammoniakausbeute bei Elektrokatalyse'],
        relatedEntities: ['ammoniak'],
        articleCount: 1,
      },
      {
        id: 'e4',
        name: 'perowskit-solarzellen',
        category: 'stoff',
        articles: ['Neue Kristallsaatkerne steigern Perowskit-Solarzellen auf 23 % Effizienz'],
        relatedEntities: ['materialwissenschaft'],
        articleCount: 1,
      },
      {
        id: 'e5',
        name: 'hydrathülle',
        category: 'konzept',
        articles: ['50 Jahre Rätsel: Proteine verlieren Hydrathülle durch Säure'],
        relatedEntities: ['proteine'],
        articleCount: 1,
      },
      {
        id: 'e6',
        name: 'katalysatoren',
        category: 'stoff',
        articles: ['Künstliche Intelligenz findet neue Katalysatoren für Wasserstoffproduktion'],
        relatedEntities: ['wasserstoffproduktion'],
        articleCount: 1,
      },
      {
        id: 'e7',
        name: 'wasserstoffproduktion',
        category: 'reaktion',
        articles: ['Künstliche Intelligenz findet neue Katalysatoren für Wasserstoffproduktion'],
        relatedEntities: ['katalysatoren'],
        articleCount: 1,
      },
      {
        id: 'e8',
        name: 'quantencomputer',
        category: 'methode',
        articles: ['Quantencomputer berechnen Molekülstrukturen in Rekordzeit'],
        relatedEntities: ['berechnungen'],
        articleCount: 1,
      },
      {
        id: 'e9',
        name: 'molekülstrukturen',
        category: 'konzept',
        articles: ['Quantencomputer berechnen Molekülstrukturen in Rekordzeit'],
        relatedEntities: ['berechnungen'],
        articleCount: 1,
      },
      {
        id: 'e10',
        name: 'legierung',
        category: 'stoff',
        articles: ['Neue Legierung macht Motoren 30% effizienter'],
        relatedEntities: ['effizienz'],
        articleCount: 1,
      },
      {
        id: 'e11',
        name: 'motoren',
        category: 'methode',
        articles: ['Neue Legierung macht Motoren 30% effizienter'],
        relatedEntities: ['legierung'],
        articleCount: 1,
      },
      {
        id: 'e12',
        name: 'solarzellen',
        category: 'stoff',
        articles: ['Solarzellen aus organischem Material erreichen 18% Wirkungsgrad'],
        relatedEntities: ['wirkungsgrad'],
        articleCount: 1,
      },
      {
        id: 'e13',
        name: 'organische materialien',
        category: 'stoff',
        articles: ['Solarzellen aus organischem Material erreichen 18% Wirkungsgrad'],
        relatedEntities: ['solarzellen'],
        articleCount: 1,
      },
      {
        id: 'e14',
        name: 'wirkungsgrad',
        category: 'konzept',
        articles: ['Solarzellen aus organischem Material erreichen 18% Wirkungsgrad'],
        relatedEntities: ['solarzellen'],
        articleCount: 1,
      },
      {
        id: 'e15',
        name: 'chemische bindung',
        category: 'konzept',
        articles: ['Wissenschaftler entdecken neue Art chemischer Bindung'],
        relatedEntities: ['molekülphysik'],
        articleCount: 1,
      },
      {
        id: 'e16',
        name: 'molekülphysik',
        category: 'konzept',
        articles: ['Wissenschaftler entdecken neue Art chemischer Bindung'],
        relatedEntities: ['chemische bindung'],
        articleCount: 1,
      },
      {
        id: 'e17',
        name: 'neuentdeckung',
        category: 'konzept',
        articles: ['Wissenschaftler entdecken neue Art chemischer Bindung'],
        relatedEntities: ['chemische bindung'],
        articleCount: 1,
      },
    ],
    curricula: [
      // BY (Bayern) — 5 Topics
      {
        id: 'e18',
        name: 'redoxreaktionen',
        category: 'lehrplan',
        curriculumMeta: {
          state: 'BY',
          grade: '9',
          school_type: 'Gymnasium (NTG)',
          objective_count: 11,
        },
        articles: [],
        relatedEntities: [{ name: 'redoxreaktion', weight: 1 }],
        articleCount: 0,
      },
      {
        id: 'e19',
        name: 'saeure-base-gleichgewichte',
        category: 'lehrplan',
        curriculumMeta: {
          state: 'BY',
          grade: '10',
          school_type: 'Gymnasium (NTG)',
          objective_count: 8,
        },
        articles: [],
        relatedEntities: [{ name: 'säure-base-reaktion', weight: 1 }],
        articleCount: 0,
      },
      {
        id: 'e20',
        name: 'atombau und periodensystem',
        category: 'lehrplan',
        curriculumMeta: { state: 'BY', grade: '9', school_type: 'Realschule', objective_count: 7 },
        articles: [],
        relatedEntities: [{ name: 'atombau', weight: 1 }],
        articleCount: 0,
      },
      {
        id: 'e21',
        name: 'chemische reaktion',
        category: 'lehrplan',
        curriculumMeta: {
          state: 'BY',
          grade: '8',
          school_type: 'Gymnasium (NTG)',
          objective_count: 8,
        },
        articles: [],
        relatedEntities: [{ name: 'chemische-reaktion', weight: 1 }],
        articleCount: 0,
      },
      {
        id: 'e22',
        name: 'donator-akzeptor-konzept',
        category: 'lehrplan',
        curriculumMeta: {
          state: 'BY',
          grade: '9',
          school_type: 'Gymnasium (NTG)',
          objective_count: 5,
        },
        articles: [],
        relatedEntities: [
          { name: 'säure-base-reaktion', weight: 1 },
          { name: 'redoxreaktion', weight: 1 },
        ],
        articleCount: 0,
      },
      // NW (Nordrhein-Westfalen) — 4 Topics
      {
        id: 'e27',
        name: 'chemische-reaktion',
        category: 'lehrplan',
        curriculumMeta: {
          state: 'NW',
          grade: '5-7',
          school_type: 'Gymnasium (Sek I)',
          objective_count: 15,
        },
        articles: [],
        relatedEntities: [{ name: 'chemische-reaktion', weight: 1 }],
        articleCount: 0,
      },
      {
        id: 'e28',
        name: 'elemente-und-ihre-ordnung',
        category: 'lehrplan',
        curriculumMeta: {
          state: 'NW',
          grade: '8-10',
          school_type: 'Gymnasium (Sek I)',
          objective_count: 22,
        },
        articles: [],
        relatedEntities: [],
        articleCount: 0,
      },
      {
        id: 'e29',
        name: 'salze-und-ionen',
        category: 'lehrplan',
        curriculumMeta: {
          state: 'NW',
          grade: '8-10',
          school_type: 'Gymnasium (Sek I)',
          objective_count: 24,
        },
        articles: [],
        relatedEntities: [],
        articleCount: 0,
      },
      {
        id: 'e30',
        name: 'stoffe-und-stoffeigenschaften',
        category: 'lehrplan',
        curriculumMeta: {
          state: 'NW',
          grade: '5-7',
          school_type: 'Gymnasium (Sek I)',
          objective_count: 13,
        },
        articles: [],
        relatedEntities: [],
        articleCount: 0,
      },
      // BW (Baden-Württemberg) — 3 Topics
      {
        id: 'e31',
        name: 'chemische-gleichgewichte',
        category: 'lehrplan',
        curriculumMeta: {
          state: 'BW',
          grade: '11/12',
          school_type: 'Gymnasium (Leistungsfach)',
          objective_count: 8,
        },
        articles: [],
        relatedEntities: [],
        articleCount: 0,
      },
      {
        id: 'e32',
        name: 'kunststoffe',
        category: 'lehrplan',
        curriculumMeta: {
          state: 'BW',
          grade: '11/12',
          school_type: 'Gymnasium (Basisfach)',
          objective_count: 6,
        },
        articles: [],
        relatedEntities: [],
        articleCount: 0,
      },
      {
        id: 'e33',
        name: 'aromaten',
        category: 'lehrplan',
        curriculumMeta: {
          state: 'BW',
          grade: '11/12',
          school_type: 'Gymnasium (Leistungsfach)',
          objective_count: 4,
        },
        articles: [],
        relatedEntities: [],
        articleCount: 0,
      },
      // SN (Sachsen) — 3 Topics
      {
        id: 'e34',
        name: 'umwandlung-von-stoffen',
        category: 'lehrplan',
        curriculumMeta: {
          state: 'SN',
          grade: '7',
          school_type: 'Gymnasium',
          objective_count: 17,
        },
        articles: [],
        relatedEntities: [],
        articleCount: 0,
      },
      {
        id: 'e35',
        name: 'saeuren-und-saure-loesungen',
        category: 'lehrplan',
        curriculumMeta: {
          state: 'SN',
          grade: '8',
          school_type: 'Gymnasium',
          objective_count: 24,
        },
        articles: [],
        relatedEntities: [],
        articleCount: 0,
      },
      {
        id: 'e36',
        name: 'metalle',
        category: 'lehrplan',
        curriculumMeta: {
          state: 'SN',
          grade: '7',
          school_type: 'Gymnasium',
          objective_count: 1,
        },
        articles: [],
        relatedEntities: [{ name: 'legierung', weight: 1 }],
        articleCount: 0,
      },
    ],
  };

  // Ensure matching reference entities exist for curriculum fallback
  var refEntities = [
    {
      id: 'e23',
      name: 'redoxreaktion',
      category: 'reaktion',
      articles: [],
      relatedEntities: [{ name: 'redoxreaktionen', weight: 1 }],
      articleCount: 0,
    },
    {
      id: 'e24',
      name: 'säure-base-reaktion',
      category: 'reaktion',
      articles: [],
      relatedEntities: [{ name: 'saeure-base-gleichgewichte', weight: 1 }],
      articleCount: 0,
    },
    {
      id: 'e25',
      name: 'atombau',
      category: 'konzept',
      articles: [],
      relatedEntities: [{ name: 'atombau und periodensystem', weight: 1 }],
      articleCount: 0,
    },
    {
      id: 'e26',
      name: 'chemische-reaktion',
      category: 'reaktion',
      articles: [],
      relatedEntities: [{ name: 'chemische reaktion', weight: 1 }],
      articleCount: 0,
    },
    // P3b: KMK didaktik entities for compliance display
    {
      id: 'e37',
      name: 'kmk-chemie-msa-2004',
      category: 'didaktik',
      articles: [],
      relatedEntities: [
        { name: 'redoxreaktionen', weight: 1 },
        { name: 'saeure-base-gleichgewichte', weight: 1 },
        { name: 'chemische reaktion', weight: 1 },
        { name: 'stoffwechselwirkungen', weight: 1 },
      ],
      articleCount: 0,
    },
    {
      id: 'e38',
      name: 'kmk-chemie-msa-2024',
      category: 'didaktik',
      articles: [],
      relatedEntities: [
        { name: 'redoxreaktionen', weight: 1 },
        { name: 'saeure-base-gleichgewichte', weight: 1 },
        { name: 'chemische reaktion', weight: 1 },
        { name: 'atombau und periodensystem', weight: 1 },
        { name: 'donator-akzeptor-konzept', weight: 1 },
      ],
      articleCount: 0,
    },
    {
      id: 'e39',
      name: 'kmk-chemie-ahr-2020',
      category: 'didaktik',
      articles: [],
      relatedEntities: [
        { name: 'chemische-gleichgewichte', weight: 1 },
        { name: 'kunststoffe', weight: 1 },
        { name: 'aromaten', weight: 1 },
        { name: 'saeure-base-gleichgewichte', weight: 1 },
      ],
      articleCount: 0,
    },
  ];
  var _ri, _ci, _ej, _existing;
  for (_ri = 0; _ri < refEntities.length; _ri++) {
    _existing = false;
    for (_ej = 0; _ej < fallback.entities.length; _ej++) {
      if (fallback.entities[_ej].name === refEntities[_ri].name) {
        _existing = true;
        break;
      }
    }
    if (!_existing) fallback.entities.push(refEntities[_ri]);
  }

  // Merge curricula into entities (frontend filters by category)
  for (_ci = 0; _ci < fallback.curricula.length; _ci++) {
    _existing = false;
    for (_ej = 0; _ej < fallback.entities.length; _ej++) {
      if (fallback.entities[_ej].name === fallback.curricula[_ci].name) {
        _existing = true;
        break;
      }
    }
    if (!_existing) fallback.entities.push(fallback.curricula[_ci]);
  }

  // Phase 2.2: Quelle entities — textbook/magazine sources
  var quelleEntities = [
    {
      id: 'e40',
      name: 'Chemie Heute',
      category: 'quelle',
      articles: [],
      relatedEntities: [
        { name: 'kristallstruktur', weight: 1 },
        { name: 'molekülstrukturen', weight: 1 },
        { name: 'chemische bindung', weight: 1 },
        { name: 'molekülphysik', weight: 1 },
        { name: 'atombau', weight: 1 },
        { name: 'chemische-reaktion', weight: 1 },
      ],
      articleCount: 0,
    },
    {
      id: 'e41',
      name: 'Elemente Chemie',
      category: 'quelle',
      articles: [],
      relatedEntities: [
        { name: 'ammoniak', weight: 1 },
        { name: 'katalysatoren', weight: 1 },
        { name: 'legierung', weight: 1 },
        { name: 'organische materialien', weight: 1 },
        { name: 'chemische bindung', weight: 1 },
        { name: 'chemische-reaktion', weight: 1 },
        { name: 'säure-base-reaktion', weight: 1 },
      ],
      articleCount: 0,
    },
    {
      id: 'e42',
      name: 'Basiswissen Chemie',
      category: 'quelle',
      articles: [],
      relatedEntities: [
        { name: 'allosterie', weight: 1 },
        { name: 'hydrathülle', weight: 1 },
        { name: 'wirkungsgrad', weight: 1 },
        { name: 'atombau', weight: 1 },
        { name: 'chemische-reaktion', weight: 1 },
        { name: 'säure-base-reaktion', weight: 1 },
      ],
      articleCount: 0,
    },
    {
      id: 'e43',
      name: 'Spektrum der Wissenschaft',
      category: 'quelle',
      articles: [],
      relatedEntities: [
        { name: 'elektrokatalyse', weight: 1 },
        { name: 'perowskit-solarzellen', weight: 1 },
        { name: 'wasserstoffproduktion', weight: 1 },
        { name: 'quantencomputer', weight: 1 },
        { name: 'solarzellen', weight: 1 },
        { name: 'neuentdeckung', weight: 1 },
      ],
      articleCount: 0,
    },
    {
      id: 'e44',
      name: 'Naturwissenschaften im Unterricht Chemie',
      category: 'quelle',
      articles: [],
      relatedEntities: [
        { name: 'motoren', weight: 1 },
        { name: 'katalysatoren', weight: 1 },
        { name: 'elektrokatalyse', weight: 1 },
        { name: 'legierung', weight: 1 },
        { name: 'redoxreaktion', weight: 1 },
      ],
      articleCount: 0,
    },
  ];
  for (var _qi = 0; _qi < quelleEntities.length; _qi++) {
    _existing = false;
    for (_ej = 0; _ej < fallback.entities.length; _ej++) {
      if (fallback.entities[_ej].name === quelleEntities[_qi].name) {
        _existing = true;
        break;
      }
    }
    if (!_existing) fallback.entities.push(quelleEntities[_qi]);
  }

  return fallback;
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
      MATCH (e:Entity)
      WHERE e.kategorie = 'lehrplan' OR e.kategorie = 'didaktik'
      OPTIONAL MATCH (e)-[r:RELATED_TO|ERFUELLT]-(related:Entity)
      RETURN e.name as name, e.kategorie as category,
             collect(DISTINCT related.name) as relatedEntities,
             [] as components, 0 as articleCount
      ORDER BY e.name
      LIMIT 500
    `
      : `
      MATCH (e:Entity)
      WHERE (e.kategorie IS NULL OR e.kategorie NOT IN ['lernziel', 'lehrplan', 'didaktik'])
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
    const entities = entitiesResult.records.map((r, i) => ({
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
    const countResult = await session.run(
      `
      MATCH (e:Entity) WHERE 1=1${whereClause}
      RETURN count(e) AS total
    `,
      queryParams
    );
    const totalEntities = countResult.records[0].get('total').toNumber();

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

    // Query curriculum entities separately (for lehrplan mode, to get curriculumMeta)
    let curriculaEntities = [];
    if (isLehrplanMode) {
      try {
        const curriculaQuery = `
          MATCH (e:Entity {kategorie: 'lehrplan'})
          OPTIONAL MATCH (e)-[r:RELATED_TO|ERFUELLT]-(related:Entity)
          RETURN e.name as name, e.kategorie as category,
                 e.state as state, e.grade as grade,
                 e.school_type as school_type,
                 e.objective_count as objective_count,
                 collect(DISTINCT related.name) as relatedEntities
          ORDER BY e.name
          LIMIT 500
        `;
        const curriculaResult = await session.run(curriculaQuery);
        curriculaEntities = curriculaResult.records.map((r, i) => ({
          id: `c${i}`,
          name: r.get('name'),
          category: r.get('category') || 'lehrplan',
          curriculumMeta: {
            state: r.get('state'),
            grade: r.get('grade'),
            school_type: r.get('school_type'),
            objective_count: r.get('objective_count') ? r.get('objective_count').toNumber() : 0,
          },
          articles: [],
          relatedEntities: (r.get('relatedEntities') || [])
            .filter((n) => n !== null)
            .map((name) => ({ name, weight: 1 })),
          articleCount: 0,
        }));
      } catch (e) {
        console.warn(`[kg-data] Curriculum query failed: ${e.message}`);
      }

      // Merge curricula into entities array (lehrplan mode wants both lehrplan + didaktik)
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
      '<a href="' +
      backLink +
      '" class="back-link">← Zurück</a>' +
      '</div></div></body></html>'
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
 * Graceful shutdown — close Neo4j driver
 */
process.on('SIGTERM', async () => {
  if (neo4jDriver) {
    await neo4jDriver.close();
    neo4jDriver = null;
  }
  process.exit(0);
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
      `MATCH ()-[r]->()
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

app.get('/api/health', async (req, res) => {
  var neo4jOk = false;
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
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    neo4j: neo4jOk ? 'connected' : 'unavailable',
    entityCount: entityCount,
    version: '2.0',
  });
});

app.listen(PORT, () => {
  console.log(`[chat-api] Listening on port ${PORT}`);
  console.log(`[chat-api] LiteLLM: ${LITELLM_URL}, Model: ${LITELLM_MODEL}`);
});
