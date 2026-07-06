---
title: 'Thermische Analyse: Methoden und Anwendungen'
description: 'Thermische Analyseverfahren untersuchen physikalische und chemische Eigenschaften von Stoffen in Abhängigkeit von der Temperatur – TG, DTA, DSC.'
date: '2026-07-06'
tags: ['chemie', 'analytik', 'thermische-analyse', 'TG', 'DSC', 'DTA', 'thermogravimetrie']
interaktiv: false
schwierigkeit: 'fortgeschritten'
teilgebiet: ['analytische-methoden']
icon: '🌡️'
aliases: [/article/thermische-analyse/]
---

## Einführung

Die **Thermische Analyse** umfasst eine Gruppe von Verfahren, bei denen physikalische oder chemische Eigenschaften einer Probe als Funktion der Temperatur oder Zeit gemessen werden. Die Probe wird dabei einem definierten Temperaturprogramm ausgesetzt.

Die wichtigsten Verfahren sind:

- **Thermogravimetrie (TG)**: Messung der Massenänderung
- **Differenz-Thermoanalyse (DTA)**: Messung der Temperaturdifferenz zwischen Probe und Referenz
- **Dynamische Differenzkalorimetrie (DSC)**: Messung des Wärmestroms

## Thermogravimetrie (TG)

Bei der **Thermogravimetrie** wird die Masse einer Probe kontinuierlich während einer definierten Erwärmung gemessen. Die Probe befindet sich auf einer **Thermowaage** in einem Ofen mit kontrollierter Atmosphäre.

### Typische Massenveränderungen

| Vorgang                | Massenänderung | Beispielreaktion                                 |
| ---------------------- | -------------- | ------------------------------------------------ |
| Desorption/Dehydration | Abnahme        | $\ce{CaSO4\cdot2H2O ->[120°C] CaSO4\cdot0.5H2O}$ |
| Zersetzung             | Abnahme        | $\ce{CaCO3 ->[800°C] CaO + CO2}$                 |
| Oxidation              | Zunahme        | $\ce{2Cu + O2 ->[300°C] 2CuO}$                   |
| Reduktion              | Abnahme        | $\ce{Fe2O3 + 3H2 ->[500°C] 2Fe + 3H2O}$          |

Die **TG-Kurve** zeigt die Masse gegen die Temperatur. Die erste Ableitung (DTG) erleichtert die Identifikation der Temperaturbereiche, in denen die Änderungen stattfinden.

### Auswertung einer TG-Kurve

Die differentielle thermogravimetrische Kurve (DTG) zeigt Peaks an den Wendepunkten der TG-Kurve. Aus der Massenänderung können stöchiometrische Berechnungen durchgeführt werden:

$$\Delta m = \frac{M(Produkt)}{M(Ausgangsstoff)} \cdot m_0$$

## Differenz-Thermoanalyse (DTA)

Bei der **DTA** werden die Probe und eine inerte Referenz (z. B. Aluminiumoxid) gleichzeitig dem gleichen Temperaturprogramm ausgesetzt. Die Temperaturdifferenz $\Delta T = T_{Probe} - T_{Referenz}$ wird gemessen.

- **Endotherme Ereignisse** (Schmelzen, Verdampfen, Zersetzung): $\Delta T < 0$
- **Exotherme Ereignisse** (Kristallisation, Oxidation): $\Delta T > 0$

### Typische DTA-Signale

| Ereignis        | Signal       | Beispiel                             |
| --------------- | ------------ | ------------------------------------ |
| Schmelzen       | Endotherm    | $PE: T_m = 130\ °C$                  |
| Glasübergang    | Stufenförmig | $PS: T_g = 100\ °C$                  |
| Kristallisation | Exotherm     | $PET: T_c = 150\ °C$                 |
| Zersetzung      | Endotherm    | $\ce{CaCO3 -> CaO + CO2}$ bei 800 °C |

## Dynamische Differenzkalorimetrie (DSC)

Die **DSC** ist eine Weiterentwicklung der DTA, bei der die **Enthalpieänderung** quantitativ gemessen wird. Es wird die differentielle Heizleistung bestimmt, die nötig ist, um Probe und Referenz auf der gleichen Temperatur zu halten.

Die integrierte Peakfläche ergibt die Enthalpieänderung:

$$\Delta H = \int \frac{dQ}{dt} \cdot dt$$

### Anwendungen der DSC

- **Bestimmung der Schmelztemperatur** und **Schmelzenthalpie**
- **Glasübergangstemperatur ($T_g$)** von Polymeren
- **Kristallinitätsgrad** von Kunststoffen
- **Reinheitsbestimmung** von Arzneistoffen (van't Hoff-Gleichung)
- **Aushärtungsreaktionen** von Klebstoffen und Harzen

## Kopplung mit anderen Methoden

Die thermische Analyse wird häufig mit anderen Verfahren gekoppelt:

- **TG-MS**: Massenspektrometrische Analyse der freigesetzten Gase
- **TG-FTIR**: IR-spektroskopische Identifizierung der Zersetzungsprodukte
- **EGA (Evolved Gas Analysis)**: Allgemeine Analyse der freigesetzten Gase

Diese Kopplungen erlauben eine umfassende Charakterisierung von Zersetzungsprozessen.

## Praktische Anwendungen

- **Polymercharakterisierung**: Bestimmung von thermischer Stabilität, Zusammensetzung von Blends und Füllstoffen
- **Pharmazeutische Industrie**: Reinheitsprüfung, Polymorphie-Untersuchungen, Stabilitätstests
- **Baustoffe**: Zementhydratation, Brandverhalten von Dämmstoffen
- **Lebensmittelchemie**: Fettgehaltsbestimmung, Stärkeverkleisterung
- ** Umwelttechnik: Verbrennungsverhalten von Abfällen**

## Übungen

1. Eine TG-Messung von $\ce{CaC2O4\cdot H2O}$ zeigt drei Massenverluste bei 120 °C, 400 °C und 800 °C. Ordnen Sie die Verluste den entsprechenden Zersetzungsschritten zu.
2. Die DSC-Kurve eines teilkristallinen Polymers zeigt einen Glasübergang bei $T_g = 80\ °C$ und einen Schmelzpeak bei $T_m = 165\ °C$. Erklären Sie diese beiden Phänomene.
3. Berechnen Sie den Massenverlust (in %) bei der vollständigen Zersetzung von $\ce{MgCO3}$ zu $\ce{MgO}$.
4. Warum werden TG-Messungen oft unter Inertgas (z. B. $N_2$, $Ar$) durchgeführt? Welche Informationen gehen bei Messungen unter synthetischer Luft verloren?
