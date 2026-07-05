"""Imperial College London — Department of Chemistry scraper.

Source: https://www.imperial.ac.uk/chemistry/
Status: SEED-BASED (canonical modules from official programme specification)

Imperial's BSc Chemistry (F100) and MSci Chemistry (F103) share the
same core structure for Years 1 and 2. Year 3 BSc has Advanced Chemistry
Topics. Year 4 MSci has a full-year research project.

Module codes and credits sourced from the official programme specification.
"""

from __future__ import annotations

import sys
from datetime import date
from pathlib import Path
from typing import Optional

sys.path.insert(0, str(Path(__file__).resolve().parent))

from schema import Degree, Module, ModuleCatalog, University
from modulhandbuch_framework import make_module, make_university, save_catalog

IMPERIAL_CHEMISTRY_URL = "https://www.imperial.ac.uk/chemistry/"
IMPERIAL_BSC_URL = "https://www.imperial.ac.uk/study/courses/undergraduate/2026/chemistry-bsc/"
IMPERIAL_MSCI_URL = "https://www.imperial.ac.uk/study/courses/undergraduate/2026/chemistry-msci/"

# Hardcoded seed list of Imperial chemistry modules from official spec.
# Each entry: (module_code, module_name, ects, level, type)
IMPERIAL_MODULES = [
    # Year 1 (FHEQ Level 4) — Core
    ("CHEM40001", "i-Engage", 0.0, "BSc", "core"),
    ("CHEM40002", "Language of Chemistry", 5.0, "BSc", "core"),
    ("CHEM40004", "Structure and Bonding: Atomic Structure to Molecular Orbitals", 7.5, "BSc", "core"),
    ("CHEM40003", "Introduction to Spectroscopy", 5.0, "BSc", "core"),
    ("CHEM40006", "Reactivity at Carbon Centres", 7.5, "BSc", "core"),
    ("CHEM40007", "The Reactions Toolkit: Thermodynamics and Kinetics", 7.5, "BSc", "core"),
    ("CHEM40005", "Chemistry of the Elements: Hydrogen to Uranium", 5.0, "BSc", "core"),
    ("CHEM40008", "Practical Chemistry 1", 5.0, "BSc", "core"),
    # Year 1 — Electives
    ("CHEM40010", "Mathematics and Physics 1", 7.5, "BSc", "elective"),
    ("CHEM40009", "Medicinal Chemistry 1", 7.5, "BSc", "elective"),
    # Year 2 (FHEQ Level 5) — Core
    ("CHEM50002", "i-Engage 2", 0.0, "BSc", "core"),
    ("CHEM50003", "Electronic States and Bonding", 7.5, "BSc", "core"),
    ("CHEM50001", "Analysis of Molecules, Materials and Mixtures", 7.5, "BSc", "core"),
    ("CHEM50006", "Solids, Liquids and Interfaces", 5.0, "BSc", "core"),
    ("CHEM50005", "Chemistry of Molecular Systems", 7.5, "BSc", "core"),
    ("CHEM50011", "Macromolecules and Materials", 5.0, "BSc", "core"),
    ("CHEM50007", "Control and Selectivity in Molecular Synthesis", 5.0, "BSc", "core"),
    ("CHEM50004", "Practical Chemistry 2", 7.5, "BSc", "core"),
    # Year 2 — Electives
    ("CHEM50008", "Mathematics and Physics 2", 7.5, "BSc", "elective"),
    ("CHEM50009", "Medicinal Chemistry 2", 7.5, "BSc", "elective"),
    # Year 3 (FHEQ Level 6) — BSc Core
    ("CHEM60001", "Advanced Chemistry Topics 1", 15.0, "BSc", "core"),
    ("CHEM60003", "Advanced Chemistry Topics 2", 15.0, "BSc", "core"),
    ("CHEM60007", "Practical Chemistry 3 for BSc Chemistry", 15.0, "BSc", "core"),
    # Year 4 (FHEQ Level 7) — MSci Core
    ("CHEM70001", "MSci Research Project", 30.0, "MSc", "core"),
    ("CHEM70002", "Advanced Practical Chemistry", 15.0, "MSc", "core"),
    ("CHEM70003", "Advanced Chemistry Topics 3", 7.5, "MSc", "core"),
]


def scrape() -> Optional[ModuleCatalog]:
    """Scrape Imperial chemistry module catalog. Seed-based."""
    print(f"    [imperial] Building catalog from {len(IMPERIAL_MODULES)} seed modules")

    university = make_university(
        name="Imperial College London",
        country="GB",
        short_code="ICL",
        city="London",
        website="https://www.imperial.ac.uk/",
    )

    modules = []
    for code, name, ects, level, mod_type in IMPERIAL_MODULES:
        modules.append(
            make_module(
                short_code="ICL",
                code=code,
                name=name,
                ects=ects,
                language="en",
                level=level,
                degree=f"{'BSc' if level == 'BSc' else 'MSci'} Chemistry (Imperial)",
                url=f"https://www.imperial.ac.uk/chemistry/undergraduate/courses/",
            )
        )

    degrees = [
        Degree(name="BSc in Chemistry", level="BSc", university_short_code="ICL"),
        Degree(name="MSci in Chemistry", level="MSc", university_short_code="ICL"),
        Degree(name="MSci in Chemistry with Medicinal Chemistry", level="MSc", university_short_code="ICL"),
    ]

    return ModuleCatalog(
        university=university,
        modules=modules,
        degrees=degrees,
        source_url=IMPERIAL_BSC_URL,
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
