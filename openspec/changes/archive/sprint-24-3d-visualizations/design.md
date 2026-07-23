## 3D Visualizations Architecture

### Interactive Periodic Table (enhancing existing `perioden-system-der-elemente.js`)

```
Color modes (toggle via buttons above table):
  1. Standard (default element colors)
  2. Elektronegativität (Pauling scale gradient: blue=low→red=high)
  3. Atomradius (pm, gradient: small→large)
  4. Ionisierungsenergie (eV, gradient)
  5. Elektronenkonfiguration (group by block: s/p/d/f)
```

### Orbital Viewer

New Three.js scene at `/orbitalansichten/`:

| Orbital              | Shape        | Nodes | Controls                              |
| -------------------- | ------------ | ----- | ------------------------------------- |
| 1s                   | Sphere       | 0     | Rotate, zoom, electron density slider |
| 2p_x/y/z             | Dumbbell     | 1     | Rotate, zoom, toggle axes labels      |
| 3d_xy/xz/yz/z²/x²-y² | Clover/Donut | 2     | Rotate, zoom, phase toggle (±)        |
| 4f complex           | Multi-lobe   | 3     | Rotate, zoom                          |

Controls: OrbitControls (rotate/pan/zoom), orbital selector dropdown, electron count slider (animated filling).

```
Architecture:
  static/js/visualization/orbital-viewer/
    ├── orbital-viewer.js         — main Three.js scene setup
    ├── orbital-shapes.js         — shape geometry generators (parametric surfaces)
    ├── orbital-controls.js       — UI controls: orbital type, electron count, phase
    └── orbital-data.js           — orbital metadata (name, n, l, m, nodes, image)
```

### Element Comparison Tool

```
Layout (side-by-side cards, up to 4 elements):

  [ Element 1 ]    [ Element 2 ]    [ Element 3 ]    [ Element 4 ]

  Atomic radius:   ████████░░  80%   ████████░░  80%   ████░░░░░░  40%
  EN (Pauling):    ██████░░░░  60%   ████████░░  80%   ██████░░░░  60%
  IE (eV):         ████████░░  80%   ██████░░░░  60%   ██████░░░░  60%
  ...

  + Atomic radius visualization overlay (two spheres scaled to actual radii)
```

### Element Data API

```json
GET /api/elements
[
  {
    "symbol": "H",
    "name": "Wasserstoff",
    "nameEn": "Hydrogen",
    "atomicNumber": 1,
    "atomicMass": 1.008,
    "category": "nonmetal",
    "group": 1,
    "period": 1,
    "block": "s",
    "electronConfig": "1s¹",
    "electronegativity": 2.2,
    "atomicRadius": 53,
    "ionizationEnergy": 13.598,
    "density": 0.0000899,
    "meltingPoint": 14.01,
    "boilingPoint": 20.28,
    "isotopes": [
      {"mass": 1, "abundance": 99.985, "neutrons": 0},
      {"mass": 2, "abundance": 0.015, "neutrons": 1},
      {"mass": 3, "abundance": 0.0, "neutrons": 2, "unstable": true}
    ]
  },
  ...
]
```

### Content Integration

- `/themenbereiche/periodensystem/` — embed enhanced periodic table, link to element comparison
- `/klassenstufen/10/` — embed orbital viewer for electron configuration lesson
- New lesson pages: `/orbitalansichten/s-orbital/`, `/orbitalansichten/p-orbital/`, etc.
