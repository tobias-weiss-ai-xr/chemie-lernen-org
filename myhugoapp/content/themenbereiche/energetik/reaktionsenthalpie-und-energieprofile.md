---
title: 'Reaktionsenthalpie und Energieprofile'
description: 'Enthalpiediagramme, Bindungsenergien, Bildungsenthalpien und die Berechnung von Reaktionsenthalpien mit dem Satz von Hess.'
date: '2026-06-18'
last_reviewed: '2026-07-09'
tags: ['chemie', 'enthalpie', 'energieprofil', 'bindungsenergie', 'thermodynamik']
interaktiv: false
schwierigkeit: 'mittelstufe'
teilgebiet: ['energetik']
icon: '🔥'
aliases: [/article/reaktionsenthalpie-und-energieprofile/]
---

Das **Energieprofil** einer Reaktion zeigt den Energiegehalt der Teilchen entlang des Reaktionsweges. Die y-Achse gibt die Enthalpie ($H$) an, die x-Achse den Reaktionsfortschritt. Bei einer **exothermen Reaktion** liegt der Endzustand (Produkte) energetisch tiefer als der Anfangszustand (Edukte) — die Differenz $\Delta H$ ist negativ. Bei einer **endothermen Reaktion** liegt der Endzustand höher — $\Delta H$ ist positiv.

Die **Aktivierungsenergie ($E_A$)** ist die Energieschwelle, die überwunden werden muss, damit die Reaktion beginnt. Selbst exotherme Reaktionen benötigen eine Aktivierungsenergie — ein Katalysator senkt diese Schwelle, verändert aber nicht $\Delta H$.

**Standardbildungsenthalpie ($\Delta H_f^\circ$)** ist die Enthalpieänderung bei der Bildung von 1 mol einer Verbindung aus den Elementen in ihrem Standardzustand ($25 \, \text{°C}$, $1013 \, \text{hPa}$). Elemente im Standardzustand haben per Definition $\Delta H_f^\circ = 0$. Beispiele: $\Delta H_f^\circ(\text{H}_2\text{O}_{\text{(l)}}) = -285,8 \, \text{kJ/mol}$, $\Delta H_f^\circ(\text{CO}_{2\text{(g)}}) = -393,5 \, \text{kJ/mol}$.

Verwandte Rechner: [Satz von Hess](/hess-gesetz/) | [Verbrennungsrechner](/verbrennungsrechner/) | [Reaktionskinetik-Simulator](/reaktionskinetik-simulator/)

Der **Satz von Hess** ermöglicht die Berechnung von Reaktionsenthalpien aus bekannten Bildungsenthalpien: $\Delta H_{\text{Reaktion}} = \sum \Delta H_f^\circ(\text{Produkte}) - \sum \Delta H_f^\circ(\text{Edukte})$. Beispiel für die Verbrennung von Methan: $\Delta H = [\Delta H_f^\circ(\text{CO}_2) + 2 \cdot \Delta H_f^\circ(\text{H}_2\text{O})] - [\Delta H_f^\circ(\text{CH}_4) + 2 \cdot \Delta H_f^\circ(\text{O}_2)] = [-393,5 + 2 \cdot (-285,8)] - [-74,8 + 0] = -890,3 \, \text{kJ/mol}$.

**Bindungsenergien** erklären Enthalpieänderungen auf molekularer Ebene: Energie wird benötigt, um Bindungen zu brechen (endotherm), und wird frei, wenn neue Bindungen gebildet werden (exotherm). Die Reaktionsenthalpie ist die Differenz aus benötigter und freigesetzter Bindungsenergie. $\Delta H = \sum E(\text{gebrochene Bindungen}) - \sum E(\text{gebildete Bindungen})$.

## Übungen

1.  Zeichne ein Energieprofil (Enthalpiediagramm) für eine exotherme Reaktion und beschrifte: Edukte, Produkte, Aktivierungsenergie $E_A$, Reaktionsenthalpie $\Delta H$ und den Übergangszustand. Gib an, ob $\Delta H$ positiv oder negativ ist.

2.  Berechne die Standardreaktionsenthalpie für die Verbrennung von Ethan ($\ce{C2H6}$) mit den gegebenen Standardbildungsenthalpien: $\Delta H_f^\circ(\ce{C2H6}) = -84,7\,\text{kJ/mol}$, $\Delta H_f^\circ(\ce{CO2}) = -393,5\,\text{kJ/mol}$, $\Delta H_f^\circ(\ce{H2O(l)}) = -285,8\,\text{kJ/mol}$. Die vollständige Verbrennung liefert $\ce{CO2}$ und $\ce{H2O}$.

3.  Gegeben sei die Reaktionsfolge:
    - $\ce{C(s) + O2(g) -> CO2(g)}$ mit $\Delta H_1 = -394\,\text{kJ/mol}$
    - $\ce{H2(g) + 1/2 O2(g) -> H2O(l)}$ mit $\Delta H_2 = -286\,\text{kJ/mol}$
    - $\ce{2C(s) + 3H2(g) + 1/2 O2(g) -> C2H5OH(l)}$ mit $\Delta H_3 = -278\,\text{kJ/mol}$
      Berechne mithilfe des Satzes von Hess die Verbrennungsenthalpie von Ethanol: $\ce{C2H5OH(l) + 3O2(g) -> 2CO2(g) + 3H2O(l)}$.

4.  Berechne die Reaktionsenthalpie für die Reaktion $\ce{H2 + Br2 -> 2HBr}$ aus folgenden Bindungsenthalpien: $\ce{H-H} = 436\,\text{kJ/mol}$, $\ce{Br-Br} = 193\,\text{kJ/mol}$, $\ce{H-Br} = 366\,\text{kJ/mol}$. Warum weicht der berechnete Wert meist geringfügig vom experimentellen Messwert ab?

5.  Erkläre den Unterschied zwischen der Aktivierungsenergie $E_A$ und der Reaktionsenthalpie $\Delta H$ in einem Energieprofil. Warum kann eine stark exotherme Reaktion dennoch eine hohe Aktivierungsenergie besitzen? Nenne ein Alltagsbeispiel.

## Verwandte Themen

- [Aktivierungsenergie und Katalysatoren](/themenbereiche/energetik/aktivierungsenergie-und-katalysatoren/) – Warum nicht alle exothermen Reaktionen spontan ablaufen, der Maxwell-Boltzmann-Ansatz, und wie Katalysatoren Reaktionswege verändern.
- [Energie bei chemischen Reaktionen](/themenbereiche/energetik/energie-bei-reaktionen/) – Chemische Reaktionen speichern oder geben Energie frei. Exotherm → Wärmefreigabe, Endotherm → Wärmeaufnahme.
- [Kalorimetrie und Enthalpiemessung](/themenbereiche/energetik/kalorimetrie/) – Grundlagen der Kalorimetrie, Bombenkalorimeter, Bestimmung von Enthalpieänderungen, spezifische Wärmekapazität.
- [Der Satz von Hess](/themenbereiche/energetik/satz-von-hess/) – Die Reaktionsenthalpie ist unabhängig vom Reaktionsweg. Sie kann aus den Bildungsenthalpien der Produkte und Edukte berechnet werden.
