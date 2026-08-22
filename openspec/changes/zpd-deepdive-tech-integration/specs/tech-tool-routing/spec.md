# Spec: tech-tool-routing

**Capability:** ZPD-aware technology tool registry and resolver that maps
Bloom level + objective metadata to concrete interactive tools with launch
context
**Owners:** Sisyphus
**Status:** New — delta spec for `zpd-deepdive-tech-integration`

---

## Purpose

This capability provides the routing layer between the Bloom × ZPD adaptive
engine's `tool` strategy recommendation and the platform's existing interactive
tools (3D visualizations, calculators, KI-Assistent). Given an objective's
Bloom level and optional type tags, the resolver returns a concrete tool
recommendation with launch parameters so the frontend can open the right tool
contextually.

## ADDED Requirements

### Requirement: REQ-TTR-1 — Tool registry

The system SHALL maintain a **tool registry** that classifies each available
interactive tool by:

- `toolId` (string, kebab-case, e.g. `molekuel-studio`, `stoichiometry-calculator`,
  `ki-assistent`)
- `toolType` — one of `visualization`, `calculator`, `ai-assistant`
- `bloomRange` — array of `[min, max]` Bloom indices where the tool is
  educationally appropriate (inclusive)
- `objectiveTags` — array of objective-type tags the tool supports
  (e.g. `spatial`, `quantitative`, `conceptual`, `synthesis`)
- `launchUrl` — the relative URL path to launch the tool
- `description` — human-readable rationale for why the tool fits

The registry SHALL be a static JS object (no DB required) defined in
`api/services/tool-router.js` and exportable for testability.

#### Scenario: Registry covers all existing tool categories

- **WHEN** the tool registry is loaded
- **THEN** it contains entries for at least one `visualization`, one
  `calculator`, and one `ai-assistant` tool
- **AND** each entry has all required fields (`toolId`, `toolType`,
  `bloomRange`, `objectiveTags`, `launchUrl`, `description`)

#### Scenario: Bloom ranges are non-overlapping within a type preference

- **WHEN** multiple tools share the same `objectiveTags`
- **THEN** the resolver selects the tool with the highest `bloomRange` match
  for the given Bloom index, preferring higher-order tools at higher levels

### Requirement: REQ-TTR-2 — Tool resolver

The system SHALL expose a `resolveTool(bloomsIndex, objectiveTags?)` function
that returns the best-matching tool from the registry.

Selection algorithm:
1. Filter registry entries where `bloomsIndex ∈ bloomRange` AND
   (`objectiveTags` is empty/unset OR at least one tag overlaps with the
   entry's `objectiveTags`).
2. Rank by `toolType` preference: if `objectiveTags` includes `spatial`,
   prefer `visualization` > `calculator` > `ai-assistant`; if `quantitative`,
   prefer `calculator` > `visualization` > `ai-assistant`; otherwise
   `ai-assistant` > `visualization` > `calculator`.
3. Return the first match or `null` if no tool matches.

#### Scenario: Spatial objective at Bloom 2 resolves to 3D visualization

- **WHEN** `resolveTool(2, ['spatial'])` is called
- **THEN** it returns a tool with `toolType: 'visualization'`
- **AND** the returned tool's `bloomRange` includes `2`

#### Scenario: Quantitative objective at Bloom 4 resolves to calculator

- **WHEN** `resolveTool(4, ['quantitative'])` is called
- **THEN** it returns a tool with `toolType: 'calculator'`
- **AND** the returned tool's `bloomRange` includes `4`

#### Scenario: High Bloom with no specific tag resolves to AI assistant

- **WHEN** `resolveTool(6, [])` is called
- **THEN** it returns a tool with `toolType: 'ai-assistant'`
- **AND** the returned tool's `bloomRange` includes `6`

#### Scenario: No match returns null

- **WHEN** `resolveTool(1, ['quantitative'])` is called
- **THEN** it returns `null` (no calculator appropriate at Bloom 1)

### Requirement: REQ-TTR-3 — Tool recommendation in ZPD response

When the ZPD engine's `recommendedStrategy` is `tool`, the system SHALL
attach a `toolRecommendation` object to the ZPD response containing:

```json
{
  "toolId": "molekuel-studio",
  "toolType": "visualization",
  "launchUrl": "/molekuel-studio/",
  "rationale": "3D molecule viewer supports spatial understanding at Bloom 2"
}
```

#### Scenario: toolRecommendation present when strategy is tool

- **WHEN** the strategy activator selects `tool` for the next objective
- **AND** `resolveTool` returns a match
- **THEN** the ZPD response includes `toolRecommendation` with `toolId`,
  `toolType`, `launchUrl`, `rationale`

#### Scenario: Fallback when no tool matches

- **WHEN** the strategy activator selects `tool`
- **BUT** `resolveTool` returns `null`
- **THEN** `recommendedStrategy` falls back to `differentiate`
- **AND** `toolRecommendation` is omitted from the response

### Requirement: REQ-TTR-4 — Strategy activator enhancement

The `recommendedStrategy` activator in `zpd-engine.js` SHALL use the tool
router to determine the `tool` strategy condition concretely:

- **Old condition**: generic "spatial/visual objective & level allows"
- **New condition**: `resolveTool(bloomsIndex, objectiveTags)` returns a
  non-null result

#### Scenario: Tool strategy is only returned when resolver matches

- **WHEN** the next objective has Bloom index 3 and tag `spatial`
- **AND** a visualization tool covers `[2, 4]`
- **THEN** `recommendedStrategy` is `tool`
- **AND** `toolRecommendation` is populated

#### Scenario: Non-matching objective avoids tool strategy

- **WHEN** the next objective has Bloom index 1 and tag `quantitative`
- **AND** no calculator covers Bloom 1
- **THEN** `recommendedStrategy` is NOT `tool`

### Requirement: REQ-TTR-5 — Editorial tool-lookup endpoint

The system SHALL provide `GET /api/tools?objectiveSlug=<slug>&bloom=<level>`
(editorial, auth optional) that returns all tools matching the given
objective's Bloom level. This allows content editors to preview which tools
would be recommended without requiring a ZPD flow.

#### Scenario: Lookup returns matching tools

- **WHEN** `GET /api/tools?bloom=3&tags=spatial` is called
- **THEN** the response contains an array of matching tool entries

#### Scenario: Lookup with no matches returns empty array

- **WHEN** `GET /api/tools?bloom=1&tags=quantitative` is called
- **AND** no calculator covers Bloom 1
- **THEN** the response is `{ tools: [] }`
