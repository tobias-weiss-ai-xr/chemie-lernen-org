"""Sachsen — Lehrplan Chemie (HTML-based, Schulportal Sachsen).

Source: https://www.schulportal.sachsen.de/lplandb/lehrplan/521 (Gymnasium)
        https://www.schulportal.sachsen.de/lplandb/lehrplan/126 (Oberschule)
"""

from __future__ import annotations

import re
from datetime import date

import requests
from bs4 import BeautifulSoup, Tag

from schema import LearningObjective, Topic, GradeLevel, SchoolTypeCurriculum, StateCurriculum

USER_AGENT = "Mozilla/5.0 (compatible; chemie-lernen-org/1.0; +https://chemie-lernen.org)"

SCHOOL_PAGES: dict[str, str] = {
    "Gymnasium": "https://www.schulportal.sachsen.de/lplandb/lehrplan/521",
    "Oberschule": "https://www.schulportal.sachsen.de/lplandb/lehrplan/126",
}

# Order matters: more specific first
GRADE_DELIMITERS = [
    "Klassenstufe 10", "Klassenstufe 9", "Klassenstufe 8", "Klassenstufe 7",
    "Jahrgangsstufe 12 - Leistungskurs", "Jahrgangsstufe 11 - Leistungskurs",
    "Jahrgangsstufe 12 - Grundkurs", "Jahrgangsstufe 11 - Grundkurs",
]

GRADE_LABEL: dict[str, str] = {
    "Klassenstufe 7": "7", "Klassenstufe 8": "8", "Klassenstufe 9": "9",
    "Klassenstufe 10": "10",
    "Jahrgangsstufe 11 - Grundkurs": "11 (Grundkurs)",
    "Jahrgangsstufe 12 - Grundkurs": "12 (Grundkurs)",
    "Jahrgangsstufe 11 - Leistungskurs": "11 (Leistungskurs)",
    "Jahrgangsstufe 12 - Leistungskurs": "12 (Leistungskurs)",
}

# Oberschule tracks — interleaved on the same page
OBERSCHULE_TRACKS = {
    "Realschulbildungsgang": "Oberschule (Realschulbildungsgang)",
    "Hauptschulbildungsgang": "Oberschule (Hauptschulbildungsgang)",
}

# Detail sections start with "Ziele" after the grade heading
GRADE_ZIEL_PATTERN = re.compile(
    r"(?:Klassenstufe|Jahrgangsstufe)\s+\d+(?:\s*-\s*(?:Grundkurs|Leistungskurs"
    r"|Realschulbildungsgang|Hauptschulbildungsgang))?\s+Ziele\s",
)

_HTML_ENTITIES = {
    "&nbsp;": " ", "&amp;": "&", "&lt;": "<", "&gt;": ">",
    "&auml;": "ä", "&Auml;": "Ä", "&ouml;": "ö", "&Ouml;": "Ö",
    "&uuml;": "ü", "&Uuml;": "Ü", "&szlig;": "ß",
}


def _clean(text: str) -> str:
    for ent, char in _HTML_ENTITIES.items():
        text = text.replace(ent, char)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def _extract_text(el: Tag) -> str:
    return _clean(el.get_text(separator=" ", strip=True))


def _fetch_soup(url: str) -> BeautifulSoup | None:
    try:
        resp = requests.get(url, headers={"User-Agent": USER_AGENT}, timeout=30)
        resp.raise_for_status()
        resp.encoding = "utf-8"
        return BeautifulSoup(resp.text, "lxml")
    except requests.RequestException as e:
        print(f"    [warn] fetch failed: {url} -- {e}")
        return None


def _get_lplanpages(soup: BeautifulSoup) -> list[Tag]:
    return soup.find_all("div", class_="lplanpage")


def _extract_detail_pages(all_text: str) -> str:
    """Extract only the detail sections (starting at grade + 'Ziele')."""
    for m in GRADE_ZIEL_PATTERN.finditer(all_text):
        return all_text[m.start():]  # First match contains all subsequent grades
    return ""


def _split_by_grades(full_text: str) -> list[tuple[str, str]]:
    """Split combined text into (grade_label, grade_text) pairs, deduplicated."""
    detail = _extract_detail_pages(full_text)
    if not detail:
        return []

    # Build ordered list of (position, label)
    breaks: list[tuple[int, str]] = []

    # Standard delimiters (Gymnasium)
    pattern = "|".join(re.escape(d) for d in GRADE_DELIMITERS)
    for m in re.finditer(pattern, detail):
        label = GRADE_LABEL.get(m.group(0), m.group(0))
        breaks.append((m.start(), label))

    # Oberschule delimiters (interleaved with standard ones)
    for m in re.finditer(
        r"Klassenstufe\s+(8|9|10)\s*-\s*(Realschulbildungsgang|Hauptschulbildungsgang)\s+Ziele",
        detail,
    ):
        grade_num = m.group(1)
        track_name = m.group(2)
        label = f"{grade_num} (Oberschule {track_name})"
        breaks.append((m.start(), label))

    if not breaks:
        return []

    breaks.sort(key=lambda x: x[0])

    # Deduplicate: keep the LONGEST text per grade label
    sections: dict[str, str] = {}
    for idx, (pos, label) in enumerate(breaks):
        end = breaks[idx + 1][0] if idx + 1 < len(breaks) else len(detail)
        grade_text = detail[pos:end].strip()
        # Keep the longer version (dedup)
        existing = sections.get(label, "")
        if len(grade_text) > len(existing):
            sections[label] = grade_text

    return list(sections.items())


def _extract_lernbereiche(grade_text: str) -> list[dict]:
    """Extract Lernbereich topics with learning objectives from grade text."""
    topics: list[dict] = []

    lb_positions: list[tuple[int, str, str, str]] = []
    for m in re.finditer(r"Lernbereich\s+(\d+):\s*(.*?)\s+(\d+)\s*Ustd\.", grade_text):
        pos = m.start()
        title = _clean(m.group(2))
        duration = m.group(3) + " Ustd."
        full_header = m.group(0)
        lb_positions.append((pos, title, duration, full_header))

    if not lb_positions:
        return topics

    for idx, (pos, title, duration, full_hdr) in enumerate(lb_positions):
        body_start = pos + len(full_hdr)
        if idx + 1 < len(lb_positions):
            body_end = lb_positions[idx + 1][0]
        else:
            body_end = len(grade_text)

        body = grade_text[body_start:body_end].strip()
        body = _clean(body)
        objectives = _parse_objectives(body)
        topics.append({
            "title": title,
            "duration": duration,
            "objectives": objectives,
        })

    return topics


def _parse_objectives(text: str) -> list[LearningObjective]:
    """Parse learning objectives from description text."""
    objectives: list[LearningObjective] = []
    if not text or len(text) < 10:
        return objectives

    sentences = re.split(r"[.;]\s+", text)
    for s in sentences:
        s = _clean(s)
        s = re.sub(r"^[\s*\u2022\u2013\u2010\u2032\d.)]+\s*", "", s)
        if s and len(s) > 15 and s[0].isupper():
            if any(kw in s for kw in ["siehe auch", "vgl.", "s. auch"]):
                continue
            objectives.append(LearningObjective(text=s))

    if len(objectives) < 2 and len(text) > 30:
        objectives = [LearningObjective(text=text)]

    return objectives


def _parse_school_type(school_type: str, url: str) -> SchoolTypeCurriculum | None:
    print(f"    fetching {school_type} ...", end="", flush=True)

    soup = _fetch_soup(url)
    if soup is None:
        print(" FAILED")
        return None

    pages = _get_lplanpages(soup)
    if not pages:
        print(" no content pages found")
        return None

    print(f" {len(pages)} page(s)")

    full_text = ""
    for p in pages:
        t = _extract_text(p)
        if t:
            full_text += "\n" + t

    grade_sections = _split_by_grades(full_text)
    if not grade_sections:
        print("    no grade sections found")
        return None

    grade_levels: list[GradeLevel] = []
    for grade_label, grade_text in grade_sections:
        topics_data = _extract_lernbereiche(grade_text)
        topic_objects = [
            Topic(title=td["title"],
                  learning_objectives=td["objectives"],
                  duration=td.get("duration"))
            for td in topics_data
        ]
        if topic_objects:
            lo_count = sum(len(t.learning_objectives) for t in topic_objects)
            grade_levels.append(GradeLevel(grade=grade_label, topics=topic_objects))
            print(f"    grade {grade_label}: {len(topic_objects)} topic(s), {lo_count} LO(s)")

    if not grade_levels:
        print("    no grade levels parsed")
        return None

    return SchoolTypeCurriculum(
        school_type=school_type,
        grade_levels=grade_levels,
        source_url=url,
        last_checked=date.today().isoformat(),
    )


async def scrape() -> StateCurriculum | None:
    """Scrape all available SN school-type curricula."""
    print()

    school_curricula: list[SchoolTypeCurriculum] = []
    source_urls: list[str] = []

    for school_type, url in SCHOOL_PAGES.items():
        sc = _parse_school_type(school_type, url)
        if sc is not None:
            school_curricula.append(sc)
            source_urls.append(sc.source_url)

    if not school_curricula:
        return None

    return StateCurriculum(
        state="Sachsen",
        state_abbr="SN",
        school_curricula=school_curricula,
        last_updated=date.today().isoformat(),
        source_urls=source_urls,
    )
