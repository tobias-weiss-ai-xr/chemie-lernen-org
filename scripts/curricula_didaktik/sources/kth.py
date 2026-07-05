"""KTH Royal Institute of Technology — Chemistry/Engineering Chemistry scraper.

Source: https://www.kth.se/student/kurser/
Status: SEED-BASED (canonical modules from KTH course catalog for chemistry programmes)

KTH offers degree programmes in Engineering Chemistry (Civilingenjörsutbildning
i teknisk kemi, programme code CTKEM) and Chemical Engineering for Energy
and Environment (MSc). Courses use KE/KD/CK prefixed codes with ECTS.
"""

from __future__ import annotations

import sys
from datetime import date
from pathlib import Path
from typing import Optional

sys.path.insert(0, str(Path(__file__).resolve().parent))

from schema import Degree, Module, ModuleCatalog, University
from modulhandbuch_framework import make_module, make_university, save_catalog

KTH_CHEMISTRY_URL = "https://www.kth.se/student/kurser/programme/TTKEM"
KTH_COURSE_URL = "https://www.kth.se/student/kurser/"

# Hardcoded seed list of KTH chemistry/chemical engineering courses.
# Each entry: (course_code, course_name, ects, level)
# Source: KTH official course catalogue for Engineering Chemistry programme
KTH_COURSES = [
    # Year 1 — Basic chemistry and engineering
    ("KE1140", "Chemistry for Engineers", 9.0, "BSc"),
    ("KE1060", "Material and Energy Balances", 7.5, "BSc"),
    ("KE1080", "Chemical Engineering Principles", 7.5, "BSc"),
    ("KE1100", "Organic Chemistry", 9.0, "BSc"),
    ("KE1110", "Physical Chemistry", 9.0, "BSc"),
    ("KE1120", "Biochemistry", 6.0, "BSc"),
    # Year 2 — Core chemistry
    ("KE2080", "Analytical Chemistry", 7.5, "BSc"),
    ("KE2090", "Inorganic Chemistry", 6.0, "BSc"),
    ("KE2100", "Chemical Reaction Engineering", 7.5, "BSc"),
    ("KE2110", "Spectroscopic Methods", 6.0, "BSc"),
    ("KE2120", "Thermodynamics of Materials", 6.0, "BSc"),
    ("KE2130", "Separation Processes", 7.5, "BSc"),
    # Year 3 — Advanced topics
    ("CK1030", "Chemistry for Sustainable Development", 5.5, "BSc"),
    ("CK1165", "Materials Chemistry and Properties", 8.0, "BSc"),
    ("CK1175", "Chemical Process Engineering", 7.5, "BSc"),
    ("KE2150", "Polymer Chemistry", 6.0, "BSc"),
    ("KE2160", "Environmental Chemistry", 6.0, "BSc"),
    ("KE2200", "Degree Project in Chemistry", 15.0, "BSc"),
    # MSc level — Chemical Engineering for Energy and Environment
    ("KE2051", "Environmental Catalysis", 7.5, "MSc"),
    ("KE2052", "Electrochemical Energy Conversion", 7.5, "MSc"),
    ("KE2053", "Battery Technology", 7.5, "MSc"),
    ("KD2380", "Corrosion and Surface Protection", 7.5, "MSc"),
    ("KE2195", "Experimental Process Design", 7.5, "MSc"),
    ("KE2205", "Advanced Separation Processes", 7.5, "MSc"),
    ("KE2210", "Molecular Modelling in Chemistry", 6.0, "MSc"),
    ("KE2220", "Fuel Cells and Hydrogen Technology", 7.5, "MSc"),
    ("KE2300", "Degree Project in Chemical Engineering", 30.0, "MSc"),
]


def scrape() -> Optional[ModuleCatalog]:
    """Scrape KTH chemistry module catalog. Seed-based."""
    print(f"    [kth] Building catalog from {len(KTH_COURSES)} seed modules")

    university = make_university(
        name="KTH Royal Institute of Technology",
        country="SE",
        short_code="KTH",
        city="Stockholm",
        website="https://www.kth.se/",
    )

    modules = []
    for code, name, ects, level in KTH_COURSES:
        modules.append(
            make_module(
                short_code="KTH",
                code=code,
                name=name,
                ects=ects,
                language="en",
                level=level,
                degree=f"{level} Chemical Engineering (KTH)",
                url=f"https://www.kth.se/student/kurser/kurs/{code}?l=en",
            )
        )

    degrees = [
        Degree(name="BSc Chemical Engineering (Teknisk Kemi)", level="BSc", university_short_code="KTH"),
        Degree(name="MSc Chemical Engineering for Energy and Environment", level="MSc", university_short_code="KTH"),
    ]

    return ModuleCatalog(
        university=university,
        modules=modules,
        degrees=degrees,
        source_url=KTH_CHEMISTRY_URL,
        last_updated=date.today().isoformat(),
    )


if __name__ == "__main__":
    result = scrape()
    if result:
        out = Path(__file__).resolve().parent.parent.parent.parent / "myhugoapp" / "data" / "modulhandbuch"
        path = save_catalog(result, out)
        print(f"  → {path}")
    else:
        print("  → FAILED")
        exit(1)
