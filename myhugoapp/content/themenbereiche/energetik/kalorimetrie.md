---
title: 'Kalorimetrie und Enthalpiemessung'
description: 'Grundlagen der Kalorimetrie, Bombenkalorimeter, Bestimmung von Enthalpieänderungen, spezifische Wärmekapazität.'
date: '2026-07-09'
last_reviewed: '2026-07-09'
tags: ['chemie', 'energetik', 'kalorimetrie', 'enthalpie', 'messung']
interaktiv: false
schwierigkeit: 'mittelstufe'
teilgebiet: ['energetik']
icon: '🌡️'
aliases: [/article/kalorimetrie-und-enthalpiemessung/]
---

Die **Kalorimetrie** ist die experimentelle Methode zur Messung von Wärmemengen, die bei chemischen Reaktionen oder physikalischen Prozessen freigesetzt oder aufgenommen werden. Das zentrale Messgerät ist das **Kalorimeter** — ein isoliertes System, das den Wärmeaustausch mit der Umgebung minimiert.

Die grundlegende Gleichung der Kalorimetrie lautet:

$$
q = c \cdot m \cdot \Delta T
$$

Dabei ist $q$ die übertragene Wärmemenge (in Joule), $c$ die spezifische Wärmekapazität ($\text{J} \cdot \text{g}^{-1} \cdot \text{K}^{-1}$), $m$ die Masse der Probe (in g) und $\Delta T$ die Temperaturänderung (in K oder °C).

## Aufbau und Funktionsweise

Ein **einfaches Kalorimeter** (z. B. Styroporbecher-Kalorimeter) besteht aus einem isolierten Gefäß mit Rührer und Thermometer. Es eignet sich für Messungen bei konstantem Druck — die gemessene Wärme entspricht der **Enthalpieänderung $\Delta H$**.

Ein **Bombenkalorimeter** ($Q_{\text{V}}$) wird für Verbrennungsreaktionen genutzt. Die Probe wird in einer geschlossenen Stahlbombe mit Sauerstoff unter Druck verbrannt. Die Messung erfolgt bei konstantem Volumen, sodass die gemessene Wärme der **inneren Energieänderung $\Delta U$** entspricht.

Die Wärmekapazität $C_{\text{Kal}}$ des Kalorimeters (der sogenannte **Kalorimeterfaktor**) wird durch Kalibration mit einem Stoff bekannter Verbrennungswärme (z. B. Benzoesäure, $\Delta H_{\text{c}} = -3227 \, \text{kJ/mol}$) bestimmt:

$$
C_{\text{Kal}} = \frac{q}{\Delta T}
$$

## Anwendungen der Kalorimetrie

Die Kalorimetrie findet breite Anwendung in der **Lebensmittelchemie** (Brennwertbestimmung), der **Materialwissenschaft** (Wärmekapazität von Werkstoffen) und der **Reaktionskinetik** (Reaktionsenthalpien). Die **Dynamische Differenzkalorimetrie (DSC)** ermöglicht die Untersuchung von Phasenübergängen wie Schmelzen, Kristallisieren und Glasübergängen.

Beispiel: Die Verbrennung von 1,00 g Glucose ($\ce{C6H12O6}$) im Bombenkalorimeter ergibt eine Temperaturerhöhung von 3,64 K bei $C_{\text{Kal}} = 8,52 \, \text{kJ/K}$. Die freigesetzte Wärme beträgt:

$$
q = C_{\text{Kal}} \cdot \Delta T = 8,52 \cdot 3,64 = 31,0 \, \text{kJ}
$$

Die molare Verbrennungsenthalpie ist dann:

$$
\Delta H_{\text{c}} = -\frac{31,0}{1,00 / 180,16} = -5580 \, \text{kJ/mol}
$$

## Übungen

1. In einem Kalorimeter mit $C_{\text{Kal}} = 5,20 \, \text{kJ/K}$ werden 2,50 g Benzoesäure ($\ce{C7H6O2}$, $M = 122,12 \, \text{g/mol}$) verbrannt. Die Temperatur steigt um 4,12 K. Berechne $\Delta H_{\text{c}}$ der Benzoesäure.

2. 200 mL Wasser ($c = 4,18 \, \text{J} \cdot \text{g}^{-1} \cdot \text{K}^{-1}$) in einem Styroporbecher-Kalorimeter werden mit 50 mL 1 M $\ce{HCl}$ und 50 mL 1 M $\ce{NaOH}$ versetzt. Die Temperatur steigt von 21,0 °C auf 24,5 °C. Berechne die Neutralisationsenthalpie.

3. Erkläre den Unterschied zwischen der Messung bei konstantem Volumen (Bombenkalorimeter) und konstantem Druck (offenes Kalorimeter). Warum unterscheiden sich $\Delta U$ und $\Delta H$?

## Verwandte Themen

- [Aktivierungsenergie und Katalysatoren](/themenbereiche/energetik/aktivierungsenergie-und-katalysatoren/) – Warum nicht alle exothermen Reaktionen spontan ablaufen, der Maxwell-Boltzmann-Ansatz, und wie Katalysatoren Reaktionswege verändern.
- [Energie bei chemischen Reaktionen](/themenbereiche/energetik/energie-bei-reaktionen/) – Chemische Reaktionen speichern oder geben Energie frei. Exotherm → Wärmefreigabe, Endotherm → Wärmeaufnahme.
- [Reaktionsenthalpie und Energieprofile](/themenbereiche/energetik/reaktionsenthalpie-und-energieprofile/) – Enthalpiediagramme, Bindungsenergien, Bildungsenthalpien und die Berechnung von Reaktionsenthalpien mit dem Satz von Hess.
- [Der Satz von Hess](/themenbereiche/energetik/satz-von-hess/) – Die Reaktionsenthalpie ist unabhängig vom Reaktionsweg. Sie kann aus den Bildungsenthalpien der Produkte und Edukte berechnet werden.

## Zusammenfassung

Die Kalorimetrie ist die experimentelle Grundlage der Thermochemie. Die Wärmemenge wird über die Temperaturänderung und die Wärmekapazität des Systems bestimmt. Einfache Kalorimeter messen bei konstantem Druck ($\Delta H$), Bombenkalorimeter bei konstantem Volumen ($\Delta U$). Die Kalibration mit Referenzsubstanzen ist essenziell für genaue Messungen.
