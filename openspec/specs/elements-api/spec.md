# Spec: elements-api

**Capability:** Public REST API for chemical element data
**Owners:** Sisyphus
**Status:** Active — main spec

---

## Purpose

chemie-lernen.org provides a public JSON API at `GET /api/elements`
that returns structured data about the chemical elements. This API
powers the element comparison tool (`/vergleich/`), periodic table
visualizations, and molecular studio. External educational tools
and third-party integrations may also consume this endpoint.

The API is **read-only, unauthenticated, and rate-limited** to
prevent abuse while remaining freely accessible for educational use.

## Data format specification

The response is a JSON array of element objects. Each element object
contains the following fields:

| Field                   | Type    | Description                                       |
| ----------------------- | ------- | ------------------------------------------------- | ----------------------------------------------- |
| `atomicNumber`          | integer | Atomic number (Z), 1–118                          |
| `symbol`                | string  | Element symbol (e.g., "H", "He")                  |
| `name`                  | string  | German name (e.g., "Wasserstoff", "Helium")       |
| `nameEnglish`           | string  | English name (e.g., "Hydrogen", "Helium")         |
| `atomicMass`            | float   | Atomic mass in unified atomic mass units (u)      |
| `category`              | string  | Element category (e.g., "Nichtmetall", "Edelgas") |
| `group`                 | integer | null                                              | Group number in the periodic table (1–18)       |
| `period`                | integer | Period number in the periodic table (1–7)         |
| `block`                 | string  | Block: "s", "p", "d", or "f"                      |
| `electronConfiguration` | string  | Electron configuration notation                   |
| `electronegativity`     | float   | null                                              | Pauling electronegativity value                 |
| `atomicRadius`          | integer | null                                              | Atomic radius in picometers                     |
| `ionizationEnergy`      | float   | null                                              | First ionization energy in eV                   |
| `density`               | float   | null                                              | Density in g/cm³ at room temperature            |
| `meltingPoint`          | float   | null                                              | Melting point in Kelvin                         |
| `boilingPoint`          | float   | null                                              | Boiling point in Kelvin                         |
| `colorHex`              | string  | null                                              | Hex color code for category-based visualization |
| `discoveredBy`          | string  | null                                              | Discoverer or discovery credit                  |
| `yearDiscovered`        | integer | null                                              | Year of discovery                               |

## Endpoints

### GET /api/elements

Returns all known elements (118) as a JSON array.

**Example response:**

```json
[
  {
    "atomicNumber": 1,
    "symbol": "H",
    "name": "Wasserstoff",
    "nameEnglish": "Hydrogen",
    "atomicMass": 1.008,
    "category": "Nichtmetall",
    "group": 1,
    "period": 1,
    "block": "s",
    "electronConfiguration": "1s¹",
    "electronegativity": 2.2,
    "atomicRadius": 53,
    "ionizationEnergy": 13.598,
    "density": 0.0000899,
    "meltingPoint": 14.01,
    "boilingPoint": 20.28,
    "colorHex": "#2ecc71",
    "discoveredBy": "Henry Cavendish",
    "yearDiscovered": 1766
  }
]
```

### GET /api/elements/{symbol}

Returns a single element by its symbol (case-insensitive).

**Example:** `GET /api/elements/Fe`

Returns the element object for iron, or `404 Not Found` if the symbol
is not recognized.

### GET /api/elements?category={category}

Filters elements by category. Supported category values include:

- `Nichtmetall` (nonmetal)
- `Edelgas` (noble gas)
- `Alkalimetall` (alkali metal)
- `Erdalkalimetall` (alkaline earth metal)
- `Halbmetall` (metalloid)
- `Metall` (post-transition metal)
- `Halogen` (halogen)
- `Uebergangsmetall` (transition metal)
- `Lanthanoid` (lanthanide)
- `Actinoid` (actinide)

## Caching and performance

### Response caching

- The elements dataset is **static** — it never changes between deploys
- Server-side: response cached in memory, refreshed on process restart
- Client-side: `Cache-Control: public, max-age=86400` (24 hours)
- ETag header for conditional requests

### Performance targets

- Response time: < 50 ms (cached), < 200 ms (cold start)
- Response size: ~25 KB (gzipped)
- Throughput: 1000 req/s per instance (cached)

## Requirements

### REQ-API-1: Complete element coverage

The API MUST return data for all 118 known elements with no gaps.
Each element MUST include at minimum: atomicNumber, symbol, name,
atomicMass, category, group, period, block.

### REQ-API-2: Data accuracy

Element property data MUST be verified against authoritative sources
(IUPAC, NIST). Discrepancies between sources MUST be documented
inline as comments in the data file.

### REQ-API-3: Response format consistency

All numeric fields MUST use consistent units and types:

- `null` for unknown/missing values (never `0` or empty string)
- `float` for decimal values (even whole numbers like `1.0`)
- PascalCase for all JSON keys

### REQ-API-4: Error handling

- `404` for unknown element symbols (not `400` or `500`)
- `400` for invalid query parameters
- Rate limiting: `429 Too Many Requests` with `Retry-After` header
- All errors return a JSON body: `{ "error": "...", "status": 404 }`

## References

- `myhugoapp/api/server.js` — API server implementation
- `myhugoapp/api/elements-data.js` — element data definitions
- `myhugoapp/static/js/vergleich.js` — element comparison tool (consumer)
- `myhugoapp/static/js/perioden-system-der-elemente.js` — periodic table (consumer)
