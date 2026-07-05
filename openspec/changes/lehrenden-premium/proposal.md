# Proposal: Lehrenden-Premium (Teacher Premium Features)

**Status**: Planning
**Priority**: P0 (highest — security, foundation, revenue)
**Date**: 2026-07-05

## Summary

Build a teacher-premium tier on chemie-lernen.org with proper authentication,
premium gating, and Stripe payment integration. This unlocks the teacher
dashboard (Klassencockpit), extended KI-Assistent limits, and premium
didactic tools.

## Problem

1. **No auth system** — `/api/admin/chat-logs` is unauthenticated.
   Klassencockpit is accessible to anyone who knows the URL.
2. **No user accounts** — all data is anonymous LocalStorage. Teachers
   cannot persist student rosters across devices.
3. **No premium gating** — no way to monetize the platform to fund
   infrastructure (Neo4j, LiteLLM proxy, hosting).
4. **No payment integration** — Stripe/Paddle/LemonSqueezy not wired.
5. **No session management** — user identity is a random cookie; no
   logout, no password reset, no email verification.

## Scope

### Must Have (MVP)

| #   | Item                                        | Notes                                                     |
| --- | ------------------------------------------- | --------------------------------------------------------- |
| 1   | User accounts (email + password)            | Registration, login, logout, password reset               |
| 2   | Session management                          | JWT or cookie-based sessions, not anonymous               |
| 3   | Premium gating middleware                   | Check user role/tier on `/api/admin/*`                    |
| 4   | Klassencockpit behind auth                  | Requires login to access                                  |
| 5   | Stripe basic integration                    | One-time payment or monthly subscription                  |
| 6   | Auth UI                                     | Login/register page, premium upgrade page                 |
| 7   | User database                               | PostgreSQL or SQLite for user data                        |
| 8   | **Admin API key (stopgap already shipped)** | Env var check on `/api/admin/*` — DONE in commit 2bcc6ab9 |

### Should Have (v1.1)

| #   | Item                          | Notes                                       |
| --- | ----------------------------- | ------------------------------------------- |
| 9   | Teacher dashboard analytics   | Class-level progress aggregation            |
| 10  | Export/import student rosters | CSV, share links                            |
| 11  | Premium badge UI              | Visual indicator on teacher-facing pages    |
| 12  | Multiple subscription tiers   | Basic vs Pro (KI-Assistent extended limits) |

### Could Have (v2)

| #   | Item                         | Notes                                       |
| --- | ---------------------------- | ------------------------------------------- |
| 13  | Social login (Google, Apple) | Reduce friction                             |
| 14  | Team/teacher groups          | Shared class rosters in a department        |
| 15  | Stripe promotional coupons   | Discount codes for school districts         |
| 16  | License-based access         | School-wide licenses instead of per-teacher |

## Architecture

### Current state

- No auth middleware in Express
- No user database
- Klassencockpit is a static Hugo page with client-side JS
- `/api/admin/chat-logs` returns in-memory session data
- Anonymous cookie (`chemie_session`) for chat identity

### Proposed

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│ Hugo (SSR)  │────→│ Nginx        │────→│ Express API │
│ login page  │     │ reverse-proxy│     │ auth routes │
└─────────────┘     └──────────────┘     └──────┬──────┘
       ↑                                        │
       │                                        ▼
   ┌───┴────────────┐                  ┌──────────────┐
   │ User DB        │                  │ Stripe API   │
   │ (PostgreSQL)   │                  │ (payments)   │
   └────────────────┘                  └──────────────┘
```

### Technology options

| Option          | Auth                     | User DB                 | Payments     |
| --------------- | ------------------------ | ----------------------- | ------------ |
| A (recommended) | Lucia + JWT              | SQLite (better-sqlite3) | Stripe       |
| B (lightweight) | express-session + bcrypt | JSON file               | LemonSqueezy |
| C (managed)     | Clerk/Auth0              | Managed                 | Stripe       |

**Recommendation**: Option A — Lucia is lightweight, SQLite avoids needing
a PostgreSQL server, Stripe is the gold standard.

## Security considerations

- Passwords hashed with bcrypt (cost factor 12)
- Rate limiting on login/register endpoints (already exists for chat)
- CORS restricted to chemie-lernen.org (already in place)
- CSRF tokens for payment forms
- No PII in logs
- GDPR-compliant data deletion

## Open questions

1. Should premium gating apply to the `/api/chat` endpoint (limited messages/day for free tier)?
2. Does the teacher need to create student accounts, or are students anonymous?
3. One-time payment preferred, or monthly subscription?
4. Should we use the existing Docker Compose setup or add a new auth service?

## Tasks

See `tasks.md` for detailed breakdown.

## Resources

- [Lucia auth docs](https://lucia-auth.com/)
- [Stripe Node.js SDK](https://github.com/stripe/stripe-node)
- [Klassencockpit current code](../myhugoapp/static/js/klassencockpit.js)
- [Server.js admin routes](../../../api/server.js) (lines ~2165)
