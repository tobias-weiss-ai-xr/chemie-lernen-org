---
title: 'Wärmeleitung'
description: 'Interaktive Visualisierung der Wärmeleitung durch Konduktion in verschiedenen Materialien'
date: 2026-01-04
type: 'interactive'
interaktiv: true
layout: 'waermeleitung'
icon: '🔥'
schwierigkeit: 'mittel'
teilgebiet: ['thermodynamik', 'waerme', 'konvektion']
tags: ['waermeleitung', 'konduktion', 'fourier', 'thermodynamik', 'materialien']
---

## Wärmeleitung (Konduktion)

Simulieren und visualisieren Sie die Ausbreitung von Wärme in verschiedenen Materialien durch direkte Elektronen- und Phononen-Stöße an Partikel-Ebene.

### Funktionen

- **Interaktive Materialwahl:** Wählen Sie unterschiedliche Materialien (Metalle, Halbleiter, Isolatoren)
- **Zeitverlauf-Animation:** Visualisieren Sie den Wärmefluss in Echtzeit
- **Partikel-Modell:** Beobachten Sie Energiübertragung durch Elektronen-/Phononenwechselwirkung
- **Vergleichsmodus:** Vergleichen Sie verschiedene Wärmeleitfähigkeiten (λ, W/m·K)
- **Fouriersches Gesetz:** Experimentelle Bestätigung: $q = -k \cdot \frac{dT}{dx}$

### Grundkonzept

Wärmeleitung (Konduktion) ist die Übertragung von thermischer Energie durch:
- **Elektronenleitung (Metalle):** Freie Elektronen transportieren schnell Wärme
- **Phononenleitung (nichtelektrische Leiter):** Atomare Schwingungen (Gitterwellen)
- **Molekülaufprall (Gase):** Stoßübertragung zwischen schnelleren und langsameren Molekülen

### Wie Wärmeleitung funktioniert (Mikroskopisch)

1. **Quelle heizt auf:**
   - Atome an der warmen Seite schwingen schneller
   - Sidebar: Elektronen (Metalle) oder Gitterschwingungen übertragen Energie
2. **Energie weiterleiten:**

   - Elektronen (Metalle): Kollisionsstöße zwischen beweglichen Elektronen
   - Phononen (Halbleiter/Isolatoren): Gitterleichwellungen breiten sich weiter
   - Gase: Schnellere Moleküle stoßen langsamer an, übertragen kinetische Energie

3. **Quellenwärmfließt:**
   - Temperaturgradient → Energiedichdifferenz → konvektionsfreies Fließen

### Experimente

1. **Metalle (gute Leiter):**
   - Kupfer (λ ~ 400 W/m·K): Wärme breitet sich schnell
   - Eisen (λ ~ 80 W/m·K): Mittlere Leitung
2. **Halbleiter:**
   - Silizium (λ ~ 150 W/m·K): Moderat, temperaturabhängig过高
3. **Isolatoren:**
   - Glas (λ ~ 1 W/m·K): Sehr langsam
   - Hol杪 (λ ~ 0.15 W/m·K): Äußerst langsam

### Die mathematische Beziehung (Fourier)

**Nach Fouriers Gesetz:**

$q = -k \cdot \frac{dT}{dx}$

- $q$ = Wärmestromdichte (W/m²)
- $k$ = Wärmeleitfähigkeit (W/m·K)
- $\frac{dT}{dx}$ = Temperaturgradient (K/m)

### So funktioniert die Simulation

1. Wählen Sie ein Material
2. Starten Sie die Animation
3. Beobachten: Rote Partikel (heiß) stoßen an blauen Partiklen (kalt)
4. Verstehen: Übertragungsgeschwindigkeit spiegelt Wärmeleitfähigkeit wider