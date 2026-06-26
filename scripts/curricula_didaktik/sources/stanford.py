"""Stanford University module catalog scraper.

Source: https://explorecourses.stanford.edu/
Status: STUB — explorecourses is a JavaScript SPA, requires headless browser
"""

from __future__ import annotations

from typing import Optional

from schema import ModuleCatalog

STANFORD_EXPLORE_URL = "https://explorecourses.stanford.edu/"


async def scrape() -> Optional[ModuleCatalog]:
    """Scrape Stanford chemistry module catalog. Not yet implemented."""
    print("    [stanford] NOT IMPLEMENTED — explorecourses SPA needs headless browser")
    return None
