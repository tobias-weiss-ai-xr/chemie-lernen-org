"""Saarland — Kernlehrplan Chemie (PDF-based, per-grade G9).

IMPORTANT: The Saarland PDFs are behind BunnyCDN Shield (JS challenge).
The standard requests/urllib approach returns 403. Playwright is used to
bypass the CDN shield by running real JavaScript.

Sources:
  G9 Klasse 8:
    https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/...
  G9 Klasse 9:
    https://www.saarland.de/SharedDocs/Downloads/DE/mbk/Lehrpl%C3%A4ne/...
  Portal: https://www.saarland.de/mbk/DE/portale/bildungsserver/...

TODO:
  - G9 Klasse 5/6, 7, 10 URLs not yet found.
  - GOS (gymnasiale Oberstufe) and Gemeinschaftsschule URLs not yet found.
"""

from __future__ import annotations

import asyncio
import io
import os
import re
import shutil
from datetime import date

import pdfplumber
import requests

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

def _fetch_pdf_with_requests(url: str) -> bytes | None:
    """Try to download PDF via standard requests (may fail on BunnyCDN)."""
    try:
        session = requests.Session()
        session.headers.update({"User-Agent": USER_AGENT})
        resp = session.get(url, timeout=120)
        resp.raise_for_status()
        return resp.content
    except requests.RequestException:
        return None


def _fetch_pdf_with_playwright(url: str) -> bytes | None:
    """Download PDF via Playwright to bypass BunnyCDN Shield."""
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print("    [warn] Playwright not installed — can't bypass BunnyCDN")
        return None

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(
                headless=True,
                args=["--disable-blink-features=AutomationControlled",
                      "--no-sandbox"],
            )
            context = browser.new_context(
                user_agent=USER_AGENT,
                viewport={"width": 1920, "height": 1080},
                locale="de-DE",
                accept_downloads=True,
            )
            page = context.new_page()
            page.goto("about:blank")

            download_result = [None]

            def on_download(dl):
                download_result[0] = dl

            page.on("download", on_download)
            page.evaluate(f"window.location.href = '{url}'")

            for _ in range(60):
                if download_result[0] is not None:
                    break
                page.wait_for_timeout(1000)

            if download_result[0] is None:
                print("    [warn] Playwright download timeout")
                browser.close()
                return None

            path = download_result[0].path()
            if path and os.path.exists(path):
                with open(path, "rb") as f:
                    data = f.read()
                browser.close()
                return data

            browser.close()
            return None
    except Exception as e:
        print(f"    [warn] Playwright download failed: {e}")
        return None


def _fetch_pdf_text_sync(url: str) -> str | None:
    """Synchronous fetch — used when called from async context via thread pool."""
    content = _fetch_pdf_with_requests(url)
    if content is None:
        print("     requests failed, trying Playwright...", end="", flush=True)
        content = _fetch_pdf_with_playwright(url)
        if content is None:
            print(" FAILED")
            return None
        print(" OK")

    try:
        with pdfplumber.open(io.BytesIO(content)) as pdf:
            all_text: list[str] = []
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    all_text.append(text)
        return "\n".join(all_text)
    except Exception as e:
        print(f"    [warn] PDF parsing failed: {url} — {e}")
        return None


def _fetch_pdf_text(url: str) -> str | None:
    """Download and extract text from a Saarland PDF.

    Tries requests first (fast path), falls back to Playwright if 403/blocked.
    Playwright sync API runs in a thread pool to avoid async loop conflicts.
    """
    content = _fetch_pdf_with_requests(url)
    if content is not None:
        try:
            with pdfplumber.open(io.BytesIO(content)) as pdf:
                all_text: list[str] = []
                for page in pdf.pages:
                    text = page.extract_text()
                    if text:
                        all_text.append(text)
            return "\n".join(all_text)
        except Exception as e:
            print(f"    [warn] PDF parsing failed: {url} — {e}")
            return None

    print("     requests failed, trying Playwright in thread...", end="", flush=True)
    from concurrent.futures import ThreadPoolExecutor
    with ThreadPoolExecutor() as pool:
        future = pool.submit(_fetch_pdf_text_sync, url)
        try:
            result = future.result(timeout=180)
            if result is not None:
                print(" OK")
            else:
                print(" FAILED")
            return result
        except Exception as e:
            print(f" FAILED ({e})")
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
    """Extract topics (Module from Themenfelder) and learning objectives.

    SL PDFs use format:
      A 1 Experimentieren, aber sicher!
        Die Schülerinnen und Schüler
        • bullet-point objectives

    Module headings are letter+number+title (e.g. "A 1 Experimentieren, aber sicher!").
    """
    topics: list[Topic] = []
    lines = text.split("\n")

    current_title: str | None = None
    current_objectives: list[str] = []

    module_pat = re.compile(r"^\s*([A-Z])\s+(\d+)\s+(.{5,})")

    for line in lines:
        line = _clean(line)
        if not line or len(line) < 5:
            continue
        if any(kw in line for kw in ["Seite", "Inhaltsverzeichnis", "Vorwort"]):
            continue
        if re.match(r"^\d+$", line):
            continue
        if "FACHANFORDERUNGEN" in line and "CHEMIE" in line:
            continue
        if "Saarland" in line and ("Ministerium" in line or "Lehrplan" in line):
            continue

        m = module_pat.match(line)
        if m:
            if current_title and current_objectives:
                los = [LearningObjective(text=o) for o in current_objectives]
                topics.append(Topic(title=current_title, learning_objectives=los))
            full_title = f"{m.group(1)}{m.group(2)} {m.group(3)}"
            current_title = _clean(full_title)
            current_objectives = []
            continue

        if current_title:
            cleaned = re.sub(
                r"^[\s•–\- ✦\d.()a-z)]+\s+", "", line
            ).strip()
            if cleaned and len(cleaned) > 15:
                if not re.match(
                    r"^(Kompetenzerwartungen|Vorschläge|Hinweise|Basisbegriffe)",
                    cleaned,
                ):
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
