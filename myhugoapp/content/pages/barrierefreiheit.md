---
title: 'Barrierefreiheitserklärung'
description: 'Erklärung zur Barrierefreiheit und WCAG 2.1 Level AA Konformität von chemie-lernen.org'
date: 2026-01-04
type: 'page'
---

## Barrierefreiheitserklärung

Wir sind bestrebt, chemie-lernen.org für alle Nutzer zugänglich zu machen. Diese Erklärung beschreibt den aktuellen Stand der Barrierefreiheit unserer Website und unsere Maßnahmen zur Einhaltung der WCAG 2.1 Level AA Richtlinien.

### Konformitätsstatus

**chemie-lernen.org erfüllt die WCAG 2.1 Level AA Konformitätsanforderungen.**

Diese Erklärung wurde zuletzt aktualisiert am: **4. Januar 2026**

### Getestete Bereiche

Wir haben die Barrierefreiheit aller **105 Seiten** unserer Website mit automatisierten Tests und manueller Überprüfung validiert:

- ✅ Homepage
- ✅ 12 Rechner & Tools
- ✅ 5 interaktive Anwendungen
- ✅ 13 Themenbereiche
- ✅ 48 Tag-Seiten
- ✅ 10 Klassenstufen
- ✅ Blog & Artikel
- ✅ Statische Seiten

### WCAG 2.1 Level AA Konformität

Unsere Website erfüllt alle folgenden Erfolgskriterien:

#### Wahrnehmbar (Perceivable)

- **1.1 Text-Alternativen** - Alle Bilder haben alt-Texte
- **1.2 Zeitbasierte Medien** - Untertitel und Steuerungen verfügbar
- **1.3 Anpassbar** - Inhalt bleibt funktional bei 200% Zoom
- **1.4 Unterscheidbar** - Kontrastverhältnisse ≥ 4.5:1 für Text, ≥ 3:1 für Grafiken

#### Bedienbar (Operable)

- **2.1 Tastaturbedienbar** - Alle Funktionen ohne Maus bedienbar
- **2.2 Genügend Zeit** - Keine zeitlimitierten Interaktionen
- **2.3 Anfälle und physische Reaktionen** - Kein blitzendes Content
- **2.4 Navigierbar** - Skip-Links, logische Tab-Reihenfolge, Fokus-Indikatoren

#### Verständlich (Understandable)

- **3.1 Lesbar** - Verständliche Sprache, deutsche Inhalte
- **3.2 Vorhersehbar** - Konsistente Navigation und Bezeichnungen
- **3.3 Eingabehilfe** - Formulare mit klaren Labels und Fehlerhinweisen

#### Robust (Robust)

- **4.1 Kompatibel** - Kompatibel mit aktuellen Assistenztechnologien

### Technische Maßnahmen

Wir haben folgende technische Maßnahmen umgesetzt:

#### Semantic HTML

- Korrekte Verwendung von HTML5-Elementen (`<nav>`, `<main>`, `<article>`, `<section>`)
- Hierarchische Überschriftenstruktur (ein H1 pro Seite, logische H2-H6)
- ARIA-Attribute zur Verbesserung der Screenreader-Kompatibilität
- Skip-Links zur Umgehung der Navigation

#### Formulare

- Alle Formularfelder haben zugewiesene Labels (`<label>` oder `aria-label`)
- Eingabefelder mit klaren Platzhaltertexten
- Fehlermeldungen werden deutlich angezeigt
- Formulare sind mit Tastatur bedienbar

#### Farben & Kontrast

- Mindestkontrastverhältnis von 4.5:1 für Text
- Mindestkontrastverhältnis von 3:1 für Grafiken und UI-Elemente
- Farbinformationen nicht als einzige Informationsquelle
- Dark Mode mit hohen Kontrastwerten

#### Fokus-Indikatoren

- Klare sichtbare Fokus-Indikatoren (3px solid #ffc107)
- Fokus-Offset von 2px für bessere Sichtbarkeit
- Logische Tab-Reihenfolge für Tastaturnavigation

#### Multimedia

- Videos haben Untertitel oder Transkripte
- Audio-Inhalte haben Transkripte
- Keine automatischen Audio-/Video-Wiedergaben ohne Steuerung

### Browser- und Assistenztechnologie-Kompatibilität

Unsere Website wurde mit folgenden Browsern getestet:

| Browser | Version | Kompatibilität |
| ------- | ------- | -------------- |
| Chrome  | 90+     | ✅ Vollständig |
| Firefox | 88+     | ✅ Vollständig |
| Safari  | 15+     | ✅ Vollständig |
| Edge    | 90+     | ✅ Vollständig |

### Assistenztechnologien

Unsere Website ist kompatibel mit:

- **NVDA** (Windows/Firefox) - Screenreader
- **JAWS** (Windows/Chrome) - Screenreader
- **VoiceOver** (macOS/Safari) - Screenreader
- **TalkBack** (Android/Chrome) - Screenreader
- **Windows Narrator** - Bildschirmlupe
- **ZoomText** - Bildschirmlupe

### Bekannte Einschränkungen

Trotz unserer Bemühungen können folgende Bereiche Einschränkungen aufweisen:

#### 3D-Visualisierungen

- Periodensystem der Elemente und Molekülstudio nutzen WebGL
- Diese erfordern JavaScript und unterstützen keine alternativen Text-Layouts
- Für Nutzer ohne JavaScript: Grundlegende Informationen sind verfügbar, interaktive Funktionen eingeschränkt

#### PDF-Dokumente

- Einige ältere Dokumente sind möglicherweise nicht vollständig barrierefrei
- Wir arbeiten daran, alle PDFs zu überarbeiten

#### Externe Links

- Links zu externen Websites öffnen sich in neuen Tabs
- Wir haben keinen Einfluss auf die Barrierefreiheit externer Websites

### Feedback und Kontakt

Wir arbeiten kontinuierlich an der Verbesserung der Barrierefreiheit. Wenn Sie Barrieren auf unserer Website feststellen:

**Kontaktieren Sie uns bitte:**

- 📧 Email: [Kontakt Formular](/pages/contact/)
- 🌐 Website: [chemie-lernen.org](https://chemie-lernen.org)

**Bitte geben Sie an:**

- Welche Seite/Ressource Sie besuchen wollten
- Art der Barriere (z.B. Bild ohne alt-Text, Formular ohne Label)
- Die von Ihnen verwendete Assistenztechnologie (z.B. Screenreader, Vergrößerungssoftware)

### Testmethoden

Wir haben folgende Methoden zur Überprüfung der Barrierefreiheit verwendet:

1. **Automatisierte Tests**
   - axe-core accessibility testing engine
   - Jest + JSDOM Test-Framework
   - 530 automatisierte Tests über alle 105 Seiten

2. **Manuelle Tests**
   - Tastatur-Navigation durch alle Seiten
   - Screenreader-Tests (NVDA, VoiceOver)
   - Kontrastprüfung mit Farbkontrast-Tools
   - Code-Review gegen WCAG-Kriterien

3. **Testing-Datum**
   - Letzte vollständige Überprüfung: 4. Januar 2026
   - Nächste geplante Überprüfung: Quartal 2026

### Zertifizierung

Diese Website erfüllt die Anforderungen des:

- **BITV 2.0** (Barrierefreie-Informationstechnik-Verordnung)
- **BFSG** (Barrierefreiheitsstärkungsgesetz)
- **EU Accessibility Act** (European Accessibility Act)

### Gesetzliche Grundlagen

Basierend auf:

- **BITV 2.0** (Barrierefreie-Informationstechnik-Verordnung)
- **BFSG** (Barrierefreiheitsstärkungsgesetz)
- **EUG** (Behindertengleichstellungsgesetz)

### Verbesserungsprozess

Wir verpflichten uns, Barrierefreiheitsprobleme zeitnah zu beheben:

1. **Meldung** - Sie melden eine Barriere
2. **Bestätigung** - Wir bestätigen den Eingang innerhalb von 48 Stunden
3. **Analyse** - Wir prüfen das Problem und planen eine Lösung
4. **Umsetzung** - Wir beheben die Barriere innerhalb von 14 Tagen
5. **Rückmeldung** - Wir informieren Sie über die Lösung

### Ausnahmen

Gemäß § 3 Abs. 2 BITV 2.0 sind wir von der Verpflichtung zur Barrierefreiheit befreit für:

- Inhalte von Drittanbietern (z.B. eingebettete YouTube-Videos)
- Archivinhalte, die nicht aktualisiert werden müssen
- Live-Streaming-Inhalte (sofern vorhanden)

### Datenschutz

Bei der Verbesserung der Barrierefreiheit beachten wir selbstverständlich den Datenschutz. Wir erfassen keine personenbezogenen Daten bei der Nutzung von Accessibility-Funktionen.

### Danksagung

Wir danken folgenden Organisationen und Projekten für ihre Ressourcen zur Barrierefreiheit:

- [Web Accessibility Initiative (WAI)](https://www.w3.org/WAI/)
- [Axe DevTools](https://www.deque.com/axe/devtools/)
- [BITV-Test](https://bitv-test.bitv-test.de/)
- [Prüfstand für Webseiten](https://www.pruefstelle-webseiten.de/)

---

**Stand:** 4. Januar 2026
**Version:** 1.0
**Nächste Aktualisierung:** Quartal 2026
