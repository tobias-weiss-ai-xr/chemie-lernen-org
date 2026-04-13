---
title: 'Quantenchemie'
description: 'Quantencomputing in der Chemie — von grundlegenden Algorithmen bis zur Quantensimulation molekularer Systeme'
date: 2026-04-13
---

# Quantenchemie

## Übersicht

Quantenchemie beschäftigt sich mit der Lösung der Schrödingergleichung für molekulare Systeme. Da diese Gleichung für alle Elektronen eines Moleküls gemeinsam gelöst werden muss, wächst der Rechenaufwand exponentiell mit der Systemgröße. Klassische Computer stoßen hier schnell an ihre Grenzen. Quantencomputer bieten einen Ausweg, weil sie von Natur aus quantenmechanische Systeme sind und bestimmte Berechnungen exponentiell beschleunigen können.

Die zentrale Herausforderung lässt sich an einem einfachen Beispiel illustrieren: Ein einzelnes Kohlenstoffatom besitzt 6 Elektronen. Die vollständige Beschreibung seines Zustands erfordert einen Vektor in einem Raum mit $4^{6} = 4096$ Dimensionen (wenn man Spin und Ort berücksichtigt). Für ein Molekül wie Koffein ($C_8H_{10}N_4O_2$, 102 Elektronen) explodiert die Dimensionalität. Quantencomputer können diese Zustände natürlicher abbilden, da ihre Qubits selbst quantenmechanische Superpositionen darstellen.

Aktuelle Quantencomputer befinden sich in der sogenannten NISRA-Ära (Noisy Intermediate-Scale Quantum). Sie haben wenige hundert Qubits und sind noch fehleranfällig. Trotzdem konnten bereits beeindruckende Meilensteine erreicht werden, etwa die Simulation kleiner Moleküle wie $H_2$, $LiH$ oder $BeH_2$ auf echten Quantenhardware.

## Wichtige Konzepte

- **Variational Quantum Eigensolver (VQE)** — Der wichtigste Algorithmus für die Quantenchemie auf aktuellen Hardware. Er kombiniert einen Quantencomputer mit einem klassischen Optimierer. Der Quantencomputer berechnet die Energie eines Testzustands (Ansatz), der klassische Optimierer verbessert die Parameter. Iterativ konvergiert das Verfahren gegen die Grundzustandsenergie.

- **Quantum Phase Estimation (QPE)** — Ein exakterer Algorithmus als VQE, der die Eigenwerte unitärer Operatoren bestimmt. QPE liefert präzise Energien, benötigt aber fehlerkorrigierte Qubits und tiefe Schaltkreise, was ihn für nahe Zukunft unrealistisch macht.

- **Second Quantization & Jordan-Wigner-Transformation** — Um molekulare Hamiltonoperatoren auf Quantencomputer abzubilden, formuliert man sie in zweiter Quantisierung (Erzeugungs- und Vernichtungsoperatoren). Die Jordan-Wigner-Transformation übersetzt diese Fermionen-Operatoren in Pauli-Strings ($X$, $Y$, $Z$-Matrizen), die auf Qubits ausführbar sind.

- **Quantenfehlerkorrektur** — Physikalische Qubits sind rauschbelastet. Fehlerkorrekturcodes (z. B. Surface Codes) bündeln viele physische Qubits zu einem logischen Qubit. Für chemisch relevante Berechnungen schätzt man, dass tausende bis Millionen physischer Qubits nötig sind.

- **Quantum Embedding** — Statt ein gesamtes Molekül quantenmechanisch zu behandeln, wird nur der chemisch aktive Teil (etwa die Bindungsregion) auf dem Quantencomputer berechnet. Die Umgebung wird mit klassischen Methoden wie DFT beschrieben. Dieser hybride Ansatz reduziert die Qubit-Anzahl erheblich.

## Anwendungen

**Grundzustandsenergien:** Die genaue Bestimmung von Grundzustandsenergien ist entscheidend für die Vorhersage von Reaktionsenergien, Bindungsstärken und Spektren. IBM hat 2022 die Energie des $BeH_2$-Moleküls mit VQE auf einer Hardware mit 27 Qubits berechnet und dabei chemische Genauigkeit (Fehler unter 1 kcal/mol) erreicht.

**Katalysatordesign:** Übergangsmetallkomplexe haben starke Elektronenkorrelationen, die klassische Methoden überfordern. Quantencomputer könnten hier die Bindungsenergien von Liganden genauer berechnen und so die Entwicklung neuer Katalysatoren beschleunigen. Anwendungen reichen von der Ammoniaksynthese (Haber-Bosch) bis zur CO₂-Reduktion.

**Pharmakologie:** Die Wechselwirkung zwischen Wirkstoffen und Proteinen hängt von subtilen quantenmechanischen Effekten ab. Quantencomputer könnten die freie Bindungsenergie genauer bestimmen als klassische Molekülmechanik und so das rationale Wirkstoffdesign verbessern.

**Stickstofffixierung:** Das Enzym Nitrogenase wandelt atmosphärischen $N_2$ bei Raumtemperatur in $NH_3$ um. Der Mechanismus ist noch nicht vollständig verstanden. Quantensimulationen könnten die Zwischenschritte aufklären und Inspiration für energieeffizientere industrielle Prozesse liefern.

## Formeln und Gleichungen

Die molekulare Schrödingergleichung lautet:

$$\hat{H} \Psi(\mathbf{r}_1, \ldots, \mathbf{r}_N) = E \Psi(\mathbf{r}_1, \ldots, \mathbf{r}_N)$$

Der elektronische Hamiltonoperator in Born-Oppenheimer-Näherung ist:

$$\hat{H} = -\sum_i \frac{\hbar^2}{2m_e} \nabla_i^2 - \sum_{i,A} \frac{Z_A e^2}{4\pi\varepsilon_0 |\mathbf{r}_i - \mathbf{R}_A|} + \sum_{i<j} \frac{e^2}{4\pi\varepsilon_0 |\mathbf{r}_i - \mathbf{r}_j|}$$

Die Terme beschreiben (von links) die kinetische Energie der Elektronen, die Elektron-Kern-Anziehung und die Elektron-Elektron-Abstoßung.

Nach der Jordan-Wigner-Transformation wird der Hamiltonoperator zu einer Summe von Pauli-Strings:

$$\hat{H} = \sum_k h_k P_k = \sum_k h_k \sigma_{k,1} \otimes \sigma_{k,2} \otimes \cdots \otimes \sigma_{k,n}$$

wobei $h_k$ reelle Koeffizienten sind und jedes $\sigma_{k,j}$ ein Pauli-Operator ($I$, $X$, $Y$, $Z$).

Das VQE-Prinzip beruht auf dem Variationsprinzip. Die Energie des Testzustands $|\psi(\boldsymbol{\theta})\rangle$ ist stets größer oder gleich der wahren Grundzustandsenergie $E_0$:

$$E(\boldsymbol{\theta}) = \langle \psi(\boldsymbol{\theta}) | \hat{H} | \psi(\boldsymbol{\theta}) \rangle \geq E_0$$

Der Optimierer sucht die Parameter $\boldsymbol{\theta}^*$, die $E(\boldsymbol{\theta})$ minimieren. Die Messung auf dem Quantencomputer erfolgt für jeden Pauli-String separat.

## Weiterführende Ressourcen

- [Qiskit Nature](https://qiskit.org/ecosystem/nature/) — IBM Framework für Quantenchemie
- [PennyLane](https://pennylane.ai/) — Plattform für differentielles Quantenprogrammieren
- [OpenFermion](https://quantumai.google/openfermion) — Googles Bibliothek für fermionische Simulationen
- Cao, Y. et al. (2019): „Quantum Chemistry in the Age of Quantum Computing." _Chemical Reviews_ 119, 10856-10915
- McArdle, S. et al. (2020): „Quantum computational chemistry." _Reviews of Modern Physics_ 92, 015003

---

_Dieses Thema gehört zum Bereich [Fortgeschrittene Themen](/fortgeschrittene-themen/)._
