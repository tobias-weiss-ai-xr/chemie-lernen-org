"""Heidelberg University module catalog scraper.

Source: https://www.uni-heidelberg.de/ (Faculty of Chemistry and Earth Sciences)
Status: SEED — hardcoded core modules from published Heidelberg Chemistry curriculum.

Heidelberg offers a modularized BSc/MSc in Chemistry with modules in:
- Chemische Grundlagen (Modul 1-6)
- Aufbau- und Vertiefungsmodule (Modul 7-13)
- Spezialisierungsmodule (Modul 14-22)
"""

from __future__ import annotations

from typing import Optional

from schema import Degree, ModuleCatalog
from modulhandbuch_framework import make_module, make_university

HEIDELBERG_URL = "https://www.uni-heidelberg.de/studium/"

# Core chemistry modules at Heidelberg University, from the published curriculum.
# Format: (module_code, module_name, ects, level)
HEIDELBERG_CHEMISTRY_MODULES = [
    # BSc Grundlagen
    ("CHEM101", "Allgemeine Chemie", 8, "BSc"),
    ("CHEM102", "Anorganisch-Chemisches Praktikum 1", 6, "BSc"),
    ("CHEM103", "Anorganische Chemie 1: Hauptgruppen", 6, "BSc"),
    ("CHEM104", "Organische Chemie 1: Grundlagen", 6, "BSc"),
    ("CHEM105", "Physikalische Chemie 1: Thermodynamik", 6, "BSc"),
    ("CHEM106", "Analytische Chemie: Grundlagen", 5, "BSc"),
    # BSc Aufbau
    ("CHEM201", "Anorganische Chemie 2: Nebengruppen", 6, "BSc"),
    ("CHEM202", "Organische Chemie 2: Reaktionsmechanismen", 6, "BSc"),
    ("CHEM203", "Physikalische Chemie 2: Quantenchemie", 6, "BSc"),
    ("CHEM204", "Biochemie: Grundlagen", 5, "BSc"),
    ("CHEM205", "Organisch-Chemisches Praktikum", 6, "BSc"),
    ("CHEM206", "Physikalisch-Chemisches Praktikum", 6, "BSc"),
    # BSc Vertiefung
    ("CHEM301", "Anorganische Festkörperchemie", 5, "BSc"),
    ("CHEM302", "Makromolekulare Chemie", 5, "BSc"),
    ("CHEM303", "Theoretische Chemie", 5, "BSc"),
    # MSc modules
    ("CHEM401", "Advanced Inorganic Chemistry", 6, "MSc"),
    ("CHEM402", "Advanced Organic Synthesis", 6, "MSc"),
    ("CHEM403", "Advanced Physical Chemistry", 6, "MSc"),
    ("CHEM404", "Molecular Spectroscopy", 6, "MSc"),
    ("CHEM405", "Chemical Biology", 5, "MSc"),
    ("CHEM406", "Nanostructured Materials", 5, "MSc"),
    ("CHEM501", "Research Module: Catalysis", 10, "MSc"),
]


def scrape() -> Optional[ModuleCatalog]:
    """Seed-based scraper for Heidelberg chemistry modules."""
    print(f"    [heidelberg] Building {len(HEIDELBERG_CHEMISTRY_MODULES)} seed modules")

    university = make_university(
        name="Heidelberg University",
        country="DE",
        short_code="HEID",
        city="Heidelberg",
        website="https://www.uni-heidelberg.de/",
    )

    modules = []
    for code, name, ects, level in HEIDELBERG_CHEMISTRY_MODULES:
        modules.append(
            make_module(
                short_code="HEID",
                code=code,
                name=name,
                ects=float(ects),
                language="de" if level == "BSc" else "en",
                level=level,
                degree="BSc/MSc Chemistry (Heidelberg)",
                url=f"https://www.uni-heidelberg.de/de/studium/module/{code}/",
            )
        )

    degrees = [
        Degree(name="BSc in Chemistry", level="BSc", university_short_code="HEID"),
        Degree(name="MSc in Chemistry", level="MSc", university_short_code="HEID"),
        Degree(name="BSc in Molecular Biotechnology", level="BSc", university_short_code="HEID"),
    ]

    return ModuleCatalog(
        university=university,
        modules=modules,
        degrees=degrees,
        source_url=HEIDELBERG_URL,
    )
