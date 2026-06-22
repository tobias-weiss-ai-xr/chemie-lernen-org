"""Saarland — Kernlehrplan Chemie (PDF-based, per-grade G9).

NOTE: The Saarland PDF URLs are behind BunnyCDN and return 403.
Investigation needed to find a working download mechanism.

Sources:
  G9 Klasse 8/9 (currently returning 403):
    https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/...
  Portal: https://www.saarland.de/mbk/DE/portale/bildungsserver/...

TODO:
  - Find working PDF URLs (may need referer header, cookie, or different URL pattern).
  - G9 Klasse 5/6, 7, 10 URLs not yet found.
  - GOS (gymnasiale Oberstufe) and Gemeinschaftsschule URLs not yet found.
"""

from __future__ import annotations

import io
import re
from datetime import date

import requests
import pdfplumber

from schema import LearningObjective, Topic, GradeLevel, SchoolTypeCurriculum, StateCurriculum

# ── Configuration ──────────────────────────────────────────────────────────

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/125.0.0.0 Safari/537.36"
)

SCHOOL_PDFS: dict[str, str] = {
    "Gymnasium G9 (Klasse 8)": (
        "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/"
        "Lehrpl%C3%A4ne/Lehrplaene_Gymnasium_neunjaehriges_23/"
        "Chemie/LP_gym9_CH_8_2024.pdf?__blob=publicationFile&v=1"
    ),
    "Gymnasium G9 (Klasse 9)": (
        "https://www.saarland.de/SharedDocs/Downloads/DE/mbk/"
        "Lehrpl%C3%A4ne/Lehrplaene_Gymnasium_neunjaehriges_23/"
        "Chemie/LP_gym9_CH_9_2025.pdf?__blob=publicationFile&v=1"
    ),
}

PORTAL_URL = (
    "https://www.saarland.de/mbk/DE/portale/bildungsserver/"
    "bildungsthemen/lehrplaenehandreichungen/"
    "lehrplaeneallgemeinbildende/gymnasium"
)


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
        if "Saarland" in line and "Ministerium" in line:
            continue
        if "Lehrplan" in line and "Chemie" in line:
            continue
        if line:
            cleaned.append(line)
    return "\n".join(cleaned)


# ── PDF download ───────────────────────────────────────────────────────────

def _fetch_pdf_text(url: str) -> str | None:
    try:
        session = requests.Session()
        session.headers.update({"User-Agent": USER_AGENT})
        resp = session.get(url, timeout=120)
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

def _parse_pdf(text: str, grade_label: str) -> list[GradeLevel]:
    """Parse a per-grade SL Kernlehrplan PDF.

    Each PDF covers one grade level with Themenfelder containing
    verbindliche and fakultative Inhalte.
    """
    text = _normalize(text)
    topics = _extract_topics(text)

    if topics:
        return [GradeLevel(grade=grade_label, topics=topics)]
    return []


def _extract_topics(text: str) -> list[Topic]:
    """Extract topics (Themenfelder) and learning objectives."""
    topics: list[Topic] = []
    lines = text.split("\n")

    current_title: str | None = None
    current_objectives: list[str] = []

    for line in lines:
        line = _clean(line)
        if not line or len(line) < 5:
            continue
        if any(kw in line for kw in ["Seite", "Inhaltsverzeichnis", "Vorwort"]):
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

def _parse_school_type(school_type: str, url: str, grade_label: str) -> SchoolTypeCurriculum | None:
    print(f"    fetching {school_type} ...", end="", flush=True)

    text = _fetch_pdf_text(url)
    if text is None:
        print(" FAILED")
        return None

    print(f" {len(text)} chars")

    grades = _parse_pdf(text, grade_label)

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
    """Scrape Saarland chemistry curriculum."""
    print()

    school_curricula: list[SchoolTypeCurriculum] = []
    source_urls: list[str] = []

    for school_type, url in SCHOOL_PDFS.items():
        # Extract grade label from school type name
        grade_match = re.search(r"Klasse\s*(\d+)", school_type)
        grade_label = grade_match.group(1) if grade_match else "?"
        sc = _parse_school_type(school_type, url, grade_label)
        if sc is not None:
            school_curricula.append(sc)
            source_urls.append(sc.source_url)

    if not school_curricula:
        return None

    source_urls.append(PORTAL_URL)

    return StateCurriculum(
        state="Saarland",
        state_abbr="SL",
        school_curricula=school_curricula,
        last_updated=str(date.today()),
        source_urls=source_urls,
    )
