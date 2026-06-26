"""Unified data model for German chemistry curricula (Bildungspläne).

All 16 Bundesländer curricula are normalized into this schema and
stored as JSON files consumed by Hugo for display.
"""

from __future__ import annotations

import json
from dataclasses import dataclass, field, asdict
from datetime import date
from pathlib import Path
from typing import Optional


# ── Learning Objective ────────────────────────────────────────────────────

@dataclass
class LearningObjective:
    """A single learning objective / competency expectation."""
    text: str
    level: Optional[str] = None  # Grundlage | Erweiterung | Vertiefung

    def to_dict(self) -> dict:
        d = {"text": self.text}
        if self.level:
            d["level"] = self.level
        return d


# ── Sub-Topic ─────────────────────────────────────────────────────────────

@dataclass
class SubTopic:
    """A sub-topic within a broader topic area."""
    title: str
    learning_objectives: list[LearningObjective] = field(default_factory=list)
    duration: Optional[str] = None  # e.g. "12 Stunden"

    def to_dict(self) -> dict:
        d = {"title": self.title}
        if self.learning_objectives:
            d["learning_objectives"] = [lo.to_dict() for lo in self.learning_objectives]
        if self.duration:
            d["duration"] = self.duration
        return d


# ── Topic ─────────────────────────────────────────────────────────────────

@dataclass
class Topic:
    """A curriculum topic comprising multiple sub-topics."""
    title: str
    sub_topics: list[SubTopic] = field(default_factory=list)
    learning_objectives: list[LearningObjective] = field(default_factory=list)
    duration: Optional[str] = None
    linked_entities: list[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        d = {"title": self.title}
        if self.sub_topics:
            d["sub_topics"] = [st.to_dict() for st in self.sub_topics]
        if self.learning_objectives:
            d["learning_objectives"] = [lo.to_dict() for lo in self.learning_objectives]
        if self.duration:
            d["duration"] = self.duration
        if self.linked_entities:
            d["linked_entities"] = self.linked_entities
        return d


# ── Grade Level ───────────────────────────────────────────────────────────

@dataclass
class GradeLevel:
    """One grade or multi-grade band within a school type."""
    grade: str  # e.g. "5/6", "7", "8", "9", "10", "EF", "Q1", "Q2"
    topics: list[Topic] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "grade": self.grade,
            "topics": [t.to_dict() for t in self.topics],
        }


# ── School-Type Curriculum ────────────────────────────────────────────────

@dataclass
class SchoolTypeCurriculum:
    """The full chemistry curriculum for one school type in one state."""
    school_type: str  # e.g. "Gymnasium", "Realschule", "Hauptschule"
    grade_levels: list[GradeLevel] = field(default_factory=list)
    source_url: str = ""
    last_checked: str = ""

    def to_dict(self) -> dict:
        d = {"school_type": self.school_type, "grade_levels": []}
        for gl in self.grade_levels:
            d["grade_levels"].append(gl.to_dict())
        if self.source_url:
            d["source_url"] = self.source_url
        if self.last_checked:
            d["last_checked"] = self.last_checked
        return d


# ── State Curriculum (top-level container) ────────────────────────────────

@dataclass
class StateCurriculum:
    """Complete curriculum data for one Bundesland."""
    state: str          # e.g. "Baden-Württemberg"
    state_abbr: str     # e.g. "BW"
    school_curricula: list[SchoolTypeCurriculum] = field(default_factory=list)
    last_updated: str = ""
    source_urls: list[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "state": self.state,
            "state_abbr": self.state_abbr,
            "school_curricula": [sc.to_dict() for sc in self.school_curricula],
            "last_updated": self.last_updated or date.today().isoformat(),
            "source_urls": self.source_urls,
        }


# ── Serialisation helpers ─────────────────────────────────────────────────

def write_curriculum(curriculum: StateCurriculum, output_dir: Path) -> Path:
    """Write a single state's curriculum to a JSON file.

    Returns the path written.
    """
    output_dir.mkdir(parents=True, exist_ok=True)
    path = output_dir / f"{curriculum.state_abbr.lower()}.json"
    path.write_text(
        json.dumps(curriculum.to_dict(), ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    return path


def write_index(states: list[StateCurriculum], output_dir: Path) -> Path:
    """Write a master index JSON listing all states with metadata."""
    index = []
    for s in states:
        index.append({
            "state": s.state,
            "state_abbr": s.state_abbr,
            "school_types": [sc.school_type for sc in s.school_curricula],
            "last_updated": s.last_updated,
        })
    path = output_dir / "index.json"
    path.write_text(
        json.dumps(index, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    return path


def curriculum_from_dict(data: dict) -> StateCurriculum:
    """Deserialise a StateCurriculum from a dict (read from JSON)."""
    sc_list = []
    for sc_data in data.get("school_curricula", []):
        gl_list = []
        for gl_data in sc_data.get("grade_levels", []):
            topic_list = []
            for t_data in gl_data.get("topics", []):
                st_list = []
                for st_data in t_data.get("sub_topics", []):
                    lo_list = [LearningObjective(**lo) for lo in st_data.get("learning_objectives", [])]
                    st_list.append(SubTopic(
                        title=st_data["title"],
                        learning_objectives=lo_list,
                        duration=st_data.get("duration"),
                    ))
                lo_list = [LearningObjective(**lo) for lo in t_data.get("learning_objectives", [])]
                topic_list.append(Topic(
                    title=t_data["title"],
                    sub_topics=st_list,
                    learning_objectives=lo_list,
                    duration=t_data.get("duration"),
                    linked_entities=t_data.get("linked_entities", []),
                ))
            gl_list.append(GradeLevel(
                grade=gl_data["grade"],
                topics=topic_list,
            ))
        sc_list.append(SchoolTypeCurriculum(
            school_type=sc_data["school_type"],
            grade_levels=gl_list,
            source_url=sc_data.get("source_url", ""),
            last_checked=sc_data.get("last_checked", ""),
        ))
    return StateCurriculum(
        state=data["state"],
        state_abbr=data["state_abbr"],
        school_curricula=sc_list,
        last_updated=data.get("last_updated", ""),
        source_urls=data.get("source_urls", []),
    )
