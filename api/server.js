/**
 * Chemie Chat API — Express server with rate limiting.
 * Proxies chemistry questions to LiteLLM, enforces 10 requests/IP/day.
 */
import express from 'express';

const PORT = process.env.PORT || 3001;
const LITELLM_URL = process.env.LITELLM_URL || 'http://litellm-proxy:4000';
const LITELLM_MODEL = process.env.LITELLM_MODEL || 'gemini-2.5-flash';
const RATE_LIMIT = 10; // requests per IP per day

// In-memory rate limit store: Map<ip, { count, resetDate }>
const rateStore = new Map();

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
}, 3600000); // every hour

const app = express();
app.use(express.json({ limit: '10kb' }));

// CORS for the chemie-lernen.org domain
app.use((req, res, next) => {
  const origin = req.headers.origin || '';
  if (origin.endsWith('chemie-lernen.org') || origin.endsWith('localhost')) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.post('/api/chat', async (req, res) => {
  // Rate limit check
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const rate = checkRateLimit(ip);
  res.setHeader('X-RateLimit-Remaining', rate.remaining);
  if (!rate.allowed) {
    return res.status(429).json({
      error: 'Rate limit exceeded',
      message: 'Max 10 Anfragen pro Tag. Morgen kannst du weitermachen!',
      remaining: 0,
    });
  }

  const { message } = req.body;
  if (!message || typeof message !== 'string' || message.length > 1000) {
    return res.status(400).json({ error: 'Invalid message' });
  }

  try {
    const systemPrompt = `Du bist ein hilfreicher Chemie-Assistent für Schüler (Klasse 8-13) auf chemie-lernen.org. 
Antworte kurz, präzise und auf Deutsch. Beziehe dich auf chemische Konzepte, Formeln und Gesetze. 
Wenn du etwas nicht weißt, sage es ehrlich. Maximal 3 Sätze.`;

    const llmRes = await fetch(`${LITELLM_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: LITELLM_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message },
        ],
        max_tokens: 300,
        temperature: 0.3,
      }),
    });

    if (!llmRes.ok) {
      const errText = await llmRes.text();
      console.error(`[chat-api] LiteLLM error ${llmRes.status}: ${errText}`);
      return res.status(502).json({ error: 'Upstream API error' });
    }

    const data = await llmRes.json();
    const reply = data.choices?.[0]?.message?.content || 'Keine Antwort erhalten.';
    res.json({ reply, remaining: rate.remaining });
  } catch (err) {
    console.error(`[chat-api] Error: ${err.message}`);
    res.status(502).json({ error: 'Service unavailable' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

app.listen(PORT, () => {
  console.log(`[chat-api] Listening on port ${PORT}`);
  console.log(`[chat-api] LiteLLM: ${LITELLM_URL}, Model: ${LITELLM_MODEL}`);
});
