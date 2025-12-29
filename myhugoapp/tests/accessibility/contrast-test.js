#!/usr/bin/env node

/**
 * Accessibility Test Suite for Chemie Lernen
 * Tests dark mode contrast ratios, panel visibility, and general accessibility
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ANSI color codes for output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Contrast ratio requirements (WCAG AA)
const MIN_CONTRAST_AA = 4.5;
const MIN_CONTRAST_AA_LARGE = 3.0;
const MIN_CONTRAST_AA_UI = 3.0;

// Light mode color palette for Molekülstudio page
const lightModeColors = {
  studioHeader: '#e8f5e9',  // light green background
  studioTitle: '#0a3d0a',   // dark green text
  studioText: '#666666',    // gray secondary text
};

// Dark mode color palette from dark-mode.css (greenish theme)
const darkModeColors = {
  bgPrimary: '#0a1a0f',
  bgSecondary: '#0d2a1a',
  bgTertiary: '#123d25',
  textPrimary: '#c8e6c9',
  textSecondary: '#81c784',
  textMuted: '#4caf50',
  accentColor: '#4caf50',
  accentHover: '#66bb6a',
  successColor: '#4caf50',
  warningColor: '#f59e0b',
  dangerColor: '#ef4444',
  borderColor: '#1b5e20',
  cardBg: '#0d2a1a',
  navbarBg: '#0a1a0f',
  studioHeader: '#1a3d2a',
  studioTitle: '#b2dfdb',
};

// Helper function to calculate relative luminance
function getLuminance(hexColor) {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16) / 255;
  const g = parseInt(hex.substr(2, 2), 16) / 255;
  const b = parseInt(hex.substr(4, 2), 16) / 255;

  const toLinear = (c) => {
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };

  const R = toLinear(r);
  const G = toLinear(g);
  const B = toLinear(b);

  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

// Helper function to calculate contrast ratio
function getContrastRatio(color1, color2) {
  const l1 = getLuminance(color1);
  const l2 = getLuminance(color2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// Test color contrast combinations
function testContrastRatios() {
  console.log(`${colors.cyan}=== Testing Dark Mode Contrast Ratios ===${colors.reset}\n`);

  const tests = [
    {
      name: 'Primary Text on Background',
      foreground: darkModeColors.textPrimary,
      background: darkModeColors.bgPrimary,
      minimum: MIN_CONTRAST_AA,
    },
    {
      name: 'Secondary Text on Background',
      foreground: darkModeColors.textSecondary,
      background: darkModeColors.bgPrimary,
      minimum: MIN_CONTRAST_AA,
    },
    {
      name: 'Muted Text on Background',
      foreground: darkModeColors.textMuted,
      background: darkModeColors.bgPrimary,
      minimum: MIN_CONTRAST_AA_LARGE,
    },
    {
      name: 'Accent Color on Background',
      foreground: darkModeColors.accentColor,
      background: darkModeColors.bgPrimary,
      minimum: MIN_CONTRAST_AA,
    },
    {
      name: 'Link (Accent) on Background',
      foreground: darkModeColors.accentColor,
      background: darkModeColors.bgPrimary,
      minimum: MIN_CONTRAST_AA,
    },
    {
      name: 'Text on Card Background',
      foreground: darkModeColors.textSecondary,
      background: darkModeColors.cardBg,
      minimum: MIN_CONTRAST_AA,
    },
    {
      name: 'Primary Text on Panel',
      foreground: darkModeColors.textPrimary,
      background: darkModeColors.cardBg,
      minimum: MIN_CONTRAST_AA,
    },
    {
      name: 'Warning Text on Background',
      foreground: darkModeColors.warningColor,
      background: darkModeColors.bgPrimary,
      minimum: MIN_CONTRAST_AA,
    },
    {
      name: 'Success Text on Background',
      foreground: darkModeColors.successColor,
      background: darkModeColors.bgPrimary,
      minimum: MIN_CONTRAST_AA,
    },
    {
      name: 'Danger Text on Background',
      foreground: darkModeColors.dangerColor,
      background: darkModeColors.bgPrimary,
      minimum: MIN_CONTRAST_AA,
    },
    {
      name: 'Studio Title on Studio Header',
      foreground: darkModeColors.studioTitle,
      background: darkModeColors.studioHeader,
      minimum: MIN_CONTRAST_AA,
    },
    {
      name: 'Text Secondary on Studio Header',
      foreground: darkModeColors.textSecondary,
      background: darkModeColors.studioHeader,
      minimum: MIN_CONTRAST_AA,
    },
    {
      name: 'Studio Title on Primary Background',
      foreground: darkModeColors.studioTitle,
      background: darkModeColors.bgPrimary,
      minimum: MIN_CONTRAST_AA,
    },
  ];

  // Light mode tests
  const lightModeTests = [
    {
      name: '[LIGHT] Studio Title on Studio Header',
      foreground: lightModeColors.studioTitle,
      background: lightModeColors.studioHeader,
      minimum: MIN_CONTRAST_AA,
    },
    {
      name: '[LIGHT] Studio Text on Studio Header',
      foreground: lightModeColors.studioText,
      background: lightModeColors.studioHeader,
      minimum: MIN_CONTRAST_AA,
    },
  ];

  // Combine all tests
  const allTests = [...tests, ...lightModeTests];

  let passed = 0;
  let failed = 0;

  for (const test of allTests) {
    const ratio = getContrastRatio(test.foreground, test.background);
    const isPass = ratio >= test.minimum;

    if (isPass) {
      console.log(`${colors.green}✓${colors.reset} ${test.name}`);
      console.log(`   Ratio: ${ratio.toFixed(2)}:1 (required: ${test.minimum}:1)`);
      passed++;
    } else {
      console.log(`${colors.red}✗${colors.reset} ${test.name}`);
      console.log(`   Ratio: ${ratio.toFixed(2)}:1 (required: ${test.minimum}:1) ${colors.red}FAILED${colors.reset}`);
      failed++;
    }
  }

  console.log(`\n${colors.cyan}Results: ${passed} passed, ${failed} failed${colors.reset}\n`);
  return failed === 0;
}

// Test CSS for accessibility issues
function testCSSAccessibility() {
  console.log(`${colors.cyan}=== Testing CSS Accessibility ===${colors.reset}\n`);

  const cssPath = path.join(__dirname, '../../static/css/dark-mode.css');
  const css = fs.readFileSync(cssPath, 'utf8');

  const issues = [];

  // Check for !important usage (can cause maintainability issues)
  const importantCount = (css.match(/!important/g) || []).length;
  if (importantCount > 0) {
    console.log(`${colors.yellow}⚠${colors.reset} Found ${importantCount} uses of !important (acceptable for dark mode overrides)`);
  }

  // Check for color-scheme declaration
  if (css.includes('color-scheme: dark')) {
    console.log(`${colors.green}✓${colors.reset} Color scheme properly declared`);
  } else {
    console.log(`${colors.red}✗${colors.reset} Missing color-scheme declaration`);
    issues.push('Missing color-scheme');
  }

  // Check for transition support
  if (css.includes('transition:')) {
    console.log(`${colors.green}✓${colors.reset} Smooth transitions enabled`);
  } else {
    console.log(`${colors.yellow}⚠${colors.reset} No transitions found for theme switching`);
  }

  // Check for panel fixes
  if (css.includes('[data-theme="dark"] .panel')) {
    console.log(`${colors.green}✓${colors.reset} Dark mode panel styles defined`);
  } else {
    console.log(`${colors.red}✗${colors.reset} Missing panel dark mode styles`);
    issues.push('Missing panel styles');
  }

  console.log(`\n${colors.cyan}CSS Issues: ${issues.length}${colors.reset}\n`);
  return issues.length === 0;
}

// Main test runner
async function runAccessibilityTests() {
  console.log(`\n${colors.magenta}╔════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.magenta}║   Accessibility Test Suite - Dark Mode   ║${colors.reset}`);
  console.log(`${colors.magenta}╚════════════════════════════════════════════╝${colors.reset}\n`);

  const contrastPass = testContrastRatios();
  const cssPass = testCSSAccessibility();

  console.log(`${colors.magenta}═════════════════════════════════════════════${colors.reset}\n`);

  if (contrastPass && cssPass) {
    console.log(`${colors.green}✓ All accessibility tests passed!${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`${colors.red}✗ Some accessibility tests failed${colors.reset}\n`);
    process.exit(1);
  }
}

// Run tests
runAccessibilityTests().catch(err => {
  console.error(`${colors.red}Error running tests:${colors.reset}`, err);
  process.exit(1);
});
