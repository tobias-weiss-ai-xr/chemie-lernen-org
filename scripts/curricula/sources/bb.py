"""Brandenburg — Rahmenlehrplan Chemie.

Brandenburg shares a joint Rahmenlehrplan with Berlin for grades 1-10
(Teil C Chemie). The Oberstufe has a separate Brandenburg-specific curriculum.

This module uses the shared parser from _berlin_brandenburg.py.

TODO:
  - Brandenburger Oberstufe (Sek II) URL not yet found.
    Check: https://bildungsserver.berlin-brandenburg.de/unterricht/rahmenlehrplaene/
"""

from __future__ import annotations

from schema import StateCurriculum
from ._berlin_brandenburg import build_state_curriculum


async def scrape() -> StateCurriculum | None:
    """Scrape Brandenburg chemistry curriculum (joint RLP + TODO Oberstufe)."""
    print()
    return build_state_curriculum("Brandenburg", "BB")
