"""Rheinland-Pfalz — Lehrplan Chemie.

Source: https://lehrplaene.bildung-rp.de/
Status: 💤 Not yet implemented — research needed.

Notes:
  - Rheinland-Pfalz publishes Lehrpläne on lehrplaene.bildung-rp.de.
  - Chemistry curriculum available for:
    - Gymnasium (Sek I + MSS / Mainzer Studienstufe)
    - Realschule plus (Sek I)
    - Integrierte Gesamtschule (Sek I)
  - The site uses a hierarchical navigation (school form → subject → grade).
  - Content may be available as HTML or PDF.

Future work:
  - Check if lehrplaene.bildung-rp.de has HTML content or only PDFs.
  - The MSS (Mainzer Studienstufe) curriculum may be PDF-only.
"""

from __future__ import annotations

from schema import StateCurriculum


async def scrape() -> StateCurriculum | None:
    """Scrape Rheinland-Pfalz chemistry curriculum — not yet implemented."""
    print("    NOT IMPLEMENTED — Rheinland-Pfalz (RP) needs URL research")
    return None
