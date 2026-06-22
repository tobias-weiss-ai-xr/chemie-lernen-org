"""Hessen — Kerncurriculum Chemie.

Source: https://kultusministerium.hessen.de/
Status: 💤 Not yet implemented — research needed.

Notes:
  - Hessen publishes Kerncurricula on the Hessisches Kultusministerium site.
  - Chemistry curriculum available for:
    - Hauptschule (Sek I)
    - Realschule (Sek I)
    - Gymnasium (Sek I + Sek II)
    - Mittelstufenschule (Sek I)
  - Published as PDF files organized by school type.
  - The site also has a "Bildungsstandards" section with competency tables.
  - Recently the KCGO (Kerncurriculum gymnasiale Oberstufe) was updated (2023+).

Future work:
  - Find direct PDF links on kultusministerium.hessen.de.
  - Consider PyMuPDF or pdfplumber for text extraction.
  - Hessischer Bildungsserver (bildungsstandards.hessen.de) may have HTML.
"""

from __future__ import annotations

from schema import StateCurriculum


async def scrape() -> StateCurriculum | None:
    """Scrape Hessen chemistry curriculum — not yet implemented."""
    print("    NOT IMPLEMENTED — Hessen (HE) needs URL research + PDF parser")
    return None
