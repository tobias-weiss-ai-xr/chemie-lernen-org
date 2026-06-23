#!/usr/bin/env python3
"""Quality gate for scraped curriculum output.

Called after each scrape to detect suspicious results:
  - 0 topics or 0 objectives → parser may have failed silently
  - >500 objectives in a single topic → text not split into topics
  - Suspiciously few grade levels for multi-year curricula
"""

from __future__ import annotations

import sys
from dataclasses import dataclass

from schema import StateCurriculum


@dataclass
class ValidationWarning:
    message: str
    severity: str = "warn"  # "warn" or "error"


def validate_curriculum(curriculum: StateCurriculum, state_key: str) -> list[ValidationWarning]:
    warnings: list[ValidationWarning] = []

    if not curriculum.school_curricula:
        warnings.append(ValidationWarning(
            f"[{state_key.upper()}] No school curricula scraped at all", "error",
        ))
        return warnings

    for sc in curriculum.school_curricula:
        if not sc.grade_levels:
            warnings.append(ValidationWarning(
                f"[{state_key.upper()}] {sc.school_type}: 0 grade levels", "warn",
            ))
            continue

        total_objectives = 0
        for gl in sc.grade_levels:
            if not gl.topics:
                warnings.append(ValidationWarning(
                    f"[{state_key.upper()}] {sc.school_type} grade {gl.grade}: 0 topics", "warn",
                ))
                continue

            for topic in gl.topics:
                obj_count = len(topic.learning_objectives)
                total_objectives += obj_count
                if obj_count == 0:
                    warnings.append(ValidationWarning(
                        f"[{state_key.upper()}] {sc.school_type} grade {gl.grade} "
                        f"topic '{topic.title}': 0 learning objectives", "warn",
                    ))
                elif obj_count > 500:
                    warnings.append(ValidationWarning(
                        f"[{state_key.upper()}] {sc.school_type} grade {gl.grade} "
                        f"topic '{topic.title[:40]}': {obj_count} objectives "
                        f"(>500, content may not be split into topics)", "warn",
                    ))

        if total_objectives == 0:
            warnings.append(ValidationWarning(
                f"[{state_key.upper()}] {sc.school_type}: 0 total objectives", "error",
            ))

    return warnings


def print_validation(warnings: list[ValidationWarning]) -> None:
    for w in warnings:
        prefix = "⚠️ " if w.severity == "warn" else "🔴 "
        print(f"{prefix}{w.message}")

    errors = [w for w in warnings if w.severity == "error"]
    if errors:
        print(f"  ❌ {len(errors)} error(s) found — check parser output")
