# Spec: learning-paths

**Capability:** Structured curriculum-aligned learning paths with enrollment,
progress tracking, completion certificates, and ZPD-aware next-step routing
**Owners:** Sisyphus

---

## MODIFIED Requirements

### Requirement: LP-ZPD-2 — Strategy activator hook SHALL use tool router

The strategy activator SHALL determine the `tool` strategy condition
using the tool router (see `tech-tool-routing` spec) rather than a generic
heuristic:

- `recommendedStrategy` MUST be set to `tool` when `resolveTool(bloomsIndex,
  objectiveTags)` returns a non-null tool match.
- When `tool` matches, the response SHALL include a `toolRecommendation`
  object with `{ toolId, toolType, launchUrl, rationale }`.
- When `tool` does not match (resolver returns `null`), the activator SHALL
  fall back to the next applicable strategy (typically `differentiate`).

#### Scenario: Tool strategy reflects resolver match

- **WHEN** the next objective has Bloom index 3 with `spatial` tag
- **AND** the tool resolver finds a visualization matching `[2, 4]`
- **THEN** `recommendedStrategy` is `tool`
- **AND** `toolRecommendation.toolType` is `visualization`

#### Scenario: Tool recommendation in next endpoint

- **WHEN** an enrolled user calls `GET /api/learning-paths/:slug/next`
- **AND** the recommended strategy is `tool`
- **THEN** the response includes `toolRecommendation` with `toolId`,
  `toolType`, `launchUrl`, and `rationale`

### Requirement: LP-ZPD-4 — Next field SHALL include toolRecommendation

The `nextInZPD` object SHALL include a `toolRecommendation` sub-object
when the strategy is `tool`. The response MUST contain
`nextInZPD.toolRecommendation.toolId` and
`nextInZPD.toolRecommendation.launchUrl` in this case.

#### Scenario: Authenticated detail includes toolRecommendation

- **WHEN** an enrolled user fetches path detail
- **AND** the next-in-ZPD strategy is `tool`
- **THEN** the response contains `nextInZPD.toolRecommendation.toolId` and
  `nextInZPD.toolRecommendation.launchUrl`
