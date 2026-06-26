"""Mecklenburg-Vorpommern — Rahmenplan Chemie (PDF-based).

Source:
  Gymnasium Sek I (Klassen 7-10):
    https://www.regierung-mv.de/static/Regierungsportal/...
  Gymnasium Sek II (Klassen 11-12):
    https://www.bildung-mv.de/export/sites/bildungsserver/...

TODO:
  - Regionale Schule / Integrierte Gesamtschule URLs not yet found.
  - Fachgymnasium/Abendgymnasium (FG/AG) URL available but not yet scraped.
"""

from __future__ import annotations

import io
import re
from datetime import date

import requests
import pdfplumber

from schema import LearningObjective, Topic, GradeLevel, SchoolTypeCurriculum, StateCurriculum

# ── Configuration ──────────────────────────────────────────────────────────

USER_AGENT = "Mozilla/5.0 (compatible; chemie-lernen-org/1.0; +https://chemie-lernen.org)"

SCHOOL_PDFS: dict[str, str] = {
    "Gymnasium (Sek I, Klassen 7-10)": (
        "https://www.regierung-mv.de/static/Regierungsportal/"
        "Ministerium%20f%C3%BCr%20Bildung,%20Wissenschaft%20und%20Kultur/"
        "Dateien/RP_CHE_AHR%207-10.pdf"
    ),
    "Gymnasium (Sek II, Klassen 11-12)": (
        "https://www.bildung-mv.de/export/sites/bildungsserver/"
        ".galleries/dokumente/unterricht/rahmenplaene/"
        "RP_CHE_SEK2_erprobungsfassung.pdf"
    ),
}


# ── Text helpers ───────────────────────────────────────────────────────────

def _clean(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def _normalize(text: str) -> str:
    lines = text.split("\n")
    cleaned: list[str] = []
    for line in lines:
        line = line.strip()
        if re.match(r"^\d+$", line):
            continue
        if "Mecklenburg-Vorpommern" in line and "Ministerium" in line:
            continue
        if "Rahmenplan" in line and "Chemie" in line:
            continue
        if line:
            cleaned.append(line)
    return "\n".join(cleaned)


# ── PDF download ───────────────────────────────────────────────────────────

def _fetch_pdf_text(url: str) -> str | None:
    try:
        resp = requests.get(url, headers={"User-Agent": USER_AGENT}, timeout=60)
        resp.raise_for_status()
    except requests.RequestException as e:
        print(f"    [warn] PDF download failed: {url} — {e}")
        return None

    try:
        with pdfplumber.open(io.BytesIO(resp.content)) as pdf:
            all_text: list[str] = []
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    all_text.append(text)
        return "\n".join(all_text)
    except Exception as e:
        print(f"    [warn] PDF parsing failed: {url} — {e}")
        return None


# ── Parser ─────────────────────────────────────────────────────────────────

def _is_sek2(text: str) -> bool:
    first_quarter = text[: len(text) // 4]
    return "Qualifikationsphase" in first_quarter or "Einführungsphase" in first_quarter


def _parse_pdf(text: str) -> list[GradeLevel]:
    """Parse MV Rahmenplan Chemie PDF into grade levels."""
    text = _normalize(text)
    grades: list[GradeLevel] = []

    if _is_sek2(text):
        topics = _extract_topics(text)
        if topics:
            grades.append(GradeLevel(grade="Sek II", topics=topics))
        return grades
    else:
        grade_patterns = [
            (r"(Jahrgangsstufe\s*7)", "7"),
            (r"(Jahrgangsstufe\s*8)", "8"),
            (r"(Jahrgangsstufe\s*9)", "9"),
            (r"(Jahrgangsstufe\s*10)", "10"),
        ]

    grade_positions: list[tuple[int, str]] = []
    for pattern, label in grade_patterns:
        for m in re.finditer(pattern, text, re.IGNORECASE):
            grade_positions.append((m.start(), label))

    grade_positions.sort()

    if not grade_positions:
        topics = _extract_topics(text)
        if topics:
            grades.append(GradeLevel(grade="Sek I", topics=topics))
        return grades

    merged: list[tuple[int, str]] = [grade_positions[0]]
    for pos, label in grade_positions[1:]:
        if label != merged[-1][1] or pos - merged[-1][0] > 500:
            merged.append((pos, label))

    for idx, (pos, label) in enumerate(merged):
        end = merged[idx + 1][0] if idx + 1 < len(merged) else len(text)
        section = text[pos:end]
        topics = _extract_topics(section)
        if topics:
            grades.append(GradeLevel(grade=label, topics=topics))

    return grades


def _extract_topics(text: str) -> list[Topic]:
    """Extract topics and learning objectives."""
    topics: list[Topic] = []
    lines = text.split("\n")

    current_title: str | None = None
    current_objectives: list[str] = []

    for line in lines:
        line = _clean(line)
        if not line or len(line) < 5:
            continue
        if any(kw in line for kw in ["Seite", "Inhaltsverzeichnis"]):
            continue
        if re.match(r"^\d+$", line):
            continue

        m = re.match(r"^\s*(\d+)\s+(.{5,})", line)
        if m and len(m.group(2)) > 5 and not re.match(r"^\d", m.group(2)[0]):
            if current_title and current_objectives:
                los = [LearningObjective(text=o) for o in current_objectives]
                topics.append(Topic(title=current_title, learning_objectives=los))
            current_title = _clean(m.group(2))
            current_objectives = []
            continue

        if current_title:
            cleaned = re.sub(r"^[\s•–\- \d.()a-z)]+\s+", "", line).strip()
            if cleaned and len(cleaned) > 15:
                current_objectives.append(cleaned)

    if current_title and current_objectives:
        los = [LearningObjective(text=o) for o in current_objectives]
        topics.append(Topic(title=current_title, learning_objectives=los))

    return topics


# ── School-type parser ─────────────────────────────────────────────────────

def _parse_school_type(school_type: str, url: str) -> SchoolTypeCurriculum | None:
    print(f"    fetching {school_type} ...", end="", flush=True)

    text = _fetch_pdf_text(url)
    if text is None:
        print(" FAILED")
        return None

    print(f" {len(text)} chars")

    grades = _parse_pdf(text)

    if not grades:
        print("    no chemistry content extracted")
        return None

    for g in grades:
        print(f"    grade {g.grade}: {len(g.topics)} topic(s), "
              f"{sum(len(t.learning_objectives) for t in g.topics)} objectives")

    return SchoolTypeCurriculum(
        school_type=school_type,
        grade_levels=grades,
        source_url=url,
        last_checked=date.today().isoformat(),
    )


# ── Public API ─────────────────────────────────────────────────────────────

async def scrape() -> StateCurriculum | None:
    """Scrape Mecklenburg-Vorpommern chemistry curriculum."""
    print()

    school_curricula: list[SchoolTypeCurriculum] = []
    source_urls: list[str] = []

    for school_type, url in SCHOOL_PDFS.items():
        sc = _parse_school_type(school_type, url)
        if sc is not None:
            school_curricula.append(sc)
            source_urls.append(sc.source_url)

    if not school_curricula:
        return None

    return StateCurriculum(
        state="Mecklenburg-Vorpommern",
        state_abbr="MV",
        school_curricula=school_curricula,
        last_updated=str(date.today()),
        source_urls=source_urls,
    )
