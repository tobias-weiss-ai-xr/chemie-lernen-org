"""Schleswig-Holstein — Fachanforderungen Chemie.

Source: https://fachportal.lernnetz.de/sh/fachanforderungen.html
Status: 💤 Not yet implemented — research needed.

Notes:
  - Schleswig-Holstein publishes Fachanforderungen (curriculum framework)
    on the Landesportal (schleswig-holstein.de/bildungsplaene).
  - Chemistry Fachanforderungen available for:
    - Gemeinschaftsschule (Sek I)
    - Gymnasium (Sek I + Sek II)
  - Published as PDF files.
  - The site also has "Themenpläne" which provide weekly schedules.
  - The Bildungspläne site was restructured around 2022/2023.

Future work:
  - Find direct PDF URLs for Chemie Fachanforderungen.
  - Themenpläne may provide more granular topic breakdowns.
"""

from __future__ import annotations

from schema import StateCurriculum


async def scrape() -> StateCurriculum | None:
    """Scrape Schleswig-Holstein chemistry curriculum — not yet implemented."""
    print("    NOT IMPLEMENTED — Schleswig-Holstein (SH) needs URL research + PDF parser")
    return None
