"""Sachsen-Anhalt — Fachlehrplan Chemie.

Source: https://www.bildung-lsa.de/
Status: 💤 Not yet implemented — research needed.

Notes:
  - Sachsen-Anhalt publishes Fachlehrpläne on bildung-lsa.de
    (Bildungsserver Sachsen-Anhalt).
  - Chemistry curriculum available for:
    - Sekundarschule (Sek I)
    - Gymnasium (Sek I + Sek II)
    - Gesamtschule (Sek I)
    - Förderschule
  - Published as PDF files.
  - The site has a "Lehrpläne" portal with structured navigation.

Future work:
  - Find direct PDF URLs on bildung-lsa.de.
  - May need to navigate the Lehrpläne portal hierarchy.
"""

from __future__ import annotations

from schema import StateCurriculum


async def scrape() -> StateCurriculum | None:
    """Scrape Sachsen-Anhalt chemistry curriculum — not yet implemented."""
    print("    NOT IMPLEMENTED — Sachsen-Anhalt (ST) needs URL research + PDF parser")
    return None
