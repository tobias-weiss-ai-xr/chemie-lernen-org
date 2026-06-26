"""Niedersachsen — Kerncurriculum Chemie (PDF-based, NIBIS CuVo).

Source: https://cuvo.nibis.de/cuvo.php?p=download&upload=23 (Gymnasium Sek II)
        https://cuvo.nibis.de/index.php?p=download&upload=18 (Gymnasium Sek I NW)
        https://cuvo.nibis.de/index.php?p=download&upload=71 (Realschule NW)
        https://cuvo.nibis.de/index.php?p=download&upload=67 (Hauptschule NW)
        https://cuvo.nibis.de/index.php?p=download&upload=30 (Oberschule NW)

Structure (Sek II, upload=23):
  60-page PDF with Kompetenzen organized by:
  - Einführungsphase (intro phase, grade 11)
  - Qualifikationsphase (grades 12-13)
  - Content: Basiskonzepte (Stoff-Teilchen, Struktur-Eigenschaft, etc.)
  - Each section has inhaltsbezogene and prozessbezogene Kompetenzen

Sek I PDFs (upload=18, 71, 67, 30) are combined Naturwissenschaften
curricula — need to filter for chemistry-specific sections.
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

# NI school types and their PDF URLs
SCHOOL_PDFS: dict[str, str] = {
    "Gymnasium (Sek II)": "https://cuvo.nibis.de/cuvo.php?p=download&upload=23",
    "Gymnasium (Sek I)": "https://cuvo.nibis.de/index.php?p=download&upload=18",
    "Realschule": "https://cuvo.nibis.de/index.php?p=download&upload=71",
    "Hauptschule": "https://cuvo.nibis.de/index.php?p=download&upload=67",
    "Oberschule": "https://cuvo.nibis.de/index.php?p=download&upload=30",
}


# ── Text helpers ───────────────────────────────────────────────────────────

def _clean(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def _is_chemie_section(text: str) -> bool:
    """Check if a section of text is chemistry-relevant (for combined NW PDFs)."""
    chemie_keywords = [
        "chemie", "chemisch", "Stoff-Teilchen", "Stoffe", "Reaktion",
        "Atom", "Molekül", "Ion", "Element", "Verbindung",
        "Säure", "Base", "pH", "Redox", "Oxidation",
        "Kohlenwasserstoff", "Alkohol", "Ester",
        "Periodensystem", "PSE",
    ]
    lower = text.lower()
    for kw in chemie_keywords:
        if kw.lower() in lower:
            return True
    return False


def _is_header(text: str) -> bool:
    """Check if text looks like a section header."""
    patterns = [
        r"^\d+(\.\d+)*\s+",  # "3 Erwartete Kompetenzen"
        r"^[A-Z][a-zäöüß]+",  # Starts with capital word
        r"^Kompetenz", r"^Basiskonzept", r"^Themenfeld",
        r"^Einführungsphase", r"^Qualifikationsphase",
    ]
    for p in patterns:
        if re.match(p, text):
            return True
    return False


def _normalize(text: str) -> str:
    """Remove page numbers, headers, and other PDF artifacts."""
    lines = text.split("\n")
    cleaned = []
    for line in lines:
        line = line.strip()
        # Skip page numbers
        if re.match(r"^\d+$", line):
            continue
        # Skip header line
        if "Niedersächsisches Kultusministerium" in line:
            continue
        if line:
            cleaned.append(line)
    return "\n".join(cleaned)


# ── PDF download ───────────────────────────────────────────────────────────

def _fetch_pdf_text(url: str) -> str | None:
    """Download a PDF and extract all text via pdfplumber."""
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


# ── Sek II parser (upload=23 — pure Chemie curriculum) ────────────────────

def _parse_sek2_pdf(text: str) -> list[GradeLevel]:
    """Parse the Gymnasium Oberstufe Chemie PDF.

    Structure:
      - Einführungsphase (grade 11)
      - Qualifikationsphase (grades 12-13)
      - Each phase has topics organized by Basiskonzepte
    """
    text = _normalize(text)
    grades: list[GradeLevel] = []

    # Split into Einführungsphase and Qualifikationsphase
    ef_start = text.find("Einführungsphase")
    qp_start = text.find("Qualifikationsphase")

    sections: list[tuple[str, str]] = []
    if ef_start >= 0:
        ef_text = text[ef_start:qp_start] if qp_start > ef_start else text[ef_start:]
        sections.append(("Einführungsphase", ef_text))
    if qp_start >= 0:
        qp_text = text[qp_start:]
        sections.append(("Qualifikationsphase", qp_text))

    for phase, phase_text in sections:
        topics = _extract_topics_from_section(phase_text)
        grade = "EF" if "Einführungsphase" in phase else "Q1-Q4"
        if topics:
            grades.append(GradeLevel(grade=grade, topics=topics))

    return grades


def _extract_topics_from_section(text: str) -> list[Topic]:
    """Extract Topics with LearningObjectives from a curriculum section.

    Looks for Basiskonzept headers and their associated objectives.
    """
    topics: list[Topic] = []
    # Split by Basiskonzept headers
    parts = re.split(r"(Basiskonzept\s+[^\n]+)", text)
    
    i = 1
    while i < len(parts):
        header = _clean(parts[i])
        body = parts[i + 1] if i + 1 < len(parts) else ""
        
        # Extract objectives: look for bullet points, numbered items, or sentences
        objectives: list[str] = []
        for line in body.split("\n"):
            line = _clean(line)
            if not line or len(line) < 10:
                continue
            # Skip section headers
            if _is_header(line) and any(k in line for k in ["Kompetenz", "Themenfeld", "Anhang"]):
                continue
            # Skip table of contents entries
            if re.match(r"^\d+\s{2,}", line):
                continue
            # Remove leading numbering
            cleaned = re.sub(r"^[\s•–\- \d.()a-z)]+\s+", "", line).strip()
            if cleaned and len(cleaned) > 15 and not cleaned.startswith("Seite"):
                objectives.append(cleaned)

        if objectives:
            topic_title = _clean(header)
            los = [LearningObjective(text=obj) for obj in objectives]
            topics.append(Topic(title=topic_title, learning_objectives=los))
        
        i += 2

    return topics


# ── Sek I parser (combined NW PDFs — need to filter for Chemie) ──────────

def _parse_sek1_pdf(text: str, school_type: str) -> list[GradeLevel]:
    """Parse a combined Naturwissenschaften PDF for chemistry content.

    These PDFs cover Biologie, Chemie, Physik together.
    We need to find and extract only the chemistry sections.
    """
    text = _normalize(text)
    grades: list[GradeLevel] = []

    # Try to split by grade levels
    grade_patterns = [
        (r"(Jahrgang\s*5[/-]?6)", "5/6"),
        (r"(Jahrgang\s*7[/-]?8)", "7/8"),
        (r"(Jahrgang\s*9[/-]?10)", "9/10"),
        (r"(Jahrgangsstufe\s+5[/-]?6)", "5/6"),
        (r"(Jahrgangsstufe\s+7[/-]?8)", "7/8"),
        (r"(Jahrgangsstufe\s+9[/-]?10)", "9/10"),
        (r"(Klassenstufe\s+5[/-]?6)", "5/6"),
        (r"(Klassenstufe\s+7[/-]?8)", "7/8"),
        (r"(Klassenstufe\s+9[/-]?10)", "9/10"),
    ]

    # Find grade sections
    grade_positions: list[tuple[int, str]] = []
    for pattern, label in grade_patterns:
        for m in re.finditer(pattern, text, re.IGNORECASE):
            grade_positions.append((m.start(), label))

    grade_positions.sort()
    
    if not grade_positions:
        # No grade sections found — just extract chemistry content from whole text
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

    # Look for "Chemie" headers or mentions
    lines = text.split("\n")
    current_chemie_section: list[str] = []
    in_chemie = False
    in_subject = False

    for line in lines:
        line = _clean(line)
        if not line:
            continue

        # Detect subject switch
        lower = line.lower()
        if re.match(r"^(Biologie|Chemie|Physik)\s", line, re.IGNORECASE):
            # Switching subjects
            if in_chemie and current_chemie_section:
                topics.extend(_parse_chemie_block(current_chemie_section))
                current_chemie_section = []
            in_chemie = "chemie" in lower
            if not re.match(r"^Chemie\s", line, re.IGNORECASE):
                in_subject = False
            else:
                in_subject = True
                current_chemie_section.append(line)
        elif in_chemie:
            current_chemie_section.append(line)

    # Don't forget last section
    if in_chemie and current_chemie_section:
        topics.extend(_parse_chemie_block(current_chemie_section))

    return topics


def _parse_chemie_block(lines: list[str]) -> list[Topic]:
    """Parse a block of chemistry text into Topics."""
    topics: list[Topic] = []
    current_title = "Chemie"
    objectives: list[str] = []

    for line in lines:
        line = _clean(line)
        if not line:
            continue
        # Check if this looks like a topic header
        if _is_header(line) and len(line) < 100:
            if objectives:
                los = [LearningObjective(text=o) for o in objectives]
                topics.append(Topic(title=current_title, learning_objectives=los))
                objectives = []
            current_title = line
        else:
            # Remove numbering
            cleaned = re.sub(r"^[\s•–\- \d.()a-z)]+\s+", "", line).strip()
            if cleaned and len(cleaned) > 10:
                objectives.append(cleaned)

    if objectives:
        los = [LearningObjective(text=o) for o in objectives]
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

    if "Sek II" in school_type or "Oberstufe" in school_type:
        grades = _parse_sek2_pdf(text)
    else:
        grades = _parse_sek1_pdf(text, school_type)

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
    """Scrape all available NI school-type curricula."""
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
        state="Niedersachsen",
        state_abbr="NI",
        school_curricula=school_curricula,
        last_updated=date.today().isoformat(),
        source_urls=source_urls,
    )
