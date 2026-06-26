---
title: 'Quantitative Analyse'
description: 'Vertiefung in Methoden der quantitativen chemischen Analyse – Gravimetrie, Titration, Spektroskopie und Fehlerrechnung – für Fortgeschrittene.'
date: '2026-06-14'
tags: ['chemie', 'analytik', 'quantitative-analyse', 'gravimetrie', 'titration', 'spektroskopie']
interaktiv: false
schwierigkeit: 'fortgeschritten'
teilgebiet: ['analytische-methoden']
icon: '⚖️'
aliases: [/article/quantitative-analyse/]
---

## Grundlagen und Fehlerrechnung

Die quantitative Analyse liefert Zahlenwerte für Gehalte und Konzentrationen. Jede Messung ist fehlerbehaftet – die **Fehlerrechnung** ist daher unverzichtbar. Man unterscheidet **systematische Fehler** (gerätebedingt, methodisch) und **zufällige Fehler** (statistisch). Die **Standardabweichung** $s$ einer Messreihe mit $n$ Werten $x_i$ und Mittelwert $\bar{x}$ ist:

$$s = \sqrt{\frac{1}{n-1} \sum_{i=1}^n (x_i - \bar{x})^2}$$

Die **Nachweisgrenze** $x_{\text{NG}}$ wird nach DIN 32645 aus einem Kalibriermodell bestimmt:

$$x_{\text{NG}} = k \cdot \frac{s_0}{b}$$

mit $s_0$ als Verfahrensstandardabweichung, $b$ als Steigung der Kalibriergeraden und $k$ als statistischem Faktor (meist $k = 3$).

## Gravimetrie

Die **Gravimetrie** zählt zu den genauesten Verfahren (relative Standardabweichung < 0,1 %). Der gravimetrische Faktor $F$ verknüpft die Masse des gewogenen Niederschlags $m(\text{Niederschlag})$ mit der gesuchten Analystenmasse:

$$m(\text{Analyt}) = m(\text{Niederschlag}) \cdot F = m(\text{Niederschlag}) \cdot \frac{a \cdot M(\text{Analyt})}{b \cdot M(\text{Niederschlag})}$$

Die Faktoren $a$ und $b$ sind die stöchiometrischen Koeffizienten aus der Reaktionsgleichung. Ein typisches Beispiel ist die Bestimmung von Ni²⁺ als Ni(DMG)₂.

## Titrationsverfahren

Bei **Säure-Base-Titrationen** gilt am Äquivalenzpunkt:

$$n(\ce{OH-}) = n(\ce{H3O+})$$

Für die Berechnung schwacher Säuren vor und nach dem Äquivalenzpunkt ist die **Henderson-Hasselbalch-Gleichung** zentral:

$$\text{pH} = \text{p}K_S + \log\frac{[\ce{A-}]}{[\ce{HA}]}$$

Die **komplexometrische Titration** mit Na₂H₂EDTA erlaubt die direkte Bestimmung von Ca²⁺, Mg²⁺ und vielen Übergangsmetallionen. Der Äquivalenzpunkt wird mit **Metallindikatoren** wie Eriochromschwarz T (EBT) angezeigt.

## Spektroskopische Methoden

Die **AAS (Atomabsorptionsspektrometrie)** nutzt die Absorption von Licht durch freie Atome in der Gasphase. Das **Lambert-Beer-Gesetz** in der AAS:

$$A = \log\frac{I_0}{I} = \varepsilon \cdot c \cdot d$$

Empfindlichkeitssteigerung durch **Graphitrohr-AAS** – Nachweisgrenzen bis in den $\pu{ng/L}$-Bereich.

Die **ICP-OES** (optische Emissionsspektrometrie mit induktiv gekoppeltem Plasma) ermöglicht die simultane Bestimmung von bis zu 70 Elementen.

## Übungen

1. Bei einer Gravimetrie werden 0,4325 g BaSO₄ ($M = \pu{233.39 g/mol}$) aus einer Ba²⁺-haltigen Probe gewogen. Berechne die Masse $m(\ce{Ba})$ ($M = \pu{137.33 g/mol}$) in der Probe.
2. Eine Kalibriergerade in der AAS hat die Steigung $b = \pu{0.045 L/mg}$ und die Verfahrensstandardabweichung $s_0 = \pu{0.002}$. Berechne die Nachweisgrenze mit $k = 3$.
3. Bei einer Titration von 20,00 mL HAc ($\text{p}K_S = 4{,}76$) mit $\pu{0.1 M}$ NaOH wird ein pH von 5,06 gemessen. Wie viel Prozent der Säure ist neutralisiert? (Hinweis: Henderson-Hasselbalch anwenden.)
