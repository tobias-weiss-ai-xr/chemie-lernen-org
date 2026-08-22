# Sprint 36: Advanced Analytics Dashboard

## Why

Sprint 33 wired Stripe webhooks, premium gating, and subscription management UI — the payment infrastructure is complete. But premium users (teachers) have **nothing to pay for yet**. The existing `analytics-dashboard.js` and `fortschritt-dashboard.js` are client-side only — they track local storage progress for individual students. Teachers need:

- Class-wide visibility: which students are active, struggling, or excelling
- Exportable progress data for grading systems (CSV)
- Per-topic breakdowns to identify class-wide weak areas
- Aggregated engagement metrics (time spent, quiz scores, streaks)

Without this, the Premium tier has no value proposition.

## What Changes

Build a **teacher analytics dashboard** at `/premium/analytics/` with server-side endpoints that aggregate per-user data from `auth-db.js`. This is gated behind the existing `requirePremium` middleware.

The dashboard provides:

1. **Class Overview** — total students, active this week, avg XP, avg streak
2. **Per-Student Table** — sortable by name, XP, level, quiz accuracy, streak, last active
3. **Topic Breakdown** — class-wide quiz scores per topic, weak areas highlighted
4. **Export** — CSV export of all student progress data
5. **Engagement Timeline** — weekly active users chart (last 12 weeks)

All data comes from the existing `users.json` store — no new database needed. The API adds aggregation endpoints that only premium users can access.

## Capabilities

### Modified

- `gamification` — adds teacher-facing aggregation queries to auth-db.js
- `analytics-dashboard` — adds teacher dashboard page and JS

### New

- `teacher-analytics` — premium-gated analytics API + dashboard page

## Impact

**New files:**

- `api/routes/analytics.js` — premium-gated analytics endpoints
- `myhugoapp/content/premium/analytics.md` — dashboard content page
- `myhugoapp/layouts/_default/premium-analytics.html` — dashboard template
- `myhugoapp/static/js/premium-analytics.js` — dashboard client JS
- `myhugoapp/static/css/premium-analytics.css` — dashboard styles
- `tests/teacher-analytics.test.js` — unit + integration tests

**Modified files:**

- `api/auth-db.js` — add aggregation helpers (getClassStats, getClassTopicBreakdown, getStudentList)
- `api/server.js` — mount analytics router (premium-gated)

**Dependencies:** None (pure JS, existing auth-db store)

**Rollback:** Remove analytics route and content page; no data modified.
