---
title: "Dampfdruck-Rechner"
description: "Berechnet den Dampfdruck von reinen Flüssigkeiten nach der Clausius-Clapeyron-Gleichung. Eingabetemperatur, Normaldruck, Siedetemperatur."
date: "2026-06-03"
tags: ["chemie", "dampfdruck", "phasenübergang", "flüssig", "gasförmig"]
interaktiv: true
schwerigkeit: "mittelstufe"
teilgebiet: ["energetik"]
icon: "💨"
layout: "dampfdruck-rechner"
---

## Dampfdruck-Rechner

Der Dampfdruck beschreibt, wie viel Druck der Gasphase einer Flüssigkeit im Gleichgewicht entsteht. Clausius-Clapeyron-Gleichung:

$$ \ln P = -\\frac{\\Delta H_{vap}}{R} \\cdot \\frac{1}{T} + C $$

Where:
- $P$ = Dampfdruck (Pa oder bar)
- $T$ = Temperatur (K)
- $\\Delta H_{vap}$ = Siedepunktenthalpie (J/mol)

**Beispiel**: Wasser bei $25\\degree C$ hat $P ≈ 3.17$ kPa. Der Rechner verwendet eine vereinfachte Form der Clausius-Clapeyron-Gleichung.

### Werte eingeben

- **Temperatur** ($T$): Die jetzige Temperatur der Flüssigkeit (in $\\degree C$)
- **Normaldruck** ($P_0$): Atmosphärendruck, typischerweise $1.013$ bar ($1$ atm)
- **Siedetemperatur** ($T_{ boil}$): Die Siedetemperatur der Flüssigkeit ($\\degree C$)

### Ausgabe

Der Rechner zeigt:
- Dampfdruck (Pa und bar)
- Druck in kPa
- Vergleich zum Normaldruck

### Hinweise

- Bei Normalbedingungen gilt: $T = T_{ boil}$ → $P = P_0$ (Siedepunkt erreicht)
- Temperatur sollte im Bereich zwischen $-100\\degree C$ und $500\\degree C$ liegen
- Bei hoher Temperatur nähert sich der Dampfdruck dem kritischen Druck der Flüssigkeit