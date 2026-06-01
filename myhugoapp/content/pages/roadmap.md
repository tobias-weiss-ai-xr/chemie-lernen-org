---
title: 'Roadmap: Ausbaustrategie'
date: 2026-01-03
description: 'Die zukünftige Entwicklungsstrategie für chemie-lernen.org'
tags: ['roadmap', 'entwicklung', 'vr']
---

Die aktuelle Plattform nutzt erfolgreich VR (Mozilla Hubs) zur Visualisierung des Periodensystems und grundlegender Experimente. Um sich von einem forschungsorientierten Projekt zu einem umfassenden Lernökosystem zu entwickeln, werden folgende Erweiterungen empfohlen.

## 1. Immersive VR-Szenarioen 🥽

Während das Periodensystem ein guter Anfang ist, entfaltet VR seine größte Stärke bei der Visualisierung von Dingen, die sonst unsichtbar oder gefährlich sind.


- **✓ Molekülstudio (IMPLEMENTIERT):** Interaktive 3D-Webanwendung zur Visualisierung von Molekülen mit Echtzeit-Rendering, Maussteuerung und automatischer Rotation. [Jetzt testen](/molekuel-studio/)
- **✓ Interaktives Periodensystem 3D (IMPLEMENTIERT):** WebGL-basiertes 3D-Periodensystem mit verschiedenen Ansichten (Tabelle, Kugel, Helix, Gitter). [Jetzt erkunden](/perioden-system-der-elemente/)
- **Subatomare Reisen:** Interaktive Räume, in denen Nutzer Atome durch Hinzufügen von Protonen, Neutronen und Elektronen "aufbauen" können, um zu beobachten, wie sich Orbitale (s, p, d, f) in 3D verändern.
- **Molekülgalerie in VR:** Ein Raum, der der VSEPR-Theorie gewidmet ist, in dem Nutzer durch riesige 3D-Modelle komplexer Moleküle (z. B. DNA, Koffein oder Polymere) laufen können, um Bindungswinkel zu verstehen.
- **Gefahrfreie Labore:** Simulierte "Extreme Experimente", die zu gefährlich für ein Schullabor wären (z. B. Alkalimetalle in Wasser, Thermit-Reaktion), bei denen Schüler mit den Variablen interagieren können.

## 2. Bildungsinhalte und gamifiziertes Lernen 🎮

Die Plattform bietet gamifizierte Lernerfahrungen:

- **✓ Übungsgenerator (IMPLEMENTIERT):** Dynamische Aufgaben mit Zufallsparametern, Schwierigkeitsgraden und sofortiger Rückmeldung. [Jetzt testen](/uebungsgenerator/)
- **✓ Lernpfad (IMPLEMENTIERT):** Geführte Touren durch Themenbereiche mit Fortschrittsanzeige. [Jetzt erkunden](/lernpfad/)
- **✓ Lückentexte (IMPLEMENTIERT):** Interaktive Cloze-Übungen mit Drag-and-Drop und Texteingabe. [Jetzt üben](/lueckentexte/)
- **✓ Fortschritt & Gamification (IMPLEMENTIERT):** XP-System mit 10 Levels und 12 Erfolgen. [Zum Dashboard](/fortschritt/)
- **✓ Escape-Room-ähnliche Aufgaben:** Kombinierte Übungen mit mehreren Lösungsschritten (im Übungsgenerator)

## 3. Ressourcen für Lehrer und Institutionen 📚

Um die Einführung an Schulen und Universitäten zu erhöhen:

- **Unterrichtsbaupläne:** PDF-Leitfäden für Lehrer, die erklären, wie ein bestimmter VR-Raum in eine 45-minütige Unterrichtsstunde integriert wird.
- **"Multi-User-Lab"-Tage:** Geplante Sitzungen, bei denen ein Experte/Moderator eine Gruppe von Schülern durch ein komplexes Experiment im Hub führt.
- **Bewertungstools:** Integration einfacher Quizze im Wiki, die den visuellen Hinweisen in den VR-Hubs entsprechen.

## 4. Technische und barrierefreie Verbesserungen ⚙️

- **✓ Interaktives Periodensystem 3D (IMPLEMENTIERT):** WebGL-basiertes 3D-Periodensystem mit verschiedenen Ansichten (Tabelle, Kugel, Helix, Gitter). [Jetzt erkunden](/perioden-system-der-elemente/)
- **✓ Molekülstudio 3D (IMPLEMENTIERT):** Webbasierte Molekülvisualisierung mit Echtzeit-Rendering und interaktiver Steuerung. [Jetzt testen](/molekuel-studio/)

- **Hybrides Lernen (WebGL):** Sicherstellen, dass jeder VR-Raum einen leistungsstarken "2D/Browser"-Modus für Schüler ohne VR-Headsets oder langsame Verbindungen bietet.
- **Wiki-Erweiterung:** Das Wiki sollte als "Lehrbuch" zum "Labor" des Hubs dienen. Jedes VR-Experiment sollte einen entsprechenden vertiefenden Artikel haben, der die Mathematik und Theorie dahinter erklärt.

## 5. Erweiterte Berechner & Werkzeuge 🔬 (ABGESCHLOSSEN ✅)

**ALLE RECHNER IMPLEMENTIERT - Januar 2026**

Die Suite an erweiterten chemischen Rechnern ist jetzt vollständig verfügbar:

- **✓ Löslichkeitsprodukt-Rechner (IMPLEMENTIERT):** Berechnung von Ksp-Werten, Lösunglichkeit und Fällungsreaktionen. Unterstützt 25+ häufige Salze mit automatischer Stöchiometrie-Erkennung. [Jetzt berechnen](/loeslichkeitsprodukt-rechner/)
- **✓ Redox-Potenzial-Rechner (IMPLEMENTIERT):** Bestimmung von Zellspannungen, Gibbs-Energie (ΔG°) und Gleichgewichtskonstanten (K). Nernst-Gleichung für Nicht-Standard-Bedingungen. [Jetzt berechnen](/redox-potenzial-rechner/)
- **✓ Konzentrationsumrechner (IMPLEMENTIERT):** Umrechnung zwischen 11 verschiedenen Konzentrationseinheiten (Molar, Molal, % w/w, % v/v, % w/v, ppm, ppb, g/L, mg/L, Molenbruch, Normalität). [Jetzt umrechnen](/konzentrationsumrechner/)
- **✓ Verbrennungsrechner (IMPLEMENTIERT):** Vollständige Analyse von Verbrennungsreaktionen mit Luftbedarf, Abgaszusammensetzung, CO₂-Emissionen und Energiegehalt (Heizwert/Brennwert). Unterstützt C, H, O, N, S-haltige Verbindungen. [Jetzt analysieren](/verbrennungsrechner/)
- **✓ Titrationssimulator (IMPLEMENTIERT):** Interaktive Simulation von Säure-Base-Titrationen mit Echtzeit-pH-Berechnung, visueller Kurvenzeichnung (Chart.js) und Äquivalenzpunkt-Bestimmung. Unterstützt starke und schwache Elektrolyte. [Jetzt simulieren](/titrations-simulator/)
- **✓ Gasesetz-Rechner (IMPLEMENTIERT):** Kombinierte Berechnungen mit Idealem Gasgesetz (pV=nRT), Boyle-Mariotte (p₁V₁=p₂V₂), Gay-Lussac (V/T, p/T) und Kombiniertem Gasgesetz (p₁V₁/T₁=p₂V₂/T₂). Umfassende Einheitenumrechnungen. [Jetzt berechnen](/gasgesetz-rechner/)

**Implementierungsumfang:**

- 6 vollständige Berechner mit deutschsprachiger Oberfläche
- Responsive Design für Desktop und Mobile
- Umfassende Educational Content Sections mit Theorie, Beispielen und Anwendungstabellen
- Interaktive Beispiele und Quick-Buttons
- Farbcodierte Ergebnisse und Visualisierungen
- Alle 299 Tests bestanden ✅
- ESLint-konformer Code
- Insgesamt über 4.100 Zeilen Code

## 6. Community & Zusammenarbeit 🤝

- **Benutzergenerierte Hubs:** Fortgeschrittene Schüler oder Lehrer können ihre eigenen Hub-Layouts oder experimentellen Aufstellungen einreichen.
- **Forschungsblog:** Regelmäßige Updates zum "Status Quo" des Projekts, teilen Sie Erkenntnisse darüber, wie VR die Behaltensrate von Chemiestudenten im Vergleich zu herkömmlichen Methoden beeinflusst.

---

## 7. Struktur und Reaktionen - Detailierte Implementierungsplanung 🧪

Diese Sektion enthält eine detaillierte Analyse und Planung für die Erweiterung der Plattform um struktur- und reaktionsbezogene Lerninhalte.

### Aktuelle Kapazitäten ✅

**3D Visualisierungen:**

- ✅ Periodensystem der Elemente (118 Elemente, 3D-Ansichten)
- ✅ Molekülstudio (Molekülvisualisierung interaktiv)

**Chemie-Rechner (Basis):**

- ✅ pH-Rechner (Säuren, Basen, Puffer)
- ✅ Molare Masse Rechner
- ✅ Reaktionsgleichungen Ausgleichen
- ✅ Stöchiometrie-Rechner

**Spezialrechner:**

- ✅ Titrations-Simulator (Säure-Base-Titrationen)
- ✅ Gasgesetz-Rechner (Ideales Gas, Boyle-Mariotte, Gay-Lussac)
- ✅ Verbrennungsrechner (Energieumsätze, CO₂)
- ✅ Löslichkeitsprodukt-Rechner
- ✅ Redox-Potenzial-Rechner
- ✅ Konzentrationsumrechner
- ✅ Lösungsrechner
- ✅ Einheitenumrechner

**Experimentelle Simulationen:**

- ✅ Torricelli-Versuch (Luftdruckmessung mit Quecksilbersäule)

---

### Phase 1: Hochpriotität - Sofortige Implementierung (Q1 2026) ✅ ABGESCHLOSSEN

#### 1.1 Druck und Fläche ✅

- **Thema:** Druck = Kraft / Fläche (p = F/A)
- **Status:** ✅ IMPLEMENTIERT
- **Merkmale:**
  - Interaktiver Druckrechner mit Einheitenumrechnung (Pa, kPa, MPa, bar, atm, Torr, mmHg)
  - Visuelle Kolben-Demonstration live
  - Hydraulik-Beispiele aus dem Alltag
  - Drei Modi: Druck, Kraft oder Fläche berechnen
- **Zielseite:** [Druck & Fläche Rechner](/druck-flaechen-rechner/)

#### 1.2 Atmosphärendruck im Alltag ✅

- **Thema:** Alltägliche Phänomene des Luftdrucks
- **Status:** ✅ IMPLEMENTIERT
- **Merkmale:**
  - Strohhalm-Experiment-Simulation
  - Ballon-Druck-Demo
  - Saugnapf-Physik
- **Zielseite:** [Atmosphärendruck im Alltag](/atmosphaerendruck-alltag/)

---

### Phase 2: Thermodynamik & Kinetik (Q2-Q3 2026) ✅ ABGESCHLOSSEN

#### 2.1 Bindungspotential ✅

- **Thema:** Energieprofil bei chemischen Bindungen
- **Status:** ✅ IMPLEMENTIERT
- **Merkmale:**
  - Interaktives Energie-Diagramm mit Canvas 2D
  - Bindungsenthalpie visualisieren
  - Aktivierungsenergie demonstrieren
- **Zielseite:** [Bindungspotential](/bindungspotential/)

#### 2.2 Hess'sches Gesetz ✅

- **Thema:** Energieerhaltungssatz in der Thermochemie
- **Status:** ✅ IMPLEMENTIERT
- **Merkmale:**
  - Reaktionswege vergleichen
  - Bildungsenthalpien berechnen
  - Verbundenes Diagramm interaktiv
- **Zielseite:** [Hess'sches Gesetz](/hess-gesetz/)

#### 2.3 Teilchen und Reaktionsgeschwindigkeit ✅

- **Thema:** Kinetische Gastheorie und Reaktionskinetik
- **Status:** ✅ IMPLEMENTIERT
- **Merkmale:**
  - Partikel-Simulation (Temperatur, Geschwindigkeit)
  - Stoßtheorie visualisieren
  - Arrhenius-Gleichung demonstrieren
- **Zielseite:** [Reaktionskinetik-Simulator](/reaktionskinetik-simulator/)

#### 2.4 Chemisches Gleichgewicht ✅

- **Thema:** Dynamisches Gleichgewicht bei Reaktionen
- **Status:** ✅ IMPLEMENTIERT
- **Merkmale:**
  - Hin- und Rückreaktion visualisieren
  - Gleichgewichtskonstante Kc interaktiv
  - Le Chatelier'sches Prinzip demonstrieren
- **Zielseite:** [Chemisches Gleichgewicht](/chemisches-gleichgewicht/)

---

### Phase 3: Erweiterte Säuren-Basen-Themen (Q3 2026)

#### 3.1 Säuredissoziation auf molekularer Ebene

- **Thema:** Dissoziation starker und schwacher Säuren
- **Status:** ✅ BESTEHT (Teilweise in pH-Rechner [Jetzt testen](/ph-rechner/))
- **Merkmale:**
  - Partikel-Animation der Dissoziation
  - Dissoziationsgrad α visualisieren
  - pKs/pKb-Werte interaktiv
- **Zielseite:** Erweitern `/ph-rechner/`

#### 3.2 Säuren-Basen-Gleichgewichte vorhersagen

- **Thema:** Gleichgewichtsposition prognostizieren
- **Status:** ✅ BESTEHT
- **Merkmale:**
  - ICE-Tabellen (Initial-Change-Equilibrium)
  - Massenwirkungsgesetz visualisiert
  - Henderson-Hasselbalch-Gleichung
- **Zielseite:** `/saeuren-basen-gleichgewicht/` [Jetzt berechnen](/saeuren-basen-gleichgewicht/)

#### 3.3 Puffer herstellen

- **Thema:** Puffersysteme verstehen und herstellen
- **Status:** PARTIELL (in pH-Rechner)
- **Merkmale:**
  - Interaktive Puffer-Zusammenstellung
  - Pufferkapazität demonstrieren
- **Zielseite:** Erweitern `/ph-rechner/`

#### 3.4 Titration modellieren

- **Status:** ✅ BESTEHT (Titrations-Simulator)
- **Thema:** Säure-Base-Titrationen
- **Aktion:** Keine neue Implementierung nötig

---

### Phase 4: Atombau & Bindungstheorien (Q4 2026)

#### 4.1 Atomenergieniveaus und Linienspektren

- **Thema:** Bohr'sches Atommodell und Spektren
- **Status:** ✅ BESTEHT [Jetzt erkunden](/atomenergieniveaus/)
- **Merkmale:**
  - Energieniveaus interaktiv (n=1,2,3...)
  - Elektronenübergänge animieren
  - Linienspektren emittieren/absorbieren
  - Balmer-Serie, Lyman-Serie etc.
- **Zielseite:** `/atomenergieniveaus/`
- **Technik:** Canvas 2D + Animationen

#### 4.2 Periodische Trends

- **Thema:** Trends durch atomare Energieniveaus
- **Status:** BESTEHT
- **Merkmale:**
  - Atomradius, Ionisierungsenergie, Elektronegativität mit Heatmaps
  - Interaktives Trends-PSE mit Klick-Details pro Element
  - Detaillierte Trend-Erklärungen (Kernladung, Schale, Abschirmung)
- **Zielseite:** [Periodische Trends](/periodische-trends/)

#### 4.3 Molekülorbitale

- **Thema:** MO-Theorie und andere Bindungskonzepte
- **Status:** BESTEHT
- **Merkmale:**
  - σ- und π-Bindungen visualisieren
  - S- und p-Orbital-Überlappung animieren (Three.js 3D)
  - Hybridsierung (sp, sp², sp³) mit Beispielmolekülen
  - VB- vs MO-Theorie vergleichen
- **Zielseite:** [Molekülorbitale](/molekuelorbitale/)

---

### Phase 5: Redoxchemie (Q1 2027)

#### 5.1 Elektrochemie auf Teilchenebene

- **Thema:** Redoxreaktionen auf molekularer Ebene
- **Status:** BESTEHT
- **Merkmale:**
  - Elektronenübergänge animieren
  - Galvanische Zellen visualisieren
  - Elektrolyse demonstrieren
  - Nernst-Gleichung interaktiv
- **Zielseite:** [Elektrochemie auf Teilchenebene](/elektrochemie-teilchenebene/)

#### 5.2 Redox-Titrationen

- **Thema:** Redox-Titrationen visualisieren
- **Status:** BESTEHT
- **Merkmale:**
  - Permanganat-Titration (MnO₄⁻) - Selbstindikator (violett → farblos)
  - Cer(IV)-Sulfat-Titration - Potentiometrischer Standard (E°=1.44 V)
  - Iod-Thiosulfat-Titration - Stärke-Indikator (blau → farblos)
  - Generalisiertes Potentiometrie-Tab - Alle Redox-Paare mit Nernst-Gleichung
- **Zielseite:** [Redox-Titrationen](/redox-titrationen/)

---

### Phase 6: Wärmelehre (Q2 2027)

#### 6.1 Wärmeleitung

- **Thema:** Wärmeübertragung durch Konduktion
- **Status:** BESTEHT
- **Merkmale:**
  - Wärmeleitung in Metallen vs. Isolatoren
  - Wärmefluss-Diagramm animiert
  - Fourier'sches Gesetz visualisiert
- **Zielseite:** [Wärmeleitung](/waermeleitung/)

#### 6.2 Konvektion

- **Thema:** Konvektionsströmungen in Fluiden
- **Status:** BESTEHT
- **Merkmale:**
  - Konvektionszellen animieren
  - Auftrieb und Dichte
  - Natürliche vs. erzwungene Konvektion
- **Zielseite:** [Konvektion](/konvektion/)

#### 6.3 Temperatur und Teilchenbewegung

- **Thema:** Temperatur als kinetische Energie
- **Status:** BESTEHT
- **Merkmale:**
  - Partikelgeschwindigkeit vs. Temperatur
  - Maxwell-Boltzmann-Verteilung
  - Kollisionen und Druck
- **Zielseite:** [Temperatur & Teilchenbewegung](/temperatur-teilchenbewegung/)

---

### Zusammenfassung nach Themenbereichen

**🔬 Druck & Gase:**

- ✅ Torricelli-Versuch
- ✅ Gasgesetz-Rechner
- ✅ Druck- und Flächenrechner
- ✅ Atmosphärendruck im Alltag

**🌡️ Thermodynamik & Kinetik:**

- ✅ Verbrennungsrechner (Enthalpie)
- ✅ Bindungspotential
- ✅ Hess'sches Gesetz
- ✅ Reaktionskinetik-Simulator
- ✅ Chemisches Gleichgewicht

**⚗️ Säuren & Basen:**

- ✅ pH-Rechner
- ✅ Titrations-Simulator
- ✅ Säuredissoziation (molekular)
- ✅ Säuren-Basen-Gleichgewichte
- 🔄 Puffer-Systeme (erweitert, in pH-Rechner)

**⚛️ Atombau & Bindung:**

- ✅ Periodensystem
- ✅ Molekülstudio
- ✅ Atomenergieniveaus
- ✅ Periodische Trends
- ✅ Molekülorbitale

**⚡ Redox & Elektrochemie:**

- ✅ Redox-Potenzial-Rechner
- ✅ Elektrochemie (Teilchenebene)
- ✅ Redox-Titrationen

**🔥 Wärmelehre:**

- ✅ Wärmeleitung
- ✅ Konvektion
- ✅ Temperatur & Teilchenbewegung

**🎮 Gamification & Lernwerkzeuge:**

- ✅ Übungsgenerator
- ✅ Lernpfad
- ✅ Lückentexte
- ✅ Fortschritt & Gamification (XP, Levels, Achievements)
- ✅ Arbeitsblatt-Generator
- ✅ Aufgabensammlung
- ✅ Klassencockpit

**🧪 Erweiterte Visualisierungen:**

- ✅ Gefahrstoffkennzeichnung
- ✅ Laborgeräte-Explorer
- ✅ Spektroskopie-Simulator

**🤖 Plattform-Reife:**

- ✅ KI-Assistent
- ✅ PWA-Offline-Modus
- ✅ Lehrendenbereich mit Unterrichtsbausteinen

---

### Umsetzungsstand (Juni 2026)

| Thema | Status | Klasse |
|-------|--------|--------|
| Druck & Fläche | ✅ Implementiert | 7-9 |
| Atmosphärendruck im Alltag | ✅ Implementiert | 7-9 |
| Bindungspotential | ✅ Implementiert | 10-13 |
| Hess'sches Gesetz | ✅ Implementiert | 11-13 |
| Reaktionskinetik-Simulator | ✅ Implementiert | 10-13 |
| Chemisches Gleichgewicht | ✅ Implementiert | 10-13 |
| Atomenergieniveaus | ✅ Implementiert | 9-11 |
| Molekülorbitale | ✅ Implementiert | 11-13 |
| Wärmeleitung, Konvektion, Teilchen | ✅ Implementiert | 8-10 |
| Übungsgenerator, Lernpfad, Lückentexte | ✅ Implementiert | 8-13 |
| Gamification (XP, Levels, Achievements) | ✅ Implementiert | Alle |
| KI-Assistent & PWA | ✅ Implementiert | Alle |
| Lehrendenbereich | ✅ Implementiert | Lehrer |

### Nächste geplante Entwicklungsschwerpunkte

| Bereich | Beschreibung |
|---------|-------------|
| **Forschungsnews-Automatisierung** | KI-gestützte Extraktion und Aufbereitung chemiedidaktischer Publikationen aus RSS-Feeds (arXiv, Nature, ScienceDaily) |
| **KI-Assistent Erweiterung** | Integration mit dem plattformeigenen Wissensgraph für kontextbezogene Antworten |
| **PWA-Optimierung** | Verbesserung des Offline-Modus und der Service-Worker-Strategien |
| **Barrierefreiheit** | WCAG 2.1 AA-konforme Überarbeitung aller interaktiven Komponenten |
| **Mehrsprachigkeit** | Englischsprachige Version ausgewählter Inhalte (in Evaluation) |

---

### Technische Anforderungen

**Frontend-Stack:**

- **Framework:** Hugo (Markdown + JavaScript)
- **2D-Visualisierung:** Canvas API
- **3D-Visualisierung:** Three.js
- **Diagramme:** Chart.js oder D3.js
- **Animation:** GSAP (GreenSock)
- **Styling:** Tailwind CSS (bestehend)

**Qualitätsstandards:**

- ✅ Responsives Design (Mobile, Tablet, Desktop)
- ✅ Barrierefreiheit (WCAG 2.1 AA)
- ✅ Deutsche Sprache (Muttersprachenniveau)
- ✅ Mathematische Formeln (KaTeX)
- ✅ Interaktive Demos
- ✅ Export-Funktionen (PDF, CSV)
- ✅ Unit Tests (Jest, >70% Coverage)
- ✅ E2E Tests (Playwright)

---

## 0. Kürzliche Verbesserungen ✨ (Januar 2026)

### Codequalität & Wartbarkeit

- **✓ Shared Utility Modules (IMPLEMENTIERT):** Zentrale Bibliothek für chemische Formel-Parsing und Berechnungen. Eliminierung von ~160 Zeilen doppeltem Code über 3 Dateien. Verbesserte Wartbarkeit und Konsistenz.
- **✓ Performance-Optimierung (IMPLEMENTIERT):** Screenshots von PNG zu WebP konvertiert. Ersparnis von 14.19 MB (80% Reduktion) bei verbesserter Bildqualität durch modernere Kompression.
- **✓ Test-Infrastruktur (IMPLEMENTIERT):** Jest-Test-Suite für Stöchiometrie-Rechner, Export-Manager und Visualisierungskomponenten. 53+ Tests mit automatisierter Coverage-Berichterstattung.
- **✓ ESLint & Prettier (IMPLEMENTIERT):** Automatische Code-Formatierung und Linting mit Pre-Commit-Hooks. Konsistenter Codestil über das gesamte Projekt.

### Berechner & Werkzeuge

- **✓ Stöchiometrie-Rechner (IMPLEMENTIERT):** Umfassender Rechner für Mol-Mol-Umrechnungen, Masse-Masse-Berechnungen, limitierende Reagenzien, prozentuale Ausbeute und Gasgesetze.
- **✓ pH-Rechner (IMPLEMENTIERT):** Interaktiver Rechner für pH- und pOH-Werte mit starker und schwacher Säuren/Basen.
- **✓ Molare-Masse-Rechner (IMPLEMENTIERT):** Automatische Berechnung der molaren Masse aus chemischen Formeln mit detaillierter Elementaranalyse.
- **✓ Reaktionsgleichungen-Ausgleicher (IMPLEMENTIERT):** Automatisches Ausgleichen chemischer Reaktionsgleichungen mit Matrix-Methode und Verifizierung.
- **✓ Löslichkeitsprodukt-Rechner (IMPLEMENTIERT):** Berechnung von Ksp-Werten und Vorhersage von Fällungsreaktionen. [Jetzt berechnen](/loeslichkeitsprodukt-rechner/)
- **✓ Redox-Potenzial-Rechner (IMPLEMENTIERT):** Bestimmung von Zellspannungen, Gibbs-Energie und Redox-Gleichgewichten. [Jetzt berechnen](/redox-potenzial-rechner/)
- **✓ Konzentrationsumrechner (IMPLEMENTIERT):** Umrechnung zwischen 11 verschiedenen Konzentrationseinheiten (Molar, Molal, %, ppm, ppb, etc.). [Jetzt umrechnen](/konzentrationsumrechner/)

---

_Letzte Aktualisierung: Juni 2026_
_Nächste Überprüfung: Nach Abschluss der Plattform-Stabilisierung (Q3 2026)_
