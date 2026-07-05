"""University of Tokyo — Department of Chemistry scraper.

Source: https://www.chem.s.u-tokyo.ac.jp/en/
Status: SEED-BASED (canonical courses from U-Tokyo Chemistry course catalog)

U-Tokyo uses a semester system. Undergraduate courses are typically
2 credits (90-min lecture/week for 15 weeks ≈ 2 ECTS). Graduate courses
use a similar credit system. We provide representative courses for
the chemistry BSci/MSci program.
"""

from __future__ import annotations

import sys
from datetime import date
from pathlib import Path
from typing import Optional

sys.path.insert(0, str(Path(__file__).resolve().parent))

from schema import Degree, Module, ModuleCatalog, University
from modulhandbuch_framework import make_module, make_university, save_catalog

UTOKYO_CHEMISTRY_URL = "https://www.chem.s.u-tokyo.ac.jp/en/"
UTOKYO_SYLLABUS_URL = "https://www.chem.s.u-tokyo.ac.jp/chem_UGS/schedules_en.php"

# Hardcoded seed list of University of Tokyo chemistry courses.
# Each entry: (course_code, course_name, japanese_credits, level)
# Japanese 1 credit ≈ 1 ECTS (15 weeks × 90 min = 22.5h, European 1 ECTS = 25-30h)
UTOKYO_COURSES = [
    # Undergraduate core lectures (学部)
    ("0530067", "Quantum Chemistry I (量子化学I)", 2, "BSc"),
    ("0530070", "Quantum Chemistry II (量子化学II)", 2, "BSc"),
    ("0530048", "Physical Chemistry I (物理化学I)", 2, "BSc"),
    ("0530049", "Physical Chemistry II (物理化学II)", 2, "BSc"),
    ("0530036", "Solid State Chemistry (固体化学)", 2, "BSc"),
    ("0530068", "Inorganic Chemistry I (無機化学I)", 2, "BSc"),
    ("0530071", "Inorganic Chemistry II (無機化学II)", 2, "BSc"),
    ("0530006", "Organic Chemistry I (有機化学I)", 2, "BSc"),
    ("0530007", "Organic Chemistry II (有機化学II)", 2, "BSc"),
    ("0530042", "Organic Chemistry III (有機化学III)", 2, "BSc"),
    ("0530010", "Analytical Chemistry (分析化学)", 2, "BSc"),
    ("0530053", "Structural Chemistry (構造化学)", 2, "BSc"),
    ("0530011", "Laboratory in Analytical/Inorganic Chemistry (分析化学無機化学実験)", 3, "BSc"),
    ("0530012", "Laboratory in Organic Chemistry (有機化学実験)", 3, "BSc"),
    ("0530013", "Laboratory in Physical Chemistry (物理化学実験)", 3, "BSc"),
    ("0530069", "Radiochemistry (放射化学)", 2, "BSc"),
    ("0530073", "Basic Academic English for Chemistry (基礎化学英語演習)", 1, "BSc"),
    # Graduate courses (大学院) — Advanced topics
    ("35606-0048", "Basic Physical Chemistry I (物理化学基礎I)", 2, "MSc"),
    ("35606-0049", "Basic Physical Chemistry II (物理化学基礎II)", 2, "MSc"),
    ("35606-0052", "Basic Inorganic/Analytical Chemistry I (無機・分析化学基礎I)", 2, "MSc"),
    ("35606-0053", "Basic Inorganic/Analytical Chemistry II (無機・分析化学基礎II)", 2, "MSc"),
    ("35606-0054", "Basic Organic Chemistry I (有機化学基礎I)", 2, "MSc"),
    ("35606-0055", "Basic Organic Chemistry II (有機化学基礎II)", 2, "MSc"),
    ("35606-0030", "Advanced Analytical Chemistry IV (分析化学特論IV)", 2, "MSc"),
    ("35606-0024", "Advanced Inorganic Chemistry VI (無機化学特論VI)", 2, "MSc"),
    ("35606-0066", "Special Topics in Organic Chemistry II (有機化学特論II)", 2, "MSc"),
    ("35606-0065", "Special Topics in Physical Chemistry II (物理化学特論II)", 2, "MSc"),
    ("35606-1110", "Frontiers in Advanced Technology I (先端科学技術特論I)", 2, "MSc"),
]


def scrape() -> Optional[ModuleCatalog]:
    """Scrape University of Tokyo chemistry module catalog. Seed-based."""
    print(f"    [u_tokyo] Building catalog from {len(UTOKYO_COURSES)} seed modules")

    university = make_university(
        name="The University of Tokyo",
        country="JP",
        short_code="UTOKYO",
        city="Tokyo",
        website="https://www.u-tokyo.ac.jp/en/",
    )

    modules = []
    for code, name, credits, level in UTOKYO_COURSES:
        modules.append(
            make_module(
                short_code="UTOKYO",
                code=code,
                name=name,
                ects=float(credits),
                language="ja",
                level=level,
                degree=f"{level} Chemistry (U-Tokyo)",
                url=f"https://www.chem.s.u-tokyo.ac.jp/chem_UGS/schedules_en.php",
            )
        )

    degrees = [
        Degree(name="BSc in Chemistry", level="BSc", university_short_code="UTOKYO"),
        Degree(name="MSc in Chemistry", level="MSc", university_short_code="UTOKYO"),
        Degree(name="PhD in Chemistry", level="MSc", university_short_code="UTOKYO"),
    ]

    return ModuleCatalog(
        university=university,
        modules=modules,
        degrees=degrees,
        source_url=UTOKYO_SYLLABUS_URL,
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
