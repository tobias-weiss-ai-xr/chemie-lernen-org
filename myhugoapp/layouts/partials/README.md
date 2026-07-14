# layouts/partials/

Hugo template partials for chemie-lernen.org. These are reusable HTML fragments included via `{{ partial "name" . }}` in layouts.

## Partials

| Partial | Purpose |
|---------|---------|
| `head.html` | `<head>` section: meta, CSS, SW registration, structured data |
| `header.html` | Site header: navigation, search, auth controls |
| `footer.html` | Site footer: links, copyright |
| `breadcrumbs.html` | Breadcrumb navigation |
| `cross-links.html` | "Verwandte Themen" cross-linking section |
| `badge-toast.html` | Gamification badge unlock toast (Sprint 23) |
| `recommendation-widget.html` | "Dein Lernpfad" home widget (Sprint 23) |
| `quiz.html` | Quiz question rendering partial |
| `structured-data.html` | JSON-LD structured data (Schema.org) |
| `social-share.html` | Social media share buttons |
| `faq-schema.html` | FAQPage schema markup |
| `geo-meta.html` | Geo/meta tags |
| `curriculum.html` | Curriculum display partial |
| `curricula-mention.html` | Curricula reference mention |
| `universitaeten-mention.html` | University reference mention |
| `newsletter-signup.html` | Newsletter subscription form |

## Patterns

- All partials receive the Hugo context (`.`) as their only argument
- Use `{{ with .Params }}` / `{{ end }}` for optional frontmatter fields
- CSS classes follow the hugo-cards theme conventions
- JavaScript is loaded via `<script>` tags (not modules) unless in Three.js visualization files
- `partialCached` is used for frequently-rendered partials like breadcrumbs
