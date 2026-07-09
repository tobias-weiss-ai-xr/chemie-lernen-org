---
title: 'Nukleophile Substitution (SN1 und SN2)'
description: 'SN1- und SN2-Mechanismen: Kinetik, Stereochemie, Lösungsmitteleffekte, Abgangsgruppen und Substrateinfluss.'
date: 2026-07-09
last_reviewed: '2026-07-09'
tags: ['chemie', 'organik', 'substitution', 'SN1', 'SN2', 'mechanismus']
interaktiv: false
schwierigkeit: fortgeschritten
teilgebiet: ['reaktionstypen-organisch']
icon: ⚗️
---

## Einführung

Die nukleophile Substitution ist eine der fundamentalen Reaktionsklassen der organischen Chemie. Ein Nukleophil ($\ce{Nu-}$) verdrängt eine Abgangsgruppe ($\ce{LG}$) an einem sp³-hybridisierten Kohlenstoffatom. Zwei Grenzfälle unterscheiden sich fundamental im Mechanismus: der **dissoziative SN1-Mechanismus** und der **konzertierte SN2-Mechanismus**.

## Mechanismus im Detail

### SN2-Mechanismus (substitution nucleophilic bimolecular)

Der SN2-Mechanismus verläuft in einem **einzigen Schritt** ohne Zwischenstufe. Das Nukleophil greift von hinten (rückseitig) an, während die Abgangsgruppe simultan abgespalten wird. Der Übergangszustand ist pentakoordiniert und trigonal-bipyramidal.

$$
\text{Rate} = k[\ce{R-LG}][\ce{Nu-}]
$$

Beispiel mit Methylbromid und Hydroxid:

$$
\ce{Br-CH3 + OH- -> [Übergangszustand]^{\ddag} -> HO-CH3 + Br-}
$$

Die Stereochemie ist strikt **invertiert** (Walden-Umkehr). Primäre Alkylhalogenide reagieren bevorzugt über SN2.

### SN1-Mechanismus (substitution, nucleophilic, unimolecular)

Der SN1-Mechanismus verläuft zweistufig:

1. **Langsame Dissoziation** der Abgangsgruppe zum Carbeniumion-Zwischenstufe
2. **Schneller Angriff** des Nukleophils auf das planare Carbeniumion

$$
\text{Rate} = k[\ce{R-LG}]
$$

$$
\ce{(CH3)3C-Br -> [(CH3)3C+] + Br- ->[+H2O] (CH3)3C-OH + H+}
$$

Da das Carbeniumion planar ist, erfolgt der Angriff von beiden Seiten etwa gleich wahrscheinlich. Dies führt zur **Racemisierung** (bei chiralen Zentren). Tertiäre Alkylhalide und Substrate, die stabile Carbeniumionen bilden, reagieren über SN1.

## Vergleich der Mechanismen

| Eigenschaft       | SN2                        | SN1                               |
| ----------------- | -------------------------- | --------------------------------- |
| **Kinetik**       | 2. Ordnung                 | 1. Ordnung                        |
| **Zwischenstufe** | Keine                      | Carbeniumion                      |
| **Stereochemie**  | Inversion                  | Racemisierung                     |
| **Substrat**      | Primär > Methyl ≫ Sekundär | Tertiär > Sekundär ≫ Primär       |
| **Nukleophil**    | Entscheidend               | Nicht in RGT bestimmend           |
| **LM-Einfluss**   | Aprotisch begünstigt       | Protisch begünstigt (Solvatation) |
| **Abgangsgruppe** | Gute LG nötig              | Gute LG nötig                     |

## Einflüsse auf den Reaktionsverlauf

### Substrateinfluss

SN2 wird durch sterische Hinderung erschwert: $\ce{CH3- > 1° > 2° > 3°}$. SN1 profitiert von hyperkonjugativer Stabilisierung: $\ce{3° > 2° > 1° \gg CH3-}$.

### Abgangsgruppen

Gute Abgangsgruppen sind schwache Basen: $\ce{I- > Br- > Cl- \gg F-}$. Tosylat ($\ce{TsO-}$) und Triflat ($\ce{OTf-}$) sind exzellente Abgangsgruppen.

### Lösungsmitteleffekte

Aprotische Lösungsmittel (Aceton, DMF, DMSO) solvatisieren Kationen nicht über Wasserstoffbrücken und begünstigen SN2. Protische Lösungsmittel (Wasser, Methanol) stabilisieren das Carbeniumion über Solvatation und begünstigen SN1.

## Übungen

1. **Mechanismus zuordnen:** Welchen Mechanismus (SN1/SN2) erwartest du für die Reaktion von $\ce{2-Brom-2-methylpropan}$ mit $\ce{NaOH}$ in Wasser? Begründe.

2. **Stereochemie:** Das (S)-Enantiomer von $\ce{2-Octanol}$ wird mit $\ce{SOCL2/Pyridin}$ umgesetzt. Welches Produkt entsteht? Wie ändert sich das Ergebnis mit $\ce{TsCl}$ unter $\ce{SN1-Bedingungen}$?

3. **Reaktivität ordnen:** Sortiere folgende Substrate nach abnehmender SN2-Reaktivität: $\ce{(CH3)3CBr}$, $\ce{CH3Br}$, $\ce{CH3CH2Br}$, $\ce{(CH3)2CHBr}$.

4. **Abgangsgruppen:** Begründe, warum $\ce{F-}$ eine schlechte Abgangsgruppe ist, während $\ce{I-}$ exzellent ist. Ziehe die Konzepte Basenstärke und Polarisierbarkeit heran.

## Zusammenfassung

SN2 und SN1 sind die beiden Grenzfälle der nukleophilen Substitution. SN2 ist ein konzertierter, bimolekularer Prozess mit stereochemischer Inversion, begünstigt an primären Zentren in aprotischen Medien. SN1 verläuft zweistufig über ein Carbeniumion mit planiem Zwischenzustand, was zu Racemisierung führt; er wird an tertiären Zentren und in protischen Lösungsmitteln beobachtet. Die Wahl des Reaktionswegs wird durch Substrat, Abgangsgruppe, Nukleophil und Lösungsmittel bestimmt.
