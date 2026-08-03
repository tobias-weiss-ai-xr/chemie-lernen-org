"""Reproducible scraping framework for didaktik sources.

Provides:
- HTTP fetching with retries, timeouts, custom User-Agent
- HTML/JSON/PDF parsing helpers
- Idempotent output writing (checksums)
- Logging to stdout in a CI-friendly format
- Dry-run + force flags
- Exit codes: 0 = success, 1 = fetch failure, 2 = parse failure,
  3 = validation failure, 4 = write failure

Every source scraper should:
1. Import this framework
2. Define `async def scrape() -> list[...] | None`
3. Use `fetch_html()`, `fetch_json()`, `fetch_pdf()` to get content
4. Use `parse_html()`, `parse_pdf()` to extract data
5. Use `validate()` to check the parsed data
6. Return a dataclass list (or None on failure)

Example:
    from framework import fetch_html, parse_html, validate
    from schema import Module, ModuleCatalog, University

    async def scrape() -> ModuleCatalog | None:
        html = fetch_html("https://example.edu/catalog")
        if html is None:
            return None
        modules = parse_html(html)
        if not validate(modules):
            return None
        return ModuleCatalog(university=University(...), modules=modules)
"""

from __future__ import annotations

import hashlib
import json
import logging
import os
import re
import sys
import time
from dataclasses import dataclass
from datetime import date
from pathlib import Path
from typing import Any, Callable, Optional

import requests
from bs4 import BeautifulSoup

# Try to import pdfplumber; some scrapers won't need it
try:
    import pdfplumber
    PDFPLUMBER_AVAILABLE = True
except ImportError:
    PDFPLUMBER_AVAILABLE = False

# Exit codes
EXIT_OK = 0
EXIT_FETCH_ERROR = 1
EXIT_PARSE_ERROR = 2
EXIT_VALIDATION_ERROR = 3
EXIT_WRITE_ERROR = 4


class ExitCode:
    """Exit code namespace. Mirrors the module-level constants."""
    OK = EXIT_OK
    FETCH_ERROR = EXIT_FETCH_ERROR
    PARSE_ERROR = EXIT_PARSE_ERROR
    VALIDATION_ERROR = EXIT_VALIDATION_ERROR
    WRITE_ERROR = EXIT_WRITE_ERROR

# Default config (overridable via env)
DEFAULT_USER_AGENT = (
    "Mozilla/5.0 (compatible; chemie-lernen-org/1.0; "
    "+https://chemie-lernen.org/impressum)"
)
DEFAULT_TIMEOUT = 30
DEFAULT_MAX_RETRIES = 3
DEFAULT_RETRY_BACKOFF = 2.0

# Logger
log = logging.getLogger("curricula_didaktik")
log.setLevel(os.environ.get("LOG_LEVEL", "INFO"))


@dataclass
class FetchResult:
    """The result of a fetch operation."""
    url: str
    status_code: int
    content: bytes
    content_type: str
    response_time_ms: int

    @property
    def sha256(self) -> str:
        return hashlib.sha256(self.content).hexdigest()

    @property
    def is_html(self) -> bool:
        return "html" in self.content_type.lower()

    @property
    def is_json(self) -> bool:
        return "json" in self.content_type.lower()

    @property
    def is_pdf(self) -> bool:
        return "pdf" in self.content_type.lower() or self.content[:4] == b"%PDF"


class FetchError(Exception):
    """Raised when a fetch operation fails after all retries."""


class ParseError(Exception):
    """Raised when a parse operation produces no usable data."""


class ValidationError(Exception):
    """Raised when validation of parsed data fails."""


def _make_session() -> requests.Session:
    """Create a configured requests session."""
    session = requests.Session()
    session.headers.update({
        "User-Agent": os.environ.get("USER_AGENT", DEFAULT_USER_AGENT),
        "Accept": "text/html,application/xhtml+xml,application/json,application/pdf;q=0.9,*/*;q=0.8",
        "Accept-Language": "de-DE,de;q=0.9,en;q=0.8",
    })
    return session


def fetch(
    url: str,
    *,
    timeout: int = DEFAULT_TIMEOUT,
    max_retries: int = DEFAULT_MAX_RETRIES,
    session: Optional[requests.Session] = None,
    allow_redirects: bool = True,
) -> FetchResult:
    """Fetch a URL with retries. Returns FetchResult.

    Raises FetchError on failure (after all retries).
    """
    if session is None:
        session = _make_session()

    last_error = None
    for attempt in range(1, max_retries + 1):
        try:
            start = time.monotonic()
            response = session.get(
                url,
                timeout=timeout,
                allow_redirects=allow_redirects,
            )
            elapsed_ms = int((time.monotonic() - start) * 1000)

            if response.status_code == 200:
                return FetchResult(
                    url=response.url,
                    status_code=response.status_code,
                    content=response.content,
                    content_type=response.headers.get("Content-Type", ""),
                    response_time_ms=elapsed_ms,
                )

            if response.status_code in (403, 404, 410):
                raise FetchError(
                    f"HTTP {response.status_code} for {url} "
                    f"(permanent; not retrying)"
                )

            last_error = FetchError(
                f"HTTP {response.status_code} for {url}"
            )
        except requests.RequestException as e:
            last_error = FetchError(f"Request failed for {url}: {e}")

        if attempt < max_retries:
            backoff = DEFAULT_RETRY_BACKOFF ** attempt
            log.warning(
                "fetch attempt %d/%d failed for %s, retrying in %.1fs",
                attempt, max_retries, url, backoff,
            )
            time.sleep(backoff)

    raise last_error or FetchError(f"Exhausted retries for {url}")


def fetch_html(url: str, **kwargs) -> Optional[BeautifulSoup]:
    """Fetch a URL and parse it as HTML. Returns None on failure."""
    try:
        result = fetch(url, **kwargs)
        if not result.is_html:
            log.warning("fetch_html: %s returned %s (not HTML)",
                        url, result.content_type)
        return BeautifulSoup(result.content, "html.parser")
    except FetchError as e:
        log.error("fetch_html: %s", e)
        return None


def fetch_json(url: str, **kwargs) -> Optional[Any]:
    """Fetch a URL and parse it as JSON. Returns None on failure."""
    try:
        result = fetch(url, **kwargs)
        if not result.is_json:
            log.warning("fetch_json: %s returned %s (not JSON)",
                        url, result.content_type)
        return json.loads(result.content)
    except (FetchError, json.JSONDecodeError) as e:
        log.error("fetch_json: %s", e)
        return None


def fetch_pdf_text(url: str, **kwargs) -> Optional[str]:
    """Fetch a PDF and extract text. Returns None on failure."""
    if not PDFPLUMBER_AVAILABLE:
        log.error("fetch_pdf_text: pdfplumber not installed")
        return None
    try:
        result = fetch(url, **kwargs)
        if not result.is_pdf:
            log.warning("fetch_pdf_text: %s is not a PDF", url)
            return None
        import io
        with pdfplumber.open(io.BytesIO(result.content)) as pdf:
            pages = [page.extract_text() or "" for page in pdf.pages]
        return "\n\n".join(pages)
    except FetchError as e:
        log.error("fetch_pdf_text: %s", e)
        return None


def write_json_atomic(data: Any, path: Path) -> None:
    """Write JSON atomically (write to .tmp, then rename).

    Atomic write ensures CI never sees a half-written file.
    """
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp_path = path.with_suffix(path.suffix + ".tmp")
    try:
        tmp_path.write_text(
            json.dumps(data, ensure_ascii=False, indent=2, sort_keys=True),
            encoding="utf-8",
        )
        tmp_path.replace(path)
    except OSError as e:
        raise OSError(f"Failed to write {path}: {e}")


def compute_checksum(path: Path) -> str:
    """Compute SHA-256 checksum of a file."""
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            h.update(chunk)
    return h.hexdigest()


def should_skip(
    path: Path,
    expected_checksum: Optional[str] = None,
    force: bool = False,
) -> bool:
    """Return True if the output file exists and is up-to-date.

    Skips download/parse if:
    - File exists
    - And expected_checksum matches (or is None = no check)
    - And force is False

    Returns False if we need to re-run the pipeline.
    """
    if force:
        return False
    if not path.exists():
        return False
    if expected_checksum is None:
        return True
    actual = compute_checksum(path)
    return actual == expected_checksum


def parse_kv_pairs(text: str) -> dict[str, str]:
    """Parse lines of "key: value" into a dict.

    Common in German uni PDFs: "Modulcode: CHE-001\n ECTS: 5\n..."
    """
    result = {}
    for line in text.splitlines():
        line = line.strip()
        if not line or ":" not in line:
            continue
        key, _, value = line.partition(":")
        result[key.strip()] = value.strip()
    return result


def extract_list_after_marker(text: str, marker: str) -> list[str]:
    """Extract bullet-point or newline-separated items after a marker line.

    Example: extract_list_after_marker("Lernziele:\n- Verstehen ...\n- Anwenden ...", "Lernziele:")
    """
    if marker not in text:
        return []
    after = text.split(marker, 1)[1]
    lines = []
    for line in after.splitlines():
        stripped = line.strip()
        if not stripped:
            if lines:
                break
            continue
        if re.match(r"^[A-Z][A-Za-z]*\s*:", stripped):
            break
        lines.append(re.sub(r"^[-•*]\s*", "", stripped))
    return lines


def slugify(text: str) -> str:
    """Convert text to a URL-safe slug."""
    text = text.lower()
    text = re.sub(r"ä", "ae", text)
    text = re.sub(r"ö", "oe", text)
    text = re.sub(r"ü", "ue", text)
    text = re.sub(r"ß", "ss", text)
    text = re.sub(r"[^a-z0-9]+", "-", text)
    return text.strip("-")


def main(argv: list[str]) -> int:
    """CLI entry point. Returns exit code."""
    import argparse
    p = argparse.ArgumentParser(description="Run a didaktik source scraper")
    p.add_argument("source", help="source name from REGISTRY (e.g. eth_zurich)")
    p.add_argument("--output-dir", default="myhugoapp/data/modulhandbuch",
                   help="output directory")
    p.add_argument("--force", action="store_true",
                   help="re-run even if output is up-to-date")
    p.add_argument("--dry-run", action="store_true",
                   help="don't write output, just print to stdout")
    p.add_argument("--timeout", type=int, default=DEFAULT_TIMEOUT)
    p.add_argument("--max-retries", type=int, default=DEFAULT_MAX_RETRIES)
    args = p.parse_args(argv)

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(logging.Formatter(
        "%(asctime)s %(levelname)s %(name)s: %(message)s"
    ))
    log.addHandler(handler)

    from sources import REGISTRY
    if args.source not in REGISTRY:
        log.error("Unknown source: %s. Available: %s",
                  args.source, list(REGISTRY))
        return EXIT_FETCH_ERROR

    module = REGISTRY[args.source]
    log.info("Running scraper: %s", args.source)

    try:
        result = module.scrape()
        # Some scrapers are async (e.g. marburg_modulhandbuch); await them.
        if hasattr(result, '__await__'):
            import asyncio
            result = asyncio.run(result)
    except Exception as e:
        log.exception("Scraper %s raised: %s", args.source, e)
        return EXIT_PARSE_ERROR

    if result is None:
        log.error("Scraper %s returned None (not implemented or failed)",
                  args.source)
        return EXIT_FETCH_ERROR

    items = result if isinstance(result, (list, tuple)) else [result]
    log.info("Scraper %s returned %d item(s)", args.source, len(items))

    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    if args.dry_run:
        log.info("DRY RUN: would write %d item(s)", len(items))
        print(json.dumps(
            [i.to_dict() if hasattr(i, "to_dict") else i for i in items],
            ensure_ascii=False, indent=2,
        ))
        return EXIT_OK

    try:
        for item in items:
            if hasattr(item, "to_dict") and hasattr(item, "university"):
                from schema import write_module_catalog
                path = write_module_catalog(item, output_dir)
            else:
                from schema import write_dataset
                path = write_dataset(item, output_dir)
            log.info("Wrote %s (sha256=%s)",
                     path, compute_checksum(path)[:12])
    except OSError as e:
        log.error("Write failed: %s", e)
        return EXIT_WRITE_ERROR

    return EXIT_OK


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
