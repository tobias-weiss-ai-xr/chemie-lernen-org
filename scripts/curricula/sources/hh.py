"""Hamburg — Bildungsplan Chemie.

Source: https://bildungsplaene.bildungshamburg.de/
Status: 💤 Not yet implemented — research needed.

Notes:
  - Hamburg publishes its curricula at bildungsplaene.bildungshamburg.de.
  - The site is structured by school type and subject.
  - Known issue: the site uses a complex navigation tree and iFrame-based
    content loading. May need JS interaction or direct PDF links.
  - School types: Gymnasium (Sek I + Sek II), Stadtteilschule (Sek I + Sek II).
  - Chemistry content likely available from grade 7 onward.

Future work:
  - Identify direct PDF URLs for Chemie Bildungspläne.
  - Explore if HTML version exists for structured scraping.
"""

from __future__ import annotations

from schema import StateCurriculum


async def scrape() -> StateCurriculum | None:
    """Scrape Hamburg chemistry curriculum — not yet implemented."""
    print("    NOT IMPLEMENTED — Hamburg (HH) needs URL research + PDF parser")
    return None
