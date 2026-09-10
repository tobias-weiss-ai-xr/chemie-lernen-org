---
title: "Monolithische Kondensation innerer Variablen in finiter Viskoelastizität"
date: "2026-09-10T02:45:43+02:00"
description: "Die Arbeit befasst sich mit der numerischen Lösung finiter viskoelastischer Probleme. Während Viskoelastizität bei großen Dehnungen meist aus konstitutiver Sicht betrachtet wird, untersuchen die Autor"
source: "https://arxiv.org/abs/2608.02117"
tags:
  - "viskoelastizität"
  - "numerik"
  - "schur-komplement"
  - "newton-verfahren"
  - "finite-elemente-methode"
categories: ["forschung"]
draft: false
---

Die Arbeit befasst sich mit der numerischen Lösung finiter viskoelastischer Probleme. Während Viskoelastizität bei großen Dehnungen meist aus konstitutiver Sicht betrachtet wird, untersuchen die Autoren systematisch die nichtlineare Lösungsarchitektur, die durch Zeit- und Raumdiskretisierung entsteht. Ausgangspunkt ist ein repräsentatives viskoelastisches Modell mit einer verformungsähnlichen inneren Variablen (z. B. $\mathbf{C}_v$); betrachtet wird das vollständig diskretisierte, gekoppelte Problem aus Verformung und innerem Zustand.

Aus der zugrunde liegenden Energie-Dissipations-Struktur werden die diskreten Schwachformen hergeleitet, woraus ein monolithisches Newton-System mit natürlich nicht-symmetrischem Block-Tangenten resultiert. Der Zuwachs der inneren Variablen wird konsistent auf der Ebene des linearisierten Systems durch ein Schur-Komplement eliminiert. Dieselbe Reduktion lässt sich geometrisch als Nullraum-Basis des Tangentialraums der inneren Nebenbedingungsmannigfaltigkeit deuten. Damit entsteht ein genuin monolithisches Gegenstück zur klassischen verschachtelten Gauss-Punkt-Kondensation, bei der lokale konstitutive Gleichungen getrennt vor dem globalen Gleichgewichtsschritt gelöst werden.

Numerische Studien an zwei- und dreidimensionalen Cook-Membran-Benchmarks zeigen: Das neue Verfahren behält im Wesentlichen das äußere Newton-Verhalten der klassischen Methode bei, reduziert aber die Rechenkosten erheblich, da wiederholte lokale Newton-Lösungen entfallen. Es bleibt zudem für Lastinkremente konvergent, bei denen das verschachtelte Schema versagt. Zudem legen die Ergebnisse nahe, dass geeignet gewählte Approximationsräume für die innere Variable zusätzlichen Rechenaufwand sparen, ohne die Genauigkeit nennenswert zu beeinträchtigen. Obwohl für die finite Viskoelastizität vorgestellt, lässt sich die Konstruktion auf breitere Klassen thermodynamisch konsistenter innerer-Variablen-Modelle übertragen.

Hintergrund: Innere Variablen beschreiben in der Kontinuumsmechanik dissipative Prozesse wie viskoses Fließen und sind zentral für Materialmodelle von Polymeren und Metallen. Für chemieaffine Leserschaften ist das Thema relevant, da viskoelastische Simulationen etwa das Langzeitverhalten von Kunststoffen vorhersagen helfen.


Entitäten:
viskoelastizität | konzept
innere variable | konzept
schur-komplement | methode
newton-verfahren | methode
gauss-punkt-kondensation | methode
nullraum-kondensation | methode
cook-membran | konzept
finite-elemente-methode | methode
energie-dissipations-struktur | konzept


---

### 📄 Quelle

[Nachrichten-Artikel](https://arxiv.org/abs/2608.02117)

📄 [Original-Publikation](https://doi.org/10.48550/arXiv.2608.02117)
📄 [Original-Publikation](https://doi.org/10.1007/s00707-026-04891-3)
📄 [Original-Publikation](https://arxiv.org/abs/2608.02117)



---

### 🧪 Verwandte Rechner

Mit diesen interaktiven Werkzeugen können Sie das Thema vertiefen:

🔬 [chemisches-gleichgewicht →](/chemisches-gleichgewicht/)
🔬 [perioden-system-der-elemente →](/perioden-system-der-elemente/)

