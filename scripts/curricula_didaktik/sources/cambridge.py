"""University of Cambridge module catalog scraper.

Source: https://www.tripos.cam.ac.uk/
Status: STUB — Cambridge uses the Tripos system
"""

from __future__ import annotations

from typing import Optional

from schema import ModuleCatalog

CAMBRIDGE_CHEMISTRY_URL = "https://www.ch.cam.ac.uk/"


async def scrape() -> Optional[ModuleCatalog]:
    """Scrape Cambridge chemistry module catalog. Not yet implemented."""
    print("    [cambridge] NOT IMPLEMENTED — Tripos system URL research needed")
    return None
