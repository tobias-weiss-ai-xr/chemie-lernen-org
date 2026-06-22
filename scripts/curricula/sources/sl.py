"""Saarland — Kernlehrplan Chemie.

Source: https://www.saarland.de/mbk/
Status: 💤 Not yet implemented — research needed.

Notes:
  - Saarland publishes Kernlehrpläne on the Ministerium für Bildung
    und Kultur website (saarland.de/mbk).
  - Chemistry curriculum available for:
    - Gemeinschaftsschule (Sek I)
    - Gymnasium (Sek I + Sek II)
  - Typically published as PDF files.
  - The mbk site has a "Lehrpläne" section with hierarchical navigation.

Future work:
  - Find direct URLs on saarland.de/mbk for Chemie Kernlehrpläne.
  - May need to navigate through the ministerial site structure.
"""

from __future__ import annotations

from schema import StateCurriculum


async def scrape() -> StateCurriculum | None:
    """Scrape Saarland chemistry curriculum — not yet implemented."""
    print("    NOT IMPLEMENTED — Saarland (SL) needs URL research + PDF parser")
    return None
