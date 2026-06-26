"""KTH Royal Institute of Technology (Stockholm) module catalog scraper.

Source: https://www.kth.se/student/kurser/
Status: STUB — KTH course catalog is a Vue.js SPA, requires headless browser
or internal API discovery
"""

from __future__ import annotations

from typing import Optional

from schema import ModuleCatalog

KTH_CHEMISTRY_URL = "https://www.kth.se/student/kurser/programme/TTKEM"


async def scrape() -> Optional[ModuleCatalog]:
    """Scrape KTH chemistry module catalog. Not yet implemented."""
    print("    [kth] NOT IMPLEMENTED — KTH SPA needs internal API discovery")
    return None
