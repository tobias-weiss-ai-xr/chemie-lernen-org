---
title: 'p-Orbitale - Hantelförmige Aufenthaltsräume'
last_reviewed: 2026-08-06
layout: 'orbitalansichten'
description: 'Lerne die hantelförmigen p-Orbitale und ihre Bedeutung für chemische Bindungen kennen'
orbital: '2px'
weight: 20
---

## Lernziele

| Lernziel               | Beschreibung                                                              |
| ---------------------- | ------------------------------------------------------------------------- |
| Form beschreiben       | Die hantelförmige Gestalt der p-Orbitale mit zwei Keulen erklären         |
| Knotenebene            | Die angulare Knotenebene durch den Kern verstehen                         |
| Räumliche Orientierung | Die drei Orientierungen px, py und pz unterscheiden können                |
| Phasendarstellung      | Die Bedeutung der positiven und negativen Keulen (Phase ±) verstehen      |
| Bindungsbildung        | Den Zusammenhang zwischen p-Orbitalen und kovalenten Bindungen herstellen |

## Was sind p-Orbitale?

p-Orbitale besitzen eine **hantelförmige (dumbbell) Geometrie** mit zwei Keulen (Loben), die sich in entgegengesetzte Richtungen erstrecken. Im Gegensatz zu den kugelförmigen s-Orbitalen haben p-Orbitale eine **angulare Knotenebene**, die durch den Kern verläuft — dort ist die Aufenthaltswahrscheinlichkeit des Elektrons null.

Die Bezeichnung "p" stammt von "principal" (principal series in der Spektroskopie).

## Die drei p-Orbitale: px, py und pz

Für jede Hauptquantenzahl $n \geq 2$ gibt es **drei p-Orbitale**, die jeweils entlang einer der drei Raumachsen orientiert sind:

### px-Orbital ($2p_x$)

- Orientiert entlang der **x-Achse**
- Zwei Keulen links und rechts des Kerns
- Knotenebene: die yz-Ebene

### py-Orbital ($2p_y$)

- Orientiert entlang der **y-Achse**
- Zwei Keulen vor und hinter dem Kern
- Knotenebene: die xz-Ebene

### pz-Orbital ($2p_z$)

- Orientiert entlang der **z-Achse**
- Zwei Keulen oberhalb und unterhalb des Kerns
- Knotenebene: die xy-Ebene

## Phasendarstellung (±)

Die beiden Keulen eines p-Orbitals haben **unterschiedliche Phasen** (Vorzeichen der Wellenfunktion):

- **Positive Phase (+):** Blaue Einfärbung
- **Negative Phase (−):** Rote Einfärbung

Die Phasendarstellung ist entscheidend für das Verständnis chemischer Bindungen:

- **Gleiche Phase → bindende Wechselwirkung** (konstruktive Interferenz)
- **Entgegengesetzte Phase → antibindende Wechselwirkung** (destruktive Interferenz)

## Vergleich der p-Orbitale mit s-Orbitalen

| Eigenschaft                | s-Orbital   | p-Orbital                |
| -------------------------- | ----------- | ------------------------ |
| Form                       | Kugelförmig | Hantelförmig (2 Keulen)  |
| Angularer Knoten           | 0           | 1 (Ebene durch den Kern) |
| Anzahl pro Energieniveau   | 1           | 3                        |
| Max. Elektronen pro Niveau | 2           | 6                        |
| Erste Hauptquantenzahl     | n=1         | n=2                      |

## Bedeutung für chemische Bindungen

p-Orbitale spielen eine Schlüsselrolle bei der Bildung kovalenter Bindungen:

- **σ-Bindungen:** Entstehen durch direkte Überlappung entlang der Bindungsachse (z.B. zwei px-Orbitale)
- **π-Bindungen:** Entstehen durch seitliche Überlappung parallel zur Bindungsachse (z.B. zwei pz-Orbitale)

Die Orientierung der p-Orbitale bestimmt maßgeblich die **Molekülgeometrie**.

## Interaktive 3D-Ansicht: p-Orbitale

Wähle im Dropdown-Menü zwischen 2px, 2py, 2pz und aktiviere die Phasendarstellung, um die positiven und negativen Keulen zu sehen.

<div id="orbital-viewer-container" style="width:100%;height:500px;border:1px solid #ddd;border-radius:8px;"></div>

## Verständnisfragen

1. Warum haben p-Orbitale eine Knotenebene durch den Kern?
2. Welche praktische Bedeutung hat die Phasendarstellung für chemische Bindungen?
3. Wie unterscheiden sich σ- und π-Bindungen in Bezug auf die Orbitalüberlappung?

## Weiterführende Themen

- [s-Orbitale - Kugelförmige Aufenthaltsräume](/orbitalansichten/s-orbital/)
- [d-Orbitale - Kleeblatt- und Donutformen](/orbitalansichten/d-orbital/)
- [Hybridisierung von Orbitalen](/orbitalansichten/hybridisierung/)
- [Periodensystem der Elemente 3D](/perioden-system-der-elemente/)

<script type="importmap">
{
  "imports": {
    "three": "/periodic-table/lib/three.module.js",
    "three/addons/": "/periodic-table/lib/three/addons/"
  }
}
</script>
<script type="module">
import { initOrbitalViewer } from '/js/visualization/orbital-viewer/orbital-viewer.js';

const container = document.getElementById('orbital-viewer-container');
if (container) {
  const cleanup = initOrbitalViewer('orbital-viewer-container');
  const checkSelect = setInterval(() => {
    const select = document.getElementById('ov-orbital-select');
    if (select) {
      select.value = '2px';
      select.dispatchEvent(new Event('change'));
      clearInterval(checkSelect);
    }
  }, 100);
  window.__orbitalCleanup = cleanup;
}
</script>
