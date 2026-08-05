# Knowledge Graph — Nachhaltige Verbesserungs-Roadmap

**Datum:** 2026-08-05
**DB:** chemie-kg (`bolt://chemie-kg:7687`), die von der API verwendete Datenbank
**Basis:** Audit vom 2026-08-05 (586 Chemie-Entities: konzept 253, stoff 132,
reaktion 100, methode 53, person 41, quelle 7)

---

## Aktueller Qualitätszustand (Audit 2026-08-05)

| Dimension                                          | Wert                       | Bewertung                                 |
| -------------------------------------------------- | -------------------------- | ----------------------------------------- |
| Entities mit Verknüpfungen                         | 585/586 (99,8%)            | ✅ (nach Enrichment 2026-08-05)           |
| Entity-Entity-Links                                | 2.448                      | ✅ deutlich verbessert                    |
| **Duplikate (Case-Varianten)**                     | **82 Nodes in 41 Gruppen** | ❌ Alkohole/alkohole, Enthalpie/enthalpie |
| **Descriptions**                                   | **5/586 (0,9%)**           | ❌ fast keine                             |
| **Tags**                                           | **0/586**                  | ❌ keine                                  |
| Synonyms/Formeln/Molmasse                          | 0/586                      | ❌ keine                                  |
| Curriculum-Links (FULFILLS_OBJECTIVE/COVERS_TOPIC) | 160/586 (27%)              | ⚠️ person/quelle: 0                       |
| Artikel-Links (Document/Content-MENTIONS)          | 195/586 (33%)              | ⚠️ viele ohne                             |
| Content-Nodes mit Text                             | 0/90                       | ❌ Artikel ohne Textkörper                |

**Grundbefund:** Die 586 Kern-Entities haben nur 4 Properties (`name`,
`kategorie`, `created`, `lastMentioned`). Die Datenbasis ist funktional
(Verknüpfungen, Curricula) aber inhaltlich dünn (keine Beschreibungen, Tags,
Formeln). Nachhaltige Verbesserung = **Datenqualität + Content-Dichte +
automatisierte Prozesse**, nicht weitere einmalige Verknüpfungs-Skripte.

---

## Säule 1 — Datenqualität (Duplikate & Konsistenz) ⚡ höchste Priorität

**Problem:** 82 doppelte Entity-Nodes in 41 Gruppen, nur durch Groß/Klein-
Schreibung unterschieden (Alkohole/alkohole, Enthalpie/enthalpie). Auch
führende Leerzeichen (" Calvin-Zyklus") und inkonsistente Schreibweisen.

**Maßnahmen:**

1. `scripts/merge-duplicate-entities.mjs` (NEU):
   - Findet Gruppen via `toLower(trim(name))`
   - Merged: Kanten (RELATED_TO, AEHNLICH_ZU, FULFILLS_OBJECTIVE, COVERS_TOPIC,
     MENTIONS) der Duplikate auf den kanonischen Node umhängen (mit MERGE, kein
     DETACH DELETE — die Kanten werden re-created, Nodes bleiben bis Verifikation)
   - Kanonische Schreibweise: die mit der höchsten Kantenzahl / existierendem
     Curriculum-Link
   - **Sicherheitsregel:** Nur Entities der Chemie-Subset-Kategorien; vor jedem
     Merge Backup-Dump (siehe `scripts/backup-chemie-kg.sh`)
2. Namens-Konsistenz-Fix im Enrichment-Skript (führende Leerzeichen trimmen)
3. Prettier-artiger "Namens-Lint" im CI: `scripts/kg-quality-audit.mjs` meldet
   neue Duplikate (bricht CI nicht, warnt nur)

## Säule 2 — Content-Anreicherung (Descriptions) ⚡ hoher Nutzen

**Problem:** Nur 5/586 Entities haben eine Description. Ohne Beschreibungen
sind Entity-Seiten und der KI-Assistent (RAG) informationsarm.

**Maßnahmen:**

1. **Description-Quellen priorisiert:**
   - a) `Content`-Nodes: 90 Artikel/Rechner (auch ohne Text, aber mit Titeln/URLs)
     → Entities per MENTIONS/Name-Matching mit Article-Summary anreichern
   - b) `LearningObjective`-Texte (21.478, über FULFILLS_OBJECTIVE verknüpft):
     aus den 3-5 passendsten Lernziel-Texten eine Description generieren
   - c) `Topic`-Titel (1.479) + SubTopic-Titel (2.088) für Kontext
   - d) Manuell kuratiertes Glossar (chemie-spezifisch) als Fallback
2. `scripts/enrich-entity-properties.mjs` (NEU): aggregiert Description/Tags/
   Synonyms aus den Quellen, schreibt per MERGE auf die Entity
3. **Tags einführen:** kategorie-basiert (Stoff/Konzept/Reaktion/…) + lehrplan-
   basiert (aus COVERS_TOPIC-Zuordnung) → ermöglicht spätere Facetten-Filter

## Säule 3 — Curriculum-Verknüpfung vertiefen ⚡ hoher didaktischer Nutzen

**Problem:** Nur 160/586 Entities an Lernziele/Themen gekoppelt; person/quelle 0. Der didaktische Wert (welche Klasse, welches Bundesland, welches Lernziel)
fehlt für die meisten Begriffe.

**Maßnahmen:**

1. `FULFILLS_OBJECTIVE`-Brücke nutzen: Entity → (bereits verknüpftes Lernziel) →
   Topic → Curriculum → **state/grade/school_type automatisch ableiten** und auf
   die Entity schreiben (derzeit nur 5 mit state/grade)
2. Für unverknüpfte Entities: Namens-Matching gegen SubTopic-Titel
   (2.088 vorhanden) — z.B. "Elektrolyse" ↔ SubTopic "Elektrochemie"
3. `scripts/link-entities-to-curricula.mjs` erweitern (existiert schon):
   zusätzlich LearningObjective-Text-Matching (Beschreibungs-Vokabular)

## Säule 4 — Artikel & Inhalte anbinden ⚡ Verbesserung des RAG

**Problem:** Nur 195/586 Entities haben Artikel-Links; 90 Content-Nodes haben
keine Texte. Der KI-Assistent (RAG über kg-data) hat wenig Kontext.

**Maßnahmen:**

1. `scripts/link-articles-to-entities.mjs` (NEU): MENTIONS aus Content-Titeln +
   URL-Slugs ableiten (z.B. `/themenbereiche/analytische-methoden/nachweisreaktionen/`
   → Entity "Nachweisreaktionen")
2. Article-Pipeline (`scripts/article-pipeline.mjs` existiert): beim Import
   automatisch Entity-Mentions extrahieren (Name-Matching gegen 586 Entities)
3. Langfristig: Artikel-Text in `Content.text` speichern (Hugo-Markdown-Quelle),
   damit RAG echte Inhalte nutzt

## Säule 5 — Prozess-Nachhaltigkeit ⚡ sichert alles ab

**Problem:** Enrichment ist aktuell manuell (Skripte per `docker exec`).
Ohne Automatisierung degeneriert der Graph erneut.

**Maßnahmen:**

1. **`scripts/kg-quality-audit.mjs`** (NEU): zentrales Audit mit Exit-Codes
   - meldet: isolierte Entities, Duplikate, fehlende Descriptions, fehlende
     Curriculum-Links, fehlende Artikel-Links, leere Content-Nodes
   - `--fail-on <schwelle>` für CI
2. **CI-Integration** (`.github/workflows/kg-quality.yml`): täglicher Lauf
   gegen chemie-kg, Bericht als Issue/PR-Kommentar — verhindert Regression
3. **Backup-Pflicht vor Mutation:** `scripts/backup-chemie-kg.sh` in alle
   Schreib-Skripte einbinden (der Timer `chemie-kg-backup` existiert bereits,
   täglich 00:45)
4. **Enrichment-Skripte idempotent halten** (MERGE statt CREATE, dry-run-Modus):
   bereits erfüllt in `enrich-isolated-entities.mjs` — als Vorbild für neue
5. **Dokumentation:** diese Roadmap + Ausführungsreihenfolge in AGENTS.md
   verankern

---

## Empfohlene Umsetzungsreihenfolge

| Schritt | Maßnahme                                   | Aufwand      | Nutzen                            |
| ------- | ------------------------------------------ | ------------ | --------------------------------- |
| 1       | Duplikat-Merge (Säule 1)                   | 1 Session    | ⭐⭐⭐ Beseitigt 82 kaputte Nodes |
| 2       | Description-Anreicherung (Säule 2)         | 1-2 Sessions | ⭐⭐⭐ RAG + Entity-Seiten        |
| 3       | Curriculum-Ableitung state/grade (Säule 3) | 1 Session    | ⭐⭐ Didaktischer Filter          |
| 4       | Artikel-Linking (Säule 4)                  | 1 Session    | ⭐⭐ RAG-Kontext                  |
| 5       | Audit-Skript + CI (Säule 5)                | 1 Session    | ⭐⭐⭐ Nachhaltigkeit             |

## Rollback & Sicherheit

- **Kein DETACH DELETE / kein `DELETE d`** (Blacklist im AGENTS.md — führte zu
  22.979 verlorenen Dokumenten)
- Vor jeder Mutation: `scripts/backup-chemie-kg.sh` oder `docker exec chemie-kg
cypher-shell ... "CALL admin.export.database"`-äquivalenter Dump
- Merge-Skripte arbeiten mit MERGE + verifizieren vor dem Löschen der alten
  Nodes (erst Kanten umhängen, dann isolierte alte Node per gezieltem Match
  entfernen — NIE unspezifisch)
- Alle Queries scopen auf Chemie-Subset (kategorie-Filter), nie global
