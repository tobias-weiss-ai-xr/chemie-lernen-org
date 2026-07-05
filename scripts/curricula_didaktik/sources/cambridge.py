"""University of Cambridge — Natural Sciences Tripos (Chemistry) scraper.

Source: https://www.natsci.tripos.cam.ac.uk/
Status: SEED-BASED (canonical Tripos modules for chemistry pathway)

Chemistry at Cambridge is studied within the Natural Sciences Tripos.
The three-year BA (Hons) has Parts IA, IB, II; an optional fourth year
(Part III) leads to MSci. There are no standalone chemistry modules
with ECTS — the entire Part is the unit. We list the core chemistry
courses here with estimated ECTS based on contact hours.
"""

from __future__ import annotations

import sys
from datetime import date
from pathlib import Path
from typing import Optional

sys.path.insert(0, str(Path(__file__).resolve().parent))

from schema import Degree, Module, ModuleCatalog, University
from modulhandbuch_framework import make_module, make_university, save_catalog

CAMBRIDGE_CHEMISTRY_URL = "https://www.natsci.tripos.cam.ac.uk/"
CAMBRIDGE_UG_URL = "https://www.undergraduate.study.cam.ac.uk/courses/natural-sciences-ba-hons-msci"

# Hardcoded seed list of Cambridge chemistry pathway courses.
# Each entry: (course_code, course_name, ects, level, year_label)
# ECTS are approximate (1 Cambridge year = 120 UK CATS ≈ 60 ECTS;
# chemistry-specific courses are a fraction of the total Tripos).
CAMBRIDGE_COURSES = [
    # Part IA (Year 1) — Chemistry is one of 3 subjects + maths
    ("NST-IA-CHEM", "Chemistry A (Part IA) — Foundations of Chemical Reactivity", 12.0, "BSc", "Part IA"),
    # Part IB (Year 2) — Chemistry A (organic/physical) + Chemistry B (inorganic/physical)
    ("NST-IB-CHEMA", "Chemistry A (Part IB) — Organic & Physical Chemistry", 24.0, "BSc", "Part IB"),
    ("NST-IB-CHEMB", "Chemistry B (Part IB) — Inorganic & Physical Chemistry", 24.0, "BSc", "Part IB"),
    # Part II (Year 3) — Full-time chemistry specialisation
    ("NST-II-CHEM", "Chemistry (Part II) — Advanced Topics & Research Project", 60.0, "BSc", "Part II"),
    # Part III (Year 4, optional, leads to MSci)
    ("NST-III-CHEM", "Chemistry (Part III) — MSci Research Year", 60.0, "MSc", "Part III"),
]


def scrape() -> Optional[ModuleCatalog]:
    """Scrape Cambridge chemistry Tripos modules. Seed-based catalog."""
    print(f"    [cambridge] Building catalog from {len(CAMBRIDGE_COURSES)} seed modules")

    university = make_university(
        name="University of Cambridge",
        country="GB",
        short_code="CAM",
        city="Cambridge",
        website="https://www.cam.ac.uk/",
    )

    modules = []
    for code, name, ects, level, year_label in CAMBRIDGE_COURSES:
        modules.append(
            make_module(
                short_code="CAM",
                code=code,
                name=f"{name} [{year_label}]",
                ects=ects,
                language="en",
                level=level,
                degree=f"{level} Natural Sciences (Chemistry) — Cambridge",
                url=CAMBRIDGE_CHEMISTRY_URL,
            )
        )

    degrees = [
        Degree(name="BA (Hons) Natural Sciences (Chemistry)", level="BSc", university_short_code="CAM"),
        Degree(name="MSci Natural Sciences (Chemistry)", level="MSc", university_short_code="CAM"),
    ]

    return ModuleCatalog(
        university=university,
        modules=modules,
        degrees=degrees,
        source_url=CAMBRIDGE_UG_URL,
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
