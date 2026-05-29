---
title: 'Molekülorbitale'
description: 'Interaktive 3D-Visualisierung von Molekülorbitalen, σ- und π-Bindungen, Orbital-Überlappung und Hybridsierung'
date: 2026-01-05
type: 'interactive'
interaktiv: true
layout: 'molekuelorbitale'
icon: '🔬'
schwierigkeit: 'fortgeschritten'
teilgebiet: ['molekuel', 'bindung', 'orbitale', 'quantenmechanik', 'hybridisierung']
tags: ['molekuelorbitale', 'sigma-pi', 'orbital-ueberlappung', 'hybridisierung', 'mo-theorie', 'vb-theorie', 'three-js']
---

## Molekülorbitale

Erkunden und visualisieren Sie Molekülorbitale in 3D mit σ- und π-Bindungen, Orbital-Überlappung, Hybridsierung und dem Vergleich von Valenzbindungs- (VB) und Molekülorbitaltheorie (MO).

### Funktionen

- **3D-Orbital-Rendering:** Interactive Three.js-Visualisierung von s, p, d Orbitals und Molekülorbitalen
- **σ- und π-Bindungen:** Vergleichende Visualisierung mit Orbitalüberlappungsanimation
- **Hybridsierung-Switch:** sp, sp², sp³, sp³d mit Beispielmolekülen
- **Linearkombination (LCAO):** Wie Atomorbitale zu Molekülorbitalen kombiniert werden
- **MO vs VB Vergleich:** Theoretische Erklärungen mit interaktiven Beispielen

### Grundkonzept

**Molekülorbitale (MOs):** Entstehende Orbitale, wenn sich Atomorbitale (AOs) überlappen und linear kombinieren

- **σ-Orbitale:** Kopf-zu-Kopf-Überlapp entlang der Kernachse (stärkste Bindung)
- **π-Orbitale:** Seitlicher Überlapp senkrecht zur Kernachse (schwächer)
- **Gebundende MOs:** Energieniedrig, stabilen Bindungen
- **Antibindende MOs:** Energiereich, destabilisieren Bindungen (entweder gefüllt oder leer)

### σ vs π Bindungen: Unterschiede

| Eigenschaft | σ-Bond | π-Bond |
|------------|---------|---------|
| **Überlapp** | Kopf-zu-Kopf | Seitlich |
| **Symmetrie** | Rotationssymmetrisch um Bindungsachse | Planar, nicht rotationssymmetrisch |
| **Stärke** | Stark (meist stärkste Bindung) | Schwächer als σ |
| **Moleküle** | Einfachbindungen, Doppel- und Dreifachbindungen enthalten σ in jedem Fall | Nur in Doppel- und Dreifachbindungen |

### Hybridsierungstypen

#### 1. sp-Hybridisierung (linear, 180°)
- **Beispiel:** Acetylen (C₂H₂), BeCl₂, CO₂
- **Hybridorbitale:** sp (50% s + 50% p)
- **Geometrie:** Linear, 180° Bindungswinkel
- **Mögliche Bindungen:** 2 σ-Bindungen + 2 π-Bindungen in C₂H₂

#### 2. sp²-Hybridisierung (trigonal planar, 120°)
- **Beispiel:** Ethen (C₂H₄), BF₃, AlCl₃
- **Hybridorbitale:** sp² (33% s + 67% p)
- **Geometrie:** Trigonal planar, 120°
- **Mögliche Bindungen:** 3 σ-Bindungen + 1 π-Bond

#### 3. sp³-Hybridisierung (tetraedrisch, 109.5°)
- **Beispiel:** Methan (CH₄), Ammoniak (NH₃), Wasser (H₂O)
- **Hybridorbitale:** sp³ (25% s + 75% p)
- **Geometrie:** Tetraedrisch, 109.5° (tetraedrischer Winkel)
- **Mögliche Bindungen:** 4 σ-Bindungen

#### 4. sp³d-Hybridisierung (trigonal-bipyramidal)
- **Beispiel:** PCl₅, SF₄
- **Hybridorbitale:** sp³d (20% s + 60% p + 20% d)
- **Geometrie:** Trigonal-bipyramidal

### Wie diese Theorie erklärt Bindungen

**LCAO-Methode (Linear Combination of Atomic Orbitals):**

$\psi_{MO} = \sum_i c_i \phi_i$

Dabei kombinieren zwei Atomorbitale $(\phi_1, \phi_2)$ zu einem Molekülorbital $(\psi_{bonding}, \psi_{antibonding})$:

- **Gebundendes $\psi = \phi_1 + \phi_2$:** Konstruktiv, energieniedrig
- **Antibindendes $\psi^* = \phi_1 - \phi_2$:** Destruktiv, energetisch höher

### Experimente

1. **Ethen (C₂H₄) - sp²-Hybridisierung:**
   - Visualisiere σ- und π-Überlappungen
   - Zeige, wie π-Bindungen in Doppelbindungen energiereicher sind
   - Verstehen: Elektronenpaarbindung und asymmetrische Strukturen
2. **Ethin (C₂H₂) - sp-Hybridisierung:**
   - Visualisiere σ- (C-H) + π- (C-C) Bindungen in der Dreifachbindung
   - Vergleiche Linearkombination und Flexibilität
3. **Methan (CH₄) - sp³-Hybridisierung:**
   - Visualisiere tetraedrische Geometrie
   - Typischer Hybridisierungsfall

### Vergleich MO vs. VB

| Eigenschaft | MO-Theorie | VB-Theorie |
|-------------|------------|-----------|
| **Orbitale** | Molekülorbitale (über das ganze Molekül delokalisiert) | Atomorbitale (klassische Valenzorbitale) |
| **Elektronenverteilung** | Delokalisiert über ganze Molekül | Lokalisiert zwischen zwei Atomkernen |
| **Energie-Modelle** | Auf einzelne MOs beschränkt (auf/ab) | Berechnet, basierend auf Elektrostatik |
| **Erklärungsstärke** | Einfacher für Übergangsmetalle, eingeschränkter für organische Chemie | Einfacher für konventionelle organische Chemie (Valenz, Hybridisierung) |
| **Anwendungsbereich** | Anorganische, Festkörper, π-Systeme | Organische, klassische Chemie, Hybridisierung |

### Wann welche Theorie?

MO-Theorie eignet sich besonders für:
- Anorganische Komplexe und metallorganische Chemie
- π-Systeme mit Delokalisierung (Aromaten, Konjugation)

VB-Theorie eignet sich besonders für:
- Klassische organische Mechanismen und Hybridisierung
- Empirisches Verständnis (Stereochemie, Geometrie)

### So funktioniert diese Simulation

1. Wählen Sie ein Beispiel-Molekül  
2. Betrachten Sie 3D-Visualisierung (drehen, zoom)
3. Umschalten: σ vs π, bindend vs. antibindend
4. Verstehen: Orbital-Überlapp erklärt die Bindungsstärken

**Erläuterungen:**
- ⚫ Dunkle Flächen = Knoten (ψ=0)
- 🔵 Rote/Grüne Farbverläufe = Phase konstruktiv vs. destruktiv
- 🎯 Kernachse und Achsen dargestellt

**Wichtige Prinzipien:**
1. **Orbitalknoten:** Wo ψ=0 → keine Elektronendichte (Phasenumkehr)
2. **Antibindende Orbitale:** Anordnung von Elektronen destabilisiert das Molekül
3. **Symmetrie:** Molekülorbitaltypen basieren auf Molekülsymmetrie (C∞v, D₄h, etc.)
4. **Hund's Regel:** Elektronen besetzen entartete Orbitale einzeln (möglich)
5. **Aufbauprinzip:** Bindende MOs werden zuerst besetzt, dann antibindende MOs