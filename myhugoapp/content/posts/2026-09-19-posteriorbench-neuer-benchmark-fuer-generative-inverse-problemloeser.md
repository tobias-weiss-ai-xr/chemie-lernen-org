---
title: "PosteriorBench: Neuer Benchmark für generative inverse Problemlöser"
date: "2026-09-19T02:43:54+02:00"
description: "Generative KI-Modelle werden zunehmend zur Lösung naturwissenschaftlicher inverser Probleme eingesetzt – also zur Rekonstruktion unbekannter Größen aus unvollständigen oder verrauschten Messdaten. Bis"
source: "https://arxiv.org/abs/2609.20794"
tags:
  - "benchmark"
  - "inverse probleme"
  - "generative modelle"
  - "unsicherheitsquantifizierung"
  - "co2-speicherung"
categories: ["forschung"]
draft: false
---

Generative KI-Modelle werden zunehmend zur Lösung naturwissenschaftlicher inverser Probleme eingesetzt – also zur Rekonstruktion unbekannter Größen aus unvollständigen oder verrauschten Messdaten. Bisherige Bewertungsverfahren prüften jedoch meist nur, ob eine Methode eine einzige plausible Rekonstruktion liefert. Bei schlecht gestellten (ill-posed) Problemen können aber viele verschiedene Lösungen zu denselben Beobachtungen passen. Ein Solver kann dann punktuell sehr genau sein und dennoch die wahre Lösungsverteilung verfehlen – etwa durch Modus-Kollaps, überzogene Sicherheit oder das Mitteln inkompatibler Lösungen.

PosteriorBench schließt diese Lücke, indem es die Verteilungsgenauigkeit generativer inverser Solver misst. Der Benchmark umfasst vier physikalisch basierte Aufgaben: Darcy-Strömungsinversion, Poisson-Quellenrekonstruktion, $CO_2$-Speicherung (Carbon Capture and Storage) sowie Materialinferenz beim Lichttransport. Für jede Aufgabe wurden hochwertige Referenz-Posteriore mit rechenaufwendigen, aber etablierten Verfahren wie Rejection Sampling und Markov Chain Monte Carlo (MCMC) erzeugt. So lässt sich direkt prüfen, ob ein Solver die vollständige Lösungsmenge statt nur der besten Einzellösung findet.

Dazu gehört ein Fünf-Metriken-Set: Fehler des posterioren Mittelwerts, Fehler der posterioren Standardabweichung, Maximum Mean Discrepancy, Sliced-Wasserstein-Distanz und radial gemittelter Leistungsspektrum-Fehler. Diese erfassen punktuelle Genauigkeit, marginale Unsicherheit, Verteilungsübereinstimmung und globale Frequenztreue. Getestet wird unter_sparse Sensoren, groben Beobachtungen, nichtlinearen Vorwärtsmodellen, variablen Rauschpegeln und multimodalen Priorverteilungen.

Die Experimente zeigen erhebliche Lücken beim Verteilungs-Matching bestehender Solver. Neuronale Operatoren verbessern die Robustheit gegenüber Auflösungsänderungen; Guidance-Gewichte und Generierungsrauschen erweisen sich als entscheidend für die Kalibrierung der posteriorien Varianz.

Hintergrund: Inverse Probleme spielen auch in der Chemie eine Rolle, z. B. bei der Parameterschätzung aus Spektren oder Reaktionskinetik. Bayes'sch gilt $p(x \mid y) \propto p(y \mid x)\,p(x)$ – genau diese Posterior-Verteilung soll ein guter Solver vollständig erfassen.


Entitäten:
posteriorbench | methode
inverse probleme | konzept
co2-speicherung | konzept
darcy-strömung | konzept
poisson-quellenrekonstruktion | konzept
markov-chain-monte-carlo | methode
rejection sampling | methode
maximum mean discrepancy | methode
sliced-wasserstein-distanz | methode
modus-kollaps | konzept


---

### 📄 Quelle

[Nachrichten-Artikel](https://arxiv.org/abs/2609.20794)

📄 [Original-Publikation](https://doi.org/10.48550/arXiv.2609.20794)
📄 [Original-Publikation](https://arxiv.org/abs/2609.20794)
📄 [Original-Publikation](https://arxiv.org/abs/2609.20794v1)



---

### 🧪 Verwandte Rechner

Mit diesen interaktiven Werkzeugen können Sie das Thema vertiefen:

🔬 [ph-rechner →](/ph-rechner/)
🔬 [verbrennungsrechner →](/verbrennungsrechner/)
🔬 [perioden-system-der-elemente →](/perioden-system-der-elemente/)
🔬 [saeuren-basen-gleichgewicht →](/saeuren-basen-gleichgewicht/)

