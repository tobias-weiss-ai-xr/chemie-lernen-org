// ============================================================
// auth.js — Auth routes + JWT middleware for Lehrenden-Premium
// ESM module, compatible with api/server.js
// ============================================================
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createUser, getUserByEmail, getUserById, setPremiumTier, isPremium } from './auth-db.js';
import cookieParser from 'cookie-parser';

// ── Config ──────────────────────────────────────────────────
const JWT_SECRET = process.env.JWT_SECRET || 'chemie-default-jwt-secret-change-in-production';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '7d';
const BCRYPT_ROUNDS = 12;
const COOKIE_NAME = 'chemie_auth';
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || null;

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
    createdAt: user.created_at,
  };
}

// ── Express Router ───────────────────────────────────────────
const authRouter = Router();
authRouter.use(cookieParser());

// POST /api/auth/register
authRouter.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email und Passwort erforderlich' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Passwort muss mindestens 8 Zeichen lang sein' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Ungültiges E-Mail-Format' });
    }

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

// POST /api/auth/upgrade — mark user as premium (Stripe webhook calls this)
authRouter.post('/upgrade', (req, res) => {
  const { userId, tier } = req.body;
  if (!userId || !tier) {
    return res.status(400).json({ error: 'userId und tier erforderlich' });
  }
  const user = getUserById(userId);
  if (!user) {
    return res.status(404).json({ error: 'User nicht gefunden' });
  }
  setPremiumTier(userId, tier);
  res.json({
    ok: true,
    user: sanitizeUser({ ...user, tier, role: tier === 'free' ? 'user' : 'premium' }),
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
  if (!ADMIN_API_KEY) {
    // No key configured — allow for backward compatibility
    return next();
  }
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== ADMIN_API_KEY) {
    return res.status(401).json({ error: 'Ungültiger API-Key' });
  }
  next();
}

export { sanitizeUser, COOKIE_NAME, JWT_SECRET };
export default authRouter;
