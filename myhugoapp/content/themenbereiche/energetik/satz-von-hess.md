---
title: 'Der Satz von Hess'
description: 'Die Reaktionsenthalpie ist unabhängig vom Reaktionsweg. Sie kann aus den Bildungsenthalpien der Produkte und Edukte berechnet werden.'
date: '2026-06-08'
last_reviewed: '2026-07-09'
tags: ['chemie', 'hess', 'enthalpie', 'thermochemie']
interaktiv: false
schwierigkeit: 'oberstufe'
teilgebiet: ['energetik']
icon: '🔥'
aliases: [/article/satz-von-hess/]
---

Der **Satz von Hess** (entdeckt 1840 vom Schweizer Chemiker Germain Henri Hess) ist ein fundamentales Prinzip der Thermochemie. Er besagt: Die Reaktionsenthalpie ($\Delta H$) einer chemischen Reaktion hängt nur vom Anfangs- und Endzustand ab, nicht vom Reaktionsweg. Dies ist möglich, weil die Enthalpie $H$ eine **Zustandsgröße** ist – ihr Wert wird allein durch den aktuellen Zustand des Systems bestimmt, nicht durch die Art und Weise, wie dieser Zustand erreicht wurde.

## Anwendung des Hess'schen Satzes

Der Satz von Hess erlaubt die Berechnung von Enthalpien für Reaktionen, die experimentell schwer oder gar nicht direkt messbar sind. Die grundlegende Berechnungsformel lautet:

$$\Delta H_{Reaktion} = \sum \Delta H_f^0(Produkte) - \sum \Delta H_f^0(Edukte)$$

Dabei ist $\Delta H_f^0$ die **Standardbildungsenthalpie** eines Stoffes (in kJ/mol bei 25 °C und 1 bar). Elemente in ihrer stabilsten Form (z. B. $\ce{O2}$, $\ce{H2}$, $\ce{C_{(Graphit)}}$) haben definitionsgemäß $\Delta H_f^0 = 0$ kJ/mol.

## Beispielrechnung: Verbrennung von Methan

Die Verbrennungsreaktion von Methan lässt sich sowohl direkt als auch über den Hess'schen Satz berechnen:

$$\ce{CH4 + 2O2 -> CO2 + 2H2O}$$

| Stoff            | $\Delta H_f^0$ (kJ/mol) |
| ---------------- | ----------------------- |
| $\ce{CH4}$       | −74,8                   |
| $\ce{O2}$        | 0                       |
| $\ce{CO2}$       | −393,5                  |
| $\ce{H2O}_{(g)}$ | −241,8                  |

$$\Delta H = [1 \times (-393{,}5) + 2 \times (-241{,}8)] - [1 \times (-74{,}8) + 2 \times 0]$$
$$\Delta H = (-393{,}5 - 483{,}6) - (-74{,}8) = -877{,}1 + 74{,}8 = -802{,}3 \text{ kJ/mol}$$

Der negative Wert zeigt, dass es sich um eine **exotherme Reaktion** handelt.

## Reaktionszyklen und alternative Wege

Der Hess'sche Satz macht sich zunutze, dass thermochemische Gleichungen wie algebraische Gleichungen behandelt werden können. Man kann Reaktionsgleichungen addieren, subtrahieren und mit Faktoren multiplizieren. Dabei wird stets der zugehörige $\Delta H$-Wert mitverarbeitet.

Ein klassisches Beispiel ist die Bildung von Kohlenmonoxid aus Kohlenstoff. Die direkte Verbrennung von $\ce{C}$ zu $\ce{CO}$ liefert immer auch $\ce{CO2}$ als Nebenprodukt, weshalb $\Delta H_f^0$ für $\ce{CO}$ nicht direkt messbar ist. Über den Umweg der vollständigen Verbrennung von $\ce{C}$ zu $\ce{CO2}$ und der anschließenden Verbrennung von $\ce{CO}$ zu $\ce{CO2}$ lässt sich der Wert jedoch berechnen.

## Bedeutung in der Industrie

In der chemischen Industrie ist der Satz von Hess essentiell für die thermodynamische Optimierung von Prozessen. Bevor eine neue Synthese im großen Maßstab umgesetzt wird, können Chemiker die Energiebilanz berechnen, ohne aufwändige Experimente durchführen zu müssen. Dies spart Kosten und ermöglicht die Identifikation besonders energieeffizienter Reaktionswege. Auch bei der Entwicklung neuer Brennstoffe und Batterietechnologien kommt der Hess'sche Satz zur Anwendung.

## Übungen

1. Berechne die Reaktionsenthalpie für die Verbrennung von Ethanol: $\ce{C2H5OH + 3O2 -> 2CO2 + 3H2O}$. Gegeben: $\Delta H_f^0(\ce{C2H5OH}) = -277{,}6$ kJ/mol, $\Delta H_f^0(\ce{CO2}) = -393{,}5$ kJ/mol, $\Delta H_f^0(\ce{H2O}_{(g)}) = -241{,}8$ kJ/mol.

2. Die Bildung von $\ce{NO}$ aus den Elementen ist stark endotherm. Berechne $\Delta H$ für $\ce{1/2 N2 + 1/2 O2 -> NO}$, wenn $\Delta H_f^0(\ce{NO}) = +90{,}3$ kJ/mol beträgt. Erkläre, warum der Wert positiv ist.

3. Gegeben sei die Reaktionsgleichung $\ce{CaCO3 -> CaO + CO2}$. Recherchiere die Standardbildungsenthalpien und berechne die benötigte Wärmemenge für die Zerlegung von 100 g $\ce{CaCO3}$ (Hinweis: $n = m/M$).

4. Überprüfe rechnerisch, ob die folgende Reaktion exotherm oder endotherm ist: $\ce{N2 + 3H2 -> 2NH3}$. $\Delta H_f^0(\ce{NH3}) = -45{,}9$ kJ/mol.

5. Formuliere einen Reaktionszyklus, um $\Delta H_f^0$ für $\ce{CO}$ mithilfe der Verbrennungswärmen von $\ce{C}$ und $\ce{CO}$ zu berechnen.

## Verwandte Themen

- [Energie bei chemischen Reaktionen](/themenbereiche/energetik/energie-bei-reaktionen/)
- [Reaktionsenthalpie und Energieprofile](/themenbereiche/energetik/reaktionsenthalpie-und-energieprofile/)
- [Kalorimetrie und Enthalpiemessung](/themenbereiche/energetik/kalorimetrie/)
- [Aktivierungsenergie und Katalysatoren](/themenbereiche/energetik/aktivierungsenergie-und-katalysatoren/)

## Zusammenfassung

Der Satz von Hess besagt, dass die Reaktionsenthalpie einer chemischen Reaktion unabhängig vom Reaktionsweg ist, da die Enthalpie eine Zustandsgröße darstellt. Die Berechnung erfolgt über die Differenz der Standardbildungsenthalpien von Produkten und Edukten. Das Prinzip ist grundlegend für die thermodynamische Planung chemischer Prozesse und erlaubt die Bestimmung von Enthalpien, die experimentell nicht direkt zugänglich sind.
