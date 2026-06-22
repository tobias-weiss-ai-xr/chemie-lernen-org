"""Niedersachsen — Kerncurriculum Chemie.

Source: https://www.nibis.de/
Status: 💤 Not yet implemented — research needed.

Notes:
  - Niedersachsen publishes Kerncurricula on the Niedersächsische
    Bildungscloud / NIBIS (Niedersächsischer Bildungsserver).
  - Chemistry curriculum available for:
    - Gymnasium (Sek I + Sek II / GOBS)
    - Realschule (Sek I)
    - Hauptschule (Sek I)
    - Oberschule (Sek I)
    - Integrierte Gesamtschule (Sek I)
    - Förderschule
  - Published as PDF files.
  - NIBIS has a dedicated "Kerncurricula" search portal.
  - Some updates occurred in 2023/2024 for G9.

Future work:
  - Explore nibis.de for direct PDF links.
  - The curriculum search portal may be API-accessible.
"""

from __future__ import annotations

from schema import StateCurriculum


async def scrape() -> StateCurriculum | None:
    """Scrape Niedersachsen chemistry curriculum — not yet implemented."""
    print("    NOT IMPLEMENTED — Niedersachsen (NI) needs URL research + PDF parser")
    return None
