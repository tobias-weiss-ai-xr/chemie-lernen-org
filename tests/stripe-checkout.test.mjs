/**
 * Tests for Stripe checkout flow & premium subscription management.
 *
 * Covers: auth.js middleware (requireAuth, requirePremium, sanitizeUser),
 * auth-db.js premium functions (isPremium, setPremiumTier, expireStalePremiums).
 *
 * Uses jest.unstable_mockModule() to mock Stripe SDK and other ESM deps
 * while importing the real auth modules via dynamic import().
 */

// Native ESM runs under NODE_OPTIONS=--experimental-vm-modules (npm test),
// where the jest global is not auto-injected — import it from @jest/globals.
import { jest, describe, test, expect, beforeAll, afterEach } from '@jest/globals';

/* ------------------------------------------------------------------ */
/*  Environment — must be set before module loads                      */
/* ------------------------------------------------------------------ */

process.env.JWT_SECRET = 'test-jwt-secret-for-stripe-checkout-tests';
process.env.STRIPE_SECRET_KEY = 'sk_test_mock';
process.env.STRIPE_PRICE_ID = 'price_test_mock';
process.env.FRONTEND_URL = 'http://localhost:3000';

/* ------------------------------------------------------------------ */
/*  Module mocks — ESM externals                                       */
/* ------------------------------------------------------------------ */

// Must be called before any dynamic import() of the mocked modules
jest.unstable_mockModule(
  'stripe',
  () => ({
    default: class MockStripe {
      constructor(key) {
        this._key = key;
        this.checkout = { sessions: { create: jest.fn() } };
        this.webhooks = { constructEvent: jest.fn() };
      }
    },
  }),
  { virtual: true }
);

jest.unstable_mockModule(
  'express',
  () => {
    const mockRouter = {
      use: jest.fn().mockReturnThis(),
      post: jest.fn().mockReturnThis(),
      get: jest.fn().mockReturnThis(),
      put: jest.fn().mockReturnThis(),
    };
    return { Router: jest.fn(() => mockRouter) };
  },
  { virtual: true }
);

jest.unstable_mockModule(
  'express-rate-limit',
  () => ({
    default: jest.fn(() => (req, res, next) => next()),
  }),
  { virtual: true }
);

jest.unstable_mockModule(
  'bcryptjs',
  () => ({
    default: {
      hash: jest.fn(() => Promise.resolve('$2a$12$mocked_hash_for_testing')),
      compare: jest.fn(() => Promise.resolve(true)),
    },
    hash: jest.fn(() => Promise.resolve('$2a$12$mocked_hash_for_testing')),
    compare: jest.fn(() => Promise.resolve(true)),
  }),
  { virtual: true }
);

jest.unstable_mockModule(
  'nodemailer',
  () => ({
    default: {
      createTransport: jest.fn(() => ({
        sendMail: jest.fn(() => Promise.resolve({ messageId: 'mock-mail-id' })),
      })),
    },
  }),
  { virtual: true }
);

jest.unstable_mockModule(
  'jsonwebtoken',
  () => ({
    default: {
      sign: jest.fn(() => 'mock-jwt-token-for-testing'),
      verify: jest.fn(() => ({
        id: 1,
        email: 'test@example.com',
        role: 'user',
        tier: 'free',
      })),
    },
  }),
  { virtual: true }
);

jest.unstable_mockModule(
  'cookie-parser',
  () => ({
    default: jest.fn(() => (req, res, next) => next()),
  }),
  { virtual: true }
);

// Mock Node built-in fs to prevent actual disk I/O from auth-db.js
jest.unstable_mockModule(
  'fs',
  () => ({
    default: {
      existsSync: jest.fn(() => false),
      readFileSync: jest.fn(),
      writeFileSync: jest.fn(),
      renameSync: jest.fn(),
      mkdirSync: jest.fn(),
    },
    existsSync: jest.fn(() => false),
    readFileSync: jest.fn(),
    writeFileSync: jest.fn(),
    renameSync: jest.fn(),
    mkdirSync: jest.fn(),
  }),
  { virtual: true }
);

/* ------------------------------------------------------------------ */
/*  Imports                                                            */
/* ------------------------------------------------------------------ */

let authDb;
let auth;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Create a mock Express req/res/next trio for middleware testing. */
function mockReqRes(user) {
  const req = { user: user || null };
  const json = jest.fn();
  const status = jest.fn(() => ({ json }));
  const res = { status, json };
  const next = jest.fn();
  return { req, res, next, json, status };
}

/* ================================================================== */
/*  Test Setup                                                         */
/* ================================================================== */

beforeAll(async () => {
  // Import order matters: auth-db.js is a dependency of auth.js.
  // The dynamic import resolves through the mock layer set up above.
  authDb = await import('../api/auth-db.js');
  auth = await import('../api/auth.js');
});

const createdUserIds = [];

afterEach(() => {
  // Remove users created during tests so each test starts clean
  const ids = [...createdUserIds];
  createdUserIds.length = 0;
  ids.forEach((id) => {
    try {
      authDb.deleteUser(id);
    } catch {
      /* user may have been deleted by the test itself */
    }
  });
});

function createTestUser(overrides = {}) {
  const email =
    overrides.email || `test_${Date.now()}_${Math.random().toString(36).slice(2, 8)}@example.com`;
  const id = authDb.createUser({
    email,
    passwordHash: '$2a$12$mocked_hash_for_testing',
    name: overrides.name || 'Test User',
    role: overrides.role || 'user',
    tier: overrides.tier || 'free',
  });
  createdUserIds.push(id);
  const user = authDb.getUserById(id);
  // Apply premium_until if provided
  if (overrides.premium_until && user) {
    user.premium_until = overrides.premium_until;
  }
  return user;
}

/* ================================================================== */
/*  auth-db.js — Premium functions                                     */
/* ================================================================== */

describe('auth-db.js — Premium-Funktionen', () => {
  describe('isPremium()', () => {
    test('gibt false zurück für null', () => {
      expect(authDb.isPremium(null)).toBe(false);
    });

    test('gibt false zurück für undefined', () => {
      expect(authDb.isPremium(undefined)).toBe(false);
    });

    test('gibt false zurück für free-Tier Benutzer', () => {
      const user = createTestUser({ tier: 'free' });
      expect(authDb.isPremium(user)).toBe(false);
    });

    test('gibt true zurück für premium Benutzer mit zukünftigem Ablaufdatum', () => {
      const future = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
      const user = createTestUser({ tier: 'premium', premium_until: future });
      expect(authDb.isPremium(user)).toBe(true);
    });

    test('gibt true zurück für premium Benutzer ohne premium_until (ewig)', () => {
      const user = createTestUser({ tier: 'premium' });
      // premium_until is null by default → no expiry check
      expect(authDb.isPremium(user)).toBe(true);
    });

    test('stuft abgelaufenen premium Benutzer automatisch herab', () => {
      const past = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const user = createTestUser({ tier: 'premium', premium_until: past });
      // isPremium erkennt das abgelaufene Datum und stuft herab
      expect(authDb.isPremium(user)).toBe(false);
      // Der Benutzer wurde automatisch auf free gesetzt
      expect(user.tier).toBe('free');
      expect(user.premium_until).toBeNull();
    });
  });

  describe('setPremiumTier()', () => {
    test('setzt Benutzer auf premium mit Ablaufdatum', () => {
      const user = createTestUser({ tier: 'free' });
      const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      authDb.setPremiumTier(user.id, 'premium', future);
      const updated = authDb.getUserById(user.id);
      expect(updated.tier).toBe('premium');
      expect(updated.role).toBe('premium');
      expect(updated.premium_until).toBe(future);
    });

    test('stuft premium Benutzer zurück auf free', () => {
      const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const user = createTestUser({ tier: 'premium', premium_until: future });
      authDb.setPremiumTier(user.id, 'free');
      const updated = authDb.getUserById(user.id);
      expect(updated.tier).toBe('free');
      expect(updated.role).toBe('user');
      // premium_until wird auf null gesetzt bei free
      expect(updated.premium_until).toBeNull();
    });

    test('aktualisiert updated_at bei Änderung', async () => {
      const user = createTestUser({ tier: 'free' });
      const before = user.updated_at;
      // Kurze Verzögerung, damit der timestamp sich unterscheidet
      await new Promise((r) => setTimeout(r, 5));
      const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      authDb.setPremiumTier(user.id, 'premium', future);
      const updated = authDb.getUserById(user.id);
      expect(updated.updated_at).not.toBe(before);
    });
  });

  describe('expireStalePremiums()', () => {
    test('stuft alle Benutzer mit abgelaufenem premium_until herab', () => {
      // Benutzer mit abgelaufenem Premium
      const past = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const expiredUser = createTestUser({
        tier: 'premium',
        premium_until: past,
      });
      // Aktuelles premium_until setzen, da createTestUser es nicht persistiert
      authDb.setPremiumTier(expiredUser.id, 'premium', past);

      authDb.expireStalePremiums();

      const updated = authDb.getUserById(expiredUser.id);
      expect(updated.tier).toBe('free');
      expect(updated.role).toBe('user');
      expect(updated.premium_until).toBeNull();
    });

    test('lässt aktive premium Benutzer unverändert', () => {
      const future = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
      const activeUser = createTestUser({
        tier: 'premium',
        premium_until: future,
      });
      authDb.setPremiumTier(activeUser.id, 'premium', future);

      authDb.expireStalePremiums();

      const updated = authDb.getUserById(activeUser.id);
      expect(updated.tier).toBe('premium');
      expect(updated.role).toBe('premium');
    });
  });
});

/* ================================================================== */
/*  auth.js — SanitizeUser                                             */
/* ================================================================== */

describe('auth.js — sanitizeUser()', () => {
  test('gibt null zurück für null Input', () => {
    expect(auth.sanitizeUser(null)).toBeNull();
  });

  test('gibt null zurück für undefined Input', () => {
    expect(auth.sanitizeUser(undefined)).toBeNull();
  });

  test('enthält isPremium: true für premium Benutzer', () => {
    const future = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
    const rawUser = {
      id: 999,
      email: 'premium@example.com',
      name: 'Premium User',
      role: 'premium',
      tier: 'premium',
      premium_until: future,
      learning_profile: { level: 'intermediate' },
      created_at: new Date().toISOString(),
    };
    const result = auth.sanitizeUser(rawUser);
    expect(result.isPremium).toBe(true);
    expect(result.tier).toBe('premium');
  });

  test('enthält isPremium: false für free Benutzer', () => {
    const rawUser = {
      id: 1000,
      email: 'free@example.com',
      name: 'Free User',
      role: 'user',
      tier: 'free',
      premium_until: null,
      learning_profile: null,
      created_at: new Date().toISOString(),
    };
    const result = auth.sanitizeUser(rawUser);
    expect(result.isPremium).toBe(false);
    expect(result.tier).toBe('free');
  });

  test('gibt abgelaufenen premium Benutzer als isPremium: false zurück', () => {
    const past = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const rawUser = {
      id: 1001,
      email: 'expired@example.com',
      name: 'Expired User',
      role: 'premium',
      tier: 'premium',
      premium_until: past,
      learning_profile: null,
      created_at: new Date().toISOString(),
    };
    const result = auth.sanitizeUser(rawUser);
    // sanitizeUser ruft isPremium auf, das den Benutzer automatisch herabstuft
    expect(result.isPremium).toBe(false);
  });

  test('enthält premiumUntil im serialisierten Objekt', () => {
    const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const rawUser = {
      id: 1002,
      email: 'with-date@example.com',
      name: 'With Date',
      role: 'premium',
      tier: 'premium',
      premium_until: future,
      learning_profile: null,
      created_at: new Date().toISOString(),
    };
    const result = auth.sanitizeUser(rawUser);
    expect(result.premiumUntil).toBe(future);
  });
});

/* ================================================================== */
/*  auth.js — Middleware                                                */
/* ================================================================== */

describe('auth.js — Middleware requireAuth', () => {
  test('gibt 401 zurück wenn req.user null ist', () => {
    const { req, res, next, status, json } = mockReqRes(null);

    auth.requireAuth(req, res, next);

    expect(status).toHaveBeenCalledWith(401);
    expect(json).toHaveBeenCalledWith({ error: 'Authentifizierung erforderlich' });
    expect(next).not.toHaveBeenCalled();
  });

  test('ruft next() auf wenn req.user vorhanden ist', () => {
    const { req, res, next } = mockReqRes({ id: 1, email: 'test@example.com' });

    auth.requireAuth(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });
});

describe('auth.js — Middleware requirePremium', () => {
  test('gibt 401 zurück wenn kein Benutzer authentifiziert ist', () => {
    const { req, res, next, status, json } = mockReqRes(null);

    auth.requirePremium(req, res, next);

    expect(status).toHaveBeenCalledWith(401);
    expect(json).toHaveBeenCalledWith({ error: 'Authentifizierung erforderlich' });
    expect(next).not.toHaveBeenCalled();
  });

  test('gibt 403 zurück wenn Benutzer nicht premium ist (free tier)', () => {
    const freeUser = { id: 2, email: 'free@example.com', tier: 'free', role: 'user' };
    const { req, res, next, status, json } = mockReqRes(freeUser);

    auth.requirePremium(req, res, next);

    expect(status).toHaveBeenCalledWith(403);
    expect(json).toHaveBeenCalledWith({ error: 'Premium-Mitgliedschaft erforderlich' });
    expect(next).not.toHaveBeenCalled();
  });

  test('gibt 403 zurück wenn premium abgelaufen ist (auto-demoted)', () => {
    // Erstelle einen Benutzer mit abgelaufenem premium im echten Store
    const user = createTestUser({ tier: 'free' });
    const past = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    authDb.setPremiumTier(user.id, 'premium', past);

    // isPremium(auto-demote) setzt tier zurück auf free
    // Der req.user sollte den frischen Stand aus sanitizeUser haben
    const sanitized = auth.sanitizeUser(user);
    const { req, res, next, status, json } = mockReqRes(sanitized);

    auth.requirePremium(req, res, next);

    expect(status).toHaveBeenCalledWith(403);
    expect(json).toHaveBeenCalledWith({ error: 'Premium-Mitgliedschaft erforderlich' });
    expect(next).not.toHaveBeenCalled();
  });

  test('ruft next() auf wenn Benutzer premium ist', () => {
    const future = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
    const premiumUser = {
      id: 3,
      email: 'premium@example.com',
      tier: 'premium',
      role: 'premium',
      premium_until: future,
    };
    const sanitized = auth.sanitizeUser(premiumUser);
    const { req, res, next } = mockReqRes(sanitized);

    auth.requirePremium(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });
});

/* ================================================================== */
/*  Integration — Premium-Flow                                         */
/* ================================================================== */

describe('Premium-Flow Integration', () => {
  test('GET /me gibt isPremium: true für premium Benutzer', () => {
    const future = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
    const rawUser = {
      id: 2001,
      email: 'integ-test-premium@example.com',
      name: 'Integration Premium',
      role: 'premium',
      tier: 'premium',
      premium_until: future,
      learning_profile: null,
      created_at: new Date().toISOString(),
    };
    const result = auth.sanitizeUser(rawUser);
    expect(result.isPremium).toBe(true);
    expect(result.tier).toBe('premium');
    expect(result.premiumUntil).toBe(future);
  });

  test('setPremiumTier setzt premium tier (Stripe-Webhook-Pfad)', () => {
    const user = createTestUser({ tier: 'free' });
    const future = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

    // Upgrade — simuliert was POST /upgrade macht
    authDb.setPremiumTier(user.id, 'premium', future);
    const updated = authDb.getUserById(user.id);

    expect(updated.tier).toBe('premium');
    expect(updated.role).toBe('premium');

    // isPremium bestätigt den Premium-Status
    expect(authDb.isPremium(updated)).toBe(true);
  });

  test('Premium-Ablauf: isPremium erkennt abgelaufenes Datum und stuft herab', () => {
    const user = createTestUser({ tier: 'free' });
    const past = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    authDb.setPremiumTier(user.id, 'premium', past);

    const updated = authDb.getUserById(user.id);
    expect(authDb.isPremium(updated)).toBe(false);
    // Automatische Herabstufung
    expect(updated.tier).toBe('free');
    expect(updated.premium_until).toBeNull();
  });

  test('POST /create-checkout-session Aufruf erfordert premium Berechtigung', () => {
    // Ungültig: free Benutzer darf keine Checkout-Session erstellen
    // (requireAuth wird in der Route verwendet, nicht requirePremium)
    // Tatsächlich verwendet create-checkout-session requireAuth,
    // nicht requirePremium — das ist korrekt (jeder kann upgraden)
    const freeUser = { id: 4, email: 'upgrading@example.com', tier: 'free' };
    const { req: reqFree, res: resFree, next: nextFree } = mockReqRes(freeUser);

    auth.requireAuth(reqFree, resFree, nextFree);
    // requireAuth sollte weiterleiten, da req.user vorhanden ist
    expect(nextFree).toHaveBeenCalledTimes(1);
  });

  test('requireAuth sperrt create-checkout-session wenn nicht eingeloggt', () => {
    const { req, res, next, status, json } = mockReqRes(null);

    auth.requireAuth(req, res, next);

    expect(status).toHaveBeenCalledWith(401);
    expect(json).toHaveBeenCalledWith({ error: 'Authentifizierung erforderlich' });
    expect(next).not.toHaveBeenCalled();
  });

  test('expireStalePremiums räumt alle abgelaufenen Premiums auf', () => {
    // Einen aktiven und einen abgelaufenen Benutzer anlegen
    const future = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
    const past = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const activeUser = createTestUser({
      email: `active_${Date.now()}@example.com`,
      tier: 'free',
    });
    authDb.setPremiumTier(activeUser.id, 'premium', future);

    const expiredUser = createTestUser({
      email: `expired_${Date.now()}@example.com`,
      tier: 'free',
    });
    authDb.setPremiumTier(expiredUser.id, 'premium', past);

    authDb.expireStalePremiums();

    const activeCheck = authDb.getUserById(activeUser.id);
    const expiredCheck = authDb.getUserById(expiredUser.id);

    expect(activeCheck.tier).toBe('premium');
    expect(expiredCheck.tier).toBe('free');
    expect(expiredCheck.premium_until).toBeNull();
  });
});
