---
title: 'Metal-Organic Frameworks (MOFs)'
description: 'Porous crystalline materials built from metal nodes and organic linkers with applications in gas storage, carbon capture, and drug delivery'
date: 2026-04-13
---

# Metal-Organic Frameworks (MOFs)

## Overview

Metal-Organic Frameworks are a class of porous materials constructed from metal ions or clusters (nodes) connected by organic molecules (linkers) into extended three-dimensional networks. The result is a crystal with enormous internal surface area and tunable pore size. A single gram of some MOFs has an internal surface area exceeding 7,000 m², roughly the size of a football field.

Omar Yaghi coined the term "MOF" in the late 1990s, and the field has since exploded. Over 100,000 MOF structures have been reported, and computational screening suggests millions more are theoretically possible. Their modular architecture is the key advantage: by swapping the metal node or the organic linker, chemists can tailor pore size, surface chemistry, and functionality for a specific application. This "reticular chemistry" approach turned MOF synthesis from an art into a design problem.

## Key Concepts

- **Structure: Nodes and Linkers** — The metal node can be a single ion (Zn²⁺, Cu²⁺, Cr³⁺) or a cluster (Zn₄O, Cu₂, Zr₆). The linker is typically a di- or polycarboxylate, such as terephthalic acid (BDC) or trimesic acid (BTC). The geometry of both components determines the framework topology. For example, the paddlewheel Cu₂ unit paired with BDC produces the well-known HKUST-1 structure with cubic pores.

- **Reticular Chemistry and Topology** — The systematic combination of nodes and linkers follows predictable topological nets (srs, dia, pcu, UiO-66 type). The Reticular Chemistry Structure Resource (RCSR) catalogues over 3,000 topological nets. This framework lets chemists design a MOF with desired pore geometry by choosing the right node-linker combination, much like assembling building blocks.

- **Porosity and Surface Area** — MOFs are characterized by their Brunauer-Emmett-Teller (BET) surface area, pore volume, and pore size distribution. MOF-210 holds a record BET surface area of 6,240 m²/g. The porosity comes from the open framework structure where the linkers create channels and cages of molecular dimensions, typically 0.5 to 3.0 nm.

- **Postsynthetic Modification (PSM)** — After assembling the framework, chemists can modify the organic linkers without collapsing the structure. This includes grafting functional groups, exchanging metal ions (transmetalation), or loading guest molecules. PSM dramatically expands the range of accessible MOF chemistries beyond what direct synthesis can achieve.

- **Stability Challenges** — Early MOFs were fragile in water and heat. Modern water-stable MOFs like UiO-66 (Zr-based), MIL-101 (Cr-based), and ZIF-8 (Zn-based with imidazolate linkers) withstand boiling water and steam. The Zr-O bond in UiO-66 is particularly robust, giving thermal stability above 500°C.

## Applications

**Carbon capture** is a major focus. MOFs selectively adsorb CO₂ over nitrogen and water vapor from flue gas or direct air capture streams. Mg-MOF-74 shows exceptionally high CO₂ uptake at ambient conditions due to open magnesium sites that bind CO₂ through Lewis acid-base interactions. MOF-based direct air capture systems are being tested by companies like NanoMOFs and Mosaic Materials (now part of BASF).

**Hydrogen storage** benefits from MOFs' high surface area. MOF-5, NU-1500-Al, and others can store hydrogen at cryogenic temperatures with capacities exceeding 14 wt%, approaching US Department of Energy targets for onboard vehicle storage. The physisorption mechanism allows fast uptake and release compared to chemical hydrides.

**Water harvesting from air** is a striking application demonstrated by Yaghi's group. MOF-801 and MOF-303 adsorb water from desert air at relative humidities as low as 10-20%, then release it with mild heating. A device using 1 kg of MOF-303 can harvest 6-8 liters of water per day from arid air, offering a potential solution for water-scarce regions.

**Drug delivery** leverages the biocompatibility and tunable pore size of certain MOFs. Drugs are loaded into the pores and released over time as the framework degrades. MIL-100(Fe) and MIL-101(Fe) have delivered anticancer drugs like doxorubicin with controlled release profiles superior to conventional carriers.

## Formulas and Equations

The **BET equation** for determining surface area from gas adsorption data:

$$\frac{p/p_0}{V(1 - p/p_0)} = \frac{1}{V_m C} + \frac{C - 1}{V_m C} \cdot \frac{p}{p_0}$$

where $p/p_0$ is the relative pressure, $V$ is the volume adsorbed, $V_m$ is the monolayer capacity, and $C$ is the BET constant related to adsorption energy.

The **Langmuir adsorption isotherm** often used to model gas uptake in MOFs:

$$q = q_{\text{max}} \cdot \frac{bP}{1 + bP}$$

where $q$ is the amount adsorbed at pressure $P$, $q_{\text{max}}$ is the saturation capacity, and $b$ is the Langmuir affinity constant.

The **ideal adsorbed solution theory (IAST)** predicts mixed-gas adsorption from single-component isotherms:

$$\int_0^{p_i^*} \frac{q_i(p)}{p} dp = \int_0^{p_i^0} \frac{q_i(p)}{p} dp$$

where $p_i^*$ is the hypothetical pressure of component $i$ in the mixture, and $p_i^0$ is the pure-component pressure at the same spreading pressure. IAST is essential for predicting CO₂/N₂ selectivity in carbon capture applications.

The **pore size** from the cyclovoltammetric or geometric standpoint relates to the linker length $L$ and node geometry:

$$d_{\text{pore}} = 2L \cdot \sin\left(\frac{\theta}{2}\right) - 2r_{\text{vdW}}$$

where $\theta$ is the angle at the metal node and $r_{\text{vdW}}$ is the van der Waals radius of the linker atoms lining the pore.

## Further Reading

- Furukawa, H. et al. "The chemistry and applications of metal-organic frameworks." _Science_ 341, 1230444 (2013).
- Yaghi, O.M. et al. "Reticular synthesis and the design of new materials." _Nature_ 423, 705-714 (2003).
- Kalmutzki, M.J. et al. "Two-dimensional crystals: a new frontier." _Advanced Materials_ 30, 1705439 (2018).
- [MOF Database (CoRE MOF)](https://www.ch.imperial.ac.uk/computationchemistry/) — Computation-Ready, Experimental MOF database
- [Reticular Chemistry Structure Resource](http://rcsr.anu.edu.au/) — Topological nets for reticular chemistry

---

_This topic is part of [Advanced Topics](/en/advanced-topics/)._
