---
title: "Hyperreduktion nichtlinearer FEM-Modelle mit mannigfaltigkeitsadaptiven Gewichten"
date: "2026-09-05T02:44:57+02:00"
description: "Forscher stellen mit der Manifold-Adaptive-Weight Empirical Cubature Method (MAW-ECM) einen neuen Ansatz zur Hyperreduktion nichtlinearer Reduced-Order-Modelle für parametrisierte Finite-Elemente-Prob"
source: "https://arxiv.org/abs/2609.03068"
tags:
  - "hyperreduktion"
  - "modellreduktion"
  - "finite-elemente-methode"
  - "empirische kubatur"
  - "kontinuumschädigung"
categories: ["forschung"]
draft: false
---

Forscher stellen mit der Manifold-Adaptive-Weight Empirical Cubature Method (MAW-ECM) einen neuen Ansatz zur Hyperreduktion nichtlinearer Reduced-Order-Modelle für parametrisierte Finite-Elemente-Probleme vor. Bisherige Sampling-and-Weighting-Verfahren verwenden Gewichte, die über die gesamte Lösungsmannigfaltigkeit hinweg fixiert sind. MAW-ECM hebt diese Einschränkung auf, indem die Gewichte kontinuierlich und nichtlinear von den latenten Koordinaten abhängen dürfen – was weiteres Einsparungspotenzial bei der Anzahl abgetasteter Elemente und Integrationspunkte erschließt.

Ausgangspunkt ist eine gültige ECM-Regel mit festen Gewichten; eine Greedy-Beschneidungsstrategie entfernt anschließend gezielt abgetastete Integrationspunkte. Dabei werden konvexe quadratische Gewichts-Umverteilungsprobleme gelöst, die lokale Bedingungen und Positivität der Gewichte erzwingen.

Getestet wurde das Verfahren an zwei nichtlinearen Benchmarks: der Homogenisierung einer Metamaterial-Einheitszelle mit negativer inkrementeller Steifigkeit sowie einem geschichtsabhängigen Kontinuumschädigungsproblem. Die nichtlineare Mannigfaltigkeit entsteht dabei durch eine anfängliche lineare Kompression und eine eingangsinformierte Identifikation der latenten Koordinaten als Linearkombinationen der verbliebenen Modalamplituden; Graphinformationen fließen ein, um die intrinsische Dimensionalität der Lösungsmannigfaltigkeit zu bestimmen.

Ergebnis: Kombiniert man die nichtlineare Mannigfaltigkeitsdarstellung mit MAW-ECM, sinkt die Zahl der abgetasteten Integrationspunkte um mehr als zwei Größenordnungen gegenüber dem klassischen linearen reduzierten Modell. Gegenüber Mannigfaltigkeitsmodellen mit festen Gewichten eliminieren die adaptiven Gewichte rund 80 % der verbleibenden Punkte im Homogenisierungs-Benchmark und über 97 % im Schädigungs-Benchmark – bei im Wesentlichen unveränderter Genauigkeit. Das Verfahren macht rechenintensive Simulationen damit deutlich effizienter.

Hintergrund: Hyperreduktur-Verfahren wie die empirische Kubatur sind zentral in der Modellreduktion, da sie die Auswertung nichtlinearer Terme auf wenigen Stützstellen erlauben, statt das gesamte FE-Netz zu durchlaufen. Solche Techniken beschleunigen Mehrskalensimulationen und Lebensdauerprognosen in Materialwissenschaft und Chemieingenieurwesen erheblich.


Entitäten:
maw-ecm | methode
empirical cubature method | methode
hyperreduktion | konzept
reduced-order model | konzept
finite-elemente-methode | methode
lösungsmannigfaltigkeit | konzept
homogenisierung | methode
kontinuumschädigung | konzept
metamaterial | stoff
greedy pruning | methode


---

### 📄 Quelle

[Nachrichten-Artikel](https://arxiv.org/abs/2609.03068)

📄 [Original-Publikation](https://doi.org/10.48550/arXiv.2609.03068)
📄 [Original-Publikation](https://arxiv.org/abs/2609.03068)
📄 [Original-Publikation](https://arxiv.org/abs/2609.03068v1)



---

### 🧪 Verwandte Rechner

Mit diesen interaktiven Werkzeugen können Sie das Thema vertiefen:

🔬 [ph-rechner →](/ph-rechner/)
🔬 [redox-potenzial-rechner →](/redox-potenzial-rechner/)
🔬 [bindungspotential →](/bindungspotential/)
🔬 [perioden-system-der-elemente →](/perioden-system-der-elemente/)

