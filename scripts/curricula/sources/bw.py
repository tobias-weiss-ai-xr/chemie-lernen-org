"""Baden-Württemberg — Bildungsplan Chemie.

Structure (bildungsplaene-bw.de):
  - Overview page lists IK (inhaltsbezogene Kompetenzen) sub-pages
  - URL pattern encodes grade band
  - Sub-pages contain learning objectives in <table class="tktable">
  - SEK1 is shared for RS/HS/GMS
"""

from __future__ import annotations

import re
from datetime import date

import requests
from bs4 import BeautifulSoup, Tag

from schema import LearningObjective, Topic, GradeLevel, SchoolTypeCurriculum, StateCurriculum

# ── Configuration ──────────────────────────────────────────────────────────

BASE_URL = "https://www.bildungsplaene-bw.de"

SCHOOL_PAGES: dict[str, str] = {
    "Gymnasium": "/,Lde/BP2016BW_ALLG_GYM_CH",
    "Sekundarstufe I (RS/HS/GMS)": "/,Lde/BP2016BW_ALLG_SEK1_CH",
}

GRADE_PATTERN = re.compile(r"_IK_(\d+(?:-\d+)*(?:-\w+)?)_")

GRADE_LABEL_MAP: dict[str, str] = {
    "5-6": "5/6",
    "7-8-9": "7/8/9",
    "10": "10",
    "8-9-10": "8/9/10",
    "11-12-BF": "11/12 (Basisfach)",
    "11-12-LF": "11/12 (Leistungsfach)",
}

USER_AGENT = "Mozilla/5.0 (compatible; chemie-lernen-org/1.0; +https://chemie-lernen.org)"


# ── Text cleaning ──────────────────────────────────────────────────────────

def _clean_text(text: str) -> str:
    """Remove soft hyphens and collapse whitespace."""
    text = re.sub(r"[\xad]", "", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def _strip_numbering(text: str) -> str:
    """Strip leading numbering like '(1)' or '(1a)'."""
    return re.sub(r"^\(\d+[a-z]?\)\s*", "", text).strip()


def _extract_text(el: Tag | None) -> str:
    if el is None:
        return ""
    return _clean_text(el.get_text(strip=True, separator=" "))


# ── Fetch helpers ──────────────────────────────────────────────────────────

def _fetch_soup(url: str) -> BeautifulSoup | None:
    try:
        resp = requests.get(url, headers={"User-Agent": USER_AGENT}, timeout=30)
        resp.raise_for_status()
        # Don't use apparent_encoding — misdetects as hp_roman8
        resp.encoding = "utf-8"
        return BeautifulSoup(resp.text, "lxml")
    except requests.RequestException as e:
        print(f"    [warn] fetch failed: {url} — {e}")
        return None


def _parse_grade_from_url(url: str) -> str | None:
    m = GRADE_PATTERN.search(url)
    if not m:
        return None
    key = m.group(1)
    return GRADE_LABEL_MAP.get(key)


# ── Sub-page parser ────────────────────────────────────────────────────────

def _extract_topic_title(soup: BeautifulSoup) -> str:
    col2 = soup.find("div", class_="grid__col--2")
    if col2:
        h2 = col2.find("h2")
        if h2:
            return _extract_text(h2)
    h2 = soup.find("h2")
    return _extract_text(h2) if h2 else ""


def _extract_learning_objectives_from_table(soup: BeautifulSoup) -> list[str]:
    section = soup.find("section", class_=lambda c: c and "ITK" in c)
    if not section:
        return []
    table = section.find("table", class_="tktable")
    if not table:
        return []

    objectives: list[str] = []
    for row in table.find_all("tr"):
        td = row.find("td")
        if not td:
            continue
        text = _extract_text(td)
        if not text:
            continue
        if re.match(r"^(BP2016|VB_|B?NE_\d|MB_|PG_\d)", text):
            continue
        text = _strip_numbering(text)
        if text:
            objectives.append(text)
    return objectives


def _parse_topic_sub_page(url: str, link_text: str) -> Topic | None:
    sub_soup = _fetch_soup(url)
    if sub_soup is None:
        return None
    title = _extract_topic_title(sub_soup) or link_text
    objectives = _extract_learning_objectives_from_table(sub_soup)
    if not objectives:
        return None
    return Topic(
        title=title,
        learning_objectives=[LearningObjective(text=o) for o in objectives],
    )


# ── Overview page parser ────────────────────────────────────────────────────

def _get_ik_links(soup: BeautifulSoup) -> list[tuple[str, str]]:
    seen: dict[str, str] = {}
    for a in soup.find_all("a", href=True):
        href = a["href"]
        if "_IK_" in href and "CH" in href:
            text = _extract_text(a)
            if text and href not in seen:
                seen[href] = text
    return list(seen.items())


# ── School-type parser ──────────────────────────────────────────────────────

def _parse_school_type(school_type: str, page_path: str) -> SchoolTypeCurriculum | None:
    url = f"{BASE_URL}{page_path}"
    print(f"    fetching {school_type} ...", end="", flush=True)

    soup = _fetch_soup(url)
    if soup is None:
        print(" FAILED")
        return None

    ik_links = _get_ik_links(soup)
    if not ik_links:
        print(" no IK links found")
        return None

    print(f" {len(ik_links)} topic page(s)")

    grade_topics: dict[str, list[tuple[str, str]]] = {}
    for href, text in ik_links:
        grade = _parse_grade_from_url(href)
        if grade:
            grade_topics.setdefault(grade, []).append((href, text))

    if not grade_topics:
        print("    no grade bands identified")
        return None

    grade_levels: list[GradeLevel] = []
    for grade in sorted(grade_topics.keys()):
        topics: list[Topic] = []
        for href, link_text in grade_topics[grade]:
            sub_url = f"{BASE_URL}{href}"
            topic = _parse_topic_sub_page(sub_url, link_text)
            if topic is not None:
                topics.append(topic)

        if topics:
            grade_levels.append(GradeLevel(grade=grade, topics=topics))
            print(f"    grade {grade}: {len(topics)} topic(s) with content")
        else:
            print(f"    grade {grade}: no topics with learning objectives found")

    if not grade_levels:
        print("    no grade levels parsed")
        return None

    return SchoolTypeCurriculum(
        school_type=school_type,
        grade_levels=grade_levels,
        source_url=url,
        last_checked=date.today().isoformat(),
    )


# ── Public API ─────────────────────────────────────────────────────────────

async def scrape() -> StateCurriculum | None:
    """Scrape all available BW school-type curricula."""
    print()

    school_curricula: list[SchoolTypeCurriculum] = []
    source_urls: list[str] = []

    for school_type, page_path in SCHOOL_PAGES.items():
        sc = _parse_school_type(school_type, page_path)
        if sc is not None:
            school_curricula.append(sc)
            source_urls.append(sc.source_url)

    if not school_curricula:
        return None

    return StateCurriculum(
        state="Baden-Württemberg",
        state_abbr="BW",
        school_curricula=school_curricula,
        last_updated=date.today().isoformat(),
        source_urls=source_urls,
    )
