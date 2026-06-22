"""Schleswig-Holstein — Fachanforderungen Chemie (PDF-based).

Source:
  Sek I + II: https://gymglinde.info/wp-content/uploads/2018/08/Fachanforderungen_Chemie_Sekundarstufen_I_II.pdf
  Portal: https://fachportal.lernnetz.de/sh/faecher/chemie/fachanforderungen.html

TODO:
  - Check for newer version on fachportal.lernnetz.de (IQ.SH).
  - Themenpläne (Themenplan Chemie) may provide more granular topic breakdowns.
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
    "Sekundarstufe I und II (Fachanforderungen)": (
        "https://gymglinde.info/wp-content/uploads/2018/08/"
        "Fachanforderungen_Chemie_Sekundarstufen_I_II.pdf"
    ),
}

PORTAL_URL = "https://fachportal.lernnetz.de/sh/faecher/chemie/fachanforderungen.html"


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
        if "Schleswig-Holstein" in line and "Ministerium" in line:
            continue
        if "Fachanforderungen" in line and "Chemie" in line:
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

def _parse_pdf(text: str) -> list[GradeLevel]:
    """Parse SH Fachanforderungen Chemie into grade levels."""
    text = _normalize(text)
    grades: list[GradeLevel] = []

    # Fachanforderungen cover Sek I (5-10) and Sek II (11-12/13)
    grade_patterns = [
        (r"(Sekundarstufe\s+I)", "Sek I"),
        (r"(Sekundarstufe\s+II)", "Sek II"),
        (r"(Jahrgangsstufe\s*5[/-]?\s*6|Doppeljahrgang\s*5/6)", "5/6"),
        (r"(Jahrgangsstufe\s*7[/-]?\s*8|Doppeljahrgang\s*7/8)", "7/8"),
        (r"(Jahrgangsstufe\s*9[/-]?\s*10|Doppeljahrgang\s*9/10)", "9/10"),
        (r"(Einführungsphase)", "E"),
        (r"(Qualifikationsphase)", "Q"),
    ]

    grade_positions: list[tuple[int, str]] = []
    for pattern, label in grade_patterns:
        for m in re.finditer(pattern, text, re.IGNORECASE):
            grade_positions.append((m.start(), label))

    grade_positions.sort()

    if not grade_positions:
        topics = _extract_topics(text)
        if topics:
            grades.append(GradeLevel(grade="Sek I + II", topics=topics))
        return grades

    for idx, (pos, label) in enumerate(grade_positions):
        end = grade_positions[idx + 1][0] if idx + 1 < len(grade_positions) else len(text)
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
    """Scrape Schleswig-Holstein chemistry curriculum."""
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

    source_urls.append(PORTAL_URL)

    return StateCurriculum(
        state="Schleswig-Holstein",
        state_abbr="SH",
        school_curricula=school_curricula,
        last_updated=str(date.today()),
        source_urls=source_urls,
    )
