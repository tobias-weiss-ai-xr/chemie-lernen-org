"""Philipps-Universität Marburg — Modulhandbuch Lehramt Chemie.

Source: https://www.uni-marburg.de/de/fb15/studium/studiengaenge/lehramt-chemie

TODO:
  - Find the actual Modulhandbuch PDF URL.
  - Search for "Modulhandbuch Lehramt Chemie Marburg" on uni-marburg.de.
  - The Chemistry department (FB15) publishes module handbooks as PDFs.
"""

from __future__ import annotations

from schema import GuidelineSection, DidacticGuideline


async def scrape() -> list[DidacticGuideline] | None:
    """Scrape Marburg Modulhandbuch — not yet implemented."""
    print("    NOT IMPLEMENTED — Marburg Modulhandbuch needs URL research")
    return None
