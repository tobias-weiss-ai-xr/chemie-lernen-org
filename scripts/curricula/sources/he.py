"""Hessen — Kerncurriculum Chemie (PDF-based, KCGO).

Source: https://kultus.hessen.de/sites/kultus.hessen.de/files/2024-11/kerncurriculum_gymnasiale_oberstufe-chemie_0.pdf

Structure:
  PDF covers Gymnasium Oberstufe (Einführungsphase + Q1-Q4).
  Organized by Themenfelder with verbindliche Inhalte.
  Also available for Sek I (Hauptschule, Realschule, Mittelstufenschule, Gymnasium)
  but not yet implemented (separate PDFs needed).
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
    "Gymnasium (Oberstufe)": "https://kultus.hessen.de/sites/kultus.hessen.de/files/2024-11/kerncurriculum_gymnasiale_oberstufe-chemie_0.pdf",
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
        if "Hessisches Kultusministerium" in line:
            continue
        if "Kerncurriculum" in line and "Chemie" in line:
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


# ── KCGO Chemie parser ─────────────────────────────────────────────────────

def _parse_pdf(text: str) -> list[GradeLevel]:
    text = _normalize(text)
    grades: list[GradeLevel] = []

    # The KCGO Chemie is organized by:
    # 1. Vorbemerkungen / Bildungsbeitrag des Faches
    # 2. Kompetenzbereiche (prozessbezogene Kompetenzen)
    # 3. Themenfelder (inhaltsbezogene Kompetenzen) by course levels
    #    - Einführungsphase (E1-E2)
    #    - Qualifikationsphase: Grundkurs (Q1-Q4) and Leistungskurs (Q1-Q4)
    #
    # We look for "Themenfelder" sections by course type.

    # Try to find the curriculum content after "Themenfelder" or similar header
    # Split by Einführungsphase / Qualifikationsphase sections
    sections: list[tuple[str, str]] = []

    # Look for "Einführungsphase" section
    ef_match = re.search(r"(Einführungsphase)", text)
    if ef_match:
        ef_start = ef_match.start()

        # Find Qualifikationsphase start
        qp_match = re.search(r"(Qualifikationsphase)", text[ef_start + len("Einführungsphase"):])
        if qp_match:
            ef_text = text[ef_start:ef_start + len("Einführungsphase") + qp_match.start()]
            qp_text = text[ef_start + len("Einführungsphase") + qp_match.start():]
        else:
            ef_text = text[ef_start:]
            qp_text = ""

        sections.append(("Einführungsphase", ef_text))
        if qp_text.strip():
            # Split Q-phase into GK and LK if possible
            gk_match = re.search(r"grundlegendes\s+Niveau|Grundkurs", qp_text, re.IGNORECASE)
            lk_match = re.search(r"erhöhtes\s+Niveau|Leistungskurs", qp_text, re.IGNORECASE)
            sections.append(("Qualifikationsphase", qp_text))
    else:
        # Fallback — search for "grundlegendes Niveau" / "erhöhtes Niveau"
        gk_start = text.find("grundlegendes Niveau")
        if gk_start >= 0:
            sections.append(("Grundkurs", text[gk_start:]))
        else:
            # Just use the whole text
            sections.append(("Gesamt", text))

    for phase, phase_text in sections:
        topics = _extract_topics(phase_text)
        if topics:
            grade_label = phase
            if "Einführungsphase" in phase:
                grade_label = "E"
            elif "Grundkurs" in phase or "grundlegendes" in phase:
                grade_label = "Q1-Q4 (GK)"
            elif "Leistungskurs" in phase or "erhöhtes" in phase:
                grade_label = "Q1-Q4 (LK)"
            elif "Qualifikationsphase" in phase:
                grade_label = "Q1-Q4"
            grades.append(GradeLevel(grade=grade_label, topics=topics))

    return grades


def _extract_topics(text: str) -> list[Topic]:
    """Extract topics and learning objectives from a curriculum section.

    Looks for Thema / Themenfeld headers and their associated Lernziele.
    """
    topics: list[Topic] = []
    lines = text.split("\n")

    current_title: str | None = None
    current_objectives: list[str] = []

    # Headers that indicate a new topic
    topic_header_pattern = re.compile(
        r"^(Thema\s*\d*[.:]?\s*|Themenfeld\s*\d*[.:]?\s*|"
        r"\d+\.\s+[A-Z][A-Za-z\s\-]+|"
        r"[A-Z][a-z]+[äöüß]+\s+[A-Z][a-z]+)"
    )

    for line in lines:
        line = _clean(line)
        if not line or len(line) < 5:
            continue

        # Skip headers/footers
        if any(kw in line for kw in ["Seite", "Inhaltsverzeichnis", "Abbildungsverzeichnis"]):
            continue
        if re.match(r"^\d+$", line):
            continue

        # Check if this line starts a new topic
        # Look for numbered topics like "1 Aufbau der Materie" or "Thema 1"
        m = re.match(r"^\s*(\d+)\s+(.{5,})", line)
        if m and len(m.group(2)) > 5 and not re.match(r"^\d", m.group(2)[0]):
            # Save previous topic
            if current_title and current_objectives:
                los = [LearningObjective(text=o) for o in current_objectives]
                topics.append(Topic(title=current_title, learning_objectives=los))

            current_title = _clean(m.group(2))
            current_objectives = []
            continue

        # If we're inside a topic, collect objectives
        if current_title:
            # Remove numbering/bullets
            cleaned = re.sub(r"^[\s•–\- \d.()a-z)]+\s+", "", line).strip()
            if cleaned and len(cleaned) > 15:
                current_objectives.append(cleaned)

    # Save last topic
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
    """Scrape Hessen chemistry curriculum."""
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
        state="Hessen",
        state_abbr="HE",
        school_curricula=school_curricula,
        last_updated=str(date.today()),
        source_urls=source_urls,
    )
