# Tasks: zpd-deepdive-tech-integration

## 1. Tool registry

- [ ] 1.1 Create `api/services/tool-router.js`: define `TOOL_REGISTRY` array
      with entries for `molekuel-studio` (visualization, Bloom 2–4),
      `perioden-system` (visualization, Bloom 1–2), `stoichiometry-calculator`
      (calculator, Bloom 3–5), and `ki-assistent` (ai-assistant, Bloom 4–6).
      Each entry has `toolId`, `toolType`, `bloomRange`, `objectiveTags`,
      `launchUrl`, `description`.

## 2. Tool resolver

- [ ] 2.1 Implement `resolveTool(bloomsIndex, objectiveTags?)` in
      `api/services/tool-router.js`: filter by bloomRange, match tags,
      rank by type-affinity (spatial→viz, quantitative→calc, else→ai),
      return `{ toolId, toolType, launchUrl, rationale }` or `null`.
- [ ] 2.2 Implement `getAllTools(bloomsIndex?, tags?)` for the editorial
      endpoint: returns all matching entries (or full registry if no filters).

## 3. Strategy activator enhancement

- [ ] 3.1 Import `resolveTool` into `api/services/zpd-engine.js`. Update
      `recommendedStrategy()` to call `resolveTool(bloomsIndex, tags)` when
      the objective is spatial/visual. If resolver returns a match, set
      `recommendedStrategy: 'tool'` and attach `toolRecommendation`. If null,
      fall back to existing strategy selection (typically `differentiate`).
- [ ] 3.2 Ensure `recommendedStrategy()` accepts optional `objectiveTags`
      parameter (passed from route).

## 4. API routes

- [ ] 4.1 Update `GET /api/learning-paths/:slug/next` in
      `api/routes/learning-paths.js`: pass `objectiveTags` (inferred from
      subtopic context or from the objective node's properties) to the
      engine. Include `toolRecommendation` in the response when present.
- [ ] 4.2 Create `api/routes/tools.js`: `GET /api/tools` with optional query
      params `?bloom=<level>&tags=<csv>` calling `getAllTools()`. Auth
      optional (editorial use). Returns `{ tools: [...] }`.
- [ ] 4.3 Register `api/routes/tools.js` in the Express app (server.js or
      route index).

## 5. Tests

- [ ] 5.1 `tests/tool-router.test.mjs`: pure-function unit tests for
      `resolveTool` — spatial at Bloom 2 → visualization, quantitative at
      Bloom 4 → calculator, Bloom 6 no tags → ai-assistant, no match → null.
      Also test `getAllTools` filtering. DB-free (mock nothing needed).
- [ ] 5.2 `tests/zpd-engine-tool-strategy.test.mjs`: test that
      `recommendedStrategy()` returns `'tool'` with `toolRecommendation`
      when resolver matches, and falls back to `'differentiate'` when it
      doesn't. Mock `resolveTool` to control match/no-match cases.

## 6. Spec sync

- [ ] 6.1 Validate: `npx openspec validate zpd-deepdive-tech-integration`
      passes cleanly.
