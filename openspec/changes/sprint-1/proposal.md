# Sprint 1: Lehrenden-Premium Go-Live

**Goal**: Activate Stripe payment integration, premium gating, and go-live with the Lehrenden-Premium subscription tier.

## Scope

### Stripe Integration

- Implement Stripe Checkout session creation (`POST /api/auth/create-checkout-session`)
- Stripe webhook endpoint (`POST /api/auth/stripe-webhook`) with signature verification
- Handle `checkout.session.completed` → upgrade user to `premium` in auth-db
- Stripe Customer Portal for subscription management
- Environment: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID`, `FRONTEND_URL`

### Premium Gating

- Wire `requirePremium` middleware into protected calculator pages and KI-Assistent premium features
- Add `premium_until` field to user schema with expiry check
- Premium badge/banner UI on login/register pages
- Graceful downgrade when premium expires (demote to `free`, show upgrade prompt)

### UI Polish

- Pricing page (`/preise`): feature comparison table, Stripe Checkout CTA
- Account page (`/konto`): subscription status, cancel/upgrade buttons, usage stats
- Auth-client.js: premium status in navbar (badge instead of just text)
- Fade-in animations, loading states for payment redirect

### Security

- No hardcoded `JWT_SECRET` default — fail at startup if env var missing
- `users.json` file locking for concurrent writes
- Stripe webhook signature verification (never trust unverified payloads)
- Rate limiting on auth endpoints

## Dependencies

- Stripe account with API keys
- `stripe` npm package (API)
- `openspec/specs/lehrenden-premium/spec.md` (existing — extend with payment details)

## Success Criteria

- Teacher can register → login → click "Premium upgraden" → Stripe Checkout → redirected back → sees "Premium" badge
- Premium features return 403 for free users
- Stripe webhook processes subscription events idempotently
- Pricing page loads under 1s
- All existing tests still pass
