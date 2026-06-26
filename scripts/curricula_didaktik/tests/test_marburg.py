"""Tests for the Marburg stub (VPN-only)."""

from __future__ import annotations

import sys
from pathlib import Path

import pytest
import responses

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import asyncio
from sources import marburg_modulhandbuch
from schema import ModuleCatalog


@responses.activate
def test_returns_empty_catalog_when_403():
    responses.add(
        responses.GET,
        marburg_modulhandbuch.CATALOG_URL,
        status=403,
    )
    catalog = asyncio.run(marburg_modulhandbuch.scrape())
    assert catalog is not None
    assert catalog.university.short_code == "marburg"
    assert catalog.modules == [], "Marburg is VPN-only; modules must be empty"
    # Degrees are still populated for forward compatibility
    degree_names = [d.name for d in catalog.degrees]
    assert "BSc Chemie" in degree_names


@responses.activate
def test_does_not_raise_on_permanent_failure():
    responses.add(
        responses.GET,
        marburg_modulhandbuch.CATALOG_URL,
        status=403,
    )
    # Should not raise — returns empty catalog instead
    catalog = asyncio.run(marburg_modulhandbuch.scrape())
    assert catalog is not None


@responses.activate
def test_does_not_retry_on_403():
    """403 is a permanent failure; should not be retried 3 times."""
    responses.add(
        responses.GET,
        marburg_modulhandbuch.CATALOG_URL,
        status=403,
    )
    asyncio.run(marburg_modulhandbuch.scrape())
    # Only 1 call expected (no retries on 403)
    assert len(responses.calls) == 1
