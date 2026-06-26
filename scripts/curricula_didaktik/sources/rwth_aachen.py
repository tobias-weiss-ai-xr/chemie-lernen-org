"""RWTH Aachen module catalog scraper.

Source: https://www.rwth-aachen.de/
Status: STUB — RWTHonline requires login
"""

from __future__ import annotations

from typing import Optional

from schema import ModuleCatalog

RWTH_CHEMISTRY_URL = "https://www.chemie.rwth-aachen.de/"


async def scrape() -> Optional[ModuleCatalog]:
    """Scrape RWTH Aachen chemistry module catalog. Not yet implemented."""
    print("    [rwth_aachen] NOT IMPLEMENTED — RWTHonline needs authentication")
    return None
