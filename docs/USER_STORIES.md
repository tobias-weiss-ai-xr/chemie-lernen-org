# User Stories — Test-Backlog (chemie-lernen.org)

Umfangreiches Test-Backlog für manuelle und automatisierte Tests. Jede Story
folgt dem Format _„Als <Rolle> möchte ich <Funktion>, damit <Nutzen>.“_ plus
Akzeptanzkriterien / Test-Schritten.

Legend: 🔧 = Unit (Jest) · 🖥️ = E2E (Playwright) · ♿ = Accessibility ·
📱 = Mobile · 🔒 = Security · 🚀 = Deploy/Infra

---

## 1. Allgemeine Seite & Navigation

- **US-001 🖥️ Navigation Hauptmenü** — Als Besucher möchte ich über die Top-Nav
  alle Themenbereiche erreichen, damit ich zügig zum gewünschten Inhalt komme.
  - Alle Hauptlinks laden mit HTTP 200 und korrektem `<title>`.
  - Aktiver Menüpunkt ist visuell hervorgehoben.
- **US-002 🖥️ Footer-Links** — Als Nutzer möchte ich im Footer Impressum,
  Datenschutz, Kontakt und Roadmap finden.
  - Alle Footer-Links sind klickbar und führen auf existierende Seiten (kein 404).
- **US-003 🖥️ Breadcrumb** — Als Nutzer möchte ich meinen Pfad innerhalb der
  Themenbereiche sehen.
  - Breadcrumb zeigt die Hierarchie korrekt an und alle Glieder sind Links.
- **US-004 🖥️ Suche (Header)** — Als Schüler möchte ich Stichworte suchen.
  - Sucheingabe öffnet Ergebnisseite; Treffer enthalten Titel + Snippet.
  - Leere Suche zeigt Hinweis, kein Crash.
- **US-005 🖥️ 404-Seite** — Als Nutzer möchte ich bei ungültiger URL eine
  hilfreiche Fehlerseite sehen.
  - `/nicht-existent` liefert 404 mit Suchvorschlag/Links, kein raw Stacktrace.
- **US-006 🖥️ Seiten-Sprung-Anker** — Als Leser möchte ich zu Überschriften
  springen (TOC).
  - Inhaltsverzeichnis rendert und scrollt zum Abschnitt.
- **US-007 🖥️ Externe Links** — Als Nutzer möchte ich erkennen, dass ein Link
  extern ist.
  - Externe Links tragen `rel="noopener"` und ggf. einen Indikator.
- **US-008 🖥️ Druckansicht** — Als Lehrer möchte ich Seiten drucken.
  - `Ctrl/Cmd+P` zeigt aufgeräumte Druckansicht ohne Nav/Rand.
- **US-009 🖥️ Brotkrumen + Canonical** — Als SEO-Nutzer möchte ich
  kanonische URLs.
  - Jede Seite hat `<link rel="canonical">` und korrekte `og:`-Meta.
- **US-010 🖥️ Ladezeit-Homepage** — Als mobiler Nutzer möchte ich schnelles
  Laden.
  - Largest Contentful Paint < 2,5 s auf Mobil (throttled 4G).

## 2. PWA & Offline

- **US-011 🖥️ Manifest erreichbar** — Als Nutzer möchte ich ein gültiges
  Web-Manifest.
  - `/site.webmanifest` liefert 200 `application/manifest+json` mit name/icons.
- **US-012 🖥️ Installierbarkeit** — Als Nutzer möchte ich die Seite als App
  installieren.
  - `beforeinstallprompt` wird ausgelöst; Icon + Name korrekt.
- **US-013 🖥️ Service Worker Registration** — Als Nutzer möchte ich, dass der
  SW registriert wird.
  - `navigator.serviceWorker` registriert `sw.js` ohne Console-Fehler.
- **US-014 🖥️ Offline-Basis** — Als Nutzer möchte ich zuletzt besuchte Seiten
  offline lesen.
  - Im Offline-Modus liefert SW gecachte Startseite (status 200 aus Cache).
- **US-015 🖥️ SW-Update** — Als Nutzer möchte ich nach Deploy ein
  SW-Update erhalten.
  - Neuer SW wird aktiviert; kein „no-op fetch handler“-Warning.
- **US-016 🖥️ Kein Manifest-404** — Als Crawler möchte ich kein 404 auf das
  Manifest.
  - Kein `GET /manifest.webmanifest` 404 mehr (regression guard).

## 3. Dark Mode & Theming

- **US-017 🖥️ Dark-Mode-Toggle** — Als Nutzer möchte ich zwischen Hell/Dunkel
  wechseln.
  - Toggle wechselt Theme; Auswahl persistiert über Reload.
- **US-018 🖥️ System-Präferenz** — Als Nutzer möchte ich, dass die
  Systemeinstellung respektiert wird.
  - `prefers-color-scheme: dark` setzt initial Dark Mode.
- **US-019 🖥️ Kontrast** — Als sehbeeinträchtigter Nutzer möchte ich
  ausreichenden Kontrast.
  - Text/Kontrast erfüllt WCAG AA in beiden Themes.
- **US-020 🖥️ Grüne Markenfarbe konsistent** — Als Nutzer möchte ich die
  grüne Konsistenz.
  - Green-Color-Test Suite bleibt auf allen Hauptseiten grün.

## 4. Sprachumschaltung DE/EN

- **US-021 🖥️ Sprachwechsel** — Als bilingualer Nutzer möchte ich DE↔EN
  wechseln.
  - Sprach-Button wechselt sichtbare Texte; `lang`-Attribut aktualisiert sich.
- **US-022 🖥️ Persistente Sprache** — Als Nutzer möchte ich, dass die Sprache
  nach Reload erhalten bleibt.
  - Sprachwahl in `localStorage`/`cookie` gespeichert.
- **US-023 🖥️ Kein Textverlust** — Als Nutzer möchte ich keine
  unübersetzten Platzhalter.
  - Kein „[MISSING]“-Text; Fallback auf DE.

## 5. Responsiv & Mobile

- **US-024 📱 Layout bricht nicht** — Als Handy-Nutzer möchte ich kein
  horizontales Scrollen.
  - Viewport ohne Overflow-X auf 360px Breite.
- **US-025 📱 Touch-Ziele** — Als Touch-Nutzer möchte ich gut klickbare
  Buttons.
  - Interaktive Elemente ≥ 44×44 px.
- **US-026 📱 Calculator mobil** — Als Schüler möchte ich Rechner auf dem
  Handy bedienen.
  - Eingabefelder und Ergebnis sind ohne Zoom lesbar.
- **US-027 📱 Menü mobil (Hamburger)** — Als Nutzer möchte ich das Menü auf
  Mobil öffnen.
  - Hamburger öffnet/ schließt Navigation; Fokus-Trap korrekt.
- **US-028 📱 Orientation** — Als Nutzer möchte ich Hoch-/Querformat nutzen.
  - Layout funktioniert in beiden Orientierungen.

## 6. Barrierefreiheit (Accessibility)

- **US-029 ♿ Tastatur-Navigation** — Als Tastaturnutzer möchte ich alle
  Funktionen erreichen.
  - Volle Tab-Reihenfolge; sichtbarer Fokus-Ring.
- **US-030 ♿ Überschriften-Hierarchie** — Als Screenreader-Nutzer möchte ich
  logische Überschriften.
  - Keine übersprungenen Ebenen (h1→h2→h3).
- **US-031 ♿ Alt-Texte** — Als SR-Nutzer möchte ich Bildinhalte verstehen.
  - Alle `<img>` haben aussagekräftige `alt`-Texte (oder `role="presentation"`).
- **US-032 ♿ Form-Labels** — Als SR-Nutzer möchte ich beschriftete Felder.
  - Jedes Input hat zugehöriges `<label>`/aria.
- **US-033 ♿ ARIA-Live** — Als SR-Nutzer möchte ich Ergebnis-Updates hören.
  - Rechner-Ergebnisse in `aria-live`-Region.
- **US-034 ♿ Kontrast-Audit** — Als Prüfer möchte ich WCAG-AA bestehen.
  - Accessibility-Validation-Suite ohne Verstöße.
- **US-035 ♿ Skip-Link** — Als Tastaturnutzer möchte ich zum Inhalt springen.
  - „Zum Inhalt“ Link als erster Fokus-Punkt.
- **US-036 ♿ Reduced Motion** — Als nutzer mit Vestibularstörung möchte ich
  wenig Animation.
  - `prefers-reduced-motion` reduziert Animationen.

## 7. Stöchiometrie-Rechner

- **US-037 🔧 Formel parsen** — Als Schüler möchte ich `2 H2 + O2 -> 2 H2O`
  eingeben.
  - `parseFormula` liefert korrekte Atomzählung.
- **US-038 🔧 Mol-zu-Mol** — Als Nutzer möchte ich Stoffmengen umrechnen.
  - `calcMolToMol` korrekt bei Koeffizienten.
- **US-039 🔧 Masse-zu-Masse** — Als Nutzer möchte ich Gramm umrechnen.
  - `calcMassToMass` mit molarer Masse korrekt.
- **US-040 🔧 Limitierendes Reagenz** — Als Nutzer möchte ich das
  limitierende Reagenz finden.
  - `calcLimitingReactant` identifiziert korrekt.
- **US-041 🔧 Ausbeute** — Als Nutzer möchte ich die prozentuale Ausbeute.
  - `calcPercentYield` bei theoretischer/praktischer Masse.
- **US-042 🔧 Mehrstufige Reaktion** — Als Nutzer möchte ich
  Stoßstufen-Rechnung.
  - `calcMultistep` verknüpft Schritte.
- **US-043 🔧 Ungültige Formel** — Als Nutzer möchte ich einen klaren Fehler
  bei `H2O2@` (ungültig).
  - `validateFormula` wirft lesbare Meldung, kein Crash.
- **US-044 🔧 Gasgesetz im Stoich** — Als Nutzer möchte ich Volumina bei
  Gasen einbeziehen.
  - `calcGasLaw` integriert (pV=nRT).
- **US-045 🔧 History** — Als Nutzer möchte ich vergangene Berechnungen
  sehen.
  - `calcHistory` speichert/lädt Einträge.
- **US-046 🔧 Presets** — Als Lehrer möchte ich Beispielreaktionen laden.
  - Preset-Auswahl füllt Felder korrekt.

## 8. Molare-Masse-Rechner

- **US-047 🔧 MM berechnen** — Als Schüler möchte ich diemolare Masse von
  `H2SO4`.
  - `getMolarMass('H2SO4')` ≈ 98,08 g/mol.
- **US-048 🔧 Element-Lookup** — Als Nutzer möchte ich Elementdaten abrufen.
  - `calcElementLookup` liefert Symbole/Massen.
- **US-049 🔧 Hydrate** — Als Nutzer möchte ich Kristallwasser
  (`CuSO4·5H2O`).
  - Berechnung inkl. Wasser korrekt.
- **US-050 🔧 Wissenschaftl. Notation** — Als Nutzer möchte ich
  `1.2e-3` parsen.
  - `parseScientificNotation`/`formatScientificNotation` roundtrip.

## 9. pH / Säure-Base

- **US-051 🔧 pH stark** — Als Schüler möchte ich pH von 0,01 M HCl.
  - pH ≈ 2,0.
- **US-052 🔧 pH schwach** — Als Nutzer möchte ich schwache Säure via
  pKs.
  - Henderson-Hasselbalch korrekt.
- **US-053 🔧 Puffer** — Als Nutzer möchte ich Pufferberechnung.
  - Puffer-pH plausibel.
- **US-054 🔧 Titrations-Kurve** — Als Nutzer möchte ich pH-Verlauf sehen.
  - Kurve monoton, Äquivalenzpunkt markiert.
- **US-055 🔧 Ungültige Eingabe** — Als Nutzer möchte ich Fehler bei
  negativem pH-Input.
  - Klare Validierung.

## 10. Gasgesetze

- **US-056 🔧 pV=nRT** — Als Schüler möchte ich fehlende Größe berechnen.
  - `calcGasLaw` löst nach p/V/n/T auf.
- **US-057 🔧 Kombiniertes Gasgesetz** — Als Nutzer möchte ich
  Zustandsänderungen.
  - T1V1/T2V2 korrekt.
- **US-058 🔧 Ideales vs real** — Als Nutzer möchte ich Abweichung sehen.
  - Van-der-Waals optional.
- **US-059 🔧 Einheiten** — Als Nutzer möchte ich bar/atm/Pa wählen.
  - Umrechnung korrekt.
- **US-060 🔧 Standardbedingungen** — Als Nutzer möchte ich 0 °C/1 atm
  voreingestellt.
  - Defaults korrekt.

## 11. Titration

- **US-061 🔧 Säure-Base-Titration** — Als Nutzer möchte ich
  Titrationsergebnis.
  - Äquivalenzpunkt-Menge korrekt.
- **US-062 🔧 Redox-Titration** — Als Nutzer möchte ich Redox-Titration.
  - `redox-titration` liefert plausible Werte.
- **US-063 🔧 Indikator** — Als Nutzer möchte ich Umschlagspunkt.
  - Indikatorwechsel bei pH-Sprung.
- **US-064 🔧 Visualisierung** — Als Lerner möchte ich die Kurve sehen.
  - Plot rendert, Achsen beschriftet.
- **US-065 🔧 Fehlerbehandlung** — Als Nutzer möchte ich Hinweis bei
  unvollständigen Daten.
  - Kein NaN, klare Meldung.

## 12. Verdünnung

- **US-066 🔧 c1V1=c2V2** — Als Schüler möchte ich Konzentration
  verdünnen.
  - `verduennungsrechner` korrekt.
- **US-067 🔧 Verdünnungsreihe** — Als Lehrer möchte ich Serien verdünnen.
  - `verduennungsreihen-rechner` erzeugt Stufen.
- **US-068 🔧 Einheiten** — Als Nutzer möchte ich mol/L, g/L, % wählen.
  - `konzentrationsumrechner` korrekt.
- **US-069 🔧 Stammlösung** — Als Nutzer möchte ich aus Stamm berechnen.
  - Rückwärtsrechnung korrekt.
- **US-070 🔧 Validierung** — Als Nutzer möchte ich negatives Volumen
  abgefangen.
  - Fehlermeldung.

## 13. Redox & Potentiale

- **US-071 🔧 Redox-Potential** — Als Schüler möchte ich Zellpotential.
  - `redox-potenzial-rechner` nach Nernst plausibel.
- **US-072 🔧 Halbzellen** — Als Nutzer möchte ich Einzelpotentiale.
  - Korrekte Kombination.
- **US-073 🔧 Elektronenbilanz** — Als Nutzer möchte ich Ausgleich.
  - Gleichung ausgeglichen.
- **US-074 🔧 Galvanische Zelle** — Als Lerner möchte ich Polzuordnung.
  - Anode/Kathode korrekt beschriftet.
- **US-075 🔧 Fehler** — Als Nutzer möchte ich Hinweis bei fehlendem
  Potential.
  - Kein Crash.

## 14. Gleichgewicht & Thermochemie

- **US-076 🔧 Kc/Kp** — Als Schüler möchte ich Gleichgewichtskonstante.
  - `chemisches-gleichgewicht` korrekt.
- **US-077 🔧 Löslichkeitsprodukt** — Als Nutzer möchte ich Ksp prüfen.
  - `loeslichkeitsprodukt-rechner` (Fällung ja/nein).
- **US-078 🔧 Hess** — Als Nutzer möchte ich Reaktionsenthalpie addieren.
  - `hess-gesetz` korrekt.
- **US-079 🔧 Reaktionskinetik** — Als Nutzer möchte ich Geschwindigkeit.
  - `reaktionskinetik-simulator` plausibel.
- **US-080 🔧 Atmosphärendruck Alltag** — Als Nutzer möchte ich
  Druckbeispiele.
  - `atmosphaerendruck-alltag` liefert Beispiele.

## 15. Weitere Rechner

- **US-081 🔧 Dichte** — Als Schüler möchte ich Dichte berechnen.
  - `dichte-rechner` ρ=m/V.
- **US-082 🔧 Druck/Fläche** — Als Nutzer möchte ich Druck umrechnen.
  - `druck-flaechen-rechner` korrekt.
- **US-083 🔧 Bindungspotential** — Als Nutzer möchte ich Bindungsenergie.
  - `bindungspotential` plausibel.
- **US-084 🔧 Verbrennung** — Als Nutzer möchte ich
  Verbrennungsrechner.
  - `test-verbrennungsrechner` E2E korrekt.
- **US-085 🔧 Phasenübergang** — Als Nutzer möchte ich
  Dampfdruck/Clausius-Clapeyron.
  - `dampfdruck-rechner` plausibel.

## 16. Formel-Rendering (KaTeX/mhchem)

- **US-086 🖥️ mhchem rendert** — Als Schüler möchte ich `H_2O` als
  Formel sehen.
  - KaTeX/mhchem rendert chemische Formeln (E2E `test-formula-rendering`).
- **US-087 🖥️ Gleichungen** — Als Nutzer möchte ich Reaktionspfeile.
  - `A + B -> C` korrekt dargestellt.
- **US-088 🔧 Parser** — Als Dev möchte ich `calc-equation-parser`
  robust.
  - Komplexe Gleichungen parsen ohne Fehler.
- **US-089 🖥️ Kein Rohtext** — Als Nutzer möchte ich keine
  ungerenderte `$$`.
  - Keine rohen Delimiter sichtbar.
- **US-090 🖥️ Performance** — Als Nutzer möchte ich schnelles Rendering.
  - Formeln erscheinen < 500 ms.

## 17. Wissensgraph & Entitäten

- **US-091 🖥️ Entitätsseite** — Als Lerner möchte ich eine
  Stoff-Detailseite.
  - `/entitaet/<id>` lädt mit Beschreibung + verwandten Entitäten.
- **US-092 🖥️ Entity-KG-Visualisierung** — Als Nutzer möchte ich den
  Ego-Graph sehen.
  - `test-entity-knowledge-graph` rendert D3-Graph.
- **US-093 🔧 Subset-Isolation** — Als Dev möchte ich KG-Queries auf
  `CHEMIE_LABELS` beschränkt.
  - `neo4j-subset-filter` schützt vor Cross-Subset-Leaks.
- **US-094 🔧 Ähnlichkeitskanten** — Als Dev möchte ich
  `AEHNLICH_ZU` validieren.
  - Kanten existieren nur innerhalb des Chemie-Subsets.
- **US-095 🔧 KG-Datenqualität** — Als Dev möchte ich Integrität prüfen.
  - `kg-data-quality` ohne Verstöße.
- **US-096 🖥️ Verwandte Stoffe** — Als Schüler möchte ich
  „ähnliche Stoffe“.
  - Liste zeigt sinnvolle Verwandtschaft.
- **US-097 🖥️ Curricula-Graph** — Als Lehrer möchte ich
  Curriculum-Verknüpfungen.
  - `curricula-graph` zeigt COVERS_TOPIC/FULFILLS_OBJECTIVE.
- **US-098 🔧 Entity-Index** — Als Dev möchte ich Indexierung prüfen.
  - `entity-index` vollständig.
- **US-099 🖥️ Durchsuchbarkeit** — Als Nutzer möchte ich Entitäten
  suchen.
  - Suche liefert Entitäts-Treffer.
- **US-100 🔧 Modulhandbuch-Import** — Als Dev möchte ich
  Modulhandbuch importieren.
  - `modulhandbuch-import` erzeugt Nodes/Kanten.

## 18. Suche & Filter

- **US-101 🖥️ Volltextsuche** — Als Nutzer möchte ich Inhalte finden.
  - Suche indexiert Inhalte (Pagefind) und liefert Treffer.
- **US-102 🖥️ Filter Themenbereiche** — Als Nutzer möchte ich nach
  Bereich filtern.
  - Filter zeigt nur passende Seiten.
- **US-103 🖥️ Suche keine 404** — Als Crawler möchte ich funktionierende
  Suche.
  - Suche liefert 200, kein JS-Error.
- **US-104 🖥️ Suchvorschläge** — Als Nutzer möchte ich Vorschläge.
  - Autocomplete zeigt Treffer.
- **US-105 🔧 KG-Import-Scope** — Als Dev möchte ich Import auf Subset
  beschränkt.
  - `api-import-scope` validiert.

## 19. Curricula & Lernpfade

- **US-106 🖥️ Lernpfad anzeigen** — Als Schüler möchte ich einen
  Lernpfad.
  - `learning-paths` zeigt geordnete Schritte.
- **US-107 🖥️ Fortschritt** — Als Nutzer möchte ich meinen Fortschritt
  sehen.
  - `test-progress-tracker` zeigt Status.
- **US-108 🔧 Lernpfad-Generierung** — Als Dev möchte ich Pfade aus
  Graph bauen.
  - `learning-paths-next` erzeugt 15 Pfade (wie im Log).
- **US-109 🖥️ Curricula-Seiten** — Als Lehrer möchte ich
  Curricula-Inhalte.
  - `test-curricula-modulhandbuch` lädt.
- **US-110 🔧 ZPD-Engine** — Als Dev möchte ich Zone of Proximal
  Development.
  - `zpd-engine` wählt passende Aufgaben.
- **US-111 🖥️ Adaptive Schwierigkeit** — Als Schüler möchte ich
  angepasste Aufgaben.
  - `adaptive-difficulty` skaliert.
- **US-112 🔧 Spaced Repetition** — Als Nutzer möchte ich
  Wiederholungsplan.
  - `spaced-repetition`/`fsrs-cards` planen Reviews.

## 20. Quiz & Übungen

- **US-113 🖥️ Quiz starten** — Als Schüler möchte ich ein Quiz.
  - `test-quiz-system` E2E durchläuft den Flow.
- **US-114 🖥️ Practice-Quiz** — Als Nutzer möchte ich Trainingsmodus.
  - `practice-quiz` bewertet Antworten.
- **US-115 🔧 Exercise-Generator** — Als Dev möchte ich Aufgaben
  generieren.
  - `exercise-generator` erzeugt valide Aufgaben.
- **US-116 🔧 Auto-Grader** — Als Dev möchte ich Antworten bewerten.
  - `auto-grader` bewertet korrekt/inkorrekt.
- **US-117 🔧 Feedback-Engine** — Als Dev möchte ich Feedback geben.
  - `feedback-engine` liefert hilfreiches Feedback.
- **US-118 🖥️ Ergebnis-Anzeige** — Als Schüler möchte ich
  Auswertung.
  - Quiz-Ergebnis zeigt richtig/falsch + Erklärung.
- **US-119 🔧 RAG-Kontext** — Als Dev möchte ich KG-Kontext für
  Aufgaben.
  - `rag-context` baut Kontext aus Graph.
- **US-120 🖥️ Quiz-Export** — Als Lehrer möchte ich Quiz exportieren.
  - `export-manager` (PDF/CSV) funktioniert.

## 21. Lehrkräfte-Dashboard

- **US-121 🖥️ Analytics** — Als Lehrer möchte ich Klassenauswertung.
  - `teacher-analytics` zeigt Kennzahlen.
- **US-122 🖥️ Assessment-Dashboard** — Als Lehrer möchte ich
  Assessments sehen.
  - `assessment-dashboard` lädt.
- **US-123 🔧 Session-Plan** — Als Dev möchte ich Sitzungsplanung.
  - `session-plan` erstellt Plan.
- **US-124 🔧 Lesson-Plan** — Als Lehrer möchte ich Stundenplan.
  - `lesson-plan` generiert.
- **US-125 🔧 Collab-Challenges** — Als Dev möchte ich
  Kollaborations-Aufgaben.
  - `collab-challenges` funktioniert.

## 22. Hubs — Räume & Avatare

- **US-126 🖥️ Raum öffnen** — Als Nutzer möchte ich einen Raum
  betreten.
  - `hubs.chemie-lernen.org/<slug>` lädt Szene (kein White-Screen).
- **US-127 🖥️ Raum erstellen** — Als Nutzer möchte ich einen Raum
  anlegen.
  - Erstellung führt zu begehbarem Raum.
- **US-128 🖥️ Avatar wählen** — Als Nutzer möchte ich einen Avatar
  picken.
  - Avatar-Auswahl speichert Auswahl.
- **US-129 🖥️ Namen setzen** — Als Nutzer möchte ich meinen Namen
  festlegen.
  - Name erscheint über Avatar.
- **US-130 🖥️ Raum-Teilen** — Als Nutzer möchte ich einen Link
  teilen.
  - Geteilter Link öffnet denselben Raum.
- **US-131 🖥️ Sprach-Chat** — Als Nutzer möchte ich sprechen.
  - Sprachverbindung etabliert (sofern erlaubt).
- **US-132 🖥️ Raum-Verlassen** — Als Nutzer möchte ich sauber
  verlassen.
  - Verlassen beendet Session ohne Error.
- **US-133 🔧 Hubs-Client Production-Build** — Als Dev möchte ich, dass
  Hubs statisch aus `dist/` serviert wird.
  - Kein webpack-dev-server im Prod (kein `/ws` HMR-Noise).
- **US-134 🖥️ Keine Console-Errors** — Als Nutzer möchte ich eine
  saubere Konsole.
  - Keine `Uncaught`-Fehler, kein `dev.reticulum.io`-Cert-Error.

## 23. Hubs — 3D-Szenen & Medien

- **US-135 🖥️ Molecule Studio** — Als Lerner möchte ich Moleküle bauen.
  - `test-molekuel-studio` lädt Three.js-Szene.
- **US-136 🖥️ Periodensystem 3D** — Als Nutzer möchte ich das
  Periodensystem.
  - Visualisierung rendert.
- **US-137 🖥️ Medien hochladen** — Als Nutzer möchte ich Bilder/Modelle
  teilen.
  - Upload erscheint in Szene.
- **US-138 🖥️ Media-Suche** — Als Nutzer möchte ich Medien suchen.
  - `RETICULUM_SERVER` zeigt selbstgehostete Medien (kein
    dev.reticulum.io).
- **US-139 🖥️ Szenen-Persistenz** — Als Nutzer möchte ich Szene
  wiederfinden.
  - Reload zeigt gleiche Szene.
- **US-140 🖥️ Performance** — Als Nutzer möchte ich flüssige FPS.
  - ≥ 30 FPS bei typischer Szene.

## 24. Hubs — PWA/Manifest & Console

- **US-141 🖥️ Hubs-Manifest** — Als Nutzer möchte ich Hubs als App.
  - `hubs.chemie-lernen.org/manifest.webmanifest` 200
    `application/manifest+json`.
- **US-142 🖥️ Kein Manifest-404** — Als Crawler möchte ich keinen 404.
  - Regression-Guard in `test-hubs-integration` bleibt grün.
- **US-143 🖥️ Raum-URL-Rewrite** — Als Nutzer möchte ich
  `/<slug>/<name>` öffnen.
  - Statischer Server rewritet auf `hub.html`.
- **US-144 🖥️ Keine Core-Dumps** — Als Dev möchte ich keine Abstürze.
  - Kein `core.*` im hubs-Volume.

## 25. API — Chat / KI-Assistent

- **US-145 🔧 Chat-API erreichbar** — Als Dev möchte ich `/api`
  Endpunkt.
  - `chemie-chat-api` hört auf Port 3001 (health green).
- **US-146 🔧 KI-Assistent** — Als Nutzer möchte ich Fragen stellen.
  - `ki-assistent` liefert Antwort.
- **US-147 🔧 LLM-Anbindung** — Als Dev möchte ich LiteLLM nutzen.
  - Anbindung an `litellm-proxy` funktioniert.
- **US-148 🔧 Context aus KG** — Als Dev möchte ich KG-Kontext im
  Chat.
  - RAG liefert relevante Entitäten.
- **US-149 🔧 Rate-Limit** — Als Dev möchte ich Missbrauch begrenzen.
  - Limits greifen.
- **US-150 🔧 Fehlerantwort** — Als Client möchte ich saubere
  Fehler.
  - 4xx/5xx mit JSON-Body, kein Stacktrace-Leak.

## 26. API — Exercise & Grading

- **US-151 🔧 Exercise-Route-Security** — Als Dev möchte ich geschützte
  Routen.
  - `exercise-route-security` erzwingt Auth.
- **US-152 🔧 Exercise-API-Integration** — Als Dev möchte ich End-to-End
  Aufgaben.
  - `exercise-api-integration` grün.
- **US-153 🔧 Learning-Engine** — Als Dev möchte ich
  Lernfortschritt.
  - `learning-engine` speichert Stand.
- **US-154 🔧 Assessment-Store** — Als Dev möchte ich Assessments
  persistieren.
  - `assessment-store` schreibt/liesst.
- **US-155 🔧 Didaktik-API** — Als Lehrer möchte ich didaktische
  Vorgaben.
  - `didaktik-api` liefert Guidelines.
- **US-156 🔧 Session-Store** — Als Dev möchte ich Sessions halten.
  - `session-store` persistent.
- **US-157 🔧 Theme-Overrides** — Als Dev möchte ich Theme-Overrides.
  - `theme-overrides` anwendbar.
- **US-158 🔧 Feedback-Integration** — Als Dev möchte ich Feedback in
  API.
  - `feedback-engine`/API verknüpft.

## 27. API — Auth / Premium / Payment

- **US-159 🔧 Registrierung** — Als Nutzer möchte ich mich anmelden.
  - Auth erstellt Account (users.json persistiert).
- **US-160 🔧 Login** — Als Nutzer möchte ich mich einloggen.
  - Session/Token korrekt.
- **US-161 🔧 Premium-Quota** — Als Dev möchte ich Kontingente.
  - `premium-content-quota`/`scoped-quota` greifen.
- **US-162 🔧 Premium-Katalog** — Als Nutzer möchte ich Premium sehen.
  - `premium-catalog` listet Inhalte.
- **US-163 🔧 Stripe-Checkout** — Als Zahler möchte ich bezahlen.
  - `stripe-checkout` erstellt Session.
- **US-164 🔧 Stripe-Webhook** — Als Dev möchte ich Zahlungen
  verifizieren.
  - `stripe-premium-webhook` signiert gültig.
- **US-165 🔧 Exam-Simulator** — Als Schüler möchte ich Prüfungssimulation.
  - `premium-exam-simulator` funktioniert.
- **US-166 🔧 Auth-DB Persistenz** — Als Dev möchte ich keine
  Datenverluste bei Redeploy.
  - users.json via Verzeichnis-Mount persistiert.

## 28. Deployment & CI

- **US-167 🚀 Hugo-Build** — Als Dev möchte ich den Site-Build.
  - `npm run build` erzeugt `public/` ohne Fehler.
- **US-168 🚀 Hubs-Production-Build** — Als Dev möchte ich Hubs-Build.
  - `webpack --mode=production` erzeugt `dist/` + Manifest.
- **US-169 🚀 Deploy-Workflow** — Als Dev möchte ich automatischen
  Deploy.
  - `deploy.yml` baut + startet Stack.
- **US-170 🚀 CI-Unit-Tests** — Als Dev möchte ich Gate auf Push.
  - `npm test` grün in CI.
- **US-171 🚀 Coverage-Gate** — Als Dev möchte ich Coverage-Baseline.
  - `npm run test:coverage` erfüllt Schwellenwert.
- **US-172 🚀 Kein Mass-Delete KG** — Als Dev möchte ich Sicherheit.
  - Keine `DETACH DELETE`/`MATCH (d:Document) DELETE` in CI-Skripten.
- **US-173 🚀 Registry/Images** — Als Dev möchte ich Images pullen.
  - Container-Registry erreichbar (aktuell down → Blocker).
- **US-174 🚀 Healthchecks** — Als Ops möchte ich Live-Erkennung.
  - `hugo-chemie-lernen-org` + `hubs-client` healthy nach Deploy.

## 29. Performance & SEO

- **US-175 🚀 LCP** — Als Nutzer möchte ich schnelles First Paint.
  - LCP < 2,5 s.
- **US-176 🚀 Bundle-Größe** — Als Dev möchte ich schlanke Bundles.
  - `npm run analyze:bundle` zeigt keine Monster-Chunks.
- **US-177 🚀 SEO-Meta** — Als Crawler möchte ich korrekte Meta.
  - Titel/Description/og pro Seite.
- **US-178 🚀 Sitemap** — Als Crawler möchte ich `sitemap.xml`.
  - Vorhanden + gültig.
- **US-179 🚀 Robots** — Als Crawler möchte ich `robots.txt`.
  - Korrekt.
- **US-180 🚀 Bilder optimiert** — Als Nutzer möchte ich schnelle
  Bilder (aktueller Blocker: Registry down).
  - Bilder laden (kein 404/kein Broken-Image).

## 30. Sicherheit

- **US-181 🔒 XSS-Prävention** — Als Dev möchte ich keine XSS.
  - `security-utils` escaped Eingaben; Tests grün.
- **US-182 🔒 Input-Sanitization** — Als Dev möchte ich unbedenkliche
  Eingaben.
  - Calc-Inputs werden validiert.
- **US-183 🔒 Kein Secret-Leak** — Als Dev möchte ich keine Secrets im
  Client.
  - Kein API-Key im Frontend-Bundle.
- **US-184 🔒 HTTPS/Traefik** — Als Nutzer möchte ich verschlüsselt.
  - Alle Hosts über TLS (Let's Encrypt).
- **US-185 🔒 CORS** — Als Dev möchte ich korrekte CORS.
  - `CORS_PROXY_SERVER` nur für erlaubte Domains.
- **US-186 🔒 Auth-Token-Sicher** — Als Dev möchte ich sichere Tokens.
  - HttpOnly/secure Flags gesetzt.

---

## Querschnitt / Regression-Guards (bereits automatisiert)

- `tests/manifest.test.js` — PWA/chemie-raeume Manifest.
- `tests/test-hubs-integration.spec.js` — Hubs Manifest + Console.
- `tests/test-pwa-manifest.spec.js` — PWA Manifest Link validiert.
- `npm run test:calculators|chemistry|kg|api|ui|hermetic` — Domain-Subsets.
- `tests/__flaky__/` — Quarantäne für instabile Suites.

> Hinweis: Stories mit 🚀/🔧/🖥️ markieren bevorzugte Automatisierungs-Ebene.
> Blocker „CI/Registry down“ betrifft US-173, US-180 (Bilder) und indirekt
> Hubs-Raum-Öffnen (US-126) — erst nach Wiederkehr der Infrastruktur
> testbar.
