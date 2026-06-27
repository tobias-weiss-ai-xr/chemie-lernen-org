# Spec: 3d-visualizations

**Capability:** 3D and interactive visualizations for chemie-lernen.org
**Owners:** Sisyphus
**Status:** Active — main spec

---

## Purpose

chemie-lernen.org uses 3D and interactive visualizations to help
German secondary-school students (Klasse 8-13) understand abstract
chemistry concepts. These include a 3D molecule viewer, interactive
periodic table, orbital visualizations, and graph-based knowledge
networks. Visualizations make microscopic and theoretical concepts
tangible through spatial representation.

## Requirements

### REQ-3DV-1: Molecule Studio

`molekuel-studio.js` provides a 3D molecule viewer:

- Three.js-based 3D rendering of molecular structures
- Load molecules from SMILES strings or pre-defined structures
- Rotate, pan, and zoom with mouse/touch controls
- Ball-and-stick and space-filling display modes
- Atom labels on hover
- Bond angle and distance measurements

### REQ-3DV-2: Periodic Table

`perioden-system-der-elemente.js` renders an interactive periodic table:

- 118 elements arranged in standard layout
- Color-coded by category (metals, non-metals, noble gases, etc.)
- Click on element to navigate to its entity page
- Hover shows element symbol, name, atomic number, mass
- Filter by category, block, or period
- Responsive layout (scrollable on mobile)

### REQ-3DV-3: Molecular orbital visualizer

`molekuelorbitale` (in visualization/) renders molecular orbitals:

- 3D orbital shapes for s, p, d, f orbitals
- Electron density visualization
- Phase visualization (positive/negative lobes)
- Energy level diagrams

### REQ-3DV-4: D3 ego-graph

`visualization/d3-ego-graph.js` renders the entity knowledge graph:

- Force-directed D3.js graph visualization
- Ego-graph mode: selected entity at center with related entities
- Full-graph mode at `/wissennetz/` showing all entities
- Click-to-navigate between related entities
- Screen-reader fallback with entity list
- `prefers-reduced-motion` disables animations

### REQ-3DV-5: Chart manager

`visualization/chart-manager.js` provides reusable chart components:

- Reaction energy diagrams
- Titration curves
- Periodic trends charts
- Concentration vs. time plots
- Common interface for Chart.js integration

### REQ-3DV-6: Periodic trends visualizer

`visualization/periodic-table-viz.js` shows periodic trends:

- Atomic radius trend across periods
- Ionization energy patterns
- Electronegativity visualization
- Electron affinity trends
- Color gradient overlays on periodic table

### REQ-3DV-7: Reaction pathway viewer

`visualization/reaction-pathway.js` visualizes chemical reactions:

- Step-by-step reaction mechanism display
- Energy profile diagrams
- Transition state visualization
- Animation of electron movement

### REQ-3DV-8: Three.js integration

Visualizations use Three.js for 3D rendering:

- `myhugoapp/static/js/three/three.core.js` — core Three.js library
- `myhugoapp/static/js/three/TrackballControls.js` — camera controls
- `myhugoapp/static/js/addons/CSS3DRenderer.js` — CSS 3D support
- ES Module format (`sourceType: 'module'`)
- Lazy-loaded via `<script type="module">` tags

### REQ-3DV-9: Performance

- Canvas rendering with device pixel ratio capping (`max: 2`)
- Level-of-detail reduction for complex molecules
- Frame rate throttling on low-power devices
- Texture size optimization
- WebGL context loss handling with automatic recovery

### REQ-3DV-10: Accessibility

- All visualizations have text fallback descriptions
- `prefers-reduced-motion` media query disables rotation/animations
- Keyboard navigation in periodic table (arrow keys, Enter)
- Screen reader announces element names and properties
- SVG-based static fallback for critical visualizations

### REQ-3DV-11: WebXR (experimental)

- Augmented reality mode for molecule viewing (device-permitting)
- WebXR session request with `immersive-ar` mode
- Fallback to standard 3D viewer when WebXR unavailable
- Feature detection before showing AR button

### REQ-3DV-12: SSR fallback

- Build-time rendering populates static content
- Visualizations enhance, not replace, the HTML content
- `<noscript>` fallback shows description and links
- SEO metadata is server-rendered for all viz pages

### REQ-3DV-13: Testing

- Jest unit tests for data processing and math utilities
- Visual regression tests for rendering consistency
- WebGL availability detection tests
- Accessibility tests for screen reader support

## Scenarios

### S-3DV-1: Student explores molecule

**Given** a student visits a molecule entity page (e.g., `/entity/koffein/`)
**When** the page loads
**Then** Molecule Studio renders caffeine in 3D with ball-and-stick model
**When** the student drags the molecule
**Then** it rotates smoothly in 3D space
**When** they hover over an atom
**Then** the element symbol and name are displayed
**When** `prefers-reduced-motion` is set
**Then** auto-rotation is disabled

### S-3DV-2: Periodic table navigation

**Given** a student visits `/perioden-system-der-elemente/`
**Then** the full periodic table is rendered with color-coded categories
**When** they click "Sauerstoff" (Oxygen)
**Then** they are navigated to `/entity/sauerstoff/`
**When** they filter by "Edelgase"
**Then** only noble gas elements are highlighted

### S-3DV-3: Wissenetz graph exploration

**Given** a student visits `/wissennetz/`
**Then** the full knowledge graph is rendered as a D3 force-directed graph
**When** they click on a node
**Then** the graph re-centers on that node (ego-graph mode)
**And** related entities are shown with connection labels
**When** a screen reader is active
**Then** a navigable list of entity names is provided alongside the graph

### S-3DV-4: AR molecule viewer

**Given** a student with a WebXR-capable device
**When** they click "In AR anzeigen" on a molecule page
**Then** the camera opens in AR mode
**And** the molecule appears anchored in the real world
**And** they can walk around the molecule
**When** WebXR is unavailable
**Then** the AR button is hidden and standard 3D view is used

### S-3DV-5: Periodic trends comparison

**Given** a student visits the periodic trends visualizer
**When** they select "Atomradius" as the property to display
**Then** the periodic table shows a color gradient from large (bottom-left)
to small (top-right)
**When** they hover over Francium (Fr)
**Then** the atomic radius value is displayed in picometers

## References

- `myhugoapp/static/js/molekuel-studio.js` — 3D molecule viewer
- `myhugoapp/static/js/perioden-system-der-elemente.js` — periodic table
- `myhugoapp/static/js/visualization/` — visualization modules
- `myhugoapp/static/js/visualization/d3-ego-graph.js` — knowledge graph viz
- `myhugoapp/static/js/visualization/chart-manager.js` — chart components
- `myhugoapp/static/js/visualization/periodic-table-viz.js` — trends viz
- `myhugoapp/static/js/visualization/reaction-pathway.js` — reaction viz
- `myhugoapp/static/js/three/` — Three.js core and controls
- `myhugoapp/static/js/addons/` — Three.js addons
- `myhugoapp/layouts/` — visualization page templates
