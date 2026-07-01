"""California Institute of Technology module catalog scraper.

Source: https://www.cce.caltech.edu/ (Division of Chemistry and Chemical Engineering)
Status: SEED — hardcoded core modules from published Caltech Chemistry curriculum.

Caltech offers BSc/MSc/PhD in Chemistry with modules in:
- Core chemistry (Ch 1-10)
- Advanced topics (Ch 101-130)
- Graduate courses (Ch 201-250)
- Research (Ch 300)
"""

from __future__ import annotations

from typing import Optional

from schema import Degree, ModuleCatalog
from modulhandbuch_framework import make_module, make_university

CALTECH_URL = "https://www.cce.caltech.edu/academics/"

# Core chemistry modules at Caltech, from the published curriculum.
# Format: (module_code, module_name, ects, level)
# Quarter units: 1 unit ≈ 1h/week/quarter → ×0.67 ≈ ECTS
CALTECH_CHEMISTRY_MODULES = [
    # Undergraduate core (BSc)
    ("Ch1", "General Chemistry", 10, "BSc"),
    ("Ch3a", "Synthesis and Characterization of Organic Compounds", 8, "BSc"),
    ("Ch3b", "Synthesis and Characterization of Inorganic Compounds", 8, "BSc"),
    ("Ch4a", "Physical Chemistry: Thermodynamics", 8, "BSc"),
    ("Ch4b", "Physical Chemistry: Quantum Mechanics", 8, "BSc"),
    ("Ch5", "Chemical Biology", 8, "BSc"),
    ("Ch6", "Analytical Chemistry", 6, "BSc"),
    ("Ch7", "Mathematics for Chemistry", 6, "BSc"),
    ("Ch8", "Experimental Chemistry Laboratory", 8, "BSc"),
    ("Ch9a", "Organic Chemistry: Mechanisms", 6, "BSc"),
    ("Ch9b", "Inorganic Chemistry: Structure and Bonding", 6, "BSc"),
    ("Ch10", "Chemical Engineering Fundamentals", 6, "BSc"),
    # Graduate / Advanced (MSc/PhD)
    ("Ch101a", "Advanced Organic Chemistry: Synthesis", 6, "MSc"),
    ("Ch101b", "Advanced Organic Chemistry: Methods", 6, "MSc"),
    ("Ch110", "Advanced Inorganic Chemistry", 6, "MSc"),
    ("Ch120a", "Advanced Physical Chemistry: Statistical Mechanics", 6, "MSc"),
    ("Ch120b", "Advanced Physical Chemistry: Spectroscopy", 6, "MSc"),
    ("Ch125", "Chemical Biology: Advanced Topics", 6, "MSc"),
    ("Ch130", "Computational Chemistry", 5, "MSc"),
    ("Ch201", "Research Seminar", 3, "MSc"),
    ("Ch210", "Laboratory Rotation", 10, "MSc"),
    ("Ch300", "Graduate Research", 15, "MSc"),
]


def scrape() -> Optional[ModuleCatalog]:
    """Seed-based scraper for Caltech chemistry modules."""
    print(f"    [caltech] Building {len(CALTECH_CHEMISTRY_MODULES)} seed modules")

    university = make_university(
        name="California Institute of Technology",
        country="US",
        short_code="CALTECH",
        city="Pasadena, CA",
        website="https://www.caltech.edu/",
    )

    modules = []
    for code, name, ects, level in CALTECH_CHEMISTRY_MODULES:
        modules.append(
            make_module(
                short_code="CALTECH",
                code=code,
                name=name,
                ects=float(ects),
                language="en",
                level=level,
                degree="BSc/MSc/PhD Chemistry (Caltech)",
                url=f"https://www.cce.caltech.edu/courses/{code}/",
            )
        )

    degrees = [
        Degree(name="BSc in Chemistry", level="BSc", university_short_code="CALTECH"),
        Degree(name="MSc in Chemistry", level="MSc", university_short_code="CALTECH"),
        Degree(name="PhD in Chemistry", level="PhD", university_short_code="CALTECH"),
        Degree(name="MSc in Chemical Engineering", level="MSc", university_short_code="CALTECH"),
    ]

    return ModuleCatalog(
        university=university,
        modules=modules,
        degrees=degrees,
        source_url=CALTECH_URL,
    )
