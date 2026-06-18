---
title: "Stöchiometrie-Grundlagen"
description: "Molbegriff, Avogadro-Zahl, molare Masse und die Umrechnung zwischen Masse, Stoffmenge und Teilchenzahl — das Fundament quantitativer Chemie."
date: "2026-06-18"
tags: ["chemie", "stoechiometrie", "mol", "avogadro", "molare-masse"]
interaktiv: false
schwierigkeit: "grundlagen"
teilgebiet: ["aufbau-materie"]
icon: "⚛️"
---

Die **Stöchiometrie** beschreibt die quantitativen Beziehungen bei chemischen Reaktionen. Sie beantwortet die Frage: "Wie viel von Stoff A brauche ich, um eine bestimmte Menge von Stoff B herzustellen?" Das zentrale Konzept dafür ist der **Molbegriff**.

Ein **Mol** ist die SI-Einheit der Stoffmenge. Ein Mol einer Substanz enthält exakt $N_A = 6{,}022 \times 10^{23}$ Teilchen. Diese Zahl nennt man **Avogadro-Konstante**.

Um sich diese unvorstellbar große Zahl vorzustellen: ein Mol Sandkörner würde eine Fläche von der Größe Deutschlands mehrere Meter hoch bedecken. In der Praxis arbeiten Chemiker mit Mol, weil Atome und Moleküle viel zu klein und zahlreich sind, um sie einzeln zu zählen oder zu wiegen.

Die **molare Masse** ($M$) gibt an, wie viel Gramm ein Mol einer Substanz wiegt. Sie wird in g/mol angegeben und ist numerisch gleich der relativen Atommasse (bzw. Molekülmasse), die sich aus dem Periodensystem ablesen lässt.

Beispiele: Wasser ($H_2O$) hat die molare Masse $M = 2 \times 1{,}008 + 16{,}00 = 18{,}02\,\text{g/mol}$. Kochsalz ($NaCl$): $M = 22{,}99 + 35{,}45 = 58{,}44\,\text{g/mol}$. Glukose ($C_6H_{12}O_6$): $M = 6 \times 12{,}01 + 12 \times 1{,}008 + 6 \times 16{,}00 = 180{,}16\,\text{g/mol}$.

Die molare Masse berechnet man immer aus der Summe der molaren Massen aller Atome in der Summenformel. Den [Molare-Masse-Rechner](/molare-masse-rechner/) übernimmt diese Berechnung automatisch.

Die wichtigste Formel der Stöchiometrie verknüpft Masse und Stoffmenge:

$$n = \frac{m}{M}$$

Dabei ist $n$ die Stoffmenge in mol, $m$ die Masse in Gramm und $M$ die molare Masse in g/mol. Umformung ergibt: $m = n \cdot M$ (Masse berechnen) oder $M = \frac{m}{n}$ (molare Masse bestimmen). Diese drei Größen bilden das sogenannte **Mol-Dreieck**: wenn man zwei davon kennt, berechnet man die dritte.

Die Teilchenzahl ergibt sich aus der Stoffmenge über die Avogadro-Konstante:

$$N = n \cdot N_A$$

Will man also wissen, wie viele Moleküle in 36 Gramm Wasser enthalten sind, rechnet man: $n = \frac{36\,\text{g}}{18{,}02\,\text{g/mol}} = 2{,}00\,\text{mol}$ und $N = 2{,}00 \times 6{,}022 \times 10^{23} \approx 1{,}20 \times 10^{24}$ Moleküle.

Für Gase gibt es eine weitere nützliche Beziehung. Ein Mol jedes idealen Gases nimmt unter **Normbedingungen** ($0\,°\text{C}$, $1013\,\text{hPa}$) dasselbe Volumen ein: das **molare Normvolumen** $V_m = 22{,}4\,\text{l/mol}$. Daraus folgt:

$$V = n \cdot V_m$$

Ein Mol Sauerstoffgas ($O_2$) nimmt also unter Normbedingungen $22{,}4$ Liter ein, genauso wie ein Mol Helium oder ein Mol Kohlendioxid.

Stöchiometrische Berechnungen an Reaktionsgleichungen bilden den Kern praktischer Anwendungen. Betrachten wir die Reaktion von Wasserstoff und Sauerstoff zu Wasser: $2\,H_2 + O_2 \rightarrow 2\,H_2O$.

Aus der Gleichung liest man das stöchiometrische Verhältnis ab: $2\,\text{mol}\,H_2$ reagieren mit $1\,\text{mol}\,O_2$ zu $2\,\text{mol}\,H_2O$.

Wenn man $4\,\text{g}\,H_2$ einsetzt ($n = \frac{4{,}0}{2{,}016} = 1{,}98\,\text{mol}$), braucht man $0{,}99\,\text{mol}\,O_2 = 31{,}7\,\text{g}\,O_2$ und erhält $1{,}98\,\text{mol}\,H_2O = 35{,}7\,\text{g}\,H_2O$. Der [Stöchiometrie-Rechner](/stoechiometrie-rechner/) führt solche Berechnungen automatisch durch.

Bei realen Reaktionen verläuft nicht alles ideal. Die **theoretische Ausbeute** ist die Menge, die sich aus der stöchiometrischen Berechnung ergibt. Die **praktische Ausbeute** ist die Menge, die man im Labor tatsächlich isoliert. Die **prozentuale Ausbeute** berechnet sich als:

$$\text{Ausbeute} = \frac{\text{praktische Ausbeute}}{\text{theoretische Ausbeute}} \times 100\%$$

Ursachen für Ausbeuteverluste sind Nebenreaktionen, unvollständiger Umsatz, Verluste bei der Aufarbeitung oder Zersetzung des Produkts. In der industriellen Chemie und in der Synthese sind hohe Ausbeuten wirtschaftlich entscheidend.

Die **Molmasse** einer Verbindung lässt sich auch experimentell bestimmen, etwa durch Gefrierpunktserniedrigung (Kryoskopie) oder Siedepunktserhöhung (Ebulioskopie). Diese **kolligativen Eigenschaften** hängen nur von der Anzahl der gelösten Teilchen ab, nicht von ihrer Art. In der Schule wird meist die Gefrierpunktserniedrigung von Lösungen verwendet, um unbekannte molare Massen zu ermitteln.

Ein weiteres zentrales Werkzeug ist das **Mengenverhältnis** bei Reaktionen. Die stöchiometrischen Koeffizienten einer Reaktionsgleichung geben an, in welchem Verhältnis die Stoffe miteinander reagieren.

Am Beispiel der Verbrennung von Methan: $CH_4 + 2\,O_2 \rightarrow CO_2 + 2\,H_2O$. Ein Mol Methan reagiert mit zwei Mol Sauerstoff zu einem Mol Kohlendioxid und zwei Mol Wasser.

Wenn man $16\,\text{g}$ Methan ($1\,\text{mol}$) verbrennt, braucht man $2\,\text{mol}\,O_2 = 64\,\text{g}$ Sauerstoff und erhält $1\,\text{mol}\,CO_2 = 44\,\text{g}$ sowie $2\,\text{mol}\,H_2O = 36\,\text{g}$ Wasser.

Die Massenbilanz ergibt $16 + 64 = 44 + 36 = 80\,\text{g}$, was dem **Gesetz der Massenerhaltung** (Satz von Lavoisier) entspricht. Weder Masse noch Teilchen gehen verloren, sie werden nur umgewandelt.

Oft hängt die Reaktion von der Verfügbarkeit eines **limitierenden Reaktanten** ab. Der Reaktant, der in der kleinsten Stoffmenge vorliegt (relativ zum stöchiometrischen Bedarf), bestimmt, wie viel Produkt entstehen kann.

Beispiel: Wenn $3\,\text{mol}\,H_2$ und $1\,\text{mol}\,O_2$ zur Verfügung stehen, ist $O_2$ der limitierende Reaktant, weil $3\,\text{mol}\,H_2$ eigentlich $1{,}5\,\text{mol}\,O_2$ bräuchten. Es entstehen maximal $2\,\text{mol}\,H_2O$, und $1\,\text{mol}\,H_2$ bleibt im Überschuss.

Die **Konzentration** einer Lösung gibt an, wie viel gelöster Stoff in einem bestimmten Lösungsvolumen enthalten ist. Die **Stoffmengenkonzentration** ($c$) wird in mol/l berechnet:

$$c = \frac{n}{V}$$

Wenn man $5{,}85\,\text{g}$ Kochsalz in $500\,\text{ml}$ Wasser löst, ergibt sich $n = \frac{5{,}85}{58{,}44} = 0{,}100\,\text{mol}$ und $c = \frac{0{,}100}{0{,}500} = 0{,}200\,\text{mol/l}$. Konzentrationsangaben sind in der Analytik, bei Titrationen und in der Biochemie allgegenwärtig.

Die Stöchiometrie ist das Rückgrat der quantitativen Chemie. Vom einfachen Mol-Begriff über Reaktionsberechnungen bis hin zu Ausbeute- und Konzentrationsbestimmungen bildet sie die Grundlage für fast alle Berechnungen im Chemieunterricht und in der Forschung.

Wer die Grundlagen sicher beherrscht, kann chemische Probleme systematisch lösen. Die Formeln sind einfach, aber ihre richtige Anwendung erfordert Übung.

Verwandte Rechner: [Molare Masse](/molare-masse-rechner/) | [Stöchiometrie-Rechner](/stoechiometrie-rechner/)
