# Curricula + Didaktik Scraping Pipeline

Reproducible, idempotent pipeline for scraping:

- **16 German state curricula** (Lehrpläne) — already complete
- **5 KMK Bildungsstandards** — already complete
- **University module catalogs** (Modulhandbücher) — Phase 1+

## Quick start

```bash
# From this directory:
make install   # one-time: create venv, install pinned deps
make all       # run all scrapers (idempotent)
make test      # run unit tests
```

Output goes to:

- `../../myhugoapp/data/didaktik/didaktik.json` — KMK guidelines
- `../../myhugoapp/data/modulhandbuch/{university}.json` — module catalogs

## Architecture

```
scripts/curricula_didaktik/
├── framework.py            # Reproducible scraping framework
├── schema.py               # Data model (Module, University, ...)
├── diff.py                 # Checksum utilities
├── sources/
│   ├── __init__.py         # REGISTRY
│   ├── kmk.py              # KMK Bildungsstandards
│   ├── eth_zurich.py       # ETH Zürich BSc/MSc catalog (reference impl)
│   └── marburg_modulhandbuch.py  # VPN-only, returns empty
├── requirements.txt        # Pinned runtime deps
├── requirements-dev.txt    # Pinned test deps
├── Makefile                # Reproducible pipeline runner
├── README.md               # This file
└── tests/
    ├── test_framework.py   # Framework unit tests
    ├── test_eth_zurich.py  # ETH scraper tests
    ├── test_marburg.py     # Marburg stub tests
    └── fixtures/
        ├── eth_zurich_catalog.html
        └── eth_zurich_module.html
```

## Design principles

### 1. Reproducible

- **Pinned dependencies** (`requirements.txt` with `--hash=`)
- **Deterministic output** (sorted JSON keys, no timestamps in data)
- **Atomic writes** (write to `.tmp`, then `rename()` — CI never
  sees a half-written file)
- **Exit codes** for CI: `0` success, `1` fetch error, `2` parse
  error, `3` validation error, `4` write error
- **CI workflow** in `.github/workflows/curricula-didaktik.yml`
  runs `make ci` on every push

### 2. Idempotent

- Running the pipeline twice with the same source produces the same
  output bytes
- Use `--force` to re-scrape unconditionally
- Use `--dry-run` to print without writing

### 3. Defensive

- Every fetch has retries with exponential backoff
- 403/404/410 errors are not retried (permanent)
- HTML/JSON/PDF content-type detection
- Log to stdout in a CI-friendly format

### 4. Testable

- Each scraper has unit tests with HTML fixtures
- Tests run without network (mocked HTTP)
- Tests run in CI on every push

## Adding a new source

1. Create `sources/{university_short_code}.py`:

   ```python
   from framework import fetch_html, log
   from schema import Module, ModuleCatalog, University, Degree

   SHORT_CODE = "tu_muenchen"
   NAME = "TU München"
   COUNTRY = "DE"
   CITY = "München"
   WEBSITE = "https://www.tum.de/"
   CATALOG_URL = "https://campus.tum.de/..."

   async def scrape() -> ModuleCatalog | None:
       soup = fetch_html(CATALOG_URL)
       if soup is None:
           return None
       modules = []
       for a in soup.find_all("a", href=True):
           if "..." in a["href"]:
               modules.append(Module(
                   university_short_code=SHORT_CODE,
                   module_code=a.text.strip(),
                   module_name=a["title"],
                   ects=5.0,
                   language="de",
                   level="BSc",
               ))
       return ModuleCatalog(
           university=University(name=NAME, country=COUNTRY, city=CITY, website=WEBSITE, short_code=SHORT_CODE),
           modules=modules,
           source_url=CATALOG_URL,
       )
   ```

2. Register in `sources/__init__.py`:

   ```python
   from . import tu_muenchen
   REGISTRY["tu_muenchen"] = tu_muenchen
   ```

3. Add to Makefile `SOURCES`:

   ```makefile
   SOURCES := eth_zurich marburg_modulhandbuch tu_muenchen
   ```

4. Write tests in `tests/test_tu_muenchen.py` with HTML fixtures.

5. Commit + push. CI runs `make ci` and verifies.

## CI

`.github/workflows/curricula-didaktik.yml` runs on every push:

```yaml
- name: Install
  run: make install
- name: Test
  run: make test
- name: Run scrapers
  run: make all
- name: Commit output (if changed)
  run: |
    git config user.email "ci@chemie-lernen.org"
    git config user.name "Curricula CI"
    git add ../../myhugoapp/data/modulhandbuch/
    git commit -m "ci: scrape curricula + didaktik" || true
    git push
```

## Current sources

| Source                  | Status                     | Country      | Public?                  |
| ----------------------- | -------------------------- | ------------ | ------------------------ |
| `kmk`                   | ✅ working                 | DE (federal) | Yes                      |
| `eth_zurich`            | ✅ working (reference)     | CH           | Yes                      |
| `marburg_modulhandbuch` | 💤 VPN-only (empty output) | DE           | No (VPN)                 |
| `tu_muenchen`           | TODO                       | DE           | Partial (TUMonline auth) |
| `lmu_muenchen`          | TODO                       | DE           | TBD                      |
| `rwth_aachen`           | TODO                       | DE           | TBD                      |
| `cambridge`             | TODO                       | UK           | TBD                      |
| `imperial`              | TODO                       | UK           | TBD (403 from public)    |
| `mit`                   | TODO                       | US           | Yes                      |
| `stanford`              | TODO                       | US           | Yes                      |
| `kth`                   | TODO                       | SE           | TBD                      |
| `tokyo`                 | TODO                       | JP           | TBD                      |
| `nus`                   | TODO                       | SG           | TBD                      |
| `iit_bombay`            | TODO                       | IN           | TBD                      |

## License

Code: MIT. Scraped data: see each source's terms of use.
