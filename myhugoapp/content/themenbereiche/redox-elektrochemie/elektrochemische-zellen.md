---
title: 'Elektrochemische Zellen'
description: 'Galvanische Zellen wandeln chemische Energie in elektrische um (Batterien). Elektrolysezellen wandeln elektrische Energie in chemische um (Metallgewinnung).'
date: '2026-06-03'
last_reviewed: '2026-07-09'
tags: ['chemie', 'elektrochemie', 'galvanisch', 'elektrolyse']
interaktiv: false
schwierigkeit: 'mittelstufe'
teilgebiet: ['redox-elektrochemie']
icon: '🔋'
aliases: [/article/elektrochemische-zellen/]
---

**Elektrochemie** beschreibt den Zusammenhang zwischen chemischen Reaktionen und elektrischem Strom. Elektrochemische Zellen sind Systeme, in denen diese Umwandlung stattfindet. Man unterscheidet zwei grundlegende Typen: galvanische Zellen und Elektrolysezellen.

## Galvanische Zellen

Galvanische Zellen wandeln chemische Energie spontan in elektrische Energie um. Sie bestehen aus zwei Halbzellen, die durch eine Salzbrücke oder eine poröse Membran verbunden sind. Jede Halbzelle enthält eine Elektrode, die in eine Elektrolytlösung eintaucht.

An der **Anode** findet die **Oxidation** statt: Die Elektrode gibt Elektronen ab und geht als Ion in Lösung. An der **Kathode** findet die **Reduktion** statt: Ionen aus der Lösung nehmen Elektronen auf und scheiden sich an der Elektrode ab. Die Elektronen fließen durch den äußeren Stromkreis von der Anode zur Kathode, während Ionen durch die Salzbrücke wandern, um die Ladungsneutralität zu erhalten.

Die Spannung einer galvanischen Zelle ergibt sich aus der Potentialdifferenz zwischen den beiden Elektroden: $$E_{Zelle} = E_{Kathode} - E_{Anode}$$

### Das Daniell-Element

Das bekannteste Beispiel ist das **Daniell-Element**, das aus einer Zink-Halbzelle und einer Kupfer-Halbzelle besteht:

- Anode (Zink): $\ce{Zn -> Zn^{2+} + 2e^-}$ (Oxidation, $E^0 = -0{,}76\ \text{V}$)
- Kathode (Kupfer): $\ce{Cu^{2+} + 2e^- -> Cu}$ (Reduktion, $E^0 = +0{,}34\ \text{V}$)
- Gesamtreaktion: $\ce{Zn + Cu^{2+} -> Zn^{2+} + Cu}$
- Zellspannung: $E_{Zelle} = 0{,}34\ \text{V} - (-0{,}76\ \text{V}) = 1{,}10\ \text{V}$

Die Zellschreibweise (NERNSTsche Notation) für das Daniell-Element lautet: $$\ce{Zn | Zn^{2+} (1\ M) || Cu^{2+} (1\ M) | Cu}$$

### Anwendungen galvanischer Zellen

- **Primärbatterien** (nicht wiederaufladbar): Zink-Kohle-Batterie, Alkali-Mangan-Batterie
- **Sekundärbatterien** (wiederaufladbar): Blei-Akkumulator, Lithium-Ionen-Akkumulator, Nickel-Metallhydrid-Akku
- **Brennstoffzellen**: Wandeln chemische Energie von Brennstoffen (z. B. Wasserstoff) direkt in elektrische Energie um: $\ce{2H2 + O2 -> 2H2O}$

## Elektrolysezellen

Elektrolysezellen arbeiten nach dem umgekehrten Prinzip: Sie wandeln elektrische Energie in chemische Energie um. Durch Anlegen einer äußeren Spannung wird eine nicht-spontane Redoxreaktion erzwungen.

- **Anode (+):** Oxidation (durch den externen Strom erzwungen)
- **Kathode (−):** Reduktion

### Anwendungen der Elektrolyse

- **Aluminiumherstellung (Hall-Héroult-Verfahren):** $\ce{2Al2O3 -> 4Al + 3O2}$
- **Kupferraffination:** Rohkupfer wird an der Anode oxidiert, reines Kupfer scheidet sich an der Kathode ab
- **Wasserelektrolyse zur Wasserstoffproduktion:** $\ce{2H2O -> 2H2 + O2}$
- **Galvanische Beschichtung (Galvanisieren):** Überziehen eines Gegenstands mit einer dünnen Metallschicht (z. B. Verchromen)

## Vergleich: Galvanische Zelle vs. Elektrolysezelle

| Eigenschaft       | Galvanische Zelle     | Elektrolysezelle      |
| ----------------- | --------------------- | --------------------- |
| Energieumwandlung | chemisch → elektrisch | elektrisch → chemisch |
| Reaktion          | spontan               | erzwungen             |
| Anode             | negativ (−)           | positiv (+)           |
| Kathode           | positiv (+)           | negativ (−)           |
| Beispiel          | Batterie              | Kupferraffination     |

## Übungen

1. Erkläre den Unterschied zwischen einer galvanischen Zelle und einer Elektrolysezelle. Nenne jeweils zwei Beispiele.
2. Berechne die Spannung eines Daniell-Elements, wenn die Zink-Halbzelle eine Standardpotential von $E^0 = -0{,}76\ \text{V}$ und die Kupfer-Halbzelle $E^0 = +0{,}34\ \text{V}$ hat.
3. Formuliere die Teilreaktionen (Oxidation und Reduktion) für eine Brennstoffzelle, in der Wasserstoff mit Sauerstoff zu Wasser reagiert.
4. Warum wird bei der Elektrolyse von Wasser oft etwas Schwefelsäure oder Natronlauge zugesetzt?
5. Ein Silberlöffel soll galvanisch versilbert werden. Welches Metall muss als Anode verwendet werden? Formuliere die Elektrodenreaktionen.

## Verwandte Themen

- [Oxidation und Reduktion]({{< ref "oxidation-und-reduktion" >}})
- [Spannungsreihe der Elemente]({{< ref "spannungsreihe" >}})

## Zusammenfassung

Galvanische Zellen nutzen spontane Redoxreaktionen zur Stromerzeugung (Batterien, Brennstoffzellen). Elektrolysezellen erzwingen durch äußere Spannung nicht-spontane Redoxreaktionen (Metallgewinnung, Galvanisieren). Beide Zelltypen bestehen aus zwei Elektroden (Anode und Kathode) in einer Elektrolytlösung und sind über einen äußeren Stromkreis verbunden. Die Zellspannung ergibt sich aus der Differenz der Elektrodenpotentiale. Das Daniell-Element ist das Standardbeispiel einer galvanischen Zelle mit einer Spannung von etwa 1,1 V.
