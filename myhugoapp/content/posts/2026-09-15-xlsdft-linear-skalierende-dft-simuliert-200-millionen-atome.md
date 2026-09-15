---
title: "XLSDFT: Linear-skalierende DFT simuliert 200 Millionen Atome"
date: "2026-09-15T02:43:20+02:00"
description: "Die Kohn-Sham-Dichtefunktionaltheorie (DFT) ist der Arbeitspferd der ab-initio-Materialsimulation. Allerdings schränken die kubische Skalierung des Rechenaufwands und die quadratische Speicherskalieru"
source: "https://arxiv.org/abs/2609.13115"
tags:
  - "dft"
  - "quantenchemie"
  - "supercomputing"
  - "materialsimulation"
  - "festkörperbatterie"
categories: ["forschung"]
draft: false
---

Die Kohn-Sham-Dichtefunktionaltheorie (DFT) ist der Arbeitspferd der ab-initio-Materialsimulation. Allerdings schränken die kubische Skalierung des Rechenaufwands und die quadratische Speicherskalierung Simulationen typischerweise auf wenige hundert bis tausend Atome ein — dies entspricht nur Nanometern und liegt damit weit unter experimentell relevanten Längenskalen.

Ein Forscherteam stellt nun XLSDFT vor, ein linear skalierendes DFT-Framework. Es basiert auf einer Divide-and-Conquer-Zerlegung der Einteilchen-Dichtematrix kombiniert mit einer Chebyshev-gefilterten Unterraum-Iteration. Damit werden sowohl Rechenzeit als auch Speicherbedarf nur noch linear mit der Systemgröße skaliert — bei voller DFT-Genauigkeit.

Auf dem Exascale-Supercomputer LineShine erreicht XLSDFT eine Reduktion der Rechenkomplexität um Größenordnungen: Ein Siliziumkristall ($Si$) mit 200 Millionen Atomen wurde simuliert — zwanzigmal über dem bisherigen Rekord. Die Implementierung erzielt 96,6 % Weak-Scaling-Effizienz und eine dauerhafte Leistung von 157,9 Pflop/s (FP64) in einer Skalierungsstudie mit 100 Millionen Atomen.

Darüber hinaus simulierten die Forscher eine Grenzfläche einer Festkörperbatterie (all-solid-state battery) mit 11 Millionen Atomen — rund tausendfach komplexer als bisherige DFT-Rechnungen solcher Systeme. Die Simulation zeigt in atomarer Auflösung, wie Lithiummetall ($Li$) mit dem Festkörperelektrolyten reagiert, und steht in quantitativer Übereinstimmung mit spektroskopischen Experimenten. Damit rückt die DFT erstmals in Reichweite experimentell zugänglicher Systemgrößen.

Hintergrund: Linear-skalierende DFT-Verfahren nutzen die "Kurzsichtigkeit" elektronischer Materie (Kohns Lokalitätsprinzip), wonach die Dichtematrix mit dem Abstand exponentiell abfällt — dadurch kann auf eine globale Diagonalisierung der Hamilton-Matrix verzichtet werden. Chebyshev-Polynome dienen dabei als effiziente Filter für energetisch relevante Elektronenzustände.


Entitäten:
xlsdft | methode
kohn-sham-dft | konzept
linear-scaling-dft | konzept
chebyshev-filterung | methode
divide-and-conquer-zerlegung | methode
silizium-kristall | stoff
lithium-metall | stoff
festkörperelektrolyt | stoff
festkörperbatterie | konzept
lithium-elektrolyt-reaktion | reaktion


---

### 📄 Quelle

[Nachrichten-Artikel](https://arxiv.org/abs/2609.13115)

📄 [Original-Publikation](https://doi.org/10.48550/arXiv.2609.13115)
📄 [Original-Publikation](https://arxiv.org/abs/2609.13115)
📄 [Original-Publikation](https://arxiv.org/abs/2609.13115v1)



---

### 🧪 Verwandte Rechner

Mit diesen interaktiven Werkzeugen können Sie das Thema vertiefen:

🔬 [ph-rechner →](/ph-rechner/)
🔬 [atomenergieniveaus →](/atomenergieniveaus/)
🔬 [saeuren-basen-gleichgewicht →](/saeuren-basen-gleichgewicht/)

