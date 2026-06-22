"""Berlin — Rahmenlehrplan Chemie (Berlin/Brandenburg joint curriculum).

Source: https://bildungsserver.berlin-brandenburg.de/
Status: 💤 Not yet implemented — research needed.

Notes:
  - Berlin and Brandenburg share a joint Rahmenlehrplan for grades 1-10.
  - Published as PDF on the Bildungsserver Berlin-Brandenburg.
  - Gymnasium (grades 11-12): separate PDF for the Sekundarstufe II.
  - Site structure is mostly PDF-based; some HTML overview pages exist.
  - Needs URL verification and PDF parsing setup.

Future work:
  - Identify correct PDF URLs for Sek I (grades 7-10) and Sek II (11-12).
  - Consider PyMuPDF or pdfplumber for PDF text extraction.
"""

from __future__ import annotations

from schema import StateCurriculum


async def scrape() -> StateCurriculum | None:
    """Scrape Berlin chemistry curriculum — not yet implemented."""
    print("    NOT IMPLEMENTED — Berlin (BE) needs URL research + PDF parser")
    return None
