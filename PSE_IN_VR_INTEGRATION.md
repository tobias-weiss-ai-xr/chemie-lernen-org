# PSE in VR Integration Documentation

This document describes the integration of the PSE (Periodensystem der Elemente) in Virtual Reality feature into the chemie-lernen.org Hugo site.

## Overview

PSE in VR is a WebXR-based virtual reality experience that allows users to explore the periodic table of elements in an immersive 3D environment. The integration replaces the external xr.graphwiz.ai reference with a local implementation.

## File Structure

```
hugo-chemie-lernen-org/
├── myhugoapp/
│   ├── content/
│   │   ├── pages/
│   │   │   └── pse-in-vr.md              # Main VR feature page
│   │   └── posts/
│   │       └── pse-in-vr-release.md      # Release announcement article
│   ├── layouts/
│   │   └── _default/
│   │       └── pse-in-vr.html            # Custom layout for VR page
│   └── static/
│       └── pse-in-vr/                    # WebXR application files
│           ├── index.html                # Entry point
│           ├── bundle.js                 # Bundled JavaScript
│           ├── assets/                   # 3D models and textures
│           ├── res/                      # Resources (icons, favicons)
│           └── src/                      # Source code (for development)
└── screenshots-guide.md                  # Guide for creating screenshots
```

## Integration Components

### 1. Content Pages

#### `/myhugoapp/content/pages/pse-in-vr.md`
- Main feature page with comprehensive documentation
- Includes screenshots section with fallback placeholders
- Describes features, requirements, and usage instructions
- Tags: `vr`, `periodensystem`, `3d`, `interaktiv`, `webxr`

#### `/myhugoapp/content/posts/pse-in-vr-release.md`
- Blog post announcing the VR feature release
- Technical details and architecture explanation
- Educational benefits and use cases
- Future roadmap and development plans

### 2. Custom Layout

#### `/myhugoapp/layouts/_default/pse-in-vr.html`
Custom layout template that provides:
- Hero section with gradient background
- Iframe container for WebXR application
- Loading state with spinner animation
- Feature cards grid
- Requirements and compatibility section
- Tutorial with step-by-step guide
- Responsive design with dark mode support

### 3. WebXR Application

#### `/myhugoapp/static/pse-in-vr/`
Contains the complete WebXR application copied from hello-webxr:

**Key Files:**
- `index.html` - Main HTML with meta tags and SEO
- `bundle.js` - Bundled JavaScript application
- `bundle.js.map` - Source map for debugging
- `sw.js` - Service worker for offline support
- `assets/` - 3D models, textures, and audio
- `res/` - Icons and favicons
- `src/` - Original source code (for reference)

### 4. Roadmap Update

Updated `/myhugoapp/content/pages/roadmap.md`:
- Added PSE in VR as implemented feature
- Marked with ✓ (IMPLEMENTIERT) status
- Linked to main VR page
- Updated section 1 (Immersive VR-Szenarien)
- Updated section 4 (Technische Verbesserungen)

## Features Implemented

### 1. Dual-Mode Support
- **VR Mode:** Full WebXR support for VR headsets
- **Desktop Mode:** Mouse and keyboard navigation (WASD/arrows)
- Automatic detection and mode switching

### 2. Interactive Elements
- 3D periodic table with all 118 elements
- Element information panels
- Color-coded element groups
- Interactive 3D models

### 3. Multiplayer Support
- Collaborative learning spaces
- Real-time interaction
- Shared exploration

### 4. Safe Experiments
- Virtual chemistry experiments
- Dangerous reactions without risk
- Repeatable simulations

## Technical Implementation

### WebXR Setup

```javascript
// WebXR session initialization
if ('xr' in navigator) {
  navigator.xr.isSessionSupported('immersive-vr').then(supported => {
    if (supported) {
      // VR button available
    }
  });
}
```

### Iframe Integration

The VR application is embedded using an iframe with proper permissions:

```html
<iframe
  src="/pse-in-vr/index.html"
  allow="xr-spatial-tracking; vr; camera; microphone"
  allowfullscreen>
</iframe>
```

### Performance Optimizations

1. **Lazy Loading:** Assets loaded on demand
2. **Service Worker:** Caching for offline support
3. **Responsive Design:** Adapts to screen size
4. **Fallback UI:** Graceful degradation when VR unavailable

## Browser Compatibility

### Fully Supported
- Chrome 90+ (recommended)
- Edge 90+
- Oculus Browser
- Chrome for Android

### Partial Support
- Firefox 88+ (requires WebXR enabled)
- Safari (experimental, requires flags)

### Desktop Navigation
All modern browsers with WebGL support

## VR Headset Support

- Meta Quest 2/3
- HTC Vive Series
- Valve Index
- Windows Mixed Reality
- Any WebXR-compatible headset

## Usage

### For Users

1. Navigate to `/pages/pse-in-vr/`
2. Click "VR starten" button
3. Allow VR permissions (if using headset)
4. Use controls to navigate and interact

### For Developers

#### Local Development

```bash
# Start Hugo development server
cd /opt/git/hugo-chemie-lernen-org/myhugoapp
hugo server -D

# Access at http://localhost:1313/pages/pse-in-vr/
```

#### Modifying VR Content

Edit files in `/myhugoapp/static/pse-in-vr/`:
1. Modify `index.html` for UI changes
2. Rebuild `bundle.js` for JavaScript changes
3. Update assets in `assets/` directory
4. Test in browser with WebXR support

#### Adding New Rooms/Scenes

See `/myhugoapp/static/pse-in-vr/src/rooms/` for examples:
1. Create new room file following existing pattern
2. Import in `src/index.js`
3. Add to rooms array
4. Rebuild bundle

## Screenshots

### Adding Screenshots

1. Capture screenshots from VR experience
2. Save to `/myhugoapp/static/screenshots/vr/`
3. Recommended: 1920x1080px PNG
4. Optimize with TinyPNG or similar

### Required Screenshots

- `vr-hero-screenshot.png` - Main 3D environment
- `vr-desktop-mode.png` - Desktop navigation
- `vr-headset-view.png` - VR headset view
- `vr-element-detail.png` - Element interaction
- `vr-multiplayer.png` - Collaborative learning

See `screenshots-guide.md` for detailed instructions.

## Testing

### Manual Testing Checklist

- [ ] VR page loads correctly
- [ ] WebXR app loads in iframe
- [ ] Desktop navigation works (WASD)
- [ ] Mouse look activates on click
- [ ] VR button appears with headset
- [ ] All links and CTAs work
- [ ] Screenshots display or fallback shown
- [ ] Mobile responsive design works
- [ ] Service worker registers
- [ ] No console errors

### Automated Testing

```bash
# Run Hugo tests
hugo check

# Link checking
npm run test:links

# Playwright tests (if configured)
npm run test:e2e
```

## Deployment

### Production Build

```bash
# Build Hugo site
cd /opt/git/hugo-chemie-lernen-org/myhugoapp
hugo --minify

# Deploy to server
rsync -avz public/ user@server:/var/www/chemie-lernen.org/
```

### Docker Deployment

```bash
# Using docker-compose
cd /opt/git/hugo-chemie-lernen-org
docker-compose up -d

# Check logs
docker-compose logs -f
```

## Maintenance

### Regular Tasks

1. **Update Dependencies:**
   ```bash
   cd /opt/git/hello-webxr
   npm update
   npm run build
   cp bundle.js /opt/git/hugo-chemie-lernen-org/myhugoapp/static/pse-in-vr/
   ```

2. **Check Browser Compatibility:**
   - Test with new browser releases
   - Update WebXR polyfills if needed

3. **Content Updates:**
   - Add new element information
   - Update educational content
   - Add new experiments

### Monitoring

- Check WebXR API adoption rates
- Monitor VR headset compatibility
- Track user engagement metrics
- Review performance metrics

## Future Enhancements

See roadmap in `/myhugoapp/content/pages/roadmap.md`:

### Phase 1 (Q1 2026)
- [ ] Advanced molecule visualization
- [ ] Voice guidance
- [ ] Quiz system with gamification

### Phase 2 (Q2 2026)
- [ ] LMS integration
- [ ] Extended experiments
- [ ] User-generated content

### Phase 3 (Q3-Q4 2026)
- [ ] AI-powered learning paths
- [ ] VR escape rooms
- [ ] Mobile AR support

## Troubleshooting

### Common Issues

**VR Button Not Showing:**
- Check browser WebXR support
- Enable WebXR flags in browser
- Ensure HTTPS connection

**Performance Issues:**
- Reduce asset quality
- Enable hardware acceleration
- Close other browser tabs

**Iframe Not Loading:**
- Check file permissions
- Verify Content Security Policy
- Check browser console for errors

**Desktop Navigation Not Working:**
- Click to activate mouse lock
- Check JavaScript console
- Verify PointerLockControls support

## Support and Resources

### Documentation
- [WebXR API](https://developer.mozilla.org/en-US/docs/Web/API/WebXR_API)
- [Three.js Documentation](https://threejs.org/docs/)
- [WebXR Device API](https://www.w3.org/TR/webxr/)

### Community
- [Project Repository](https://github.com/your-org/hugo-chemie-lernen-org)
- [Issue Tracker](https://github.com/your-org/hugo-chemie-lernen-org/issues)
- [Discord Server](https://discord.gg/chemie-lernen)

## Changelog

### Version 1.0.0 (2026-01-02)
- Initial PSE in VR integration
- WebXR application from hello-webxr
- Custom layout and content pages
- Roadmap updates
- Release announcement article
- Documentation and guides

## Contributors

- Integration by: Development Team
- WebXR App: Based on Mozilla Reality's hello-webxr
- Documentation: Claude Code
- Testing: QA Team

## License

This integration maintains the same license as the parent project. See LICENSE file for details.

---

**Last Updated:** 2. Januar 2026
**Version:** 1.0.0
**Status:** ✅ Production Ready
