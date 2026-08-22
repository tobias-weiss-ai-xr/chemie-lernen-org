# zpd-deepdive-differentiation

**R4 Differentiation (per-learner path variants + Bloom depth)**

This is one of the five ZPD deep dive changes (R1–R5) that consume and extend the Bloom × ZPD adaptive engine from the parent change `bloom-zpd-adaptive-engine`.

## Overview

Implements **per-learner Bloom target depth** — the core differentiation strategy that allows different learners to progress to different cognitive levels within the same curriculum. This enables true adaptive differentiation where:

- Some learners work towards **apply** (Bloom level 3)
- Others progress to **analyze** (Bloom level 4) or **evaluate** (Bloom level 5)
- Advanced learners reach **create** (Bloom level 6)

The engine filters the next-objective-in-ZPD query to respect each learner's target, ensuring they are never routed to objectives beyond their configured cognitive ceiling.

## Artifacts

| File | Purpose |
| ---- | ------- |
| `proposal.md` | Why this change exists and what it modifies |
| `design.md` | Detailed technical design and API contracts |
| `tasks.md` | Implementation checklist |
| `specs/zpd-engine/spec.md` | Delta spec for ZPD engine extensions |
| `specs/learning-paths/spec.md` | Delta spec for learning paths with Bloom filtering |
| `specs/gamification/spec.md` | Delta spec for user profile Bloom target |

## Validation

Run the acceptance gate:
```bash
npx openspec validate zpd-deepdive-differentiation
```

## Parent Change

- `bloom-zpd-adaptive-engine` — the unified learner-state model and ZPD computation

## Related Changes (Roadmap)

- **R1** — Formative assessment unification
- **R2** — Scaffolding engine  
- **R3** — Peer collaboration
- **R4** — Differentiation (this change)
- **R5** — Technology tool integration
