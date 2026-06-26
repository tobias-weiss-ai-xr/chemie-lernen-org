/**
 * Chemie Chat API — Express server with rate limiting.
 * Proxies chemistry questions to LiteLLM, enforces 10 requests/IP/day.
 */
import express from 'express';
import crypto from 'crypto';
import cookieParser from 'cookie-parser';
import neo4j from 'neo4j-driver';

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
      sameSite: 'lax'
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
      lastUsed: Date.now()
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
      maxMessages: MAX_MESSAGES_PER_SESSION
    }
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
  const { message } = req.body;
  if (!message || typeof message !== 'string' || message.length > 1000) {
    return res.status(400).json({ error: 'Invalid message' });
  }

  const acceptStreaming = req.accepts('text/event-stream');
  
  try {
    const session = getSession(sessionId);
    session.messages.push({ role: 'user', content: message });
    cleanupSessionMessages(session);
    
    const systemPrompt = `Du bist ein hilfreicher Chemie-Assistent für Schüler (Klasse 8-13) auf chemie-lernen.org. 
Antworte präzise, ausführlich und auf Deutsch. Beziehe dich auf chemische Konzepte, Formeln und Gesetze. 
Erkläre Zusammenhänge gründlich, wenn es der Frage hilft. 
Wenn du etwas nicht weißt, sage es ehrlich. 
Behandle Kontext aus vorherigen Fragen mit.`;

    const conversationHistory = [
      { role: 'system', content: systemPrompt },
      ...session.messages
    ];

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
        remaining: rate.remaining,
        sessionId,
        messageCount: session.messages.length
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
        
      for (const line of chunk.split("\n").filter(line => line.startsWith("data: "))) {
          const dataLine = line.slice(6).trim();
          if (dataLine === "[DONE]") continue;
          
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

      res.write(`data: ${JSON.stringify({
        done: true,
        remaining: rate.remaining,
        sessionId,
        messageCount: session.messages.length + 1
      })}\n\n`);
    } catch (streamErr) {
      console.error(`[chat-api] Stream failed, falling back: ${streamErr.message}`);
      while (buffer.length > 0) {
        const chunk = buffer.shift();
        if (chunk) replyContent += chunk;
      }
      
      res.write(`data: ${JSON.stringify({
        content: replyContent,
        fallback: true,
        done: true,
        remaining: rate.remaining,
        sessionId,
        messageCount: session.messages.length + 1
      })}\n\n`);
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
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || 'chemie';
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

/**
 * Fallback data used when Neo4j is unreachable.
 */
function getFallbackData() {
  return {
    articles: [
      { id: 'a0', title: 'Energetische Baupläne diversifizieren Proteinfunktion', url: 'https://chemie-lernen.org/posts/2026-06-08-energetische-bauplaene-diversifizieren-proteinfunktion-bei-konservierter-faltung/', entities: ['allosterie', 'ligandenempfindlichkeit', 'transportproteine'], date: '2026-06-08T02:43:40+02:00' },
      { id: 'a1', title: 'Neuer Kristall erzeugt magnetische Skyrmionen-Strukturen', url: 'https://chemie-lernen.org/posts/2026-06-08-neuer-kristall-erzeugt-magnetische-skyrmionen-strukturen/', entities: ['kristallstruktur', 'magnetische ordnung', 'datenspeicherung'], date: '2026-06-08T02:43:06+02:00' },
      { id: 'a2', title: 'Magnetfeld verdreifacht Ammoniakausbeute bei Elektrokatalyse', url: 'https://chemie-lernen.org/posts/2026-06-07-magnetfeld-verdreifacht-ammoniakausbeute-bei-elektrokatalyse/', entities: ['ammoniak', 'elektrokatalyse', 'cobaltferrit'], date: '2026-06-07T02:44:22+02:00' },
      { id: 'a3', title: 'Neue Kristallsaatkerne steigern Perowskit-Solarzellen auf 23 % Effizienz', url: 'https://chemie-lernen.org/posts/2026-06-08-neue-kristallsaatkerne-steigern-perowskit-solarzellen-auf-23-effizienz/', entities: ['perowskit-solarzellen', 'kristallisation', 'materialwissenschaft'], date: '2026-06-08T02:42:34+02:00' },
      { id: 'a4', title: '50 Jahre Rätsel: Proteine verlieren Hydrathülle durch Säure', url: 'https://chemie-lernen.org/posts/2026-06-05-50-jahre-raetsel-proteine-verlieren-hydrathuelle-durch-saeure/', entities: ['hydrathülle', 'proteine', 'ph-wert'], date: '2026-06-05T02:42:39+02:00' },
      { id: 'a5', title: 'Künstliche Intelligenz findet neue Katalysatoren für Wasserstoffproduktion', url: 'https://chemie-lernen.org/posts/2026-06-08-ki-findet-neue-katalysatoren/', entities: ['katalysatoren', 'wasserstoffproduktion', 'ki'], date: '2026-06-08T02:45:00+02:00' },
      { id: 'a6', title: 'Quantencomputer berechnen Molekülstrukturen in Rekordzeit', url: 'https://chemie-lernen.org/posts/2026-06-08-quantencomputer-molekuel/', entities: ['quantencomputer', 'molekülstrukturen', 'berechnungen'], date: '2026-06-08T02:46:00+02:00' },
      { id: 'a7', title: 'Neue Legierung macht Motoren 30% effizienter', url: 'https://chemie-lernen.org/posts/2026-06-08-neue-legierung-motoren/', entities: ['legierung', 'motoren', 'effizienz'], date: '2026-06-08T02:47:00+02:00' },
      { id: 'a8', title: 'Solarzellen aus organischem Material erreichen 18% Wirkungsgrad', url: 'https://chemie-lernen.org/posts/2026-06-08-solarzellen-organisch/', entities: ['solarzellen', 'organische materialien', 'wirkungsgrad'], date: '2026-06-08T02:48:00+02:00' },
      { id: 'a9', title: 'Wissenschaftler entdecken neue Art chemischer Bindung', url: 'https://chemie-lernen.org/posts/2026-06-08-neue-bindung/', entities: ['chemische bindung', 'molekülphysik', 'neuentdeckung'], date: '2026-06-08T02:49:00+02:00' },
    ],
    entities: [
      { id: 'e0', name: 'allosterie', category: 'konzept', articles: ['Energetische Baupläne diversifizieren Proteinfunktion'], relatedEntities: ['ligandenempfindlichkeit'], articleCount: 1 },
      { id: 'e1', name: 'kristallstruktur', category: 'konzept', articles: ['Neuer Kristall erzeugt magnetische Skyrmionen-Strukturen'], relatedEntities: ['magnetische ordnung'], articleCount: 1 },
      { id: 'e2', name: 'ammoniak', category: 'stoff', articles: ['Magnetfeld verdreifacht Ammoniakausbeute bei Elektrokatalyse'], relatedEntities: ['elektrokatalyse'], articleCount: 1 },
      { id: 'e3', name: 'elektrokatalyse', category: 'reaktion', articles: ['Magnetfeld verdreifacht Ammoniakausbeute bei Elektrokatalyse'], relatedEntities: ['ammoniak'], articleCount: 1 },
      { id: 'e4', name: 'perowskit-solarzellen', category: 'stoff', articles: ['Neue Kristallsaatkerne steigern Perowskit-Solarzellen auf 23 % Effizienz'], relatedEntities: ['materialwissenschaft'], articleCount: 1 },
      { id: 'e5', name: 'hydrathülle', category: 'konzept', articles: ['50 Jahre Rätsel: Proteine verlieren Hydrathülle durch Säure'], relatedEntities: ['proteine'], articleCount: 1 },
      { id: 'e6', name: 'katalysatoren', category: 'stoff', articles: ['Künstliche Intelligenz findet neue Katalysatoren für Wasserstoffproduktion'], relatedEntities: ['wasserstoffproduktion'], articleCount: 1 },
      { id: 'e7', name: 'wasserstoffproduktion', category: 'reaktion', articles: ['Künstliche Intelligenz findet neue Katalysatoren für Wasserstoffproduktion'], relatedEntities: ['katalysatoren'], articleCount: 1 },
      { id: 'e8', name: 'quantencomputer', category: 'methode', articles: ['Quantencomputer berechnen Molekülstrukturen in Rekordzeit'], relatedEntities: ['berechnungen'], articleCount: 1 },
      { id: 'e9', name: 'molekülstrukturen', category: 'konzept', articles: ['Quantencomputer berechnen Molekülstrukturen in Rekordzeit'], relatedEntities: ['berechnungen'], articleCount: 1 },
      { id: 'e10', name: 'legierung', category: 'stoff', articles: ['Neue Legierung macht Motoren 30% effizienter'], relatedEntities: ['effizienz'], articleCount: 1 },
      { id: 'e11', name: 'motoren', category: 'methode', articles: ['Neue Legierung macht Motoren 30% effizienter'], relatedEntities: ['legierung'], articleCount: 1 },
      { id: 'e12', name: 'solarzellen', category: 'stoff', articles: ['Solarzellen aus organischem Material erreichen 18% Wirkungsgrad'], relatedEntities: ['wirkungsgrad'], articleCount: 1 },
      { id: 'e13', name: 'organische materialien', category: 'stoff', articles: ['Solarzellen aus organischem Material erreichen 18% Wirkungsgrad'], relatedEntities: ['solarzellen'], articleCount: 1 },
      { id: 'e14', name: 'wirkungsgrad', category: 'konzept', articles: ['Solarzellen aus organischem Material erreichen 18% Wirkungsgrad'], relatedEntities: ['solarzellen'], articleCount: 1 },
      { id: 'e15', name: 'chemische bindung', category: 'konzept', articles: ['Wissenschaftler entdecken neue Art chemischer Bindung'], relatedEntities: ['molekülphysik'], articleCount: 1 },
      { id: 'e16', name: 'molekülphysik', category: 'konzept', articles: ['Wissenschaftler entdecken neue Art chemischer Bindung'], relatedEntities: ['chemische bindung'], articleCount: 1 },
      { id: 'e17', name: 'neuentdeckung', category: 'konzept', articles: ['Wissenschaftler entdecken neue Art chemischer Bindung'], relatedEntities: ['chemische bindung'], articleCount: 1 },
    ],
  };
}

/**
 * Parse query params: search, category, type, limit, offset
 */
function parseKGParams(req) {
  const search  = (req.query.search || '').toLowerCase().trim();
  const category = (req.query.category || '').toLowerCase().trim();
  const type    = (req.query.type || '').toLowerCase().trim();
  const limit   = Math.min(parseInt(req.query.limit) || 50, 500);
  const offset  = parseInt(req.query.offset) || 0;
  return { search, category, type, limit, offset };
}

/**
 * Filter entities by search/category/type
 */
function filterEntities(entities, { search, category, type }) {
  let result = entities;
  if (search) {
    result = result.filter(e => e.name.toLowerCase().includes(search));
  }
  if (category) {
    result = result.filter(e => (e.category || '').toLowerCase() === category);
  }
  if (type) {
    result = result.filter(e => (e.type || '').toLowerCase() === type);
  }
  return result;
}

/**
 * GET /api/kg-data
 * Returns knowledge graph data with optional search, filter, pagination.
 * Query params: ?search=, ?category=, ?type=, ?limit=, ?offset=
 */
app.get('/api/kg-data', async (req, res) => {
  const startTime = Date.now();
  const params = parseKGParams(req);
  const { limit, offset } = params;

  try {
    const driver = getNeo4jDriver();
    const session = driver.session({
      database: NEO4J_DATABASE,
      defaultAccessMode: neo4j.session.READ,
      fetchSize: 1000,
    });

    // Build filtered Cypher query
    let whereClause = '';
    const queryParams = {};
    if (params.search) {
      whereClause += ' AND toLower(e.name) CONTAINS $search';
      queryParams.search = params.search;
    }
    if (params.category) {
      whereClause += ' AND toLower(e.kategorie) = $category';
      queryParams.category = params.category;
    }
    if (params.type) {
      whereClause += ' AND toLower(e.typ) = $type';
      queryParams.type = params.type;
    }

    const entitiesQuery = `
      MATCH (e:Entity)
      OPTIONAL MATCH (e)-[r:RELATED_TO]-(related:Entity)
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
      type: r.get('type') || null,
      symbol: r.get('symbol') || null,
      ordnungszahl: r.get('ordnungszahl') ? r.get('ordnungszahl').toNumber() : null,
      relatedEntities: (r.get('relatedEntities') || []).filter(n => n !== null).map((name) => ({ name, weight: 1 })),
      components: (r.get('components') || []).filter(n => n !== null),
      articleCount: r.get('articleCount') || 0,
    }));

    // Total count for pagination
    const countResult = await session.run(`
      MATCH (e:Entity) WHERE 1=1${whereClause}
      RETURN count(e) AS total
    `, queryParams);
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
      entity.articles = articles.filter((a) => a.entities.includes(entity.name)).map((a) => a.title);
    });

    await session.close();

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`[kg-data] Neo4j: ${articles.length} articles, ${entities.length}/${totalEntities} entities in ${elapsed}s`);

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
    const entityNames = paginatedEntities.map(e => e.name);
    const linkedArticles = allArticles.filter(a =>
      (a.entities || []).some(en => entityNames.includes(en))
    );

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`[kg-data] Fallback: ${linkedArticles.length} articles, ${paginatedEntities.length}/${totalEntities} entities in ${elapsed}s`);

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

  try {
    const driver = getNeo4jDriver();
    const session = driver.session({
      database: NEO4J_DATABASE,
      defaultAccessMode: neo4j.session.READ,
    });

    const entityResult = await session.run(`
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
    `, { name: entityName });

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
      relatedEntities: (r.get('relatedEntities') || []).filter(n => n !== null).map((name) => ({ name, weight: 1 })),
      components: (r.get('components') || []).filter(n => n !== null),
      groups: (r.get('groups') || []).filter(n => n !== null),
      articleCount: r.get('articleCount') || 0,
    };

    // Get linked articles
    const articlesResult = await session.run(`
      MATCH (d:Document)-[:MENTIONS]->(e:Entity {name: $name})
      RETURN d.title as title, d.url as url, d.type as type,
             d.date as date, d.description as description
      ORDER BY d.date DESC
      LIMIT 50
    `, { name: entityName });

    const articles = articlesResult.records.map((r, i) => ({
      id: `a${i}`,
      title: r.get('title'),
      url: r.get('url'),
      type: r.get('type') || 'article',
      description: r.get('description') || null,
      date: r.get('date'),
    }));

    entity.articles = articles.map(a => a.title);

    await session.close();

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`[kg-data] Entity "${entityName}": ${articles.length} articles in ${elapsed}s`);

    return res.json({
      source: 'neo4j',
      entity,
      articles,
      loadTime: parseFloat(elapsed),
    });
  } catch (err) {
    console.error(`[kg-data] Entity lookup error: ${err.message}`);

    // Fallback: search in static data
    const fallback = getFallbackData();
    const entity = fallback.entities.find(e => e.name.toLowerCase() === entityName);
    if (!entity) {
      return res.status(404).json({ error: 'Entity not found', name: entityName, source: 'fallback' });
    }

    const articleTitles = entity.articles || [];
    const articles = fallback.articles.filter(a => articleTitles.includes(a.title));

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    return res.json({
      source: 'fallback',
      entity,
      articles,
      loadTime: parseFloat(elapsed),
    });
  }
});

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

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

app.listen(PORT, () => {
  console.log(`[chat-api] Listening on port ${PORT}`);
  console.log(`[chat-api] LiteLLM: ${LITELLM_URL}, Model: ${LITELLM_MODEL}`);
});
