---
title: 'Massenspektrometrie in der Chemie'
description: 'Massenspektrometrie (MS) ermöglicht die Bestimmung der Molekülmasse und die Identifizierung von Substanzen durch Fragmentierung. Grundlagen und Anwendungen.'
date: '2026-07-06'
tags: ['chemie', 'analytik', 'massenspektrometrie', 'MS', 'fragmentierung', 'spektroskopie']
interaktiv: false
schwierigkeit: 'fortgeschritten'
teilgebiet: ['analytische-methoden']
icon: '⚖️'
aliases: [/article/massenspektrometrie/]
---

## Einführung

Die **Massenspektrometrie (MS)** ist eine analytische Methode zur Bestimmung der Masse von Molekülen und Atomen. Sie liefert Informationen über die **molare Masse**, die **Summenformel** und die **Struktur** unbekannter Verbindungen.

Das Grundprinzip: Die Probe wird ionisiert, die Ionen werden nach ihrem Masse-zu-Ladung-Verhältnis ($m/z$) getrennt und detektiert.

## Aufbau eines Massenspektrometers

Ein Massenspektrometer besteht aus drei wesentlichen Komponenten:

### 1. Ionenquelle

Hier werden die Moleküle ionisiert. Die wichtigsten Ionisationsmethoden sind:

| Methode                       | Kurzform | Beschreibung                                            |
| ----------------------------- | -------- | ------------------------------------------------------- |
| **Elektronenstoß-Ionisation** | EI       | Elektronenbeschuss (70 eV), starke Fragmentierung       |
| **Chemische Ionisation**      | CI       | Reaktandgas (z. B. $CH_4$), sanftere Ionisation         |
| **Elektrospray-Ionisation**   | ESI      | Für Biomoleküle, mehrfach geladene Ionen                |
| **MALDI**                     | MALDI    | Matrix-unterstützte Laserdesorption, für große Moleküle |
| **Feldionisation**            | FI       | Sanfte Ionisation, schwache Fragmentierung              |

Bei der klassischen **EI-Massenspektrometrie** wird die Probe in der Gasphase mit einem energiereichen Elektronenstrahl (70 eV) beschossen:

$$\ce{M + e^- -> M^{.+} + 2e^-}$$

Das entstehende **Molekülion** $M^{.+}$ kann weiter zerfallen (Fragmentierung).

### 2. Massenanalysator

Der Analysator trennt die Ionen nach ihrem $m/z$-Verhältnis. Wichtige Typen:

- **Quadrupol**: Vier Stabelektroden, die Ionen bestimmter $m/z$ passieren lassen
- **Flugzeit-Analysator (TOF)**: Ionen werden durch ein elektrisches Feld beschleunigt; die Flugzeit ist proportional zu $\sqrt{m/z}$
- **Ionenfalle (Ion Trap)**: Ionen werden in einem dreidimensionalen Feld gespeichert und selektiv ausgestoßen

Die **Flugzeit** $t$ im TOF-Analysator berechnet sich zu:

$$t = \sqrt{\frac{m}{2zU}} \cdot L$$

mit der Beschleunigungsspannung $U$, der Flugstrecke $L$ und der Ionenmasse $m$.

### 3. Detektor

Die Ionen treffen auf einen **Sekundärelektronenvervielfacher** (SEV), der das Signal verstärkt. Ein Computer zeichnet die **Massenspektren** auf ($m/z$ gegen relative Intensität).

## Interpretation von Massenspektren

### Molekülionenpeak

Der Peak mit der höchsten $m/z$ stammt meist vom **Molekülion** $M^{.+}$ und gibt die Molekülmasse an. Beispiele:

| Verbindung | Molekülion ($m/z$) | Fragmente ($m/z$)               |
| ---------- | ------------------ | ------------------------------- |
| Methan     | 16                 | 15 ($M-CH_3$), 14 ($M-CH_4$)    |
| Ethanol    | 46                 | 45 ($M-H$), 31 ($CH_2OH^+$), 29 |
| Benzol     | 78                 | 77 ($M-H$), 51, 50, 39          |

### Isotopenmuster

Die natürlichen Isotopenverhältnisse erzeugen charakteristische Signalmuster:

- **Chlor**: $^{35}Cl : ^{37}Cl = 3 : 1$ → zwei Peaks im Abstand von 2 $m/z$
- **Brom**: $^{79}Br : ^{81}Br = 1 : 1$ → zwei gleich große Peaks
- **Schwefel**: $^{32}S : ^{34}S = 95 : 4$ → kleiner M+2-Peak

Das Isotopenmuster hilft, Elemente in einer Verbindung zu identifizieren.

### Fragmentierungsregeln

Typische Fragmentierungen:

- **α-Spaltung**: Bindung in α-Stellung zu einem Heteroatom wird gebrochen
- **McLafferty-Umlagerung**: Umlagerung eines Wasserstoffatoms bei Carbonylverbindungen
- **Retro-Diels-Alder**: Fragmentierung bei cyclischen Verbindungen

## Anwendungen

- **Strukturaufklärung**: Identifizierung unbekannter Substanzen (gekoppelt mit GC oder HPLC)
- **Proteomanalyse**: Identifizierung von Proteinen (Peptide Mass Fingerprinting)
- **Doping-Analytik**: Nachweis von leistungssteigernden Substanzen im Urin
- **Umweltanalytik**: Bestimmung von Schadstoffen in Wasser und Boden
- **Isotopenverhältnis-MS**: Datierung von Gesteinen ($^{14}C$, $^{13}C/^{12}C$)

## Vor- und Nachteile

| Vorteile                                        | Nachteile                              |
| ----------------------------------------------- | -------------------------------------- |
| Hohe Empfindlichkeit (picomol bis femtomol)     | Aufwändige Gerätetechnik               |
| Genaue Molekülmasse                             | Keine direkte Information zur Struktur |
| Kombinierbar mit Chromatographie (GC-MS, LC-MS) | Proben müssen ionisierbar sein         |
| Schnell (Minuten pro Analyse)                   | Isomere sind schwer unterscheidbar     |

## Übungen

1. Ein unbekanntes Massenspektrum zeigt einen Molekülionenpeak bei $m/z = 78$, einen Basispeak bei $m/z = 51$ und einen Peak bei $m/z = 39$. Um welche Verbindung handelt es sich?
2. Berechnen Sie das Isotopenmuster (M, M+2, M+4) für $CH_2Br_2$.
3. Erklären Sie den Unterschied zwischen EI- und ESI-Ionisation und nennen Sie für jede Methode ein typisches Anwendungsgebiet.
4. Ein Ion mit $m/z = 200$ benötigt in einem TOF-Analysator ($U = 5000\ \pu{V}$, $L = 1\ \pu{m}$) 10 µs. Berechnen Sie die Flugzeit für ein Ion mit $m/z = 800$.
