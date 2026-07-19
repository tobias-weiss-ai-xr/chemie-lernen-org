"""Shared parser for the Berlin/Brandenburg joint Rahmenlehrplan (RLP).

Berlin and Brandenburg share a joint Rahmenlehrplan for grades 1-10.
The Teil C Chemie PDF covers grades 7-10 with Themenfelder.

Separate Oberstufe curricula exist per state but are not yet implemented.

Sources:
  Joint RLP Teil C Chemie: https://bildungsserver.berlin-brandenburg.de/.../Teil_C_Chemie_2015_11_10.pdf
  BE Sek II: TODO
  BB Sek II: TODO
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

JOINT_RLP_URL = (
    "https://bildungsserver.berlin-brandenburg.de/fileadmin/bbb/"
    "unterricht/rahmenlehrplaene/Rahmenlehrplanprojekt/"
    "amtliche_Fassung/Teil_C_Chemie_2015_11_10.pdf"
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
        if "Berlin" in line and "Brandenburg" in line and "Senatsverwaltung" in line:
            continue
        if "Rahmenlehrplan" in line:
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


# ── Joint RLP Parser ───────────────────────────────────────────────────────

def _parse_joint_rlp(text: str) -> list[GradeLevel]:
    """Parse the joint BE/BB Rahmenlehrplan Teil C Chemie.

    The RLP is organized by Jahrgangsstufen 7-10 with Themenfelder
    grouped by Basiskonzepte.
    """
    text = _normalize(text)
    grades: list[GradeLevel] = []

    grade_patterns = [
        (r"(Jahrgangsstufen\s*7[/-]?\s*8|Jg\.?\s*7/8|Klassen\s*7\s*und\s*8)", "7/8"),
        (r"(Jahrgangsstufen\s*9[/-]?\s*10|Jg\.?\s*9/10|Klassen\s*9\s*und\s*10)", "9/10"),
    ]

    grade_positions: list[tuple[int, str]] = []
    for pattern, label in grade_patterns:
        for m in re.finditer(pattern, text, re.IGNORECASE):
            grade_positions.append((m.start(), label))

    grade_positions.sort()

    if not grade_positions:
        topics = _extract_topics(text)
        if topics:
            grades.append(GradeLevel(grade="7-10", topics=topics))
        return grades

    for idx, (pos, label) in enumerate(grade_positions):
        end = grade_positions[idx + 1][0] if idx + 1 < len(grade_positions) else len(text)
        section = text[pos:end]
        topics = _extract_topics(section)
        if topics:
            grades.append(GradeLevel(grade=label, topics=topics))

    return grades


def _extract_topics(text: str) -> list[Topic]:
    """Extract topics and learning objectives from the joint RLP.

    The PDF structure has topics numbered 3.1-3.13 under section "3 Themen und Inhalte".
    Topic headers follow the pattern "3.X Title" where X is 1-13.
    """
    topics: list[Topic] = []
    lines = text.split("\n")

    current_title: str | None = None
    current_objectives: list[str] = []

    # Pattern for topic headers: "3.1", "3.2", etc. followed by title
    topic_header_pat = re.compile(r"^\s*3\.(\d+)\s+(.{5,})")

    for line in lines:
        line = _clean(line)
        if not line or len(line) < 5:
            continue
        if any(kw in line for kw in ["Seite", "Inhaltsverzeichnis", "von 45"]):
            continue
        if re.match(r"^\d+$", line):
            continue
        # Skip Förderschule footnotes and other non-topic text
        if "Förderschule Lernen" in line or "§ 30 BbgSchulG" in line:
            continue
        if "Niveaustufe" in line and "zugordnet" in line:
            continue

        m = topic_header_pat.match(line)
        if m:
            topic_num = int(m.group(1))
            topic_text = _clean(m.group(2))
            # Skip if this looks like a duplicate header from TOC
            if topic_text.endswith(str(int(m.group(1)) + 29)):  # Page numbers in TOC
                continue
            if current_title and current_objectives:
                los = [LearningObjective(text=o) for o in current_objectives]
                topics.append(Topic(title=current_title, learning_objectives=los))
            current_title = topic_text
            current_objectives = []
            continue

        if current_title:
            # Clean up bullet points and leading noise
            cleaned = re.sub(r"^[\s•–\- ✦\d.()a-z)]+\s+", "", line).strip()
            if cleaned and len(cleaned) > 15:
                # Skip page headers/footers and section markers
                if not any(kw in cleaned for kw in ["C Chemie", "Doppeljahrgangsstufe", "Bezüge zu den Basiskonzepten", "Mögliche Kontexte", "Fachbegriffe", "Beispiele für Differenzierungsmöglichkeiten"]):
                    current_objectives.append(cleaned)

    if current_title and current_objectives:
        los = [LearningObjective(text=o) for o in current_objectives]
        topics.append(Topic(title=current_title, learning_objectives=los))

    return topics


# ── Build state curriculum ────────────────────────────────────────────────

def build_state_curriculum(
    state_name: str,
    state_abbr: str,
    sek2_url: str | None = None,
) -> StateCurriculum | None:
    """Build a StateCurriculum for Berlin or Brandenburg from the joint RLP."""
    print(f"    fetching joint RLP ...", end="", flush=True)

    text = _fetch_pdf_text(JOINT_RLP_URL)
    if text is None:
        print(" FAILED")
        return None

    print(f" {len(text)} chars")

    grades = _parse_joint_rlp(text)

    if not grades:
        print("    no chemistry content extracted from joint RLP")
        return None

    for g in grades:
        print(f"    grade {g.grade}: {len(g.topics)} topic(s), "
              f"{sum(len(t.learning_objectives) for t in g.topics)} objectives")

    school_curricula = [
        SchoolTypeCurriculum(
            school_type="Sek I (gemeinsamer RLP Berlin/Brandenburg)",
            grade_levels=grades,
            source_url=JOINT_RLP_URL,
            last_checked=date.today().isoformat(),
        )
    ]

    source_urls = [JOINT_RLP_URL]
    if sek2_url:
        source_urls.append(sek2_url)

    return StateCurriculum(
        state=state_name,
        state_abbr=state_abbr,
        school_curricula=school_curricula,
        last_updated=str(date.today()),
        source_urls=source_urls,
    )
