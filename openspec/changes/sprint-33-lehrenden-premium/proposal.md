## Why

The Lehrenden-Premium feature (auth, Stripe payments, premium gating) was started to 8/10 tasks but never completed. Teachers can register but cannot subscribe, access premium calculators, or manage their plan. No Stripe webhooks handle subscription lifecycle (renewal, cancellation, failed payment). The premium gating exists in code but is not wired to real subscription state. This sprint ships the remaining 2 tasks and adds subscription management UI.

## What Changes

- **BREAKING**: Premium gating switches from hardcoded user list to Stripe subscription status
- Complete Stripe webhook integration (checkout.session.completed, customer.subscription.updated/deleted)
- Add subscription management page (/premium/verwaltung/) — cancel, upgrade, payment history
- Wire premium gating middleware to Stripe subscription lookup (via customer ID)
- Add premium badge/indicator on locked calculator pages
- Add Stripe test mode documentation for local dev

## Capabilities

### New Capabilities

(none — extends existing `lehrenden-premium`)

### Modified Capabilities

- `ai-assistant/spec.md`: Add premium-tier model access (GPT-4 vs free GPT-3.5)
- `calculators/spec.md`: Document which calculators are premium-gated

## Impact

- **Auth**: Lucia/JWT sessions remain unchanged
- **Payments**: Stripe webhooks required (needs production endpoint or Stripe CLI for local dev)
- **UX**: Non-subscribers see locked calculator overlay with upgrade CTA
