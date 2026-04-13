---
title: 'Nanomaterials'
description: 'Materials at the nanoscale, from quantum dots and graphene to carbon nanotubes and 2D materials'
date: 2026-04-13
---

# Nanomaterials

## Overview

Nanomaterials have at least one dimension between 1 and 100 nanometers, and at this scale, physical and chemical properties diverge dramatically from the bulk. Gold nanoparticles are not gold-colored; they appear red, purple, or blue depending on their size. Silicon, which is a poor light emitter in bulk, can fluoresce brightly when shrunk to nanocrystals. These effects arise because the confinement of electrons, phonons, and excitons in nanoscale dimensions quantizes energy levels and amplifies surface-to-volume ratios.

The field took off after the discovery of carbon nanotubes by Sumio Iijima in 1991 and the isolation of graphene by Andre Geim and Konstantin Novoselov in 2004 (earning them the 2010 Nobel Prize). Today, nanomaterials are found in displays, batteries, catalysts, sunscreens, and cancer therapies. Their impact spans virtually every branch of chemistry and materials science.

## Key Concepts

- **Quantum Confinement** — When a semiconductor particle becomes smaller than its exciton Bohr radius, the energy levels become discrete rather than continuous. The bandgap increases as the particle shrinks, shifting absorption and emission to shorter wavelengths (higher energy). This is why quantum dots of the same material but different sizes emit different colors. The effective mass approximation gives the size-dependent bandgap:

- **Quantum Dots** — Semiconductor nanocrystals (CdSe, PbS, InP, perovskite CsPbBr₃) with diameters of 2-10 nm. They have narrow, symmetric emission peaks (full width at half maximum around 20-30 nm), making them superior to organic dyes for display and imaging applications. The 2023 Nobel Prize in Chemistry went to Bawendi, Brus, and Ekimov for discovering and developing quantum dots.

- **Graphene and 2D Materials** — Graphene is a single layer of sp²-bonded carbon atoms arranged in a honeycomb lattice. It has exceptional electron mobility (200,000 cm²/V·s at room temperature), mechanical strength (130 GPa tensile strength), and thermal conductivity (5,000 W/m·K). Beyond graphene, the 2D family includes hexagonal boron nitride (h-BN), MoS₂, WS₂, black phosphorus, and MXenes. Each has distinct electronic, optical, and catalytic properties.

- **Carbon Nanotubes (CNTs)** — Rolled graphene sheets that form single-walled (SWCNT) or multi-walled (MWCNT) tubes. SWCNTs can be metallic or semiconducting depending on their chirality (the angle at which the graphene sheet is rolled). They have extraordinary tensile strength (up to 100 GPa) and are used in composites, transparent electrodes, and field-effect transistors.

- **Surface-to-Volume Ratio** — A 3 nm particle has roughly 50% of its atoms on the surface. This makes nanomaterials exceptional catalysts: more surface atoms means more active sites. Platinum nanoparticles supported on carbon (Pt/C) are the standard catalyst in proton exchange membrane fuel cells, where reducing particle size to 2-3 nm maximizes platinum utilization.

- **Surface Plasmon Resonance** — Noble metal nanoparticles (Au, Ag, Cu) support collective oscillations of conduction electrons called localized surface plasmon resonances (LSPR). The resonance frequency depends on particle size, shape, composition, and the surrounding medium. Gold nanorods have a tunable plasmon band from 600 to 1200 nm by adjusting their aspect ratio.

## Applications

**Display technology** uses quantum dots as color-converting phosphors in QLED TVs (Samsung, Sony). Blue LEDs excite red- and green-emitting quantum dots to produce a wider color gamut than conventional LCD displays. Cadmium-free InP quantum dots address toxicity concerns while maintaining color purity.

**Catalysis** relies on the high surface area of nanoparticles. Gold nanoparticles (2-5 nm) catalyze CO oxidation at room temperature, a reaction that bulk gold is completely inactive for. Nanoparticulate TiO₂ in dye-sensitized solar cells (Grätzel cells) provides the mesoporous scaffold for dye loading and electron collection. Pt nanocatalysts in fuel cells split hydrogen and reduce oxygen at the heart of hydrogen-powered vehicles.

**Biomedical applications** span imaging, drug delivery, and therapy. Quantum dots label cells for fluorescence imaging with photostability far exceeding organic dyes. Gold nanoshells absorb near-infrared light and convert it to heat, selectively destroying cancer cells in photothermal therapy. Magnetic iron oxide nanoparticles (Fe₃O₄) serve as contrast agents in MRI and can be guided by external magnets for targeted drug delivery.

**Energy storage** benefits from nanomaterials in battery electrodes and supercapacitors. Silicon nanoparticles accommodate the large volume expansion (roughly 300%) during lithiation without pulverizing, unlike bulk silicon. Graphene and CNT-based supercapacitors achieve high power density through fast ion transport in the porous nanostructure.

## Formulas and Equations

The **size-dependent bandgap** of a quantum dot (effective mass approximation):

$$E_g(R) = E_g^{\text{bulk}} + \frac{\hbar^2 \pi^2}{2R^2} \left( \frac{1}{m_e^*} + \frac{1}{m_h^*} \right) - \frac{1.8e^2}{4\pi\varepsilon\varepsilon_0 R}$$

where $R$ is the particle radius, $m_e^*$ and $m_h^*$ are the effective masses of the electron and hole, and the third term accounts for the Coulomb attraction between the electron and hole.

The **surface-to-volume ratio** for a spherical nanoparticle:

$$\frac{S}{V} = \frac{4\pi R^2}{\frac{4}{3}\pi R^3} = \frac{3}{R}$$

The **plasmon resonance condition** for a spherical metal nanoparticle (Mie theory, quasi-static limit):

$$\sigma_{\text{ext}}(\omega) = \frac{24\pi R^3 \varepsilon_m^{3/2}}{c} \cdot \frac{\varepsilon_2(\omega)}{(\varepsilon_1(\omega) + 2\varepsilon_m)^2 + \varepsilon_2(\omega)^2}$$

where $\varepsilon_1$ and $\varepsilon_2$ are the real and imaginary parts of the metal dielectric function, and $\varepsilon_m$ is the dielectric constant of the surrounding medium. Resonance occurs when $\varepsilon_1 = -2\varepsilon_m$.

The **quantum yield** of a fluorophore (including quantum dots):

$$\Phi = \frac{\text{number of photons emitted}}{\text{number of photons absorbed}} = \frac{k_r}{k_r + k_{nr}}$$

where $k_r$ is the radiative rate and $k_{nr}$ is the non-radiative rate. High-quality CdSe/ZnS core-shell quantum dots achieve $\Phi > 0.8$.

## Further Reading

- Murray, C.B. et al. "Synthesis and characterization of monodisperse nanocrystals and close-packed nanocrystal assemblies." _Annual Review of Materials Science_ 30, 545-610 (2000).
- Novoselov, K.S. et al. "Two-dimensional atomic crystals." _Proceedings of the National Academy of Sciences_ 102, 10451-10453 (2005).
- Kelly, K.L. et al. "The Optical Properties of Metal Nanoparticles." _Journal of Physical Chemistry B_ 107, 668-677 (2003).
- [The Nanomaterial Registry](https://www.nanomaterialregistry.org/) — Curated nanomaterial data
- [Nanomaterial Database](https://nanocomputer.org/) — Properties and applications

---

_This topic is part of [Advanced Topics](/en/advanced-topics/)._
