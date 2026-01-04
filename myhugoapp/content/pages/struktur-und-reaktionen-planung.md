# Chemie-lernen.org Roadmap - Struktur und Reaktionen

This roadmap combines analysis from two educational sources:

- **SILC** (HU Berlin) - https://tcel-hu-berlin.github.io/silc/
- **Javalab.org** - https://javalab.org/en/category/chemistry_en/

## Current Capabilities ✅

### 3D Visualisierungen

- ✅ Periodensystem der Elemente (118 Elemente, 3D-Ansichten)
- ✅ Molekülstudio (Molekülvisualisierung interaktiv)

### Chemie-Rechner (Basis)

- ✅ pH-Rechner (Säuren, Basen, Puffer)
- ✅ Molare Masse Rechner
- ✅ Reaktionsgleichungen Ausgleichen
- ✅ Stöchiometrie-Rechner

### Spezialrechner

- ✅ Titrations-Simulator (Säure-Base-Titrationen)
- ✅ Gasgesetz-Rechner (Ideales Gas, Boyle-Mariotte, Gay-Lussac)
- ✅ Verbrennungsrechner (Energieumsätze, CO₂)
- ✅ Löslichkeitsprodukt-Rechner
- ✅ Redox-Potenzial-Rechner
- ✅ Konzentrationsumrechner
- ✅ Lösungsrechner
- ✅ Einheitenumrechner

### Experimentelle Simulationen

- ✅ Torricelli-Versuch (Luftdruckmessung mit Quecksilbersäule)

---

## Phase 1: Hochpriotität - Sofortige Implementierung (Q1 2026)

### 1.1 Druck und Fläche [Javalab]

**Status:** TODO
**Thema:** Druck = Kraft / Fläche (p = F/A)
**Merkmale:**

- Interaktiver Druckrechner
- Visuelle Demonstrationen mit Kolben/Spritzen
- Hydraulik-Beispiele aus dem Alltag
  **Zielseite:** `/druck-flaechen-rechner/`
  **Integration:** Erweitern bestehenden Druck-Rechner

### 1.2 Atmosphärendruck im Alltag [Javalab]

**Status:** TODO
**Thema:** Alltägliche Phänomene des Luftdrucks
**Merkmale:**

- Strohhalm-Experiment-Simulation
- Ballon-Druck-Demo
- Saugnapf-Physik
  **Zielseite:** `/atmosphaerendruck-alltag/`
  **Integration:** Ergänzung zu Torricelli-Versuch

---

## Phase 2: Thermodynamik & Kinetik [SILC] (Q2-Q3 2026)

### 2.1 Bindungspotential [SILC Simulation A]

**Status:** TODO
**Thema:** Energieprofil bei chemischen Bindungen
**Merkmale:**

- Interaktives Energie-Diagramm
- Bindungsenthalpie visualisieren
- Aktivierungsenergie demonstrieren
  **Zielseite:** `/bindungspotential/`
  **Technik:** Canvas 2D Animation

### 2.2 Hess'sches Gesetz [SILC Simulation B]

**Status:** TODO
**Thema:** Energieerhaltungssatz in der Thermochemie
**Merkmale:**

- Reaktionswege vergleichen
- Bildungsenthalpien berechnen
- Verbundenes Diagramm interaktiv
  **Zielseite:** `/hess-gesetz/`
  **Integration:** Erweitert Verbrennungsrechner

### 2.3 Teilchen und Reaktionsgeschwindigkeit [SILC Simulation C]

**Status:** TODO
**Thema:** Kinetische Gastheorie und Reaktionskinetik
**Merkmale:**

- Partikel-Simulation (Temperatur, Geschwindigkeit)
- Stoßtheorie visualisieren
- Arrhenius-Gleichung demonstrieren
  **Zielseite:** `/reaktionskinetik-simulator/`
  **Technik:** Three.js Partikel-System

### 2.4 Chemisches Gleichgewicht [SILC Simulation D]

**Status:** TODO
**Thema:** Dynamisches Gleichgewicht bei Reaktionen
**Merkmale:**

- Hin- und Rückreaktion visualisieren
- Gleichgewichtskonstante Kc interaktiv
- Le Chatelier'sches Prinzip demonstrieren
  **Zielseite:** `/chemisches-gleichgewicht/`
  **Integration:** Erweitert bestehende Reaktions-Rechner

---

## Phase 3: Erweiterte Säuren-Basen-Themen [SILC] (Q3 2026)

### 3.1 Säuredissoziation auf molekularer Ebene [SILC Simulation A]

**Status:** IN PROGRESS (Teilweise in pH-Rechner)
**Thema:** Dissoziation starker und schwacher Säuren
**Merkmale:**

- Partikel-Animation der Dissoziation
- Dissoziationsgrad α visualisieren
- pKs/pKb-Werte interaktiv
  **Zielseite:** Erweitern `/ph-rechner/`

### 3.2 Säuren-Basen-Gleichgewichte vorhersagen [SILC Simulation B]

**Status:** TODO
**Thema:** Gleichgewichtsposition prognostizieren
**Merkmale:**

- ICE-Tabellen (Initial-Change-Equilibrium)
- Massenwirkungsgesetz visualisiert
- Henderson-Hasselbalch-Gleichung
  **Zielseite:** `/saeuren-basen-gleichgewicht/`

### 3.3 Puffer herstellen [SILC Simulation C]

**Status:** PARTIELL (in pH-Rechner)
**Thema:** Puffersysteme verstehen und herstellen
**Merkmale:**

- Interaktive Puffer-Zusammenstellung
- Pufferkapazität demonstrieren
- Essigsäure/Acetat-System visualisiert
  **Zielseite:** Erweitern `/ph-rechner/`

### 3.4 Titration modellieren [SILC Simulation D]

**Status:** ✅ BESTEHT (Titrations-Simulator)
**Thema:** Säure-Base-Titrationen
**Aktion:** Keine neue Implementierung nötig

---

## Phase 4: Atombau & Bindungstheorien [SILC] (Q4 2026)

### 4.1 Atomenergieniveaus und Linienspektren [SILC]

**Status:** TODO
**Thema:** Bohr'sches Atommodell und Spektren
**Merkmale:**

- Energieniveaus interaktiv (n=1,2,3...)
- Elektronenübergänge animieren
- Linienspektren emittieren/absorbieren
- Balmer-Serie, Lyman-Serie etc.
  **Zielseite:** `/atomenergieniveaus/`
  **Technik:** Canvas 2D + Animationen

### 4.2 Periodische Trends [SILC]

**Status:** PARTIELL (Periodensystem vorhanden)
**Thema:** Trends durch atomare Energieniveaus
**Merkmale:**

- Atomradius, Ionisierungsenergie, Elektronegativität
- Interaktive Trend-Linien im PSE
- Erklärung durch Orbitale
  **Zielseite:** Erweitern `/perioden-system-der-elemente/`

### 4.3 Molekülorbitale [SILC]

**Status:** TODO
**Thema:** MO-Theorie und andere Bindungskonzepte
**Merkmale:**

- σ- und π-Bindungen visualisieren
- S- und p-Orbital-Überlappung animieren
- Hybridsierung (sp, sp2, sp3)
- VB- vs MO-Theorie vergleichen
  **Zielseite:** `/molekuelorbitale/`
  **Technik:** Three.js 3D-Orbitale

---

## Phase 5: Redoxchemie [SILC] (Q1 2027)

### 5.1 Elektrochemie auf Teilchenebene [SILC]

**Status:** PARTIELL (Redox-Potenzial-Rechner vorhanden)
**Thema:** Redoxreaktionen auf molekularer Ebene
**Merkmale:**

- Elektronenübergänge animieren
- Galvanische Zellen visualisieren
- Elektrolyse demonstrieren
- Nernst-Gleichung interaktiv
  **Zielseite:** Erweitern `/redox-potenzial-rechner/`

### 5.2 Redox-Titrationen

**Status:** TODO
**Thema:** Redox-Titrationen visualisieren
**Merkmale:**

- Permanganat-Titration (MnO₄⁻)
- Cer(IV)-Sulfat-Titration
- Potentiometrische Indikation
  **Zielseite:** Erweitern `/titrations-simulator/`

---

## Phase 6: Wärmelehre [Javalab] (Q2 2027)

### 6.1 Wärmeleitung

**Status:** TODO
**Thema:** Wärmeübertragung durch Konduktion
**Merkmale:**

- Wärmeleitung in Metallen vs. Isolatoren
- Wärmefluss-Diagramm animiert
- Fourier'sches Gesetz visualisiert
  **Zielseite:** `/waermeleitung/`
  **Integration:** Energetik Themenbereich

### 6.2 Konvektion

**Status:** TODO
**Thema:** Konvektionsströmungen in Fluiden
**Merkmale:**

- Konvektionszellen animieren
- Auftrieb und Dichte
- Natürliche vs. erzwungene Konvektion
  **Zielseite:** `/konvektion/`

### 6.3 Temperatur und Teilchenbewegung

**Status:** TODO
**Thema:** Temperatur als kinetische Energie
**Merkmale:**

- Partikelgeschwindigkeit vs. Temperatur
- Maxwell-Boltzmann-Verteilung
- Phasenübergänge animieren
  **Zielseite:** `/temperatur-bewegung/`

---

## Zusammenfassung nach Themenbereichen

### 🔬 Druck & Gase

- ✅ Torricelli-Versuch
- ✅ Gasgesetz-Rechner
- 🔲 Druck- und Flächenrechner
- 🔲 Atmosphärendruck im Alltag

### 🌡️ Thermodynamik & Kinetik

- ✅ Verbrennungsrechner (Enthalpie)
- 🔲 Bindungspotential
- 🔲 Hess'sches Gesetz
- 🔲 Reaktionskinetik-Simulator
- 🔲 Chemisches Gleichgewicht

### ⚗️ Säuren & Basen

- ✅ pH-Rechner
- ✅ Titrations-Simulator
- 🔲 Säuredissoziation (molekular)
- 🔲 Säuren-Basen-Gleichgewichte
- 🔲 Puffer-Systeme (erweitert)

### ⚛️ Atombau & Bindung

- ✅ Periodensystem
- ✅ Molekülstudio
- 🔲 Atomenergieniveaus
- 🔲 Periodische Trends (erweitert)
- 🔲 Molekülorbitale

### ⚡ Redox & Elektrochemie

- ✅ Redox-Potenzial-Rechner
- 🔲 Elektrochemie (Teilchenebene)
- 🔲 Redox-Titrationen

### 🔥 Wärmelehre

- 🔲 Wärmeleitung
- 🔲 Konvektion
- 🔲 Temperatur & Teilchenbewegung

---

## Technische Anforderungen

### Frontend-Stack

- **Framework:** Hugo (Markdown + JavaScript)
- **2D-Visualisierung:** Canvas API
- **3D-Visualisierung:** Three.js / React Three Fiber
- **Diagramme:** Chart.js oder D3.js
- **Animation:** GSAP (GreenSock)
- **Styling:** Tailwind CSS (bestehend)

### Inhaltsstruktur

```markdown
---
title: 'Seitentitel'
date: YYYY-MM-DD
description: 'Kurze Beschreibung für SEO'
tags: ['tag1', 'tag2', 'tag3']
---

## Hauptüberschrift

Interaktive Simulation:

<div class="simulator">
  <canvas id="simulationCanvas"></canvas>
  <div class="controls">...</div>
</div>

Erklärender Text...
```

### Qualitätsstandards

- ✅ Responsives Design (Mobile, Tablet, Desktop)
- ✅ Barrierefreiheit (WCAG 2.1 AA)
- ✅ Deutsche Sprache (Muttersprachenniveau)
- ✅ Mathematische Formeln (KaTeX)
- ✅ Interaktive Demos
- ✅ Export-Funktionen (PDF, CSV)
- ✅ Unit Tests (Jest, >70% Coverage)
- ✅ E2E Tests (Playwright)

---

## Prioritäten-Matrix

| Thema                    | Didaktischer Wert | Technische Komplexität | Zielgruppe   | Priorität    |
| ------------------------ | ----------------- | ---------------------- | ------------ | ------------ |
| Bindungspotential        | Hoch              | Mittel                 | Klasse 10-13 | 🟡 Hoch      |
| Hess'sches Gesetz        | Hoch              | Mittel                 | Klasse 11-13 | 🟡 Hoch      |
| Reaktionskinetik         | Sehr Hoch         | Hoch                   | Klasse 10-13 | 🔴 Sehr Hoch |
| Chemisches Gleichgewicht | Sehr Hoch         | Mittel                 | Klasse 10-13 | 🔴 Sehr Hoch |
| Atomenergieniveaus       | Hoch              | Mittel                 | Klasse 9-11  | 🟡 Hoch      |
| Molekülorbitale          | Mittel            | Sehr Hoch              | Klasse 11-13 | 🟢 Mittel    |
| Wärmeleitung             | Mittel            | Mittel                 | Klasse 8-10  | 🟢 Mittel    |
| Druck & Fläche           | Mittel            | Niedrig                | Klasse 7-9   | 🟡 Hoch      |

**Legende:**

- 🔴 Sehr Hoch (Q2 2026)
- 🟡 Hoch (Q3-Q4 2026)
- 🟢 Mittel (2027)

---

## Implementierungs-Checklist

Für jede neue Simulation:

- [ ] Inhaltliche Recherche und Kurrikulumsabgleich
- [ ] UX/UI Design (Wireframes)
- [ ] Technische Architektur (Komponenten, State Management)
- [ ] Implementierung (HTML, CSS, JavaScript)
- [ ] Interaktive Simulation (Canvas/Three.js)
- [ ] Unit Tests (>70% Coverage)
- [ ] E2E Tests (Playwright)
- [ ] Barrierefreiheits-Prüfung (axe DevTools)
- [ ] Performance-Optimierung (Lighthouse >90)
- [ ] Cross-Browser-Testing (Chrome, Firefox, Safari)
- [ ] Mobile Testing
- [ ] Dokumentation
- [ ] Deployment (Staging → Produktion)

---

## Ressourcen

### Vorlage-Seiten (SILC)

- Homepage: https://tcel-hu-berlin.github.io/silc/
- Atombau & Spektroskopie: https://tcel-hu-berlin.github.io/silc/atombau+spektroskopie/
- Periodische Trends: https://tcel-hu-berlin.github.io/silc/periodische+trends/
- Bindungstheorien: https://tcel-hu-berlin.github.io/silc/mo+bindungen/
- Thermodynamik & Kinetik: https://tcel-hu-berlin.github.io/silc/thermo+kinetik/
- Säuren & Basen: https://tcel-hu-berlin.github.io/silc/saeure+basen/
- Redox: https://tcel-hu-berlin.github.io/silc/redox/

### Vorlage-Seiten (Javalab)

- Chemistry Simulations: https://javalab.org/en/category/chemistry_en/
- Torricelli-Versuch: https://javalab.org/en/mdl/projectView.do?projectId=pr10003

### Interne Referenzen

- Bestehende Rechner: /categories/rechner/
- Themenbereiche: /themenbereiche/
- Klassenstufen: /klassenstufen/

---

_Zuletzt aktualisiert: 2026-01-04_
_Nächste Überprüfung: Nach Abschluss von Phase 1 (Q1 2026)_
