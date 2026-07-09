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
