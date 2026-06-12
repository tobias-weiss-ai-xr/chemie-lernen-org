---
title: "Finite-Elemente-Modellierung für chemo-mechano-thermodynamischen Kontakt und Bindung"
date: "2026-06-12T02:43:52+02:00"
description: "Diese Arbeit stellt eine Finite-Elemente-Formulierung für gekoppelten chemo-mechano-thermodynamischen Kontakt bei großen Deformationen vor. Basierend auf der Kontakttheorie von Sauer et al. (2022) wer"
source: "https://arxiv.org/abs/2606.12375"
tags:
  - "finite-elemente-methode"
  - "kontaktmechanik"
  - "bindungsmodellierung"
  - "thermodynamik"
  - "simulation"
categories: ["forschung"]
draft: false
---

Diese Arbeit stellt eine Finite-Elemente-Formulierung für gekoppelten chemo-mechano-thermodynamischen Kontakt bei großen Deformationen vor. Basierend auf der Kontakttheorie von Sauer et al. (2022) werden sechs Felder betrachtet: Deformation und Temperatur $T$ der beiden Kontaktkörper sowie ein Grenzflächenbindungsfeld $\phi$ und eine Grenzflächentemperatur. Letztere wird durch chemische und mechanische Energiedissipation an der Grenzfläche bestimmt. Der Fokus liegt auf der Entwicklung von Bindung und Entbindung (Bonding/Debonding) und deren Kopplung an den mechanischen und thermischen Kontaktzustand.

Es werden mehrere elementare Modelle auf Basis eines quadratischen Kontaktpotentials vorgeschlagen. Die Formulierung ist vielseitig einsetzbar und wird durch Beispiele wie druck- und spaltabhängige Bindung, exotherme Bindungsreaktionen, thermische Härtung und Ausdehnung sowie gleichzeitiges Binden und Lösen illustriert. Die Implementierung erfolgt monolithisch unter Verwendung klassischer und isogeometrischer Formfunktionen sowie impliziter Zeitintegration. Für das Newton-Raphson-Lösungsverfahren wird die vollständige Linearisierung bereitgestellt. Wenn Bindungsstellen Materialpunkte sind, kann die Bindungsvariable lokal kondensiert werden. Dies ermöglicht präzise Simulationen von Haftungsprozessen unter komplexen thermomechanischen Bedingungen.

Hintergrund: Die Simulation von Haftungsprozessen ist entscheidend für die Entwicklung verbundener Materialien in der Werkstofftechnik.


Entitäten:
finite-elemente-formulierung | methode
chemo-mechano-thermodynamik | konzept
sauer et al. | person
kontakttheorie | konzept
exotherme bindungsreaktionen | reaktion
newton-raphson-verfahren | methode
isogeometrische formfunktionen | methode
thermische härtung | konzept
grenzflächenbindungsfeld | konzept
implizite zeitintegration | methode


---

### 📄 Quelle

[Nachrichten-Artikel](https://arxiv.org/abs/2606.12375)

📄 [Original-Publikation](https://doi.org/10.48550/arXiv.2606.12375)
📄 [Original-Publikation](https://arxiv.org/abs/2606.12375)
📄 [Original-Publikation](https://arxiv.org/abs/2606.12375v1)



---

### 🧪 Verwandte Rechner

Mit diesen interaktiven Werkzeugen können Sie das Thema vertiefen:

🔬 [ph-rechner →](/ph-rechner/)
🔬 [redox-potenzial-rechner →](/redox-potenzial-rechner/)
🔬 [gasgesetz-rechner →](/gasgesetz-rechner/)
🔬 [bindungspotential →](/bindungspotential/)

