"""Change detection for curriculum sources.

Uses content hashing to detect when a curriculum source has changed
since the last scrape. Only sources that changed are re-scraped.
"""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


CHECKSUMS_FILE = "checksums.json"


def load_checksums(data_dir: Path) -> dict[str, str]:
    """Load previous checksums from disk."""
    path = data_dir / CHECKSUMS_FILE
    if path.exists():
        return json.loads(path.read_text(encoding="utf-8"))
    return {}


def save_checksums(checksums: dict[str, str], data_dir: Path) -> None:
    """Persist checksums to disk."""
    path = data_dir / CHECKSUMS_FILE
    path.write_text(json.dumps(checksums, indent=2), encoding="utf-8")


def compute_checksum(content: str) -> str:
    """SHA-256 hash of source content."""
    return hashlib.sha256(content.encode("utf-8")).hexdigest()


def has_changed(source_key: str, content: str, checksums: dict[str, str]) -> bool:
    """True if this source's content differs from its previous checksum."""
    new_hash = compute_checksum(content)
    prev_hash = checksums.get(source_key)
    return new_hash != prev_hash


def mark_unchanged(source_key: str, checksums: dict[str, str]) -> str | None:
    """Return the persisted curriculum dict for an unchanged source, or None."""
    # This would require storing previous output — for now, orchestrator handles it.
    return None
