"""RWTH Aachen module catalog scraper.

Source: https://online.rwth-aachen.de/RWTHonline/WBRWTHMHB.WB_LIST
Status: SEED — hardcoded core BSc/MSc chemistry modules from the
published Modulhandbuch XML/PDF sources.

RWTH publishes machine-readable XML module handbooks via RWTHonline:
  BSc Chemie (2021): LoadXML(1886)
  MSc Chemie (2022): LoadXML(1894)
  MSc Sustainable Chemistry (2025): LoadXML(2048)
The XML endpoint requires JS session handling; this seed list covers
core modules from the published catalogs and study plans.
"""

from __future__ import annotations

import sys
from datetime import date
from pathlib import Path
from typing import Optional

sys.path.insert(0, str(Path(__file__).resolve().parent))

from schema import Degree, ModuleCatalog
from modulhandbuch_framework import make_module, make_university, save_catalog

RWTH_CHEMISTRY_URL = "https://www.chemie.rwth-aachen.de/"

# Core BSc chemistry modules at RWTH Aachen.
# Based on the published Modulhandbuch for B.Sc. Chemie (PO 2021).
# Format: (module_code, module_name, ects, level)
RWTH_BSC_MODULES = [
    ("RWTH-CH-B01", "Allgemeine Chemie", 8, "BSc"),
    ("RWTH-CH-B02", "Anorganische Chemie I", 6, "BSc"),
    ("RWTH-CH-B03", "Anorganische Chemie II", 6, "BSc"),
    ("RWTH-CH-B04", "Organische Chemie I", 6, "BSc"),
    ("RWTH-CH-B05", "Organische Chemie II", 6, "BSc"),
    ("RWTH-CH-B06", "Physikalische Chemie I", 6, "BSc"),
    ("RWTH-CH-B07", "Physikalische Chemie II", 6, "BSc"),
    ("RWTH-CH-B08", "Analytische Chemie", 5, "BSc"),
    ("RWTH-CH-B09", "Biochemie", 5, "BSc"),
    ("RWTH-CH-B10", "Theoretische Chemie", 5, "BSc"),
    ("RWTH-CH-B11", "Makromolekulare Chemie", 5, "BSc"),
    ("RWTH-CH-B12", "Technische Chemie", 5, "BSc"),
    ("RWTH-CH-B13", "Mathematik für Chemiker", 8, "BSc"),
    ("RWTH-CH-B14", "Physik für Chemiker", 8, "BSc"),
    ("RWTH-CH-B15", "Grundpraktikum Anorganische Chemie", 10, "BSc"),
    ("RWTH-CH-B16", "Grundpraktikum Organische Chemie", 10, "BSc"),
    ("RWTH-CH-B17", "Grundpraktikum Physikalische Chemie", 8, "BSc"),
    ("RWTH-CH-B18", "Bachelorarbeit", 12, "BSc"),
]

# Core MSc chemistry modules at RWTH Aachen (PO 2022).
# Based on the published Modulhandbuch and Fachgruppe Chemie pages.
# RWTH MSc Chemie uses four Profillinien (specialization tracks):
#   CAT = Catalysis, SYN = Synthesis, COS = Spectroscopy, MES = Materials
RWTH_MSC_MODULES = [
    ("RWTH-CH-M01", "Organometallic Chemistry and Homogeneous Catalysis", 5, "MSc"),
    ("RWTH-CH-M02", "Bioactive Compounds", 5, "MSc"),
    ("RWTH-CH-M03", "Bio- and Organocatalysis", 5, "MSc"),
    ("RWTH-CH-M04", "Optical Spectroscopy and Microscopy", 5, "MSc"),
    ("RWTH-CH-M05", "Surface and Interface Chemistry", 5, "MSc"),
    ("RWTH-CH-M06", "Bioorganic Chemistry", 5, "MSc"),
    ("RWTH-CH-M07", "Simulation von Festkörpern", 5, "MSc"),
    ("RWTH-CH-M08", "Sustainable Coordinative Polymerization Catalysis", 5, "MSc"),
    ("RWTH-CH-M09", "Diffraction Methods for Structure Determination", 3, "MSc"),
    ("RWTH-CH-M10", "Advanced Inorganic Chemistry", 5, "MSc"),
    ("RWTH-CH-M11", "Advanced Organic Chemistry", 5, "MSc"),
    ("RWTH-CH-M12", "Advanced Physical Chemistry", 5, "MSc"),
    ("RWTH-CH-M13", "Computational Chemistry", 5, "MSc"),
    ("RWTH-CH-M14", "Nanochemistry", 5, "MSc"),
    ("RWTH-CH-M15", "Polymer Chemistry", 5, "MSc"),
    ("RWTH-CH-M16", "Medicinal Chemistry", 5, "MSc"),
    ("RWTH-CH-M17", "Green Chemistry and Sustainability", 5, "MSc"),
    ("RWTH-CH-M18", "Research Project", 10, "MSc"),
    ("RWTH-CH-M19", "Masterarbeit", 30, "MSc"),
]


def scrape() -> Optional[ModuleCatalog]:
    """Seed-based scraper for RWTH Aachen chemistry modules."""
    total = len(RWTH_BSC_MODULES) + len(RWTH_MSC_MODULES)
    print(f"    [rwth_aachen] Building {len(RWTH_BSC_MODULES)} BSc + {len(RWTH_MSC_MODULES)} MSc = {total} seed modules")

    university = make_university(
        name="RWTH Aachen",
        country="DE",
        short_code="RWTH",
        city="Aachen",
        website="https://www.rwth-aachen.de/",
    )

    modules = []
    for code, name, ects, level in RWTH_BSC_MODULES + RWTH_MSC_MODULES:
        modules.append(
            make_module(
                short_code="RWTH",
                code=code,
                name=name,
                ects=float(ects),
                language="de",
                level=level,
                degree=f"{level} Chemistry (RWTH)",
                url="https://www.chemie.rwth-aachen.de/",
            )
        )

    degrees = [
        Degree(name="BSc in Chemistry", level="BSc", university_short_code="RWTH"),
        Degree(name="MSc in Chemistry", level="MSc", university_short_code="RWTH"),
    ]

    return ModuleCatalog(
        university=university,
        modules=modules,
        degrees=degrees,
        source_url=RWTH_CHEMISTRY_URL,
    )
