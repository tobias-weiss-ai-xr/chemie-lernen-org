"""Sachsen — Lehrplan Chemie.

Source: https://www.schule.sachsen.de/
Status: 💤 Not yet implemented — research needed.

Notes:
  - Sachsen publishes Lehrpläne on schule.sachsen.de.
  - Chemistry curriculum available for:
    - Oberschule (grades 7-10)
    - Gymnasium (grades 7-12)
    - Berufliches Gymnasium
  - Published as PDF files organized by school type and grade.
  - The site has a "Lehrplandatenbank" search function.
  - Sachsen uses G8 (Abitur after grade 12).

Future work:
  - Find direct PDF URLs on schule.sachsen.de.
  - The Lehrplandatenbank may have an API or structured output.
  - SSL certificate issues were previously observed — may need verification.
"""

from __future__ import annotations

from schema import StateCurriculum


async def scrape() -> StateCurriculum | None:
    """Scrape Sachsen chemistry curriculum — not yet implemented."""
    print("    NOT IMPLEMENTED — Sachsen (SN) needs URL research + PDF parser")
    return None
