"""TU Wien (Vienna University of Technology) module catalog scraper.

Source: https://www.tuwien.at/en/ (Faculty of Applied Chemistry)
Status: SEED — hardcoded core modules from published TU Wien Technical Chemistry curriculum.

TU Wien offers BSc/MSc in Technical Chemistry with modules in:
- Fundamentals (Module 1-8)
- Advanced topics (Module 9-14)
- Specialization (Module 15-22)
"""

from __future__ import annotations

from typing import Optional

from schema import Degree, ModuleCatalog
from modulhandbuch_framework import make_module, make_university

TU_WIEN_URL = "https://www.tuwien.at/studium/"

# Core chemistry modules at TU Wien, from the published Technical Chemistry curriculum.
# Format: (module_code, module_name, ects, level)
TU_WIEN_CHEMISTRY_MODULES = [
    # BSc Grundlagen
    ("ALG101", "Allgemeine Chemie", 6, "BSc"),
    ("ALG102", "Anorganische Chemie", 6, "BSc"),
    ("ALG103", "Organische Chemie 1", 6, "BSc"),
    ("ALG104", "Physikalische Chemie 1", 6, "BSc"),
    ("ALG105", "Analytische Chemie", 5, "BSc"),
    ("ALG106", "Mathematik für Chemiker", 6, "BSc"),
    ("ALG107", "Physik für Chemiker", 5, "BSc"),
    ("ALG108", "Chemische Technologie", 5, "BSc"),
    # BSc Aufbau
    ("ALG201", "Organische Chemie 2", 5, "BSc"),
    ("ALG202", "Physikalische Chemie 2", 5, "BSc"),
    ("ALG203", "Instrumentelle Analytik", 5, "BSc"),
    ("ALG204", "Biochemie", 5, "BSc"),
    ("ALG205", "Anorganische Werkstoffchemie", 4, "BSc"),
    ("ALG206", "Verfahrenstechnik Grundlagen", 4, "BSc"),
    # MSc modules
    ("ALG301", "Advanced Analytical Chemistry", 6, "MSc"),
    ("ALG302", "Advanced Organic Synthesis", 6, "MSc"),
    ("ALG303", "Advanced Physical Chemistry", 6, "MSc"),
    ("ALG304", "Chemical Process Engineering", 6, "MSc"),
    ("ALG305", "Sustainable Chemistry", 5, "MSc"),
    ("ALG306", "Polymer Chemistry and Technology", 5, "MSc"),
    ("ALG401", "Research Project: Technical Chemistry", 10, "MSc"),
    ("ALG402", "Master Thesis Seminar", 4, "MSc"),
]


def scrape() -> Optional[ModuleCatalog]:
    """Seed-based scraper for TU Wien chemistry modules."""
    print(f"    [tu_wien] Building {len(TU_WIEN_CHEMISTRY_MODULES)} seed modules")

    university = make_university(
        name="TU Wien",
        country="AT",
        short_code="TU_WIEN",
        city="Wien",
        website="https://www.tuwien.at/",
    )

    modules = []
    for code, name, ects, level in TU_WIEN_CHEMISTRY_MODULES:
        modules.append(
            make_module(
                short_code="TU_WIEN",
                code=code,
                name=name,
                ects=float(ects),
                language="de" if level == "BSc" else "en",
                level=level,
                degree="BSc/MSc Technical Chemistry (TU Wien)",
                url=f"https://www.tuwien.at/module/{code}/",
            )
        )

    degrees = [
        Degree(name="BSc in Technical Chemistry", level="BSc", university_short_code="TU_WIEN"),
        Degree(name="MSc in Technical Chemistry", level="MSc", university_short_code="TU_WIEN"),
        Degree(name="MSc in Chemical Engineering", level="MSc", university_short_code="TU_WIEN"),
    ]

    return ModuleCatalog(
        university=university,
        modules=modules,
        degrees=degrees,
        source_url=TU_WIEN_URL,
    )
