"""Tests for all seed scraper modules.

Validates that each seed scraper:
1. Can be imported successfully
2. Has a sync scrape() function (module catalog) or async (didaktik)
3. Returns a valid ModuleCatalog
4. Has populated university metadata
5. Has at least 1 module (non-empty for seed scrapers)

Run with: make test-scrapers  or  pytest tests/test_scrapers.py -v
"""

from __future__ import annotations

import asyncio
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sources import MODULHANDBUCH_REGISTRY, DIDAKTIK_REGISTRY, SOURCE_META
from schema import ModuleCatalog, Module

# Seed sources that should return >= 1 module
SEED_SOURCES = [
    "mit_ocw",
    "tum",
    "eth_zurich",
    "lmu_muenchen",
    "rwth_aachen",
    "cambridge",
    "imperial",
    "stanford",
    "u_tokyo",
    "kth",
    "heidelberg",
    "fu_berlin",
    "tu_wien",
    "oxford",
    "caltech",
]

# Sources expected to return empty (stub or limited-access)
EMPTY_SOURCES = ["marburg_modulhandbuch"]


class TestScraperImports:
    def test_all_seed_sources_registered(self):
        """Every SEED_SOURCES key exists in MODULHANDBUCH_REGISTRY."""
        for name in SEED_SOURCES:
            assert name in MODULHANDBUCH_REGISTRY, (
                f"{name} missing from MODULHANDBUCH_REGISTRY"
            )

    def test_all_seed_sources_have_valid_status(self):
        """Every seed scraper has status 'working' or 'seed' in SOURCE_META."""
        for name in SEED_SOURCES:
            meta = SOURCE_META.get(name)
            assert meta is not None, f"{name} missing from SOURCE_META"
            assert meta.get("status") in ("seed", "working"), (
                f"{name} status is '{meta.get('status')}', expected 'seed' or 'working'"
            )


class TestSeedScraperOutput:
    """Run each seed scraper and validate its output."""

    @pytest.mark.parametrize("source_name", SEED_SOURCES)
    def test_returns_module_catalog(self, source_name):
        """Scraper returns a non-None ModuleCatalog."""
        source = MODULHANDBUCH_REGISTRY[source_name]
        catalog = source.scrape()
        assert catalog is not None, f"{source_name}.scrape() returned None"
        assert isinstance(catalog, ModuleCatalog), (
            f"{source_name} returned {type(catalog).__name__}, expected ModuleCatalog"
        )

    @pytest.mark.parametrize("source_name", SEED_SOURCES)
    def test_has_university(self, source_name):
        """ModuleCatalog has a populated university."""
        source = MODULHANDBUCH_REGISTRY[source_name]
        catalog = source.scrape()
        uni = catalog.university
        assert uni is not None, f"{source_name} missing university"
        assert uni.short_code, f"{source_name} missing university short_code"
        assert uni.name, f"{source_name} missing university name"

    @pytest.mark.parametrize("source_name", SEED_SOURCES)
    def test_has_at_least_one_module(self, source_name):
        """Seed scraper returns at least one module."""
        source = MODULHANDBUCH_REGISTRY[source_name]
        catalog = source.scrape()
        assert len(catalog.modules) >= 1, (
            f"{source_name} has {len(catalog.modules)} modules, expected >= 1"
        )

    @pytest.mark.parametrize("source_name", SEED_SOURCES)
    def test_modules_have_required_fields(self, source_name):
        """Every module has code, name, ECTS, level, and university."""
        source = MODULHANDBUCH_REGISTRY[source_name]
        catalog = source.scrape()
        for i, mod in enumerate(catalog.modules):
            assert isinstance(mod, Module), (
                f"{source_name} module[{i}] is not a Module"
            )
            assert mod.module_code, (
                f"{source_name} module[{i}] missing module_code"
            )
            assert mod.module_name, (
                f"{source_name} module[{i}] missing module_name"
            )
            assert mod.ects is not None, (
                f"{source_name} module[{i}] ({mod.module_code}) ECTS is None"
            )
            assert mod.ects >= 0, (
                f"{source_name} module[{i}] ({mod.module_code}) ECTS={mod.ects}, expected >= 0"
            )
            assert mod.level, (
                f"{source_name} module[{i}] missing level"
            )
            assert mod.university_short_code, (
                f"{source_name} module[{i}] missing university_short_code"
            )

    @pytest.mark.parametrize("source_name", SEED_SOURCES)
    def test_has_unique_module_codes(self, source_name):
        """No duplicate module codes within a catalog."""
        source = MODULHANDBUCH_REGISTRY[source_name]
        catalog = source.scrape()
        codes = [m.module_code.upper() for m in catalog.modules]
        duplicates = {c for c in codes if codes.count(c) > 1}
        assert not duplicates, (
            f"{source_name}: duplicate module codes: {duplicates}"
        )

    @pytest.mark.parametrize("source_name", SEED_SOURCES)
    def test_has_degrees(self, source_name):
        """Seed scraper returns at least one degree."""
        source = MODULHANDBUCH_REGISTRY[source_name]
        catalog = source.scrape()
        assert len(catalog.degrees) >= 1, (
            f"{source_name} has {len(catalog.degrees)} degrees, expected >= 1"
        )

    @pytest.mark.parametrize("source_name", SEED_SOURCES)
    def test_degree_has_required_fields(self, source_name):
        """Every degree has name, level, and university_short_code."""
        source = MODULHANDBUCH_REGISTRY[source_name]
        catalog = source.scrape()
        for d in catalog.degrees:
            assert d.name, f"{source_name} degree missing name"
            assert d.level, f"{source_name} degree {d.name} missing level"
            assert d.university_short_code, (
                f"{source_name} degree {d.name} missing university_short_code"
            )

    @pytest.mark.parametrize("source_name", SEED_SOURCES)
    def test_degree_not_none(self, source_name):
        """Module degree is not None (display field, can be empty string)."""
        source = MODULHANDBUCH_REGISTRY[source_name]
        catalog = source.scrape()
        for mod in catalog.modules:
            assert mod.degree is not None, (
                f"{source_name} module {mod.module_code} degree is None"
            )


class TestEmptySources:
    """Sources expected to return empty catalogs (stubs, VPN-only)."""

    def get_empty_source(self, name):
        """Get source from modulhandbuch or didaktik registry."""
        if name in MODULHANDBUCH_REGISTRY:
            return MODULHANDBUCH_REGISTRY[name]
        if name in DIDAKTIK_REGISTRY:
            return DIDAKTIK_REGISTRY[name]
        return None

    @pytest.mark.parametrize("source_name", EMPTY_SOURCES)
    def test_returns_empty_modules(self, source_name):
        """Scraper returns with empty modules list."""
        source = self.get_empty_source(source_name)
        assert source is not None, (
            f"{source_name} not found in MODULHANDBUCH or DIDAKTIK registry"
        )
        result = source.scrape()
        # Handle both sync (ModuleCatalog) and async (coroutine) scrape
        if asyncio.iscoroutine(result):
            catalog = asyncio.run(result)
        else:
            catalog = result
        assert catalog is not None
        assert catalog.modules == [], (
            f"{source_name} should have 0 modules, got {len(catalog.modules)}"
        )
