"""Source scrapers for didactic guidelines.

Each source module exposes a single async function:

    async def scrape() -> list[DidacticGuideline] | None:
"""

from __future__ import annotations

from . import kmk, marburg_modulhandbuch

REGISTRY = {
    "kmk": kmk,
    "marburg_modulhandbuch": marburg_modulhandbuch,
}

SOURCE_META = {
    "kmk": {
        "name": "KMK Fachprofile & Bildungsstandards",
        "status": "✅ working",
        "url": "https://www.kmk.org/themen/allgemeinbildende-schulen/unterrichtsfaecher/chemie.html",
    },
    "marburg_modulhandbuch": {
        "name": "Modulhandbuch Lehramt Chemie (Marburg)",
        "status": "💤 stub",
        "url": "https://www.uni-marburg.de/de/fb15/studium/studiengaenge/lehramt-chemie",
    },
}
