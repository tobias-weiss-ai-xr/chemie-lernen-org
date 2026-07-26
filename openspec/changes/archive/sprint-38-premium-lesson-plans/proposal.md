# Sprint 38: Premium Lesson Plan Suite

## Why

Sprint 36 gave teachers an analytics dashboard. But premium has no **content creation tools** yet. Teachers need ready-to-use lesson plans tied to the KG curriculum data — this is the core value proposition for a chemistry teacher subscription.

The LiteLLM proxy (gemma-4) is already running and accessible from the API. The KG has 680+ curriculum nodes (learning objectives, topics, sub-topics). This sprint connects them.

## What Changes

1. **API endpoint** `POST /api/premium/lesson-plan` — accepts topic, grade, duration, difficulty; returns structured lesson plan via LLM augmented with KG context
2. **Lesson plan page** at `/premium/lehrplaene/` — form to configure lesson parameters, renders the plan, export to PDF
3. **Worksheet generator** — `POST /api/premium/worksheet` — generates a printable worksheet (exercises, fill-in-the-blank, calculations) for a given topic

## Capabilities

### New

- `lesson-plans` — AI-assisted lesson plan generation with KG context

### Modified

- `ai-assistant` — reuses LiteLLM proxy for structured output

## Impact

**New files:**

- `api/routes/premium-content.js` — lesson plan + worksheet endpoints
- `myhugoapp/content/premium/lehrplaene.md` — lesson plan generator page
- `myhugoapp/layouts/_default/premium-lehrplaene.html` — lesson plan UI
- `myhugoapp/static/js/premium-lehrplaene.js` — form + rendering + PDF export
- `myhugoapp/static/css/premium-lehrplaene.css` — lesson plan styles
- `tests/lesson-plan.test.js` — unit tests for prompt building + output parsing

**Modified files:**

- `api/server.js` — mount premium-content router

**Dependencies:** LiteLLM proxy, Neo4j KG

**Rollback:** Remove route and content page; no data modified.
