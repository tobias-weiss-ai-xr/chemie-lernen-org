"""KMK — Kultusministerkonferenz standards for chemistry education.

Sources:
  - Ländergemeinsame inhaltliche Anforderungen für die Fachwissenschaften
    und Fachdidaktiken in der Lehrerbildung (Beschluss der KMK)
  - Bildungsstandards im Fach Chemie für den Mittleren Schulabschluss
  - Bildungsstandards im Fach Chemie für die Allgemeine Hochschulreife

TODO:
  - Find direct PDF URLs for the actual KMK documents.
  - Current implementation returns metadata structure awaiting URL discovery.
"""

from __future__ import annotations

import re
from datetime import date

import requests

from schema import GuidelineSection, DidacticGuideline

USER_AGENT = "Mozilla/5.0 (compatible; chemie-lernen-org/1.0; +https://chemie-lernen.org)"

KMK_QUELLEN = [
    {
        "title": "Bildungsstandards im Fach Chemie für den Mittleren Schulabschluss",
        "description": (
            "KMK-Beschluss vom 04.12.2003, aktualisiert 2022. "
            "Definiert die Regelstandards, die Schüler am Ende der "
            "Klasse 10 (MSA) im Fach Chemie erreichen sollen."
        ),
        "url": "https://www.kmk.org/themen/allgemeinbildende-schulen/unterrichtsfaecher/chemie.html",
    },
    {
        "title": "Bildungsstandards im Fach Chemie für die Allgemeine Hochschulreife",
        "description": (
            "KMK-Beschluss vom 18.10.2012, aktualisiert 2020. "
            "Definiert die Standards für das Abitur im Fach Chemie."
        ),
        "url": "https://www.kmk.org/themen/allgemeinbildende-schulen/unterrichtsfaecher/chemie.html",
    },
    {
        "title": "Ländergemeinsame inhaltliche Anforderungen für die Fachwissenschaften "
                "und Fachdidaktiken in der Lehrerbildung",
        "description": (
            "KMK-Beschluss vom 16.10.2008, aktualisiert 2023. "
            "Legt die fachwissenschaftlichen und fachdidaktischen "
            "Mindestanforderungen für das Lehramtsstudium Chemie fest."
        ),
        "url": "https://www.kmk.org/themen/allgemeinbildende-schulen/unterrichtsfaecher/chemie.html",
    },
    {
        "title": "Kompetenzen der Naturwissenschaften — Basiskonzepte der Chemie",
        "description": (
            "Die KMK-Bildungsstandards definieren vier Basiskonzepte: "
            "Stoff-Teilchen, Struktur-Eigenschaft, Chemische Reaktion, "
            "Energie. Diese bilden die Grundlage der chemischen Bildung."
        ),
        "url": "https://www.kmk.org/themen/allgemeinbildende-schulen/unterrichtsfaecher/chemie.html",
    },
]


async def scrape() -> list[DidacticGuideline] | None:
    """Scrape KMK chemistry education standards.

    Currently returns structured metadata; PDF content extraction
    requires identifying direct document URLs on kmk.org.
    """
    print(f"    fetching KMK Chemie standards page ...", end="", flush=True)

    guidelines: list[DidacticGuideline] = []

    for quelle in KMK_QUELLEN:
        section = GuidelineSection(
            title="Zusammenfassung",
            content=[quelle["description"]],
        )

        guideline = DidacticGuideline(
            title=quelle["title"],
            source_type="KMK",
            institution="Kultusministerkonferenz (KMK)",
            url=quelle["url"],
            sections=[section],
            last_checked=date.today().isoformat(),
        )

        guidelines.append(guideline)

    # Try to fetch the KMK page for more detail
    try:
        resp = requests.get(
            KMK_QUELLEN[0]["url"],
            headers={"User-Agent": USER_AGENT},
            timeout=30,
        )
        print(f" HTTP {resp.status_code}")
    except requests.RequestException as e:
        print(f" page fetch failed: {e}")

    print(f"    {len(guidelines)} KMK guideline(s) recorded")
    return guidelines
