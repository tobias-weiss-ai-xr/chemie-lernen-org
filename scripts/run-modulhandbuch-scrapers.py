#!/usr/bin/env python3
"""Run modulhandbuch scrapers and save catalog data to JSON.

Usage:
    python3 scripts/run-modulhandbuch-scrapers.py [--source lmu_muenchen|rwth_aachen|all]
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

# Ensure we can import from curricula_didaktik
sys.path.insert(0, str(Path(__file__).resolve().parent / "curricula_didaktik"))

from sources import MODULHANDBUCH_REGISTRY
from sources.modulhandbuch_framework import save_catalog

DEFAULT_OUTPUT = Path(__file__).resolve().parents[1] / "myhugoapp" / "data" / "modulhandbuch"


def run_source(source_key: str, module, output_dir: Path) -> bool:
    """Run a single scraper and save its output."""
    print(f"  → {source_key}: scraping ...", end=" ", flush=True)
    try:
        # Some scrapers are sync (def scrape), some are async (async def scrape)
        import inspect
        if inspect.iscoroutinefunction(module.scrape):
            import asyncio
            result = asyncio.run(module.scrape())
        else:
            result = module.scrape()
    except Exception as e:
        print(f"FAILED: {e}")
        return False

    if result is None:
        print("skipped (returned None)")
        return False

    path = save_catalog(result, output_dir)
    print(f"done → {path.name} ({len(result.modules)} modules)")
    return True


def main() -> None:
    parser = argparse.ArgumentParser(description="Run modulhandbuch scrapers")
    parser.add_argument("--source", "-s", choices=list(MODULHANDBUCH_REGISTRY) + ["all"], default="all")
    parser.add_argument("--output", "-o", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()

    output_dir = args.output
    output_dir.mkdir(parents=True, exist_ok=True)

    sources_to_run = list(MODULHANDBUCH_REGISTRY) if args.source == "all" else [args.source]

    print(f"Modulhandbuch Scraper Runner — output: {output_dir}")
    print()

    success = 0
    for key in sources_to_run:
        module = MODULHANDBUCH_REGISTRY[key]
        if run_source(key, module, output_dir):
            success += 1

    print(f"\nDone. {success}/{len(sources_to_run)} sources scraped successfully.")
    print(f"Data in: {output_dir.resolve()}")


if __name__ == "__main__":
    main()
