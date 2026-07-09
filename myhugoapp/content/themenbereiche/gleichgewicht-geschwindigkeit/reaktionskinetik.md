---
title: 'Reaktionskinetik'
description: 'Die Reaktionskinetik beschreibt die Geschwindigkeit, mit der chemische Reaktionen ablaufen. Faktoren: Konzentration, Temperatur, Katalysator.'
date: '2026-06-03'
last_reviewed: '2026-07-09'
tags: ['chemie', 'kinetik', 'reaktionsgeschwindigkeit', 'arrhenius']
interaktiv: false
schwierigkeit: 'oberstufe'
teilgebiet: ['gleichgewicht-geschwindigkeit']
icon: '⏱️'
aliases: [/article/reaktionskinetik/]
---

Die **Reaktionskinetik** untersucht die Geschwindigkeit chemischer Reaktionen und die Faktoren, die sie beeinflussen. Während die Thermodynamik vorhersagt, ob eine Reaktion spontan abläuft, beschreibt die Kinetik, wie schnell sie tatsächlich abläuft. Eine thermodynamisch spontane Reaktion kann kinetisch gehemmt sein – ein bekanntes Beispiel ist die Verbrennung von Papier, das bei Raumtemperatur nicht von selbst brennt.

## Reaktionsgeschwindigkeit

Die **Reaktionsgeschwindigkeit** $v$ gibt an, wie schnell die Konzentration eines Edukts abnimmt oder eines Produkts zunimmt:

$$v = -\frac{1}{a} \cdot \frac{d[A]}{dt} = \frac{1}{c} \cdot \frac{d[C]}{dt}$$

für die Reaktion $aA \rightarrow cC$. Die Einheit ist mol·L⁻¹·s⁻¹. Die Geschwindigkeit ist nicht konstant, sondern nimmt mit fortschreitender Reaktion ab, da die Eduktkonzentrationen sinken.

## Kollisionstheorie

Nach der **Kollisionstheorie** müssen Teilchen für eine chemische Reaktion:

1. **Zusammenstoßen** (Häufigkeit der Kollisionen)
2. **Die richtige Orientierung** zueinander haben (sterischer Faktor)
3. **Genügend Energie** besitzen, um die Aktivierungsenergie $E_a$ zu überwinden

Nur ein Bruchteil der Kollisionen erfüllt alle drei Bedingungen – dies sind die **effektiven Stöße**.

## Aktivierungsenergie

Die **Aktivierungsenergie** $E_a$ ist die Energiebarriere, die überwunden werden muss, damit eine Reaktion abläuft. Sie lässt sich im Energiediagramm als Berg zwischen Edukten und Produkten darstellen:

$$\text{Edukte} \xrightarrow{E_a} \text{Übergangszustand} \xrightarrow{} \text{Produkte}$$

Die Höhe der Aktivierungsenergie bestimmt, wie stark die Reaktionsgeschwindigkeit von der Temperatur abhängt.

## Die Arrhenius-Gleichung

Die **Arrhenius-Gleichung** beschreibt den Zusammenhang zwischen der Geschwindigkeitskonstante $k$, der Aktivierungsenergie $E_a$ und der Temperatur $T$:

$$k = A \cdot e^{-E_a/(RT)}$$

Dabei ist:

- $k$: Geschwindigkeitskonstante
- $A$: präexponentieller Faktor (Häufigkeitsfaktor)
- $E_a$: Aktivierungsenergie (in J/mol)
- $R$: universelle Gaskonstante ($8{,}314\ \text{J·mol}^{-1}·\text{K}^{-1}$)
- $T$: Temperatur (in Kelvin)

Die Arrhenius-Gleichung zeigt: Schon eine geringe Temperaturerhöhung führt zu einer deutlichen Zunahme der Reaktionsgeschwindigkeit, da der exponentielle Term empfindlich reagiert. Faustregel: Eine Temperaturerhöhung um 10 K verdoppelt etwa die Reaktionsgeschwindigkeit.

## Reaktionsordnungen und Geschwindigkeitsgesetze

Die **Reaktionsordnung** beschreibt, wie die Geschwindigkeit von den Konzentrationen der Edukte abhängt. Sie muss experimentell bestimmt werden und ergibt sich nicht aus der stöchiometrischen Gleichung.

### Reaktion 0. Ordnung

$$v = k$$
Die Geschwindigkeit ist konstant und unabhängig von der Konzentration. Beispiel: Photochemische Reaktionen oder katalytische Reaktionen an Oberflächen.

### Reaktion 1. Ordnung

$$v = k \cdot [A]$$
Die Geschwindigkeit ist proportional zur Konzentration eines Edukts. Die Halbwertszeit $t_{1/2} = \frac{\ln 2}{k}$ ist konzentrationsunabhängig. Beispiel: Radioaktiver Zerfall.

### Reaktion 2. Ordnung

$$v = k \cdot [A]^2 \quad \text{oder} \quad v = k \cdot [A] \cdot [B]$$
Die Geschwindigkeit ist proportional zum Quadrat einer Konzentration oder zum Produkt zweier Konzentrationen. Halbwertszeit: $t_{1/2} = \frac{1}{k \cdot [A]_0}$. Beispiel: Dimerisierungsreaktionen.

## Faktoren, die die Reaktionsgeschwindigkeit beeinflussen

1. **Konzentration**: Höhere Konzentration → mehr Kollisionen pro Zeiteinheit → schnellere Reaktion
2. **Temperatur**: Höhere Temperatur → höhere kinetische Energie → mehr effektive Stöße → deutlich schnellere Reaktion
3. **Katalysatoren**: Senken die Aktivierungsenergie, indem sie einen alternativen Reaktionsweg mit niedrigerer Energiebarriere bieten. Sie werden nicht verbraucht. Beispiel: Eisenkatalysator beim Haber-Bosch-Verfahren
4. **Oberfläche**: Größere Oberfläche (z. B. Pulver statt Klumpen) → mehr Kontaktmöglichkeiten → schnellere Reaktion
5. **Druck** (bei Gasen): Höherer Druck entspricht höherer Konzentration → schnellere Reaktion

## Katalyse

- **Homogene Katalyse**: Katalysator und Reaktionspartner befinden sich in derselben Phase (z. B. Säurekatalyse bei der Esterhydrolyse)
- **Heterogene Katalyse**: Katalysator liegt in einer anderen Phase vor (z. B. festes Platin bei der Oxidation von $\ce{CO}$ zu $\ce{CO2}$ im Autoabgaskatalysator)
- **Enzymkatalyse**: Biologische Katalysatoren (Enzyme) senken die Aktivierungsenergie hochselektiv (z. B. Katalase baut Wasserstoffperoxid ab)

## Übungen

1. Die Aktivierungsenergie einer Reaktion beträgt $E_a = 75\ \text{kJ/mol}$. Bei welcher Temperatur ist die Geschwindigkeitskonstante doppelt so groß wie bei 20 °C? (Hinweis: Nutze die Arrhenius-Gleichung.)
2. Eine Reaktion 1. Ordnung hat eine Halbwertszeit von 30 Minuten. Berechne die Geschwindigkeitskonstante $k$. Wie viel Prozent der Ausgangssubstanz sind nach 2 Stunden noch vorhanden?
3. Erkläre anhand der Kollisionstheorie, warum eine Temperaturerhöhung um 10 K die Reaktionsgeschwindigkeit etwa verdoppelt.
4. Eine Reaktion hat bei 25 °C eine Geschwindigkeitskonstante von $k = 2{,}0 \times 10^{-3}\ \text{s}^{-1}$. Bei 35 °C steigt $k$ auf $4{,}0 \times 10^{-3}\ \text{s}^{-1}$. Berechne die Aktivierungsenergie $E_a$.
5. Vergleiche die Wirkungsweise eines homogenen und eines heterogenen Katalysators. Nenne jeweils ein Beispiel aus der Industrie oder dem Alltag.

## Verwandte Themen

- [Chemisches Gleichgewicht]({{< ref "chemisches-gleichgewicht" >}})

## Zusammenfassung

Die Reaktionskinetik beschreibt die Geschwindigkeit chemischer Reaktionen und ihre Abhängigkeit von Konzentration, Temperatur, Katalysatoren und Oberfläche. Die Kollisionstheorie erklärt, dass nur effektive Stöße mit ausreichender Energie und richtiger Orientierung zur Reaktion führen. Die Arrhenius-Gleichung $k = A \cdot e^{-E_a/(RT)}$ verknüpft die Geschwindigkeitskonstante mit der Aktivierungsenergie und der Temperatur. Reaktionen lassen sich nach ihrer Ordnung (0., 1., 2. Ordnung) klassifizieren. Katalysatoren senken die Aktivierungsenergie und beschleunigen die Reaktion, ohne dabei verbraucht zu werden oder die Gleichgewichtslage zu verändern.
