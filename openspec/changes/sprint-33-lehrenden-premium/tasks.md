## 1. Stripe Webhook Integration

- [x] 1.1 Add `stripe.webhook.constructEvent()` endpoint in `api/server.js` at POST `/api/auth/stripe-webhook`
- [x] 1.2 Handle `checkout.session.completed` — set User.plan = 'premium', store subscriptionId, set active=true
- [x] 1.3 Handle `customer.subscription.updated` — sync plan changes (upgrade/downgrade)
- [x] 1.4 Handle `customer.subscription.deleted` — set User.plan = 'free', active=false
- [x] 1.5 Handle `invoice.payment_failed` — set User.plan = 'past_due', send email notification stub

## 2. Premium Gating Middleware

- [x] 2.1 Create `api/middleware/premium-required.js` — check `req.user.plan === 'premium'` from session, return 402 if not
- [x] 2.2 Remove hardcoded `config/premium-users.json` allowlist
- [ ] 2.3 Wire premium middleware to premium-gated calculators (molekuel-studio, perioden-system, titrations-simulator)
- [x] 2.4 Wire premium middleware to premium-gated API routes (GPT-4 chat, advanced analytics)

## 3. Subscription Management UI

- [x] 3.1 Create `/premium/verwaltung/` page — subscription status, cancel button, upgrade/downgrade link
- [x] 3.2 Add Stripe Customer Portal link for payment history/invoice management
- [x] 3.3 Add premium badge indicator on locked calculator cards in entity index and calculator listing
- [x] 3.4 Add locked overlay (blur + "Jetzt Premium aktivieren" CTA) on premium calculators for free users

## 4. Testing & Docs

- [ ] 4.1 Write webhook handler tests (stripe event fixture → DB state)
- [ ] 4.2 Write middleware tests (premium user → 200, free user → 402)
- [ ] 4.3 Document Stripe test mode setup in `.env.example` and local dev README
