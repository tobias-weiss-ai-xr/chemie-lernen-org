---
title: 'Konvektion'
description: 'Interaktive Visualisierung der Wärmeübertragung durch Konvektion in Flüssigkeiten und Gasen'
date: 2026-01-04
last_reviewed: 2026-07-09
type: 'interactive'
interaktiv: true
layout: 'konvektion'
icon: '🌊'
schwierigkeit: 'mittel'
teilgebiet: ['thermodynamik', 'waerme', 'konvektion', 'fluiddynamik']
tags: ['konvektion', 'waermeuebertragung', 'fluide', 'thermodynamik', 'buenussentrieb']
---

## Konvektion (Wärmeübertragung in Flüssigkeiten und Gasen)

Simulieren und visualisieren Sie die Wärmeübertragung durch Konvektion in Flüssigkeiten und Gasen mit Partikelanimation und Strömungsverhalten.

### Funktionen

- **Multi-Medien-Simulation:** Wechseln zwischen Wasser, Luft, Öl mit unterschiedlichen Dichten
- **Heizelement-Steuerung:** Regulieren Sie die Temperatur (oben/unten) für natürliche Konvektion
- **Partikel-Farbänderung:** Visualisieren Sie Temperaturaustausch über Farbverläufe
- **Strömungsgeschwindigkeit:** Vergleichen Sie Auftriebskrafteinwirkung bei verschiedenen Dichten
- **Dichte-Temperatur-Beziehung:** Verstehen: ρ = ρ₀ · (1 - β · (T - T₀))

### Grundkonzept

Konvektion ist Wärmüebertragung durch Massenfluss:
- **Freie (natürliche) Konvektion:** Dichtegradient → Auftrieb → Strömung (z.B. warme Luft steigt)
- **Erzwungene Konvektion:** Pumpen/Ventilatoren erzwingen Strömung (z.B. Lüfter)
- **Mischkonvektion:** Natürlicher Auftrieb + erzwungene Strömung

### WieKonvektion funktioniert (Mikroskopisch)

1. **Geheiztes Fluid dichter:**
   - Bei festem Druck: Volumen expandiert (Gay-Lussac) → ρ sinkt
   - ρ = m/V, bei V↑ → ρ↓
2. **Auftriebskrεδ成果 (Archimedes):**
   - F_A = (ρ_umgebend - ρ_fluid) · g · V
   - Wenn ρ_fluid < ρ_umgebend: F_A > 0 (nach oben)
3. **Strömungen entstehen:**
   - Leichtes Fluid steigt, schweres sinkt → Konvektionsströmung
4. **Wärme dispersiert:**
   - Heißes Fluid mischt mit kaltem → Worm anomal配Ausgleich

### Beispielmaterialien

| Material | Zustand | Dichte (g/cm³ bei 20°C) | Steiggeschwindigkeit |
|----------|---------|------------------------|---------------------|
| Luft | Gas | 0.0012 | Langsam |
| Wasser | Flüssigkeit | 1.0 | Mittel |
| Öl | Flüssigkeit | 0.9 | Schneller |
| Glycerin | Flüssigkeit | 1.26 | Langsam |

### Experimente

1. **Wasser (Standard):**
   - Dichte ~1 g/cm³ bei 20°C, sinkt auf ~0.958 bei 100°C
   - Auftriebskrδft erzeugt moderate Konvektion
2. **Luft (Gas):**
   - Geringe Dichte ∀ T, leichte Konvektionsströmungen
   - Himmlische Fühl: warme Luft steigt (der Grund für Heizung)
3. **Öl (Viskös):**
   - Höhere Viskosität → Strömungsgeschwindigkeit schmeller
   - Stablere Konvektionsmuster

### Die mathematische Beziehung

**Wärmeübergangskoeffizient (h):**

$Q = h \cdot A \cdot (T_{heiß} - T_{kalt})$

- $Q$ = Wärmestrom (W)
- $h$ = Wärmeübergangskoeffizient (W/m²·K)
- $A$ = Oberfläche (m²)
- $T_{heiß} - T_{kalt}$ = Temperaturdifferenz (K)

**Nußelt-Zahl für Konvektion:**

$Nu = C \cdot Ra^{n}$

- $Nu$ = Nußelt-Zahl
- $Ra$ = Rayleigh-Zahl (Kombination aus Auftrieb und Diffusion)

### So funktioniert die Simulation

1. Wählen Sie das Material
2. Heizen Sie das Fluid (unten)
3. Beobachten aufsteigende (rote) & sinkende (blaue) Partikel
4. Verstehen: Auftriebskraft steuert Konvéktionsgeschwindigkeit