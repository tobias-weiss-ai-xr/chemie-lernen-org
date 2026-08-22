# Sprint 9: 3D Visualizations

**Goal**: Enhance the molecular visualization and 3D chemistry experience with new features, better performance, and augmented reality.

## Scope

### Molecule Viewer Improvements

- Extend `perioden-system-der-elemente.js` and `molekuel-studio.js`:
  - Orbit display (s, p, d visualization around atoms)
  - Bond angle measurement tool
  - Atom labeling (element symbol + position)
  - Download as .glb/.stl for 3D printing
- Pre-defined molecule library: load 10 common molecules (H₂O, CO₂, CH₄, C₆H₁₂O₆, etc.)
- Performance: switch from CSS3DRenderer to WebGLRenderer for complex molecules
- Mobile: touch gesture support (pinch zoom, rotate)

### Interactive Periodic Table

- Enhance existing periodic table:
  - Electron configuration overlay (click element → show orbital diagram)
  - Isotope explorer (stability chart, half-life)
  - Property trends visualization (electronegativity gradient, atomic radius)
  - Comparison mode (select 2 elements side-by-side)

### AR Chemistry (Experimental)

- WebXR AR mode for molecule viewer
- Place molecule on real surface via camera
- Rotate/zoom with natural gestures
- Fallback: non-AR devices get standard 3D view

### Performance & Bundling

- Lazy-load Three.js modules (only load when viewer is needed)
- Bundle size tracking for visualization JS
- GPU detection: fallback to 2D if WebGL unavailable
- Memory management: dispose Three.js objects on navigation

## Success Criteria

- Molecule viewer loads under 3s (first paint)
- 60fps rotation on mid-range devices
- 10 pre-defined molecules loadable
- AR mode works on WebXR-capable devices
- All existing visualization tests pass
