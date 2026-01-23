# Screenshots Guide for PSE in VR

This document explains how to create and add screenshots for the PSE in VR feature.

## Required Screenshots

Create the following screenshots to showcase the VR experience:

### 1. Hero Screenshot

- **File:** `vr-hero-screenshot.png`
- **Content:** Full VR environment with Periodic Table in 3D
- **Resolution:** 1920x1080px (minimum)
- **Style:** High-quality, showing the immersive 3D space

### 2. Desktop Mode

- **File:** `vr-desktop-mode.png`
- **Content:** Desktop browser view with mouse controls overlay
- **Resolution:** 1920x1080px
- **Style:** Showing browser-based interaction

### 3. VR Headset View

- **File:** `vr-headset-view.png`
- **Content:** First-person view from VR headset perspective
- **Resolution:** 1920x1080px
- **Style:** Showing VR controller interaction

### 4. Element Interaction

- **File:** `vr-element-detail.png`
- **Content:** Close-up of element information panel
- **Resolution:** 1920x1080px
- **Style:** Detailed view with atomic structure

### 5. Multiplayer Learning

- **File:** `vr-multiplayer.png`
- **Content:** Multiple users in shared VR space
- **Resolution:** 1920x1080px
- **Style:** Collaborative learning scenario

## How to Create Screenshots

### Method 1: Using Browser DevTools

1. Open the VR experience in Chrome/Edge
2. Press F12 for DevTools
3. Press Ctrl+Shift+P (Cmd+Shift+P on Mac)
4. Type "screenshot" and select "Capture full size screenshot"

### Method 2: Using VR Headset Recording

1. Enable recording on your VR headset
2. Use the VR experience
3. Extract frames from the recording

### Method 3: Using Three.js Screenshot

```javascript
// In browser console:
renderer.domElement.toDataURL('image/png');
```

## Adding Screenshots to Content

### In Markdown Files

```markdown
![VR Experience](/screenshots/vr/vr-hero-screenshot.png)
_Abbildung 1: Immersive VR-Erfahrung_
```

### In HTML Files

```html
<img src="/screenshots/vr/vr-hero-screenshot.png" alt="VR Experience" class="img-responsive" />
```

## Optimization

Before adding screenshots:

1. Compress images using TinyPNG or similar
2. Ensure proper file names (lowercase, hyphens)
3. Add alt text for accessibility
4. Consider responsive images (WebP format)

## Current Status

To add actual screenshots:

1. Capture the VR experience using the methods above
2. Save to `/myhugoapp/static/screenshots/vr/`
3. Update the PSE in VR page to include screenshots
4. Add captions and alt text

## Example Implementation

```markdown
## Screenshots

### Immersive 3D-Periodensystem

![VR 3D Periodensystem](/screenshots/vr/vr-hero-screenshot.png)

Erleben Sie das Periodensystem in einem immersiven 3D-Raum mit allen 118 Elementen.

### Desktop-Steuerung

![Desktop Mode](/screenshots/vr/vr-desktop-mode.png)

Nutzen Sie Ihre Maus und Tastatur zur Navigation - kein VR-Headset erforderlich.

### Element-Interaktion

![Element Details](/screenshots/vr/vr-element-detail.png)

Rufen Sie detaillierte Informationen zu jedem Element durch Interaktion ab.
```

## Automated Screenshot Generation

You can use Playwright to automatically capture screenshots:

```javascript
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:1313/pages/pse-in-vr/');
  await page.screenshot({
    path: 'vr-hero-screenshot.png',
    fullPage: true,
  });
  await browser.close();
})();
```

## Next Steps

1. Capture actual screenshots from the VR experience
2. Add them to the `/myhugoapp/static/screenshots/vr/` directory
3. Update the PSE in VR page content to include screenshots
4. Test image loading and responsiveness
