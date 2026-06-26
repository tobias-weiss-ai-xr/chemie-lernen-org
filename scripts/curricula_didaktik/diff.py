"""Checksum-based change detection for didactic guidelines."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


def compute_checksum(content: str) -> str:
    return hashlib.sha256(content.encode("utf-8")).hexdigest()


def load_checksums(output_dir: Path) -> dict[str, str]:
    path = output_dir / "checksums_didaktik.json"
    if path.exists():
        return json.loads(path.read_text(encoding="utf-8"))
    return {}


def save_checksums(checksums: dict[str, str], output_dir: Path) -> None:
    path = output_dir / "checksums_didaktik.json"
    path.write_text(
        json.dumps(checksums, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )
