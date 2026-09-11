# User Stories — Chemie-Quiz (/quiz/)

Stand: 2026-09-11 · Fragenbank: 128 Fragen (10 je Themenbereich, 8 Tipps & Tricks)

Jede Story listet Akzeptanzkriterien (AK) und den verifizierenden Test
(`tests/quiz-user-stories.test.js`, `tests/quiz-contrast.test.js` bzw.
bestehende Suiten).

## US-01 — Themenbereich wählen

**Als** Schüler:in **möchte ich** einen Themenbereich (z. B. „Säuren und Basen“)
auswählen, **damit** ich gezielt für die nächste Klausur üben kann.

- **AK 1:** Jeder der 12 Themenbereiche hat **≥ 10 eigene Fragen**, „Tipps und
  Tricks“ ≥ 8 (Frage nach `slug` filterbar).
- **AK 2:** Jeder Anzeigename aus `window.quizTopics` resolviert zu Fragen.
- **Test:** `quiz-user-stories.test.js › US-01`

## US-02 — Frisches Frageformat pro Durchlauf

**Als** Schüler:in **möchte ich**, dass die Fragen in jedem Durchlauf gemischt
sind, **damit** ich nicht die Reihenfolge auswendig lerne.

- **AK 1:** `QuizEngine.loadQuestions()` mischt standardmäßig (Fisher–Yates).
- **AK 2:** Nach dem Mischen ist die Fragenmenge identisch (Permutation, keine
  Verluste/Dubletten).
- **Test:** `quiz-user-stories.test.js › US-02`

## US-03 — Sofortiges Feedback mit Erklärung

**Als** Schüler:in **möchte ich** direkt nach der Antwort ein Feedback mit
fachlicher Erklärung sehen, **damit** ich meinen Fehler verstehe.

- **AK 1:** Jede Frage der Bank hat eine nicht-leere `explanation`.
- **AK 2:** `submitAnswer()` liefert `correct` und `score` pro Frage zurück.
- **Test:** `quiz-user-stories.test.js › US-03`

## US-04 — Multiple Choice beantworten

**Als** Schüler:in **möchte ich** eine von mehreren Antwortoptionen wählen,
**damit** klassische Wissensfragen geprüft werden.

- **AK 1:** Richtiger Index → `score = 1`, `correct = true`.
- **AK 2:** Falscher Index → `score = 0`, `correct = false`.
- **Test:** `quiz-user-stories.test.js › US-04` (echte Frage `ec-1`)

## US-05 — Mehrfachauswahl mit Teilpunkten

**Als** Schüler:in **möchte ich**, dass fast richtige Mehrfachauswahlen
Teilpunkte geben, **damit** die Bewertung differenzierter ist.

- **AK 1:** Volltreffer → `score = 1`, `correct = true`.
- **AK 2:** Teilnahme mit mindestens einem Treffer → Teilpunkte
  `(treffer − fehler) / richtige`, `correct = false`.
- **AK 3:** Nur falsche Auswahl → `score = 0`.
- **Test:** `quiz-user-stories.test.js › US-05` (echte Frage `ec-7`)

## US-06 — Lückentext tolerant bewerten

**Als** Schüler:in **möchte ich**, dass Groß-/Kleinschreibung und
Leerzeichen am Rand nicht über Punkte entscheiden.

- **AK 1:** `"atom"`, `"Atom"`, `"ATOM"`, `"  Atom "` werden akzeptiert.
- **AK 2:** Falsche Antwort → `score = 0`.
- **Test:** `quiz-user-stories.test.js › US-06` (echte Frage `ec-6`)

## US-07 — Richtig/Falsch-Stimmen

**Als** Schüler:in **möchte ich** Aussagen als richtig oder falsch markieren
können, **damit** auch Faustregeln schnell abgefragt werden.

- **AK:** Richtiger `correctIndex` → `score = 1`.
- **Test:** `quiz-user-stories.test.js › US-07` (echte Frage `ec-3`)

## US-08 — Kompletter Durchlauf mit Auswertung

**Als** Schüler:in **möchte ich** nach dem letzten Frage eine Auswertung mit
Punktzahl, Prozent und Review der Fehler sehen.

- **AK 1:** Alle Fragen der Bank-Auswahl korrekt beantwortet →
  `getResults().percentage === 100`.
- **AK 2:** `reviewItems` listet falsch beantwortete Fragen mit User-Antwort.
- **Test:** `quiz-user-stories.test.js › US-08`

## US-09 — Content-Qualität neuer Fragen (Editor)

**Als** Content-Editor **möchte ich**, dass neue Fragen dem Schema folgen,
**damit** Widget und Engine nicht brechen.

- **AK 1:** Eindeutige IDs, bekannte Typen, Options-/Index-Verträge
  (übernommen aus `quiz-coverage.test.js`).
- **AK 2:** Die 2026-09 ergänzten Fragen (`ec-9` … `tt-8`, 26 Stück) existieren
  genau einmal und sind wohlgeformt.
- **Test:** `quiz-user-stories.test.js › US-09`

## US-10 — Lesbarkeit in allen Themes (Kontrast)

**Als** Schüler:in mit Sehbehinderung bzw. im Dunkeln lernend **möchte ich**,
dass das Quiz in allen drei Themes (hell, dunkel, Hochkontrast) WCAG-2.1-AA-
kontraste ist, **damit** niemand Text Mühe hat zu entziffern.

- **AK 1:** Alle Text-Hintergrund-Paare ≥ **4.5:1** (normaler Text).
- **AK 2:** UI-Grenzen/akzente ≥ **3:1**.
- **AK 3:** Im Dark-/Contrast-Theme sind alle Quiz-Farb-Variablen
  (`--option-bg`, `--question-bg`, `--timer-*`, `--correct-*`, `--incorrect-*`, …)
  definiert — keine hellen Fallback-Leichen.
- **Test:** `tests/quiz-contrast.test.js`
- **Umsetzung 2026-09-11:** Light-Fallbacks (#3498db→#1b6aa5, Critical-Timer
  #dc3545→#c82333, Medaillen-Badges auf dunklen Text), Feedback-/Timer-Zustände
  auf CSS-Variablen umgestellt; `dark-mode.css` definiert Quiz-Variablen für
  `[data-theme='dark']` **und** `[data-theme='contrast']` (Buttons weiß auf
  Schwarz, Akzente nur als Rahmen/Text).
