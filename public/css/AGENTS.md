# PROJECT KNOWLEDGE BASE - Styling and Theming

**Generated:** 2026-01-07 23:44:10
**Commit:** $(git rev-parse --short HEAD)
**Branch:** $(git rev-parse --abbrev-ref HEAD)

## OVERVIEW

CSS styling and theming for the chemistry learning platform including Bootstrap 3.3.7, custom CSS, dark mode support, and responsive design.

## STRUCTURE

```
myhugoapp/static/css/
├── bootstrap/            # Bootstrap framework
├── custom.css           # Custom styles
├── dark-mode.css        # Dark mode styling
├── responsive.css       # Responsive design
├── typography.css       # Typography styles
├── buttons.css          # Button styles
├── forms.css            # Form styling
├── cards.css            # Card components
├── navigation.css       # Navigation menus
├── calculators.css      # Calculator specific styles
├── pse-in-vr.css        # VR system styles
├── quiz.css             # Quiz system styles
└── progress.css         # Progress tracking styles
```

## WHERE TO LOOK

| Task                  | Location        | Notes                     |
| --------------------- | --------------- | ------------------------- |
| **Dark mode**         | dark-mode.css   | Theme switching           |
| **Custom styles**     | custom.css      | Project-specific CSS      |
| **Calculator styles** | calculators.css | Calculator UI             |
| **VR styles**         | pse-in-vr.css   | VR system styling         |
| **Quiz styles**       | quiz.css        | Quiz interface            |
| **Progress tracking** | progress.css    | Learning progress UI      |
| **Responsive design** | responsive.css  | Mobile and tablet support |
| **Typography**        | typography.css  | Font and text styles      |

## CONVENTIONS

- **Bootstrap 3.3.7**: Base framework with custom overrides
- **Dark mode**: Automatic and manual toggle support
- **Responsive design**: Mobile-first approach
- **Custom CSS**: Project-specific styling
- **Component-based**: Modular CSS structure

## ANTI-PATTERNS

- Avoid !important overrides
- Never skip responsive testing
- Always use relative units (rem, em, %)
- Never hard-code colors without variables
- Avoid deep CSS selectors

## UNIQUE STYLES

- **Green color scheme**: Consistent branding
- **Dark mode**: Smooth theme transitions
- **Card-based layout**: Modern UI components
- **Accessibility**: High contrast ratios
- **Responsive**: Mobile-optimized design

## COMMANDS

```bash
# Build optimized site (includes CSS minification)
npm run build:optimized

# Run performance tests
npm run test:performance

# Check CSS validation
# (integrated in E2E tests)
```

## NOTES

- Uses Bootstrap 3.3.7 with custom modifications
- Dark mode support with automatic detection
- Responsive design for all screen sizes
- Custom CSS variables for theming
- Accessibility-focused color choices
- Performance-optimized CSS loading
