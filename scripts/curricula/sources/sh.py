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
    """Parse SH Fachanforderungen Chemie into grade levels.

    The PDF has two main sections: Sek I (pages 11-28) and Sek II (pages 29-69).
    Split at the first UPPERCASE 'SEKUNDARSTUFE II' occurrence which marks the
    page-29 boundary (not running-text mentions of 'Sekundarstufe II').
    """
    text = _normalize(text)
    grades: list[GradeLevel] = []

    sek2_marker = "SEKUNDARSTUFE II"
    sek2_pos = text.find(sek2_marker)

    if sek2_pos == -1:
        topics = _extract_topics(text)
        if topics:
            grades.append(GradeLevel(grade="Sek I + II", topics=topics))
        return grades

    sek1_text = text[:sek2_pos]
    sek2_text = text[sek2_pos:]

    topics = _extract_topics(sek1_text)
    if topics:
        grades.append(GradeLevel(grade="Sek I", topics=topics))

    topics = _extract_topics_sek2(sek2_text)
    if topics:
        grades.append(GradeLevel(grade="Sek II", topics=topics))

    return grades


def _extract_topics(text: str) -> list[Topic]:
    """Extract topics and learning objectives.

    SH Fachanforderungen use a competency-based format without numbered
    chemistry topic headings. If no numbered topics are found, collect
    meaningful content lines as a single combined topic.
    """
    topics: list[Topic] = []
    lines = text.split("\n")

    current_title: str | None = None
    current_objectives: list[str] = []

    skip_heading_kw = [
        "Sekundarstufe", "Fachanforderung", "Kompetenzbereich",
        "Kompetenzerwartung", "Jahrgangsstufe", "Doppeljahrgang",
        "Einführungsphase", "Qualifikationsphase",
        "Das Fach Chemie in der", "Inhalte des Unterrichts",
        "Schulinternes Fachcurriculum", "Leistungsbewertung",
        "Abiturprüfung", "Allgemeiner Teil",
        "Geltungsbereich", "Lernen und Unterricht",
        "Der Beitrag", "Beitrag der",
        "Zielsetzung", "Überblick",
    ]

    collected: list[str] = []

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
            cleaned_title = _clean(m.group(2))
            if any(kw.lower() in cleaned_title.lower() for kw in skip_heading_kw):
                if current_title and current_objectives:
                    los = [LearningObjective(text=o) for o in current_objectives]
                    topics.append(Topic(title=current_title, learning_objectives=los))
                current_title = None
                current_objectives = []
                continue
            if current_title and current_objectives:
                los = [LearningObjective(text=o) for o in current_objectives]
                topics.append(Topic(title=current_title, learning_objectives=los))
            current_title = cleaned_title
            current_objectives = []
            continue

        if current_title:
            cleaned = re.sub(r"^[\s•–\- \d.()a-z)]+\s+", "", line).strip()
            if cleaned and len(cleaned) > 15:
                current_objectives.append(cleaned)
        else:
            if line and len(line) > 20:
                cleaned = re.sub(r"^[\s•–\- \d.()a-z)]+\s+", "", line).strip()
                if cleaned and len(cleaned) > 20:
                    collected.append(cleaned)

    if current_title and current_objectives:
        los = [LearningObjective(text=o) for o in current_objectives]
        topics.append(Topic(title=current_title, learning_objectives=los))

    if not topics and collected:
        topics.append(Topic(
            title="Chemie (Kompetenzbereiche)",
            learning_objectives=[LearningObjective(text=t) for t in collected],
        ))

    return topics


_SACHGEBIET_RE = re.compile(
    r'Sachgebiet\s*[„"“ʺ]\s*([^„"“ʺ]+?)\s*[„"“ʺ]',
    re.IGNORECASE,
)


def _extract_topics_sek2(text: str) -> list[Topic]:
    """Extract Sek II topics using Sachgebiet headings."""
    topics: list[Topic] = []
    matches = list(_SACHGEBIET_RE.finditer(text))

    if not matches:
        return _extract_topics(text)

    for idx, m in enumerate(matches):
        title = _clean(m.group(1))
        if not title or len(title) < 5:
            continue

        content_start = m.end()
        content_end = matches[idx + 1].start() if idx + 1 < len(matches) else len(text)

        section = text[content_start:content_end]
        objectives: list[str] = []
        for line in section.split("\n"):
            line = _clean(line)
            if not line or len(line) < 8:
                continue
            if any(kw in line for kw in [
                "Sachgebiet", "Verbindliche Inhalte", "Erläuterung",
                "FACHANFORDERUNGEN", "Kompetenzbereich", "Kompetenzerwartung",
                "Die Schülerinnen und Schüler",
            ]):
                continue
            if re.match(r"^[\d\s\-–—]+$", line):
                continue

            cleaned = line.lstrip("•■□–-∙  	")
            cleaned = re.sub(r"\s+", " ", cleaned).strip()
            if cleaned and len(cleaned) > 10:
                objectives.append(cleaned)

        if objectives:
            topics.append(Topic(
                title=title,
                learning_objectives=[LearningObjective(text=t) for t in objectives],
            ))

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
