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
  setLearningProfile,
  getLearningProfile,
  getQuizResults,
  isPremium,
  createPasswordResetToken,
  resetPassword,
} from './auth-db.js';
import nodemailer from 'nodemailer';
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

// ── SMTP / Email Config ────────────────────────────────────────────
const SMTP_HOST = process.env.SMTP_HOST || 'mail.tobias-weiss.org';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587', 10);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASSWORD;
const EMAIL_FROM = process.env.EMAIL_FROM || 'support@chemie-lernen.org';

let transporter = null;
if (SMTP_USER && SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: false, // STARTTLS on port 587
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    tls: {
      // Do not fail on invalid certs for mail.tobias-weiss.org
      rejectUnauthorized: false,
    },
  });
  transporter
    .verify()
    .then(() => {
      console.log('[auth] SMTP transporter ready');
    })
    .catch((err) => {
      console.warn('[auth] SMTP transporter verify failed — emails will not send:', err.message);
    });
} else {
  console.warn('[auth] SMTP_USER/SMTP_PASSWORD not set — password reset emails disabled');
}

// ── Email template helpers ─────────────────────────────────────────
function buildResetEmailHtml({ resetLink }) {
  return `<!DOCTYPE html>
<html lang="de">
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" style="width:100%;max-width:560px;margin:40px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.1);">
    <tr>
      <td style="padding:32px 24px 0;text-align:center;background:#1a73e8;">
        <h1 style="color:#fff;margin:0;font-size:22px;font-weight:600;">chemie-lernen.org</h1>
        <p style="color:rgba(255,255,255,0.85);margin:8px 0 24px;font-size:14px;">Passwort zurücksetzen</p>
      </td>
    </tr>
    <tr>
      <td style="padding:32px 24px;">
        <p style="font-size:15px;line-height:1.6;color:#333;margin:0 0 16px;">Hallo,</p>
        <p style="font-size:15px;line-height:1.6;color:#333;margin:0 0 16px;">
          Sie haben eine Zurücksetzung Ihres Passworts für
          <strong>chemie-lernen.org</strong> angefordert.
          Klicken Sie auf den folgenden Link, um ein neues Passwort zu vergeben:
        </p>
        <table role="presentation" style="margin:24px 0;">
          <tr>
            <td style="background:#1a73e8;border-radius:6px;text-align:center;">
              <a href="${resetLink}"
                 style="display:inline-block;padding:14px 32px;color:#fff;text-decoration:none;font-size:15px;font-weight:600;">Passwort zurücksetzen</a>
            </td>
          </tr>
        </table>
        <p style="font-size:13px;line-height:1.5;color:#777;margin:0 0 8px;">
          Dieser Link ist <strong>1 Stunde lang gültig</strong>. Danach müssen Sie eine neue
          Zurücksetzung anfordern.
        </p>
        <p style="font-size:13px;line-height:1.5;color:#777;margin:0;">
          Falls Sie keine Zurücksetzung angefordert haben, ignorieren Sie diese E-Mail.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:16px 24px;background:#f4f4f4;text-align:center;">
        <p style="font-size:12px;color:#999;margin:0;">
          chemie-lernen.org &middot; Fragen oder Probleme?
          <br>
          <a href="mailto:support@chemie-lernen.org" style="color:#1a73e8;text-decoration:none;">support@chemie-lernen.org</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildResetEmailText({ resetLink }) {
  return [
    'Hallo,',
    '',
    'Sie haben eine Zurücksetzung Ihres Passworts für chemie-lernen.org angefordert.',
    'Klicken Sie auf den folgenden Link, um ein neues Passwort zu vergeben:',
    '',
    resetLink,
    '',
    'Dieser Link ist 1 Stunde lang gültig. Danach müssen Sie eine neue Zurücksetzung anfordern.',
    '',
    'Falls Sie keine Zurücksetzung angefordert haben, ignorieren Sie diese E-Mail.',
    '',
    '---',
    'chemie-lernen.org | Fragen? support@chemie-lernen.org',
  ].join('\n');
}

async function sendResetEmail({ to, token }) {
  if (!transporter) {
    console.warn('[auth] Cannot send email: SMTP not configured');
    return;
  }

  const resetLink = `${FRONTEND_URL}/reset-password?token=${token}`;

  try {
    const info = await transporter.sendMail({
      from: EMAIL_FROM,
      to,
      subject: 'Passwort zurücksetzen — chemie-lernen.org',
      text: buildResetEmailText({ resetLink }),
      html: buildResetEmailHtml({ resetLink }),
    });
    console.log('[auth] Password reset email sent:', info.messageId);
  } catch (err) {
    console.error('[auth] Failed to send password reset email:', err.message);
  }
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
  const lp = user.learning_profile || {};
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      tier: user.tier,
      learning_profile: {
        level: lp.level,
        preferred_explanation_style: lp.preferred_explanation_style,
      },
    },
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
    learningProfile: user.learning_profile || null,
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

// GET /api/auth/profile — returns learning profile + inferred weak areas
authRouter.get('/profile', requireAuth, (req, res) => {
  const profile = getLearningProfile(req.user.id);
  const results = getQuizResults(req.user.id);

  // Infer weak areas from quiz results (topics with < 60% average)
  const topicScores = {};
  for (const r of results) {
    if (!topicScores[r.topic]) topicScores[r.topic] = { total: 0, count: 0 };
    topicScores[r.topic].total += r.percentage;
    topicScores[r.topic].count++;
  }
  const weakAreas = [];
  for (const [topic, data] of Object.entries(topicScores)) {
    const avg = data.total / data.count;
    if (avg < 60) weakAreas.push(topic);
  }

  res.json({
    profile: profile || { level: 'beginner', interests: [], preferred_explanation_style: 'simple' },
    weakAreas,
    quizCount: results.length,
  });
});

// PUT /api/auth/profile — update learning preferences
authRouter.put('/profile', requireAuth, (req, res) => {
  const { learning_level, interests, preferred_explanation_style } = req.body;

  const validLevels = ['beginner', 'intermediate', 'advanced'];
  const validStyles = ['simple', 'detailed', 'visual'];

  if (learning_level && !validLevels.includes(learning_level)) {
    return res
      .status(400)
      .json({ error: 'Ungültiges Niveau. Erlaubt: beginner, intermediate, advanced' });
  }
  if (preferred_explanation_style && !validStyles.includes(preferred_explanation_style)) {
    return res.status(400).json({ error: 'Ungültiger Stil. Erlaubt: simple, detailed, visual' });
  }
  if (interests && !Array.isArray(interests)) {
    return res.status(400).json({ error: 'Interessen müssen als Array übergeben werden' });
  }

  const profile = setLearningProfile(req.user.id, {
    level: learning_level,
    interests,
    preferred_explanation_style,
  });

  res.json({ profile });
});

// POST /api/auth/forgot-password — request password reset link (sends email)
authRouter.post('/forgot-password', async (req, res) => {
  try {
    const { email: rawEmail } = req.body;
    if (!rawEmail) {
      return res.status(400).json({ error: 'E-Mail-Adresse erforderlich' });
    }
    const email = rawEmail.toLowerCase().trim();
    const user = getUserByEmail(email);

    // Always return { ok: true } regardless of whether user exists (security)
    if (user) {
      const token = createPasswordResetToken(email);
      if (token) {
        await sendResetEmail({ to: email, token });
      }
    }

    res.json({ ok: true });
  } catch (err) {
    console.error('[auth] forgot-password error:', err.message);
    res.status(500).json({ error: 'Fehler beim Zurücksetzen des Passworts' });
  }
});

// POST /api/auth/reset-password — reset password using token
authRouter.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token erforderlich' });
    }
    if (!password) {
      return res.status(400).json({ error: 'Passwort erforderlich' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Passwort muss mindestens 8 Zeichen lang sein' });
    }
    if (password.length > 128) {
      return res.status(400).json({ error: 'Passwort zu lang (max. 128 Zeichen)' });
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    resetPassword(token, passwordHash);

    res.json({ ok: true });
  } catch (err) {
    console.error('[auth] reset-password error:', err.message);
    if (err.message === 'Ungültiger oder abgelaufener Token') {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: 'Fehler beim Zurücksetzen des Passworts' });
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
