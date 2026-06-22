#!/usr/bin/env python3
"""Orchestrator for scraping didactic guidelines (KMK, Modulhandbücher, Prüfungsordnungen).

Usage:
    python3 scraper.py                              # scrape all sources
    python3 scraper.py --source kmk                  # scrape single source
    python3 scraper.py --output /path/to/dir         # custom output dir
    python3 scraper.py --status                      # show source status
"""

from __future__ import annotations

import argparse
import asyncio
import json
import sys
from datetime import date
from pathlib import Path

from diff import load_checksums, save_checksums, compute_checksum
from schema import DidacticDataset, write_dataset
from sources import REGISTRY, SOURCE_META

DEFAULT_OUTPUT = Path(__file__).resolve().parents[2] / "myhugoapp" / "data" / "didaktik"


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Scrape didactic guidelines")
    p.add_argument("--source", "-s", choices=list(REGISTRY) + ["all"], default="all",
                    help="Which source(s) to scrape (default: all)")
    p.add_argument("--output", "-o", type=Path, default=DEFAULT_OUTPUT,
                    help=f"Output directory (default: {DEFAULT_OUTPUT})")
    p.add_argument("--force", "-f", action="store_true",
                    help="Ignore checksums, re-scrape everything")
    p.add_argument("--status", action="store_true",
                    help="Show source status and exit")
    return p.parse_args(argv)


def show_status() -> None:
    print("Didactic Guidelines Scraper — Status")
    print("=" * 72)
    print(f"{'Key':<24} {'Name':<40} {'Status'}")
    print("-" * 72)
    for key in sorted(SOURCE_META):
        meta = SOURCE_META[key]
        print(f"{key:<24} {meta['name']:<40} {meta['status']}")
    print("=" * 72)


async def scrape_source(
    source_key: str,
    module,
    output_dir: Path,
    checksums: dict[str, str],
    force: bool,
) -> list | None:
    print(f"  → {source_key}: scraping ...", end="", flush=True)

    try:
        result = await module.scrape()
    except Exception as e:
        print(f" FAILED: {e}")
        return None

    if result is None:
        print(" skipped (source unavailable)")
        return None

    content = json.dumps([g.to_dict() for g in result], ensure_ascii=False)
    new_hash = compute_checksum(content)

    if not force and checksums.get(source_key) == new_hash:
        print(" unchanged (skipped)")
        return result

    checksums[source_key] = new_hash
    print(f" done ({len(result)} guideline(s))")
    return result


async def main() -> None:
    args = parse_args()

    if args.status:
        show_status()
        return

    output_dir = args.output
    output_dir.mkdir(parents=True, exist_ok=True)

    checksums = load_checksums(output_dir)
    print(f"Didactic Guidelines Scraper — output: {output_dir}")
    print()

    sources_to_scrape = list(REGISTRY) if args.source == "all" else [args.source]

    all_guidelines: list = []
    for source_key in sources_to_scrape:
        module = REGISTRY[source_key]
        guidelines = await scrape_source(
            source_key, module, output_dir, checksums, args.force,
        )
        if guidelines:
            all_guidelines.extend(guidelines)

    if all_guidelines:
        dataset = DidacticDataset(
            guidelines=all_guidelines,
            last_updated=str(date.today()),
        )
        write_dataset(dataset, output_dir)
        print(f"\nDataset written ({len(all_guidelines)} guidelines)")

    save_checksums(checksums, output_dir)
    print(f"Checksums saved ({len(checksums)} entries)")

    print(f"\nDone. Data in: {output_dir.resolve()}")


if __name__ == "__main__":
    asyncio.run(main())
