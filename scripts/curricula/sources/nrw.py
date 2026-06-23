"""Nordrhein-Westfalen — Kernlehrplan Chemie.

Source: https://lehrplannavigator.nrw.de/
Status: ✅ working (Playwright-based PDF discovery & parsing)

School types with dedicated Chemie Kernlehrpläne:
  - Gymnasium (Sek I) — G9 Kernlehrplan Chemie (2019)
  - Realschule — Kernlehrplan Chemie (2011)
  - Gymnasium (Sek II, ab 2022/2023) — Kernlehrplan Chemie (2022)
  - Gymnasium (Sek II, ab 2013) — Kernlehrplan Chemie (2013, auslaufend)

Hauptschule, Gesamtschule, Sekundarschule do not have separate Chemie
Kernlehrpläne — chemistry is taught within the Naturwissenschaften
Lernbereich.
"""

from __future__ import annotations

import asyncio
import io
import re
from datetime import date

import pdfplumber
import requests
from playwright.sync_api import sync_playwright

from schema import LearningObjective, Topic, GradeLevel, SchoolTypeCurriculum, StateCurriculum

USER_AGENT = "Mozilla/5.0 (compatible; chemie-lernen-org/1.0; +https://chemie-lernen.org)"

BASE_URL = "https://lehrplannavigator.nrw.de"

CHEMISTRY_PATHS: dict[str, str] = {
    "Gymnasium (Sek I)": "/sekundarstufe-i/kernlehrplaene-fuer-das-gymnasium-ab-20192020/chemie-gymnasium",
    "Realschule": "/sekundarstufe-i/realschule/chemie-realschule",
    "Gymnasium (Sek II, ab 2022/2023)": "/sekundarstufe-ii/kernlehrplaene-fuer-die-gymnasiale-oberstufe-ab-20222023/chemie",
    "Gymnasium (Sek II, ab 2013)": "/sekundarstufe-ii/kernlehrplaene-fuer-die-gymnasiale-oberstufe-ab-2013/chemie-gymnasiale-oberstufe",
}


def _discover_pdfs() -> dict[str, str]:
    """Use Playwright to discover Kernlehrplan PDF URLs."""
    pdfs: dict[str, str] = {}

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        for school_type, path in CHEMISTRY_PATHS.items():
            url = f"{BASE_URL}{path}"
            try:
                page.goto(url, wait_until="networkidle", timeout=30000)
                page.wait_for_timeout(3000)

                links = page.eval_on_selector_all(
                    "a",
                    "els => els.map(el => ({href: el.href, text: el.textContent.trim()}))",
                )

                for link in links:
                    href = link["href"]
                    text = link["text"]
                    if not text or not href.endswith(".pdf"):
                        continue
                    if "Kernlehrplan" in text and "Archiv" not in text and "archiv" not in href.lower():
                        pdfs[school_type] = href
                        print(f"    discovered: [{text}] → {href.split('/')[-1]}")
                        break
            except Exception as e:
                print(f"    [warn] failed to discover PDF for {school_type}: {e}")

        browser.close()

    return pdfs


def _clean(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def _normalize(text: str) -> str:
    lines = text.split("\n")
    cleaned: list[str] = []
    for line in lines:
        line = line.strip()
        if re.match(r"^\d+$", line):
            continue
        if "Nordrhein-Westfalen" in line and "Ministerium" in line:
            continue
        if "Kernlehrplan" in line and "für die" in line:
            continue
        if "Online-Fassung" in line:
            continue
        if "Herausgeber" in line or "Herausgegeben" in line:
            continue
        if line:
            cleaned.append(line)
    return "\n".join(cleaned)


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


def _extract_topics(text: str) -> list[Topic]:
    """Extract topics (Inhaltsfelder) and their learning objectives.

    Handles multiple NRW Kernlehrplan formats:
      - Gymnasium SI: "Inhaltsfeld N: Title" → objectives as plain lines
      - Realschule:   "Inhaltsfeld Title (N)" → bullet '•' objectives
      - Sek II 2022:  "Inhaltsfeld Title" → bullet '•' objectives
      - Sek II 2013:  "Inhaltsfeld TITLE" → bullet '■'/'□' objectives
    """
    topics: list[Topic] = []
    lines = text.split("\n")

    current_title: str | None = None
    current_objectives: list[str] = []
    in_inhaltsfeld = False

    if_match_colon = re.compile(r"^Inhaltsfeld\s+\d+\s*:\s*(.+)", re.IGNORECASE)
    if_match_parens = re.compile(
        r"^Inhaltsfeld\s+(.+?)\s*\(\s*\d+\s*\)\s*$", re.IGNORECASE
    )
    if_match_plain = re.compile(r"^Inhaltsfeld\s+(Organization|Organische|Stoffklassen|Stoffe|Stoff|Chemische|Reaktion|Verbindung|Luft|Wasser|Metall|Säure|Base|Salz|Ion|Molekül|Elektro|Energie|Kunststoff|Werkstoff|Farbe|Kohlenwasserstoff|Alkohol|Aldehyd|Keton|Carbonsäure|Ester|Fett|Kohlenhydrat|Eiweiß|Naturstoff|Katalyse|Gleichgewicht|Geschwindigkeit|Technik|Produkt|Modell|Atom|Element|Periodensystem)[a-zA-Zäöüß\s,\-–]+", re.IGNORECASE)

    def _strip_invisible(line: str) -> str:
        return re.sub(r"[\uf000-\uffff\U00010000-\U0010ffff]", "", line)

    def _is_meta_line(line: str) -> bool:
        meta_kw = [
            "Inhaltliche Schwerpunkte",
            "Mögliche Kontexte",
            "Vorschläge für mögliche Kontexte",
            "Basiskonzept",
            "Ausgewählte Beiträge zu den Basiskonzepten",
            "Umgang mit Fachwissen",
            "Erkenntnisgewinnung",
            "Kommunikation",
            "Bewertung",
            "Sachkompetenz",
            "Erkenntnisgewinnungskompetenz",
            "Bewertungskompetenz",
            "Kompetenzbereiche, Inhaltsfelder",
            "Kompetenzerwartungen und inhaltliche Schwerpunkte",
            "Beiträge zu den Basiskonzepten",
            "Die Schülerinnen und Schüler",
            "Schülerinnen und Schüler können",
            "Schülerinnen und Schüler",
            "Kompetenzbereich",
            "Kernlehrplan",
            "Ministerium",
            "Abbildungsverzeichnis",
            "Vorbemerkungen",
            "Online-Fassung",
            "Herausgeber",
            "Herausgegeben",
            "Lernerfolgsüberprüfung",
            "Leistungsbewertung",
            "Grundsätze der Leistungsbewertung",
        ]
        return any(kw in line for kw in meta_kw)

    for line in lines:
        line = _clean(line)
        line = _strip_invisible(line)
        if not line or len(line) < 5:
            continue
        if re.match(r"^\d+$", line):
            continue

        m_colon = if_match_colon.match(line)
        if m_colon:
            if current_title and current_objectives:
                los = [LearningObjective(text=o) for o in current_objectives]
                topics.append(Topic(title=current_title, learning_objectives=los))
            current_title = _clean(m_colon.group(1))
            current_objectives = []
            in_inhaltsfeld = True
            continue

        m_parens = if_match_parens.match(line)
        if m_parens:
            if current_title and current_objectives:
                los = [LearningObjective(text=o) for o in current_objectives]
                topics.append(Topic(title=current_title, learning_objectives=los))
            current_title = _clean(m_parens.group(1))
            current_objectives = []
            in_inhaltsfeld = True
            continue

        m_plain = if_match_plain.match(line)
        if m_plain:
            if current_title and current_objectives:
                los = [LearningObjective(text=o) for o in current_objectives]
                topics.append(Topic(title=current_title, learning_objectives=los))
            current_title = _clean(m_plain.group(1))
            current_objectives = []
            in_inhaltsfeld = True
            continue

        # Catch-all Inhaltsfeld/Inhaltsfelder detection — also triggers when already in one
        if_match_start = re.search(r"^\s*Inhaltsfeld(?:er)?\b", line)
        if if_match_start and not _is_meta_line(line):
            title_part = line[if_match_start.end():].strip()
            title_part = re.sub(r"[\u2000-\uFFFF]", "", title_part).strip()
            title_part = _clean(title_part)
            if title_part and len(title_part) > 5:
                if current_title and current_objectives:
                    los = [LearningObjective(text=o) for o in current_objectives]
                    topics.append(Topic(title=current_title, learning_objectives=los))
                current_title = title_part
                current_objectives = []
                in_inhaltsfeld = True
                continue

        if not current_title or not in_inhaltsfeld:
            continue

        if _is_meta_line(line):
            continue

        cleaned = line.lstrip("•■□–- \t ")
        cleaned = re.sub(r"\s+", " ", cleaned).strip()

        if not cleaned or len(cleaned) < 10:
            continue

        if _is_meta_line(cleaned):
            continue

        if re.match(r"^\(cid:\d+\)", cleaned, re.IGNORECASE):
            continue

        current_objectives.append(cleaned)

    if current_title and current_objectives:
        los = [LearningObjective(text=o) for o in current_objectives]
        topics.append(Topic(title=current_title, learning_objectives=los))

    # Fallback: If no Inhaltsfeld markers found at all, collect all meaningful
    # non-meta lines as a single combined topic. This handles Realschule erste
    # Progressionsstufe and E-Phase sections that don't use Inhaltsfeld headings.
    if not topics and current_objectives:
        los = [LearningObjective(text=o) for o in current_objectives]
        topics.append(Topic(title="Chemie", learning_objectives=los))
    elif not topics:
        # Try collecting any content lines that were skipped (in_inhaltsfeld=False)
        collected: list[str] = []
        for line in text.split("\n"):
            cl = _clean(line)
            cl = _strip_invisible(cl)
            if not cl or len(cl) < 10:
                continue
            if _is_meta_line(cl):
                continue
            if re.match(r"^(?:Inhaltsfeld|Inhaltsfelder)", cl):
                continue
            collected.append(cl)
        if collected:
            topics.append(Topic(
                title="Chemie",
                learning_objectives=[LearningObjective(text=t) for t in collected],
            ))

    return topics


def _parse_pdf(text: str) -> list[GradeLevel]:
    text = _normalize(text)

    grades: list[GradeLevel] = []

    # Try Gymnasium Sek I format: "Erste Stufe" / "Zweite Stufe"
    stufe1_match = re.search(r"Erste Stufe\s*$", text, re.MULTILINE)
    stufe2_match = re.search(r"Zweite Stufe\s*$", text, re.MULTILINE)

    if stufe1_match and stufe2_match:
        s1_text = text[stufe1_match.start() : stufe2_match.start()]
        s2_text = text[stufe2_match.start() :]

        topics_s1 = _extract_topics(s1_text)
        if topics_s1:
            grades.append(GradeLevel(grade="5-7", topics=topics_s1))

        topics_s2 = _extract_topics(s2_text)
        if topics_s2:
            grades.append(GradeLevel(grade="8-10", topics=topics_s2))

        return grades

    # Try Realschule format: "ersten Progressionsstufe" / "zweiten Progressionsstufe"
    prog1_match = re.search(r"ersten? Progressionsstufe", text, re.IGNORECASE)
    prog2_match = re.search(r"zweiten? Progressionsstufe", text, re.IGNORECASE)

    if prog1_match and prog2_match:
        s1_text = text[prog1_match.start() : prog2_match.start()]
        s2_text = text[prog2_match.start() :]

        topics_s1 = _extract_topics(s1_text)
        if topics_s1:
            grades.append(GradeLevel(grade="5-8", topics=topics_s1))

        topics_s2 = _extract_topics(s2_text)
        if topics_s2:
            grades.append(GradeLevel(grade="9-10", topics=topics_s2))

        return grades

    # Try Sek II format: "Einführungsphase" / "Qualifikationsphase"
    ephase_match = re.search(r"Einführungsphase", text)
    qphase_match = re.search(r"Qualifikationsphase", text)

    if ephase_match and qphase_match:
        e_text = text[ephase_match.start() : qphase_match.start()]
        q_text = text[qphase_match.start() :]

        topics_e = _extract_topics(e_text)
        if topics_e:
            grades.append(GradeLevel(grade="11 (E-Phase)", topics=topics_e))

        topics_q = _extract_topics(q_text)
        if topics_q:
            grades.append(GradeLevel(grade="12/13 (Q-Phase)", topics=topics_q))

        return grades

    topics = _extract_topics(text)
    if topics:
        grades.append(GradeLevel(grade="Gesamt", topics=topics))

    return grades


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
        print(
            f"    grade {g.grade}: {len(g.topics)} topic(s), "
            f"{sum(len(t.learning_objectives) for t in g.topics)} objectives"
        )

    return SchoolTypeCurriculum(
        school_type=school_type,
        grade_levels=grades,
        source_url=url,
        last_checked=date.today().isoformat(),
    )


async def scrape() -> StateCurriculum | None:
    """Scrape NRW chemistry curricula using Playwright for PDF discovery."""
    print()

    loop = asyncio.get_running_loop()
    pdfs: dict[str, str] = await loop.run_in_executor(None, _discover_pdfs)

    if not pdfs:
        print("    [warn] no PDFs discovered via Playwright")
        return None

    print()

    school_curricula: list[SchoolTypeCurriculum] = []
    source_urls: list[str] = []

    for school_type, url in pdfs.items():
        sc = _parse_school_type(school_type, url)
        if sc is not None:
            school_curricula.append(sc)
            source_urls.append(sc.source_url)

    if not school_curricula:
        return None

    source_urls.append(f"{BASE_URL}/lehrplannavigator-sekundarstufe-i-richtlinien-und-kernlehrplaene")
    source_urls.append(f"{BASE_URL}/lehrplannavigator-sekundarstufe-ii-richtlinien-und-kernlehrplaene")

    return StateCurriculum(
        state="Nordrhein-Westfalen",
        state_abbr="NW",
        school_curricula=school_curricula,
        last_updated=str(date.today()),
        source_urls=source_urls,
    )
