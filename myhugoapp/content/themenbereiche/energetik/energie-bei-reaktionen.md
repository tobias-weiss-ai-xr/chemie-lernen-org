---
title: 'Energie bei chemischen Reaktionen'
description: 'Chemische Reaktionen speichern oder geben Energie frei. Exotherm → Wärmefreigabe, Endotherm → Wärmeaufnahme.'
date: '2026-06-03'
last_reviewed: '2026-07-09'
tags: ['chemie', 'energie', 'thermodynamik', 'enthalpie']
interaktiv: false
schwierigkeit: 'mittelstufe'
teilgebiet: ['energetik']
icon: '🔥'
aliases: [/article/energie-bei-reaktionen/]
---

Jede chemische Reaktion ist mit **Energieänderungen** verbunden. Die umgesetzte Energie wird als **Reaktionsenthalpie** ($\Delta H$) in kJ/mol angegeben.

## Exotherm und Endotherm

**Exotherme Reaktion** ($\Delta H < 0$): Energie wird an die Umgebung abgegeben, Wärme entwickelt. Beispiel: Verbrennung von Methan ($CH_4 + 2O_2 \rightarrow CO_2 + 2H_2O$, $\Delta H = -890$ kJ/mol).

**Endotherme Reaktion** ($\Delta H > 0$): Energie wird aus der Umgebung aufgenommen, Kälteentwicklung. Beispiel: Thermisches Zerfallen von Calciumcarbonat ($CaCO_3 + 36$ kJ/mol).

## Energieprofil und Aktivierungsenergie

Das **Energi diagramm** einer Reaktion zeigt die Enthalpie auf der y-Achse und den Reaktionsfortschritt auf der x-Achse. Zu Beginn liegen die Edukte auf einem bestimmten Energieniveau. Um die Reaktion zu starten, muss ein Energieberg überwunden werden: die **Aktivierungsenergie** $E_A$. Erst danach erreichen die Teilchen den Übergangszustand und bilden die Produkte.

- Bei exothermen Reaktionen liegen die Produkte tiefer als die Edukte ($\Delta H < 0$).
- Bei endothermen Reaktionen liegen die Produkte höher als die Edukte ($\Delta H > 0$).

Ein **Katalysator** senkt die Aktivierungsenergie $E_A$, beschleunigt die Reaktion aber verändert weder $\Delta H$ noch das Gleichgewicht.

## Satz von Hess

Die Reaktionsenthalpie ist unabhängig vom Reaktionsweg. Man kann unbekannte Enthalpien berechnen, indem man thermochemische Gleichungen wie Matrizen addiert oder subtrahiert. Die Regel lautet:

$$\Delta H_{gesamt} = \sum \Delta H_f (\text{Produkte}) - \sum \Delta H_f (\text{Edukte})$$

**Beispiel**: Berechnung der Verbrennungsenthalpie von Ethan ($C_2H_6$).

Gegebene Standardbildungsenthalpien $\Delta H_f^0$:

- $C_2H_6(g)$: $-84$ kJ/mol
- $CO_2(g)$: $-394$ kJ/mol
- $H_2O(l)$: $-286$ kJ/mol

Reaktionsgleichung: $C_2H_6 + \frac{7}{2}O_2 \rightarrow 2CO_2 + 3H_2O$

$$\Delta H = [2 \cdot (-394) + 3 \cdot (-286)] - [(-84) + \frac{7}{2} \cdot 0]$$
$$\Delta H = (-788 - 858) - (-84) = -1646 + 84 = -1562 \text{ kJ/mol}$$

Die Verbrennung von Ethan ist also stark exotherm.

## Bindungsenthalpien

Jede chemische Bindung hat eine charakteristische Bindungsenthalpie, die angibt, wie viel Energie nötig ist, um die Bindung zu spalten. Die Reaktionsenthalpie lässt sich auch über Bindungsenthalpien schätzen:

$$\Delta H \approx \sum \text{Bindungen gebrochen} - \sum \text{Bindungen gebildet}$$

**Beispiel**: Reaktion von $H_2 + Cl_2 \rightarrow 2HCl$. Bindungsenthalpien: $H-H = 436$ kJ/mol, $Cl-Cl = 243$ kJ/mol, $H-Cl = 432$ kJ/mol.

$$\Delta H = (436 + 243) - 2 \cdot 432 = 679 - 864 = -185 \text{ kJ/mol}$$

Das Ergebnis stimmt gut mit dem experimentellen Wert ($-184$ kJ/mol) überein.

## Alltagsrelevanz

**Handwärmer** enthalten Eisenpulver, das in Gegenwart von Sauerstoff exotherm oxidiert: $4Fe + 3O_2 \rightarrow 2Fe_2O_3$, $\Delta H = -1648$ kJ/mol. Aktivkohle und Salz beschleunigen die Reaktion. Einmal luftdicht verpackt, bleibt das Pulver inaktiv; beim Öffnen startet die Oxidation und gibt stundenlang Wärme ab.

**Kühlpacks** (Instant Cold Packs) nutzen die endotherme Lösung von Ammoniumnitrat in Wasser: $NH_4NO_3(s) \rightarrow NH_4^+(aq) + NO_3^-(aq)$, $\Delta H = +25,7$ kJ/mol. Das Gitter wird aufgebrochen und die Ionen hydratisiert, beides kostet Energie, die der Umgebung entzogen wird. Die Packung kühlt rasch auf etwa 0°C ab.

**Photosynthese** ist eine der wichtigsten endothermen Reaktionen auf der Erde: $6CO_2 + 6H_2O \xrightarrow{Licht} C_6H_{12}O_6 + 6O_2$, $\Delta H = +2803$ kJ/mol. Pflanzen absorbieren Sonnenlicht, um $CO_2$ und Wasser in Glucose und Sauerstoff umzuwandeln. Ohne diese kontinuierliche Energiezufuhr aus Licht könnte die Reaktion nicht ablaufen.

Energiebilanzen sind wichtig: Exotherme Reaktionen können zur Wärmegewinnung genutzt werden (Heizung, Kraftwerke). Endotherme Reaktionen benötigen kontinuierliche Energiezufuhr (sie finden in der Natur meist nicht spontan statt).
