"""Unified data model for didactic guidelines (KMK, Modulhandbücher, Prüfungsordnungen).

These are guidelines for chemistry teacher training at universities,
plus KMK national standards that inform curriculum design.

All sources are normalized into this schema and stored as JSON files.
"""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from datetime import date
from pathlib import Path
from typing import Optional


# ── Guideline Section ─────────────────────────────────────────────────────

@dataclass
class GuidelineSection:
    """A section within a didactic guideline document."""
    title: str
    content: list[str] = field(default_factory=list)
    subsections: list[GuidelineSection] = field(default_factory=list)

    def to_dict(self) -> dict:
        d = {"title": self.title}
        if self.content:
            d["content"] = self.content
        if self.subsections:
            d["subsections"] = [s.to_dict() for s in self.subsections]
        return d


# ── Didactic Guideline ────────────────────────────────────────────────────

@dataclass
class DidacticGuideline:
    """A didactic guideline document."""
    title: str
    source_type: str  # "KMK", "Modulhandbuch", "Prüfungsordnung", etc.
    institution: str  # e.g. "KMK", "Philipps-Universität Marburg"
    url: str
    sections: list[GuidelineSection] = field(default_factory=list)
    last_checked: str = ""

    def to_dict(self) -> dict:
        return {
            "title": self.title,
            "source_type": self.source_type,
            "institution": self.institution,
            "url": self.url,
            "sections": [s.to_dict() for s in self.sections],
            "last_checked": self.last_checked or date.today().isoformat(),
        }


# ── Didactic Dataset ──────────────────────────────────────────────────────

@dataclass
class DidacticDataset:
    """Complete didactic guidelines dataset."""
    guidelines: list[DidacticGuideline] = field(default_factory=list)
    last_updated: str = ""

    def to_dict(self) -> dict:
        return {
            "guidelines": [g.to_dict() for g in self.guidelines],
            "last_updated": self.last_updated or date.today().isoformat(),
        }


# ── Serialisation helpers ─────────────────────────────────────────────────

def write_dataset(dataset: DidacticDataset, output_dir: Path) -> Path:
    """Write didactic dataset to JSON file."""
    output_dir.mkdir(parents=True, exist_ok=True)
    path = output_dir / "didaktik.json"
    path.write_text(
        json.dumps(dataset.to_dict(), ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    return path
