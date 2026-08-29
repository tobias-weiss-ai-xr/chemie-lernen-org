/**
 * Chemie Chat API — Express server with rate limiting.
 * Proxies chemistry questions to LiteLLM, enforces 50 requests/IP/day.
 * Modularized: routes imported from routes/, services from services/.
 */
import express from 'express';
import cookieParser from 'cookie-parser';
import authRouter, { authMiddleware, handleStripeWebhook } from './auth.js';
import { getConversationMemory, addConversationMemory } from './auth-db.js';
import promBundle from 'express-prom-bundle';
import * as Sentry from '@sentry/node';
import pino from 'pino';
import rateLimit from 'express-rate-limit';

// ── Services ──────────────────────────────────────────────────
import { closeNeo4jDriver } from './services/neo4j.js';
import {
  getSessionId,
  getSession,
  cleanupSessionMessages,
  checkRateLimit,
} from './services/session.js';
import {
  getRAGContext,
  extractEntities,
  loadChatEntities,
  buildSystemPrompt,
  extractSourceNames,
} from './services/rag.js';

// ── Route modules ──────────────────────────────────────────────
import chatRouter from './routes/chat.js';
import kgDataRouter from './routes/kg-data.js';
import curriculaRouter from './routes/curricula.js';
import contentRouter from './routes/content.js';
import didaktikRouter from './routes/didaktik.js';
import modulhandbuchRouter from './routes/modulhandbuch.js';
import quizRouter from './routes/quiz.js';
import exercisesRouter from './routes/exercises.js';
import learningPathsRouter from './routes/learning-paths.js';
import zpdRouter from './routes/zpd.js';
import gamificationRouter from './routes/gamification.js';
import collabRouter from './routes/collab.js';
import adaptiveRouter from './routes/adaptive.js';
import analyticsRouter from './routes/analytics.js';
import premiumContentRouter from './routes/premium-content.js';
import themeOverridesRouter from './routes/theme-overrides.js';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  ...(process.env.NODE_ENV !== 'production' && {
    transport: { target: 'pino-pretty', options: { colorize: true } },
  }),
});

// ── Config ─────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
const LITELLM_URL = process.env.LITELLM_URL || 'http://litellm-proxy:4000';
const LITELLM_MODEL = process.env.LITELLM_MODEL || 'gemma-4';
const LITELLM_MODEL_PREMIUM = process.env.LITELLM_MODEL_PREMIUM || 'gpt-4o-mini';
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || '';

// ── express-rate-limit tiers ──────────────────────────────────
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Zu viele Anmeldeversuche. Bitte warten Sie 15 Minuten.' },
});
const defaultLimiter = rateLimit({
  windowMs: 60 * 1000,
  // 100/min — public read endpoints (curricula, modulhandbuch, kg graph,
  // rag-context, ...). 30/min was too strict: it 429'd legitimate bursts
  // (multi-page navigation, E2E suites) while adding little abuse protection
  // for read-only GET traffic.
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Zu viele Anfragen. Bitte langsamer machen.' },
});
const generousLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Rate limit erreicht. Bei Bedarf upgraden.' },
});

// ── App setup ──────────────────────────────────────────────────
const app = express();

// Bump max listeners to avoid MaxListenersExceededWarning (deps add exit handlers)
process.setMaxListeners(20);

// Trust proxy — behind nginx/Traefik, so req.ip returns real client IP
app.set('trust proxy', 1);
app.disable('x-powered-by');

// Stripe webhook MUST be before express.json() — needs raw body for signature verification
app.post(
  '/api/auth/stripe-webhook',
  express.raw({ type: 'application/json' }),
  handleStripeWebhook
);

app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());

// Prometheus metrics
const promMid = promBundle({
  includeMethod: true,
  includePath: true,
  includeStatusCode: true,
  promClient: { collectDefaultMetrics: { timeout: 5000 } },
  customLabels: { app: 'chemie-chat-api' },
  metricsApp: app,
  metricsPath: '/api/metrics',
});
app.use(promMid);

// Sentry error tracking
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    integrations: [Sentry.expressIntegration()],
    tracesSampleRate: 0.1,
  });
}

// CORS for chemie-lernen.org subdomains + dev origins
app.use((req, res, next) => {
  const origin = req.headers.origin || '';
  // Exact domain or subdomain (*.chemie-lernen.org)
  const isChemie = origin === 'https://chemie-lernen.org' || origin.endsWith('.chemie-lernen.org');
  // Dev: localhost / 127.0.0.1 on any port
  const isLocal =
    origin === 'http://localhost' ||
    origin === 'http://127.0.0.1' ||
    origin.startsWith('http://localhost:') ||
    origin.startsWith('http://127.0.0.1:') ||
    origin.startsWith('http://localhost.') ||
    origin.startsWith('http://127.0.0.1.') ||
    /https?:\/\/localhost[:.]/.test(origin) ||
    /https?:\/\/127\.0\.0\.1[:.]/.test(origin);
  if (isChemie || isLocal) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// ── Rate limiter wiring ───────────────────────────────────────
app.use('/api/auth/login', strictLimiter);
app.use('/api/auth/register', strictLimiter);
app.use('/api/admin', strictLimiter);
app.use('/api/chat', generousLimiter);
app.use('/api/exercises', generousLimiter);

// Health + KG-data endpoints (before default rate limiter so /api/health
// and /api/kg-data are always reachable, even during CI smoke tests).
app.use(kgDataRouter);

// Default rate limit for remaining /api/* routes
app.use('/api', defaultLimiter);

// Auth routes & middleware
app.use('/api/auth', authRouter);
app.use('/api/*', authMiddleware);

// Admin API key check — fail-CLOSED and header-only.
// Query-string keys (?api_key=) are rejected: they leak into access logs,
// browser history and Referer headers. With no key configured the routes
// are refused instead of opened (they expose PII: chat logs, class results).
app.use('/api/admin', (req, res, next) => {
  if (!ADMIN_API_KEY) {
    return res.status(503).json({ error: 'Admin-Key nicht konfiguriert' });
  }
  const provided = req.headers['x-api-key'];
  if (!provided || provided !== ADMIN_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized — gültiger API-Key erforderlich' });
  }
  next();
});

// ── Mount route modules ───────────────────────────────────────
app.use(chatRouter); // chat history, session, hint, feedback, curricula/compare, admin/chat-logs
app.use(curriculaRouter); // curricula/* endpoints
app.use(contentRouter); // content list, cross-link-stats, article
app.use(didaktikRouter); // didaktik guidelines & teaching tips
app.use(modulhandbuchRouter); // modulhandbuch, studienvergleich
app.use(quizRouter); // quizzes, quiz-results, fsrs
app.use(exercisesRouter); // exercise generation & answering
app.use(learningPathsRouter); // learning paths & certificates
app.use(zpdRouter); // ZPD learner-state + next-in-ZPD
app.use(gamificationRouter); // check-in, xp, achievements, badges, profile
app.use(collabRouter); // collaboration sessions
app.use(adaptiveRouter); // adaptive difficulty recommendations
app.use(analyticsRouter); // premium teacher analytics dashboard
app.use(premiumContentRouter); // premium lesson plans & worksheets
app.use(themeOverridesRouter); // element→themeKey overrides (admin)

// ── POST /api/chat (kept inline — tightly coupled with RAG + session) ──
app.post('/api/chat', async (req, res) => {
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

  const sessionId = getSessionId(req, res);
  const { message, currentEntity } = req.body;
  if (!message || typeof message !== 'string' || message.length > 1000) {
    return res.status(400).json({ error: 'Invalid message' });
  }

  const acceptStreaming = req.accepts('text/event-stream');

  try {
    const session = getSession(sessionId, req.user?.id);
    session.messages.push({ role: 'user', content: message });
    cleanupSessionMessages(session);

    var ragContext = await getRAGContext(message);
    var ragSources = [];
    if (ragContext) ragSources = extractSourceNames(ragContext);

    var chatEntities = loadChatEntities();
    var matchedEntities = extractEntities(message, chatEntities);

    var conversationMemory = req.user?.id ? getConversationMemory(req.user.id) : null;
    var systemPrompt = buildSystemPrompt({
      lang: req.headers['accept-language'],
      ragContext: ragContext,
      currentEntity: currentEntity,
      entities: matchedEntities,
      learningProfile: req.user?.learningProfile || null,
      conversationMemory: conversationMemory,
    });

    // Confusion detection
    var userMessages = session.messages.filter(function (m) {
      return m.role === 'user';
    });
    var msgWords = message
      .toLowerCase()
      .replace(/[.,!?;:]/g, '')
      .split(/\s+/)
      .filter(function (w) {
        return w.length > 3;
      });
    for (var ci = 0; ci < userMessages.length; ci++) {
      var prev = userMessages[ci].content
        .toLowerCase()
        .replace(/[.,!?;:]/g, '')
        .split(/\s+/);
      var overlap = 0;
      for (var wi = 0; wi < msgWords.length; wi++) {
        if (prev.indexOf(msgWords[wi]) !== -1) overlap++;
      }
      var similarity = msgWords.length > 0 ? overlap / msgWords.length : 0;
      if (similarity > 0.7) {
        systemPrompt +=
          ' Hinweis: Der Schüler hat eine ähnliche Frage bereits gestellt. Wiederhole die Erklärung mit anderen Worten und frag, ob es diesmal klarer ist.';
        break;
      }
    }

    // Token-Gating: nur die letzten ~6 Nachrichten (3 Turns) an die LLM senden,
    // nicht die gesamte Session (bis zu 50) — senkt Kosten pro Anfrage deutlich.
    const CHAT_HISTORY_LIMIT = 6;
    const conversationHistory = [
      { role: 'system', content: systemPrompt },
      ...session.messages.slice(-CHAT_HISTORY_LIMIT),
    ];
    const model = req.user?.tier === 'premium' ? LITELLM_MODEL_PREMIUM : LITELLM_MODEL;

    var firstUserMsg = null,
      topicSummary = null;

    if (!acceptStreaming) {
      const llmRes = await fetch(`${LITELLM_URL}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + (process.env.LITELLM_API_KEY || ''),
        },
        body: JSON.stringify({
          model,
          messages: conversationHistory,
          max_tokens: 512,
          temperature: 0.5,
        }),
      });
      if (!llmRes.ok) {
        const errText = await llmRes.text();
        logger.error(`[chat-api] LiteLLM error ${llmRes.status}: ${errText}`);
        return res.status(502).json({ error: 'Upstream API error' });
      }
      const data = await llmRes.json();
      var reply = data.choices?.[0]?.message?.content || 'Keine Antwort erhalten.';
      var userCount = session.messages.filter(function (m) {
        return m.role === 'user';
      }).length;
      if (userCount >= 3) reply += '\n\nWar diese Antwort hilfreich? (Daumen hoch oder runter)';
      session.messages.push({ role: 'assistant', content: reply });
      cleanupSessionMessages(session);

      if (req.user?.id && session.messages.length > 0) {
        firstUserMsg = session.messages.find(function (m) {
          return m.role === 'user';
        });
        topicSummary = firstUserMsg ? firstUserMsg.content.slice(0, 120) : message.slice(0, 120);
        addConversationMemory(req.user.id, {
          sessionId,
          topicSummary,
          messageCount: session.messages.length,
        });
      }
      res.json({
        reply,
        sources: ragSources,
        remaining: rate.remaining,
        sessionId,
        messageCount: session.messages.length,
        entities: matchedEntities.length > 0 ? matchedEntities : undefined,
      });
      return;
    }

    // Streaming mode
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const buffer = [];
    let replyContent = '';
    try {
      const llmRes = await fetch(`${LITELLM_URL}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + (process.env.LITELLM_API_KEY || ''),
        },
        body: JSON.stringify({
          model,
          messages: conversationHistory,
          max_tokens: 512,
          temperature: 0.5,
          stream: true,
        }),
      });
      if (!llmRes.ok) {
        const errText = await llmRes.text();
        logger.error(`[chat-api] LiteLLM error ${llmRes.status}: ${errText}`);
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
            /* skip parse errors */
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
          entities: matchedEntities.length > 0 ? matchedEntities : undefined,
        })}\n\n`
      );
    } catch (streamErr) {
      logger.error(`[chat-api] Stream failed, falling back: ${streamErr.message}`);
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
          entities: matchedEntities.length > 0 ? matchedEntities : undefined,
        })}\n\n`
      );
    } finally {
      var userCountA = session.messages.filter(function (m) {
        return m.role === 'user';
      }).length;
      if (userCountA >= 3) {
        try {
          res.write(
            'data: ' +
              JSON.stringify({ prompt: 'War diese Antwort hilfreich? (Daumen hoch oder runter)' }) +
              '\n\n'
          );
        } catch {
          void 0;
        }
      }
      res.end();
    }

    session.messages.push({ role: 'assistant', content: replyContent });
    cleanupSessionMessages(session);
    if (req.user?.id && session.messages.length > 0) {
      firstUserMsg = session.messages.find(function (m) {
        return m.role === 'user';
      });
      topicSummary = firstUserMsg
        ? firstUserMsg.content.slice(0, 120)
        : (req.body?.message || '').slice(0, 120);
      addConversationMemory(req.user.id, {
        sessionId,
        topicSummary,
        messageCount: session.messages.length,
      });
    }
  } catch (err) {
    logger.error(`[chat-api] Error: ${err.message}`);
    if (!res.headersSent && !res.writableEnded)
      res.status(502).json({ error: 'Service unavailable' });
  }
});

// ── Global Error Handler ──────────────────────────────────────
app.use((err, req, res, next) => {
  logger.error(`[api] Unhandled error: ${err.message}`, {
    method: req.method,
    url: req.originalUrl || req.url,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
  if (res.headersSent) return next(err);
  // Malformed percent-encoding in the URL path (router or handler level).
  if (err instanceof URIError) {
    return res.status(400).json({ error: 'Ungültige URL-Kodierung' });
  }
  const statusCode = err.statusCode || err.status || 500;
  res.status(statusCode).json({
    error: statusCode === 500 ? 'Interner Serverfehler' : err.message,
    ...(process.env.NODE_ENV === 'development' && { details: err.stack }),
  });
});

// Sentry error handler (must be last error handler)
if (process.env.SENTRY_DSN) {
  app.use(Sentry.expressErrorHandler());
}

// ── Graceful shutdown ────────────────────────────────────────
process.on('SIGTERM', async () => {
  await closeNeo4jDriver();
  process.exit(0);
});
process.on('unhandledRejection', (reason) => {
  logger.error({ err: reason }, 'UNHANDLED REJECTION');
});
process.on('uncaughtException', (err) => {
  logger.error({ err }, 'UNCAUGHT EXCEPTION');
});

app.listen(PORT, () => {
  logger.info(`[chat-api] Listening on port ${PORT}`);
  logger.info(`[chat-api] LiteLLM: ${LITELLM_URL}, Model: ${LITELLM_MODEL}`);
});
