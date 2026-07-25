# API Documentation

Base URL: `https://chemie-lernen.org`

## Authentication

All `/api/*` routes run through `authMiddleware` (populates `req.user` from JWT cookie/header). Protected routes additionally use `requireAuth` middleware (returns 401 if no valid JWT).

Auth uses httpOnly cookies by default; `Authorization: Bearer <token>` also supported.

---

## Auth

### `POST /api/auth/register`

Create a new user account.

**Body:**

```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response 201:**

```json
{
  "token": "jwt...",
  "user": { "email": "user@example.com", "plan": "free" }
}
```

### `POST /api/auth/login`

Authenticate and receive JWT.

**Body:**

```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response 200:**

```json
{
  "token": "jwt...",
  "user": { "email": "user@example.com", "plan": "free" }
}
```

### `POST /api/auth/logout`

Clear auth cookie.

**Response 200:** `{ "message": "Logged out" }`

### `GET /api/auth/me`

Get current user info (no auth required — returns `{ user: null }` if not logged in).

**Response 200 (logged in):**

```json
{
  "user": {
    "email": "user@example.com",
    "plan": "free",
    "learning_profile": {
      "learning_level": "advanced",
      "interests": ["Organische Chemie"],
      "preferred_explanation_style": "visual"
    }
  }
}
```

### `GET /api/auth/profile`

Get full learning profile (requires auth).

**Response 200:**

```json
{
  "learning_profile": { "learning_level": "advanced", ... },
  "weak_areas": ["Säure-Base", "Redox"]
}
```

### `PUT /api/auth/profile`

Update learning profile (requires auth).

**Body:**

```json
{
  "learning_level": "beginner",
  "interests": ["Anorganische Chemie"],
  "preferred_explanation_style": "text"
}
```

**Response 200:** `{ "learning_profile": { ... }, "message": "Profile updated" }`

### `POST /api/auth/create-checkout-session`

Create Stripe checkout for premium upgrade (requires auth).

**Response 200:**

```json
{ "url": "https://checkout.stripe.com/..." }
```

### `POST /api/auth/upgrade`

Handle Stripe webhook (called by Stripe, not browsers).

---

## Chat

### `POST /api/chat`

Send a message to the AI tutor.

**Body:**

```json
{
  "message": "Was ist die molare Masse von Wasser?",
  "conversationId": "optional-session-id"
}
```

**Response:** Server-Sent Events (streaming).

### `GET /api/chat/history`

List past chat sessions (requires auth).

**Query params:** `?limit=10`

### `GET /api/chat/history/:sessionId`

Retrieve full conversation for a session (requires auth).

### `POST /api/chat/feedback`

Rate a chat response (requires auth).

**Body:**

```json
{
  "messageId": "msg-uuid",
  "rating": "up",
  "sessionId": "session-uuid"
}
```

### `GET /api/chat/feedback/analytics`

Get feedback summary (requires auth).

---

## Knowledge Graph

### `GET /api/kg-data`

Query Neo4j knowledge graph.

**Query params:** `?labels=Entity&limit=50&offset=0`

### `GET /api/kg-stats`

Get KG statistics (node/relationship counts by label).

### `GET /api/kg-data/entity/:name`

Get a specific entity from the KG.

### `GET /api/entity/:slug`

Get entity with relationships (rich response).

**Response:** Entity data + linked curricula, articles, universities.

### `GET /entity/:slug`

Same as above, shorter path (no `/api` prefix).

### `GET /api/rag-context`

Get RAG context for a topic.

**Query params:** `?topic=...+&userLevel=beginner&interests=...`

---

## Content

### `GET /api/article/:slug`

Get article content by slug.

### `GET /api/content`

Search content.

**Query params:** `?q=...&type=article&limit=10`

---

## Curriculum (Lehrplan)

### `GET /api/curricula/states`

List all German states (Bundesländer) with available curricula.

### `GET /api/curricula/topics`

List all curriculum topics.

### `GET /api/curricula/objectives`

List all learning objectives.

### `GET /api/curricula/by-state/:state`

Get curricula for a state (e.g., `bayern`).

### `GET /api/curricula/by-state/:state/grade/:grade`

Get curricula for a state + grade.

### `GET /api/curricula/topic/:slug/articles`

Get articles linked to a topic.

### `GET /api/curricula/objective/:slug/articles`

Get articles linked to a learning objective.

### `GET /api/curricula/compare`

Compare two curricula.

**Query params:** `?s1=bayern&g1=10&s2=nrw&g2=10`

### `GET /api/entities/:name/curricula`

Get curricula linked to an entity.

### `GET /api/curricula/linked-entities`

Get entities linked to a curriculum node.

---

## Didaktik

### `GET /api/didaktik`

Get didactic guidelines.

**Query params:** `?topic=...`

---

## Modulhandbuch (University)

### `GET /api/modulhandbuch/universities`

List all universities in the database.

### `GET /api/modulhandbuch/university/:shortCode`

Get university details.

### `GET /api/modulhandbuch/module/:univCode/:moduleCode`

Get module details.

### `GET /api/modulhandbuch/search`

Search modules.

**Query params:** `?q=...`

### `GET /api/modulhandbuch/teaches/:entityName`

Get modules that teach a specific entity.

### `GET /api/entities/:name/universities`

Get universities linked to an entity.

---

## Studienvergleich

### `GET /api/studienvergleich/compare`

Compare two degree programs.

**Query params:** `?u1=university-a&p1=program-a&u2=university-b&p2=program-b`

---

## Quiz

### `GET /api/quizzes/:topic`

Get quiz questions for a topic.

**Topics:** `alle`, `Allgemeine Chemie`, `Anorganische Chemie`, `Organische Chemie`, `Physikalische Chemie`, `Biochemie`, `Analytische Chemie`, `Säure-Base`, `Redox`

**Response:** `{ "topic": "...", "total": N, "questions": [...] }`

### `PUT /api/quiz-results`

Save quiz results (requires auth).

**Body:**

```json
{
  "topic": "Allgemeine Chemie",
  "score": 8,
  "total": 10,
  "answers": [...]
}
```

### `GET /api/quiz-results`

Get user's quiz history (requires auth).

---

## Session

### `GET /api/session`

Get or create a session.

**Response:** `{ "sessionId": "uuid", "created": "ISO date" }`

---

## Admin

### `GET /api/admin/chat-logs`

View recent chat logs (admin only).

---

## Health

### `GET /api/health`

Server health check.

**Response:**

```json
{
  "status": "ok",
  "neo4j": "connected",
  "litellm": "connected"
}
```

---

## Teacher Analytics (Premium)

All analytics endpoints require a valid JWT from a premium user.
Returns `402` for free users, `401` for unauthenticated requests.

### `GET /api/analytics/class-overview`

Aggregate class statistics: total students, active this week, average XP/streak/level, top and weakest topics, 12-week engagement timeline.

### `GET /api/analytics/students`

Paginated, sortable, searchable student list.

| Param  | Type   | Default | Description                                              |
| ------ | ------ | ------- | -------------------------------------------------------- |
| sort   | string | `xp`    | Field: xp, name, level, streak, avgQuizScore, lastActive |
| order  | string | `desc`  | `asc` or `desc`                                          |
| limit  | number | 50      | 1–200                                                    |
| offset | number | 0       | Page offset                                              |
| search | string |         | Name substring filter (case-insensitive)                 |

### `GET /api/analytics/topic-breakdown`

Class-wide quiz performance per topic. Identifies weak areas (average score < 60%).

### `GET /api/analytics/export?format=csv`

Downloads all student progress as CSV (BOM for Excel compatibility).
Columns: Name, E-Mail, XP, Level, Streak, Quiz-Anzahl, Quiz-Durchschnitt, Letzte Aktivität.

### `GET /api/analytics/engagement-timeline?weeks=12`

Weekly active user counts for the last N weeks (max 52). Based on xpLog timestamps.
