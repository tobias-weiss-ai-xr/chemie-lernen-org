---
title: 'd-Orbitale - Kleeblatt- und Donutformen'
layout: 'orbitalansichten'
description: 'Lerne die fünf d-Orbitale kennen - ihre Formen, Orientierung und Bedeutung für Übergangsmetalle'
orbital: '3dz2'
weight: 30
---

## Lernziele

| Lernziel            | Beschreibung                                                         |
| ------------------- | -------------------------------------------------------------------- |
| Fünf d-Orbitale     | Die Formen und Orientierungen der fünf d-Orbitale benennen können    |
| Kleeblattform       | Die vierkeuligen d-Orbitale (dxy, dxz, dyz, dx²−y²) beschreiben      |
| Donut-Orbital       | Die besondere Form des dz²-Orbitals (Hantel mit Donut) erklären      |
| Kristallfeldtheorie | Die Grundlagen der Kristallfeldaufspaltung verstehen                 |
| Übergangsmetalle    | Die Rolle der d-Orbitale in der Chemie der Übergangsmetalle erklären |

## Was sind d-Orbitale?

d-Orbitale treten ab der Hauptquantenzahl $n \geq 3$ auf. Es gibt **fünf d-Orbitale** pro Energieniveau, die maximal 10 Elektronen aufnehmen können. Sie haben alle zwei angulare Knotenebenen. Die Formen variieren zwischen **kleeblattartigen Vierkeulformen** (clover) und einer **Hantel-mit-Donut-Form** (dz²).

Die Bezeichnung "d" stammt von "diffuse" (diffuse series in der Spektroskopie).

## Die fünf d-Orbitale

### dxy, dxz und dyz - Die kleeblattförmigen Orbitale

Diese drei Orbitale haben vier Keulen, die zwischen den Achsen liegen:

- **dxy:** Vier Keulen in der xy-Ebene, zwischen x- und y-Achse
- **dxz:** Vier Keulen in der xz-Ebene, zwischen x- und z-Achse
- **dyz:** Vier Keulen in der yz-Ebene, zwischen y- und z-Achse

Jedes dieser Orbitale hat zwei Knotenebenen, die entlang der Koordinatenachsen verlaufen.

### dx²−y² - Das achsenorientierte Orbital

Das **dx²−y²-Orbital** hat ebenfalls vier Keulen, diese liegen jedoch **entlang der x- und y-Achsen** (nicht zwischen ihnen). Die Knotenebenen verlaufen in einem 45°-Winkel zu den Achsen.

### dz² - Das Donut-Orbital

Das **dz²-Orbital** hat eine einzigartige Form:

- Zwei Keulen entlang der **z-Achse** (ähnlich einem p-Orbital)
- Ein **Donut-förmiger Ring** (Torus) in der Äquatorialebene (xy-Ebene)

Obwohl es anders aussieht, hat auch dz² zwei angulare Knotenebenen.

## Kristallfeldtheorie (Grundlagen)

In **oktaedrischen Komplexen** (Metallion umgeben von sechs Liganden) spalten die d-Orbitale energetisch auf:

| Orbitalgruppe       | Energieniveau              | Orientierung        |
| ------------------- | -------------------------- | ------------------- |
| dx²−y², dz² (eg)    | Höher (stärkere Abstoßung) | Entlang der Achsen  |
| dxy, dxz, dyz (t2g) | Niedriger                  | Zwischen den Achsen |

Die Aufspaltung wird als **Kristallfeldaufspaltung** ($\Delta_0$) bezeichnet und bestimmt die Farbe und magnetischen Eigenschaften von Übergangsmetallkomplexen.

## Bedeutung der d-Orbitale

- **Übergangsmetalle:** Typische Elemente mit d-Orbitalen (Sc bis Zn, sowie ihre schwereren Homologen)
- **Farbigkeit:** d-d-Übergänge führen zu charakteristischen Farben vieler Metallkomplexe
- **Katalyse:** Viele Übergangsmetallkatalysatoren nutzen die flexible Elektronenkonfiguration der d-Orbitale
- **Magnetismus:** Ungepaarte Elektronen in d-Orbitalen führen zu paramagnetischen Eigenschaften

## Interaktive 3D-Ansicht: d-Orbitale

Wähle im Dropdown-Menü zwischen dxy, dxz, dyz, dx²−y² und dz². Aktiviere die Phasendarstellung, um die alternierenden Vorzeichen der Keulen zu sehen.

<div id="orbital-viewer-container" style="width:100%;height:500px;border:1px solid #ddd;border-radius:8px;"></div>

## Verständnisfragen

1. Warum hat das dz²-Orbital eine andere Form als die anderen d-Orbitale?
2. Wie beeinflusst die Kristallfeldaufspaltung die Farbe von Übergangsmetallkomplexen?
3. Welche d-Orbitale zeigen in einem oktaedrischen Feld die stärkste Abstoßung mit den Liganden?

## Weiterführende Themen

- [s-Orbitale - Kugelförmige Aufenthaltsräume](/orbitalansichten/s-orbital/)
- [p-Orbitale - Hantelförmige Aufenthaltsräume](/orbitalansichten/p-orbital/)
- [Hybridisierung von Orbitalen](/orbitalansichten/hybridisierung/)
- [Periodensystem der Elemente 3D](/perioden-system-der-elemente/)

<script type="importmap">
{
  "imports": {
    "three": "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js",
    "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/"
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
      select.value = '3dz2';
      select.dispatchEvent(new Event('change'));
      clearInterval(checkSelect);
    }
  }, 100);
  window.__orbitalCleanup = cleanup;
}
</script>
