---
title: 'Temperatur & Teilchenbewegung'
description: 'Interaktive Visualisierung des Zusammenhangs zwischen Temperatur und Teilchengeschwindigkeit in Gasen'
date: 2026-01-04
last_reviewed: 2026-07-09
type: 'interactive'
interaktiv: true
layout: 'temperatur-teilchenbewegung'
icon: '🌡️'
schwierigkeit: 'mittel'
teilgebiet: ['thermodynamik', 'temperatur', 'kinetik', 'thermik']
tags: ['temperatur', 'teilchenbewegung', 'kinetische-energie', 'maxwell-boltzmann', 'gase', 'momente']
---

## Temperatur & Teilchenbewegung

Simulieren und visualisieren Sie den direkten Zusammenhang zwischen Temperatur und Teilchengeschwindigkeit in Gasen (kinetische Theorie).

### Funktionen

- **Temperatur-Steuerung:** Regulieren Sie die Temperatur (-100°C bis 500°C)
- **Echtzeit-Visualisierung:** Beobachten Sie Geschwindigkeitsverteilung und Maxwell-Boltzmann-Kurve
- **Vergleichmodus:** Überprüfen, wie verschiedene Temperaturen die Geschwindigkeitsverteilung ändern
- **Kinetic Energy Calc:** Berechnen Sie Ek = ½mv² pro Teilchen
- **Druckbeobachtung:** Simulieren Sie Druckaufschläge durch Teilchenkollisionen auf Behälterwand

### Grundkonzept

**Temperatur ist ein Maß für die die mittlere kinetische Energie der Teilchen:**

$\T \propto \overline{E_k} \propto \overline{v^2}$

- Höhere Temperatur → schneller bewegte Teilchen → mehr Kollisionen → höherer Druck
- Niedrigere Temperatur → langsamere Teilchen → weniger Kollisionen → niedrigerer Druck
- **Absoluter Nullpunkt (0 K = -273,15°C):** Theoretisch alles Teilchen ruhen

### Wie Temperatur Teilchenbewegung beeinflusst (Mikroskopisch)

1. **Bei erhöhter Temperatur:**
   - Teilchen bewegen sich schneller (v 平均 ↑)
   - Kollisionsrate ↑ (mehr Stoß pro Sekunde)
   - Kinetische Energie ↑ (Ek = ½mv² ↑)
   - Ausbreitungs-Distanz ↑ (bis Wände)
2. **Bei sinkender Temperatur:**
   - Teilchen bewegen sich langsamer (v 平均 ↓)
   - Kollisionsrate ↓
   - Kinetische Energie ↓
   - Kräftegleichgewicht fähirt zu Gas kondensiert
3. **Druckauswirkung:**
   - Druck = Kraft / Fläche
   - Jede Kollision übt Kraft F auf die Wand aus
   - F = Δp/Δt (Impulsübertrag)

### Gesetzbeziehungen

**Kinetic Energy:**

$E_k = \frac{1}{2}mv^2$

**Average Kinetic Energy (Gase):**

$\overline{E_k} = \frac{3}{2}k_BT$

T = absolute Temperatur (K), kB = Boltzmann-Konstante

**Maxwell-Boltzmann-Geschwindigkeitsverteilung:**

$f(v) = 4\pi \left(\frac{m}{2\pi k_B T}\right)^{3/2} v^2 \mathrm{e}^{-mv^2/(2k_B T)}$

**Ideale Gasgesetz:**

$pV = nRT$

- p = Druck (Pa)
- V = Volumen (m³)
- n = Molzahl
- R = universelle Gaskonstante (=8.314 J/(mol·K))
- T = absolute Temperatur (K)

### Experimente

1. **Niedrige Temperatur (-100°C):**
   - Langsame Teilchenbewegung
   - Niedriger Druck
   - Geringe Kollisionen
   - Bei -273°C (0K) ruhen Teilchen theoretisch
2. **Raumtemperatur (20°C):**
   - Moderate Geschwindigkeit (ca. 500 m/s für N₂-Moleküle)
   - Kollisionen-ca. 10⁹ /s
   - Behälterdruck ca. 1 atm
3. **Hohe Temperatur (300°C):**
   - Sehr schnelle Teilchen (> 1000 m/s)
   - Hoher Druck
   - Schnelle Expansion und Kollisionenrate

### So funktioniert die Simulation

1. Wählen Sie die Temperatur
2. Starten Sie die Animation
3. Beobachten: Rote Teilchen (schnell) treffen auf Behälterwand
4. Verstehen: Die Maxwell-Boltzmann-Kurve zeigt Geschwindigkeitsverteilung

### Herausforderungen

**Was passiert bei extremen Temperaturen?**
- **Bei -273°C (0K):** Alle Grundzustände civil; Teilchen haben keine kinetische Energie
- **Sehr hohe T:** Teilchenbewegung ist extrem schnell, idealisiert aber Vakuum bis kritische Punkte erreicht

**Warum nicht alle Gase gleiche Dichte?**
- Unterschiedliche Molekülmassen m variieren
- Bei gleicher T: schwere Moleküle sind langsamer
- Bei gleichem Druck: schwerere Gase haben niedrigere T