"""Stanford University — Department of Chemistry scraper.

Source: https://chemistry.stanford.edu/
Status: SEED-BASED (canonical courses from Stanford Bulletin)

Stanford uses a quarter system (Autumn, Winter, Spring) with unit-based
course credits. Standard chemistry courses are 3-5 units per quarter.
We approximate ECTS as 1 unit ≈ 1.5 ECTS.
"""

from __future__ import annotations

import sys
from datetime import date
from pathlib import Path
from typing import Optional

sys.path.insert(0, str(Path(__file__).resolve().parent))

from schema import Degree, Module, ModuleCatalog, University
from modulhandbuch_framework import make_module, make_university, save_catalog

STANFORD_CHEMISTRY_URL = "https://chemistry.stanford.edu/"
STANFORD_BULLETIN_URL = "https://bulletin.stanford.edu/departments/CHEMISTRY/courses"

# Hardcoded seed list of Stanford chemistry courses (undergraduate + graduate).
# Each entry: (course_code, course_name, units, level)
# Units × 1.5 ≈ ECTS (1 Stanford unit = 1 quarter-unit ≈ 1.5 ECTS)
STANFORD_COURSES = [
    # Introductory / Pre-major
    ("CHEM 11", "Foundational Concepts and Study Skills for General Chemistry", 3, "BSc"),
    ("CHEM 31A", "Chemical Principles I", 5, "BSc"),
    ("CHEM 31B", "Chemical Principles II", 5, "BSc"),
    ("CHEM 31E", "Chemical Foundations and 21st Century Problems", 5, "BSc"),
    ("CHEM 33", "Structure and Reactivity of Organic Molecules", 5, "BSc"),
    # Core upper-division undergraduate
    ("CHEM 121", "Understanding the Natural and Unnatural World through Chemistry", 5, "BSc"),
    ("CHEM 131", "Organic Chemistry I", 4, "BSc"),
    ("CHEM 132", "Organic Chemistry II", 4, "BSc"),
    ("CHEM 134", "Advanced Organic Chemistry", 3, "BSc"),
    ("CHEM 141", "Physical Chemistry I", 4, "BSc"),
    ("CHEM 142", "Physical Chemistry II", 4, "BSc"),
    ("CHEM 143", "Physical Chemistry III", 3, "BSc"),
    ("CHEM 151", "Inorganic Chemistry I", 4, "BSc"),
    ("CHEM 153", "Advanced Inorganic Chemistry", 3, "BSc"),
    ("CHEM 161", "Analytical Chemistry", 4, "BSc"),
    ("CHEM 171", "Instrumental Analysis Laboratory", 4, "BSc"),
    ("CHEM 185", "Biochemistry I", 4, "BSc"),
    ("CHEM 186", "Biochemistry II", 3, "BSc"),
    ("CHEM 190", "Advanced Undergraduate Research", 3, "BSc"),
    # Graduate courses
    ("CHEM 221", "Advanced Organic Chemistry I", 3, "MSc"),
    ("CHEM 222", "Advanced Organic Chemistry II", 3, "MSc"),
    ("CHEM 231", "Advanced Physical Chemistry I", 3, "MSc"),
    ("CHEM 232", "Advanced Physical Chemistry II", 3, "MSc"),
    ("CHEM 251", "Advanced Inorganic Chemistry", 3, "MSc"),
    ("CHEM 253", "Fundamentals of Inorganic Chemistry", 3, "MSc"),
    ("CHEM 261", "Advanced Analytical Chemistry", 3, "MSc"),
    ("CHEM 271", "Computational Chemistry", 3, "MSc"),
    ("CHEM 281", "Chemical Biology", 3, "MSc"),
    ("CHEM 300", "Department Colloquium", 1, "MSc"),
    ("CHEM 301", "Research in Chemistry", 2, "MSc"),
]


def _units_to_ects(units: int) -> float:
    """Convert Stanford quarter-units to approximate ECTS."""
    return round(units * 1.5, 1)


def scrape() -> Optional[ModuleCatalog]:
    """Scrape Stanford chemistry course catalog. Seed-based."""
    print(f"    [stanford] Building catalog from {len(STANFORD_COURSES)} seed modules")

    university = make_university(
        name="Stanford University",
        country="US",
        short_code="STANF",
        city="Stanford, CA",
        website="https://www.stanford.edu/",
    )

    modules = []
    for code, name, units, level in STANFORD_COURSES:
        ects = _units_to_ects(units)
        level_label = "BSc" if level == "BSc" else "MSc"
        modules.append(
            make_module(
                short_code="STANF",
                code=code.replace(" ", ""),
                name=name,
                ects=ects,
                language="en",
                level=level_label,
                degree=f"{level_label} Chemistry (Stanford)",
                url=f"https://chemistry.stanford.edu/academics/current-courses",
            )
        )

    degrees = [
        Degree(name="BSc in Chemistry", level="BSc", university_short_code="STANF"),
        Degree(name="PhD in Chemistry", level="MSc", university_short_code="STANF"),
        Degree(name="Coterminal MS in Chemistry", level="MSc", university_short_code="STANF"),
    ]

    return ModuleCatalog(
        university=university,
        modules=modules,
        degrees=degrees,
        source_url=STANFORD_BULLETIN_URL,
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
