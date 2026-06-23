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

  return fallback;
}

/**
 * GET /api/kg-data
 * Returns knowledge graph data (entities + articles) proxied from Neo4j.
 * Falls back to embedded static data if Neo4j is unavailable.
 */
app.get('/api/kg-data', async (req, res) => {
  const startTime = Date.now();

  try {
    const driver = getNeo4jDriver();
    const session = driver.session({
      database: NEO4J_DATABASE,
      defaultAccessMode: neo4j.session.READ,
      fetchSize: 1000,
    });

    const entitiesQuery = `
      MATCH (e:Entity)
      WHERE e.kategorie IS NULL OR e.kategorie <> 'lernziel'
      OPTIONAL MATCH (e)-[r:RELATED_TO]-(related:Entity)
      OPTIONAL MATCH (e)-[c:BESTEHT_AUS]->(component:Entity)
      RETURN e.name as name, e.kategorie as category,
             collect(DISTINCT related.name) as relatedEntities,
             collect(DISTINCT component.name) as components,
             COUNT { (:Document)-[:MENTIONS]->(e) } as articleCount
      ORDER BY articleCount DESC
      LIMIT 500
    `;
    const entitiesResult = await session.run(entitiesQuery);
    const entities = entitiesResult.records.map((r, i) => ({
      id: `e${i}`,
      name: r.get('name'),
      category: r.get('category') || 'konzept',
      articles: [],
      relatedEntities: (r.get('relatedEntities') || [])
        .filter((n) => n !== null)
        .map((name) => ({ name, weight: 1 })),
      components: (r.get('components') || []).filter((n) => n !== null),
      articleCount: r.get('articleCount') || 0,
    }));

    // Query articles linked to top entities
    const entityNames = entities.map((e) => e.name);
    const articlesQuery = `
      MATCH (d:Document)-[:MENTIONS]->(e:Entity)
      WHERE e.name IN $entityNames
      RETURN d.title as title, d.url as url, d.type as type,
             collect(e.name) as entities, d.date as date
      ORDER BY d.type, d.date DESC
      LIMIT 500
    `;
    const articlesResult = await session.run(articlesQuery, {
      entityNames: entityNames.slice(0, 100),
    });
    const articles = articlesResult.records.map((r, i) => ({
      id: `a${i}`,
      title: r.get('title'),
      url: r.get('url'),
      type: r.get('type') || 'article',
      entities: r.get('entities') || [],
      date: r.get('date'),
    }));

    entities.forEach((entity) => {
      entity.articles = articles
        .filter((a) => a.entities.includes(entity.name))
        .map((a) => a.title);
    });

    await session.close();

    // Query curriculum entities separately
    let curriculaEntities = [];
    try {
      const curriculaQuery = `
        MATCH (e:Entity {kategorie: 'lehrplan'})
        OPTIONAL MATCH (e)-[r:RELATED_TO]-(related:Entity)
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

    // Merge curricula into entities array (frontend filters by category)
    const existingNames = new Set(entities.map((e) => e.name));
    for (const curr of curriculaEntities) {
      if (!existingNames.has(curr.name)) {
        entities.push(curr);
        existingNames.add(curr.name);
      }
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(
      `[kg-data] Neo4j: ${articles.length} articles, ${entities.length} entities (${curriculaEntities.length} curricula) in ${elapsed}s`
    );

    return res.json({
      source: 'neo4j',
      articles,
      entities,
      curricula: curriculaEntities,
      loadTime: parseFloat(elapsed),
    });
  } catch (err) {
    console.error(`[kg-data] Neo4j error, using fallback: ${err.message}`);

    const fallback = getFallbackData();
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

    const curriculaCount = (fallback.curricula || []).length;
    console.log(
      `[kg-data] Fallback: ${fallback.articles.length} articles, ${fallback.entities.length} entities (${curriculaCount} curricula) in ${elapsed}s`
    );

    return res.json({
      source: 'fallback',
      ...fallback,
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
