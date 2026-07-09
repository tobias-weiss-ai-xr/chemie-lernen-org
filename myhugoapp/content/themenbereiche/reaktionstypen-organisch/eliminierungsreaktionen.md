---
title: 'Eliminierungsreaktionen: E1- und E2-Mechanismen'
description: 'Eliminierungsreaktionen führen zur Bildung von Doppelbindungen. Die Mechanismen E1 und E2 unterscheiden sich in Kinetik, Übergangszustand und Produktselektivität.'
date: '2026-07-06'
last_reviewed: '2026-07-09'
tags: ['chemie', 'reaktionstypen', 'organik', 'eliminierung', 'E1', 'E2', 'mechanismus']
interaktiv: false
schwierigkeit: 'fortgeschritten'
teilgebiet: ['reaktionstypen-organisch']
icon: '⚡'
aliases: [/article/eliminierungsreaktionen/]
---

## Einführung

**Eliminierungsreaktionen** sind Reaktionen, bei denen aus einem Molekül zwei Atome oder Atomgruppen unter Bildung einer **Doppelbindung** (oder Dreifachbindung) abgespalten werden. Sie sind die Umkehrung von Additionsreaktionen.

Man unterscheidet zwei Hauptmechanismen: **E1** (monomolekular) und **E2** (bimolekular).

## Der E1-Mechanismus

Der E1-Mechanismus verläuft in zwei Schritten und ist typisch für tertiäre Substrate in protischen Lösungsmitteln.

### Schritt 1: Bildung eines Carbenium-Ions

Die Abgangsgruppe (LG = Leaving Group) wird abgespalten, es entsteht ein Carbenium-Ion:

$$\ce{(CH3)3C-Br ->[langsam] (CH3)3C+ + Br-}$$

Dieser Schritt ist **geschwindigkeitsbestimmend** – die Reaktionsgeschwindigkeit hängt nur von der Konzentration des Substrats ab:

$$v = k[\text{Substrat}]$$

### Schritt 2: Deprotonierung

Eine Base (oft das Lösungsmittel) entzieht dem Carbenium-Ion ein Proton:

$$\ce{(CH3)3C+ + H2O -> (CH3)2C=CH2 + H3O+}$$

### Charakteristika des E1-Mechanismus

| Eigenschaft            | Beschreibung                                       |
| ---------------------- | -------------------------------------------------- |
| **Kinetik**            | 1. Ordnung ($v = k[Substrat]$)                     |
| **Zwischenstufe**      | Carbenium-Ion (stabil für Tertiär, Resonanz)       |
| **Abgangsgruppe**      | Gute Abgangsgruppen (Br⁻, Cl⁻, $H_2O$)             |
| **Lösungsmittel**      | Polar, protisch (Wasser, Alkohole)                 |
| **Stereochemie**       | Keine spezifische Geometrie (Carbenium ist planar) |
| **Konkurrenzreaktion** | $S_N1$-Substitution (oft als Nebenprodukt)         |

Da sich ein Carbenium-Ion auch **umlagern** kann (Wagner-Meerwein-Umlagerung), können bei E1-Reaktionen andere Produkte entstehen als erwartet.

## Der E2-Mechanismus

Der E2-Mechanismus ist ein **konzertierter** Prozess – die Abspaltung der Abgangsgruppe und die Deprotonierung erfolgen gleichzeitig.

### Reaktionsverlauf

Base und Abgangsgruppe stehen **anti-periplanar** zueinander:

$$\ce{B^- + H-C-C-LG ->[einstufig] B-H + C=C + LG^-}$$

Ein klassisches Beispiel:

$$\ce{CH3-CH2-Br + OH- -> H2C=CH2 + Br- + H2O}$$

### Geschwindigkeitsgesetz

Die Reaktionsgeschwindigkeit hängt von beiden Reaktanden ab:

$$v = k[\text{Substrat}][\text{Base}]$$

### Charakteristika des E2-Mechanismus

| Eigenschaft            | Beschreibung                                           |
| ---------------------- | ------------------------------------------------------ |
| **Kinetik**            | 2. Ordnung ($v = k[Substrat][Base]$)                   |
| **Zwischenstufe**      | Keine (konzertierter Übergangszustand)                 |
| **Erforderlich**       | Starke Base (z. B. $OH^-$, $RO^-$, $NH_2^-$)           |
| **Stereochemie**       | Anti-periplanare Anordnung von H und LG erforderlich   |
| **Konkurrenzreaktion** | $S_N2$-Substitution (bei primären Substraten)          |
| **Substrat**           | Bevorzugt an primären und sekundären Kohlenstoffatomen |

### Stereochemische Anforderung

Die **anti-periplanare Anordnung** ist zwingend: Das zu eliminierende Proton und die Abgangsgruppe müssen in einer Ebene auf gegenüberliegenden Seiten der C-C-Bindung liegen. Dies führt zu **stereospezifischen** Produkten.

## E1 vs. E2 – Vergleich

| Kriterium         | E1                     | E2                                |
| ----------------- | ---------------------- | --------------------------------- |
| **Kinetik**       | Monomolekular          | Bimolekular                       |
| **Schritte**      | Zwei                   | Einer                             |
| **Zwischenstufe** | Carbenium-Ion          | Keine                             |
| **Base**          | Schwach (oft LM)       | Stark                             |
| **Abgangsgruppe** | Gut                    | Gut                               |
| **Substrat**      | Tertiär > Sekundär     | Primär > Sekundär > Tertiär       |
| **Umlagerungen**  | Möglich                | Nicht möglich                     |
| **Stereochemie**  | Nicht stereospezifisch | Anti-periplanar, stereospezifisch |
| **Orientierung**  | Nach der Zaitsev-Regel | Nach der Zaitsev-Regel (oft)      |

## Zaitsev-Regel und Hofmann-Produkt

Die **Zaitsev-Regel** besagt, dass bei der Eliminierung bevorzugt das **stabilere, höher substituierte Alken** entsteht:

$$\ce{CH3-CH2-CHBr-CH3 ->[OH-] CH3-CH=CH-CH3 (Hauptprodukt, 80\%) + CH3-CH2-CH=CH2 (Nebenprodukt, 20\%)}$$

Bei **sterisch anspruchsvollen Basen** (z. B. Kalium-tert-butylat, $KO^tBu$) entsteht bevorzugt das weniger substituierte Alken – das **Hofmann-Produkt**.

## Konkurrenz mit Substitution

Eliminierung und nukleophile Substitution ($S_N1/S_N2$) laufen oft parallel ab. Welcher Weg dominiert, hängt ab von:

- **Temperatur**: Höhere Temperaturen begünstigen Eliminierung (höhere Aktivierungsenergie)
- **Basizität/Nukleophilie**: Starke Basen fördern E2
- **Sterische Hinderung**: Große Reste am Substrat begünstigen Eliminierung
- **Lösungsmittel**: Protische Lösungsmittel fördern E1

## Übungen

1. Zeichnen Sie den vollständigen E1-Mechanismus für die Dehydratisierung von 3-Methyl-2-butanol mit $H_2SO_4$.
2. Welches Produkt entsteht bei der E2-Eliminierung von 2-Brombutan mit Kalium-tert-butylat? Begründen Sie.
3. Warum verläuft die Eliminierung von 1-Chlor-2-methylpropan mit $OH^-$ nach E2, während 2-Chlor-2-methylpropan eher nach E1 reagiert?
4. Nennen Sie zwei experimentelle Methoden, um zu unterscheiden, ob eine Reaktion nach E1 oder E2 verläuft.

## Verwandte Themen

- [Eliminierung und Umlagerung (Überblick)](/themenbereiche/reaktionstypen-organisch/eliminierung-umlagerung/)
- [Nukleophile Substitution (SN1/SN2)](/themenbereiche/reaktionstypen-organisch/nukleophile-substitution/)
