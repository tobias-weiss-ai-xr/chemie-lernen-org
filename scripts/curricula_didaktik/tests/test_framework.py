"""Tests for the framework module.

Run with: make test-framework
"""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path
from unittest import mock

import pytest
import responses

# Make the framework importable
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from framework import (
    ExitCode, fetch, fetch_html, fetch_json, fetch_pdf_text,
    write_json_atomic, compute_checksum, should_skip,
    parse_kv_pairs, extract_list_after_marker, slugify,
    FetchError,
)


class TestFetch:
    @responses.activate
    def test_fetch_success(self):
        responses.add(
            responses.GET,
            "https://example.com/data",
            body="hello",
            status=200,
            content_type="text/plain",
        )
        result = fetch("https://example.com/data", max_retries=1)
        assert result.status_code == 200
        assert result.content == b"hello"
        assert len(result.sha256) == 64

    @responses.activate
    def test_fetch_404_raises_immediately(self):
        responses.add(
            responses.GET,
            "https://example.com/missing",
            status=404,
        )
        with pytest.raises(FetchError, match="HTTP 404"):
            fetch("https://example.com/missing", max_retries=5)

    @responses.activate
    def test_fetch_403_raises_immediately(self):
        responses.add(
            responses.GET,
            "https://example.com/forbidden",
            status=403,
        )
        with pytest.raises(FetchError, match="HTTP 403"):
            fetch("https://example.com/forbidden", max_retries=5)

    @responses.activate
    def test_fetch_retries_on_500(self):
        responses.add(
            responses.GET,
            "https://example.com/flaky",
            status=500,
        )
        responses.add(
            responses.GET,
            "https://example.com/flaky",
            status=500,
        )
        responses.add(
            responses.GET,
            "https://example.com/flaky",
            body="finally",
            status=200,
        )
        result = fetch("https://example.com/flaky", max_retries=3)
        assert result.content == b"finally"

    @responses.activate
    def test_fetch_html_returns_soup(self):
        html = b"<html><body><h1>Hi</h1></body></html>"
        responses.add(
            responses.GET,
            "https://example.com/page",
            body=html,
            status=200,
            content_type="text/html; charset=utf-8",
        )
        soup = fetch_html("https://example.com/page", max_retries=1)
        assert soup is not None
        assert soup.h1.text == "Hi"

    @responses.activate
    def test_fetch_json_parses(self):
        responses.add(
            responses.GET,
            "https://example.com/data.json",
            json={"key": "value"},
            status=200,
        )
        data = fetch_json("https://example.com/data.json", max_retries=1)
        assert data == {"key": "value"}


class TestWriteJson:
    def test_write_json_atomic_creates_file(self, tmp_path):
        path = tmp_path / "out.json"
        write_json_atomic({"a": 1, "b": 2}, path)
        assert path.exists()
        data = json.loads(path.read_text())
        assert data == {"a": 1, "b": 2}

    def test_write_json_atomic_sorted_keys(self, tmp_path):
        path = tmp_path / "out.json"
        write_json_atomic({"b": 1, "a": 2}, path)
        text = path.read_text()
        # 'a' must come before 'b' (sorted)
        assert text.index('"a"') < text.index('"b"')

    def test_write_json_atomic_no_tmp_left(self, tmp_path):
        path = tmp_path / "out.json"
        write_json_atomic({"x": 1}, path)
        assert not (path.parent / "out.json.tmp").exists()

    def test_compute_checksum_deterministic(self, tmp_path):
        path = tmp_path / "f.txt"
        path.write_text("hello")
        c1 = compute_checksum(path)
        c2 = compute_checksum(path)
        assert c1 == c2
        assert len(c1) == 64


class TestShouldSkip:
    def test_skip_when_file_exists(self, tmp_path):
        path = tmp_path / "out.json"
        path.write_text("{}")
        assert should_skip(path, force=False) is True

    def test_dont_skip_when_no_file(self, tmp_path):
        path = tmp_path / "missing.json"
        assert should_skip(path, force=False) is False

    def test_dont_skip_when_force(self, tmp_path):
        path = tmp_path / "out.json"
        path.write_text("{}")
        assert should_skip(path, force=True) is False

    def test_skip_when_checksum_matches(self, tmp_path):
        path = tmp_path / "out.json"
        path.write_text("hello")
        expected = compute_checksum(path)
        assert should_skip(path, expected_checksum=expected, force=False) is True

    def test_dont_skip_when_checksum_differs(self, tmp_path):
        path = tmp_path / "out.json"
        path.write_text("hello")
        assert should_skip(path, expected_checksum="0" * 64, force=False) is False


class TestParseHelpers:
    def test_parse_kv_pairs(self):
        text = "Modulcode: CHE-001\nECTS: 5\nSprache: de"
        result = parse_kv_pairs(text)
        assert result == {"Modulcode": "CHE-001", "ECTS": "5", "Sprache": "de"}

    def test_parse_kv_pairs_skips_blank_lines(self):
        text = "Code: X\n\n\nECTS: 5"
        result = parse_kv_pairs(text)
        assert "Code" in result
        assert "ECTS" in result

    def test_parse_kv_pairs_handles_colon_in_value(self):
        text = "URL: https://example.com:8080/path"
        result = parse_kv_pairs(text)
        assert result["URL"] == "https://example.com:8080/path"

    def test_extract_list_after_marker(self):
        text = (
            "Module: CHE-001\n"
            "Lernziele:\n"
            "- Verstehen\n"
            "- Anwenden\n"
            "ECTS: 5"
        )
        result = extract_list_after_marker(text, "Lernziele:")
        assert result == ["Verstehen", "Anwenden"]

    def test_extract_list_after_marker_handles_bullets(self):
        text = "Inhalte:\n• Punkt A\n• Punkt B"
        result = extract_list_after_marker(text, "Inhalte:")
        assert result == ["Punkt A", "Punkt B"]

    def test_extract_list_after_marker_returns_empty_when_missing(self):
        result = extract_list_after_marker("no marker here", "Lernziele:")
        assert result == []


class TestSlugify:
    def test_basic(self):
        assert slugify("Hello World") == "hello-world"

    def test_german_umlauts(self):
        assert slugify("Säuren und Basen") == "saeuren-und-basen"
        assert slugify("Größe") == "groesse"
        assert slugify("Äpfel Öl Übung") == "aepfel-oel-uebung"

    def test_special_chars(self):
        assert slugify("H2O") == "h2o"
        assert slugify("NaCl (aq)") == "nacl-aq"

    def test_collapse_separators(self):
        assert slugify("a   b---c") == "a-b-c"


class TestExitCodes:
    def test_exit_codes_are_distinct(self):
        codes = [ExitCode.OK, ExitCode.FETCH_ERROR, ExitCode.PARSE_ERROR,
                 ExitCode.VALIDATION_ERROR, ExitCode.WRITE_ERROR]
        assert len(set(codes)) == len(codes)
        assert ExitCode.OK == 0
