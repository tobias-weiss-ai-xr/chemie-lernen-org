# Architecture

## Overview

chemie-lernen.org is a chemistry education website serving ~1,200 articles, interactive calculators, 3D visualizations, quizzes, and an AI tutor. Built on Hugo static site generation with a Node.js/Express API layer, Neo4j knowledge graph, and AI-powered chat.

## Technology Stack

```
Layer               | Technology
--------------------|------------------------------------------
Static Site         | Hugo (Go templates), ~1,200 Markdown articles
Theme               | hugo-cards (custom)
Frontend JS         | Vanilla JS (no framework), Three.js for 3D
API Server          | Node.js 22, Express 4, ES modules
Database            | Neo4j 5 (knowledge graph, ~700k nodes)
AI Backend          | LiteLLM proxy → Gemma 4 (local LLM)
Auth                | JWT (jsonwebtoken), bcrypt, httpOnly cookies
Container           | Docker, docker-compose
Orchestration       | Traefik reverse proxy (Let's Encrypt TLS)
CRM (external)      | leads-app (separate service, /api/* catch-all)
```

## Deployment Architecture

```
Internet
   │
   ▼
Traefik (TLS termination, Let's Encrypt, Docker-aware routing)
   │
   ├── Host(chemie-lernen.org)
   │   └── hugo-chemie-lernen-org (nginx, port 80)
   │       ├── / → static files (HTML, JS, CSS, images)
   │       ├── /js/quiz-questions.js → browser quiz data
   │       ├── /api/kg-data → proxy to chemie-chat-api:3001
   │       └── /api/ (catch-all) → proxy to leads-app:3001
   │
   ├── Host(chemie-lernen.org) + PathPrefix(/api/auth, /api/chat, ...)
   │   └── chemie-chat-api (Express, port 3001, priority 100)
   │       ├── /api/auth/* → authRouter (JWT, register, login, profile)
   │       ├── /api/chat → chat handler (LiteLLM)
   │       ├── /api/chat/history → session store
   │       ├── /api/chat/feedback → rating store
   │       ├── /api/quizzes/:topic → quiz questions (JSON)
   │       ├── /api/quiz-results → SM2 persistence
   │       ├── /api/kg-data, /api/kg-stats → Neo4j graph queries
   │       ├── /api/curricul*, /api/content, /api/didaktik → curriculum data
   │       ├── /api/modulhandbuch/* → university module data
   │       ├── /api/entity/:slug, /api/article/:slug → content retrieval
   │       ├── /api/session → FileBackedSessionStore
   │       ├── /api/studienvergleich/compare → degree comparison
   │       ├── /api/rag-context → context assembly for LLM
   │       └── /api/admin/chat-logs → admin tooling
   │
   ├── chemie-kg (Node.js, port 7687 → Neo4j)
   │   └── Neo4j Browser / GraphQL (kg.chemie-lernen.org)
   │
   ├── chemie-neo4j (Neo4j 5, port 7687)
   │   └── Centrale Wissenbank (700k+ nodes)
   │
   ├── chemie-logs (port 9090 → logs dashboard)
   └── litellm-proxy (port 4000)
       └── Gemma 4 (local LLM)
```

## Data Flow

### Static Page Request

```
Browser → Traefik → hugo-nginx → serves /themenbereiche/index.html
                                  (JS loads calculators, quizzes, 3D via lazy-loader)
```

### Chat Request (authenticated)

```
Browser → POST /api/chat
  → Traefik (Priority 100, PathPrefix match)
  → chemie-chat-api
  → authMiddleware (JWT verification)
  → Chat handler:
      1. Build system prompt with user's learning profile
      2. Fetch RAG context from Neo4j (boosted by user interests)
      3. Send to LiteLLM → Gemma 4
      4. Stream response back to browser
      5. Save to FileBackedSessionStore
```

### Quiz Request

```
Browser → GET /api/quizzes/alle
  → Traefik → chemie-chat-api
  → Read /app/data/quiz-questions.json
  → Filter by topic → return JSON
```

## Project Structure

```
myhugoapp/                     # Hugo site source
├── content/                   # Markdown articles (~1,200)
│   ├── themenbereiche/        # 12 subject areas
│   ├── klassenstufen/         # Grade-level organization
│   ├── *.md                   # Calculator/tool landing pages
│   └── pages/                 # About, roadmap, contact
├── layouts/
│   └── _default/              # Hugo templates (one per page type)
├── static/
│   └── js/
│       ├── calculators/       # 20+ calculator modules
│       ├── visualization/     # Three.js, periodic table, orbital viewer
│       ├── utils/             # chemistry-utils.js, i18n, lazy-loader
│       ├── quiz-engine.js     # Client-side quiz engine
│       ├── sm2.js             # Spaced repetition (SM-2)
│       ├── auth-client.js     # JWT auth on frontend
│       └── quiz-questions.js  # 30 German quiz questions (IIFE)
├── themes/
│   └── hugo-cards/            # Custom theme
├── api/                       # Express API server
│   ├── server.js              # Main server (~4100 lines)
│   ├── auth.js                # JWT auth, profile, Stripe
│   ├── auth-db.js             # File-based user store
│   ├── data/                  # Runtime data files
│   │   └── quiz-questions.json
│   └── Dockerfile
├── tests/                     # Jest + Playwright
├── docs/                      # Documentation
├── openspec/                  # OpenSpec specs & changes
└── docker-compose.yml         # Full deployment
```
