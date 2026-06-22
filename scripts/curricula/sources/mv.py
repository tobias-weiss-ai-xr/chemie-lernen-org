"""Mecklenburg-Vorpommern — Rahmenplan Chemie.

Source: https://www.bildungsserver-mv.de/
Status: 💤 Not yet implemented — research needed.

Notes:
  - MV publishes Rahmenpläne on its Bildungsserver (bildung-mv.de).
  - Chemistry curriculum available for:
    - Regionale Schule (Sek I)
    - Gymnasium (Sek I + Sek II)
    - Integrierte Gesamtschule
  - Published as PDF files.
  - The site has a dropdown-style navigation for curricula.

Future work:
  - Find direct PDF URLs for Chemie Rahmenpläne.
  - Identify grade range for each school type.
"""

from __future__ import annotations

from schema import StateCurriculum


async def scrape() -> StateCurriculum | None:
    """Scrape Mecklenburg-Vorpommern chemistry curriculum — not yet implemented."""
    print("    NOT IMPLEMENTED — Mecklenburg-Vorpommern (MV) needs URL research + PDF parser")
    return None
