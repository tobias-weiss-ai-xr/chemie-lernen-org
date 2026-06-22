"""Brandenburg — Rahmenlehrplan Chemie.

Source: https://bildungsserver.berlin-brandenburg.de/
Status: 💤 Not yet implemented — research needed.

Notes:
  - Berlin and Brandenburg share a joint Rahmenlehrplan for grades 1-10.
  - Same PDF resources as Berlin (see be.py).
  - Separate URL structure may exist for Brandenburg-specific content.
  - Kurssystem in Sek II is equivalent to Berlin.

Future work:
  - Reuse BE scraper with Brandenburg-specific base URLs.
"""

from __future__ import annotations

from schema import StateCurriculum


async def scrape() -> StateCurriculum | None:
    """Scrape Brandenburg chemistry curriculum — not yet implemented."""
    print("    NOT IMPLEMENTED — Brandenburg (BB) needs URL research + PDF parser")
    return None
