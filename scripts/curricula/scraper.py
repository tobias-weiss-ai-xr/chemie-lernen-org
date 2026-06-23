#!/usr/bin/env python3
"""Orchestrator for scraping German chemistry curricula (Bildungspläne).

Usage:
    python3 scraper.py                          # scrape all sources
    python3 scraper.py --state bw               # scrape single state
    python3 scraper.py --output /path/to/dir    # custom output dir
    python3 scraper.py --force                  # ignore checksums, re-scrape all
    python3 scraper.py --status                 # show state implementation status
"""

from __future__ import annotations

import argparse
import asyncio
import json
import sys
from datetime import date
from pathlib import Path

from diff import load_checksums, save_checksums, compute_checksum
from schema import StateCurriculum, write_curriculum, write_index
from sources import REGISTRY, STATE_META
from validate import validate_curriculum, print_validation

# Default output directory — Hugo's data/curricula/
DEFAULT_OUTPUT = Path(__file__).resolve().parents[2] / "myhugoapp" / "data" / "curricula"


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Scrape German chemistry curricula")
    p.add_argument("--state", "-s", choices=list(REGISTRY) + ["all"], default="all",
                    help="Which state(s) to scrape (default: all)")
    p.add_argument("--output", "-o", type=Path, default=DEFAULT_OUTPUT,
                    help=f"Output directory (default: {DEFAULT_OUTPUT})")
    p.add_argument("--force", "-f", action="store_true",
                    help="Ignore checksums, re-scrape everything")
    p.add_argument("--status", action="store_true",
                    help="Show implementation status for all states and exit")
    return p.parse_args(argv)


def show_status() -> None:
    """Print a summary table of all 16 states and their scraper status."""
    print("Bundesland Curriculum Scraper — Status")
    print("=" * 72)
    print(f"{'Abbr':<6} {'State':<28} {'Status':<18} {'Format':<10} {'Source'}")
    print("-" * 72)
    for abbr in sorted(STATE_META, key=lambda x: STATE_META[x]["name"]):
        meta = STATE_META[abbr]
        # Map REGISTRY key (lowercase) to STATE_META abbr — NRW uses "nrw"/"NW"
        reg_key = abbr.lower()
        in_registry = "✓" if reg_key in REGISTRY else "✗"
        status_icon = meta["status"][:2]  # Take emoji prefix
        print(f"{abbr:<6} {meta['name']:<28} {status_icon:<2} {meta['status'][2:].strip():<15} {meta['format']:<10} {meta['url']}")
    print("=" * 72)
    working = sum(1 for m in STATE_META.values() if m["status"].startswith("✅"))
    print(f"Working: {working}/16 states")


async def scrape_state(
    state_key: str,
    module,
    output_dir: Path,
    checksums: dict[str, str],
    force: bool,
) -> StateCurriculum | None:
    """Scrape a single state's curriculum and write it to disk.

    Returns the curriculum if scraped, or None if skipped (unchanged).
    """
    print(f"  → {state_key.upper()}: scraping ...", end="", flush=True)

    try:
        curriculum = await module.scrape()
    except Exception as e:
        print(f" FAILED: {e}")
        return None

    if curriculum is None:
        print(" skipped (source unavailable)")
        return None

    # Quality gate
    validation_warnings = validate_curriculum(curriculum, state_key)
    if validation_warnings:
        print()
        print_validation(validation_warnings)

    # Compute checksum from the output JSON for change detection
    content = json.dumps(curriculum.to_dict(), ensure_ascii=False)
    new_hash = compute_checksum(content)

    if not force and checksums.get(state_key) == new_hash:
        print(" unchanged (skipped)")
        return curriculum  # Return but don't write

    # Write curriculum JSON
    path = write_curriculum(curriculum, output_dir)
    checksums[state_key] = new_hash
    print(f" written ({len(curriculum.school_curricula)} school type(s))")
    return curriculum


async def main() -> None:
    args = parse_args()

    # Status-only mode
    if args.status:
        show_status()
        return

    output_dir = args.output
    output_dir.mkdir(parents=True, exist_ok=True)

    checksums = load_checksums(output_dir)
    print(f"Curriculum Scraper — output: {output_dir}")
    print()

    states_to_scrape = list(REGISTRY) if args.state == "all" else [args.state]

    results: list[StateCurriculum] = []
    for state_key in states_to_scrape:
        module = REGISTRY[state_key]
        curriculum = await scrape_state(
            state_key, module, output_dir, checksums, args.force,
        )
        if curriculum is not None:
            results.append(curriculum)

    # Write master index
    if results:
        write_index(results, output_dir)
        print(f"\nMaster index written ({len(results)} states)")

    # Persist checksums
    save_checksums(checksums, output_dir)
    print(f"Checksums saved ({len(checksums)} entries)")

    # Summary
    scraped = sum(1 for r in results if r is not None)
    print(f"\nDone. {scraped}/{len(states_to_scrape)} states scraped.")
    print(f"Data in: {output_dir.resolve()}")


if __name__ == "__main__":
    asyncio.run(main())
