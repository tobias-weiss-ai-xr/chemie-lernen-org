---
title: 'Elektrolyse und Galvanik'
description: 'Elektrolyse vs. galvanische Zellen, Faradaysche Gesetze, industrielle Anwendungen (Aluminiumherstellung, Galvanisieren).'
date: '2026-07-09'
last_reviewed: '2026-07-09'
tags: ['chemie', 'redox', 'elektrochemie', 'elektrolyse', 'galvanik']
interaktiv: false
schwierigkeit: 'mittelstufe'
teilgebiet: ['redox-elektrochemie']
icon: '🔋'
aliases: [/article/elektrolyse-galvanik/]
---

## Definition und Überblick

**Galvanische Zellen** wandeln chemische in elektrische Energie um (freiwillige Reaktion, $E > 0$). **Elektrolysezellen** tun das Gegenteil: Sie erzwingen eine un-freiwillige Redoxreaktion durch angelegte Spannung ($E < 0$).

Beide bestehen aus zwei Elektroden (Anode und Kathode) in einem Elektrolyten. Die Unterscheidung erfolgt über die Stromrichtung:

- **Galvanische Zelle**: Anode negativ (−), Kathode positiv (+)
- **Elektrolyse**: Anode positiv (+), Kathode negativ (−)

## Hauptinhalt

### Faradaysche Gesetze

Michael Faraday formulierte die Zusammenhänge zwischen Strom und Stoffumsatz:

**1. Faradaysches Gesetz**: Die abgeschiedene Stoffmenge $m$ ist proportional zur geflossenen Ladung $Q$:

$$m = k \cdot Q = k \cdot I \cdot t$$

**2. Faradaysches Gesetz**: Die benötigte Ladung für 1 mol eines Stoffes hängt von der Ionenladung $z$ ab:

$$Q = z \cdot F$$

mit der **Faraday-Konstante** $F = 96\,485\ \mathrm{C/mol}$ und $n$ der Stoffmenge:

$$m = \frac{M \cdot I \cdot t}{z \cdot F}$$

### Galvanisieren (elektrolytische Beschichtung)

Beim Galvanisieren wird ein Metall (z. B. $\ce{Cu}$, $\ce{Ni}$, $\ce{Cr}$, $\ce{Ag}$) auf ein Werkstück aufgebracht. Anwendungen: Korrosionsschutz (Verchromen), Dekoration (Vergolden), Leiterplattenherstellung.

Beispiel: **Verkupfern** — das Werkstück wird als Kathode geschaltet:

$$\ce{Cu^{2+} + 2e- -> Cu}$$

Die Anode besteht aus Kupfer, das nachgeliefert wird: $\ce{Cu -> Cu^{2+} + 2e-}$

### 📺 Lernvideos

{{< youtube id="h6XZ_EaReCg" title="Praktikum: Galvanisieren" >}}
**Lernvideo-Illustration:** _Einführung in die Chemie, Video zum Praktikum – Galvanisieren_ von **Zig's Chemistry 42** (Prof. Siegfried Schindler) zeigt das elektrolytische Beschichten in der Praxis.
{{< /youtube >}}

{{< youtube id="iZWT_xCFB-g" title="Praktikum: Schreiben mit Strom" >}}
**Lernvideo-Illustration:** _Einführung in die Chemie, Video zum Praktikum – Schreiben mit Strom_ von **Zig's Chemistry 42** (Prof. Siegfried Schindler) demonstriert die Elektrolyse auf anschauliche Weise.
{{< /youtube >}}

### Industrielle Elektrolyse: Aluminiumgewinnung (Hall-Héroult)

Die Aluminiumherstellung erfolgt aus $\ce{Al2O3}$ (Bauxit) in einer Kryolithschmelze ($\ce{Na3AlF6}$) bei ca. 960 °C:

- **Kathode** (−): $\ce{Al^{3+} + 3e- -> Al}$ (schmilzt und wird abgezogen)
- **Anode** (+): $\ce{2 O^{2-} -> O2 + 4e-}$, die Kohleanoden verbrennen zu $\ce{CO2}$

Der Energiebedarf ist enorm: ca. $14\ \mathrm{kWh}$ pro kg Aluminium.

### Wasserstoffelektrolyse

$\ce{2 H2O -> 2 H2 + O2}$ mit $E_{\text{min}} = 1{,}23\ \mathrm{V}$. Reale Zellen benötigen $1{,}8\ \mathrm{V}$ bis $2{,}2\ \mathrm{V}$ aufgrund von Überspannungen.

## Beispiele

- **Daniell-Element** (galvanisch): $\ce{Zn | Zn^{2+} || Cu^{2+} | Cu}$ — Spannung ca. $1{,}1\ \mathrm{V}$
- **Bleiakku** (beides möglich): Beim Entladen galvanisch, beim Laden Elektrolyse
- **Wasserstoffelektrolyse**: grüner Wasserstoff aus erneuerbaren Energien
- **Vergolden**: Eintauchen in $\ce{[Au(CN)2]-}$-Lösung, Gold scheidet sich an der Kathode ab

## Übungen

1. Durch eine Kupfer-Elektrolysezelle fließt $2{,}0\ \mathrm{A}$ für $30\ \mathrm{min}$. Welche Masse Kupfer scheidet sich an der Kathode ab? ($M_{\ce{Cu}} = 63{,}55\ \mathrm{g/mol}$, $z = 2$)

2. Handelt es sich bei einer Aluminium-Elektrolyse um eine freiwillige Reaktion? Begründe mit $E$.

3. Nenne drei Unterschiede zwischen einer galvanischen Zelle und einer Elektrolysezelle.

**Lösungen:**

1. $m = \frac{M \cdot I \cdot t}{z \cdot F} = \frac{63{,}55 \cdot 2{,}0 \cdot 1800}{2 \cdot 96485} \approx 1{,}19\ \mathrm{g}$

2. Nein, sie ist unfreiwillig ($E < 0$). Für $\ce{Al2O3}$ ist die Zersetzungsspannung negativ, daher muss äußere Spannung angelegt werden.

3. (1) Galvanisch: spontan, Elektrolyse: erzwungen. (2) Galvanisch: $E > 0$, Elektrolyse: $E < 0$. (3) Galvanisch: Anode (−), Kathode (+); Elektrolyse: Anode (+), Kathode (−).

## Verwandte Themen

- [Elektrochemische Zellen](/themenbereiche/redox-elektrochemie/elektrochemische-zellen/) – Galvanische Zellen wandeln chemische Energie in elektrische um (Batterien). Elektrolysezellen wandeln elektrische Energie in chemische um (Metallgewinnung).
- [Korrosion und Korrosionsschutz](/themenbereiche/redox-elektrochemie/korrosion/) – Korrosion ist die unerwünschte Oxidation von Metallen. Grundlagen der elektrochemischen Korrosion und Verfahren des Korrosionsschutzes.
- [Oxidation und Reduktion](/themenbereiche/redox-elektrochemie/oxidation-und-reduktion/) – Oxidation = Elektronenabgabe, Reduktion = Elektronenaufnahme. Redox-Reaktionen stehen immer zusammen (Redox-Paar).
- [Spannungsreihe der Elemente](/themenbereiche/redox-elektrochemie/spannungsreihe/) – Die Spannungsreihe ordnet Metalle nach ihrer Fähigkeit, Elektronen abzugeben. Edle Metalle geben schwer, unedle leicht Elektronen ab.

## Zusammenfassung

**Galvanische Zellen** liefern nutzbare elektrische Energie aus spontanen Redoxreaktionen. **Elektrolysezellen** nutzen elektrische Energie, um un-freiwillige Redoxreaktionen zu erzwingen. Die **Faradayschen Gesetze** verknüpfen Stromstärke, Zeit und abgeschiedene Stoffmenge. Industrielle Anwendungen der Elektrolyse umfassen die Aluminiumgewinnung, Galvanisieren und die Wasserstoffherstellung.
