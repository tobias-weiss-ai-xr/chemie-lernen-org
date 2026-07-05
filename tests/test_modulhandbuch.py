"""Tests for the Modulhandbuch schema and MIT OCW scraper.

These tests don't require Neo4j — they validate the data shape
and the scraper output.
"""

import importlib.util
import json
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent


def _register(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    mod = importlib.util.module_from_spec(spec)
    sys.modules[name] = mod
    spec.loader.exec_module(mod)
    return mod


# Register the curricula_didaktik package so relative imports work
if (REPO_ROOT / "scripts" / "curricula_didaktik" / "__init__.py").exists():
    _register(
        "curricula_didaktik",
        REPO_ROOT / "scripts" / "curricula_didaktik" / "__init__.py",
    )

schema = _register("schema", REPO_ROOT / "scripts" / "curricula_didaktik" / "schema.py")
framework = _register(
    "modulhandbuch_framework",
    REPO_ROOT / "scripts" / "curricula_didaktik" / "sources" / "modulhandbuch_framework.py",
)
mit_ocw = _register("mit_ocw", REPO_ROOT / "scripts" / "curricula_didaktik" / "sources" / "mit_ocw.py")


def test_schema_university():
    u = schema.University(name="MIT", country="US", short_code="MIT", city="Cambridge, MA")
    d = u.to_dict()
    assert d["name"] == "MIT"
    assert d["country"] == "US"
    assert d["short_code"] == "MIT"
    assert d["city"] == "Cambridge, MA"
    assert "website" not in d


def test_schema_module():
    m = schema.Module(
        university_short_code="MIT",
        module_code="5-03",
        module_name="Inorganic Chemistry I",
        ects=12.0,
    )
    d = m.to_dict()
    assert d["module_code"] == "5-03"
    assert d["ects"] == 12.0
    assert d["language"] == "de"
    assert "url" not in d
    assert "learning_outcomes" not in d


def test_schema_lecturer():
    l = schema.Lecturer(name="Dr. X", university_short_code="MIT", email="x@mit.edu")
    d = l.to_dict()
    assert d["name"] == "Dr. X"
    assert d["email"] == "x@mit.edu"


def test_schema_degree():
    d = schema.Degree(name="BSc Chemie", level="BSc", university_short_code="ETH")
    out = d.to_dict()
    assert out["level"] == "BSc"


def test_schema_ects():
    e = schema.ECTS(credits=5.0, workload_hours=150)
    out = e.to_dict()
    assert out["credits"] == 5.0
    assert out["workload_hours"] == 150


def test_schema_module_offering():
    o = schema.ModuleOffering(semester="WS", year=2025, lecturer_names=["Prof. A"])
    out = o.to_dict()
    assert out["semester"] == "WS"
    assert out["year"] == 2025
    assert out["lecturers"] == ["Prof. A"]


def test_schema_module_catalog_roundtrip():
    u = schema.University(name="Test Uni", country="DE", short_code="TU")
    m = schema.Module(
        university_short_code="TU",
        module_code="T-1",
        module_name="Test Module",
        ects=5.0,
        learning_outcomes=["L1", "L2"],
        content=["C1", "C2"],
    )
    deg = schema.Degree(name="BSc", level="BSc", university_short_code="TU")
    cat = schema.ModuleCatalog(university=u, modules=[m], degrees=[deg])
    d = cat.to_dict()
    assert d["university"]["short_code"] == "TU"
    assert len(d["modules"]) == 1
    assert len(d["degrees"]) == 1
    assert "last_updated" in d


def test_mit_ocw_scraper_returns_catalog():
    catalog = mit_ocw.scrape()
    assert catalog is not None
    assert catalog.university.short_code == "MIT"
    assert len(catalog.modules) >= 10
    assert all(m.ects > 0 for m in catalog.modules)
    assert all(m.module_code for m in catalog.modules)
    assert any(m.level == "MSc" for m in catalog.modules)


def test_mit_ocw_json_file_exists():
    p = REPO_ROOT / "myhugoapp" / "data" / "modulhandbuch" / "mit.json"
    assert p.exists(), f"Missing {p}"
    with open(p) as f:
        cat = json.load(f)
    assert cat["university"]["short_code"] == "MIT"
    assert len(cat["modules"]) >= 10


def test_all_modulhandbuch_universities_have_files():
    expected = ["mit", "eth", "tum", "lmu", "rwth", "cambridge", "imperial", "stanford", "utokyo", "kth", "caltech", "fu_berlin", "heid", "oxf", "tu_wien"]
    data_dir = REPO_ROOT / "myhugoapp" / "data" / "modulhandbuch"
    for code in expected:
        f = data_dir / f"{code}.json"
        assert f.exists(), f"Missing {f}"
        with open(f) as fp:
            cat = json.load(fp)
        assert "university" in cat
        assert "name" in cat["university"]
        assert "short_code" in cat["university"]


def test_central_kg_subset_filter():
    """The import script must scope to the modulhandbuch subset."""
    import re
    import_modulhandbuch_path = REPO_ROOT / "scripts" / "import-modulhandbuch.mjs"
    content = import_modulhandbuch_path.read_text()
    assert "MODULHANDBUCH_LABELS" in content
    assert "University" in content
    assert "Module" in content
    assert "Degree" in content
    assert "Lecturer" in content
    assert "ECTS" in content
    assert "ModuleOffering" in content
