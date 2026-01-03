# chemie-lernen.org

[![Playwright Tests](https://github.com/tobias-weiss-ai-xr/hugo-chemie-lernen-org/actions/workflows/playwright-tests.yml/badge.svg)](https://github.com/tobias-weiss-ai-xr/hugo-chemie-lernen-org/actions/workflows/playwright-tests.yml)
[![Hugo Build](https://github.com/tobias-weiss-ai-xr/hugo-chemie-lernen-org/actions/workflows/hugo-build.yml/badge.svg)](https://github.com/tobias-weiss-ai-xr/hugo-chemie-lernen-org/actions/workflows/hugo-build.yml)

📖 **Offene**, 🖱️ **Interaktive** und 🥽 **Immersive Lerninhalte** für Chemie

Eine innovative Lernplattform für Chemie mit interaktiven Tools, 3D-Visualisierungen und Virtual Reality Erfahrungen.

## Features

### 📚 Inhalt
- **12 Themenbereiche**: Von Atombau bis Organische Chemie
- **Professionelle Formeldarstellung**: KaTeX/LaTeX-Rendering für chemische Formeln
- **Interaktive Quizze**: Testen Sie Ihr Wissen mit integrierten Quiz-Systemen
- **Fortschritts-Tracking**: Verfolgen Sie Ihren Lernfortschritt

### 🧪 Interaktive Tools
- **pH-Rechner**: Berechnen und visualisieren Sie pH-Werte
- **Molare Masse Rechner**: Berechnen Sie molare Massen von Verbindungen
- **Periodensystem 3D**: Interaktives 3D-Periodensystem mit verschiedenen Ansichten
- **Molekülstudio**: Visualisieren Sie Moleküle in 3D

### 🥽 Immersive Erfahrungen
- **VR Labore**: Virtuelle Laboratories in Mozilla Hubs
- **3D-Modelle**: Interaktive 3D-Visualisierungen von Molekülen und Elementen
- **Anwendungen**: Chemische Konzepte greifbar und erlebbar machen

### 🎨 Design & UX
- **Responsive Design**: Optimiert für Desktop, Tablet und Mobile
- **Dark Mode**: Automatische und manuelle Dunkelmodus-Unterstützung
- **Grünes Farbschema**: Konsistentes grünes Design-Thema
- **Accessibility**: Tastaturnavigation, ARIA-Labels, Screenreader-Support

## Projektstruktur

```
.
├── myhugoapp/                 # Hugo Site
│   ├── content/               # Markdown-Inhalte
│   │   └── themenbereiche/    # 12 Themenbereiche
│   ├── static/                # Statische Assets
│   ├── layouts/               # Hugo-Templates
│   └── config.toml            # Hugo-Konfiguration
├── tests/                     # Playwright Tests
│   ├── test-*.spec.js        # Test-Dateien
│   └── playwright.config.js   # Playwright-Konfiguration
├── docs/                      # Dokumentation
└── .github/workflows/         # CI/CD Workflows
```

## Entwicklung

### Voraussetzungen
- Hugo (extended version)
- Node.js 20+
- Docker (optional)

### Lokales Development

**1. Hugo Server starten:**
```bash
cd myhugoapp
hugo server -D
```

**2. Tests ausführen:**
```bash
cd tests
npm install
npx playwright install
npx playwright test
```

**3. Specifische Browser testen:**
```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

**4. Mit Docker entwickeln:**
```bash
docker-compose up
```

## CI/CD

Das Projekt verwendet GitHub Actions für automatisiertes Testing:

- **Playwright Tests**: 255 Tests über 3 Browser (Chromium, Firefox, WebKit)
- **Hugo Build**: Automatische Build-Validierung
- **Testergebnisse**: Artefakte werden 30 Tage aufbewahrt

Siehe [docs/CI_SETUP.md](docs/CI_SETUP.md) für Details.

## Test-Abdeckung

| Browser | Tests | Status |
|---------|-------|--------|
| Chromium | 85 | ✅ 100% |
| Firefox | 85 | ✅ 100% |
| WebKit | 85 | ✅ 100% |

**Gesamt: 255 Tests (100% Pass Rate)**

### Getestete Features
✅ KaTeX/LaTeX-Formel-Rendering
✅ Interaktive Tools (pH-Rechner, Molare Masse, Periodensystem)
✅ Molekülstudio 3D-Visualisierung
✅ Responsives Layout (Mobile, Tablet, Desktop)
✅ Accessibility (Tastatur, ARIA, Screenreader)
✅ Dark Mode
✅ Performance

## Technologien

- **Static Site Generator**: Hugo (extended)
- **Formel-Rendering**: KaTeX 0.16.9 + mhchem extension
- **3D-Visualisierung**: Three.js
- **Testing**: Playwright
- **CSS**: Bootstrap 3.3.7 + Custom CSS
- **JavaScript**: Vanilla JS + jQuery
- **VR**: Mozilla Hubs

## Beitragen

Beiträge sind willkommen! Bitte:

1. Forken Sie das Repository
2. Erstellen Sie einen Feature-Branch
3. Machen Sie Ihre Änderungen
4. Führen Sie Tests aus: `npx playwright test`
5. Pushen Sie und erstellen Sie einen Pull Request

## Lizenz

Siehe [LICENSE](LICENSE) für Details.

## Kontakt

- **Website**: https://chemie-lernen.org
- **Issues**: https://github.com/tobias-weiss-ai-xr/hugo-chemie-lernen-org/issues

## Danksagung

- Hugo Team für den großartigen Static Site Generator
- KaTeX Team für das hervorragende LaTeX-Rendering
- Playwright Team für das zuverlässige Testing-Framework
- Die Open-Source-Community

---

**Erstellt mit ❤️ und ☕ für Chemie-Lernende überall**
