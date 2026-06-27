"""ETH Zürich module catalog scraper.

Source: https://vorlesungsverzeichnis.ethz.ch/
Status: SEED — hardcoded core chemistry modules from D-CHAB.

ETH's Vorlesungsverzeichnis has no simple public API for the full
chemistry curriculum. This scraper provides a seed list of the core
BSc and MSc modules in chemistry from D-CHAB (Department of Chemistry
and Applied Biosciences). Future work could add live parsing from
https://chab.ethz.ch/studies/.
"""

from __future__ import annotations

import sys
from datetime import date
from pathlib import Path
from typing import Optional

sys.path.insert(0, str(Path(__file__).resolve().parent))

from schema import Degree, ModuleCatalog
from modulhandbuch_framework import make_module, make_university, save_catalog

ETH_CHAB_URL = "https://chab.ethz.ch/"

# Core BSc/MSc chemistry modules at ETH D-CHAB.
# Format: (module_code, module_name, ects, level, semester)
ETH_CHEMISTRY_MODULES = [
    # BSc Grundlagenfächer
    ("529-0001-00L", "Allgemeine Chemie I", 7, "BSc"),
    ("529-0002-00L", "Allgemeine Chemie II", 7, "BSc"),
    ("529-0011-00L", "Anorganische Chemie I", 4, "BSc"),
    ("529-0012-00L", "Anorganische Chemie II", 4, "BSc"),
    ("529-0021-00L", "Organische Chemie I", 4, "BSc"),
    ("529-0022-00L", "Organische Chemie II", 4, "BSc"),
    ("529-0031-00L", "Physikalische Chemie I", 4, "BSc"),
    ("529-0032-00L", "Physikalische Chemie II", 4, "BSc"),
    ("529-0051-00L", "Analytische Chemie I", 3, "BSc"),
    ("529-0058-00L", "Analytische Chemie II", 3, "BSc"),
    # BSc Kernfächer
    ("529-0131-00L", "Biochemie", 3, "BSc"),
    ("529-0440-00L", "Physikalische Chemie III: Molekulare Thermodynamik", 4, "BSc"),
    ("529-0431-00L", "Organische Chemie III", 4, "BSc"),
    ("529-0121-00L", "Anorganische und Organische Chemie für Biologen", 4, "BSc"),
    ("529-0059-00L", "Nanotechnologie", 3, "MSc"),
    ("529-0071-00L", "Chemical Biology", 6, "MSc"),
    ("529-0072-00L", "Supramolecular Chemistry", 6, "MSc"),
    ("529-0083-00L", "Bioorganische Chemie", 6, "MSc"),
    ("529-0084-00L", "Protein Engineering", 6, "MSc"),
]


def scrape() -> Optional[ModuleCatalog]:
    """Seed-based scraper for ETH Zurich chemistry modules."""
    print(f"    [eth_zurich] Building {len(ETH_CHEMISTRY_MODULES)} seed modules")

    university = make_university(
        name="ETH Zürich",
        country="CH",
        short_code="ETH",
        city="Zürich",
        website="https://ethz.ch/",
    )

    modules = []
    for code, name, ects, level in ETH_CHEMISTRY_MODULES:
        modules.append(
            make_module(
                short_code="ETH",
                code=code,
                name=name,
                ects=float(ects),
                language="de" if level == "BSc" else "en",
                level=level,
                degree="BSc/MSc Chemistry (ETH)",
                url=f"https://vorlesungsverzeichnis.ethz.ch/{code}/",
            )
        )

    degrees = [
        Degree(name="BSc in Chemistry", level="BSc", university_short_code="ETH"),
        Degree(name="MSc in Chemistry", level="MSc", university_short_code="ETH"),
    ]

    return ModuleCatalog(
        university=university,
        modules=modules,
        degrees=degrees,
        source_url=ETH_CHAB_URL,
    )
