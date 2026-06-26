"""Imperial College London module catalog scraper.

Source: https://www.imperial.ac.uk/chemistry/
Status: STUB — needs URL research
"""

from __future__ import annotations

from typing import Optional

from schema import ModuleCatalog

IMPERIAL_CHEMISTRY_URL = "https://www.imperial.ac.uk/chemistry/"


async def scrape() -> Optional[ModuleCatalog]:
    """Scrape Imperial College London chemistry module catalog. Not yet implemented."""
    print("    [imperial] NOT IMPLEMENTED — needs public course catalog URL")
    return None
