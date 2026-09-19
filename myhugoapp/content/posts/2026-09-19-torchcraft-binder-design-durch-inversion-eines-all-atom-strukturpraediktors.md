---
title: "TorchCraft: Binder-Design durch Inversion eines All-Atom-Strukturprädiktors"
date: "2026-09-19T02:43:21+02:00"
description: "Ein Forschungsteam stellt TorchCraft vor, ein einheitliches Rechenframework zum Design von Protein-Bindern, das die erlernten Strukturprioritäten eines All-Atom-Strukturprädiktors direkt für die Seque"
source: "https://arxiv.org/abs/2609.19770"
tags:
  - "proteindesign"
  - "alphafold"
  - "biochemie"
  - "künstliche intelligenz"
  - "peptide"
categories: ["forschung"]
draft: false
---

Ein Forschungsteam stellt TorchCraft vor, ein einheitliches Rechenframework zum Design von Protein-Bindern, das die erlernten Strukturprioritäten eines All-Atom-Strukturprädiktors direkt für die Sequenzoptimierung nutzt. Statt ein Prädiktormodell neu zu trainieren, bleibt dieses „eingefroren" (frozen): TorchCraft optimiert Sequenz-Logits über differenzierbare Gradientenabstiegsschritte so, dass der Prädiktor eine fest gebundene Protein-Protein-Struktur vorhersagt.

Implementiert in der TorchFold-Bibliothek, kombiniert TorchCraft mehrere Optimierungsziele in einer gemeinsamen Prozedur: Konfidenz-Scores der Vorhersage, Kontaktmerkmale, geometrische Restriktionen und Sequenz-Prioritäten (Ähnlichkeit zu natürlichen Sequenzen). Das Framework deckt vier Binder-Formate ab: Minibinder, gerüstkonditionierte VHHs (Nanobodies aus Kameliden), zyklische Peptide und ligandenbindende Proteine.

Unter Verwendung vortrainierter AlphaFold-3-Gewichte generierte TorchCraft repräsentative Minibinder und VHHs, deren Bindung an jeweils vier Zielproteine experimentell nachgewiesen wurde – ganz ohne nachträgliche Sequenz-Neuentwürfe (post hoc redesign). Computergestützte Benchmarks zeigten zudem die Anwendbarkeit auf zyklische Peptide und auf das Design ligandenkonditionierter Bindetaschen.

Damit erweitert TorchCraft die sogenannte Prädiktor-Inversion auf mehrere Binderformate und molekulare Kontexte. Es liefert einen gemeinsamen Rahmen, um strukturelle Priors aus All-Atom-Modellen für das rationale Proteindesign wiederzuverwenden – ein wichtiger Schritt hin zu KI-gestütztem Design von Therapeutika, Diagnostika und molekularen Werkzeugen, bei dem experimentelle Validierung direkt in den Designzyklus eingebunden werden kann.

Hintergrund: Die Inversion von Strukturprädiktoren wie AlphaFold 3 nutzt deren differenzierbare Architektur – Sequenzen werden so lange angepasst, bis das Modell mit hoher Konfidenz die Zielstruktur vorhersagt. VHHs sind kompakte Ein-Domänen-Antikörper aus Kameliden, die u. a. durch eine konservierte Disulfidbrücke ($\mathrm{-S{-}S-}$) stabilisiert werden und beliebte Ausgangspunkte für Biopharmazeutika sind.


Entitäten:
torchcraft | methode
alphafold 3 | methode
torchfold | methode
prädiktorinversion | konzept
sequenzlogits | konzept
minibinder | stoff
vhh | stoff
zyklisches peptid | stoff
ligandenbindendes protein | stoff
binder-design | konzept


---

### 📄 Quelle

[Nachrichten-Artikel](https://arxiv.org/abs/2609.19770)

📄 [Original-Publikation](https://doi.org/10.48550/arXiv.2609.19770)
📄 [Original-Publikation](https://arxiv.org/abs/2609.19770)
📄 [Original-Publikation](https://arxiv.org/abs/2609.19770v1)



---

### 🧪 Verwandte Rechner

Mit diesen interaktiven Werkzeugen können Sie das Thema vertiefen:

🔬 [ph-rechner →](/ph-rechner/)
🔬 [stoechiometrie-rechner →](/stoechiometrie-rechner/)
🔬 [bindungspotential →](/bindungspotential/)
🔬 [molekuel-studio →](/molekuel-studio/)

