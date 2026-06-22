"""Berlin — Rahmenlehrplan Chemie.

Berlin shares a joint Rahmenlehrplan with Brandenburg for grades 1-10
(Teil C Chemie). The Oberstufe has a separate Berlin-specific curriculum.

This module uses the shared parser from _berlin_brandenburg.py.

TODO:
  - Berliner Oberstufe (Sek II) URL not yet found.
    Check: https://www.berlin.de/sen/bildung/unterricht/faecher-rahmenlehrplaene/
"""

from __future__ import annotations

from schema import StateCurriculum
from ._berlin_brandenburg import build_state_curriculum


async def scrape() -> StateCurriculum | None:
    """Scrape Berlin chemistry curriculum (joint RLP + TODO Oberstufe)."""
    print()
    return build_state_curriculum("Berlin", "BE")
