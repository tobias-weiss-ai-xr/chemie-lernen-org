---
title: 'CO₂ Utilization'
description: 'Converting carbon dioxide into fuels, chemicals, and materials through electrocatalysis, thermocatalysis, and biocatalysis'
date: 2026-04-13
---

# CO₂ Utilization

## Overview

Carbon dioxide is often treated as a waste product, but it is also a carbon feedstock. CO₂ utilization converts captured carbon dioxide into useful products: fuels (methanol, methane, formic acid), chemicals (polycarbonates, urea), and materials (building aggregates, carbon fiber). The goal is not to consume all emitted CO₂ this way (the volumes are far too large) but to create economic value from carbon capture, incentivizing broader deployment of carbon capture technologies.

The chemistry is challenging because CO₂ is thermodynamically very stable. Its standard Gibbs free energy of formation is $\Delta G_f^\circ = -394$ kJ/mol, meaning the molecule sits in a deep energy well. Pushing CO₂ uphill to a higher-energy product requires significant energy input, and that energy must come from low-carbon sources (renewable electricity, solar heat, green hydrogen) for the process to make environmental sense.

Three main pathways exist: thermocatalytic conversion (heat and pressure over a catalyst), electrocatalytic reduction (electricity at an electrode), and biocatalytic conversion (enzymes or microbes). Each produces different products at different scales and efficiencies. The field is advancing quickly, with several technologies now at pilot or commercial scale.

## Key Concepts

- **Thermocatalytic CO₂ Hydrogenation** — CO₂ reacts with hydrogen over a catalyst to form methanol, methane, or other hydrocarbons. The Sabatier reaction produces methane: $\text{CO}_2 + 4\text{H}_2 \rightarrow \text{CH}_4 + 2\text{H}_2\text{O}$. Methanol synthesis uses Cu/ZnO/Al₂O₃ catalysts: $\text{CO}_2 + 3\text{H}_2 \rightarrow \text{CH}_3\text{OH} + \text{H}_2\text{O}$. These reactions run at 200-300°C and 20-80 bar. The key challenge is sourcing green hydrogen, which must be produced by water electrolysis using renewable electricity.

- **Electrocatalytic CO₂ Reduction (CO₂RR)** — Applying an electric potential to CO₂ dissolved in an aqueous or non-aqueous electrolyte reduces it at a cathode surface. The product depends on the catalyst: gold and silver selectively produce CO; tin and bismuth produce formate/formic acid; copper is unique in producing multi-carbon products (ethylene, ethanol, acetate, propanol). The reactions compete with hydrogen evolution (HER), so suppressing HER while promoting CO₂RR is a major design challenge.

- **CO₂ to Chemicals and Polymers** — Several industrial processes already use CO₂ as a feedstock. The synthesis of urea ($\text{CO}_2 + 2\text{NH}_3 \rightarrow \text{CO(NH}_2)_2 + \text{H}_2\text{O}$) consumes about 130 million tons of CO₂ annually. Polycarbonates can be made by copolymerizing CO₂ with epoxides, a process commercialized by companies like Covestro (cardyon® technology uses CO₂-based polyols for mattress foam). These routes are economically competitive because the CO₂ adds value to the product.

- **CCUS (Carbon Capture, Utilization, and Storage)** — CCUS combines capturing CO₂ from point sources or the atmosphere with either permanent geological storage or productive utilization. Utilization provides revenue to offset capture costs. Direct air capture (DAC) plants like Climeworks' Orca and Mammoth facilities in Iceland capture CO₂ from ambient air at concentrations of ~420 ppm, then either store it underground (via mineralization in basalt) or send it to utilization pathways.

- **Microbial CO₂ Conversion** — Engineered bacteria and algae fix CO₂ through metabolic pathways, producing biofuels, bioplastics, and commodity chemicals. Acetogens like _Clostridium ljungdahlii_ use the Wood-Ljungdahl pathway to convert CO₂ and H₂ into acetate and ethanol. Cyanobacteria can be engineered to produce isobutanol or limonene directly from CO₂ and sunlight. These approaches operate at ambient conditions but at slower rates than thermochemical or electrochemical methods.

## Applications

**Methanol from CO₂** is being commercialized by Carbon Recycling International (CRI) in Iceland. Their George Olah plant produces 4,000 tons of methanol per year from CO₂ captured from a geothermal power plant, using renewable geothermal electricity to produce hydrogen. The resulting methanol (branded Vulcanol) is blended into gasoline in Europe. Scaling this approach requires cheap renewable electricity and efficient electrolyzers.

**CO₂-derived aviation fuel** could decarbonize air travel. Companies like Twelve (formerly Opus 12) and Synhelion use electrochemical or thermochemical routes to convert CO₂ into syngas, then into synthetic kerosene via Fischer-Tropsch synthesis. These "e-fuels" are drop-in replacements for fossil jet fuel, compatible with existing aircraft engines and infrastructure. The main barrier is cost, currently 3-5 times higher than conventional jet fuel.

**Building materials** permanently sequester CO₂ in mineral form. CarbonCure injects CO₂ into concrete during mixing, where it reacts with calcium to form calcium carbonate nanoparticles that strengthen the concrete. Solidia Technologies uses CO₂ instead of water to cure precast concrete, absorbing up to 300 kg of CO₂ per ton of product while reducing the cement content by 30%.

## Formulas and Equations

The **Sabatier reaction** (CO₂ methanation):

$$\text{CO}_2 + 4\text{H}_2 \rightleftharpoons \text{CH}_4 + 2\text{H}_2\text{O} \quad \Delta H = -165 \text{ kJ/mol}$$

This is exothermic but requires high pressures (10-30 bar) to shift the equilibrium toward methane.

**CO₂ to methanol** synthesis:

$$\text{CO}_2 + 3\text{H}_2 \rightleftharpoons \text{CH}_3\text{OH} + \text{H}_2\text{O} \quad \Delta H = -49.5 \text{ kJ/mol}$$

Competing **reverse water-gas shift** reaction:

$$\text{CO}_2 + \text{H}_2 \rightleftharpoons \text{CO} + \text{H}_2\text{O} \quad \Delta H = +41.2 \text{ kJ/mol}$$

The **electrochemical reduction** half-reactions for common CO₂RR products:

$$\text{CO}_2 + 2\text{H}^+ + 2e^- \rightarrow \text{CO} + \text{H}_2\text{O} \quad E^\circ = -0.53 \text{ V vs. SHE}$$

$$\text{CO}_2 + 2\text{H}^+ + 2e^- \rightarrow \text{HCOOH} \quad E^\circ = -0.61 \text{ V vs. SHE}$$

$$2\text{CO}_2 + 12\text{H}^+ + 12e^- \rightarrow \text{C}_2\text{H}_4 + 4\text{H}_2\text{O} \quad E^\circ = -0.34 \text{ V vs. SHE}$$

The **Faradaic efficiency** for a specific product in CO₂RR:

$$\text{FE}_i = \frac{n_i \cdot z_i \cdot F}{Q_{\text{total}}} \times 100\%$$

where $n_i$ is the moles of product $i$, $z_i$ is the number of electrons required per molecule, $F$ is Faraday's constant, and $Q_{\text{total}}$ is the total charge passed.

## Further Reading

- Kuhl, K.P. et al. "Electrocatalytic Conversion of Carbon Dioxide to Methane and Methanol on Transition Metal Surfaces." _Journal of the American Chemical Society_ 136, 14107-14113 (2014).
- Porosoff, M.D. et al. "Catalytic Reduction of CO₂ by H₂ for Synthesis of CO, Methanol and Hydrocarbons." _Energy & Environmental Science_ 9, 62-73 (2016).
- Hepburn, C. et al. "The technological and economic prospects for CO₂ utilization and removal." _Nature_ 575, 87-97 (2019).
- [Carbon Capture Journal](https://www.carboncapturejournal.com/) — News and research on CCUS
- [Global CO₂ Initiative](https://www.globalco2initiative.org/) — Roadmaps and market analysis for CO₂ utilization

---

_This topic is part of [Advanced Topics](/en/advanced-topics/)._
