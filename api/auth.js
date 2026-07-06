// ============================================================
// auth.js — Auth routes + JWT middleware for Lehrenden-Premium
// ESM module, compatible with api/server.js
// ============================================================
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Stripe from 'stripe';
import rateLimit from 'express-rate-limit';
import {
  createUser,
  getUserByEmail,
  getUserById,
  getUserByStripeId,
  setPremiumTier,
  setStripeCustomerId,
  isPremium,
} from './auth-db.js';
import cookieParser from 'cookie-parser';

// ── Config ──────────────────────────────────────────────────
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('[auth] FATAL: JWT_SECRET environment variable is required');
  process.exit(1);
}
const JWT_EXPIRY = process.env.JWT_EXPIRY || '7d';
const BCRYPT_ROUNDS = 12;
const COOKIE_NAME = 'chemie_auth';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://chemie-lernen.org';

// Stripe
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID;
let stripe = null;
if (STRIPE_SECRET_KEY) {
  stripe = new Stripe(STRIPE_SECRET_KEY);
}

// Rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { error: 'Zu viele Anfragen. Bitte versuchen Sie es später erneut.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── Helpers ─────────────────────────────────────────────────
function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, tier: user.tier },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );
}

function setAuthCookie(res, token) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  });
}

function clearAuthCookie(res) {
  res.clearCookie(COOKIE_NAME, { path: '/' });
}

function sanitizeUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    tier: user.tier,
    isPremium: isPremium(user),
    premiumUntil: user.premium_until,
    createdAt: user.created_at,
  };
}

// ── Express Router ───────────────────────────────────────────
const authRouter = Router();
authRouter.use(cookieParser());
authRouter.use(authLimiter);

// POST /api/auth/register
authRouter.post('/register', async (req, res) => {
  try {
    const { email: rawEmail, password, name: rawName } = req.body;

    if (!rawEmail || !password) {
      return res.status(400).json({ error: 'Email und Passwort erforderlich' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Passwort muss mindestens 8 Zeichen lang sein' });
    }
    if (password.length > 128) {
      return res.status(400).json({ error: 'Passwort zu lang (max. 128 Zeichen)' });
    }
    const email = rawEmail.toLowerCase().trim();
    if (email.length > 254) {
      return res.status(400).json({ error: 'E-Mail-Adresse zu lang' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Ungültiges E-Mail-Format' });
    }
    const name = (rawName || '')
      .trim()
      .slice(0, 100)
      .replace(/<[^>]*>/g, '');

    const existing = getUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'E-Mail bereits registriert' });
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const userId = createUser({
      email,
      passwordHash,
      name: name || '',
      role: 'user',
      tier: 'free',
    });

    const user = getUserById(userId);
    const token = signToken(user);
    setAuthCookie(res, token);

    res.status(201).json({ user: sanitizeUser(user), token });
  } catch (err) {
    console.error('[auth] register error:', err.message);
    res.status(500).json({ error: 'Registrierung fehlgeschlagen' });
  }
});

// POST /api/auth/login
authRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email und Passwort erforderlich' });
    }

    const user = getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Ungültige Anmeldedaten' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Ungültige Anmeldedaten' });
    }

    const token = signToken(user);
    setAuthCookie(res, token);

    res.json({ user: sanitizeUser(user), token });
  } catch (err) {
    console.error('[auth] login error:', err.message);
    res.status(500).json({ error: 'Anmeldung fehlgeschlagen' });
  }
});

// POST /api/auth/logout
authRouter.post('/logout', (req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

// GET /api/auth/me — returns current user from JWT cookie or Authorization header
authRouter.get('/me', (req, res) => {
  const token = req.cookies?.[COOKIE_NAME] || req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.json({ user: null });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = getUserById(decoded.id);
    if (!user) {
      clearAuthCookie(res);
      return res.json({ user: null });
    }
    res.json({ user: sanitizeUser(user) });
  } catch {
    clearAuthCookie(res);
    res.json({ user: null });
  }
});

// POST /api/auth/create-checkout-session — Stripe Checkout for premium subscription
authRouter.post('/create-checkout-session', requireAuth, async (req, res) => {
  if (!stripe) {
    return res.status(501).json({ error: 'Stripe nicht konfiguriert' });
  }
  if (!STRIPE_PRICE_ID) {
    return res.status(501).json({ error: 'STRIPE_PRICE_ID nicht konfiguriert' });
  }
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: req.user.email,
      line_items: [{ price: STRIPE_PRICE_ID, quantity: 1 }],
      success_url: `${FRONTEND_URL}/konto?success=1`,
      cancel_url: `${FRONTEND_URL}/preise?cancelled=1`,
      metadata: { userId: String(req.user.id) },
    });
    res.json({ url: session.url });
  } catch (err) {
    console.error('[stripe] create-checkout-session error:', err.message);
    res.status(500).json({ error: 'Checkout-Session konnte nicht erstellt werden' });
  }
});

// POST /api/auth/upgrade — mark user as premium (Stripe webhook calls this)
authRouter.post('/upgrade', (req, res) => {
  const { userId, tier, premiumUntil } = req.body;
  if (!userId || !tier) {
    return res.status(400).json({ error: 'userId und tier erforderlich' });
  }
  const user = getUserById(userId);
  if (!user) {
    return res.status(404).json({ error: 'User nicht gefunden' });
  }
  setPremiumTier(userId, tier, premiumUntil || null);
  res.json({
    ok: true,
    user: sanitizeUser({
      ...user,
      tier,
      role: tier === 'free' ? 'user' : 'premium',
      premium_until: premiumUntil || null,
    }),
  });
});

// ── Middleware ───────────────────────────────────────────────

// authMiddleware — extracts user from JWT cookie, sets req.user
export function authMiddleware(req, res, next) {
  const token = req.cookies?.[COOKIE_NAME] || req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = getUserById(decoded.id);
    req.user = user ? sanitizeUser(user) : null;
  } catch {
    req.user = null;
  }
  next();
}

// requireAuth — returns 401 if not authenticated
export function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentifizierung erforderlich' });
  }
  next();
}

// requirePremium — returns 403 if not premium user
export function requirePremium(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentifizierung erforderlich' });
  }
  if (!isPremium(req.user)) {
    return res.status(403).json({ error: 'Premium-Mitgliedschaft erforderlich' });
  }
  next();
}

// adminKeyMiddleware — checks x-api-key header against ADMIN_API_KEY env var
export function adminKeyMiddleware(req, res, next) {
  const apiKey = process.env.ADMIN_API_KEY;
  if (!apiKey) {
    // No key configured — allow for backward compatibility
    return next();
  }
  const provided = req.headers['x-api-key'];
  if (!provided || provided !== apiKey) {
    return res.status(401).json({ error: 'Ungültiger API-Key' });
  }
  next();
}

// Stripe webhook handler — exported separately for raw-body mounting
export async function handleStripeWebhook(req, res) {
  if (!STRIPE_WEBHOOK_SECRET || !stripe) {
    return res.status(501).json({ error: 'Stripe nicht konfiguriert' });
  }
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('[stripe] webhook signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = parseInt(session.metadata?.userId, 10);
        if (!userId) {
          console.error('[stripe] webhook: missing userId in session metadata');
          return res.status(400).json({ error: 'Missing userId' });
        }
        const user = getUserById(userId);
        if (!user) {
          console.error('[stripe] webhook: user not found:', userId);
          return res.status(404).json({ error: 'User not found' });
        }

        // Calculate premium_until: +1 year from now
        const premiumUntil = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
        setPremiumTier(userId, 'premium', premiumUntil);

        // Store Stripe customer ID
        if (session.customer) {
          setStripeCustomerId(userId, session.customer);
        }

        console.log('[stripe] upgraded user', userId, 'to premium until', premiumUntil);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        // Extend premium_until based on subscription period
        if (invoice.lines?.data?.[0]?.period) {
          const periodEnd = new Date(invoice.lines.data[0].period.end * 1000).toISOString();
          const customerId = invoice.customer;
          const user = getUserByStripeId(customerId);
          if (user) {
            setPremiumTier(user.id, 'premium', periodEnd);
            console.log('[stripe] extended premium for user', user.id, 'until', periodEnd);
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const customerId = subscription.customer;
        const user = getUserByStripeId(customerId);
        if (user) {
          setPremiumTier(user.id, 'free');
          console.log('[stripe] downgraded user', user.id, 'to free (subscription cancelled)');
        }
        break;
      }

      default:
        console.log('[stripe] unhandled event type:', event.type);
    }

    res.json({ received: true });
  } catch (err) {
    console.error('[stripe] webhook handler error:', err.message);
    res.status(500).json({ error: 'Webhook handler error' });
  }
}

export { sanitizeUser, COOKIE_NAME, JWT_SECRET };
export default authRouter;
