# ⚠️ LEGACY — Archived 2026-06-26

This file is from the `.omo/`, `.opencode/`, `.hermes/`, or `.sisyphus/` planning directory used before the OpenSpec bootstrap. The contents reflect planning state at the time of the original work — they may be out of date.

**Where to look instead**:

- Main specs: `openspec/specs/<capability>/spec.md`
- Active changes: `openspec/changes/<change-name>/`
- Archived changes: `openspec/changes/archive/`

The source directories ($.omo, .opencode, .hermes, .sisyphus) are kept for historical reference but should not be used for new planning.

---

# entity-4-steps - Work Plan

## TL;DR (For humans)

**Was Sie bekommen:**

1. **Modernisierte Entitäts-Detailseite** — Jeder Fachbegriff (`/entity/{slug}/`) zeigt jetzt ein modernes Kartenlayout mit Kategorie-Farben, verwandten Begriffen, Quellen/Literaturhinweisen und direkten Links zu allen verknüpften Artikeln. Dieselbe Optik wie die vorhandene Wissensnetz-Übersicht.
2. **Article-Redirect** — `/article/wasserstoffproduktion/` leitet automatisch auf den richtigen Artikel unter `/themenbereiche/.../` weiter.
3. **Graph-Redirect** — `/entity/graph/` leitet auf den bereits existierenden interaktiven Wissensnetz-Graph unter `/wissennetz/` weiter.
4. **KG-Export verifiziert** — Der `/api/kg-data`-Endpunkt liefert zuverlässig Daten aus Neo4j.

**Warum dieser Ansatz:** Client-seitiges Rendering (fetch /api/kg-data + DOM-Manipulation) statt statischer Hugo-Templates — weil die Entitätsdaten in Neo4j leben und sich ständig ändern. Für Redirects nutzen wir Hugo-eigene `aliases`, die bei jedem Build statische Weiterleitungsseiten generieren — kein nginx-Eingriff nötig.

**Was es NICHT tun wird:** Kein Neubau des D3-Graphen (existiert bereits). Keine Änderungen an bestehenden Komponenten (entity-index, curricula-index). Keine neuen npm-Pakete.

**Aufwand:** Medium (4 parallele Tasks, ~4h)
**Risiko:** Niedrig — alle Schritte isoliert, bestehende Funktionalität bleibt unberührt
**Entscheidungen:** Client-Side-Rendering für Entity-Detail, Hugo aliases für Redirects

---

> TL;DR (machine): 4 unabhängige Tasks parallel — Entity-Detail-Frontend (JS-SPA, fetch API -> render), Article-Redirect (Frontmatter-Aliases-Script), Graph-Redirect (ein alias), KG-Export-Verifikation (curl). ~4h, Low Risk.

## Scope

### Must have

1. `entity/single.html`: Rewrite mit fetch(/api/kg-data) + client-seitigem Rendering, Kategorie-Farben, Card-Design, Dark Mode, verwandte Begriffe, Artikellinks
2. Article-Redirect: Build-Script `scripts/add-article-aliases.mjs` fügt `aliases: [/article/{slug}/]` zu allen Artikel-Frontmatter-Einträgen hinzu
3. Graph-Redirect: `content/entity/graph.md` bekommt `aliases: [/wissennetz/]`
4. KG-Export: curl-Test gegen `/api/kg-data`, optionale JSDoc-Kommentare in server.js

### Must NOT have (guardrails, anti-slop, scope boundaries)

- Kein Neubau des D3-Graphen
- Keine neuen npm-Abhängigkeiten
- Keine Änderungen an `entity-index.js`, `curricula-index.js`, `ki-assistent.js`
- Keine Datenbank- oder Neo4j-Änderungen
- Kein Rewrite der Express API

## Verification strategy

> Zero human intervention - all verification is agent-executed.

- Test decision: none (JS-SPA ohne Test-Setup für Browser-UI; alle Änderungen visuell verifizierbar via Hugo build)
- Evidence: `node --check` für JS, Hugo build exit 0, curl für API

## Execution strategy

### Parallel execution waves

Wave 1: Alle 4 Tasks parallel (keine Abhängigkeiten untereinander)
Wave 2: Hugo Build + Verifikation

### Dependency matrix

| Todo                  | Depends on | Blocks | Can parallelize with |
| --------------------- | ---------- | ------ | -------------------- |
| 1 Entity Frontend     | —          | —      | 2,3,4                |
| 2 Article Aliases     | —          | —      | 1,3,4                |
| 3 Graph Redirect      | —          | —      | 1,2,4                |
| 4 KG Export           | —          | —      | 1,2,3                |
| 5 Hugo Build + Verify | 1,2,3,4    | —      | —                    |

## Todos

> Implementation + Test = ONE todo. Never separate.

<!-- APPEND TASK BATCHES BELOW THIS LINE WITH edit/apply_patch - never rewrite the headers above. -->

- [ ] 1. Entity-Detail-Frontend: `entity/single.html` Rewrite als Client-Side SPA
     What to do / Must NOT do: Ersetze das Bootstrap-3-Panel-Template mit einer modernen Vanilla-JS-SPA. Die Seite fetch()t `/api/kg-data`, findet die passende Entity per slug (aus URL), und rendert: Kategorie-Badge mit Farbe, verwandte Begriffe (gruppiert in didaktik/KMK, quelle, andere), Artikellinks als Liste, Statistik. Design-System von `entity-index.js` übernehmen (CSS-Variablen, Kategorie-Farben, Dark Mode via prefers-color-scheme, Skeleton-Loading). Must NOT: Keine neuen Abhängigkeiten, kein jQuery, kein Rewrite von entity-index.js.
     Parallelization: Wave 1 | Blocked by: — | Blocks: 5
     References: `myhugoapp/layouts/entity/single.html` (aktuell, zu ersetzen), `myhugoapp/static/js/entity-index.js` (Design-Pattern, catColors, fetch-API), `myhugoapp/layouts/_default/curricula-index.html` (CSS-Variablen, Dark Mode, Skeleton), `myhugoapp/content/entity/science/_index.md` (Beispiel-Entity-Frontmatter), `api/server.js:1351` (/api/kg-data API), `config.toml:27` (custom_css custom_js)
     Acceptance criteria: `node --check myhugoapp/layouts/entity/single.html` (ist HTML, kein JS-Check nötig); Hugo build exit 0; die Seite `/entity/wasser/` zeigt Kategorie-Farbe, Artikellinks, verwandte Begriffe
     QA (happy): Hugo build + `curl http://localhost:1313/entity/wasser/` enthält `.entity-detail-container` + Kategorie-Badge + Artikellinks
     QA (failure): Hugo build schlägt fehl bei Syntax-Fehler → `node --check` auf eingebettetes JS; API nicht erreichbar → Skeleton bleibt sichtbar + Fehlermeldung
     Commit: Y | `feat(entity): rewrite entity/single.html as client-side SPA with live API data`

- [ ] 2. Article-Redirect: Build-Script für Hugo aliases
     What to do / Must NOT do: Schreibe `scripts/add-article-aliases.mjs`. Es liest alle `.md` Dateien unter `myhugoapp/content/themenbereiche/`, parst das YAML-Frontmatter, und fügt `aliases: [/article/{filename}/]` hinzu (filename ohne .md). Nur für Dateien die noch keinen alias haben. Must NOT: Keine Änderung an Dateien außerhalb von `content/themenbereiche/`, keine doppelten aliases, kein Löschen bestehender aliases.
     Parallelization: Wave 1 | Blocked by: — | Blocks: 5
     References: `myhugoapp/content/themenbereiche/` (alle Artikel), `myhugoapp/config.toml` (Hugo baseURL, kein vorhandener alias-Mechanismus), `nginx-pwa-config.conf:48` (try_files $uri $uri/ /index.html)
     Acceptance criteria: Script läuft ohne Fehler; `grep -r "aliases:" myhugoapp/content/themenbereiche/ | head -3` zeigt die neuen aliases; `node --check scripts/add-article-aliases.mjs` exit 0
     QA (happy): Script ausführen → `grep "aliases:" myhugoapp/content/themenbereiche/` findet Einträge; Hugo build exit 0; `ls public/article/` enthält Ordner
     QA (failure): Script auf leeres Dir → gibt 0 hinzugefügt aus, keine Fehler; doppelter alias → überspringt
     Commit: Y | `feat(routing): add article redirect script with Hugo aliases`

- [ ] 3. Graph-Redirect: Hugo alias in graph.md
     What to do / Must NOT do: Füge `aliases: [/wissennetz/]` zum Frontmatter von `myhugoapp/content/entity/graph.md` hinzu. Entferne `layout: entity-graph` (Template existiert nicht). Must NOT: Keine Änderung an anderen Dateien.
     Parallelization: Wave 1 | Blocked by: — | Blocks: 5
     References: `myhugoapp/content/entity/graph.md` (aktuelles Frontmatter), `myhugoapp/content/wissennetz.md` (existierender D3-Graph)
     Acceptance criteria: `grep -A5 "aliases" myhugoapp/content/entity/graph.md` zeigt `aliases: [/wissennetz/]`; Hugo build exit 0
     QA (happy): Hugo build; `curl http://localhost:1313/entity/graph/` → 200 (Redirect-Seite) oder folgt Redirect zu /wissennetz/
     QA (failure): Hugo build schlägt fehl → falsches YAML-Format → korrigieren
     Commit: Y | `feat(routing): redirect /entity/graph/ to /wissennetz/ via Hugo alias`

- [ ] 4. KG-Export-API: Verifikation + Doku
     What to do / Must NOT do: Führe `curl` gegen `/api/kg-data` aus (lokaler Neo4j oder fallback). Prüfe Response-Format (source, articles, entities, loadTime). Füge bei Bedarf JSDoc-Kommentare in `api/server.js` hinzu. Must NOT: Keine Änderung der API-Logik oder -Daten.
     Parallelization: Wave 1 | Blocked by: — | Blocks: 5
     References: `api/server.js:1346-1519` (komplette kg-data Route), `myhugoapp/static/js/entity-index.js:26` (API-Consumer), `myhugoapp/static/js/curricula-index.js` (API-Consumer), `myhugoapp/static/js/ki-assistent.js` (API-Consumer), `docker-compose.yml:48` (Traefik-Route)
     Acceptance criteria: `curl -s http://localhost:3001/api/kg-data | node -e "process.stdin.resume(); let d=''; process.stdin.on('data',c=>d+=c); process.stdin.on('end',()=>{const j=JSON.parse(d); console.log('source:', j.source, 'entities:', j.entities.length, 'articles:', j.articles.length)})"` läuft ohne Fehler
     QA (happy): API läuft → response mit source=neo4j, entities>0, articles>0
     QA (failure): Neo4j down → fallback source, entities>0 (aus embedded data)
     Commit: N (nur Doku, kein Code-Change nötig wenn Response OK)

- [ ] 5. Hugo Build + Gesamtverifikation
     What to do / Must NOT do: Baue das Hugo-Projekt. Prüfe Exit-Code 0. Überprüfe dass `/entity/wasser/`, `/article/` und `/entity/graph/` korrekt generiert wurden. Must NOT: Keine Änderungen.
     Parallelization: Wave 2 | Blocked by: 1,2,3 | Blocks: —
     References: `myhugoapp/config.toml` (Hugo config), `/opt/git/hugo-chemie-lernen-org/AGENTS.md` (Build-Befehl: `hugo server -D` im myhugoapp-Verzeichnis)
     Acceptance criteria: `docker run --rm -v $(pwd)/myhugoapp:/src klakegg/hugo:0.145.0-ext --destination=/src/public` oder `hugo` lokal exit 0
     QA (happy): Hugo build exit 0; `ls public/entity/wasser/index.html` existiert; `ls public/article/` hat redirect pages
     QA (failure): Build-Fehler → fixe Syntax/Config-Fehler
     Commit: N | (commits erfolgen pro Task 1-3)

## Final verification wave

> Runs in parallel after ALL todos. ALL must APPROVE. Surface results and wait for the user's explicit okay before declaring complete.

- [ ] F1. Plan compliance audit — alle 4 Steps durchgeführt? Hugo build OK?
- [ ] F2. Code quality review — JS-Syntax check, keine Regression
- [ ] F3. Real manual QA — `/entity/wasser/` aufrufbar und korrekt? `/article/` redirects?
- [ ] F4. Scope fidelity — keine unerwünschten Änderungen (entity-index.js etc.)

## Commit strategy

- Task 1: `feat(entity): rewrite entity/single.html as client-side SPA with live API data`
- Task 2: `feat(routing): add article redirect script with Hugo aliases`
- Task 3: `feat(routing): redirect /entity/graph/ to /wissennetz/ via Hugo alias`
- Task 4: kein Commit (nur Verifikation)
- Task 5: kein Commit (nur Build-Test)

## Success criteria

1. ✅ `/entity/{slug}/` zeigt moderne Kartenansicht mit Kategorie-Farbe, Artikellinks, Relationen
2. ✅ `/article/{slug}` leitet auf `/themenbereiche/{topic}/{slug}/` weiter
3. ✅ `/entity/graph/` leitet auf `/wissennetz/` (existierender D3-Graph) weiter
4. ✅ `/api/kg-data` liefert valides JSON mit entities + articles

## Final verification wave

> Runs in parallel after ALL todos. ALL must APPROVE. Surface results and wait for the user's explicit okay before declaring complete.

- [ ] F1. Plan compliance audit
- [ ] F2. Code quality review
- [ ] F3. Real manual QA
- [ ] F4. Scope fidelity

## Commit strategy

## Success criteria
