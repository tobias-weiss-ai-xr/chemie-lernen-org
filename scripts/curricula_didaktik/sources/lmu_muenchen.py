"""LMU München module catalog scraper.

Source: https://www.cup.uni-muenchen.de/
Status: STUB — needs URL research
"""

from __future__ import annotations

from typing import Optional

from schema import ModuleCatalog

LMU_CHEMISTRY_URL = "https://www.cup.uni-muenchen.de/studium/"


async def scrape() -> Optional[ModuleCatalog]:
    """Scrape LMU München chemistry module catalog. Not yet implemented."""
    print("    [lmu_muenchen] NOT IMPLEMENTED — needs CUP page research")
    return None
