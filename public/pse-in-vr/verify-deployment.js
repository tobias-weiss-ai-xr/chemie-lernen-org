const https = require('https');

https.get('https://tobias-weiss.org/hello-webxr/', (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('=== HTML Verification ===');
    console.log('Browser help overlay present:', data.includes('browser-help'));
    console.log('Browser navigation instructions present:', data.includes('Browser Navigation'));
    console.log('');

    // Now fetch and analyze the bundle
    https.get('https://tobias-weiss.org/hello-webxr/bundle.js', (res) => {
      let bundle = '';

      res.on('data', (chunk) => {
        bundle += chunk;
      });

      res.on('end', () => {
        console.log('=== Bundle Verification ===');
        console.log('browserControls present:', bundle.includes('browserControls'));
        console.log('moveForward present:', bundle.includes('moveForward'));
        console.log('moveBackward present:', bundle.includes('moveBackward'));
        console.log('moveLeft present:', bundle.includes('moveLeft'));
        console.log('moveRight present:', bundle.includes('moveRight'));
        console.log('translateZ present:', bundle.includes('translateZ'));
        console.log('translateX present:', bundle.includes('translateX'));
        console.log('isLocked present:', bundle.includes('isLocked'));
        console.log('PointerLockControls present:', bundle.includes('PointerLockControls'));
        console.log('vrMode check present:', bundle.includes('context.vrMode'));
        console.log('');

        // Check for the structure of browserControls
        const browserControlsMatch = bundle.match(/context\.browserControls\s*=/);
        if (browserControlsMatch) {
          console.log('✅ browserControls assignment found');
        } else {
          console.log('❌ browserControls assignment NOT found');
        }

        // Check for the click handler
        const clickHandlerMatch = bundle.match(/addEventListener.*click.*isLocked/);
        if (clickHandlerMatch) {
          console.log('✅ Click handler found');
        } else {
          console.log('❌ Click handler NOT found');
        }

        // Check for keyboard handlers
        const keydownMatch = bundle.match(/addEventListener.*keydown/);
        if (keydownMatch) {
          console.log('✅ Keydown handler found');
        } else {
          console.log('❌ Keydown handler NOT found');
        }

        // Check for movement in animate loop
        const animateMovement = bundle.match(/!context\.vrMode.*browserControls/);
        if (animateMovement) {
          console.log('✅ Movement in animate loop found');
        } else {
          console.log('❌ Movement in animate loop NOT found');
        }
      });
    });
  });
}).on('error', (err) => {
  console.error('Error:', err.message);
});
