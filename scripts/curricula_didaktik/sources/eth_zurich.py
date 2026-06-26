"""ETH Zürich module catalog scraper.

Source: https://vorlesungsverzeichnis.ethz.ch/
Status: STUB — needs URL research for Vorlesungsverzeichnis API

ETH publishes courses via the Vorlesungsverzeichnis (course catalog).
The D-CHAB (Department of Chemistry and Applied Biosciences) is at
https://chab.ethz.ch/.
"""

from __future__ import annotations

from typing import Optional

from schema import ModuleCatalog

ETH_CHAB_URL = "https://chab.ethz.ch/"


async def scrape() -> Optional[ModuleCatalog]:
    """Scrape ETH Zürich chemistry module catalog. Not yet implemented."""
    print("    [eth_zurich] NOT IMPLEMENTED — needs Vorlesungsverzeichnis API URL")
    return None
