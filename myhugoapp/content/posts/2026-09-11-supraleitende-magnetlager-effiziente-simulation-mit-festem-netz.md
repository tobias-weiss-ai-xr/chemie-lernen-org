---
title: "Supraleitende Magnetlager: Effiziente Simulation mit festem Netz"
date: "2026-09-11T02:42:27+02:00"
description: "Supraleitende Magnetlager (SMBs) beruhen auf der Wechselwirkung zwischen Hochtemperatursupraleitern und magnetischen Führungsschienen. Ihre numerische Simulation ist anspruchsvoll, da die Relativbeweg"
source: "https://arxiv.org/abs/2609.09347"
tags:
  - "supraleitung"
  - "numerische-simulation"
  - "finite-elemente-methode"
  - "magnetlager"
  - "hochtemperatursupraleiter"
categories: ["forschung"]
draft: false
---

Supraleitende Magnetlager (SMBs) beruhen auf der Wechselwirkung zwischen Hochtemperatursupraleitern und magnetischen Führungsschienen. Ihre numerische Simulation ist anspruchsvoll, da die Relativbewegung zwischen Supraleiter und Führungsschiene üblicherweise wiederholte Aktualisierungen der Geometrie und des Berechnungsnetzes erfordert.

Die Autoren präsentieren einen festnetz-basierten Ansatz (Fixed-Mesh), bei dem eine Koordinatentransformation ausschließlich auf den Luftbereich zwischen den bewegten Regionen angewendet wird. Diese Transformation lässt sich in einen zeitabhängigen anisotropen Materialtensor integrieren, sodass das Netz während der gesamten Simulation unverändert bleibt und die übrige Formulierung unangetastet bleibt.

Zur Demonstration wurde der Ansatz in 2D mit der Finite-Elemente-Methode unter Verwendung der $j$-$a$-Formulierung implementiert und mit Homogenisierung sowie Schaltkreiskopplung für doppelt gekreuzte Schleifen aus beschichteten Supraleitern (Coated Conductors) kombiniert. Die Open-Source-Implementierungen werden öffentlich bereitgestellt.

Die Validierung erfolgte gegen etablierte Modellierungsansätze und experimentelle Literaturdaten: In beiden Simulationsbeispielen stimmt die vom Festnetzmodell vorhergesagte Levitationskraft hervorragend mit Messungen überein, mit Bestimmtheitsmaßen von $R^2 > 0{,}99$. Für ein Verifikationsproblem konvergiert das Festnetzmodell unter Netzverfeinerung erwartungsgemäß gegen die neu vernetzte Referenzlösung.

Für ein SMB mit vertikalen und horizontalen Bewegungen reproduziert das homogenisierte Festnetzmodell die laterale Kraftantwort eines voll aufgelösten beweglichen Referenzmodells. Zudem ist es rechnerisch deutlich effizienter: Sowohl die Anzahl der Freiheitsgrade als auch die Rechenzeit werden erheblich reduziert.

Die Ergebnisse zeigen, dass der festnetz-basierte Ansatz Translationsbewegungen akkurat und recheneffizient simulieren kann – ein wichtiger Fortschritt für die Auslegung reibungsfreier Lagerungssysteme.

Hintergrund: Beschichtete Leiter basieren typischerweise auf REBCO-Supraleitern wie $\text{YBa}_2\text{Cu}_3\text{O}_{7-\delta}$, die unterhalb von ca. 92 K supraleitend werden und damit mit flüssigem Stickstoff (77 K) gekühlt werden können – dies macht die Levitation über supraleitendem Meißner-Ochsenfeld-Effekt und Flux-Pinning praktisch nutzbar.


Entitäten:
supraleitendes magnetlager | konzept
hochtemperatursupraleiter | stoff
beschichteter leiter | stoff
finite-elemente-methode | methode
j-a-formulierung | methode
homogenisierung | methode
levitationskraft | konzept
anisotroper materialtensor | konzept


---

### 📄 Quelle

[Nachrichten-Artikel](https://arxiv.org/abs/2609.09347)

📄 [Original-Publikation](https://doi.org/10.48550/arXiv.2609.09347)
📄 [Original-Publikation](https://arxiv.org/abs/2609.09347)
📄 [Original-Publikation](https://arxiv.org/abs/2609.09347v1)



---

### 🧪 Verwandte Rechner

Mit diesen interaktiven Werkzeugen können Sie das Thema vertiefen:

🔬 [ph-rechner →](/ph-rechner/)
🔬 [perioden-system-der-elemente →](/perioden-system-der-elemente/)
🔬 [temperatur-teilchenbewegung →](/temperatur-teilchenbewegung/)
🔬 [druck-flaechen-rechner →](/druck-flaechen-rechner/)

