---
title: 'Korrosion und Korrosionsschutz'
description: 'Korrosion ist die unerwünschte Oxidation von Metallen. Grundlagen der elektrochemischen Korrosion und Verfahren des Korrosionsschutzes.'
date: '2026-07-06'
last_reviewed: '2026-07-09'
tags: ['chemie', 'redox-elektrochemie', 'korrosion', 'rost', 'korrosionsschutz', 'opferanode']
interaktiv: false
schwierigkeit: 'mittelstufe'
teilgebiet: ['redox-elektrochemie']
icon: '🦺'
aliases: [/article/korrosion/]
---

## Was ist Korrosion?

**Korrosion** ist die chemische oder elektrochemische Reaktion eines metallischen Werkstoffs mit seiner Umgebung, die zu einer messbaren Veränderung des Materials führt. Im Alltag bekannt ist das **Rosten** von Eisen und Stahl.

Korrosion ist stets mit einer **Oxidation** des Metalls verbunden:

$$\ce{Fe -> Fe^{2+} + 2e^-}$$

## Die elektrochemische Korrosion

Korrosion verläuft in Gegenwart von Wasser und Sauerstoff als elektrochemischer Prozess. Auf der Metalloberfläche bilden sich **Lokalelemente**:

### Anodenreaktion (Oxidation)

Am Ort der Anode wird das Metall oxidiert und geht als Ion in Lösung:

$$\ce{Fe -> Fe^{2+} + 2e^-}$$

### Kathodenreaktion (Reduktion)

Der Sauerstoff aus der Luft wird reduziert (bei neutralen oder basischen Bedingungen):

$$\ce{O2 + 2H2O + 4e^- -> 4OH^-}$$

In saurer Lösung erfolgt die Reduktion von Protonen:

$$\ce{2H^+ + 2e^- -> H2}$$

### Gesamtreaktion der Rostbildung

Das Eisen(II)-Ion reagiert weiter zu Eisen(III)-oxid-hydroxid – dem typischen Rost:

$$\ce{4Fe + 3O2 + 6H2O -> 4FeO(OH) + 4H2O}$$

Der Rost ($Fe_2O_3 \cdot xH_2O$) ist voluminös und porös, sodass er die Oberfläche nicht schützt, sondern weiteres Rosten begünstigt.

## Einflussfaktoren auf die Korrosion

| Faktor                       | Wirkung                                                 |
| ---------------------------- | ------------------------------------------------------- |
| **Sauerstoff**               | Notwendig für die kathodische Teilreaktion              |
| **Feuchtigkeit**             | Ermöglicht den Ionentransport (Elektrolyt)              |
| **pH-Wert**                  | Saure Umgebungen beschleunigen die Korrosion stark      |
| **Salze**                    | Erhöhen die Leitfähigkeit des Elektrolyten (Streusalz!) |
| **Temperatur**               | Höhere Temperaturen beschleunigen die Korrosion         |
| **Kontakt mit Edelmetallen** | Führt zur Bildung von Lokalelementen                    |

Besonders gefährlich ist **Lochkorrosion**, bei der sich kleine, tiefe Löcher bilden, oder **Spannungsrisskorrosion**, die durch mechanische Spannung begünstigt wird.

## Korrosionsschutzverfahren

Es gibt verschiedene Strategien, Metalle vor Korrosion zu schützen:

### 1. Passivierung

Manche Metalle (Aluminium, Chrom, Titan) bilden eine dichte, fest haftende Oxidschicht, die das darunterliegende Metall schützt:

$$\ce{2Al + 3H2O -> Al2O3 + 3H2}$$

Diese **Passivschicht** ist nur wenige Nanometer dick, aber extrem stabil. Technisch wird die Passivierung durch **Eloxieren** (anodische Oxidation) von Aluminium verstärkt.

### 2. Beschichtungen

- **Farblacke**: Verhindern den Zutritt von Sauerstoff und Wasser
- **Metallüberzüge**: Verzinken (Feuerverzinkung), Verchromen, Vernickeln

#### 📺 Lernvideo: Galvanisieren in der Praxis

{{< youtube id="h6XZ_EaReCg" title="Praktikum: Galvanisieren" >}}
**Lernvideo-Illustration:** _Einführung in die Chemie, Video zum Praktikum – Galvanisieren_ von **[Zig's Chemistry 42](https://www.youtube.com/@ZigsChemistry42)** (Prof. Siegfried Schindler) zeigt das elektrolytische Beschichten in der Praxis — ein zentrales Verfahren des Korrosionsschutzes durch Metallüberzüge.
{{< /youtube >}}

- **Emaille**: Glasartige Schicht auf Stahl

### 3. Kathodischer Korrosionsschutz

Das zu schützende Metall wird zur **Kathode** gemacht, indem es mit einem unedleren Metall verbunden wird:

**Opferanode**: Ein unedleres Metall (Zink, Magnesium) wird mit dem Stahl verbunden. Das unedlere Metall oxidiert bevorzugt:

$$\ce{Zn -> Zn^{2+} + 2e^-}$$

Die Elektronen fließen zum Stahl und verhindern dessen Oxidation. Opferanoden werden bei Schiffen, Pipelines und Warmwasserboilern eingesetzt.

**Fremdstrom-Anodenschutz**: Eine externe Gleichspannung erzwingt den kathodischen Schutz.

### 4. Inhibitoren

Chemische Zusätze, die die Korrosion verlangsamen:

- **Farben** (Phosphate, Chromate) – bilden Schutzschichten
- **Organische Inhibitoren** (Amine) – adsorbieren an der Metalloberfläche
- **Flüchtige Inhibitoren** (VCI) – werden in Verpackungen eingesetzt

## Korrosion im Alltag

- **Autos**: Streusalz im Winter beschleunigt die Korrosion enorm. Hohlraumversiegelung und Unterbodenschutz sind wichtige Maßnahmen.
- **Bauwerke**: Bewehrungsstahl in Beton ist durch das alkalische Milieu ($pH \approx 12–13$) passiviert. Eindringendes $CO_2$ (Karbonatisierung) oder Chloride zerstören die Passivschicht.
- **Heizungsanlagen**: Sauerstofffänger (Sulfit, Hydrazin) werden dem Heizungswasser zugesetzt.

## Übungen

1. Erklären Sie den Korrosionsprozess anhand eines Lokalelements auf einer Eisenoberfläche. Welche Teilreaktionen laufen ab?
2. Warum schützt eine Zinkschicht Stahl, obwohl Zink unedler ist?
3. Berechnen Sie die Zellspannung eines Lokalelements aus Eisen und Kupfer in einer sauren Lösung ($pH = 3$, $c(Fe^{2+}) = 10^{-5}\ \pu{mol/L}$).
4. Beschreiben Sie, warum Aluminium trotz seines geringen Standardpotentials nicht spontan korrodiert.

## Verwandte Themen

- [Elektrochemische Zellen](/themenbereiche/redox-elektrochemie/elektrochemische-zellen/) – Galvanische Zellen wandeln chemische Energie in elektrische um (Batterien). Elektrolysezellen wandeln elektrische Energie in chemische um (Metallgewinnung).
- [Elektrolyse und Galvanik](/themenbereiche/redox-elektrochemie/elektrolyse-galvanik/) – Elektrolyse vs. galvanische Zellen, Faradaysche Gesetze, industrielle Anwendungen (Aluminiumherstellung, Galvanisieren).
- [Oxidation und Reduktion](/themenbereiche/redox-elektrochemie/oxidation-und-reduktion/) – Oxidation = Elektronenabgabe, Reduktion = Elektronenaufnahme. Redox-Reaktionen stehen immer zusammen (Redox-Paar).
- [Spannungsreihe der Elemente](/themenbereiche/redox-elektrochemie/spannungsreihe/) – Die Spannungsreihe ordnet Metalle nach ihrer Fähigkeit, Elektronen abzugeben. Edle Metalle geben schwer, unedle leicht Elektronen ab.
