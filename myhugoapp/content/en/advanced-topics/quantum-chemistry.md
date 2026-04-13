---
title: 'Quantum Chemistry'
description: 'How quantum computing is opening new frontiers in molecular simulation and computational chemistry'
date: 2026-04-13
---

# Quantum Chemistry

## Overview

Quantum chemistry has always demanded enormous computing power. Even small molecules require solving the Schrödinger equation for many interacting electrons, and the cost scales exponentially with system size on classical computers. Quantum computers offer a fundamentally different approach: their qubits can natively represent quantum superpositions, making them a natural fit for simulating quantum systems.

Richard Feynman recognized this in 1982, arguing that simulating quantum physics requires a quantum machine. Today, quantum hardware has advanced enough to tackle small but meaningful chemistry problems. Algorithms like the Variational Quantum Eigensolver (VQE) have calculated ground-state energies for molecules like H₂, LiH, and BeH₂ on real quantum processors. While fault-tolerant quantum computers remain years away, the current noisy intermediate-scale quantum (NISQ) era already produces useful chemical insights.

## Key Concepts

- **Qubits and Superposition** — A classical bit is 0 or 1. A qubit exists in a superposition $\alpha|0\rangle + \beta|1\rangle$ where $|\alpha|^2 + |\beta|^2 = 1$. Multiple qubits can be entangled, creating correlations that have no classical analog. This entanglement is what gives quantum computers their power for chemistry: electron-electron interactions map directly to entangled qubit states.

- **Second Quantization and Qubit Mapping** — Molecular electronic structure is typically expressed in second quantization using creation ($a^\dagger_p$) and annihilation ($a_p$) operators acting on spin orbitals. These operators must be mapped to qubit operations. The Jordan-Wigner transform converts fermionic operators to Pauli strings (tensor products of $\sigma_x$, $\sigma_y$, $\sigma_z$), while the Bravyi-Kitaev transform reduces the number of Pauli terms needed.

- **Variational Quantum Eigensolver (VQE)** — VQE is a hybrid quantum-classical algorithm. A parameterized quantum circuit (the ansatz) prepares a trial wavefunction on the quantum processor, measures the energy expectation value, and sends the result to a classical optimizer that updates the circuit parameters. The process repeats until convergence. VQE is resilient to noise because it finds the lowest energy within its ansatz, even on imperfect hardware.

- **Quantum Phase Estimation (QPE)** — QPE is an exact algorithm for finding eigenvalues of unitary operators, but it requires deep circuits and error correction. It provides the "gold standard" for molecular energy calculations on future fault-tolerant quantum computers. For a Hamiltonian $H$ with eigenstate $|\psi\rangle$ and eigenvalue $E$, QPE extracts $E$ with precision that scales polynomially in qubit count.

- **Quantum Error Correction** — Current quantum hardware suffers from decoherence and gate errors. Error-correcting codes like the surface code encode logical qubits in many physical qubits, detecting and correcting errors without measuring the quantum state. The overhead is steep: one logical qubit might need 1,000+ physical qubits. This is why practical quantum chemistry simulations may require millions of physical qubits.

## Applications

**Molecular ground-state energies** are the benchmark problem. IBM, Google, and others have demonstrated VQE calculations for small molecules. In 2020, Google's Sycamore processor used a 12-qubit calculation to simulate the H₁₂ chain, pushing the boundaries of what NISQ devices can achieve. These calculations test hardware capabilities and algorithm design.

**Catalyst design** is a long-term goal. Transition metal catalysts involve strongly correlated electrons that classical methods struggle with. Quantum computers could accurately model catalytic active sites, predicting reaction barriers and selectivity. This would transform industrial chemistry by enabling computational catalyst screening.

**Excited states and photochemistry** involve electronic transitions that are harder to compute than ground states. Quantum algorithms for excited states (like quantum equation-of-motion methods) could improve predictions for light-harvesting materials, OLEDs, and photocatalytic processes.

## Formulas and Equations

The **electronic Schrödinger equation** in atomic units:

$$\hat{H} |\Psi\rangle = E |\Psi\rangle$$

where the molecular electronic Hamiltonian is:

$$\hat{H} = -\sum_i \frac{1}{2}\nabla_i^2 - \sum_{i,A} \frac{Z_A}{r_{iA}} + \sum_{i>j} \frac{1}{r_{ij}} + \sum_{A>B} \frac{Z_A Z_B}{R_{AB}}$$

The **VQE objective function** minimizes the energy over parameterized quantum states:

$$E(\boldsymbol{\theta}) = \langle \Psi(\boldsymbol{\theta}) | \hat{H} | \Psi(\boldsymbol{\theta}) \rangle = \sum_k c_k \langle \Psi(\boldsymbol{\theta}) | P_k | \Psi(\boldsymbol{\theta}) \rangle$$

where $P_k$ are Pauli strings and $c_k$ are their coefficients obtained from qubit mapping.

The **Jordan-Wigner mapping** of a fermionic operator to qubits:

$$a_p^\dagger = \frac{1}{2} \left( \sigma^x_p + i\sigma^y_p \right) \bigotimes_{q < p} \sigma^z_q$$

This preserves the anti-commutation relations of fermions at the cost of long Pauli strings for orbitals far from the first qubit.

## Further Reading

- Cao, Y. et al. "Quantum Chemistry in the Age of Quantum Computing." _Chemical Reviews_ 119, 10856-10915 (2019).
- McArdle, S. et al. "Quantum computational chemistry." _Reviews of Modern Physics_ 92, 015003 (2020).
- Kandala, A. et al. "Hardware-efficient variational quantum eigensolver for small molecules and quantum magnets." _Nature_ 549, 242-246 (2017).
- [Qiskit Nature](https://qiskit-community.github.io/qiskit-nature/) — Open-source framework for quantum chemistry simulations
- [OpenFermion](https://quantumai.google/openfermion) — Google's library for compiling quantum chemistry simulations

---

_This topic is part of [Advanced Topics](/en/advanced-topics/)._
