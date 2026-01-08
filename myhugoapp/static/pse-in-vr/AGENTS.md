# PROJECT KNOWLEDGE BASE - VR Systems

**Generated:** 2026-01-07 23:44:10
**Commit:** $(git rev-parse --short HEAD)
**Branch:** $(git rev-parse --abbrev-ref HEAD)

## OVERVIEW

Virtual Reality systems for chemistry education using Three.js. Provides immersive 3D experiences for periodic table exploration and molecular visualization.

## STRUCTURE

```
myhugoapp/static/pse-in-vr/
├── src/                  # Source code
│   ├── systems/          # Core systems
│   │   ├── AreaCheckerSystem.js    # Area checking
│   │   ├── ControllersSystem.js    # Input controllers
│   │   ├── DebugHelperSystem.js    # Debugging tools
│   │   ├── HierarchySystem.js      # Object hierarchy
│   │   ├── TransformSystem.js      # Transform management
│   │   ├── SDFTextSystem.js        # Text rendering
│   │   └── BillboardSystem.js      # Billboard rendering
│   ├── lib/               # Utility libraries
│   │   ├── VRButton.js    # VR controls
│   │   ├── utils.js       # Helper functions
│   │   ├── EventDispatcher.js  # Event system
│   │   ├── shaders.js     # Shader programs
│   │   ├── RayControl.js  # Ray controls
│   │   └── Teleport.js    # Teleportation
│   └── rooms/            # VR room definitions
├── assets/               # Assets and resources
├── bundle.js             # Main bundle
├── 2.bundle.js           # Secondary bundle
└── verify-deployment.js   # Deployment verification
```

## WHERE TO LOOK

| Task                  | Location               | Notes                 |
| --------------------- | ---------------------- | --------------------- |
| **Core systems**      | src/systems/           | Main VR functionality |
| **VR controls**       | lib/VRButton.js        | Input and interaction |
| **Utility functions** | lib/utils.js           | Helper utilities      |
| **Event system**      | lib/EventDispatcher.js | Event handling        |
| **Shader programs**   | lib/shaders.js         | Custom shaders        |
| **Ray controls**      | lib/RayControl.js      | Ray-based interaction |
| **Teleportation**     | lib/Teleport.js        | Movement system       |
| **VR rooms**          | src/rooms/             | Scene definitions     |

## CONVENTIONS

- **Component-based architecture**: Modular system design
- **Event-driven**: Custom event system for communication
- **Shader-based rendering**: Custom WebGL shaders
- **Performance optimization**: Efficient 3D rendering
- **Accessibility**: VR controller support

## ANTI-PATTERNS

- Avoid global Three.js modifications
- Never skip frame rate optimization
- Always validate user input in VR
- Never hard-code VR controller mappings
- Avoid memory leaks in 3D objects

## UNIQUE STYLES

- **Immersive 3D**: Full VR experience with controllers
- **Custom shaders**: Optimized rendering pipelines
- **Ray-based interaction**: Point-and-click in 3D space
- **Teleportation system**: Movement in VR space
- **Billboard rendering**: Always-facing text and objects

## COMMANDS

```bash
# Build VR bundles
# (handled by build process)

# Test VR functionality
# (integrated in E2E tests)
```

## NOTES

- VR systems use Three.js for 3D rendering
- Custom systems manage object hierarchy and transforms
- Ray controls enable precise interaction
- Teleportation provides movement in VR space
- Performance-critical for smooth 60fps experience
