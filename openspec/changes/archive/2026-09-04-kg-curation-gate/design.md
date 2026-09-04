# Design: kg-curation-gate

## Frontmatter-Schema (neu)

Jeder Chemie-Forschung-Artikel trägt künftig:

```yaml
---
title: '...'
description: '...'
date: 2026-08-18
last_reviewed: 2026-08-18
tags:
  - entity
  - chemie
review_status: draft # draft | published
reviewer: '' # wird bei Freigabe gefüllt
review_date: '' # wird bei Freigabe gefüllt
draft: true # Hugo: nicht im Produktions-Build gerendert
---
```

`draft: true` ist das zentrale Safety-Net: `hugo` schließt Drafts im
Produktions-Build (`npm run build` → `hugo --minify`) aus. Ein Artikel
wird also erst sichtbar, wenn ein Mensch `draft: false` setzt.

## Generator-Änderung (chemierecherche-runner)

In `src/lib/article-generator.ts` (Frontmatter-Block in `saveArticle`):

- `draft: false` → `draft: true`
- Ergänze `review_status: draft`, `reviewer: ""`, `review_date: ""`
  (Reihenfolge: nach `tags`, vor `draft`).

## Publish-Tool (scripts/curation/publish-article.mjs)

Aufruf: `node scripts/curation/publish-article.mjs <pfad>`

1. Liest die Datei, parst Frontmatter (einfaches YAML-freies Key-Value).
2. Heuristiken (Abbruch bei Fehler):
   - `review_status === "draft"`
   - Body-Mindestlänge (z. B. ≥ 800 Zeichen)
   - Pflichtfelder vorhanden (`title`, `description`, `date`, `tags`)
   - kein Platzhalter-Text (kein „Lorem“, keine „TODO“)
3. Setzt `review_status: published`, `draft: false`,
   `reviewer: <git user.name oder --reviewer>`, `review_date: <heute>`.
4. Schreibt die Datei zurück und committed sie (`git add` + `commit`).

## Check-Tool (scripts/curation/check-reviewed.mjs)

Aufruf: `node scripts/curation/check-reviewed.mjs`

- Iteriert über `myhugoapp/content/chemie-forschung/*.md`.
- Meldet (exit 1) jeden Artikel mit `draft: false`, der
  `review_status !== "published"` oder keinen `reviewer` hat.
- Gibt zusätzlich die Liste offener Drafts aus (Info).
- Kann als CI-Schritt vor dem Deploy eingehängt werden.

## Backfill

Einmalig: alle bestehenden Artikel mit `draft: false` erhalten
`review_status: published`, `reviewer: "auto-import"`,
`review_date: <ihr date>`. Damit bleiben sie live und das Schema ist
konsistent.

## Doku

`docs/chemie-forschung-pipeline.md` erhält ein Kapitel „Curation Gate“,
das den Draft-Default und den Publish-Befehl beschreibt.
