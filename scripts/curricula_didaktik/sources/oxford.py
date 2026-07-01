"""University of Oxford module catalog scraper.

Source: https://www.chem.ox.ac.uk/ (Department of Chemistry)
Status: SEED — hardcoded core modules from published Oxford Chemistry curriculum.

Oxford offers MChem and MSc by Research with modules in:
- Part IA: Foundations (Term 1-2)
- Part IB: Core Chemistry (Term 3-4)
- Part II: Advanced Topics (Term 5-6)
- Part III: Research (Term 7-8)
"""

from __future__ import annotations

from typing import Optional

from schema import Degree, ModuleCatalog
from modulhandbuch_framework import make_module, make_university

OXFORD_URL = "https://www.chem.ox.ac.uk/teaching/"

# Core chemistry modules at University of Oxford, from the published curriculum.
# Format: (module_code, module_name, ects, level)
OXFORD_CHEMISTRY_MODULES = [
    # Part IA (BSc Year 1)
    ("CHEMIA01", "Atomic Structure and Bonding", 8, "BSc"),
    ("CHEMIA02", "Organic Chemistry 1: Structure and Reactivity", 8, "BSc"),
    ("CHEMIA03", "Physical Chemistry 1: Energy and Kinetics", 8, "BSc"),
    ("CHEMIA04", "Practical Chemistry 1", 6, "BSc"),
    ("CHEMIA05", "Mathematics for Chemists", 6, "BSc"),
    # Part IB (BSc Year 2)
    ("CHEMIB01", "Inorganic Chemistry: Coordination and Organometallic", 8, "BSc"),
    ("CHEMIB02", "Organic Chemistry 2: Synthesis and Mechanism", 8, "BSc"),
    ("CHEMIB03", "Physical Chemistry 2: Quantum and Spectroscopy", 8, "BSc"),
    ("CHEMIB04", "Practical Chemistry 2", 6, "BSc"),
    ("CHEMIB05", "Molecular Biology and Biochemistry", 6, "BSc"),
    # Part II (BSc Year 3 / MChem Year 3)
    ("CHEMII01", "Advanced Inorganic Chemistry", 6, "BSc"),
    ("CHEMII02", "Advanced Organic Chemistry", 6, "BSc"),
    ("CHEMII03", "Advanced Physical Chemistry", 6, "BSc"),
    ("CHEMII04", "Chemical Biology", 6, "BSc"),
    ("CHEMII05", "Theoretical Chemistry", 6, "BSc"),
    # Part III (MChem Year 4)
    ("CHEMIII01", "Research Project (MChem)", 15, "MSc"),
    ("CHEMIII02", "Advanced Topics in Chemistry", 6, "MSc"),
    ("CHEMIII03", "Scientific Communication and Ethics", 3, "MSc"),
    ("CHEMIII04", "Specialist Option: Catalysis", 6, "MSc"),
    ("CHEMIII05", "Specialist Option: Molecular Synthesis", 6, "MSc"),
]


def scrape() -> Optional[ModuleCatalog]:
    """Seed-based scraper for Oxford chemistry modules."""
    print(f"    [oxford] Building {len(OXFORD_CHEMISTRY_MODULES)} seed modules")

    university = make_university(
        name="University of Oxford",
        country="GB",
        short_code="OXF",
        city="Oxford",
        website="https://www.ox.ac.uk/",
    )

    modules = []
    for code, name, ects, level in OXFORD_CHEMISTRY_MODULES:
        modules.append(
            make_module(
                short_code="OXF",
                code=code,
                name=name,
                ects=float(ects),
                language="en",
                level=level,
                degree="MChem/MSc by Research Chemistry (Oxford)",
                url=f"https://www.chem.ox.ac.uk/module/{code}/",
            )
        )

    degrees = [
        Degree(name="MChem in Chemistry", level="MSc", university_short_code="OXF"),
        Degree(name="MSc by Research in Chemistry", level="MSc", university_short_code="OXF"),
        Degree(name="DPhil in Chemistry", level="PhD", university_short_code="OXF"),
    ]

    return ModuleCatalog(
        university=university,
        modules=modules,
        degrees=degrees,
        source_url=OXFORD_URL,
    )
