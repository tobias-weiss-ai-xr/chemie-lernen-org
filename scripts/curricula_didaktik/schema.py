"""Unified data model for didactic guidelines (KMK, Modulhandbücher,
Prüfungsordnungen) AND university module catalogs (Modulhandbücher).

All sources are normalized into this schema and stored as JSON files.
The module catalog data lives in myhugoapp/data/modulhandbuch/{university}.json.
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


# ═════════════════════════════════════════════════════════════════════════
#  Modulhandbuch (university module catalog) data model
# ═════════════════════════════════════════════════════════════════════════

@dataclass
class University:
    """A university offering a chemistry program."""
    name: str
    country: str
    city: str = ""
    website: str = ""
    short_code: str = ""

    def to_dict(self) -> dict:
        d = {"name": self.name, "country": self.country}
        if self.city:
            d["city"] = self.city
        if self.website:
            d["website"] = self.website
        if self.short_code:
            d["short_code"] = self.short_code
        return d


@dataclass
class Lecturer:
    """A professor or lecturer at a university."""
    name: str
    university_short_code: str
    title: str = ""
    email: str = ""
    orcid: str = ""

    def to_dict(self) -> dict:
        d = {"name": self.name, "university": self.university_short_code}
        if self.title:
            d["title"] = self.title
        if self.email:
            d["email"] = self.email
        if self.orcid:
            d["orcid"] = self.orcid
        return d


@dataclass
class ECTS:
    """ECTS credit allocation for a module."""
    credits: float
    workload_hours: int = 0

    def to_dict(self) -> dict:
        d = {"credits": self.credits}
        if self.workload_hours:
            d["workload_hours"] = self.workload_hours
        return d


@dataclass
class Degree:
    """A degree program a module belongs to."""
    name: str
    level: str
    university_short_code: str

    def to_dict(self) -> dict:
        return {
            "name": self.name,
            "level": self.level,
            "university": self.university_short_code,
        }


@dataclass
class ModuleOffering:
    """A specific instance of a module running in a given semester."""
    semester: str
    year: int
    lecturer_names: list[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "semester": self.semester,
            "year": self.year,
            "lecturers": self.lecturer_names,
        }


@dataclass
class Module:
    """A university course module."""
    university_short_code: str
    module_code: str
    module_name: str
    ects: float
    language: str = "de"
    level: str = "BSc"
    degree: str = ""
    url: str = ""
    learning_outcomes: list[str] = field(default_factory=list)
    content: list[str] = field(default_factory=list)
    prerequisites: list[str] = field(default_factory=list)
    examination: str = ""
    offerings: list[ModuleOffering] = field(default_factory=list)
    last_checked: str = ""

    def to_dict(self) -> dict:
        d = {
            "university": self.university_short_code,
            "module_code": self.module_code,
            "module_name": self.module_name,
            "ects": self.ects,
            "language": self.language,
            "level": self.level,
        }
        if self.degree:
            d["degree"] = self.degree
        if self.url:
            d["url"] = self.url
        if self.learning_outcomes:
            d["learning_outcomes"] = self.learning_outcomes
        if self.content:
            d["content"] = self.content
        if self.prerequisites:
            d["prerequisites"] = self.prerequisites
        if self.examination:
            d["examination"] = self.examination
        if self.offerings:
            d["offerings"] = [o.to_dict() for o in self.offerings]
        d["last_checked"] = self.last_checked or date.today().isoformat()
        return d


@dataclass
class ModuleCatalog:
    """The complete module catalog for one university."""
    university: University
    modules: list[Module] = field(default_factory=list)
    lecturers: list[Lecturer] = field(default_factory=list)
    degrees: list[Degree] = field(default_factory=list)
    source_url: str = ""
    last_updated: str = ""

    def to_dict(self) -> dict:
        return {
            "university": self.university.to_dict(),
            "degrees": [d.to_dict() for d in self.degrees],
            "lecturers": [l.to_dict() for l in self.lecturers],
            "modules": [m.to_dict() for m in self.modules],
            "source_url": self.source_url,
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


def write_module_catalog(catalog: ModuleCatalog, output_dir: Path) -> Path:
    """Write a module catalog to JSON file named after the university's short code."""
    output_dir.mkdir(parents=True, exist_ok=True)
    safe_code = catalog.university.short_code.lower().replace(" ", "_")
    path = output_dir / f"{safe_code}.json"
    path.write_text(
        json.dumps(catalog.to_dict(), ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    return path
