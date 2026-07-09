---
title: 'Säurestärke und pKs-Werte'
description: 'Starke und schwache Säuren, pKs-Werte, Zusammenhang mit dem pH-Wert, Vergleich der Säurestärke anhand von Beispielen.'
date: '2026-07-09'
last_reviewed: '2026-07-09'
tags: ['chemie', 'saeuren-basen', 'pKs', 'saeurestaerke', 'gleichgewicht']
interaktiv: false
schwierigkeit: 'mittelstufe'
teilgebiet: ['saeuren-basen']
icon: '🧪'
aliases: [/article/saeurestaerke-pks/]
---

## Definition und Überblick

Die **Säurestärke** gibt an, wie vollständig eine Säure in wässriger Lösung protoniert wird (ein $H^+$ abgibt). Eine allgemeine Säure-Base-Reaktion folgt dem Gleichgewicht:

$$HA + H_2O \rightleftharpoons A^- + H_3O^+$$

Die Gleichgewichtskonstante $K_S$ (Säurekonstante) beschreibt die Lage dieses Gleichgewichts:

$$K_S = \frac{[H_3O^+] \cdot [A^-]}{[HA]}$$

Je größer $K_S$, desto stärker die Säure. Der **pKs-Wert** vereinfacht die Handhabung:

$$pKs = -\log(K_S)$$

**Faustregel:** Je kleiner der pKs-Wert, desto stärker die Säure.

## Hauptinhalt

### Starke vs. schwache Säuren

- **Starke Säuren** ($pKs < 0$): protolysieren nahezu vollständig, z. B. Salzsäure ($pKs \approx -7$), Schwefelsäure ($pKs \approx -3$)
- **Mittelstarke Säuren** ($0 < pKs < 4$): partiell protolysiert, z. B. Phosphorsäure ($pKs_1 \approx 2{,}1$)
- **Schwache Säuren** ($pKs > 4$): nur geringfügig protolysiert, z. B. Essigsäure ($pKs \approx 4{,}76$), Kohlensäure ($pKs_1 \approx 6{,}5$)

### Zusammenhang mit dem pH-Wert

Für eine schwache Säure der Konzentration $c_0$ gilt näherungsweise:

$$pH \approx \frac{1}{2} (pKs - \log c_0)$$

Für eine starke Säure vereinfacht sich dies zu:

$$pH = -\log c_0$$

### Protolysestufe bei mehrprotonigen Säuren

Mehrprotonige Säuren wie $\ce{H3PO4}$ oder $\ce{H2CO3}$ haben mehrere pKs-Werte. Jede Stufe protolysiert schwächer als die vorherige:

$$\ce{H3PO4}: pKs_1 = 2{,}1,\; pKs_2 = 7{,}2,\; pKs_3 = 12{,}3$$

## Beispiele

| Säure                    | Formel         | pKs          | Stärke       |
| ------------------------ | -------------- | ------------ | ------------ |
| Salzsäure                | $\ce{HCl}$     | $\approx -7$ | stark        |
| Schwefelsäure (1. Stufe) | $\ce{H2SO4}$   | $\approx -3$ | stark        |
| Oxoniumion               | $\ce{H3O+}$    | $0$          | Referenz     |
| Ameisensäure             | $\ce{HCOOH}$   | $3{,}75$     | schwach      |
| Essigsäure               | $\ce{CH3COOH}$ | $4{,}76$     | schwach      |
| Ammoniumion              | $\ce{NH4+}$    | $9{,}25$     | sehr schwach |

## Übungen

1. Ordne die folgenden Säuren nach steigender Stärke: $\ce{CH3COOH}$ ($pKs = 4{,}76$), $\ce{HCl}$ ($pKs \approx -7$), $\ce{HCOOH}$ ($pKs = 3{,}75$).

2. Eine $0{,}1\ \mathrm{mol/L}$ Essigsäure ($pKs = 4{,}76$) liegt vor. Berechne den pH-Wert mit der Näherungsformel für schwache Säuren.

3. Begründe, warum Phosphorsäure in drei Stufen protolysiert und welcher pKs-Wert zu welcher Stufe gehört.

**Lösungen:**

1. $\ce{HCl}$ (stark) < $\ce{HCOOH}$ (schwach, pKs=3,75) < $\ce{CH3COOH}$ (schwach, pKs=4,76). Je größer pKs, desto schwächer die Säure.

2. $pH \approx \frac{1}{2} (4{,}76 - \log 0{,}1) = \frac{1}{2} (4{,}76 + 1) = 2{,}88$

3. $\ce{H3PO4}$ gibt nacheinander drei $\ce{H+}$ ab. Die erste Abspaltung ist am leichtesten (kleinster pKs), da das jeweilige Anion mit jeder Stufe negativer wird und das Proton stärker bindet: $\ce{H3PO4 \rightarrow H2PO4- \rightarrow HPO4^{2-} \rightarrow PO4^{3-}}$.

## Verwandte Themen

- [Neutralisation](/themenbereiche/saeuren-basen/neutralisation/) – Säure-Base-Reaktionen, Neutralisationsenthalpie, pH-Wert nach Neutralisation und praktische Anwendungen der Neutralisation in Alltag und Labor.
- [pH-Wert und Indikatoren](/themenbereiche/saeuren-basen/ph-wert-und-indikatoren/) – Der pH-Wert gibt die Konzentration von $H^+$-Ionen in einer Lösung an. Indikatoren zeigen durch Farbumschlag an, ob sauer oder basisch.
- [Pufferlösungen](/themenbereiche/saeuren-basen/pufferloesungen/) – Pufferlösungen halten den pH-Wert auch bei Zugabe von Säure oder Base nahezu konstant. Sie bestehen aus einem schwachen Säure-Base-Paar.
- [Säure-Base-Titration](/themenbereiche/saeuren-basen/saeure-base-titration/) – Titrationstechnik, Indikatorwahl, Titrationskurven und die Bestimmung unbekannter Konzentrationen durch maßanalytische Verfahren.

## Zusammenfassung

Der **pKs-Wert** ist ein Maß für die Säurestärke: **kleiner pKs** = starke Säure, **großer pKs** = schwache Säure. Starke Säuren protolysieren vollständig, schwache nur teilweise. Bei mehrprotonigen Säuren nimmt die Säurestärke mit jeder Stufe ab. Über die Näherungsformeln lässt sich der pH-Wert einer Lösung aus pKs und Konzentration abschätzen.
