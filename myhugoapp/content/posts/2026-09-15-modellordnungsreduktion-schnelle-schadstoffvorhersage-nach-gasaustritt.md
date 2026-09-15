---
title: "Modellordnungsreduktion: Schnelle Schadstoffvorhersage nach Gasaustritt"
date: "2026-09-15T02:44:40+02:00"
description: "Numerische Simulationen der Schadstoffausbreitung nach einem Gasleck in einer Chemieanlage liefern wertvolle Erkenntnisse für Notfallmaßnahmen und Vorsorgeplanung. Hochauflösende Verfahren kombinieren"
source: "https://arxiv.org/abs/2602.21996"
tags:
  - "modellordnungsreduktion"
  - "schadstoffausbreitung"
  - "navier-stokes"
  - "monte-carlo-simulation"
  - "unsicherheitsquantifizierung"
categories: ["forschung"]
draft: false
---

Numerische Simulationen der Schadstoffausbreitung nach einem Gasleck in einer Chemieanlage liefern wertvolle Erkenntnisse für Notfallmaßnahmen und Vorsorgeplanung. Hochauflösende Verfahren kombinieren die inkompressiblen Navier-Stokes-Gleichungen (INS) mit Advektions-Diffusions-Prozessen, um Wind- und Konzentrationsfelder zu beschreiben. Bei komplexen Geometrien und ausgedehnten Bereichen wie urbanen Umgebungen steigt der Rechenaufwand jedoch so stark an, dass zeitkritische Einsätze oder многократные Was-wäre-wenn-Szenarien unpraktikabel werden. Hier setzen Techniken der Modellordnungsreduktion (Model Order Reduction, MOR) an, die schnelle und zugleich genaue Vorhersagen ermöglichen.

Die Studie stellt einen anwendungsorientierten MOR-Workflow für die vorhersageunsichere Schadstoffkonzentration vor, demonstriert an einem zweidimensionalen Benchmarksystem. Zunächst werden etablierte, auf der Proper Orthogonal Decomposition (POD) basierende intrusive und nicht-intrusive Methoden für das rechenaufwendige parametrische INS-Problem systematisch verglichen. Bewertungskriterien umfassen Genauigkeit, Recheneffizienz, Datenbedarf und Extrapolationsfähigkeit – samt der damit verbundenen Zielkonflikte bei der Modellauswahl.

Auf diesen Erkenntnissen aufbauend wird ein nicht-intrusives parametrisches reduziertes Modell konstruiert, das drastisch beschleunigte Monte-Carlo-Simulationen erlaubt. Damit lässt sich quantifizieren, wie sich mögliche Unsicherheiten bei Windmessungen auf das raum-zeitliche Konzentrationsfeld auswirken. Die Ergebnisse liefern wertvolle Informationen für lokale Folgenanalysen und die Planung von Evakuierungsmaßnahmen. Zusätzlich werden die Simulationsergebnisse interaktiv in einem Dashboard visualisiert; das Modell kann somit als Baustein in umfassendere Entscheidungsunterstützungssysteme für den Katastrophenschutz integriert werden.

Hintergrund: Intrusive MOR-Methoden greifen direkt in die Gleichungen ein (z. B. via Galerkin-Projektion), während nicht-intrusive Methoden rein datenbasiert aus Simulationssnapshots lernen. Die POD extrahiert dabei die dominanten räumlichen Strukturen (Moden) – mathematisch verwandt mit der Hauptkomponentenanalyse.


Entitäten:
modellordnungsreduktion | methode
proper orthogonal decomposition | methode
navier-stokes-gleichungen | konzept
advektion-diffusion | konzept
monte-carlo-simulation | methode
unsicherheitsquantifizierung | konzept
schadstoffausbreitung | konzept
reduziertes ordnungsmodell | methode
evakuierungsplanung | konzept


---

### 📄 Quelle

[Nachrichten-Artikel](https://arxiv.org/abs/2602.21996)

📄 [Original-Publikation](https://doi.org/10.48550/arXiv.2602.21996)
📄 [Original-Publikation](https://arxiv.org/abs/2602.21996)
📄 [Original-Publikation](https://arxiv.org/abs/2602.21996v4)



---

### 🧪 Verwandte Rechner

Mit diesen interaktiven Werkzeugen können Sie das Thema vertiefen:

🔬 [ph-rechner →](/ph-rechner/)
🔬 [konzentrationsumrechner →](/konzentrationsumrechner/)
🔬 [redox-potenzial-rechner →](/redox-potenzial-rechner/)
🔬 [bindungspotential →](/bindungspotential/)

