"""Shared framework for module catalog scrapers.

Each university source in scripts/curricula_didaktik/sources/
implements:

    async def scrape() -> ModuleCatalog | None:
        ...

The framework provides:
- A polite, retry-aware HTTP client
- A PDF/HTML/JSON-LD content extractor
- A normalization layer to convert raw scraped data into the
  Module/University/Lecturer/Degree/ECTS/ModuleOffering dataclasses
  defined in schema.py

This is part of the Modulhandbuch subset of the central Neo4j KG
(see openspec/specs/modulhandbuch-university/spec.md).
"""

from __future__ import annotations

import io
import json
import re
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

import requests
from bs4 import BeautifulSoup
from pdfplumber import PDF

from schema import (
    Degree,
    ECTS,
    Lecturer,
    Module,
    ModuleCatalog,
    ModuleOffering,
    University,
    write_module_catalog,
)

USER_AGENT = (
    "Mozilla/5.0 (compatible; chemie-lernen.org/1.0; "
    "+https://chemie-lernen.org/modulhandbuch)"
)
DEFAULT_TIMEOUT = 30
MAX_RETRIES = 3
RETRY_BACKOFF = 2.0


@dataclass
class FetchResult:
    """Result of a fetch operation."""
    url: str
    status_code: int
    text: str = ""
    content_bytes: bytes = b""
    content_type: str = ""
    error: str = ""


def fetch(url: str, accept: str = "text/html") -> FetchResult:
    """Fetch a URL with retries. Returns FetchResult with status/text/bytes."""
    headers = {
        "User-Agent": USER_AGENT,
        "Accept": accept,
        "Accept-Language": "en-US,en;q=0.9,de;q=0.8",
    }
    last_error = ""
    for attempt in range(MAX_RETRIES):
        try:
            r = requests.get(url, headers=headers, timeout=DEFAULT_TIMEOUT)
            if r.status_code == 200:
                return FetchResult(
                    url=url,
                    status_code=200,
                    text=r.text,
                    content_bytes=r.content,
                    content_type=r.headers.get("Content-Type", ""),
                )
            last_error = f"HTTP {r.status_code}"
        except requests.RequestException as e:
            last_error = str(e)
        if attempt < MAX_RETRIES - 1:
            time.sleep(RETRY_BACKOFF ** attempt)
    return FetchResult(url=url, status_code=0, error=last_error)


def parse_pdf(content_bytes: bytes) -> list[str]:
    """Extract text from a PDF. Returns a list of page strings."""
    pages = []
    try:
        with PDF(io.BytesIO(content_bytes)) as pdf:
            for page in pdf.pages:
                txt = page.extract_text() or ""
                pages.append(txt)
    except Exception as e:
        return [f"[PDF parse error: {e}]"]
    return pages


def parse_html(html: str) -> BeautifulSoup:
    """Parse HTML with BeautifulSoup."""
    return BeautifulSoup(html, "html.parser")


def extract_json_ld(soup: BeautifulSoup) -> list[dict]:
    """Extract all JSON-LD blocks from an HTML page."""
    blocks = []
    for tag in soup.find_all("script", type="application/ld+json"):
        try:
            blocks.append(json.loads(tag.string or "{}"))
        except (json.JSONDecodeError, TypeError):
            pass
    return blocks


def make_university(
    name: str, country: str, short_code: str, **kwargs
) -> University:
    """Factory for University with defaults."""
    return University(
        name=name,
        country=country,
        short_code=short_code,
        city=kwargs.get("city", ""),
        website=kwargs.get("website", ""),
    )


def make_module(
    short_code: str,
    code: str,
    name: str,
    ects: float,
    **kwargs,
) -> Module:
    """Factory for Module with defaults."""
    return Module(
        university_short_code=short_code,
        module_code=code,
        module_name=name,
        ects=ects,
        language=kwargs.get("language", "en"),
        level=kwargs.get("level", "BSc"),
        degree=kwargs.get("degree", ""),
        url=kwargs.get("url", ""),
        learning_outcomes=kwargs.get("learning_outcomes", []),
        content=kwargs.get("content", []),
        prerequisites=kwargs.get("prerequisites", []),
        examination=kwargs.get("examination", ""),
        offerings=kwargs.get("offerings", []),
    )


def save_catalog(catalog: ModuleCatalog, output_dir: Path) -> Path:
    """Write a ModuleCatalog to JSON."""
    return write_module_catalog(catalog, output_dir)


COMMON_HEADERS = {
    "User-Agent": USER_AGENT,
}
