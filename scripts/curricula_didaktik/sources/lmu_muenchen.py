"""LMU München module catalog scraper.

Source: https://www.cup.uni-muenchen.de/studium/
Status: SEED — hardcoded core BSc/MSc chemistry modules from the
published Modulhandbuch PDFs and study plans.

LMU publishes PDF Modulhandbücher at:
  MSc: https://cms-cdn.lmu.de/media/18-cup/.../mhb-lmu-masterchemie-18-03-2022_en.pdf
  BSc: https://cms-cdn.lmu.de/media/18-cup/.../mhb-bsccb_01-07-2024_en.pdf
Future work could add PDF parsing with pdfplumber.
"""

from __future__ import annotations

import sys
from datetime import date
from pathlib import Path
from typing import Optional

sys.path.insert(0, str(Path(__file__).resolve().parent))

from schema import Degree, ModuleCatalog
from modulhandbuch_framework import make_module, make_university, save_catalog

LMU_CUP_URL = "https://www.cup.uni-muenchen.de/studium/"

# Core BSc chemistry modules at LMU München (BSc Chemie und Biochemie).
# Based on the published Modulhandbuch and Stundenpläne.
# Format: (module_code, module_name, ects, level)
LMU_BSC_MODULES = [
    # Basis-Studium (Semester 1-4, compulsory)
    ("LMU-CH-B01", "Allgemeine Chemie", 10, "BSc"),
    ("LMU-CH-B02", "Anorganische Chemie I", 8, "BSc"),
    ("LMU-CH-B03", "Anorganische Chemie II", 8, "BSc"),
    ("LMU-CH-B04", "Organische Chemie I", 8, "BSc"),
    ("LMU-CH-B05", "Organische Chemie II", 8, "BSc"),
    ("LMU-CH-B06", "Physikalische Chemie I", 8, "BSc"),
    ("LMU-CH-B07", "Physikalische Chemie II", 8, "BSc"),
    ("LMU-CH-B08", "Analytische Chemie I", 5, "BSc"),
    ("LMU-CH-B09", "Analytische Chemie II", 5, "BSc"),
    ("LMU-CH-B10", "Biochemie", 8, "BSc"),
    ("LMU-CH-B11", "Experimentalphysik für Chemiker", 8, "BSc"),
    ("LMU-CH-B12", "Mathematik für Chemiker", 8, "BSc"),
    ("LMU-CH-B13", "Grundpraktikum Anorganische Chemie", 12, "BSc"),
    ("LMU-CH-B14", "Grundpraktikum Organische Chemie", 12, "BSc"),
    ("LMU-CH-B15", "Grundpraktikum Physikalische Chemie", 8, "BSc"),
    # Orientierungsstudium (Semester 5-6, WP modules)
    ("LMU-CH-W01", "Anorganische Chemie Vertiefung", 15, "BSc"),
    ("LMU-CH-W02", "Organische Chemie Vertiefung", 15, "BSc"),
    ("LMU-CH-W03", "Physikalische und Theoretische Chemie Vertiefung", 15, "BSc"),
    ("LMU-CH-W04", "Biochemie Vertiefung", 15, "BSc"),
    ("LMU-CH-B16", "Toxikologie und Rechtskunde", 3, "BSc"),
    ("LMU-CH-B17", "Bachelorarbeit", 12, "BSc"),
]

# Core MSc chemistry modules at LMU München.
# Based on the MSc Chemie Modulhandbuch (PO 2015).
# WP = Wahlpflicht (elective), each WP area has a lab module + lecture module.
LMU_MSC_MODULES = [
    # Schwerpunkte / Wahlpflichtbereiche
    ("LMU-CH-M01", "Anorganische Chemie Schwerpunkt Praktikum", 15, "MSc"),
    ("LMU-CH-M02", "Anorganische Chemie Schwerpunkt Vorlesungen", 15, "MSc"),
    ("LMU-CH-M03", "Organische Chemie Schwerpunkt Praktikum", 15, "MSc"),
    ("LMU-CH-M04", "Organische Chemie Schwerpunkt Vorlesungen", 15, "MSc"),
    ("LMU-CH-M05", "Physikalische Chemie Schwerpunkt Praktikum", 15, "MSc"),
    ("LMU-CH-M06", "Physikalische Chemie Schwerpunkt Vorlesungen", 15, "MSc"),
    ("LMU-CH-M07", "Theoretische Chemie Schwerpunkt Praktikum", 15, "MSc"),
    ("LMU-CH-M08", "Theoretische Chemie Schwerpunkt Vorlesungen", 15, "MSc"),
    # Ergänzungsfächer (subsidiary subjects, 15 ECTS each)
    ("LMU-CH-M09", "Strukturbiologie", 15, "MSc"),
    ("LMU-CH-M10", "Molekulare und zelluläre Genetik", 15, "MSc"),
    ("LMU-CH-M11", "Biologische Chemie", 15, "MSc"),
    ("LMU-CH-M12", "Biochemie Vertiefung MSc", 15, "MSc"),
    # Core modules
    ("LMU-CH-M13", "Forschungspraktikum Anorganische Chemie", 15, "MSc"),
    ("LMU-CH-M14", "Forschungspraktikum Organische Chemie", 15, "MSc"),
    ("LMU-CH-M15", "Forschungspraktikum Physikalische Chemie", 15, "MSc"),
    ("LMU-CH-M16", "Masterarbeit", 30, "MSc"),
]


def scrape() -> Optional[ModuleCatalog]:
    """Seed-based scraper for LMU München chemistry modules."""
    total = len(LMU_BSC_MODULES) + len(LMU_MSC_MODULES)
    print(f"    [lmu_muenchen] Building {len(LMU_BSC_MODULES)} BSc + {len(LMU_MSC_MODULES)} MSc = {total} seed modules")

    university = make_university(
        name="Ludwig-Maximilians-Universität München",
        country="DE",
        short_code="LMU",
        city="München",
        website="https://www.cup.uni-muenchen.de/",
    )

    modules = []
    for code, name, ects, level in LMU_BSC_MODULES + LMU_MSC_MODULES:
        modules.append(
            make_module(
                short_code="LMU",
                code=code,
                name=name,
                ects=float(ects),
                language="de",
                level=level,
                degree=f"{level} Chemistry and Biochemistry (LMU)",
                url=f"https://www.cup.uni-muenchen.de/studium/studiengaenge/",
            )
        )

    degrees = [
        Degree(name="BSc in Chemistry and Biochemistry", level="BSc", university_short_code="LMU"),
        Degree(name="MSc in Chemistry", level="MSc", university_short_code="LMU"),
    ]

    return ModuleCatalog(
        university=university,
        modules=modules,
        degrees=degrees,
        source_url=LMU_CUP_URL,
    )
