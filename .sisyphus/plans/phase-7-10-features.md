# Feature Plan — Phase 7–10

**Status:** Draft | **Estimated total:** 60–100h
**Strategy:** Build independent features in parallel where possible, deploy immediately via timer.

---

## Phase 7 — Interaktive Lernwerkzeuge (~20–30h)

### 7.1 Übungsgenerator (HIGH)
- **What:** Dynamic chemistry exercise generator with difficulty levels, random parameters, instant feedback
- **Tech:** New JS module `practice-generator.js`, Hugo template `layouts/_default/uebungsgenerator.html`
- **Content types:** Stöchiometrie, Reaktionsgleichungen ausgleichen, Molare Massen, pH-Berechnungen, Redox-Gleichungen
- **Features:** Multiple choice + free input, difficulty slider, score tracking (localStorage), printable
- **Files:** ~6 new files (MD, HTML, JS, CSS, data/questions.json)
- **Est:** 6–10h
- **Reuse:** Existing `chemistry-utils.js` for molar mass/formula parsing

### 7.2 Lernpfad (MEDIUM)
- **What:** Guided learning paths through Themenbereiche with progress tracking
- **Tech:** Hugo template + JS state management, custom shortcodes
- **Content:** Curated sequences through existing Themenbereiche (e.g., "Säuren & Basen" path linking pH, Titration, Puffer)
- **Features:** Progress bar, "Next → Previous" navigation, completion badges
- **Files:** ~4 files (partials + JS)
- **Est:** 4–6h
- **Note:** Each path is a JSON config referencing existing content — no new chemistry content needed

### 7.3 Lückentexte (MEDIUM)
- **What:** Cloze deletion (fill-in-the-blank) exercises — drag-drop and type-in modes
- **Tech:** JS component `cloze-exercise.js`, reusable via shortcode in any .md
- **Features:** Auto-grading, hint system, multiple blanks per text, keyboard accessible
- **Files:** ~3 files (JS + CSS + shortcode)
- **Est:** 3–5h
- **Note:** Embeddable in existing content pages via Hugo shortcode

### 7.4 Fortschrittsspeicher (MEDIUM)
- **What:** Progress persistence across all interactive modules — single source of truth
- **Tech:** `progress-store.js` — IndexedDB wrapper with localStorage fallback
- **Integration:** All Phases 7+ tools call `ProgressStore.save()` / `ProgressStore.load()`
- **Features:** Cross-session persistence, export/import (JSON), optional dashboard view
- **Files:** ~2 files (JS core + UI component)
- **Est:** 3–5h
- **Dependency:** Foundation for 8.3 (Klassencockpit)

---

## Phase 8 — Lehrkräfte-Werkzeuge (~20–25h)

### 8.1 Arbeitsblatt-Generator (HIGH)
- **What:** Printable PDF-grade worksheets generated from parameterized templates
- **Tech:** JS + print CSS (window.print()), problem templates in data files
- **Features:** Choose topic → configure parameters → preview → print/save as PDF
- **Content:** 10+ worksheet templates (Stöchiometrie, Redox, Säuren-Basen, etc.)
- **Files:** ~8 files (JS template engine, data files, templates, CSS print)
- **Est:** 6–10h
- **Reuse:** Übungsgenerator question bank (7.1) shares problem templates

### 8.2 Aufgabensammlung (LOW)
- **What:** Searchable, filterable database of all exercises (search across all modules)
- **Tech:** JS index + Hugo taxonomy tags
- **Features:** Filter by Thema, Schwierigkeit, Typ, Klasse — full-text search
- **Files:** ~3 files (JS search + HTML layout + CSS)
- **Est:** 3–5h
- **Reuse:** Tags and taxonomies already exist (`schwierigkeit`, `teilgebiet`)

### 8.3 Klassencockpit (HIGH)
- **What:** Teacher dashboard for tracking student usage and exercise results
- **Tech:** localStorage → optional sync via WebDAV/NextCloud (future)
- **Features:** Student list, per-class progress view, exercise completion stats, printable reports
- **Files:** ~5 files (JS + HTML + CSS + data schema)
- **Est:** 6–8h
- **Dependency:** ProgressStore (7.4) must be live first
- **Privacy:** Fully local-first — no server data collection

---

## Phase 9 — Vertiefende Visualisierungen (~15–20h)

### 9.1 Gefahrstoffkennzeichnung (MEDIUM)
- **What:** Interactive GHS hazard pictograms + H/P phrases explorer
- **Tech:** SVG-based hazard symbols, filterable table
- **Features:** Click pictogram → see all matching substances, H/P phrase search with examples
- **Files:** ~4 files (JS + SVG + HTML + CSS + data/ghs.json)
- **Est:** 4–6h

### 9.2 Laborgeräte-Explorer (LOW)
- **What:** Virtual lab equipment explorer — clickable 3D-ish SVG with descriptions
- **Tech:** SVG illustrations (or Three.js for key items), tooltips, search
- **Features:** Browse by category (Glasgeräte, Messgeräte, Heizquellen), 360° view for key items
- **Files:** ~5 files (SVG assets + JS + HTML + CSS)
- **Est:** 4–6h

### 9.3 Spektroskopie-Simulator (HIGH)
- **What:** Interactive spectroscopy simulator — IR, NMR, Mass Spec visualization
- **Tech:** Canvas 2D charting (Chart.js), peak matching, molecule → spectrum correlation
- **Features:** Draw molecule → generate predicted spectrum, match unknown spectrum, peak assignment
- **Files:** ~6 files (JS core + spectrum data + HTML + CSS + MD)
- **Est:** 6–10h

---

## Phase 10 — Plattform-Reife (~10–15h)

### 10.1 KI-Assistent (HIGH)
- **What:** Chemistry Q&A assistant backed by the Neo4j Knowledge Graph
- **Tech:** Graphiti MCP query → LLM response → inline chatbot UI
- **Features:** Ask chemistry questions, get answers grounded in site content, citation links
- **Files:** ~5 files (chatbot UI JS + MCP integration + HTML + CSS)
- **Est:** 5–8h
- **Dependency:** Knowledge Graph pipeline (already running)

### 10.2 PWA / Offline-Modus (MEDIUM)
- **What:** Progressive Web App — service worker, offline cache, install prompt
- **Tech:** Workbox (sw.js), manifest.json
- **Features:** Offline access to calculators, install as app on mobile/desktop
- **Files:** ~3 files (sw.js + manifest.json + icon assets)
- **Est:** 3–5h
- **Note:** Hugo static site is already PWA-friendly — no framework changes needed

---

## Implementation Order (Recommended)

```
Phase 7 ─┬─ 7.1 Übungsgenerator ───── (highest impact, reuse later)
          ├─ 7.3 Lückentexte ───────── (independent, embeddable)
          ├─ 7.4 Fortschrittsspeicher ─ (dependency for 8.3)
          └─ 7.2 Lernpfad ──────────── (independent)

Phase 8 ─┬─ 8.1 Arbeitsblatt-Generator ─ (shares templates with 7.1)
          ├─ 8.3 Klassencockpit ──────── (depends on 7.4)
          └─ 8.2 Aufgabensammlung ────── (independent)

Phase 9 ─┬─ 9.1 Gefahrstoffkennzeichnung ─ (independent SVG work)
          ├─ 9.3 Spektroskopie-Simulator ── (independent)
          └─ 9.2 Laborgeräte-Explorer ──── (independent)

Phase 10 ─ 10.1 KI-Assistent ─ (uses existing KG)
         ─ 10.2 PWA ────────── (independent, wraps whole site)
```

**Parallel tracks:**
- `Track A` (interactive tools): 7.1 → 8.1 → 8.2
- `Track B` (progress/teacher): 7.4 → 7.3 → 8.3
- `Track C` (visualizations): 9.1 → 9.3 → 9.2
- `Track D` (platform): 10.1 + 10.2 (run anytime)

---

## Approval Checklist

- [ ] Phase order correct?
- [ ] Any feature to remove/add?
- [ ] Priority changes?
- [ ] Merge any phases?
