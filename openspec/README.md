# OpenSpec — chemie-lernen.org

This directory holds the formal specification set for chemie-lernen.org.
It is the source of truth for **what the system is and what changes are
planned or shipped**.

## Structure

```
openspec/
├── config.yaml             # spec-driven config (rules for proposals/specs/design)
├── README.md               # this file
├── specs/                  # main capabilities (one folder per capability)
│   ├── entity-knowledge-graph/
│   ├── ai-assistant/
│   ├── a11y-compliance/
│   └── wissensnetz-graph/
├── changes/                # active and archived change proposals
│   ├── archive/            # completed + archived changes
│   └── <change-name>/      # one folder per active change (proposal.md, design.md, tasks.md, specs/)
└── archive/                # legacy planning artifacts from .omo/, .opencode/, .hermes/, .sisyphus/
    ├── omo-drafts/
    ├── omo-plans/
    ├── opencode-plans/
    ├── hermes-plans/
    └── sisyphus-plans/
```

## Workflow

1. **Spec-driven**: every capability has a main spec under `specs/<capability>/spec.md`
   with `## Purpose`, `## Requirements`, and `## Scenarios` (Given/When/Then).
2. **Change-driven**: every code change (sprint, fix, refactor) goes through
   `openspec/changes/<name>/` with `proposal.md`, `tasks.md`, and (if
   requirements change) `specs/` deltas.
3. **Archive on completion**: when a change is shipped and verified, run
   `openspec archive <name>` to move it under `changes/archive/`. This keeps
   the active change set small.

## Conventions

- **Capability name** = singular noun, kebab-case (e.g. `entity-knowledge-graph`).
- **Change name** = `<sprint-id>-<short-name>` (e.g. `sprint-7-wcag-a11y`).
- **Spec scenarios** = `### Given/When/Then` headings.
- **Status**: proposal, design, tasks, done, archived.
- **No new files in `specs/` without a change in `changes/`** — specs are
  updated via deltas in the change folder, then merged on archive.

## Where planning used to live

Before this restructure, planning artifacts were scattered across:

- `.omo/drafts/*.md` — 6 draft templates
- `.omo/plans/*.md` — 8 work plans
- `.omo/specs/sprint-f-wissensnetz-ssr.md` — the only formal spec
- `.opencode/plans/*.md` — 3 actual sprint plans (including 7 and 8)
- `.hermes/plans/` and `.sisyphus/plans/` — empty in this repo

All of these are now archived under `openspec/archive/<source>/<name>.md`
with a marker comment at the top pointing to the equivalent OpenSpec
artifact (or "deprecated — see openspec/changes/archive/" if the work
was redone under a different change).

The Hubs deploy plan (`.opencode/plans/2026-06-26-hubs-deploy.md`) is
**kept** as a working doc because the Hubs work is mid-flight and the
OpenSpec system is for the chemie-lernen.org main app, not the
hubs-compose stack.
