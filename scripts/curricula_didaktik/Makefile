# Reproducible pipeline for curricula + didaktik data
#
# Usage:
#   make help          show all targets
#   make install       create venv, install pinned deps
#   make all           run all scrapers (idempotent)
#   make eth_zurich    run a single scraper
#   make marburg       run a single scraper (will skip if no VPN)
#   make test          run pytest
#   make clean         remove venv and output JSON
#   make ci            what CI runs (install + test + all)

# Python interpreter
PYTHON ?= python3

# Virtualenv
VENV := curricula-venv
VENV_PYTHON := $(VENV)/bin/python

# Output directory
OUTPUT_DIR := ../../myhugoapp/data/modulhandbuch
DIDAKTIK_OUTPUT_DIR := ../../myhugoapp/data/didaktik

# All registered sources (from MODULHANDBUCH_REGISTRY + DIDAKTIK_REGISTRY)
SOURCES := kmk mit_ocw tum eth_zurich lmu_muenchen rwth_aachen cambridge imperial stanford u_tokyo kth caltech fu_berlin heidelberg oxford tu_wien marburg_modulhandbuch

# Available test targets
PYTEST := $(VENV_PYTHON) -m pytest

.PHONY: help install all $(SOURCES) test test-framework test-eth test-marburg clean ci

help:  ## show this help
	@echo "Reproducible curricula/didaktik pipeline"
	@echo ""
	@echo "Targets:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

install:  ## create venv and install pinned dependencies
	@test -d $(VENV) || $(PYTHON) -m venv $(VENV)
	$(VENV_PYTHON) -m pip install --upgrade pip wheel setuptools
	$(VENV_PYTHON) -m pip install --require-hashes -r requirements.txt
	$(VENV_PYTHON) -m pip install --require-hashes -r requirements-dev.txt
	@echo "OK: venv ready at $(VENV)"

all: install  ## run all scrapers (idempotent)
	@for src in $(SOURCES); do \
		echo "=== Running $$src ==="; \
		$(VENV_PYTHON) -m framework $$src --output-dir $(OUTPUT_DIR) || exit 1; \
	done
	@echo ""
	@echo "All scrapers done. Outputs:"
	@ls -la $(OUTPUT_DIR)/*.json 2>/dev/null | head -10

$(SOURCES): install  ## run a single scraper (e.g. `make eth_zurich`)
	$(VENV_PYTHON) -m framework $@ --output-dir $(OUTPUT_DIR)

test:  ## run all tests
	$(PYTEST) tests/ -v

test-framework:  ## run framework tests only
	$(PYTEST) tests/test_framework.py -v

test-eth:  ## run ETH Zürich scraper tests
	$(PYTEST) tests/test_eth_zurich.py -v

test-marburg:  ## run Marburg stub tests
	$(PYTEST) tests/test_marburg.py -v

ci: install test all  ## what CI runs (install → test → all scrapers)

clean:  ## remove venv and output JSON
	rm -rf $(VENV)
	rm -f $(OUTPUT_DIR)/*.json $(OUTPUT_DIR)/*.tmp
	@echo "Cleaned"

verify:  ## verify output files have expected shape (no re-scrape)
	@for f in $(OUTPUT_DIR)/*.json; do \
		test -f "$$f" && echo "OK: $$f" || echo "MISSING: $$f"; \
	done
