"""TU München (TUM) module catalog scraper.

Source: https://www.tum.de/ (TUMonline requires login)
Status: STUB — TUMonline needs authentication

To implement:
1. Find a public (no-login) endpoint for chemistry modules
2. Alternative: use TUM's Prüfungs- und Studienordnung (PSO) PDFs
3. The TUM BSc/MSc Chemistry programs publish PDFs at
   https://www.ch.tum.de/en/bachelor-s-program-chemistry/
"""

from __future__ import annotations

from typing import Optional

from schema import ModuleCatalog

TUM_CHEMISTRY_URL = "https://www.ch.tum.de/en/bachelor-s-program-chemistry/"


async def scrape() -> Optional[ModuleCatalog]:
    """Scrape TU München chemistry module catalog. Not yet implemented."""
    print("    [tum] NOT IMPLEMENTED — needs public TUMonline endpoint or PSO PDF")
    return None
