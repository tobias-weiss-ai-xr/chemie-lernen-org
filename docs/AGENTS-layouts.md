# Hugo Layout Templates

**Generated:** 2026-03-16 14:00:00  
**Commit:** $(git rev-parse --short HEAD)  
**Branch:** $(git rev-parse --abbrev-ref HEAD)

## OVERVIEW

22 specialized layout templates for chemistry calculators, 6 core partials, and block-based template system. Master templates override Hugo cards theme with custom functionality for interactive calculators and progressive enhancement.

## STRUCTURE

```
myhugoapp/layouts/
├── index.html                    # Homepage (PSE VR hero, 651 lines)
├── robots.txt                    # Search engine config
├── _default/                     # 29 template files
│   ├── baseof.html               # Master layout (block-based inheritance)
│   ├── list.html                 # Blog listing (pagination, card grid)
│   ├── single.html               # Page with sidebar (468 lines CSS)
│   ├── ph-rechner.html           # pH calculator page
│   ├── molare-masse-rechner.html # Molar mass calculator
│   ├── stoechiometrie-rechner.html # Stoichiometry calculator
│   ├── molekuel-studio.html      # 3D molecule studio
│   ├── perioden-system-der-elemente.html # Periodic table 3D
│   ├── titrations-simulator.html # Titration simulator
│   ├── gas-law-simulator.html    # Gas laws simulator
│   ├── gasgesetz-rechner.html    # Gas law calculator
│   ├── druck-flaechen-rechner.html # Pressure calculator
│   ├── druck-flaechen-rechner-framework.html
│   ├── enhanced-ph-visualization.html
│   ├── enhanced-ph-visualization.html
│   ├── hess-gesetz.html          # Hess's law
│   ├── einhellsumrechner.html    # Unit converter
│   ├── atmo-sphaeren-druck.html  # Atmospheric pressure
│   └── [22 calculator layouts]   # Each specialized calculator
│
└── partials/                     # 6 reusable components
    ├── head.html                 # Meta tags, KaTeX, external resources (107 lines)
    ├── header.html               # Navbar, PSE VR promo, mega-menu (270 lines)
    ├── footer.html               # VR CTA, legal links, floating button (74 lines)
    ├── breadcrumbs.html          # Hierarchical navigation (115 lines)
    ├── quiz.html                 # Quiz component (127 lines)
    └── structured-data.html      # Schema.org JSON-LD (82 lines)
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| **Homepage hero** | index.html | PSE VR prominent banner (651 lines) |
| **Master template** | baseof.html | Block inheritance, partial includes |
| **Navigation** | header.html | Mega-menu, search form |
| **Footer CTA** | footer.html | VR promotion, legal links |
| **Meta tags** | head.html | OpenGraph, Twitter Cards, KaTeX |
| **Calculator page** | _default/[calc].html | 22 specialized layouts |
| **Quiz system** | quiz.html | Interactive questions component |
| **Breadcrumbs** | breadcrumbs.html | Dynamic navigation hierarchy |
| **SEO** | structured-data.html | Schema.org markup |
| **Blog listing** | list.html | Pagination, card grid |
| **Single page** | single.html | Sidebar, difficulty badges |

## TEMPLATE PATTERNS

### Block-Based Inheritance (baseof.html)
```html
<!DOCTYPE html>
<html lang="de" xml:lang="de" dir="ltr">
  {{ partial "head.html" . }}
  {{ block "css" . }}{{ end }}
  <body>
    {{ partial "header.html" . }}
    <div class="container">
      {{ partial "breadcrumbs.html" . }}
      <div class="wrapper">
        <main id="main-content" role="main">
          {{ block "main" . }}{{ end }}
        </main>
      </div>
    </div>
    {{ partial "footer.html" . }}
    {{ block "js" . }}{{ end }}
  </body>
</html>
```

### Single Page Override Pattern
```go
{{ define "main" }}
{{ partial "head.html" . }}
<!-- Calculator-specific HTML -->
<div class="calculator-container">
  {{ partial "quiz.html" (dict "context" . "quizId" "ph-rechner") }}
</div>
<script src="/js/ph-rechner.js"></script>
{{ end }}
```

### Partial Template Pattern
```go
{{/* In single.html */}}
{{ partial "quiz.html" (dict "context" . "quizId" "saeuren-basen") }}

{{/* In quiz.html */}}
<div class="quiz-container" id="quiz-{{ $quizId }}">
  <div class="quiz-progress">...</div>
  <div class="quiz-question">{{ .context.Params.quizQuestion }}</div>
  <div class="quiz-options">...</div>
</div>
```

## PARTIAL STRUCTURE

### head.html (107 lines)
- **Meta tags**: charset, viewport, description, canonical
- **Open Graph**: og:type, og:url, og:title, og:image
- **Twitter Cards**: summary_large_image
- **Favicons**: Apple touch icons, PWA manifest
- **External**: Bootstrap 3.3.7, Font Awesome 4.7.0, KaTeX 0.16.9
- **Conditional loading**: Quiz CSS/JS only if page has quiz
- **Dynamic description**: `.Description` or `.Site.Params.footer_description`

```html
{{/* Conditional description fallback */}}
{{ if .Description }}
  <meta name="description" content="{{ .Description }}">
{{ else }}
  <meta name="description" content="{{ .Site.Params.footer_description }}">
{{ end }}
```

### header.html (270 lines)
- **Navigation menu**: Bootstrap navbar with dropdown support
- **PSE VR promo**: Gradient banner with special styling
- **Mega-menu**: Multi-level navigation with icon badges
- **Quick search**: Active search input form
- **Responsive**: Mobile hamburger menu, desktop flex layout

```go
{{/* Dynamic menu generation */}}
{{ range .Site.Menus.main.ByWeight }}
  {{ if .HasChildren }} <!-- Dropdown --> {{ else }} <!-- Item --> {{ end }}
{{ end }}
```

### footer.html (74 lines)
- **PSE VR CTA banner**: Gradient background, floating fixed button
- **Copyright**: Dynamic year `{{ now.Format "2006" }}`
- **External links**: Impressum, Datenschutz, Barrierefreiheit
- **Patreon promotion**: SVG icon with link

```html
<!-- Footer structure -->
<footer class="site-footer">
  <div class="pse-vr-promo">...</div>
  <div class="main-footer">...</div>
</footer>
<!-- Floating CTA -->
<a href="..." class="floating-vr-button">...</a>
```

### breadcrumbs.html (115 lines)
**Logic Tree**:
```
if .Kind != "home" → generate breadcrumb
  ├─ current section = "Themenbereiche"
  └─ .File.Dir contains:
      ├─ "themenbereiche" → difficulty-specific links
      ├─ "pages" → static page breadcrumbs
      └─ Interactive pages → special hierarchy
```

- **Difficulty badges**: 🌱 Grundlagen, 🌿 Mittelstufe, 🌳 Fortgeschnovitten
- **Special cases**: Interactive tools link to parent sections
- **Inline styles**: Transparent background, right-angled separators `›`

### quiz.html (127 lines)
**Component Pattern**:
```go
{{ partial "quiz.html" (dict "context" . "quizId" "saeuren-basen") }}
```

- **Container**: Hidden state control (`display: none`)
- **Progress**: Bar + step counter
- **Question card**: Dynamic options
- **Answer review**: After submission
- **JS variable injection**: `quizData_{{ $quizId }}`

### structured-data.html (82 lines)
**Conditional Schema**:
```html
{{ if .IsHome }}        → WebSite schema
{{ else if .IsPage }}   → Article schema  
{{ else if .IsSection }}→ CollectionPage schema
{{ end }}
```

- **Organization Schema**: Always embedded (github, contact point)
- **SearchAction**: Site-wide search metadata
- **Date Handling**: RFC 3339 format `{{ .PublishDate.Format "2006-01-02" }}`

## CALCULATOR LAYOUT PATTERN

### Tabbed Calculator Interface
```html
<div class="calculator-container">
  <ul class="nav nav-tabs">
    <li class="active"><a href="#calc">Berechnen</a></li>
    <li><a href="#theorie">Theorie</a></li>
    <li><a href="#beispiele">Beispiele</a></li>
  </ul>
  
  <div class="tab-content">
    <div id="calc" class="tab-pane active">
      <!-- Calculator form and results -->
    </div>
    <div id="theorie" class="tab-pane">
      <!-- Educational content -->
    </div>
  </div>
</div>

<!-- Inline styles (468 lines typical) -->
<style>
.calculator-container { /* ... */ }
.calculator__input { /* ... */ }
.calculator__output { /* ... */ }
</style>

<!-- Calculator scripts -->
<script src="/js/ph-rechner.js"></script>
```

## SPECIAL LAYOUTS

### index.html (651 lines)
- **PSE VR Hero Section**: Most prominent feature (gradient banner)
- **Featured cards**: Color-coded calculator categories:
  - Blue (#2196F3): Calculators
  - Orange (#FF9800): Simulators
  - Purple (#9C27B0): Converter tools
- **Grid of 15+ interactive tools**
- **Blog posts pagination**: `{{ range .Site.RegularPages }}`

### single.html (500+ lines)
- **Sticky sidebar**: `.thema-sidebar { position: sticky; top: 20px; }`
- **Difficulty badges**: 🌱 Grundlage, 🌿 Mittelstufe, 🌳 Fortgeschritten
- **Related topics**: Content filtering section
- **Topic navigation**: Prev/next links
- **Embedded styles**: 468 lines of CSS (single-file portability)

## NAMING CONVENTIONS

| Pattern | Example | Notes |
|---------|---------|-------|
| **snake_case German** | `ph-rechner.html`, `molare-masse-rechner.html` | Slug-based |
| **Special pages** | `pse-in-vr.html`, `molekuel-studio.html` | VR/3D content |
| **Partials (singular)** | `header.html`, `footer.html` | Component names |
| **Feature partials** | `quiz.html`, `structured-data.html` | Purpose-based |
| **Block override** | `{{ define "main" }}` | Template inheritance |

## HUGO-SPECIFIC PATTERNS

### Front-matter Params Used
```yaml
schwierigkeit: grundlagen | mittelstufe | fortgeschritten  # Difficulty badge
interaktiv: true                                            # Interactive flag
teilgebiet: aufbau-materie | reaktionstypen-organisch       # Subject area
icon: ⚛️                                                     # Emoji icon
weight: 20                                                  # Sort order
quiz: sauren-basen                                           # Quiz reference
```

### Template Functions
| Function | Usage |
|----------|-------|
| `{{ $scratch := newScratch }}` | Local variables (pagination) |
| `{{ range where .Site.Pages "...": "..." }}` | Content filtering |
| `{{ .Paginator.Pages }}` | Blog pagination |
| `{{ partial "name.html" . }}` | Partial inclusion |
| `{{ template "main" . }}` | Block override |
| `{{ .Site.Menus.main.ByWeight }}` | Menu ordering |
| `{{ .Site.Params.footer_description }}` | Global parameters |

## CODE STANDARDS

- **KaTeX + mhchem**: Chemical formula rendering `$H_2SO_4$`, `\frac{a}{b}`
- **Bootstrap 3.3.7**: Grid system (col-md-4, col-md-8), components
- **Progressive enhancement**: Core HTML without JS works
- **Accessibility**: ARIA labels, keyboard navigation verified
- **Responsiveness**: Mobile-first, 320px/768px/1024px breakpoints
- **Inline styles**: 300-600 lines embedded for single-file portability
- **No shortcodes**: Custom layouts preferred over shortcode syntax

## ANTI-PATTERNS

- **Don't use shortcodes**: Prefer page-specific layouts for better SEO
- **Never hard-code URLs**: Use Hugo `{{ .Permalink }}` or `{{ relURL }}`
- **Avoid inline JS**: Prefer data attributes + delegated event handlers
- **Don't skip accessibility**: ARIA labels, semantic HTML mandatory
- **Avoid global styles**: Use BEM-like naming for isolation
- **Never omit optimized files**: Always compile with Hugo `--minify`

## RECOMMENDED READING ORDER

1. **Start here**: baseof.html (understand inheritance)
2. **Global pieces**: head.html, header.html, footer.html
3. **Pick a calculator**: ph-rechner.html (simple example)
4. **Advanced calculator**: molekuel-studio.html (64KB 3D)
5. **Homepage**: index.html (651 lines, VR hero)
6. **Single page**: single.html (500 lines CSS, sidebar)

---

This knowledge base was generated by /init-deep on 2026-03-16 14:00:00 using comprehensive codebase discovery.
