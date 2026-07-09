---
title: 'Pufferlösungen'
description: 'Pufferlösungen halten den pH-Wert auch bei Zugabe von Säure oder Base nahezu konstant. Sie bestehen aus einem schwachen Säure-Base-Paar.'
date: '2026-06-08'
last_reviewed: '2026-07-09'
tags: ['chemie', 'puffer', 'ph-wert', 'gleichgewicht']
interaktiv: false
schwierigkeit: 'mittelstufe'
teilgebiet: ['saeuren-basen']
icon: '⚗️'
aliases: [/article/pufferloesungen/]
---

Ein **Puffer** ist eine Lösung, die ihren pH-Wert auch bei Zugabe kleinerer Mengen starker Säure ($H^+$) oder starker Base ($OH^-$) nahezu konstant hält. Ein Puffersystem besteht aus einer schwachen Säure und ihrer korrespondierenden Base.

Beispiel: **Essigsäure-Acetat-Puffer** ($CH_3COOH/CH_3COO^-$). Bei Zugabe von $H^+$ reagiert $CH_3COO^- + H^+ \rightarrow CH_3COOH$, bei Zugabe von $OH^-$ reagiert $CH_3COOH + OH^- \rightarrow CH_3COO^- + H_2O$.

## Die Henderson-Hasselbalch-Gleichung

Der pH-Wert eines Puffers wird berechnet mit:

$$pH = pK_s + \log\frac{[Base]}{[Säure]}$$

Dabei ist $pK_s = -\log K_s$ der negativ dekadische Logarithmus der Säurekonstante. Solange das Konzentrationsverhältnis zwischen Base und Säure im Bereich 10:1 bis 1:10 bleibt, ist der Puffer wirksam. Bei einem Verhältnis von 1:1 ist $pH = pK_s$, und die Pufferwirkung ist maximal.

## Beispiel: Essigsäure-Acetat-Puffer

Berechne den pH-Wert eines Puffers mit $c(CH_3COOH) = 0,20$ mol/L und $c(CH_3COO^-) = 0,50$ mol/L. Für Essigsäure gilt $pK_s = 4,75$.

$$pH = 4,75 + \log\frac{0,50}{0,20} = 4,75 + \log(2,5) = 4,75 + 0,40 = 5,15$$

Der Puffer hat einen pH-Wert von 5,15 und ist im leicht sauren Bereich wirksam.

## Pufferkapazität

Die **Pufferkapazität** gibt an, wie viel Säure oder Base zugegeben werden kann, bevor der pH-Wert merklich ändert. Sie hängt von der Gesamtkonzentration des Pufferpaars ab: Je höher die Konzentration, desto größer die Pufferkapazität. Ein Puffer mit $0,5$ mol/L essigsäure und Acetat puffert deutlich mehr als einer mit $0,05$ mol/L, obwohl beide den gleichen pH-Wert haben.

## Saure und basische Puffersysteme im Vergleich

| Eigenschaft           | Saurer Puffer                         | Basischer Puffer                         |
| --------------------- | ------------------------------------- | ---------------------------------------- |
| Bestandteile          | Schwache Säure + ihr Salz             | Schwache Base + ihr Salz                 |
| Beispiel              | $CH_3COOH/CH_3COONa$                  | $NH_3/NH_4Cl$                            |
| Wirkungsbereich       | pH < 7 (nahe $pK_s$ der Säure)        | pH > 7 (nahe $pK_s$ der Base)            |
| Gegen $H^+$           | Base neutralisiert zugefügtes $H^+$   | Base wird verbraucht                     |
| Gegen $OH^-$          | Säure neutralisiert zugefügtes $OH^-$ | Schwache Base reagiert                   |
| Henderson-Hasselbalch | $pH = pK_s + \log\frac{[A^-]}{[HA]}$  | $pH = pK_s + \log\frac{[Base]}{[Säure]}$ |

## Herstellung eines Puffers

Um einen Puffer mit einem bestimmten pH-Wert herzustellen, wählt man ein Säure-Base-Paar, dessen $pK_s$ möglichst nahe am gewünschten pH liegt (maximal $\pm 1$ pH-Einheit entfernt). Dann mischt man die Komponenten im richtigen Verhältnis. Für einen Puffer mit $pH = 5,0$ und Essigsäure ($pK_s = 4,75$):

$$5,0 = 4,75 + \log\frac{[Base]}{[Säure]} \implies \log\frac{[Base]}{[Säure]} = 0,25$$
$$\frac{[Base]}{[Säure]} = 10^{0,25} \approx 1,78$$

Man braucht also etwa 1,78 mal so viel Acetat wie Essigsäure.

## Beispiel: Blutpuffer

Das Blut enthält ein Carbonatpuffer ($HCO_3^-/H_2CO_3$) mit $pK_s = 6,35$. Der normale Blut-pH beträgt 7,4. Die Henderson-Hasselbalch-Gleichung zeigt:

$$7,4 = 6,35 + \log\frac{[HCO_3^-]}{[H_2CO_3]}$$
$$\log\frac{[HCO_3^-]}{[H_2CO_3]} = 1,05 \implies \frac{[HCO_3^-]}{[H_2CO_3]} \approx 11,2$$

Das Verhältnis von Hydrogencarbonat zu Kohlensäure liegt bei etwa 11:1. Dieser Puffer wird zusätzlich durch Hämoglobin und die Atmung stabilisiert.

## Alltagsrelevanz

**Azidose und Alkalose**: Wenn der Blut-pH unter 7,35 fällt, spricht man von **Azidose** (Übersäuerung), bei pH über 7,45 von **Alkalose**. Beides ist lebensgefährlich. Ursachen für Azidose sind u.a. Diabetes (Ketoazidose) oder Nierenversagen. Der Körper reguliert den pH durch beschleunigte Atmung ($CO_2$ abatmen, basischer Effekt) oder über die Nieren ($HCO_3^-$ ausscheiden bzw. zurückhalten).

**Natron gegen Säure**: Natriumhydrogencarbonat ($NaHCO_3$) wirkt als Basisches Puffer, wenn es mit einer Säure reagiert: $NaHCO_3 + H^+ \rightarrow Na^+ + H_2O + CO_2\uparrow$. Deshalb wird es gegen Sodbrennen eingesetzt und als Backtriebmittel verwendet. Im Haushalt neutralisiert Natron Essig, Zitronensäure und andere Haushaltssäuren.

Puffer in der Praxis:

- **Blut**: $\frac{HCO_3^-}{H_2CO_3}$ Puffer hält pH ≈ 7,4
- **Tränen**, **Speichel**
- **Technik**: Galvanik-Bäder, Shampoo-Hersteller nutzen Puffer, um Hautverträglichkeit zu sichern.
