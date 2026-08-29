# Change Proposal: kg-curation-gate

## Why

Die Chemie-Forschung-Pipeline erzeugt Artikel aktuell mit `draft: false` und
pusht sie direkt auf `master` → automatischer Docker-Deploy. Es existiert
**kein menschlicher Review-Schritt** (Lücke S44.2 im Roadmap-Change
`roadmap-next-epics`). Das gefährdet die Vertrauenswürdigkeit des
Wissens-Hubs: fehlerhafte, unvollständige oder ungeprüfte KI-Artikel
erscheinen ohne Prüfung sofort live.

## What Changes

Einführung eines Review/Publish-Gates für KG-generierte Forschungsartikel:

- **Generator** (`chemierecherche-runner`, `src/lib/article-generator.ts`):
  neue Artikel werden mit `draft: true` **und** `review_status: draft`
  geschrieben. Hugo rendert Drafts in der Produktion nicht → Artikel
  bleiben unsichtbar, bis sie freigegeben werden.
- **Publish-Tool** (`scripts/curation/publish-article.mjs`, dieses Repo):
  prüft Qualitäts-Heuristiken (Mindestlänge, Pflichtfelder) und stellt bei
  Freigabe `review_status: published`, `draft: false`, `reviewer` und
  `review_date`.
- **Check-Tool** (`scripts/curation/check-reviewed.mjs`, dieses Repo):
  überwacht, dass keine `draft: false`-Artikel ohne `review_status: published`
  bzw. `reviewer` existieren (Safety-Net für den Deploy).
- **Backfill**: die bereits live geschalteten Artikel werden mit
  `review_status: published` + `reviewer`/`review_date` nachträglich
  versehen, damit das Schema konsistent bleibt.
- **Doku** (`docs/chemie-forschung-pipeline.md`): neues Kapitel
  „Curation Gate“.

## Impact

- Betrifft: `chemierecherche-runner` (Generator-Default), `hugo-chemie-lernen-org`
  (Publish/Check-Tools, Backfill, Doku).
- Neue Capability `chemie-forschung-curation`.
- Kein Breaking Change für lesende Komponenten (KI-Assistent, Graph, Suche).
- Artikel, die vor Inkrafttreten des Gates live waren, bleiben live
  (via Backfill).
