"""Bremen — Bildungsplan Chemie.

Source: https://www.bildung.bremen.de/
Status: 💤 Not yet implemented — research needed.

Notes:
  - Bremen publishes its curricula on the Bildungsserver Bremen.
  - Chemistry curriculum likely PDF-based.
  - School types: Oberschule, Gymnasium.
  - Site navigation is complex; direct URL discovery needed.

Future work:
  - Search for "Chemie" + "Bildungsplan" on bildung.bremen.de.
  - Identify PDF links for Sek I and Sek II.
"""

from __future__ import annotations

from schema import StateCurriculum


async def scrape() -> StateCurriculum | None:
    """Scrape Bremen chemistry curriculum — not yet implemented."""
    print("    NOT IMPLEMENTED — Bremen (HB) needs URL research + PDF parser")
    return None
