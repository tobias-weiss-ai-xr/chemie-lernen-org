---
title: 's-Orbitale - Kugelförmige Aufenthaltsräume'
last_reviewed: 2026-08-06
layout: 'orbitalansichten'
description: 'Lerne die kugelförmigen s-Orbitale kennen - die einfachste Orbitalform'
orbital: '1s'
weight: 10
---

## Lernziele

| Lernziel         | Beschreibung                                                       |
| ---------------- | ------------------------------------------------------------------ |
| Form beschreiben | Die kugelförmige Gestalt der s-Orbitale erklären können            |
| Knotenebenen     | Den Unterschied zwischen radialen und angularen Knoten verstehen   |
| Hauptquantenzahl | Den Zusammenhang zwischen n und der Größe des Orbitals erklären    |
| Aufbauprinzip    | Die Besetzung der s-Orbitale nach dem Aufbauprinzip nachvollziehen |

## Was sind s-Orbitale?

s-Orbitale sind die **einfachste Form** von Atomorbitalen. Sie besitzen eine **kugelförmige Geometrie** ohne angulare Knotenebenen. Das bedeutet, dass die Aufenthaltswahrscheinlichkeit des Elektrons in alle Richtungen gleich ist — die Elektronenwolke ist symmetrisch um den Atomkern verteilt.

Die Bezeichnung "s" steht für "sharp" (scharf) und stammt aus der Spektroskopie, wo s-Orbitale zu scharfen Spektrallinien führen.

## Die verschiedenen s-Orbitale

### 1s-Orbital

Das **1s-Orbital** ist das energetisch günstigste Orbital und wird als erstes mit Elektronen besetzt. Es hat:

- **Keine Knotenebene** (weder radial noch angular)
- Die höchste Aufenthaltswahrscheinlichkeit direkt am Kern
- Exponentiell abfallende Elektronendichte mit zunehmender Entfernung vom Kern

### 2s-Orbital

Das **2s-Orbital** ist größer als das 1s-Orbital und besitzt eine **radiale Knotenebene** — eine Kugelfläche, auf der die Aufenthaltswahrscheinlichkeit des Elektrons null ist. Innerhalb dieser Knotenkugel gibt es eine Region hoher Aufenthaltswahrscheinlichkeit nahe am Kern (der "Durchdringungsbereich").

### 3s-Orbital und höhere s-Orbitale

Mit steigender Hauptquantenzahl $n$ nimmt die Größe der s-Orbitale zu. Die Anzahl der radialen Knoten beträgt $n-1$. Das 3s-Orbital hat zwei radiale Knotenflächen.

## Vergleich der s-Orbitale

| Orbital | Radiale Knoten | Relative Größe           | Besetzung    |
| ------- | -------------- | ------------------------ | ------------ |
| 1s      | 0              | Klein (Radius ~0,053 nm) | 2 Elektronen |
| 2s      | 1              | Mittel                   | 2 Elektronen |
| 3s      | 2              | Groß                     | 2 Elektronen |

## Das Aufbauprinzip

Nach dem **Aufbauprinzip** (auch Hundsche Regel und Pauli-Prinzip) werden die Orbitale in der Reihenfolge ihrer Energie besetzt:

$$1s \rightarrow 2s \rightarrow 2p \rightarrow 3s \rightarrow 3p \rightarrow 4s \rightarrow 3d \rightarrow 4p \rightarrow \dots$$

Jedes s-Orbital kann maximal **2 Elektronen** aufnehmen (mit entgegengesetztem Spin).

## Interaktive 3D-Ansicht: s-Orbitale

Erkunde die kugelförmige Struktur der s-Orbitale in der interaktiven 3D-Visualisierung. Wähle im Dropdown-Menü zwischen 1s, 2s oder anderen Orbitalen.

<div id="orbital-viewer-container" style="width:100%;height:500px;border:1px solid #ddd;border-radius:8px;"></div>

## Verständnisfragen

1. Warum haben s-Orbitale keine angularen Knotenebenen?
2. Wie viele radiale Knoten hat ein 4s-Orbital?
3. Welche maximale Elektronenzahl haben alle s-Orbitale gemeinsam?

## Weiterführende Themen

- [p-Orbitale - Hantelförmige Aufenthaltsräume](/orbitalansichten/p-orbital/)
- [d-Orbitale - Kleeblatt- und Donutformen](/orbitalansichten/d-orbital/)
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
  const orbital = container.parentElement.dataset.orbital || container.dataset.orbital || '1s';
  const cleanup = initOrbitalViewer('orbital-viewer-container');
  const checkSelect = setInterval(() => {
    const select = document.getElementById('ov-orbital-select');
    if (select) {
      select.value = '1s';
      select.dispatchEvent(new Event('change'));
      clearInterval(checkSelect);
    }
  }, 100);
  window.__orbitalCleanup = cleanup;
}
</script>
