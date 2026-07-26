# Design: Advanced Analytics Dashboard

## Architecture

```
┌─────────────────────┐     requirePremium      ┌──────────────────┐
│  /premium/analytics  │ ───────────────────────► │  /api/analytics  │
│  (Hugo page)          │                          │  (Express routes) │
│  premium-analytics.js │                          │                  │
└─────────────────────┘                          └───────┬──────────┘
                                                         │
                                                         ▼
                                                 ┌──────────────────┐
                                                 │  auth-db.js       │
                                                 │  users.json       │
                                                 │  (existing store) │
                                                 └──────────────────┘
```

## Data Model (no schema changes)

All data already exists in `users[].gamification` and `users[].quiz_results`:

```js
user.gamification = {
  xp, level, streak, lastCheckin,
  badges: [], completedObjectives: [],
  xpLog: [{ amount, source, action, timestamp }],
  checkinHistory: [date strings]
}
user.quiz_results = [{
  topic, score, total, percentage,
  answers: [], time, completedAt
}]
```

## API Endpoints (all requirePremium)

### GET /api/analytics/class-overview

Returns aggregate stats for all users:

```json
{
  "totalStudents": 42,
  "activeThisWeek": 28,
  "avgXp": 1250,
  "avgStreak": 4.2,
  "avgLevel": 3.1,
  "topTopic": "saeuren-basen",
  "weakestTopic": "elektrochemie",
  "weeklyActiveUsers": [
    { "week": "2026-W29", "count": 28 },
    { "week": "2026-W28", "count": 25 }
  ]
}
```

### GET /api/analytics/students?sort=xp&order=desc&limit=50&offset=0

Paginated student list with individual stats:

```json
{
  "students": [
    {
      "id": 1,
      "name": "Max Mustermann",
      "email": "max@example.de",
      "xp": 3200,
      "level": 6,
      "streak": 12,
      "lastActive": "2026-07-25T10:00:00Z",
      "quizCount": 15,
      "avgQuizScore": 78.5,
      "completedObjectives": 12,
      "topicsExplored": ["saeuren-basen", "analytik"]
    }
  ],
  "total": 42,
  "limit": 50,
  "offset": 0
}
```

Query params: `sort` (xp|name|level|streak|avgQuizScore|lastActive), `order` (asc|desc), `limit` (1-200), `offset`, `search` (name substring)

### GET /api/analytics/topic-breakdown

Class-wide quiz performance per topic:

```json
{
  "topics": [
    { "topic": "saeuren-basen", "avgScore": 82, "attempts": 45, "students": 18 },
    { "topic": "elektrochemie", "avgScore": 54, "attempts": 22, "students": 10 }
  ],
  "weakAreas": ["elektrochemie", "organische-stoffklassen"]
}
```

### GET /api/analytics/export?format=csv

CSV download of all student progress data (name, email, xp, level, streak, quiz count, avg score, last active).

### GET /api/analytics/engagement-timeline?weeks=12

Weekly active users for the last N weeks (based on checkin history, quiz results, xp log).

## Frontend Components

### Dashboard Layout (`premium-analytics.html`)

```
┌────────────────────────────────────────────────────┐
│  📊 Analytics Dashboard    [Export CSV] [Date Range]│
├──────────┬──────────┬──────────┬───────────────────┤
│ Students │ Active   │ Avg XP   │ Avg Streak        │
│   42     │  28/week │  1,250   │  4.2 days         │
├──────────┴──────────┴──────────┴───────────────────┤
│  📈 Weekly Active Users (12-week chart)             │
│  ▁▂▃▃▄▅▅▆▇▇█                                      │
├────────────────────────────────────────────────────┤
│  🧑‍🎓 Student Table (sortable, searchable)           │
│  Name    XP    Level  Streak  Quiz Avg  Last Active │
│  Max M.  3200  6      12d     78.5%    Today       │
│  Anna K. 2100  4      8d      82.1%    Yesterday   │
│  ...                                                │
├────────────────────────────────────────────────────┤
│  📚 Topic Performance Breakdown                    │
│  Säuren-Basen      ████████░░ 82%  (45 attempts)   │
│  Elektrochemie      █████░░░░░ 54%  (22 attempts) ⚠️│
│  Organik            ███████░░░ 71%  (38 attempts)   │
└────────────────────────────────────────────────────┘
```

### Technology Choices

- **No chart library** — progress bars and sparklines via pure CSS/SVG (keeps bundle small)
- **Vanilla JS** — consistent with project conventions (no framework)
- **CSV export** — client-side generation from JSON response (no server-side file I/O)
- **Responsive** — table collapses to card view on mobile

## auth-db.js Additions

Four new exported functions (read-only, no mutations):

1. `getAllUsersDetailed()` — returns all users with gamification + quiz data (no PII filtering for premium teacher view)
2. `getClassOverview()` — aggregate stats computed from all users
3. `getClassTopicBreakdown()` — quiz results grouped by topic
4. `getEngagementTimeline(weeks)` — weekly active user counts from xpLog/checkinHistory timestamps

## Security

- All endpoints gated by `requirePremium` middleware (existing)
- CSV export only accessible to premium users (same auth)
- No student PII exposed to non-premium users
- Rate limited to 60 req/min per user (standard middleware)
