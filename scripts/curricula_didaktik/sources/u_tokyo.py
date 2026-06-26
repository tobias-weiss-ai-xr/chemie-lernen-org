"""University of Tokyo module catalog scraper.

Source: https://www.u-tokyo.ac.jp/en/
Status: STUB — needs URL research (Japanese-language catalog)
"""

from __future__ import annotations

from typing import Optional

from schema import ModuleCatalog

UTOKYO_CHEMISTRY_URL = "https://www.chem.s.u-tokyo.ac.jp/en/"


async def scrape() -> Optional[ModuleCatalog]:
    """Scrape University of Tokyo chemistry module catalog. Not yet implemented."""
    print("    [u_tokyo] NOT IMPLEMENTED — needs Japanese-language catalog URL")
    return None
