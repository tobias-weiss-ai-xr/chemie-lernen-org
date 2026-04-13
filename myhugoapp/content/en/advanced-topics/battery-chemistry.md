---
title: 'Battery Chemistry'
description: 'The electrochemistry behind lithium-ion and next-generation batteries, from the Nernst equation to solid-state designs'
date: 2026-04-13
---

# Battery Chemistry

## Overview

Batteries convert chemical energy into electrical energy through redox reactions. The lithium-ion battery, commercialized by Sony in 1991, revolutionized portable electronics and made electric vehicles practical. Today, batteries account for over 80% of the global stationary energy storage market and are essential to the transition away from fossil fuels.

A battery cell consists of two electrodes separated by an electrolyte. During discharge, oxidation at the anode releases electrons that flow through an external circuit to the cathode, where reduction occurs. Ions travel through the electrolyte to balance charge. The specific materials used in each component determine the battery's energy density, power, cycle life, safety, and cost.

Current research focuses on pushing energy density higher, replacing scarce materials like cobalt, eliminating flammable liquid electrolytes, and improving recycling. Solid-state batteries, sodium-ion chemistry, and silicon anodes are the leading candidates for the next generation.

## Key Concepts

- **Lithium-Ion Cell Chemistry** — A standard Li-ion cell has a graphite anode ($\text{LiC}_6$) and a lithium metal oxide cathode such as $\text{LiCoO}_2$ (LCO), $\text{LiNi}_{0.8}\text{Mn}_{0.1}\text{Co}_{0.1}\text{O}_2$ (NMC 811), or $\text{LiFePO}_4$ (LFP). During charging, Li⁺ ions leave the cathode lattice and intercalate between graphite layers. During discharge, they reverse. The cell voltage depends on the difference in chemical potential of lithium between the two electrodes.

- **Nernst Equation** — The equilibrium potential of a half-cell is determined by the Nernst equation, which relates voltage to the activities of reactants and products. As a battery discharges and reactants are consumed, the cell voltage drops. Understanding this relationship is critical for predicting battery behavior under different conditions.

- **Solid-State Electrolytes** — Replacing the liquid electrolyte with a solid ceramic, polymer, or glass material eliminates the flammability risk and enables the use of lithium metal anodes, which offer much higher energy density. Leading solid electrolytes include Li₇La₃Zr₂O₁₂ (garnet-type LLZO), Li₁₀GeP₂S₁₂ (LGPS, sulfide-based), and PEO-based polymers. The main challenge is achieving high ionic conductivity at room temperature while maintaining good interfacial contact with the electrodes.

- **Sodium-Ion Batteries** — Sodium is abundant and inexpensive compared to lithium. Na-ion batteries use similar intercalation chemistry but with Na⁺ ions instead of Li⁺. The larger ionic radius of sodium (1.02 Å vs. 0.76 Å for Li⁺) requires different cathode materials (layered oxides, Prussian blue analogs) and anodes (hard carbon instead of graphite). Energy density is lower (roughly 75% of Li-ion), but cost advantages make them attractive for grid storage.

- **Degradation Mechanisms** — Batteries degrade through several pathways: solid electrolyte interphase (SEI) growth consuming lithium, cathode structural changes (phase transitions, oxygen loss), electrolyte decomposition, and lithium plating at high charge rates. Understanding these mechanisms guides the development of longer-lasting batteries.

- **Battery Recycling** — Hydrometallurgical processes dissolve spent battery materials in acid, then selectively recover metals through precipitation and solvent extraction. Pyrometallurgy smelts the entire cell at high temperature, recovering a metal alloy. Direct recycling aims to regenerate cathode materials without breaking them down to elemental metals, preserving the value added during synthesis.

## Applications

**Electric vehicles** dominate lithium demand. A Tesla Model Y Long Range contains a 75 kWh NCA battery pack weighing about 440 kg. The 2025 generation of EVs achieves over 600 km of range, driven by cathode innovations (high-nickel NMC, LFP for cost-sensitive models) and increasingly by silicon-containing anodes.

**Grid-scale energy storage** uses LFP batteries for their safety, longevity (6,000-10,000 cycles), and lower cost. Megawatt-scale battery installations in Australia, California, and the UK are replacing gas peaker plants and stabilizing grids with high renewable penetration.

**Consumer electronics** still rely on LCO batteries for their high volumetric energy density, though the cobalt content has been steadily reduced. Portable devices drive demand for fast charging, which requires electrodes that tolerate high current densities without lithium plating.

## Formulas and Equations

The **Nernst equation** for a lithium intercalation electrode:

$$E = E^\circ - \frac{RT}{nF} \ln \frac{a_{\text{Li}^+}^{x} \cdot a_{\text{Host}}}{a_{\text{Li}_x\text{Host}}}$$

For a full Li-ion cell combining a graphite anode and an oxide cathode, the open-circuit voltage is:

$$V_{\text{OCV}} = E_{\text{cathode}} - E_{\text{anode}} = -\frac{\Delta G}{nF}$$

where $\Delta G$ is the Gibbs free energy change for the overall cell reaction.

**Specific energy** of a battery:

$$\text{Specific Energy} = \frac{nFV_{\text{avg}}}{3.6 \cdot M_{\text{total}}} \quad [\text{Wh/kg}]$$

where $n$ is the number of electrons transferred, $F = 96,485$ C/mol, $V_{\text{avg}}$ is the average discharge voltage, and $M_{\text{total}}$ is the total molar mass of reactants.

The **C-rate** describes charge/discharge speed:

$$I = C\text{-rate} \times Q$$

where $Q$ is the battery capacity in ampere-hours. A 1C rate fully discharges the battery in 1 hour; a 5C rate discharges it in 12 minutes.

The **Tafel equation** describes the overpotential at an electrode:

$$\eta = a + b \log i$$

where $\eta$ is the overpotential, $i$ is the current density, $a$ is the exchange current density, and $b$ is the Tafel slope. Lower Tafel slopes indicate faster electrode kinetics.

## Further Reading

- Goodenough, J.B. & Park, K.S. "The Li-Ion Rechargeable Battery: A Perspective." _Journal of the American Chemical Society_ 135, 1167-1176 (2013).
- Manthiram, A. "A Reflection on Lithium-Ion Battery Cathode Chemistry." _Nature Communications_ 11, 1550 (2020).
- Tarascon, J.M. & Armand, M. "Issues and challenges facing rechargeable lithium batteries." _Nature_ 414, 359-367 (2001).
- [Battery Innovation Hub (Argonne)](https://www.anl.gov/battery) — Battery research and data
- [BatteryArchive](https://www.batteryarchive.org/) — Open-source battery degradation dataset

---

_This topic is part of [Advanced Topics](/en/advanced-topics/)._
