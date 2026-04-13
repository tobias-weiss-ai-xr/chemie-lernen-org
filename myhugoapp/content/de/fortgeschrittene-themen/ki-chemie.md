---
title: 'KI in der Chemie'
description: 'Wie maschinelles Lernen und künstliche Intelligenz die Chemie revolutionieren — von Moleküldesign bis zu autonomen Laboren'
date: 2026-04-13
---

# KI in der Chemie

## Übersicht

Künstliche Intelligenz verändert die Chemie grundlegend. Wo früher monatelange Experimentreihen nötig waren, können heute Algorithmen in Stunden tausende Verbindungen durchsuchen, Eigenschaften vorhersagen und sogar ganze Synthesewege planen. Der Durchbruch von AlphaFold, das 2020 die Proteinstrukturvorhersage revolutionierte, war nur der Anfang. Inzwischen reicht KI von der Grundlagenforschung bis zur industriellen Prozessoptimierung.

Die Verschmelzung von Chemie und Informatik hat eine neue Disziplin geschaffen: die **chemische Informatik** (Chemoinformatik). Datengetriebene Ansätze ergänzen dabei die klassische theoretische Chemie. Statt jede Verbindung im Labor zu testen, trainieren Modelle auf Millionen bekannter Moleküleigenschaften und können dann Vorhersagen für unbekannte Stoffe treffen. Das beschleunigt die Wirkstoffentwicklung, die Materialforschung und die Katalysatoroptimierung erheblich.

Autonome Labore wie das „A-Lab" am Lawrence Berkeley National Laboratory zeigen, wohin die Reise geht: Ein Roboter synthetisiert Materialien, charakterisiert sie selbstständig und entscheidet auf Basis der Ergebnisse, welche Verbindungen als Nächstes getestet werden. Der geschlossene Loop aus Vorhersage, Experiment und Auswertung verkürzt Entwicklungszyklen von Jahren auf Wochen.

## Wichtige Konzepte

- **Graph Neural Networks (GNNs)** — Moleküle lassen sich natürlich als Graphen darstellen: Atome sind Knoten, Bindungen sind Kanten. GNNs lernen daraus molekulare Eigenschaften wie Löslichkeit, Toxizität oder Bindungsaffinität. Modelle wie Message Passing Neural Networks (MPNNs) haben sich besonders bewährt für die Vorhersage quantenchemischer Eigenschaften.

- **Diffusionsmodelle** — Inspiriert von der Bildgenerierung (z. B. Stable Diffusion), erzeugen diese Modelle neue Molekülstrukturen, indem sie schrittweise Rauschen aus einem zufälligen Startpunkt entfernen. Sie können gezielt Moleküle mit gewünschten Eigenschaften entwerfen, etwa eine bestimmte Bindungsstärke an ein Zielprotein.

- **Molekulare Einbettungen (Embeddings)** — Ähnlich wie Worte in der Sprachverarbeitung werden Moleküle als Vektoren in einem hochdimensionalen Raum dargestellt. Verbindungen mit ähnlichen Eigenschaften liegen nah beieinander. SMILES-Strings (Simplified Molecular Input Line Entry System) dienen dabei als Standardrepräsentation.

- **Bayessche Optimierung** — Bei der Suche nach dem besten Katalysator oder Material sind die Möglichkeiten praktisch unbegrenzt. Bayessche Optimierung nutzt ein probabilistisches Modell, um intelligenter zu suchen: Sie balanciert das Erkunden unbekannter Regionen mit dem Ausnutzen bereits vielversprechender Bereiche.

- **Large Language Models (LLMs) für Chemie** — Sprachmodelle wie GPT-4 oder spezialisierte Modelle wie ChemBERTa können chemische Literatur zusammenfassen, Reaktionen vorhersagen und sogar Synthesevorschriften generieren. Sie verstehen SMILES-Strings und können zwischen verschiedenen Repräsentationsformaten übersetzen.

## Anwendungen

**Wirkstoffentwicklung (Drug Discovery):** KI-basiertes Screening kann Milliarden von Molekülen virtuell testen. Das Unternehmen Insilico Medicine brachte 2023 einen KI-entdeckten Wirkstoff (ISM001-055 gegen idiopathische Lungenfibrose) in Phase-II-Studien, vom ersten Treffer bis zum Kandidaten in unter 30 Monaten.

**Materialentdeckung:** Google DeepMinds GNoME (Graph Networks for Materials Exploration) entdeckte 2023 über 2,2 Millionen neue Kristallstrukturen, darunter 380.000 stabile Materialien. Das entspricht etwa 800 Jahren menschlicher Forschung.

**Retrosyntheseplanung:** Programme wie AiZynthFinder oder IBM RXN zerlegen ein Zielmolekül rekursiv in verfügbare Ausgangsstoffe. Sie nutzen Reaktionsdatenbanken mit Millionen bekannter Umsetzungen und finden oft wirtschaftlichere Synthesewege als erfahrene Chemiker.

**Autonome Labore:** Das A-Lab am LBNL hat über 17 Tage hinweg 41 neue Materialien synthetisiert, ohne menschliches Eingreifen. Die Erfolgsquote lag bei 71%, was manuelle Ansätze übertrifft.

## Formeln und Gleichungen

Die Vorhersage molekularer Eigenschaften durch GNNs folgt dem Message-Passing-Schema. Für jeden Knoten $v$ im molekularen Graphen wird eine verborgene Darstellung $\mathbf{h}_v$ iterativ aktualisiert:

$$\mathbf{h}_v^{(t+1)} = \phi \left( \mathbf{h}_v^{(t)}, \bigoplus_{u \in \mathcal{N}(v)} \psi \left( \mathbf{h}_v^{(t)}, \mathbf{h}_u^{(t)}, \mathbf{e}_{uv} \right) \right)$$

Dabei ist $\mathcal{N}(v)$ die Nachbarschaft von Knoten $v$, $\mathbf{e}_{uv}$ die Kantenmerkmale (Bindungstyp), $\psi$ die Nachrichtenfunktion und $\phi$ die Aktualisierungsfunktion. Das Aggregat $\bigoplus$ fasst alle eingehenden Nachrichten zusammen, typischerweise durch Summation oder Mittelung.

Für die Vorhersage der freien Bindungsenergie $\Delta G$ an ein Zielprotein nutzt man oft einen Korrelationsansatz:

$$\Delta G = -RT \ln K_d \approx \alpha \cdot f(\mathbf{h}_{\text{Ligand}}, \mathbf{h}_{\text{Protein}}) + \beta$$

Hierbei ist $K_d$ die Dissoziationskonstante, $R$ die universelle Gaskonstante, $T$ die Temperatur und $f$ eine vom Modell gelernte Funktion.

Die Bayessche Optimierung sucht den Maximalwert einer teuren Black-Box-Funktion $f(\mathbf{x})$ über die Akquisitionsfunktion $\alpha(\mathbf{x})$, typischerweise die Expected Improvement:

$$\alpha_{\text{EI}}(\mathbf{x}) = \mathbb{E}\left[ \max(f(\mathbf{x}) - f(\mathbf{x}^+), 0) \right]$$

wobei $\mathbf{x}^+$ der bisher beste Beobachtungspunkt ist.

## Weiterführende Ressourcen

- [AlphaFold Protein Structure Database](https://alphafold.ebi.ac.uk/) — Über 200 Millionen vorhergesagte Proteinstrukturen
- [Materials Project](https://materialsproject.org/) — Offene Datenbank für Materialeigenschaften
- [Papers With Code: Molecular Property Prediction](https://paperswithcode.com/task/molecular-property-prediction) — Benchmark-Ergebnisse und Code
- Butler, K. T. et al. (2018): „Machine learning for molecular and materials science." _Nature_ 559, 547-555
- Sanchez-Lengeling, B. & Aspuru-Guzik, A. (2018): „Inverse molecular design using machine learning." _Science_ 361, 360-365

---

_Dieses Thema gehört zum Bereich [Fortgeschrittene Themen](/fortgeschrittene-themen/)._
