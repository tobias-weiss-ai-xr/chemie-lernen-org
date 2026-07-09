---
title: 'Chemisches Gleichgewicht'
description: 'Wenn Hin- und Rückreaktion gleich schnell ablaufen, stellt sich ein Gleichgewicht ein. MWG beschreibt das Konzentrationsverhältnis.'
date: '2026-06-03'
last_reviewed: '2026-07-09'
tags: ['chemie', 'gleichgewicht', 'mwg', 'le-chatelier']
interaktiv: false
schwierigkeit: 'oberstufe'
teilgebiet: ['gleichgewicht-geschwindigkeit']
icon: '⚖️'
aliases: [/article/chemisches-gleichgewicht/]
---

Viele chemische Reaktionen laufen nicht vollständig in eine Richtung ab, sondern erreichen einen Zustand, in dem Hin- und Rückreaktion gleich schnell ablaufen. Diesen Zustand nennt man **chemisches Gleichgewicht**. Er ist dynamisch: Auf molekularer Ebene laufen ständig beide Reaktionen ab, aber die Netto-Konzentrationen der Edukte und Produkte ändern sich nicht mehr.

## Das Massenwirkungsgesetz (MWG)

Das Massenwirkungsgesetz wurde von Cato Maximilian Guldberg und Peter Waage (1864) formuliert. Für eine allgemeine reversible Reaktion

$$aA + bB \rightleftharpoons cC + dD$$

gilt die Gleichgewichtskonstante $K_c$ (bezogen auf Konzentrationen):

$$K_c = \frac{[C]^c \cdot [D]^d}{[A]^a \cdot [B]^b}$$

Dabei stehen die eckigen Klammern für die Gleichgewichtskonzentrationen in mol/L. Die Gleichgewichtskonstante $K_c$ ist **temperaturabhängig**, aber **unabhängig** von den Anfangskonzentrationen.

### Beispiel: Haber-Bosch-Verfahren

Die Ammoniaksynthese ist eine der wichtigsten Reaktionen der chemischen Industrie:

$$\ce{N2 + 3H2 \rightleftharpoons 2NH3}$$

Die Gleichgewichtskonstante lautet:

$$K_c = \frac{[\ce{NH3}]^2}{[\ce{N2}] \cdot [\ce{H2}]^3}$$

Bei 25 °C beträgt $K_c$ etwa $3{,}5 \times 10^8$ – das Gleichgewicht liegt weit auf der Seite des Ammoniaks. Bei 450 °C (typische Reaktionstemperatur) sinkt $K_c$ auf etwa $7 \times 10^{-3}$.

### Gleichgewichtskonstante $K_p$ für Gasreaktionen

Bei Gasreaktionen wird oft die Gleichgewichtskonstante $K_p$ mit Partialdrücken statt Konzentrationen verwendet:

$$K_p = \frac{(p_C)^c \cdot (p_D)^d}{(p_A)^a \cdot (p_B)^b}$$

Der Zusammenhang zwischen $K_c$ und $K_p$ ist: $K_p = K_c \cdot (RT)^{\Delta n}$, wobei $\Delta n$ die Änderung der Stoffmenge (Summe der Koeffizienten Produkte minus Edukte) ist.

## Der Reaktionsquotient $Q$

Der **Reaktionsquotient** $Q$ hat dieselbe Form wie $K_c$, wird aber mit den aktuellen (nicht notwendigerweise Gleichgewichts-)Konzentrationen berechnet:

$$Q = \frac{[C]^c \cdot [D]^d}{[A]^a \cdot [B]^b}$$

Der Vergleich von $Q$ mit $K_c$ sagt die Richtung der Reaktion voraus:

- $Q < K_c$: Die Reaktion läuft in Richtung der Produkte (nach rechts)
- $Q = K_c$: Das System befindet sich im Gleichgewicht
- $Q > K_c$: Die Reaktion läuft in Richtung der Edukte (nach links)

## Das Prinzip von Le Chatelier

Das **Prinzip von Le Chatelier** (auch Prinzip des kleinsten Zwangs) besagt: Wird ein im Gleichgewicht befindliches System durch eine Änderung der äußeren Bedingungen gestört, so verschiebt sich das Gleichgewicht in die Richtung, die der Störung entgegenwirkt.

### Einfluss der Konzentration

Erhöht man die Konzentration eines Edukts, verschiebt sich das Gleichgewicht in Richtung der Produkte. Beispiel: Bei der Essigsäure-Ester-Synthese

$$\ce{CH3COOH + C2H5OH \rightleftharpoons CH3COOC2H5 + H2O}$$

verschiebt ein Überschuss an Ethanol das Gleichgewicht in Richtung des Esters (Prinzip des überschüssigen Edukts).

### Einfluss des Drucks

Druckerhöhung begünstigt die Seite mit weniger Gas-Molekülen. Bei der Ammoniaksynthese

$$\ce{N2 + 3H2 \rightleftharpoons 2NH3}$$

hat die Eduktseite 4 Moleküle (1 $\ce{N2}$ + 3 $\ce{H2}$), die Produktseite 2 Moleküle (2 $\ce{NH3}$). Hoher Druck (200–300 bar) verschiebt das Gleichgewicht daher in Richtung Ammoniak.

### Einfluss der Temperatur

Temperaturerhöhung begünstigt die endotherme Reaktion, Temperatursenkung die exotherme Reaktion. Die Ammoniaksynthese ist exotherm ($\Delta H = -92\ \text{kJ/mol}$):

- Temperaturerhöhung verschiebt das Gleichgewicht in Richtung der Edukte ($\ce{N2}$ und $\ce{H2}$)
- Temperatursenkung verschiebt es in Richtung Ammoniak

In der Praxis wird ein Kompromiss gewählt (ca. 450 °C): Niedrige Temperatur begünstigt zwar das Gleichgewicht, aber die Reaktionsgeschwindigkeit wäre zu gering. Ein Katalysator (Eisen) beschleunigt die Reaktion, ohne das Gleichgewicht zu verschieben.

## Weitere Beispiele für Gleichgewichtsreaktionen

- **Kalkkreislauf**: $\ce{CaCO3 \rightleftharpoons CaO + CO2}$ (thermische Zersetzung von Kalkstein)
- **Kohlensäure-Gleichgewicht**: $\ce{CO2 + H2O \rightleftharpoons H2CO3 \rightleftharpoons H+ + HCO3-}$ (wichtig für den pH-Wert von Gewässern und Blut)
- **Iod-Stärke-Komplex**: Ein blaues Gleichgewicht, das durch Temperaturänderung reversibel verschoben werden kann

## Übungen

1. Formuliere das Massenwirkungsgesetz für die Reaktion $\ce{2SO2 + O2 \rightleftharpoons 2SO3}$.
2. Die Gleichgewichtskonstante $K_c$ für die Reaktion $\ce{H2 + I2 \rightleftharpoons 2HI}$ beträgt bei 425 °C $K_c = 54{,}5$. Bei einer bestimmten Mischung betragen die Konzentrationen $[\ce{H2}] = 0{,}10\ \text{mol/L}$, $[\ce{I2}] = 0{,}10\ \text{mol/L}$ und $[\ce{HI}] = 0{,}50\ \text{mol/L}$. Berechne $Q$ und bestimme die Reaktionsrichtung.
3. Erkläre mithilfe des Prinzips von Le Chatelier, warum bei der Haber-Bosch-Synthese hoher Druck verwendet wird.
4. Die Reaktion $\ce{N2O4 \rightleftharpoons 2NO2}$ ist endotherm. Wie verschiebt sich das Gleichgewicht bei Temperaturerhöhung? Begründe.
5. In einem geschlossenen Gefäß befinden sich $\ce{CO}$, $\ce{H2O}$, $\ce{CO2}$ und $\ce{H2}$ im Gleichgewicht: $\ce{CO + H2O \rightleftharpoons CO2 + H2}$. Was passiert, wenn zusätzliches $\ce{CO2}$ zugegeben wird?

## Verwandte Themen

- [Reaktionskinetik]({{< ref "reaktionskinetik" >}})

## Zusammenfassung

Das chemische Gleichgewicht ist ein dynamischer Zustand, in dem Hin- und Rückreaktion gleich schnell ablaufen. Das Massenwirkungsgesetz beschreibt das Verhältnis der Gleichgewichtskonzentrationen durch die Gleichgewichtskonstante $K_c$. Der Reaktionsquotient $Q$ gibt an, ob ein System vom Gleichgewicht entfernt ist und in welche Richtung es sich bewegt. Nach dem Prinzip von Le Chatelier verschiebt sich ein Gleichgewicht bei Störung (Konzentrations-, Druck- oder Temperaturänderung) in die Richtung, die der Störung entgegenwirkt. Die Gleichgewichtslage ist temperaturabhängig, während Katalysatoren die Einstellung des Gleichgewichts beschleunigen, ohne es zu verschieben.
