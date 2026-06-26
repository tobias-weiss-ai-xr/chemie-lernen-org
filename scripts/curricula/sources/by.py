"""Bayern — LehrplanPLUS Chemie.

Source: https://www.lehrplanplus.bayern.de/

Site structure:
  - Direct /fachlehrplan/ URLs for grades 8 and 11 (Gymnasium), grade 8 (Realschule)
  - /schulart/ query-param URLs for grades 9-10 (track-specific: NTG vs HG/SG)
  - Each grade page has <h3> for Lernbereich, followed by div.themen_inhalt > div.thema_absch
  - thema_absch has <h4> header distinguishing Kompetenzerwartungen vs Inhalte

School types:
  - Gymnasium (G8): grades 8-11, NTG track has separate curriculum in 9-10
  - Realschule: grade 8 has Chemie
"""

from __future__ import annotations

import re
from datetime import date

import requests
from bs4 import BeautifulSoup, Tag

from schema import (
    LearningObjective,
    SubTopic,
    Topic,
    GradeLevel,
    SchoolTypeCurriculum,
    StateCurriculum,
)

# ── Configuration ──────────────────────────────────────────────────────────

BASE_URL = "https://www.lehrplanplus.bayern.de"

# Grade config: (label to use, URL path)
SCHOOL_CONFIGS: dict[str, list[dict[str, str]]] = {
    "Gymnasium (NTG)": [
        {"grade": "8", "url": "/fachlehrplan/gymnasium/8/chemie"},
        {"grade": "9", "url": "/schulart/gymnasium/jgs/9/fach/chemie/inhalt/fachlehrplaene?w_schulart=gymnasium&w_fach=chemie&w_jgs=9&w_auspraegung=ch-ntg"},
        {"grade": "10", "url": "/schulart/gymnasium/jgs/10/fach/chemie/inhalt/fachlehrplaene?w_schulart=gymnasium&w_fach=chemie&w_jgs=10&w_auspraegung=ch-ntg"},
        {"grade": "11", "url": "/fachlehrplan/gymnasium/11/chemie"},
    ],
    "Gymnasium (HG/SG/MuG/WWG/SWG)": [
        {"grade": "9", "url": "/schulart/gymnasium/jgs/9/fach/chemie/inhalt/fachlehrplaene?w_schulart=gymnasium&w_fach=chemie&w_jgs=9&w_auspraegung=ch"},
        {"grade": "10", "url": "/schulart/gymnasium/jgs/10/fach/chemie/inhalt/fachlehrplaene?w_schulart=gymnasium&w_fach=chemie&w_jgs=10&w_auspraegung=ch"},
    ],
    "Realschule": [
        {"grade": "8", "url": "/fachlehrplan/realschule/8/chemie"},
    ],
}

# Strip C{grade} prefix from h3 titles
TITLE_CLEANUP = re.compile(r"^C\d+")
# Extract optional duration from h3 text: "(ca. X Std.)"
DURATION_RE = re.compile(r"\(ca\.\s*([^)]*)\)")

# Lernbereich number pattern
LB_PREFIX_RE = re.compile(r"^(Lernbereich\s+\d+:?\s*)", re.UNICODE)

USER_AGENT = "Mozilla/5.0 (compatible; chemie-lernen-org/1.0; +https://chemie-lernen.org)"


# ── Helpers ────────────────────────────────────────────────────────────────

def _clean_text(text: str) -> str:
    """Normalise whitespace and replace non-breaking spaces."""
    text = text.replace("\xa0", " ")
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def _extract_text(el: Tag | None) -> str:
    if el is None:
        return ""
    return _clean_text(el.get_text(strip=True, separator=" "))


def _fetch_soup(url: str) -> BeautifulSoup | None:
    try:
        resp = requests.get(url, headers={"User-Agent": USER_AGENT}, timeout=30)
        resp.raise_for_status()
        resp.encoding = "utf-8"
        return BeautifulSoup(resp.text, "lxml")
    except requests.RequestException as e:
        print(f"    [warn] fetch failed: {url} — {e}")
        return None


# ── Grade-level parser ─────────────────────────────────────────────────────

def _parse_themen_inhalt(themen_inhalt: Tag) -> tuple[list[LearningObjective], list[SubTopic]]:
    """Extract learning objectives + subtopics from a themen_inhalt div."""
    objectives: list[LearningObjective] = []
    sub_topics: list[SubTopic] = []

    for thema_absch in themen_inhalt.select("div.thema_absch"):
        h4 = thema_absch.find("h4")
        if h4 is None:
            continue
        header = _extract_text(h4)

        if "Kompetenzerwartungen" in header:
            # Learning objectives in <ul><li>
            for li in thema_absch.select("ul > li"):
                text = _extract_text(li)
                if text:
                    objectives.append(LearningObjective(text=text))

        elif "Inhalte" in header:
            # Content subtopics
            for li in thema_absch.select("ul > li"):
                text = _extract_text(li)
                if text:
                    sub_topics.append(SubTopic(title=text))

    return objectives, sub_topics


def _parse_grade_page(url: str, grade_label: str) -> GradeLevel | None:
    """Parse one grade page and return GradeLevel."""
    soup = _fetch_soup(url)
    if soup is None:
        return None

    topics: list[Topic] = []

    # Find all h3 Lernbereich headers
    for h3 in soup.find_all("h3"):
        raw_title = _extract_text(h3)
        if not raw_title:
            continue

        # Strip C{grade} prefix
        title = TITLE_CLEANUP.sub("", raw_title).strip()
        if not title:
            continue

        # Preamble themen_inhalt (vor-nachspann-kap4) may precede content
        next_el = h3.find_next_sibling()
        if next_el is None or next_el.name != "div":
            continue

        all_themen = next_el.select("div.themen_inhalt")
        themen_inhalt: Tag | None = None
        for ti in all_themen:
            if ti.select("div.thema_absch"):
                themen_inhalt = ti
        if themen_inhalt is None and all_themen:
            themen_inhalt = all_themen[0]
        if themen_inhalt is None:
            continue

        objectives, sub_topics = _parse_themen_inhalt(themen_inhalt)
        if not objectives and not sub_topics:
            continue

        topics.append(Topic(
            title=title,
            sub_topics=sub_topics,
            learning_objectives=objectives,
        ))

    if not topics:
        return None

    return GradeLevel(grade=grade_label, topics=topics)


# ── School-type parser ─────────────────────────────────────────────────────

def _parse_school_type(name: str, grade_configs: list[dict[str, str]]) -> SchoolTypeCurriculum | None:
    """Parse all configured grades for one school type."""
    print(f"    fetching {name} ...", end="", flush=True)

    grade_levels: list[GradeLevel] = []
    first_url = ""

    for gc in grade_configs:
        full_url = f"{BASE_URL}{gc['url']}"
        if not first_url:
            first_url = full_url

        gl = _parse_grade_page(full_url, gc["grade"])
        if gl is not None:
            grade_levels.append(gl)

    if not grade_levels:
        print(" no data")
        return None

    print(f" {len(grade_levels)} grade(s)")
    return SchoolTypeCurriculum(
        school_type=name,
        grade_levels=grade_levels,
        source_url=first_url,
        last_checked=date.today().isoformat(),
    )


# ── Public API ─────────────────────────────────────────────────────────────

async def scrape() -> StateCurriculum | None:
    """Scrape all available BY school-type curricula."""
    print()

    school_curricula: list[SchoolTypeCurriculum] = []
    source_urls: list[str] = []

    for school_type, grade_configs in SCHOOL_CONFIGS.items():
        sc = _parse_school_type(school_type, grade_configs)
        if sc is not None:
            school_curricula.append(sc)
            source_urls.append(sc.source_url)

    if not school_curricula:
        return None

    return StateCurriculum(
        state="Bayern",
        state_abbr="BY",
        school_curricula=school_curricula,
        last_updated=date.today().isoformat(),
        source_urls=source_urls,
    )
