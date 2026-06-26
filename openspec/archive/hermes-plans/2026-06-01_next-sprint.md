# ⚠️ LEGACY — Archived 2026-06-26

This file is from the `.omo/`, `.opencode/`, `.hermes/`, or `.sisyphus/` planning directory used before the OpenSpec bootstrap. The contents reflect planning state at the time of the original work — they may be out of date.

**Where to look instead**:

- Main specs: `openspec/specs/<capability>/spec.md`
- Active changes: `openspec/changes/<change-name>/`
- Archived changes: `openspec/changes/archive/`

The source directories ($.omo, .opencode, .hermes, .sisyphus) are kept for historical reference but should not be used for new planning.

---

# Sprint: Plattform-Stabilität & Inhalts-Pflege

> **Ziel:** Infrastruktur reparieren, Dokumentation aktualisieren, bestehende Features aufpolieren — bevor neue Funktionen gebaut werden.
> **Stand:** Alle Phasen 1-11 sind implementiert (30+ interaktive Rechner + Gamification). Jetzt geht's um Qualität.

## Aktueller Zustand

| Bereich                                 | Status                                 |
| --------------------------------------- | -------------------------------------- |
| Phase 1-2: Druck, Fläche, Thermodynamik | ✅ Implementiert, getestet, in Nav     |
| Phase 3-6: Säuren/Redox/Wärmelehre      | ✅ Implementiert                       |
| Phase 7-10: Lernwerkzeuge, KI, PWA      | ✅ 18 Rechner committed                |
| Phase 11: Gamification                  | ✅ XP, Levels, 12 Achievements         |
| Hugo Build                              | ✅ 559 Seiten, 980ms                   |
| Dev Server                              | ✅ Port 1313, Watchdog alle 5min       |
| Unit Tests                              | ⚠️ 20/25 Suites pass (792/1220 Tests)  |
| Navigation                              | ⚠️ ~16 Rechner fehlen in Nav           |
| Roadmap-Doku                            | ❌ Zeigt Phase 1-2 als TODO            |
| Test-Skripte                            | ❌ `npm test` defekt (falsche Pfade)   |
| Kontakt-Link                            | ❌ Dead Link auf /pages/kontakt/       |
| Article Pipeline                        | ⏳ Konfiguriert, läuft aber noch nicht |

---

## P0 — Kritische Reparaturen

### 1. `npm test`-Befehlskette reparieren

**Problem:** `package.json`-Scripts referenzieren gelöschte Pfade (`myhugoapp/tests/accessibility/`, `myhugoapp/tests/javascript/` etc.).

**Lösung:** `npm run test` soll direkt `jest --forceExit` aufrufen (das existiert bereits als Script, ist aber nicht der Standard). Die alte Kette mit 11 Sub-Scripts kann entweder repariert oder durch `jest --forceExit` ersetzt werden.

**Dateien:**

- Modify: `package.json` (scripts.test)

**Aufwand:** ~10 Min

### 2. 19 fehlerhafte Tests in `interactive-experiments.test.js` fixen

**Problem:** Tests vermissen DOM-Elemente (`#temp-display`, `#pressure-display`, `#volume-display`), die in `beforeEach` nicht ins HTML eingefügt wurden. Das sind echte Test-Bugs, keine Runtime-Fehler.

**Lösung:** Display-Elemente in `document.body.innerHTML` ergänzen.

**Dateien:**

- Modify: `tests/interactive-experiments.test.js`

**Verifikation:** `npx jest tests/interactive-experiments.test.js` → 20/20 pass

**Aufwand:** ~15 Min

### 3. Dead Contact-Link in `unterstuetzen.md` fixen

**Problem:** Die Support-Seite verlinkt auf `/pages/kontakt/`, aber die Kontaktseite wurde entfernt (commit `3bc16d8b`).

**Lösung:** Link durch allgemeinen Hinweis ersetzen (z.B. GitHub-Issues) oder entfernen.

**Dateien:**

- Modify: `content/unterstuetzen.md`

**Aufwand:** ~5 Min

### 4. `roadmap.md` aktualisieren

**Problem:** Die Roadmap zeigt Phase 1-2 noch als "TODO", Phase 3 als teilweise implementiert, und erwähnt Phase 7-11 gar nicht. Enthält noch veraltete VR-Bezüge (PSE in VR wurde entfernt).

**Lösung:** Zwei Optionen:

- **A) Komplett-Update:** Roadmap als "abgeschlossen" markieren, neue Phase 12+ definieren
- **B) Kurzupdate:** Status-Tabelle aktualisieren, Phase 1-11 als erledigt markieren

Empfehlung: Option B als kurzen Fix, dann in P2 eine neue strategische Roadmap schreiben.

**Dateien:**

- Modify: `content/pages/roadmap.md`

**Aufwand:** 30 Min (B) - 2h (A)

### 5. `neueste-forschung.md` Gamification-Eintrag fixen

**Problem:** Gamification wird als "Geplant (Phase 11)" gelistet, ist aber bereits implementiert.

**Lösung:** Status auf "✅ Implementiert (Mai 2026)" ändern.

**Dateien:**

- Modify: `content/pages/neueste-forschung.md`

**Aufwand:** ~5 Min

---

## P1 — Polieren & Infrastruktur

### 6. Fehlende Rechner zur Navigation hinzufügen

**Problem:** ~16 Rechner existieren als Content+JS+Layouts, sind aber nicht im Hauptmenü "Interaktiv". Betroffen:

- pH-Rechner, Titrations-Simulator, Gasgesetz-Rechner, Verbrennungsrechner
- Löslichkeitsprodukt-Rechner, Redox-Potenzial-Rechner, Konzentrationsumrechner
- Atomenergieniveaus, Torricelli-Versuch, Wärmeleitung, Konvektion
- Temperatur-Teilchenbewegung, Molekülorbitale, Elektrochemie auf Teilchenebene
- Säuren-Basen-Gleichgewicht, PWA-Offline-Modus

**Risiko:** Das Menü hat bereits 26 Einträge unter "Interaktiv" — 16 weitere könnten zu lang sein. Alternativ:

- Untergruppen einführen (z.B. "Rechner", "Simulationen", "Visualisierungen")
- Oder Rechner nur über Themenbereiche verlinken lassen

**Entscheidungspunkt:** Wie navigieren User aktuell zu diesen Rechnern? Über die Themenseiten?

**Dateien:**

- Modify: `config.toml`

**Aufwand:** 30-60 Min (je nach Ansatz)

### 7. PWA Service Worker aktualisieren

**Problem:** `static/sw.js` existiert, aber es ist unklar ob es alle neuen Calculator-Routen cached.

**Lösung:** SW-Cache-Strategie prüfen, ggf. Precache-Liste erweitern.

**Dateien:**

- Inspect: `static/sw.js`
- Modify: ggf. `static/sw.js` oder `content/pwa-offline-modus.md`

**Aufwand:** ~30 Min

### 8. Testabdeckung für Phase 7-11 schreiben

**Problem:** Neue Features (Übungsgenerator, Lernpfad, Lückentexte, Fortschritt, Gamification etc.) haben keine Unit Tests.

**Lösung:** Für jedes neue Feature mindestens einen Grund-Test:

- Übungsgenerator: Aufgaben-Generierung, Schwierigkeitsgrade
- Gamification: XP-Berechnung, Level-Grenzen, Achievement-Bedingungen
- Fortschritts-Dashboard: IndexedDB-Read, Statistik-Aggregation

**Dateien:**

- Create: `tests/uebungsgenerator.test.js`
- Create: `tests/gamification-engine.test.js`
- Create: `tests/fortschritt-dashboard.test.js`

**Aufwand:** 1-2h

### 9. Playwright-basierte Test-Suites fixen

**Problem:** 4 Test-Suites (`accessibility-validation.test.js`, `site-accessibility-audit.test.js`, `complete-site-audit.test.js`, `mobile-responsiveness.test.js`) laufen gegen Produktion (`https://chemie-lernen.org`) und schlagen fehl, wenn diese nicht erreichbar ist.

**Lösung:** Entweder lokale Test-URL verwenden (localhost:1313) oder als Produktionstests kennzeichnen und aus Default-Suite ausschließen via `--testPathIgnorePatterns`.

**Dateien:**

- Modify: `jest.config.js` oder `package.json` test-Script

**Aufwand:** ~20 Min

---

## P2 — Nächste Features

### 10. Article Pipeline in Betrieb nehmen

**Problem:** Pipeline ist konfiguriert (6 RSS-Feeds, litellm-Summarisierung via `saia/qwen3.5-397b-a17b`), Systemd-Timer läuft täglich um 04:42 UTC. Aber es gibt noch keine automatisch generierten Posts.

**Lösung:**

- Pipeline manuell einmal ausführen: `node scripts/article-pipeline.mjs`
- Fehler logs prüfen (litellm-Auth?)
- Ersten generierten Post verifizieren
- Hugo-Build mit neuem Post testen
- ggf. Deploy auslösen

**Dateien:**

- Inspect: `scripts/article-pipeline.mjs`, `scripts/feeds.json`

**Aufwand:** ~30 Min

### 11. KI-Assistent End-to-End testen

**Lösung:** Seite `/ki-assistent/` aufrufen, Chat-Funktion testen, Antwortqualität prüfen.

**Aufwand:** ~15 Min

### 12. SEO-Review für neuere Seiten

**Problem:** Phasen 7-11-Seiten haben möglicherweise keine optimalen meta-descriptions, OG-Tags.

**Lösung:** Stichprobenartig 5-10 neue Seiten prüfen:

- title/description frontmatter vorhanden?
- Sinnvolle Keywords?
- OG-Tags via Hugo-Template?

**Aufwand:** ~30 Min

### 13. Broken-Link-Audit

**Lösung:** Alle internen Links auf 559 Seiten scannen.

**Befehl:**

```bash
cd myhugoapp && hugo --quiet
# dann interne Links prüfen (z.B. via htmlproofer oder eigenes Script)
```

**Aufwand:** ~30 Min

---

## Geschätzter Gesamtaufwand

| Priorität | Aufwand   | Beschreibung                  |
| --------- | --------- | ----------------------------- |
| P0        | ~1h       | Kritische Infrastruktur-Fixes |
| P1        | ~2-3h     | Polieren & Testabdeckung      |
| P2        | ~1-2h     | Betrieb & Qualität            |
| **Total** | **~4-6h** |                               |

## Nicht in diesem Sprint

- Neue interaktive Rechner (Phase 12) — erst nach Stabilisierung
- VR/AR-Features — PSE in VR wurde entfernt, Fokus auf Web
- Mehrsprachigkeit — Phase 10 evaluation, kein aktiver Build
- Multi-User-Features — komplex, später

## Empfehlung

**Reihenfolge:** P0 → P1 → P2. Beginne mit der Reparatur der Test-Infrastruktur und Dokumentation, dann Polieren, dann neue Features. Die Article Pipeline ist der größte Hebel für regelmäßige Content-Updates.

---

_Erstellt: 1. Juni 2026_
_Projekt: chemie-lernen.org — /home/weiss/git/hugo-chemie-lernen-org_
