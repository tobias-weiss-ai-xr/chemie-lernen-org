"""TU München (TUM) module catalog scraper.

Source: https://www.ch.tum.de/ (Department of Chemistry)
Status: SEED — hardcoded core chemistry modules from the TUM Chemistry BSc/MSc curriculum.

TUMonline requires authentication for live scraping. This scraper
provides the core module seed list from the published Prüfungs- und
Studienordnung (PSO) for Chemistry. Future work could parse the PSO
PDFs at https://www.ch.tum.de/.
"""

from __future__ import annotations

import sys
from datetime import date
from pathlib import Path
from typing import Optional

sys.path.insert(0, str(Path(__file__).resolve().parent))

from schema import Degree, ModuleCatalog
from modulhandbuch_framework import make_module, make_university, save_catalog

TUM_CHEMISTRY_URL = "https://www.ch.tum.de/en/studies/"

# Core chemistry modules at TUM, from the published curriculum.
# Format: (module_code, module_name, ects, level, semester)
TUM_CHEMISTRY_MODULES = [
    # BSc Grundlagen
    ("CH0101", "Allgemeine Chemie", 8, "BSc"),
    ("CH0102", "Anorganische Chemie I", 6, "BSc"),
    ("CH0103", "Organische Chemie I", 8, "BSc"),
    ("CH0104", "Physikalische Chemie I", 6, "BSc"),
    ("CH0105", "Analytische Chemie I", 5, "BSc"),
    # BSc Aufbau
    ("CH0201", "Anorganische Chemie II", 6, "BSc"),
    ("CH0202", "Organische Chemie II", 6, "BSc"),
    ("CH0203", "Physikalische Chemie II", 6, "BSc"),
    ("CH0204", "Analytische Chemie II", 5, "BSc"),
    ("CH0205", "Biochemie", 5, "BSc"),
    # BSc Vertiefung
    ("CH0301", "Makromolekulare Chemie", 5, "BSc"),
    ("CH0302", "Theoretische Chemie", 5, "BSc"),
    ("CH0303", "Chemische Technologie", 5, "BSc"),
    ("CH0304", "Chemisches Praktikum", 10, "BSc"),
    # MSc modules
    ("CH0401", "Advanced Inorganic Chemistry", 6, "MSc"),
    ("CH0402", "Advanced Organic Chemistry", 6, "MSc"),
    ("CH0403", "Advanced Physical Chemistry", 6, "MSc"),
    ("CH0404", "Advanced Analytical Chemistry", 6, "MSc"),
    ("CHE5001", "Chemical Biology", 5, "MSc"),
    ("CHE5002", "Supramolecular Chemistry", 5, "MSc"),
]


def scrape() -> Optional[ModuleCatalog]:
    """Seed-based scraper for TUM chemistry modules."""
    print(f"    [tum] Building {len(TUM_CHEMISTRY_MODULES)} seed modules")

    university = make_university(
        name="TU München",
        country="DE",
        short_code="TUM",
        city="München",
        website="https://www.tum.de/",
    )

    modules = []
    for code, name, ects, level in TUM_CHEMISTRY_MODULES:
        modules.append(
            make_module(
                short_code="TUM",
                code=code,
                name=name,
                ects=float(ects),
                language="de" if level == "BSc" else "en",
                level=level,
                degree="BSc/MSc Chemistry (TUM)",
                url=f"https://www.ch.tum.de/en/module/{code}/",
            )
        )

    degrees = [
        Degree(name="BSc in Chemistry", level="BSc", university_short_code="TUM"),
        Degree(name="MSc in Chemistry", level="MSc", university_short_code="TUM"),
    ]

    return ModuleCatalog(
        university=university,
        modules=modules,
        degrees=degrees,
        source_url=TUM_CHEMISTRY_URL,
    )
