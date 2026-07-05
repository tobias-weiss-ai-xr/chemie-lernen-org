"""KMK — Kultusministerkonferenz standards for chemistry education.

Sources (all verified PDF URLs):
  - Bildungsstandards Chemie MSA (2004):
    https://www.kmk.org/fileadmin/veroeffentlichungen_beschluesse/...
  - Bildungsstandards Chemie MSA (2024, weiterentwickelt):
    https://www.kmk.org/fileadmin/Dateien/veroeffentlichungen_beschluesse/...
  - Bildungsstandards Chemie AHR (2020):
    https://www.kmk.org/fileadmin/Dateien/veroeffentlichungen_beschluesse/...
  - Implementation brochure (2024):
    https://www.kmk.org/fileadmin/Dateien/pdf/Bildung/...
  - Kerncurriculum für Deutsche Schulen im Ausland (2024):
    https://www.kmk.org/fileadmin/Dateien/veroeffentlichungen_beschluesse/...
"""

from __future__ import annotations

import re
from datetime import date

import requests
import pdfplumber
import io

from schema import GuidelineSection, DidacticGuideline

USER_AGENT = "Mozilla/5.0 (compatible; chemie-lernen-org/1.0; +https://chemie-lernen.org)"

KMK_QUELLEN = [
    {
        "title": "Bildungsstandards im Fach Chemie für den Mittleren Schulabschluss (2004)",
        "description": (
            "KMK-Beschluss vom 16.12.2004. Definiert die Regelstandards, "
            "die Schüler am Ende der Klasse 10 (MSA) im Fach Chemie "
            "erreichen sollen."
        ),
        "url": (
            "https://www.kmk.org/fileadmin/veroeffentlichungen_beschluesse/"
            "2004/2004_12_16-Bildungsstandards-Chemie.pdf"
        ),
    },
    {
        "title": "Weiterentwickelte Bildungsstandards Chemie MSA (2024)",
        "description": (
            "KMK-Beschluss vom 13.06.2024. Ersetzt die Bildungsstandards "
            "von 2004. Enthält aktualisierte Kompetenzbereiche und "
            "Basiskonzepte für den Mittleren Schulabschluss."
        ),
        "url": (
            "https://www.kmk.org/fileadmin/Dateien/veroeffentlichungen_beschluesse/"
            "2024/2024_06_13-WeBiS_Chemie_MSA.pdf"
        ),
    },
    {
        "title": "Bildungsstandards im Fach Chemie für die Allgemeine Hochschulreife (2020)",
        "description": (
            "KMK-Beschluss vom 18.06.2020. Definiert die Standards "
            "für das Abitur im Fach Chemie (AHR)."
        ),
        "url": (
            "https://www.kmk.org/fileadmin/Dateien/veroeffentlichungen_beschluesse/"
            "2020/2020_06_18-BildungsstandardsAHR_Chemie.pdf"
        ),
    },
    {
        "title": "Kerncurriculum Chemie für die gymnasiale Oberstufe — Deutsche Schulen im Ausland",
        "description": (
            "KMK-Beschluss vom 01.03.2024. Leitet aus den AHR-Bildungsstandards "
            "fachspezifische Kerncurricula für den Unterricht an "
            "Deutschen Schulen im Ausland ab."
        ),
        "url": (
            "https://www.kmk.org/fileadmin/Dateien/veroeffentlichungen_beschluesse/"
            "2024/2024_03_01-Kerncurriculum-Chemie.pdf"
        ),
    },
    {
        "title": "Implementation der weiterentwickelten Bildungsstandards Naturwissenschaften (2024)",
        "description": (
            "Implementationsbroschüre zu den weiterentwickelten "
            "Bildungsstandards für Biologie, Chemie, Physik in der "
            "Sekundarstufe I (Beschluss vom 13.06.2024)."
        ),
        "url": (
            "https://www.kmk.org/fileadmin/Dateien/pdf/Bildung/Qualitaet/"
            "ImplBroschuere_BiSta_NATURWISSENSCHAFTEN_2024-06-06.pdf"
        ),
    },
]


def _fetch_pdf_text(url: str) -> str | None:
    """Download PDF and extract text."""
    try:
        resp = requests.get(url, headers={"User-Agent": USER_AGENT}, timeout=60)
        resp.raise_for_status()
        with pdfplumber.open(io.BytesIO(resp.content)) as pdf:
            all_text: list[str] = []
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    all_text.append(text)
        return "\n".join(all_text)
    except Exception as e:
        print(f"    [warn] KMK PDF fetch failed: {e}")
        return None


def _extract_sections(text: str) -> list[GuidelineSection]:
    """Parse KMK PDF into sections by their numbered headings.

    Typical structure:
      1 Einleitung
      2 Bildungsstandards für die Kompetenzbereiche im Fach Chemie
        2.1 Eingangsvoraussetzungen
        2.2 ...
    """
    sections: list[GuidelineSection] = []
    lines = text.split("\n")
    heading_pat = re.compile(r"^(\d+(?:\.\d+)*)\s+(.{3,})")
    current: GuidelineSection | None = None
    current_content: list[str] = []

    for line in lines:
        line = line.strip()
        if not line or len(line) < 4:
            continue

        m = heading_pat.match(line)
        if m:
            if current and current_content:
                current.content = [c for c in current_content if len(c) > 20]
            current = GuidelineSection(title=line)
            sections.append(current)
            current_content = []
            continue

        if current:
            current_content.append(line)

    if current and current_content:
        current.content = [c for c in current_content if len(c) > 20]

    return sections


def scrape() -> DidacticDataset | None:
    """Scrape KMK chemistry education standards from verified PDF URLs."""
    from schema import DidacticDataset

    print()

    guidelines: list[DidacticGuideline] = []

    for quelle in KMK_QUELLEN:
        title = quelle["title"]
        print(f"    fetching {title} ...", end="", flush=True)

        text = _fetch_pdf_text(quelle["url"])
        if text:
            print(f" {len(text)} chars")
            sections = _extract_sections(text)
            # Limit to first 30 sections to avoid massive output
            if len(sections) > 30:
                sections = sections[:30]
            print(f"      {len(sections)} section(s) extracted")
        else:
            print(" FAILED (PDF unavailable)")
            sections = [
                GuidelineSection(
                    title="Zusammenfassung",
                    content=[quelle["description"]],
                )
            ]

        guideline = DidacticGuideline(
            title=title,
            source_type="KMK",
            institution="Kultusministerkonferenz (KMK)",
            url=quelle["url"],
            sections=sections,
            last_checked=date.today().isoformat(),
        )

        guidelines.append(guideline)

    print(f"    {len(guidelines)} KMK guideline(s) recorded")
    return DidacticDataset(guidelines=guidelines)
