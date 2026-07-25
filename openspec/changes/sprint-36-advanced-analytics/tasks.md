## 1. auth-db.js Aggregation Helpers

- [x] 1.1 Add `getAllUsersDetailed()` — returns all users with gamification + quiz_results (no password/stripe fields)
- [x] 1.2 Add `getClassOverview()` — total students, active this week, avg xp, avg streak, avg level, top/weakest topic
- [x] 1.3 Add `getClassTopicBreakdown()` — quiz results grouped by topic with avg score, attempt count, unique students
- [x] 1.4 Add `getEngagementTimeline(weeks)` — weekly active users from xpLog timestamps (last N weeks)
- [x] 1.5 Write unit tests for all 4 helpers (tests/teacher-analytics.test.js — mock users data)

## 2. Analytics API Routes

- [x] 2.1 Create `api/routes/analytics.js` — Router with requirePremium middleware
- [x] 2.2 Implement GET `/api/analytics/class-overview` — calls getClassOverview()
- [x] 2.3 Implement GET `/api/analytics/students` — pagination (sort, order, limit, offset, search)
- [x] 2.4 Implement GET `/api/analytics/topic-breakdown` — calls getClassTopicBreakdown()
- [x] 2.5 Implement GET `/api/analytics/export` — format=csv, returns text/csv with proper headers
- [x] 2.6 Implement GET `/api/analytics/engagement-timeline` — calls getEngagementTimeline()
- [x] 2.7 Mount router in `api/server.js` behind requirePremium
- [x] 2.8 Write API unit tests (mock auth-db, test pagination/sorting/filtering)

## 3. Premium Analytics Dashboard Page

- [x] 3.1 Create `myhugoapp/content/premium/analytics.md` — layout: premium-analytics
- [x] 3.2 Create `myhugoapp/layouts/_default/premium-analytics.html` — dashboard layout with 4 sections (overview cards, engagement chart, student table, topic breakdown)
- [x] 3.3 Create `myhugoapp/static/js/premium-analytics.js` — fetch all 5 endpoints, render dashboard, sort/search table, CSV export button, sparkline SVG for engagement timeline
- [x] 3.4 Create `myhugoapp/static/css/premium-analytics.css` — responsive dashboard styles, progress bars, card grid, mobile card collapse for student table
- [x] 3.5 Wire lazy-loader to load premium-analytics.js only on /premium/analytics/ (handled by Hugo template-per-page pattern — script only in premium-analytics.html layout)

## 4. Documentation & Cleanup

- [x] 4.1 Update SPECS_INDEX with new sprint-36 entry
- [x] 4.2 Add inline JSDoc to all new API endpoint handlers
- [x] 4.3 Add analytics route to API README or docs
