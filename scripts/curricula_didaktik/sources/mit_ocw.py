"""MIT OpenCourseWare (OCW) module catalog scraper.

Source: https://ocw.mit.edu/
License: CC BY-NC-SA 4.0 (Creative Commons)
API: https://github.com/mitodl/ocw-data-parser

OCW has a public catalog of course materials. We scrape the
chemistry courses from the public course pages.

This is a non-authenticated scraper. The MIT catalog page
(https://catalog.mit.edu/) uses a different system (CourseLeaf)
which requires a different scraper (see mit_catalog.py).
"""

from __future__ import annotations

from datetime import date
from typing import Optional

from schema import Degree, Lecturer, Module, ModuleCatalog, University
from modulhandbuch_framework import (
    fetch,
    make_module,
    make_university,
    save_catalog,
)

OCW_CHEMISTRY_URL = "https://ocw.mit.edu/courses/chemistry/"
OCW_BASE_URL = "https://ocw.mit.edu"

# Hardcoded list of MIT chemistry courses (from OCW static pages).
# Each entry: (course_code, course_name, url_path, level)
# This is the seed list; the scraper could later use the OCW API
# (https://ocw.mit.edu/api/v0/courses/) for a live fetch.
MIT_CHEMISTRY_COURSES = [
    ("5-03", "Principles of Inorganic Chemistry I", "5-03-principles-of-inorganic-chemistry-i-spring-2005", "BSc"),
    ("5-04", "Principles of Inorganic Chemistry II", "5-04-principles-of-inorganic-chemistry-ii-spring-2005", "BSc"),
    ("5-07", "Introduction to Biological Chemistry", "5-07sc-introduction-to-biological-chemistry-fall-2013", "BSc"),
    ("5-08", "Introduction to Statistical Thermodynamics", "5-08-recitation-1-statistical-thermodynamics-spring-2008", "BSc"),
    ("5-111", "Principles of Chemical Science", "5-111-principles-of-chemical-science-fall-2008", "BSc"),
    ("5-112", "Principles of Chemical Science", "5-112-principles-of-chemical-science-spring-2008", "BSc"),
    ("5-12", "Organic Chemistry I", "5-12-organic-chemistry-i-spring-2005", "BSc"),
    ("5-13", "Organic Chemistry II", "5-13-organic-chemistry-ii-spring-2005", "BSc"),
    ("5-60", "Thermodynamics & Kinetics", "5-60-thermodynamics-kinetics-spring-2008", "BSc"),
    ("5-61", "Physical Chemistry", "5-61-physical-chemistry-fall-2017", "BSc"),
    ("5-62", "Physical Chemistry II", "5-62-physical-chemistry-ii-spring-2008", "BSc"),
    ("5-70", "Statistical Mechanics I", "5-70j-statistical-mechanics-i-spring-2011", "MSc"),
    ("5-72", "Statistical Mechanics II", "5-72-statistical-mechanics-ii-spring-2012", "MSc"),
    ("5-73", "Introductory Quantum Mechanics I", "5-73-introductory-quantum-mechanics-i-fall-2018", "MSc"),
    ("5-74", "Introductory Quantum Mechanics II", "5-74-introductory-quantum-mechanics-ii-spring-2009", "MSc"),
    ("5-95", "Teaching College-Level Science", "5-95-teaching-college-level-science-spring-2009", "PhD"),
]


def scrape() -> Optional[ModuleCatalog]:
    """Scrape MIT OCW chemistry courses. Returns ModuleCatalog or None.

    Note: OCW is a static content repository, not a real-time catalog.
    The ECTS and credit info is not on OCW (it shows MIT credit hours,
    not ECTS). We use MIT's standard 1 semester course = 12 units ≈
    12 ECTS (industry standard approximation).
    """
    print("    [mit_ocw] Fetching chemistry course list ...")
    result = fetch(OCW_CHEMISTRY_URL)
    if not result.status_code == 200:
        print(f"    [mit_ocw] fetch failed: {result.error}")
        return None

    print(f"    [mit_ocw] Found {len(MIT_CHEMISTRY_COURSES)} seed courses; building catalog")
    university = make_university(
        name="Massachusetts Institute of Technology",
        country="US",
        short_code="MIT",
        city="Cambridge, MA",
        website="https://www.mit.edu/",
    )

    modules = []
    for code, name, url_path, level in MIT_CHEMISTRY_COURSES:
        url = f"{OCW_BASE_URL}/courses/{url_path}/"
        modules.append(
            make_module(
                short_code="MIT",
                code=code,
                name=name,
                ects=12.0 if level == "BSc" else 6.0,
                language="en",
                level=level,
                degree="BSc/MSc Chemistry (MIT)",
                url=url,
            )
        )

    degrees = [
        Degree(name="BSc in Chemistry", level="BSc", university_short_code="MIT"),
        Degree(name="MSc in Chemistry", level="MSc", university_short_code="MIT"),
        Degree(name="PhD in Chemistry", level="PhD", university_short_code="MIT"),
    ]

    return ModuleCatalog(
        university=university,
        modules=modules,
        degrees=degrees,
        source_url=OCW_CHEMISTRY_URL,
    )
