## Context

The Lehrenden-Premium codebase (8/10 tasks complete) has: Lucia auth with GitHub/Google OAuth, Stripe Checkout session creation, a User table with `stripeCustomerId` and `plan` columns, premium-gated API routes. Missing: Stripe webhook handler, subscription management UI, plan-change email notifications, and the remaining 2 tasks. The existing gating uses a hardcoded allowlist (`config/premium-users.json`) — this must switch to Stripe subscription lookup.

## Goals / Non-Goals

**Goals:**

- Stripe webhook endpoint: handle `checkout.session.completed`, `customer.subscription.*`, `invoice.payment_failed`
- Premium gating: check Stripe subscription status via customer ID (not hardcoded list)
- Subscription management page: cancel, upgrade/downgrade, view payment history
- Premium badges on calculator listing and entity detail pages
- Stripe CLI / test mode setup documented in `.env.example`

**Non-Goals:**

- Team/org subscriptions (single user only)
- Proration calculations (Stripe default proration is fine)
- Premium analytics dashboard

## Decisions

| Decision                                             | Rationale                                                                  |
| ---------------------------------------------------- | -------------------------------------------------------------------------- |
| **Stripe webhooks processed in api/server.js**       | Single Express app; no need for separate webhook worker                    |
| **Webhook secret via STRIPE_WEBHOOK_SECRET env var** | Required for signature verification in production                          |
| **Subscription status cached in User.plan column**   | Avoid Stripe API call on every page load; plan updated by webhook          |
| **Gating middleware: premium-required.js**           | Reads `user.plan` from session DB; if null/expired → redirect to /premium/ |
| **Subscription UI as static HTML + Alpine.js**       | No React/Vue dependency; matches existing site architecture                |

## Risks / Trade-offs

- [Webhook delivery fail] → Stripe retries up to 3 times over 3 days; manual reconcile via Stripe dashboard
- [Stale plan cache] → User might see premium badge for 1-2s after cancellation; acceptable UX trade-off
- [No Stripe CLI locally] → Use Stripe dashboard test events or `stripe trigger` command
- [Credit card required] → Some teachers may not have corporate cards; consider Invoice payment method later
