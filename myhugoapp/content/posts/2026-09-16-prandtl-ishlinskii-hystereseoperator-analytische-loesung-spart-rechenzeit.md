---
title: "Prandtl-Ishlinskii-Hystereseoperator: Analytische Lösung spart Rechenzeit"
date: "2026-09-16T02:43:34+02:00"
description: "Der verallgemeinerte Prandtl-Ishlinskii-Stop-Operator beschreibt Hysterese-Nichtlinearitäten thermodynamisch konsistent, benötigt jedoch für die Aktualisierung jedes einzelnen Hysterons ein lokales It"
source: "https://arxiv.org/abs/2607.07575"
tags:
  - "hysterese"
  - "prandtl-ihlinskii"
  - "materialmodellierung"
  - "finiten-elemente-methode"
  - "plastizität"
categories: ["forschung"]
draft: false
---

Der verallgemeinerte Prandtl-Ishlinskii-Stop-Operator beschreibt Hysterese-Nichtlinearitäten thermodynamisch konsistent, benötigt jedoch für die Aktualisierung jedes einzelnen Hysterons ein lokales Iterationsverfahren – das verursacht erheblichen Rechenaufwand.

Die Autoren schlagen eine vereinfachte thermodynamische Formulierung vor: Die nichtlineare Abbildung im Stop-Operator wird durch die Identität ersetzt, sodass die Hysterese-Operatoren direkt über ihre Ausgänge gewichtet werden. Das nichtlineare anhysteretische Materialverhalten bleibt dabei vollständig erhalten und wird durch Rampen-Deadzone-Basisfunktionen repräsentiert.

Für isotrope Fälle ermöglicht diese Vereinfachung eine geschlossene (analytische) Lösung der lokalen plastischen Korrektur mittels Rückpunkt-Abbildung (Return-Point Mapping) – die iterativen Newton-Aktualisierungen pro Hysteron entfallen vollständig.

Das resultierende konstitutive Materialgesetz wurde in einen Finite-Elemente-Löser integriert. Numerische Simulationen zeigen eine deutliche Verringerung der Rechenzeit bei einer Genauigkeit, die vergleichbar mit dem vollständigen verallgemeinerten Modell ist. Damit steht für Anwendungen etwa in der Plastizitätstheorie oder bei ferroischen Materialien ein effizienter Hysterese-Operator zur Verfügung.

Hintergrund: Hysterese bezeichnet ein gedächtnisbehaftetes Verhalten, bei dem die Materialantwort von der Vorgeschichte abhängt – etwa bei ferromagnetischen Materialien wie $\mathrm{Fe}$ (Magnetisierungskurven), ferroelektrischen Substanzen wie $\mathrm{BaTiO_3}$ oder der plastischen Verformung von Metallen. Prandtl-Ishlinskii-Operatoren sind ratenunabhängige Hysterese-Modelle, die aus vielen elementaren Einheiten, den sogenannten Hysterons, aufgebaut sind.


Entitäten:
prandtl-ihlinskii-operator | konzept
stop-operator | konzept
hysteron | konzept
hysterese | konzept
rückpunkt-abbildung | konzept
newton-verfahren | methode
finite-elemente-methode | methode
plastizität | konzept


---

### 📄 Quelle

[Nachrichten-Artikel](https://arxiv.org/abs/2607.07575)

📄 [Original-Publikation](https://doi.org/10.48550/arXiv.2607.07575)
📄 [Original-Publikation](https://doi.org/10.1109/TMAG.2026.3731649)
📄 [Original-Publikation](https://arxiv.org/abs/2607.07575)



---

### 🧪 Verwandte Rechner

Mit diesen interaktiven Werkzeugen können Sie das Thema vertiefen:

🔬 [perioden-system-der-elemente →](/perioden-system-der-elemente/)

