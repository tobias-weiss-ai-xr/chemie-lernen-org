---
title: 'Prinzip von Le Chatelier'
description: 'Das Prinzip des kleinsten Zwanges: Ein System im Gleichgewicht reagiert auf äußere Änderungen so, dass diese teilweise rückgängig gemacht werden.'
date: '2026-06-08'
last_reviewed: '2026-07-09'
tags: ['chemie', 'gleichgewicht', 'le-chatelier', 'prinzip']
interaktiv: false
schwierigkeit: 'mittelstufe'
teilgebiet: ['gleichgewicht-geschwindigkeit']
icon: '⚖️'
aliases: [/article/prinzip-von-le-chatelier/]
---

## Das Prinzip

Das **Prinzip von Le Chatelier** (1884) besagt: Wenn ein chemisches Gleichgewicht gestört wird, reagiert das System so, dass die Störung **teilweise rückgängig gemacht** wird. Die Reaktion verschiebt sich in Richtung der Seite, die den äußeren Einfluss abschwächt.

## Temperaturänderung

| Änderung     | Endotherme Seite ($\Delta H > 0$) | Exotherme Seite ($\Delta H < 0$) |
| ------------ | --------------------------------- | -------------------------------- |
| Temperatur ↑ | begünstigt ✓                      | benachteiligt                    |
| Temperatur ↓ | benachteiligt                     | begünstigt ✓                     |

**Beispiel:** $N_2 + 3H_2 \rightleftharpoons 2NH_3\quad(\Delta H = -92\text{ kJ/mol})$

Die Ammoniaksynthese ist exotherm. Höhere Temperatur würde theoretisch weniger $NH_3$ begünstigen, aber aus kinetischen Gründen wird trotzdem bei 450°C gearbeitet (siehe Haber-Bosch unten).

## Druckänderung (Gasreaktionen)

Druckerhöhung begünstigt die Seite mit **weniger Gasmolekülen** (geringeres Volumen).

**Beispiel:** $N_2 + 3H_2 \rightleftharpoons 2NH_3$

- Eduktseite: $1 + 3 = 4$ mol Gas
- Produktseite: $2$ mol Gas
- **Druck ↑ → Verschiebung nach rechts** (mehr $NH_3$)

Bei Reaktionen mit gleicher Molzahl auf beiden Seiten (z. B. $H_2 + I_2 \rightleftharpoons 2HI$) hat Druckänderung **keinen Einfluss** auf die Gleichgewichtslage.

## Konzentrationsänderung

- **Edukt hinzufügen** → Gleichgewicht verschiebt sich zu den **Produkten**
- **Produkt entfernen** → Gleichgewicht verschiebt sich zu den **Produkten**
- **Produkt hinzufügen** → Gleichgewicht verschiebt sich zu den **Edukten**

**Beispiel:** In der Lösung $Fe^{3+} + SCN^- \rightleftharpoons FeSCN^{2+}$ (rot) wird durch Zugabe von $SCN^-$ die rote Farbe intensiver, da sich das Gleichgewicht nach rechts verschiebt.

## Katalysatoren

Ein **Katalysator verändert die Gleichgewichtslage nicht** — er beschleunigt sowohl Hin- als auch Rückreaktion gleichermaßen. Er verkürzt aber die Zeit, bis das Gleichgewicht erreicht ist.

## Haber-Bosch-Verfahren: Das Kompromiss-Beispiel

$$N_2 + 3H_2 \rightleftharpoons 2NH_3\quad(\Delta H = -92\text{ kJ/mol})$$

| Bedingung   | Thermodynamisch optimal   | Kinetisch optimal       | Gewählt                                   |
| ----------- | ------------------------- | ----------------------- | ----------------------------------------- |
| Temperatur  | niedrig (exotherm)        | hoch (schnelle Kinetik) | **450°C** (Kompromiss)                    |
| Druck       | hoch (weniger Gasvolumen) | technisch limitiert     | **200–300 bar**                           |
| Katalysator | —                         | —                       | **Eisen** mit $K_2O$/$Al_2O_3$-Promotoren |

Ohne Katalysator wäre die Reaktion bei 450°C extrem langsam. Ohne hohen Druck wäre die $NH_3$-Ausbeute gering. Das Haber-Bosch-Verfahren ist ein klassisches Beispiel für die Abwägung zwischen Thermodynamik und Kinetik.

## Alltagsbeispiele

- **Kohlensäure in Getränken:** $CO_2 + H_2O \rightleftharpoons H_2CO_3$ — Druck im Verschluss hält das Gleichgewicht links, Öffnen (Druck ↓) verschiebt es nach rechts, $CO_2$ entweicht, Getränk wird „flach"
- **Blut und Sauerstoff:** $Hb + 4\,O_2 \rightleftharpoons Hb(O_2)_4$ — In der Lunge (hohe $O_2$-Konzentration) reagiert das Gleichgewicht rechts, im Gewebe (niedrige $O_2$) nach links
- **Ozeanversauerung:** $CO_2 + H_2O \rightleftharpoons H_2CO_3 \rightleftharpoons H^+ + HCO_3^-$ — Steigendes $CO_2$ verschiebt das Gleichgewicht nach rechts, $H^+$ steigt, pH sinkt

## Übungen

1.  Gegeben ist die Reaktion $\ce{2SO2(g) + O2(g) <=> 2SO3(g)}$ mit $\Delta H = -198\,\text{kJ/mol}$. Sage voraus, wie sich das Gleichgewicht verschiebt, wenn:
    - (a) die Temperatur erhöht wird,
    - (b) der Druck erhöht wird,
    - (c) $\ce{SO2}$ zugegeben wird,
    - (d) $\ce{SO3}$ aus dem Reaktionsgemisch entfernt wird.
      Begründe jede Antwort mit dem Prinzip von Le Chatelier.

2.  Die Reaktion $\ce{N2(g) + 3H2(g) <=> 2NH3(g)}$ ist exotherm. Im Haber-Bosch-Verfahren wird dennoch bei $450\,^\circ\text{C}$ (nicht bei tieferen Temperaturen) gearbeitet. Erkläre diesen scheinbaren Widerspruch zwischen Thermodynamik und Kinetik. Welche Rolle spielt der Eisenkatalysator dabei?

3.  In einer wässrigen Lösung stellt sich das Gleichgewicht $\ce{Fe^{3+}(aq) + SCN^{-}(aq) <=> FeSCN^{2+}(aq)}$ (rot) ein. Beschreibe die beobachtbare Farbänderung, wenn:
    - (a) $\ce{KSCN}$ (Kaliumthiocyanat) zugegeben wird,
    - (b) $\ce{Fe(NO3)3}$ zugegeben wird,
    - (c) die Lösung verdünnt wird.
      Begründe mit dem Prinzip von Le Chatelier.

4.  Betrachte die Reaktion $\ce{H2(g) + I2(g) <=> 2HI(g)}$. Begründe, warum eine Druckerhöhung hier keinen Einfluss auf die Gleichgewichtslage hat. Berechne die Molzahl auf jeder Seite und verallgemeinere die Bedingung, unter der Druckänderungen das Gleichgewicht verschieben.

5.  Eine geöffnete Cola-Flasche verliert nach einiger Zeit ihre Kohlensäure. Erkläre diesen Vorgang mithilfe des Prinzips von Le Chatelier, ausgehend vom Gleichgewicht $\ce{CO2(g) <=> CO2(aq)}$ und $\ce{CO2(aq) + H2O(l) <=> H2CO3(aq)}$. Welche Maßnahme könnte das Entweichen des $\ce{CO2}$ verlangsamen?

## Verwandte Themen

- [Chemisches Gleichgewicht](/themenbereiche/gleichgewicht-geschwindigkeit/chemisches-gleichgewicht/) – Wenn Hin- und Rückreaktion gleich schnell ablaufen, stellt sich ein Gleichgewicht ein. MWG beschreibt das Konzentrationsverhältnis.
- [Faktoren der Reaktionsgeschwindigkeit](/themenbereiche/gleichgewicht-geschwindigkeit/faktoren-reaktionsgeschwindigkeit/) – Konzentration, Temperatur, Oberfläche und Katalysatoren als Einflussgrößen auf die Geschwindigkeit chemischer Reaktionen.
- [Katalysatoren in der Industrie und Biologie](/themenbereiche/gleichgewicht-geschwindigkeit/katalysatoren-industrie-biologie/) – Homogene und heterogene Katalysatoren, Enzyme als biologische Katalysatoren und die industrielle Bedeutung der Katalyse.
- [Reaktionskinetik](/themenbereiche/gleichgewicht-geschwindigkeit/reaktionskinetik/) – Die Reaktionskinetik beschreibt die Geschwindigkeit, mit der chemische Reaktionen ablaufen. Faktoren: Konzentration, Temperatur, Katalysator.
