---
title: "Reaktionstypen der Organischen Chemie"
description: "Substitution, Addition, Elimination und mehr - Erfahren Sie alles über die wichtigsten Reaktionstypen der organischen Chemie von SN1/SN2 über Polymerisation bis Kondensation"
date: 2025-12-26
teilgebiet: "reaktionstypen-organisch"
schwierigkeit: "fortgeschritten"
icon: "🔄"
weight: 100
interaktiv: true
---

# Reaktionstypen der Organischen Chemie

Die organische Chemie zeichnet sich durch eine enorme Vielfalt an Reaktionen aus. Das Verständnis der grundlegenden Reaktionstypen – Substitution, Addition, Elimination – ist der Schlüssel zum Verständnis komplexer synthetischer Wege in der Forschung und Industrie. Von der Herstellung einfacher Kunststoffe bis zur Synthese komplexer Wirkstoffe – diese Reaktionstypen sind überall.

## Überblick der Reaktionstypen

**Die vier Haupttypen organischer Reaktionen:**

1. **Substitution** – Austausch eines Atoms oder einer Atomgruppe
2. **Addition** – Anlagerung an eine Doppel- oder Dreifachbindung
3. **Elimination** – Abspaltung unter Bildung einer Mehrfachbindung
4. **Redoxreaktionen** – Elektronenübertragung (siehe auch [Redoxreaktionen](/themenbereiche/redox-elektrochemie/))

## Substitutionsreaktionen

### Was ist eine Substitution?

Bei **Substitutionsreaktionen** wird ein Atom oder eine Atomgruppe durch ein anderes ersetzt.

**Allgemeines Schema:**

$$\ce{R-X + Y -> R-Y + X}$$

### Nucleophile Substitution (S_N)

**Nucleophile Substitution** – Angreifer (Nucleophil) ersetzt eine Abgangsgruppe.

#### S_N2-Mechanismus (bimolekular)

**Eigenschaften:**
- Einzeitiger Prozess
- Inversion am Kohlenstoff (Walden-Umkehr)
- Kinetik: $v = k[\ce{R-X}][\ce{Nu-}]$

**Beispiel:** Hydrolyse von Methyliodid

$$\ce{CH3I + OH- -> CH3OH + I-}$$

Übergangszustand:
```
    H
    |
H — C — I  +  OH⁻  →  [H₃C---I---OH]‡  →  CH₃OH + I⁻
    |
    H
```

**Faktoren:**
- Primäre Halogenide reagieren am schnellsten
- Sterische Hinderung verlangsamt Reaktion
- Polare aprotische Lösungsmittel beschleunigen

#### S_N1-Mechanismus (unimolekular)

**Eigenschaften:**
- Zweizeitiger Prozess
- Bildung eines Carbocations (Zwischenstufe)
- Kinetik: $v = k[\ce{R-X}]$

**Beispiel:** Hydrolyse von tert-Butylchlorid

Schritt 1: $\ce{(CH3)3C-Cl -> (CH3)3C+ + Cl-}$ (langsam)

Schritt 2: $\ce{(CH3)3C+ + OH- -> (CH3)3C-OH}$ (schnell)

Gesamt: $\ce{(CH3)3C-Cl + OH- -> (CH3)3C-OH + Cl-}$

**Faktoren:**
- Tertiäre Halogenide reagieren bevorzugt
- Stabile Carbikationen fördern Reaktion
- Polare protische Lösungsmittel begünstigen

### Elektrophile Substitution (S_E)

**Elektrophile Substitution** –typisch für Aromaten

**Beispiel:** Nitrierung von Benzol

$$\ce{C6H6 + HNO3 -> C6H5NO2 + H2O}$$

Mechanismus:
$$\ce{C6H6 + NO2+ -> C6H6-NO2+} \text{ (Komplex)}$$

$$\ce{C6H6-NO2+ -> C6H5NO2 + H+}$$

**Anwendung:**
- Herstellung von Nitrobenzol
- Sulfonierung
- Friedel-Crafts-Alkylierung

### Radikalische Substitution

**Radikalische Substitution** – Kettenreaktion mit Radikalen

**Beispiel:** Chlorierung von Methan

Initiierung: $\ce{Cl2 -> 2Cl^.}$ (Licht/Hitze)

Propagation: $\ce{CH4 + Cl^. -> CH3^. + HCl}$

$\ce{CH3^. + Cl2 -> CH3Cl + Cl^.}$

Terminierung: $\ce{2Cl^. -> Cl2}$

$\ce{2CH3^. -> C2H6}$

$\ce{CH3^. + Cl^. -> CH3Cl}$

## Additionsreaktionen

### Was ist eine Addition?

Bei **Additionsreaktionen** lagern sich Atome oder Moleküle an eine Doppel- oder Dreifachbindung an.

**Allgemeines Schema:**

$$\ce{R1-CH=CH-R2 + A-B -> R1-CH(A)-CH(B)-R2}$$

### Elektrophile Addition

**Beispiel:** Addition von Brom an Ethen

$$\ce{CH2=CH2 + Br2 -> CH2Br-CH2Br}$$

Mechanismus:

Schritt 1: $\ce{CH2=CH2 + Br2 -> CH2-CH2-Br+ + Br-}$

Schritt 2: $\ce{CH2-CH2-Br+ + Br- -> CH2Br-CH2Br}$

**Markownikow-Regel:**

Bei Addition von HX an unsymmetrische Alkene lagert sich H an das C mit mehr H-Atomen:

$$\ce{CH3-CH=CH2 + HBr -> CH3-CHBr-CH3}$$

(Propen) → (2-Brompropan)

### Nucleophile Addition

**Beispiel:** Addition von Wasser an Aldehyde

$$\ce{R-CHO + H2O -> R-CH(OH)2}$$

**Beispiel:** Cyanhydrat-Bildung

$$\ce{R-CHO + HCN -> R-CH(OH)-CN}$$

### Katalytische Hydrierung

**Beispiel:** Hydrierung von Ethen

$$\ce{CH2=CH2 + H2 -> CH3-CH3}$$

Katalysator: Pd, Pt, Ni

**Anwendung:**
- Härtung von Fetten
- Reduktion von Alkenen zu Alkanen

## Eliminierungsreaktionen

### Was ist eine Elimination?

Bei **Eliminierungsreaktionen** werden Atome oder Gruppen aus benachbarten Kohlenstoffatomen abgespalten, wobei eine Doppelbindung entsteht.

**Allgemeines Schema:**

$$\ce{R-CH2-CH2-X -> R-CH=CH2 + HX}$$

### E1-Mechanismus (unimolekular)

**Beispiel:** Elimination aus 2-Brom-2-methylpropan

Schritt 1: $\ce{(CH3)3C-Br -> (CH3)2C=CH2 + HBr}$

Schritt 2: $\ce{(CH3)2C=CH2 + Br- -> \text{Produkte}}$

**Eigenschaften:**
- Bildung eines Carbocations
- Konkurrenz mit S_N1
- Saytzeff-Regel: Wasserstoff wird vom benachbarten Kohlenstoff mit weniger Wasserstoffatomen entfernt

### E2-Mechanismus (bimolekular)

**Beispiel:** Elimination aus 1-Brompropan

$$\ce{CH3-CH2-CH2-Br + Base -> CH3-CH=CH2 + HBr}$$

Base ($\ce{OH-}$) entfernt H, während $\ce{Br-}$ abspaltet

**Eigenschaften:**
- Einzeitiger Prozess
- Anti-periplanare Anordnung von H und Abgangsgruppe
- Konkurrenz mit S_N2

## Konkurrenz: Substitution vs. Elimination

**Wann tritt was auf?**

| Bedingung | Substitution | Elimination |
|-----------|--------------|-------------|
| Primäres Halogenid | S_N2 dominiert | E2 bei starker Base, hoher Temperatur |
| Sekundäres Halogenid | S_N2/E2 Konkurrenz | E2 bei starker Base |
| Tertiäres Halogenid | S_N1 bei schwachem Nucleophil | E1 bei starker Base, hoher Temperatur |

**Beispiel:** 2-Brombutan

Mit schwachem Nucleophil ($\ce{H2O}$): S_N1 → 2-Butanol

Mit starker Base ($\ce{OH-}$): E2 → But-2-en

## Polymerisation

### Was ist Polymerisation?

**Polymerisation** ist die Verknüpfung vieler kleiner Moleküle (Monomere) zu großen Molekülen (Polymeren).

### Kettenpolymerisation (Additionspolymerisation)

**Radikalische Polymerisation**

**Beispiel:** Polyethylen aus Ethen

Initiierung: $\ce{Radikal^. + CH2=CH2 -> ^.CH2-CH2^.}$

Wachstum: $\ce{^.CH2-CH2^. + n CH2=CH2 -> ^.(CH2-CH2)_{n}^.}$

Terminierung: $\ce{2 ^.(CH2-CH2)_{n}^. -> (CH2-CH2)_{2n}}$

**Anwendung:**
- Polyethylen (PE)
- Polypropylen (PP)
- Polystyrol (PS)
- PVC (Polyvinylchlorid)

### Polykondensation

**Polykondensation** – Monomere verbinden sich unter Abspaltung kleiner Moleküle.

**Beispiel:** Polyamid (Nylon) aus Hexamethylendiamin und Adipinsäure

$$\ce{n H2N-(CH2)6-NH2 + n HOOC-(CH2)4-COOH ->}$$

$$\ce{-> -(NH-(CH2)6-NH-CO-(CH2)4-CO)_{n}- + 2n H2O}$$

**Anwendung:**
- Nylon (Polyamid)
- PET (Polyethylenterephthalat)
- Polycarbonate

## Weitere wichtige Reaktionstypen

### Oxidation und Reduktion

**Oxidation von Alkoholen:**

Primärer Alkohol: $\ce{R-CH2-OH -> R-CHO -> R-COOH}$

(Aldehyd) → (Carbonsäure)

Sekundärer Alkohol: $\ce{R2CH-OH -> R2C=O}$

(Keton)

Tertiärer Alkohol: $\ce{R3C-OH -> \text{keine Oxidation}}$

**Beispiel:** Oxidation von Ethanol

$$\ce{CH3CH2OH + [O] -> CH3CHO + H2O}$$

(Alkohol) → (Aldehyd)

### Veresterung

**Veresterung** – Carbonsäure + Alkohol reagieren zu Ester + Wasser

$$\ce{R-COOH + R'-OH <=> R-COO-R' + H2O}$$

Katalysator: Säure ($\ce{H2SO4}$)

**Beispiel:** Essigsäure + Ethanol → Essigsäureethylester

$$\ce{CH3COOH + C2H5OH <=> CH3COOC2H5 + H2O}$$

### Verseifung

**Verseifung** – Ester-Hydrolyse mit Lauge

$$\ce{R-COO-R' + NaOH -> R-COONa + R'-OH}$$

**Anwendung:** Herstellung von Seife aus Fetten

## Reaktionsmechanismen verstehen

### Energieprofile

**S_N2:**
```
Energie
  ↑
  │      /\ Übergangszustand
Ea │     /  \
  │    /    \
  │___/      \__________
  └─────────────────→
  Edukte    Produkte
```

**S_N1:**
```
Energie
  ↑
  │   /\   Carbokation
Ea │  / \  (Zwischenstufe)
  │ /   \
  │/     \__________
  └─────────────────→
  Edukt  Produkte
```

### Regeln für Reaktionsverlauf

**Hammond-Postulat:** Der Übergangszustand ähnelt energetisch der nächstgelegenen Spezies (Edukt oder Produkt).

**Bell-Evans-Polanyi-Prinzip:** Exotherme Reaktionen haben frühe Übergangszustände, endotherme Reaktionen späte.

## Praktische Anwendungen

### 1. Kunststoffherstellung

**Polyethylen (PE):**

$$\ce{n CH2=CH2 -> -(CH2-CH2)_{n}-}$$

**Polypropylen (PP):**

$$\ce{n CH2=CH-CH3 -> -(CH2-CH(CH3))_{n}-}$$

### 2. Pharmazeutische Industrie

**Aspirin-Synthese:**
```
Salicylsäure + Essigsäureanhydrid → Acetylsalicylsäure + Essigsäure
```

### 3. Lebensmittelchemie

**Margarine-Herstellung:**
- Hydrierung ungesättigter Fettsäuren

### 4. Farbstoffsynthese

**Azofarbstoffe:**
```
Diazotierung + Kupplung → Azoverbindung (Farbstoff)
```

## Experimente

### Experiment 1: Addition von Brom
**Materialien:** Ethen (oder Cyclohexen), Bromwasser

**Durchführung:**
1. Bromwasser in Gasentwicklungsapparat
2. Eten zuleiten
3. Entfärbung beobachten

**Erklärung:** Elektrophile Addition an Doppelbindung

### Experiment 2: Veresterung
**Materialien:** Essigsäure, Ethanol, konc. H₂SO₄, Wasserbad

**Durchführung:**
1. Alle Komponenten mischen
2. Erhitzen (60°C, 10 Min)
3. Geruch beobachten

**Erklärung:** Bildung von Essigsäureethylester

### Experiment 3: Polymerisation (Modell)
**Materialien:** Styrol, Peroxid (Initiator), Wasserbad

**Durchführung:**
1. Styrol mit Peroxid mischen
2. Erhitzen (80°C)
3. Verfestigung beobachten

**Erklärung:** Radikalische Kettenpolymerisation

## Vorhersage von Reaktionen

**Checkliste für Reaktionsverlauf:**

1. **Welche funktionelle Gruppe?**
   - C=C: Addition möglich
   - C-X: Substitution/Elimination
   - C=O: Nucleophile Addition

2. **Welche Reaktionsbedingungen?**
   - Base: Elimination/Substitution
   - Säure: Katalyse
   - Hitze: Elimination begünstigt

3. **Welches Lösungsmittel?**
   - Polar protisch: S_N1/E1
   - Polar aprotisch: S_N2

4. **Welche Struktur?**
   - Primär: S_N2
   - Sekundär: Konkurrenz
   - Tertiär: S_N1/E1

## Lernziele

Nach Abschluss dieses Themenbereichs sollten Sie:
- ✅ Substitutionsreaktionen (S_N1, S_N2) unterscheiden können
- ✅ Additionsreaktionen erklären können
- ✅ Eliminierungsreaktionen vorhersagen können
- ✅ Die Markownikow-Regel anwenden können
- ✅ Polymerisationstypen unterscheiden können
- ✅ Mechanismen skizzieren können
- ✅ Reaktionsbedingungen auswählen können
- ✅ Praxisbeispiele zuordnen können

## Weiterführende Themen

- [Erdöl und Organische Stoffklassen](/themenbereiche/erdoel-organische-stoffklassen/) – Grundlagen organischer Verbindungen
- [Produkte der Organischen Chemie](/themenbereiche/produkte-organisch/) – Anwendungen
- [Redoxreaktionen](/themenbereiche/redox-elektrochemie/) – Oxidation/Reduktion
- [Gleichgewicht und Geschwindigkeit](/themenbereiche/gleichgewicht-geschwindigkeit/) – Reaktionskinetik
- [Molekülstudio](/molekuel-studio/) – 3D-Visualisierung von Molekülen
