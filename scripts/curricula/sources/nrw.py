"""Nordrhein-Westfalen — Kernlehrplan Chemie.

Source: https://www.schulentwicklung.nrw.de/lehrplaene/
Status: 🚧 Partial — requires headless browser for JS-rendered content.

Notes:
  - NRW's schulentwicklung.nrw.de site is **heavily JS-rendered**.
  - The HTML pages are all identical ~259KB shells — content is loaded
    dynamically via JavaScript (requires Playwright or similar).
  - PDF URLs (klp_SII/*.pdf, klp_SI/*/*.pdf) previously published have
    been redirected to HTML versions (now 404 or redirects).
  - School types with chemistry:
    - Gymnasium (G8/G9) — Sek I and Sek II
    - Realschule — Sek I
    - Hauptschule — Sek I
    - Gesamtschule — Sek I + Sek II
    - Sekundarschule — Sek I (shares RS/HS curriculum)

Future work:
  - Need Playwright/headless browser in the pipeline to scrape NRW.
  - After JS rendering, the HTML structure needs reverse engineering.
  - Or: find direct PDF links that still work (check archive.org).
"""

from __future__ import annotations

from datetime import date

import requests
from bs4 import BeautifulSoup

from schema import (
    SchoolTypeCurriculum,
    StateCurriculum,
)

USER_AGENT = "Mozilla/5.0 (compatible; chemie-lernen-org/1.0; +https://chemie-lernen.org)"


async def scrape() -> StateCurriculum | None:
    """Scrape NRW chemistry curricula.

    Currently returns a metadata-only stub because the site content
    is JS-rendered. A headless browser is required for full scraping.
    """
    school_curricula: list[SchoolTypeCurriculum] = []
    source_urls: list[str] = []

    school_types = [
        "Gymnasium (Sek I)",
        "Gymnasium (Sek II)",
        "Realschule",
        "Hauptschule",
        "Gesamtschule",
        "Sekundarschule",
    ]

    for school_type in school_types:
        print(f"    skipping {school_type} — needs headless browser")
        school_curricula.append(SchoolTypeCurriculum(
            school_type=school_type,
            grade_levels=[],
            source_url="https://www.schulentwicklung.nrw.de/lehrplaene/",
            last_checked=date.today().isoformat(),
        ))

    return StateCurriculum(
        state="Nordrhein-Westfalen",
        state_abbr="NRW",
        school_curricula=school_curricula,
        last_updated=date.today().isoformat(),
        source_urls=source_urls,
    )
