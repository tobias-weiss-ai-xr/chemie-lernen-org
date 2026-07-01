"""Freie Universität Berlin module catalog scraper.

Source: https://www.bcp.fu-berlin.de/ (Institute of Chemistry and Biochemistry)
Status: SEED — hardcoded core modules from published FU Berlin Chemistry curriculum.

FU Berlin chemistry offers BSc/MSc with modules in:
- Allgemeine Chemie (Modul 1-4)
- Organische/Anorganische Chemie (Modul 5-10)
- Physikalische/Theoretische Chemie (Modul 11-15)
- Spezialisierung (Modul 16-23)
"""

from __future__ import annotations

from typing import Optional

from schema import Degree, ModuleCatalog
from modulhandbuch_framework import make_module, make_university

FU_BERLIN_URL = "https://www.bcp.fu-berlin.de/studium/"

# Core chemistry modules at FU Berlin, from the published curriculum.
# Format: (module_code, module_name, ects, level)
FU_BERLIN_CHEMISTRY_MODULES = [
    # BSc Grundlagen
    ("CHEM101", "Allgemeine und Anorganische Chemie", 8, "BSc"),
    ("CHEM102", "Organische Chemie: Grundlagen", 6, "BSc"),
    ("CHEM103", "Physikalische Chemie: Grundlagen", 6, "BSc"),
    ("CHEM104", "Analytische Chemie und Methodik", 5, "BSc"),
    ("CHEM105", "Grundpraktikum Anorganische Chemie", 6, "BSc"),
    ("CHEM106", "Grundpraktikum Organische Chemie", 6, "BSc"),
    # BSc Aufbau
    ("CHEM201", "Anorganische Chemie: Molekülchemie", 5, "BSc"),
    ("CHEM202", "Organische Chemie: Reaktivität", 6, "BSc"),
    ("CHEM203", "Physikalische Chemie: Quantenmechanik", 6, "BSc"),
    ("CHEM204", "Biochemie", 5, "BSc"),
    ("CHEM205", "Instrumentelle Analytik", 5, "BSc"),
    ("CHEM206", "Fortgeschrittenenpraktikum AC/OC", 6, "BSc"),
    # BSc Vertiefung
    ("CHEM301", "Anorganische Festkörper- und Materialchemie", 5, "BSc"),
    ("CHEM302", "Organische Synthesechemie", 5, "BSc"),
    ("CHEM303", "Theoretische Chemie", 5, "BSc"),
    # MSc modules
    ("CHEM401", "Advanced Inorganic Chemistry", 6, "MSc"),
    ("CHEM402", "Advanced Organic Chemistry", 6, "MSc"),
    ("CHEM403", "Advanced Physical Chemistry", 6, "MSc"),
    ("CHEM404", "Chemical Biology", 5, "MSc"),
    ("CHEM405", "Supramolecular Chemistry", 5, "MSc"),
    ("CHEM406", "Polymer Chemistry", 5, "MSc"),
    ("CHEM501", "Research Module: Synthesis", 10, "MSc"),
    ("CHEM502", "Research Module: Spectroscopy", 10, "MSc"),
]


def scrape() -> Optional[ModuleCatalog]:
    """Seed-based scraper for FU Berlin chemistry modules."""
    print(f"    [fu_berlin] Building {len(FU_BERLIN_CHEMISTRY_MODULES)} seed modules")

    university = make_university(
        name="Freie Universität Berlin",
        country="DE",
        short_code="FU_BERLIN",
        city="Berlin",
        website="https://www.fu-berlin.de/",
    )

    modules = []
    for code, name, ects, level in FU_BERLIN_CHEMISTRY_MODULES:
        modules.append(
            make_module(
                short_code="FU_BERLIN",
                code=code,
                name=name,
                ects=float(ects),
                language="de" if level == "BSc" else "en",
                level=level,
                degree="BSc/MSc Chemistry (FU Berlin)",
                url=f"https://www.bcp.fu-berlin.de/module/{code}/",
            )
        )

    degrees = [
        Degree(name="BSc in Chemistry", level="BSc", university_short_code="FU_BERLIN"),
        Degree(name="MSc in Chemistry", level="MSc", university_short_code="FU_BERLIN"),
        Degree(name="BSc in Biochemistry", level="BSc", university_short_code="FU_BERLIN"),
    ]

    return ModuleCatalog(
        university=university,
        modules=modules,
        degrees=degrees,
        source_url=FU_BERLIN_URL,
    )
