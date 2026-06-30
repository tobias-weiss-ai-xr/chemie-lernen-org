"""TU München (TUM) module catalog scraper.

Sources:
  - TUMonline SPO tree (public HTML) for module codes, names, ECTS
  - TUMonline module handbook PDFs (public) for detailed descriptions
  - Fallback: seed data from the published Prüfungs- und Studienordnung

TUMonline endpoints used (public, no auth required):
  - SPO tree:    wbstpcs.showSpoTree?pStpStpNr={id}
  - MHB PDF:     wbModhbReport.downloadPublicMHBVersion?pOrgNr=1&pStpStpNr={id}[&pDocNr={doc}]
  - Module page: WBMODHB.wbShowMHBReadOnly?pKnotenNr={knoten}&pOrgNr=14180
"""

from __future__ import annotations

import re
import sys
from datetime import date
from pathlib import Path
from typing import Optional

sys.path.insert(0, str(Path(__file__).resolve().parent))

from schema import Degree, ModuleCatalog, Module
from modulhandbuch_framework import (
    fetch,
    make_module,
    make_university,
    parse_pdf,
    save_catalog,
)

TUM_CHEMISTRY_URL = "https://www.ch.tum.de/en/studies/"
TUMONLINE_BASE = "https://campus.tum.de/tumonline"

# TUMonline degree program IDs (StpStpNr) and SPO tree node IDs (StpKnotenNr)
# Knoten numbers are discovered from SPO tree URL patterns in TUMonline.
BSC_CHEMISTRY_ID = 5002      # B.Sc. Chemistry (SPO 20221)
BSC_CHEMISTRY_KNOTEN = 2939887  # SPO tree root node for B.Sc.
MSC_CHEMISTRY_ID = 5186      # M.Sc. Chemistry (SPO 20231)
MSC_CHEMISTRY_KNOTEN = 3430962  # SPO tree root node for M.Sc.

# Fallback seed data: core chemistry modules at TUM.
# Used only when SPO tree fetch fails.
# Format: (module_code, module_name, ects, level)
SEED_MODULES = [
    # BSc Grundlagen
    ("CH0101", "Allgemeine Chemie", 8, "BSc"),
    ("CH0102", "Anorganische Chemie I", 6, "BSc"),
    ("CH0103", "Organische Chemie I", 8, "BSc"),
    ("CH0104", "Physikalische Chemie I", 6, "BSc"),
    ("CH0105", "Analytische Chemie I", 5, "BSc"),
    # BSc Aufbau
    ("CH0201", "Anorganische Chemie II", 6, "BSc"),
    ("CH0202", "Organische Chemie II", 6, "BSc"),
    ("CH0203", "Physikalische Chemie II", 6, "BSc"),
    ("CH0204", "Analytische Chemie II", 5, "BSc"),
    ("CH0205", "Biochemie", 5, "BSc"),
    # BSc Vertiefung
    ("CH0301", "Makromolekulare Chemie", 5, "BSc"),
    ("CH0302", "Theoretische Chemie", 5, "BSc"),
    ("CH0303", "Chemische Technologie", 5, "BSc"),
    ("CH0304", "Chemisches Praktikum", 10, "BSc"),
    # MSc modules
    ("CH0401", "Advanced Inorganic Chemistry", 6, "MSc"),
    ("CH0402", "Advanced Organic Chemistry", 6, "MSc"),
    ("CH0403", "Advanced Physical Chemistry", 6, "MSc"),
    ("CH0404", "Advanced Analytical Chemistry", 6, "MSc"),
    ("CHE5001", "Chemical Biology", 5, "MSc"),
    ("CHE5002", "Supramolecular Chemistry", 5, "MSc"),
]

# Known M.Sc. Chemistry PDF document IDs for module handbooks
# pDocNr values from the download page (M.Sc. SPO2023)
MSC_PDF_DOCS = {
    "de": 27071595,  # Modulhandbuch_16100_20231_25S.pdf (German)
    "en": 29794679,  # module-catalog_TUM_NAT_MA-Chemistry-SPO2023_01-26.pdf (English)
}


def _spo_tree_url(stp_stp_nr: int, knoten_nr: int) -> str:
    return (
        f"{TUMONLINE_BASE}/wbstpcs.showSpoTree"
        f"?pStpKnotenNr={knoten_nr}&pStpStpNr={stp_stp_nr}"
    )


def _mhb_download_url(stp_stp_nr: int, p_doc_nr: Optional[int] = None) -> str:
    """Build module handbook download URL."""
    url = (
        f"{TUMONLINE_BASE}/wbModhbReport.downloadPublicMHBVersion"
        f"?pOrgNr=1&pStpStpNr={stp_stp_nr}"
    )
    if p_doc_nr:
        url += f"&pDocNr={p_doc_nr}"
    return url


def _parse_spo_tree_html(html: str) -> list[dict]:
    """Parse module codes, names, ECTS from TUMonline SPO tree HTML."""
    from bs4 import BeautifulSoup

    soup = BeautifulSoup(html, "html.parser")
    modules = []
    seen = set()

    # SPO tree rows have class "coTableR" for module entries.
    # Structure: <tr class="coTableR ...">
    #   <td class="L">[CODE] Name</td>
    #   <td class="L"></td>  (recommended semester)
    #   <td class="C"></td>  (spacer)
    #   <td class="R">ECTS</td>
    #   <td class="R">GF</td>
    for row in soup.find_all("tr", class_=re.compile(r"\bcoTableR\b")):
        cells = row.find_all("td", class_="L")
        if not cells:
            continue
        cell_html = str(cells[0])
        # Extract module code: [CHXXXX], [NATXXXX], [PHXXXX], [MEXXXX]
        m = re.search(r"\[((?:CH|NAT|PH|ME)\d+)\]", cell_html)
        if not m:
            continue
        code = m.group(1)
        # Extract German name (text after code, before next HTML tag)
        name_raw = cell_html.split(f"[{code}]")[-1]
        name = re.sub(r"<[^>]+>", "", name_raw).strip()
        name = re.sub(r"\s+", " ", name).strip()
        name = name.split("Alle Lehrveranstaltungen")[0].strip()
        name = re.sub(r"\s*\d+\s*$", "", name).strip()
        # Extract ECTS from the right-aligned cell (4th cell = index 3)
        ects = 0.0
        all_cells = row.find_all("td")
        if len(all_cells) >= 4:
            ects_cell = all_cells[3]
            try:
                ects = float(ects_cell.get_text(strip=True))
            except (ValueError, TypeError):
                pass
        if code not in seen and name:
            seen.add(code)
            modules.append({"code": code, "name": name, "ects": ects})

    return modules


def _fetch_spo_tree(stp_stp_nr: int, knoten_nr: int) -> Optional[list[dict]]:
    url = _spo_tree_url(stp_stp_nr, knoten_nr)
    print(f"    [tum] Fetching SPO tree (StpStpNr={stp_stp_nr})...")
    # Use German-language headers for module names
    import requests
    try:
        r = requests.get(url, headers={
            "User-Agent": (
                "Mozilla/5.0 (compatible; chemie-lernen.org/1.0; "
                "+https://chemie-lernen.org/modulhandbuch)"
            ),
            "Accept": "text/html",
            "Accept-Language": "de-DE,de;q=0.9,en;q=0.5",
        }, timeout=30)
        if r.status_code == 200:
            modules = _parse_spo_tree_html(r.text)
            if modules:
                print(f"    [tum] Parsed {len(modules)} modules from SPO tree")
                return modules
            print(f"    [tum] SPO tree returned but no modules parsed")
        else:
            print(f"    [tum] SPO tree fetch failed (HTTP {r.status_code})")
    except Exception as e:
        print(f"    [tum] SPO tree fetch error: {e}")
    return None


def _fetch_pdf_mhb(stp_stp_nr: int, p_doc_nr: int) -> Optional[list[str]]:
    """Attempt to fetch and parse a PDF module handbook."""
    url = _mhb_download_url(stp_stp_nr, p_doc_nr)
    print(f"    [tum] Fetching PDF MHB (doc={p_doc_nr})...")
    result = fetch(url, accept="application/pdf")
    if result.status_code == 200 and result.content_bytes:
        pages = parse_pdf(result.content_bytes)
        if pages:
            print(f"    [tum] Parsed {len(pages)} pages from PDF")
            return pages
        print(f"    [tum] PDF parsed but no text extracted")
    else:
        print(f"    [tum] PDF fetch failed (HTTP {result.status_code})")
    return None


def _extract_modules_from_pdf(pages: list[str], level: str) -> list[dict]:
    """Extract module descriptions from PDF text pages.

    TUMonline module handbook PDFs have a standard structure per module:
      [CHXXXX] Module Name | Module Name EN
      Module description...
      ECTS: N

    This is a best-effort parser; the PDF structure varies across versions.
    """
    modules = []
    text = "\n".join(pages)
    current_code = None
    current_name = None
    current_content = []

    for line in text.split("\n"):
        line = line.strip()
        if not line:
            continue

        # Module header: [CHXXXX] Name
        m = re.match(r"^\[((?:CH|NAT|PH|ME)\d+)\]\s+(.+)$", line)
        if m:
            # Save previous module
            if current_code and current_name:
                modules.append({
                    "code": current_code,
                    "name": current_name,
                    "content": current_content,
                    "level": level,
                })
            current_code = m.group(1)
            current_name = m.group(2).split("|")[0].strip()
            current_content = []
            continue

        if current_code:
            # Extract ECTS
            ects_m = re.search(r"ECTS[:\s]*(\d+(?:\.\d+)?)", line)
            # Collect content lines (skip boilerplate)
            if not ects_m and len(line) > 20:
                current_content.append(line)

    # Save last module
    if current_code and current_name:
        modules.append({
            "code": current_code,
            "name": current_name,
            "content": current_content,
            "level": level,
        })

    return modules


def _build_catalog_from_spo(
    bs_modules: list[dict],
    ms_modules: list[dict],
) -> ModuleCatalog:
    """Build a ModuleCatalog from SPO tree data."""
    university = make_university(
        name="TU München",
        country="DE",
        short_code="TUM",
        city="München",
        website="https://www.tum.de/",
    )

    catalog_modules: list[Module] = []
    seen_codes = set()

    for mod_list, level in [(bs_modules, "BSc"), (ms_modules, "MSc")]:
        for m in mod_list:
            code = m["code"]
            if code in seen_codes:
                continue
            seen_codes.add(code)

            name = m.get("name", "")
            # Skip generic "Accredited" placeholder entries
            if name.startswith("Accredited") or name.startswith("Anerkanntes"):
                continue

            catalog_modules.append(
                make_module(
                    short_code="TUM",
                    code=code,
                    name=name,
                    ects=m.get("ects", 0.0),
                    language="de",
                    level=level,
                    degree=f"{'BSc' if level == 'BSc' else 'MSc'} Chemistry (TUM)",
                    url=f"{TUMONLINE_BASE}/WBMODHB.wbShowMHBReadOnly?pOrgNr=14180",
                    content=m.get("content", []),
                )
            )

    degrees = [
        Degree(name="BSc in Chemistry", level="BSc", university_short_code="TUM"),
        Degree(name="MSc in Chemistry", level="MSc", university_short_code="TUM"),
    ]

    return ModuleCatalog(
        university=university,
        modules=catalog_modules,
        degrees=degrees,
        source_url=TUM_CHEMISTRY_URL,
        last_updated=date.today().isoformat(),
    )


def _build_fallback_catalog() -> ModuleCatalog:
    """Build catalog from hardcoded seed data when HTTP methods fail."""
    print(f"    [tum] Using seed fallback ({len(SEED_MODULES)} modules)")

    university = make_university(
        name="TU München",
        country="DE",
        short_code="TUM",
        city="München",
        website="https://www.tum.de/",
    )

    modules = []
    for code, name, ects, level in SEED_MODULES:
        modules.append(
            make_module(
                short_code="TUM",
                code=code,
                name=name,
                ects=float(ects),
                language="de" if level == "BSc" else "en",
                level=level,
                degree="BSc/MSc Chemistry (TUM)",
                url=f"https://www.ch.tum.de/en/module/{code}/",
            )
        )

    degrees = [
        Degree(name="BSc in Chemistry", level="BSc", university_short_code="TUM"),
        Degree(name="MSc in Chemistry", level="MSc", university_short_code="TUM"),
    ]

    return ModuleCatalog(
        university=university,
        modules=modules,
        degrees=degrees,
        source_url=TUM_CHEMISTRY_URL,
        last_updated=date.today().isoformat(),
    )


def scrape() -> Optional[ModuleCatalog]:
    """Scrape TUM chemistry catalog: SPO tree → seed fallback."""
    bs_modules = _fetch_spo_tree(BSC_CHEMISTRY_ID, BSC_CHEMISTRY_KNOTEN)
    ms_modules = _fetch_spo_tree(MSC_CHEMISTRY_ID, MSC_CHEMISTRY_KNOTEN)

    if bs_modules is not None or ms_modules is not None:
        bs_list = bs_modules or []
        ms_list = ms_modules or []
        print(
            f"    [tum] Catalog from SPO: "
            f"{len(bs_list)} BSc + {len(ms_list)} MSc modules"
        )
        return _build_catalog_from_spo(bs_list, ms_list)

    return _build_fallback_catalog()


if __name__ == "__main__":
    result = scrape()
    if result:
        print(f"\nCatalog: {len(result.modules)} modules, "
              f"{len(result.degrees)} degrees")
        for m in result.modules:
            print(f"  [{m.module_code}] {m.module_name} "
                  f"({m.ects} ECTS, {m.level})")
    else:
        print("Failed to scrape TUM catalog")
