"""Philipps-Universität Marburg — Modulhandbuch Lehramt Chemie.

Source: https://www.uni-marburg.de/de/fb15/studium/studiengaenge/lehramt-chemie

Status (2026-06-26): 403 Forbidden from the public internet. The
Modulhandbuch is only available from the university network (VPN
required). The reference implementation is ETH Zürich, which has a
fully public catalog.

This file exists so that:
1. The Marburg source is documented in the REGISTRY
2. The VPN restriction is visible to anyone running the pipeline
3. The implementation can be filled in when/if a public mirror or
   official export becomes available

The Wayback Machine has captures of /de/fb15/studium (the index
page) but not the Modulhandbuch PDF itself.
"""

from __future__ import annotations

import sys
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from framework import ExitCode, fetch, log
from schema import Module, ModuleCatalog, University, Degree

SHORT_CODE = "marburg"
NAME = "Philipps-Universität Marburg"
COUNTRY = "DE"
CITY = "Marburg"
WEBSITE = "https://www.uni-marburg.de/"
CATALOG_URL = "https://www.uni-marburg.de/de/fb15/studium/studiengaenge/lehramt-chemie"

KNOWN_RESTRICTION = (
    "This source is only accessible from the Philipps-Universität Marburg "
    "internal network (VPN required). The Marburg Modulhandbuch is not "
    "available on the public internet as of 2026-06-26."
)


async def scrape() -> ModuleCatalog | None:
    """Attempt to scrape the Marburg Modulhandbuch.

    Returns None with a clear log message if the source is not
    accessible from the public internet. The reference implementation
    is ETH Zürich; Marburg is here for completeness and for the
    case where the user has VPN access.
    """
    log.info("Marburg: attempting public fetch")
    log.info("Marburg: %s", KNOWN_RESTRICTION)

    try:
        result = fetch(CATALOG_URL, max_retries=1, timeout=10)
        log.info("Marburg: unexpected success (status %d)", result.status_code)
    except Exception as e:
        log.warning("Marburg: public fetch failed (%s) — skipping", e)
        log.info("Marburg: to enable, run from a network with VPN access "
                 "to uni-marburg.de and re-run this scraper")
        return _empty_catalog()


def _empty_catalog() -> ModuleCatalog:
    """Return an empty catalog with metadata so the import step has
    something to work with (and the data-quality tests can flag the
    empty modules as a known gap)."""
    return ModuleCatalog(
        university=University(
            name=NAME,
            country=COUNTRY,
            city=CITY,
            website=WEBSITE,
            short_code=SHORT_CODE,
        ),
        modules=[],
        degrees=[
            Degree(name="BSc Chemie", level="BSc",
                   university_short_code=SHORT_CODE),
            Degree(name="MSc Chemie", level="MSc",
                   university_short_code=SHORT_CODE),
            Degree(name="Lehramt Chemie (Staatsexamen)",
                   level="Staatsexamen",
                   university_short_code=SHORT_CODE),
        ],
        source_url=CATALOG_URL,
        last_updated=date.today().isoformat(),
    )
