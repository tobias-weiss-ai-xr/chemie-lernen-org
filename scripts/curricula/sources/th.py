"""Thüringen — Lehrplan Chemie.

Source: https://www.schulportal-thueringen.de/media/detail?tspi=17952
Status: 💤 Not yet implemented — research needed.

Notes:
  - Thüringen publishes Lehrpläne on the Thüringer Schulportal
    (schulportal-thueringen.de).
  - Chemistry curriculum available for:
    - Regelschule (Sek I)
    - Gymnasium (Sek I + Sek II)
    - Gemeinschaftsschule (Sek I)
    - Berufliches Gymnasium
  - Published as PDF files.
  - The Schulportal has a "Lehrpläne" section with search functionality.
  - Thüringen also uses "Bildungsstandards" in addition to Lehrpläne.

Future work:
  - Find direct PDF URLs on schulportal-thueringen.de.
  - The Lehrpläne search may have structured output.
"""

from __future__ import annotations

from schema import StateCurriculum


async def scrape() -> StateCurriculum | None:
    """Scrape Thüringen chemistry curriculum — not yet implemented."""
    print("    NOT IMPLEMENTED — Thüringen (TH) needs URL research + PDF parser")
    return None
