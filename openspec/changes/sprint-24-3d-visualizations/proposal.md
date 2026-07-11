## Why

Chemistry understanding depends heavily on visual-spatial reasoning — electron orbitals, periodic trends, molecular geometry — yet the platform has only static text and images. 3D visualizations already exist (Three.js-based perioden-system, molekuel-studio) but are unlinked and not integrated into the curriculum. This sprint builds a cohesive 3D visualization suite: interactive periodic table with property color modes, orbital viewer, element comparison tool, and a REST API for element data.

## What Changes

- Integrate existing Three.js `perioden-system-der-elemente.js` with property color modes (electronegativity, atomic radius, ionization energy, electron config)
- Build orbital viewer: 3D visualization of s, p, d, f orbitals with rotation, zoom, and electron count animation
- Build element comparison tool side-by-side: select 2-4 elements, compare properties, visualize atomic radius difference
- Create `GET /api/elements` REST endpoint returning IUPAC element data JSON
- Link 3D visualizations into curriculum pages (periodensystem themenbereich, klassenstufen)
- Add orbital lesson pages with embedded viewer (s-orbitals, p-orbitals, d-orbitals, hybridisation)

## Capabilities

### New Capabilities

- `3d-visualizations/spec.md` — Three.js-based interactive chemistry visualizations
- `elements-api/spec.md` — RESTful element data API

### Modified Capabilities

- `calculators` / `content` — embedding 3D views in curriculum pages

## Impact

- **Frontend**: New visualization pages; Orbital viewer Three.js scene; Element comparison UI; Content page embeds
- **Backend**: `GET /api/elements` endpoint (static data from JSON, no new DB dependency)
- **Dependencies**: Three.js already bundled; element data from IUPAC JSON
