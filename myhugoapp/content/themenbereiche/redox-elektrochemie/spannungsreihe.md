---
title: 'Spannungsreihe der Elemente'
description: 'Die Spannungsreihe ordnet Metalle nach ihrer Fähigkeit, Elektronen abzugeben. Edle Metalle geben schwer, unedle leicht Elektronen ab.'
date: '2026-06-08'
last_reviewed: '2026-07-09'
tags: ['chemie', 'spannungsreihe', 'redox', 'metalle']
interaktiv: false
schwierigkeit: 'mittelstufe'
teilgebiet: ['redox-elektrochemie']
icon: '⚡'
aliases: [/article/spannungsreihe/]
---

Die **elektrochemische Spannungsreihe** ordnet Elemente nach ihrem **Normalpotential** $E^0$ (gemessen gegen die **Standardwasserstoffelektrode**). Sie ist ein zentrales Werkzeug der Elektrochemie, um die Stärke von Oxidations- und Reduktionsmitteln zu vergleichen und die Richtung von Redoxreaktionen vorherzusagen.

## Normalpotentiale und ihre Bedeutung

Das Normalpotential $E^0$ wird unter Standardbedingungen (25 °C, 1 mol/L Konzentration, 1 bar Gasdruck) gegen die Standardwasserstoffelektrode gemessen, der per Definition das Potential $E^0 = 0{,}00\ \text{V}$ zugewiesen wird. Je **negativer** $E^0$, desto **unedler** (reduktionsfreudiger) ist das Metall – es gibt leichter Elektronen ab. Je **positiver** $E^0$, desto **edler** ist das Metall – es gibt schwerer Elektronen ab.

### Auszug der Spannungsreihe

| Halbreaktion               | $E^0$ (V) |
| -------------------------- | --------- |
| $\ce{Li+ + e- -> Li}$      | $-3{,}04$ |
| $\ce{K+ + e- -> K}$        | $-2{,}93$ |
| $\ce{Ca^{2+} + 2e- -> Ca}$ | $-2{,}87$ |
| $\ce{Na+ + e- -> Na}$      | $-2{,}71$ |
| $\ce{Mg^{2+} + 2e- -> Mg}$ | $-2{,}36$ |
| $\ce{Al^{3+} + 3e- -> Al}$ | $-1{,}66$ |
| $\ce{Zn^{2+} + 2e- -> Zn}$ | $-0{,}76$ |
| $\ce{Fe^{2+} + 2e- -> Fe}$ | $-0{,}44$ |
| $\ce{Sn^{2+} + 2e- -> Sn}$ | $-0{,}14$ |
| $\ce{Pb^{2+} + 2e- -> Pb}$ | $-0{,}13$ |
| $\ce{2H+ + 2e- -> H2}$     | $0{,}00$  |
| $\ce{Cu^{2+} + 2e- -> Cu}$ | $+0{,}34$ |
| $\ce{Ag+ + e- -> Ag}$      | $+0{,}80$ |
| $\ce{Hg^{2+} + 2e- -> Hg}$ | $+0{,}85$ |
| $\ce{Au^{3+} + 3e- -> Au}$ | $+1{,}50$ |

Die reduzierten Formen der Elemente (links) sind die Reduktionsmittel, die oxidierten Formen (rechts) sind die Oxidationsmittel. Je negativer das Potential, desto stärker ist das Reduktionsmittel (z. B. $\ce{Li}$). Je positiver, desto stärker ist das Oxidationsmittel (z. B. $\ce{Au^{3+}}$).

## Berechnung der Zellspannung

Die Spannung einer galvanischen Zelle unter Standardbedingungen berechnet sich aus der Differenz der Normalpotentiale von Kathode und Anode:

$$\Delta E^0 = E^0_{\text{Kathode}} - E^0_{\text{Anode}}$$

### Beispiele

**Daniell-Element ($\ce{Zn/Cu}$)**:

- Kathode (Reduktion): $\ce{Cu^{2+} + 2e- -> Cu}$, $E^0 = +0{,}34\ \text{V}$
- Anode (Oxidation): $\ce{Zn -> Zn^{2+} + 2e-}$, $E^0 = -0{,}76\ \text{V}$
- $\Delta E^0 = 0{,}34\ \text{V} - (-0{,}76\ \text{V}) = 1{,}10\ \text{V}$

**Silber-Zink-Batterie**:

- Kathode: $\ce{Ag2O + H2O + 2e- -> 2Ag + 2OH-}$, $E^0 = +0{,}34\ \text{V}$
- Anode: $\ce{Zn + 2OH- -> ZnO + H2O + 2e-}$, $E^0 = -1{,}24\ \text{V}$
- $\Delta E^0 = 0{,}34\ \text{V} - (-1{,}24\ \text{V}) = 1{,}58\ \text{V}$

## Vorhersage der Reaktionsrichtung

Die Spannungsreihe erlaubt die Vorhersage, ob eine Redoxreaktion spontan abläuft. Eine Reaktion läuft spontan ab, wenn $\Delta E^0 > 0$ ist. Das Reduktionsmittel mit dem negativeren Potential reagiert mit dem Oxidationsmittel mit dem positiveren Potential.

**Faustregel**: Das unedlere Metall (negativeres $E^0$) reduziert das edlere Metall (positiveres $E^0$).

**Beispiel**: Taucht man ein Zinkblech in eine Kupfersulfatlösung, so überzieht sich das Zink mit elementarem Kupfer – das Zink reduziert die Kupferionen:

$$\ce{Zn + Cu^{2+} -> Zn^{2+} + Cu} \qquad \Delta E^0 = 1{,}10\ \text{V} > 0$$

Umgekehrt reagiert Kupfer nicht mit Zinksulfatlösung ($\Delta E^0 < 0$).

## Die NERNST-Gleichung

Unter Nicht-Standardbedingungen berechnet sich das tatsächliche Potential mit der **NERNST-Gleichung**:

$$E = E^0 + \frac{RT}{zF} \cdot \ln \frac{[\text{oxidierte Form}]}{[\text{reduzierte Form}]}$$

Dabei ist $R$ die Gaskonstante, $T$ die Temperatur, $z$ die Anzahl der übertragenen Elektronen und $F$ die Faraday-Konstante. Bei 25 °C vereinfacht sich die Gleichung zu:

$$E = E^0 + \frac{0{,}059\ \text{V}}{z} \cdot \lg \frac{[\text{oxidierte Form}]}{[\text{reduzierte Form}]}$$

## Übungen

1. Berechne die Spannung einer galvanischen Zelle aus einer Eisen- ($E^0 = -0{,}44\ \text{V}$) und einer Silber-Halbzelle ($E^0 = +0{,}80\ \text{V}$). Welches Metall ist die Anode, welches die Kathode?
2. Kann Kupfer Silberionen aus einer Silbernitratlösung reduzieren? Begründe mit den Normalpotentialen ($E^0_{\ce{Cu}} = +0{,}34\ \text{V}$, $E^0_{\ce{Ag}} = +0{,}80\ \text{V}$).
3. Ordne folgende Metalle nach zunehmender Edelheit: Natrium, Gold, Eisen, Zink, Kupfer, Magnesium.
4. Eine galvanische Zelle liefert eine Spannung von 0,46 V. Eine Halbzelle ist Nickel ($E^0 = -0{,}25\ \text{V}$). Bestimme das Normalpotential der anderen Halbzelle.
5. Erkläre, warum ein Eisenblech in sauerstoffhaltigem Wasser rostet, während ein Goldblech unverändert bleibt. Beziehe die Spannungsreihe in deine Antwort ein.

## Verwandte Themen

- [Elektrochemische Zellen]({{< ref "elektrochemische-zellen" >}})
- [Oxidation und Reduktion]({{< ref "oxidation-und-reduktion" >}})

## Zusammenfassung

Die elektrochemische Spannungsreihe ordnet Elemente nach ihren Normalpotentialen $E^0$ gegen die Standardwasserstoffelektrode. Unedle Metalle (negatives $E^0$) geben leicht Elektronen ab und sind starke Reduktionsmittel; edle Metalle (positives $E^0$) geben schwer Elektronen ab und sind schwache Reduktionsmittel. Die Spannung einer galvanischen Zelle berechnet sich aus $\Delta E^0 = E^0_{\text{Kathode}} - E^0_{\text{Anode}}$. Spontane Reaktionen haben $\Delta E^0 > 0$: Das unedlere Metall reduziert das edlere. Die NERNST-Gleichung ermöglicht die Berechnung von Potentialen unter Nicht-Standardbedingungen.
