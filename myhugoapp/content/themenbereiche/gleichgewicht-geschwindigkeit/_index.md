---
title: "Gleichgewicht und Geschwindigkeit"
description: "Reaktionskinetik und chemisches Gleichgewicht - Erfahren Sie alles über Reaktionsgeschwindigkeit, Einflussfaktoren, Geschwindigkeitsgesetze, chemisches Gleichgewicht und das Prinzip von Le Chatelier"
date: 2025-12-26
teilgebiet: "gleichgewicht-geschwindigkeit"
schwierigkeit: "fortgeschritten"
icon: "⚖️"
weight: 40
interaktiv: true
quiz: "gleichgewicht-geschwindigkeit"
---

# Gleichgewicht und Geschwindigkeit

Chemische Reaktionen laufen nicht alle mit der gleichen Geschwindigkeit ab. Manche sind explosionsartig schnell, andere brauchen Jahre. Zudem erreichen viele reversible Reaktionen ein chemisches Gleichgewicht. Das Verständnis dieser Konzepte ist essenziell für die chemische Industrie, Biochemie und Umweltwissenschaften.

## Was ist die Reaktionsgeschwindigkeit?

Die **Reaktionsgeschwindigkeit** beschreibt, wie schnell die Konzentration eines Reaktanden oder Produkts pro Zeiteinheit ändert.

$$v = -\frac{\Delta c(\text{Reaktand})}{\Delta t} = +\frac{\Delta c(\text{Produkt})}{\Delta t}$$

- $v$ = Reaktionsgeschwindigkeit (mol/(L·s))
- $\Delta c$ = Konzentrationsänderung (mol/L)
- $\Delta t$ = Zeitänderung (s)

**Beispiel:** Die Zersetzung von Wasserstoffperoxid

$$\ce{2H2O2 -> 2H2O + O2}$$

## Messung der Reaktionsgeschwindigkeit

### Methoden zur Geschwindigkeitsbestimmung

1. **Volumetrische Messung:** Gasentwicklung messen
   - Beispiel: Zersetzung von H₂O₂ (Sauerstoff-Entwicklung)

2. **Kolorimetrische Messung:** Farbänderung verfolgen
   - Beispiel: Entfärbung von Kaliumpermanganat

3. **Konduktometrische Messung:** Leitfähigkeitsänderung
   - Beispiel: Verseifung von Estern

4. **Titration:** Proben entnehmen und titrieren
   - Beispiel: Veresterung

## Faktoren influencing die Reaktionsgeschwindigkeit

### 1. Konzentration der Reaktanden

Je höher die Konzentration, desto schneller die Reaktion (mehr Teilchenkollisionen).

**Gesetz der Massenwirkung:**
$$v \sim c(\text{Reaktand}_1) \cdot c(\text{Reaktand}_2)$$

### 2. Temperatur

Höhere Temperatur → schnellere Reaktion (mehr Teilchen mit ausreichender Energie).

**RGT-Regel (Raoult-Guldberg- van't Hoff):**
```
Eine Erhöhung um 10 K verdoppelt bis vervierfacht die Geschwindigkeit.
```

**Arrhenius-Gleichung:**
$$k = A \cdot e^{-E_a/(R \cdot T)}$$

- $k$ = Geschwindigkeitskonstante
- $A$ = Frequenzfaktor
- $E_a$ = Aktivierungsenergie
- $R$ = Gaskonstante
- $T$ = Temperatur (K)

### 3. Katalysatoren

**Katalysatoren** senken die Aktivierungsenergie und beschleunigen Reaktionen, ohne selbst verbraucht zu werden.

**Beispiele:**
- **Platin** in Katalysatoren (Autoabgase)
- **Enzyme** im Körper (biologische Katalysatoren)
- **Eisen** im Haber-Bosch-Verfahren

### 4. Oberfläche

Bei heterogenen Reaktionen: größere Oberfläche → schnellere Reaktion.

**Beispiel:** Zinkpulver reagiert schneller mit Säure als Zinkstücke

### 5. Druck (bei Gasen)

Höherer Druck → höhere Konzentration → schnellere Reaktion

## Geschwindigkeitsgesetze

### Reaktionsordnung

Die **Reaktionsordnung** gibt an, wie die Geschwindigkeit von den Konzentrationen abhängt.

**Nullte Ordnung:**
$$v = k \quad \text{(unabhängig von Konzentration)}$$

**Erste Ordnung:**
$$v = k \cdot c(A)$$

**Zweite Ordnung:**
$$v = k \cdot c(A) \cdot c(B)$$

### Beispiel: Zersetzung von N₂O₅

$$\ce{2N2O5 -> 4NO2 + O2}$$

$$v = k \cdot c(\ce{N2O5}) \quad \text{(1. Ordnung)}$$

## Aktivierungsenergie

Die **Aktivierungsenergie (Ea)** ist die minimale Energie, die Teilchen benötigen, um zu reagieren.

**Energieprofil:**

```
Energie
  ↑
  │      /\ Übergangszustand
  │     /  \
Ea   /    \
   /      \
  /        \__________
  └─────────────────→ Reaktionskoordinate
  Reaktanden      Produkte
```

**Katalysator-Wirkung:**
```
Energie
  ↑
  │      /\  Ohne Katalysator
  │     /  \
Ea1  /    \
   /      \
  │    /\  Mit Katalysator
Ea2│   /  \
  │__/    \__________
  └─────────────────→
```

## Chemisches Gleichgewicht

### Was ist ein chemisches Gleichgewicht?

Bei **reversiblen Reaktionen** können Reaktanden und Produkte miteinander reagieren. Im Gleichgewicht sind die Geschwindigkeiten von Hin- und Rückreaktion gleich.

**Beispiel:**
$$\ce{N2 + 3H2 <=> 2NH3}$$

$$v(\text{hin}) = v(\text{rück})$$

### Merkmale des Gleichgewichts

- **Dynamisch:** Reaktion läuft weiter, aber keine netto-Änderung
- **Mikroskopisch:** Einzelne Teilchen reagieren weiter
- **Makroskopisch:** Konzentrationen bleiben konstant
- **Umkehrbar:** Änderung der Bedingungen verschiebt Gleichgewicht

## Massenwirkungsgesetz

Das **Massenwirkungsgesetz** beschreibt die Beziehung zwischen Konzentrationen im Gleichgewicht.

Für die Reaktion:
$$aA + bB \rightleftharpoons cC + dD$$

Gilt:
$$K = \frac{[C]^c \cdot [D]^d}{[A]^a \cdot [B]^b}$$

- $K$ = Gleichgewichtskonstante
- $[...]$ = Gleichgewichtskonzentration

### Beispiel: Synthese von HI

$$\ce{H2 + I2 <=> 2HI}$$

$$K = \frac{[\ce{HI}]^2}{[\ce{H2}] \cdot [\ce{I2}]}$$

## Prinzip von Le Chatelier

Das **Prinzip von Le Chatelier** besagt: Wenn ein System im Gleichgewicht gestört wird, verschiebt sich das Gleichgewicht, um die Störung zu kompensieren.

### Einflussfaktoren auf das Gleichgewicht

#### 1. Konzentrationsänderung

**Mehr Reaktanden:** Gleichgewicht verschiebt sich zu Produkten

**Beispiel:**
$$\ce{N2 + 3H2 <=> 2NH3}$$

Mehr $\ce{H2}$ → mehr $\ce{NH3}$ (Produkt)

#### 2. Druckänderung (bei Gasen)

**Höherer Druck:** Verschiebung zur Seite mit weniger Gasmolekülen

**Beispiel:**
$$\ce{N2(g) + 3H2(g) <=> 2NH3(g)}$$

$$4 \text{ Mol Gas} \rightarrow 2 \text{ Mol Gas}$$

Höherer Druck → mehr $\ce{NH3}$ (weniger Gasmoleküle)

#### 3. Temperaturänderung

**Exotherme Reaktion ($\Delta H < 0$):**
- Höhere Temperatur → Verschiebung zu Reaktanden (endotherme Richtung)

**Endotherme Reaktion ($\Delta H > 0$):**
- Höhere Temperatur → Verschiebung zu Produkten (endotherme Richtung)

**Beispiel (exotherm):**
$$\ce{N2 + 3H2 <=> 2NH3} \quad \Delta H = -92 \text{ kJ/mol}$$

Höhere Temperatur → weniger $\ce{NH3}$

#### 4. Katalysatoren

Katalysatoren beschleunigen Hin- und Rückreaktion gleichmäßig → **keine Verschiebung** des Gleichgewichts, nur schnellere Einstellung.

## Praktische Anwendungen

### Haber-Bosch-Verfahren (Ammoniak-Synthese)

```
N₂ + 3H₂ ⇌ 2NH₃      ΔH = -92 kJ/mol
```

**Optimierung nach Le Chatelier:**
- **Höherer Druck** (200-300 bar): verschiebt zu NH₃ (weniger Gasmoleküle)
- **Mittlere Temperatur** (400-500°C): Kompromiss zwischen Geschwindigkeit und Ausbeute
- **Eisen-Katalysator:** beschleunigt Einstellung
- **Entfernen von NH₃:** verschiebt Gleichgewicht zu Produkten

### Kontaktverfahren (Schefelsäure-Produktion)

```
2SO₂ + O₂ ⇌ 2SO₃      ΔH = -198 kJ/mol
```

**Optimierung:**
- Höherer Druck (1-2 bar)
- Mittlere Temperatur (400-450°C)
- Vanadium-Pentoxid-Katalysator (V₂O₅)

### Ostwald-Verfahren (Salpetersäure)

```
4NH₃ + 5O₂ ⇌ 4NO + 6H₂O      ΔH = -907 kJ/mol
```

## Reaktionstypen

### Homogene Reaktionen

Alle Reaktanden in gleicher Phase (z.B. alle in Lösung)

**Beispiel:** Neutralisation

```
HCl + NaOH → NaCl + H₂O
```

### Heterogene Reaktionen

Reaktanden in verschiedenen Phasen (z.B. Gas + Feststoff)

**Beispiel:** Verbrennung

```
C(s) + O₂(g) → CO₂(g)
```

### Katalytische Reaktionen

Reaktionen mit Katalysator (beschleunigt, aber nicht verbraucht)

**Beispiel:** Hydrolyse von Stärke mit Amylase

## Experimente

### Experiment 1: Temperaturabhängigkeit
**Materialien:** Natriumthiosulfat, Salzsäure, Wasserbad, Stoppuhr

**Durchführung:**
1. Natriumthiosulfat mit Salzsäure bei verschiedenen Temperaturen mischen
2. Zeit bis zur Trübung messen
3. Geschwindigkeit berechnen

**Erklärung:** Höhere Temperatur → schnellere Reaktion (RGT-Regel)

### Experiment 2: Katalysator-Wirkung
**Materialien:** Wasserstoffperoxid, Mangandioxid, Spatel

**Durchführung:**
1. H₂O₂ zersetzen (ohne Katalysator)
2. MnO₂ zugeben
3. Gasentwicklung beobachten

**Erklärung:** Katalysator senkt Aktivierungsenergie

### Experiment 3: Gleichgewichtsverschiebung
**Materialien:** CoCl₂-Lösung, HCl-Wasser, Konz. HCl

**Durchführung:**
1. CoCl₂-Lösung (rosa) mit HCl versetzen
2. Farbwechsel zu blau beobachten
3. Verdünnen (Wasser zugeben)

**Erklärung:** Gleichgewichtsverschiebung durch Konzentrationsänderung

```
[Co(H₂O)₆]²⁺ (rosa) + 4Cl⁻ ⇌ [CoCl₄]²⁻ (blau) + 6H₂O
```

## Berechnungen

### Geschwindigkeitskonstante berechnen

**Beispiel:** Zersetzung von H₂O₂

```
2H₂O₂ → 2H₂O + O₂

Messung:
t = 0 s:    c(H₂O₂) = 0.1 mol/L
t = 60 s:   c(H₂O₂) = 0.05 mol/L

v = -Δc/Δt = -(0.05 - 0.1)/60 = 8.33·10⁻⁴ mol/(L·s)
```

### Halbwertszeit

Die **Halbwertszeit (t₁/₂)** ist die Zeit, in der die Hälfte des Reaktanden verbraucht wird (1. Ordnung).

```
t₁/₂ = ln(2)/k = 0.693/k
```

## Lernziele

Nach Abschluss dieses Themenbereichs sollten Sie:
- ✅ Die Reaktionsgeschwindigkeit definieren können
- ✅ Methoden zur Geschwindigkeitsmessung kennen
- ✅ Faktoren beeinflussen die Reaktionsgeschwindigkeit erklären können
- ✅ Geschwindigkeitsgesetze anwenden können
- ✅ Die Arrhenius-Gleichung verstehen können
- ✅ Das chemische Gleichgewicht beschreiben können
- ✅ Das Massenwirkungsgesetz anwenden können
- ✅ Das Prinzip von Le Chatelier vorhersagen können
- ✅ Technische Anwendungen (Haber-Bosch) erklären können

## Weiterführende Themen

- [Energetik](/themenbereiche/energetik/) – Energieumsatz bei Reaktionen
- [Redoxreaktionen](/themenbereiche/redox-elektrochemie/) – Reaktionsmechanismen
- [Analytische Methoden](/themenbereiche/analytische-methoden/) - Reaktionsverfolgung
- [Reaktionsgleichungen ausgleichen](/reaktionsgleichungen-ausgleichen/) – Interaktives Tool
