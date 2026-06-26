"""Rheinland-Pfalz — Lehrplan Chemie (PDF-based).

Source (Sek I): https://static.bildung-rp.de/lehrplaene/naturwissenschaften/Biologie_Physik_Chemie_LP_SekI_neu.pdf
  Combined NW PDF (17MB) — need to filter for chemistry sections.

Sek II (MSS — Mainzer Studienstufe): separate PDF needed.
  Lehrpläne available via https://lehrplaene.bildung-rp.de/ (searchable database).
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
    "Sek I (alle Schularten, kombiniert NW)": "https://static.bildung-rp.de/lehrplaene/naturwissenschaften/Biologie_Physik_Chemie_LP_SekI_neu.pdf",
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
        if "Rheinland-Pfalz" in line and "Ministerium" in line:
            continue
        if line:
            cleaned.append(line)
    return "\n".join(cleaned)


# ── PDF download ───────────────────────────────────────────────────────────

def _fetch_pdf_text(url: str) -> str | None:
    try:
        resp = requests.get(url, headers={"User-Agent": USER_AGENT}, timeout=120)
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


# ── Combined NW PDF parser (Sek I) ─────────────────────────────────────────

def _parse_sek1_pdf(text: str) -> list[GradeLevel]:
    """Parse the combined Biologie/Chemie/Physik Sek I PDF.

    The PDF covers classes 5-10 across all school types.
    We need to extract chemistry-specific sections.
    """
    text = _normalize(text)
    grades: list[GradeLevel] = []

    # Try to split by grade bands
    grade_patterns = [
        (r"(Jahrgangsstufe\s*5[/-]?\s*6|Klassen\s*5\s*und\s*6|Doppeljahrgang\s*5/6)", "5/6"),
        (r"(Jahrgangsstufe\s*7[/-]?\s*8|Klassen\s*7\s*und\s*8|Doppeljahrgang\s*7/8)", "7/8"),
        (r"(Jahrgangsstufe\s*9[/-]?\s*10|Klassen\s*9\s*und\s*10|Doppeljahrgang\s*9/10)", "9/10"),
        (r"(Jahrgangsstufen\s*5\s*bis\s*6|Klassenstufe\s*5[/-]6)", "5/6"),
        (r"(Jahrgangsstufen\s*7\s*bis\s*8|Klassenstufe\s*7[/-]8)", "7/8"),
        (r"(Jahrgangsstufen\s*9\s*bis\s*10|Klassenstufe\s*9[/-]10)", "9/10"),
    ]

    grade_positions: list[tuple[int, str]] = []
    for pattern, label in grade_patterns:
        for m in re.finditer(pattern, text, re.IGNORECASE):
            grade_positions.append((m.start(), label))

    grade_positions.sort()

    if not grade_positions:
        # No grade sections found — extract all chemistry
        chemie_sections = _extract_chemie_sections(text)
        if chemie_sections:
            grades.append(GradeLevel(grade="Sek I", topics=chemie_sections))
        return grades

    for idx, (pos, label) in enumerate(grade_positions):
        end = grade_positions[idx + 1][0] if idx + 1 < len(grade_positions) else len(text)
        section = text[pos:end]
        topics = _extract_chemie_sections(section)
        if topics:
            grades.append(GradeLevel(grade=label, topics=topics))

    return grades


def _extract_chemie_sections(text: str) -> list[Topic]:
    """Extract chemistry-specific Topics from combined NW text."""
    topics: list[Topic] = []
    lines = text.split("\n")
    in_chemie = False
    current_chemie_section: list[str] = []

    for line in lines:
        line = _clean(line)
        if not line:
            continue

        lower = line.lower()

        # Detect subject headers — switch between Biologie/Chemie/Physik
        subject_match = re.match(r"^(Biologie|Chemie|Physik)\b", line, re.IGNORECASE)
        if subject_match:
            # Flush previous chemistry section
            if in_chemie and current_chemie_section:
                topics.extend(_parse_chemie_block(current_chemie_section))
                current_chemie_section = []
            in_chemie = "chemie" in subject_match.group(0).lower()
            if in_chemie:
                current_chemie_section.append(line)
            continue

        if in_chemie and line:
            current_chemie_section.append(line)

    # Flush last section
    if in_chemie and current_chemie_section:
        topics.extend(_parse_chemie_block(current_chemie_section))

    return topics


def _parse_chemie_block(lines: list[str]) -> list[Topic]:
    """Parse chemistry section into Topics."""
    topics: list[Topic] = []
    current_title = "Chemie"
    objectives: list[str] = []

    for line in lines:
        line = _clean(line)
        if not line:
            continue

        # Detect topic headers (capitalized short lines like "Aufbau der Materie")
        if (len(line) < 100 and re.match(r"^[A-ZÄÖÜ][a-zäöüß]", line)
                and not line.endswith(".") and not line.endswith(":")):
            # Save previous
            if objectives:
                topics.append(Topic(
                    title=current_title,
                    learning_objectives=[LearningObjective(text=o) for o in objectives]
                ))
                objectives = []
            current_title = line
        else:
            cleaned = re.sub(r"^[\s•–\- \d.()a-z)]+\s+", "", line).strip()
            if cleaned and len(cleaned) > 10:
                objectives.append(cleaned)

    if objectives:
        topics.append(Topic(
            title=current_title,
            learning_objectives=[LearningObjective(text=o) for o in objectives]
        ))

    return topics


# ── School-type parser ─────────────────────────────────────────────────────

def _parse_pdf(school_type: str, url: str) -> SchoolTypeCurriculum | None:
    print(f"    fetching {school_type} ...", end="", flush=True)

    text = _fetch_pdf_text(url)
    if text is None:
        print(" FAILED")
        return None

    print(f" {len(text)} chars")

    grades = _parse_sek1_pdf(text)

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
    """Scrape Rheinland-Pfalz chemistry curriculum."""
    print()

    school_curricula: list[SchoolTypeCurriculum] = []
    source_urls: list[str] = []

    for school_type, url in SCHOOL_PDFS.items():
        sc = _parse_pdf(school_type, url)
        if sc is not None:
            school_curricula.append(sc)
            source_urls.append(sc.source_url)

    if not school_curricula:
        return None

    return StateCurriculum(
        state="Rheinland-Pfalz",
        state_abbr="RP",
        school_curricula=school_curricula,
        last_updated=str(date.today()),
        source_urls=source_urls,
    )
