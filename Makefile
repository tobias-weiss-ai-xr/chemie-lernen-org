# chemie-lernen.org — Main Makefile
# = 배경 informationssystem

# This Makefile provides a unified interface for building, testing, and
# managing the knowledge graph extension pipeline.
#
# Usage:
#   make help                  Show all available targets
#   make build                 Build the static site
#   make test                  Run all tests
#   make kg-extend             Run full knowledge graph extension
#   make kg-extend-quick       Run quick update (fast tasks only)
#   make kg-quality            Run quality assurance pipeline
#   make kg-content            Generate content pages from KG
#
# Environment Variables:
#   NEO4J_URI          Neo4j server URI (default: bolt://chemie-neo4j:7687)
#   NEO4J_USER         Neo4j username (default: neo4j)
#   NEO4J_PASSWORD     Neo4j password (required)
#   CONCURRENCY        Number of parallel tasks (default: 4)
#   DRY_RUN            Set to "true" for dry run
#

# =============================================================================
# CONFIGURATION
# =============================================================================

PROJECT_DIR := $(shell dirname $(abspath $(lastword $(MAKEFILE_LIST))))
SCRIPTS_DIR := $(PROJECT_DIR)/scripts
MYHUGOAPP_DIR := $(PROJECT_DIR)/myhugoapp
DOCKER_COMPOSE := docker compose

# Neo4j Configuration
NEO4J_URI ?= bolt://chemie-neo4j:7687
NEO4J_USER ?= neo4j
NEO4J_PASSWORD ?= $(shell grep NEO4J_PASSWORD .env 2>/dev/null | cut -d'=' -f2 | tr -d '"' || echo "chemie_knowledge_2024")
NEO4J_DATABASE ?= chemie

# TaskFleet Configuration
CONCURRENCY ?= 4
DRY_RUN ?= false
VERBOSE ?= false

# Hugo Configuration
HUGO_IMAGE := hugomods/hugo:exts
HUGO_PORT ?= 1313

# Export paths
EXPORT_DIR := $(MYHUGOAPP_DIR)/data


# =============================================================================
# TASKFLEET CONSTANTS (from taskfleet-config.mjs)
# =============================================================================

# Full KG extension pipeline
KG_EXTEND_TASKS := \
	merge-duplicate-entities \
	clean-garbage-subtopics \
	delete-orphaned-garbage \
	import-curricula-all \
	import-didaktik \
	enrich-entity-descriptions \
	enrich-isolated-entities \
	import-content-nodes \
	link-articles-to-entities \
	link-entities-to-curriculum \
	link-content \
	kg-enrich \
	kg-enrich-relations \
	generate-learning-paths \
	create-prerequisites \
	create-neo4j-indexes \
	export-kg-data \
	build-search-index \
	generate-entity-pages \
	generate-themenbereich-entities \
	generate-curricula-pages \
	kg-quality-audit \
	cross-link-audit \
	validate-curricula

# Quick update pipeline
KG_QUICK_TASKS := \
	enrich-entity-descriptions \
	import-content-nodes \
	link-articles-to-entities \
	export-kg-data \
	build-search-index \
	generate-entity-pages \
	fetch-zigs-videos

# Quality assurance pipeline
KG_QUALITY_TASKS := \
	merge-duplicate-entities \
	clean-garbage-subtopics \
	delete-orphaned-garbage \
	kg-quality-audit \
	cross-link-audit \
	audit-deep \
	audit-content-freshness \
	validate-curricula

# Content generation pipeline
KG_CONTENT_TASKS := \
	export-kg-data \
	generate-entity-pages \
	generate-themenbereich-entities \
	generate-curricula-pages \
	generate-modulhandbuch-pages \
	build-search-index \
	generate-chemie-raeume-manifest

# Entity enrichment pipeline
KG_ENTITY_TASKS := \
	enrich-entity-descriptions \
	enrich-isolated-entities \
	kg-enrich \
	kg-enrich-relations

# Curriculum linking pipeline
KG_CURRICULUM_TASKS := \
	import-curricula-all \
	enrich-entity-descriptions \
	import-content-nodes \
	link-articles-to-entities \
	link-entities-to-curriculum \
	generate-learning-paths \
	create-prerequisites \
	validate-curricula

# Data import pipeline
KG_IMPORT_TASKS := \
	import-curricula-all \
	import-didaktik \
	import-modulhandbuch \
	import-he-manual

# Index and search pipeline
KG_INDEX_TASKS := \
	create-neo4j-indexes \
	build-search-index


# =============================================================================
# CORE TARGETS
# =============================================================================

.PHONY: help
help: ## Show this help message
	@echo "chemie-lernen.org — Build & Knowledge Graph Management"
	@echo ""
	@echo "Core Targets:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  "; printf "%-20s", $$1; print $$2}'
	@echo ""
	@echo "Knowledge Graph Targets:"
	@grep -E '^kg-.*:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  "; printf "%-20s", $$1; print $$2}'
	@echo ""
	@echo "Testing Targets:"
	@grep -E '^test.*:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  "; printf "%-20s", $$1; print $$2}'
	@echo ""
	@echo "Docker Targets:"
	@grep -E '^docker.*:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  "; printf "%-20s", $$1; print $$2}'
	@echo ""
	@echo "Configuration:"
	@echo "  NEO4J_URI=$$NEO4J_URI"
	@echo "  NEO4J_DATABASE=$$NEO4J_DATABASE"
	@echo "  CONCURRENCY=$$CONCURRENCY"
	@echo ""
	@echo "Environment Variables:"
	@echo "  NEO4J_URI         Neo4j server URI"
	@echo "  NEO4J_USER        Neo4j username"
	@echo "  NEO4J_PASSWORD    Neo4j password (required)"
	@echo "  CONCURRENCY       Number of parallel tasks"
	@echo "  DRY_RUN           Set to true for dry run"
	@echo "  VERBOSE           Set to true for verbose output"


.PHONY: all
all: build ## Build the static site (default target)


.PHONY: build
build: hugo-build ## Build the static site with Hugo


.PHONY: hugo-build
hugo-build: ## Build static site using Docker
	$(DOCKER_COMPOSE) run --rm hugo hugo --baseURL https://chemie-lernen.org --minify


.PHONY: hugo-dev
hugo-dev: vendor-core ## Start Hugo dev server
	cd $(MYHUGOAPP_DIR) && $(DOCKER_COMPOSE) up -d hugo


.PHONY: hugo-stop
hugo-stop: ## Stop Hugo dev server
	$(DOCKER_COMPOSE) down


# =============================================================================
# KNOWLEDGE GRAPH TARGETS
# =============================================================================

# Sicherheits-Guard: verlangt Bestätigung, bevor etwas gegen Neo4j geschrieben wird.
# Überspringbar mit: make kg-extend SKIP_GUARD=1
.PHONY: kg-guard
kg-guard:
	@if [ -z "$${SKIP_GUARD:-}" ]; then \
		echo "⚠️  Diese Ziel wird Aufgaben GEGEN DIE NEO4j-DATENBANK ausführen."; \
		echo "    Ziel: $(NEO4J_URI) (database: $(NEO4J_DATABASE))"; \
		echo "    Um diese Warnung zu überspringen: SKIP_GUARD=1"; \
		echo ""; \
		printf "   Fortfahren? (y/N): "; \
		read ans; \
		if [ "$$ans" != "y" ] && [ "$$ans" != "Y" ]; then echo "Abgebrochen."; exit 1; fi; \
	fi

.PHONY: kg-extend
kg-extend: vendor-core kg-guard ## Run full knowledge graph extension pipeline
	$(eval TASKS := $(KG_EXTEND_TASKS))
	@echo "Running full KG extension pipeline ($(words $(TASKS)) tasks)..."
	@node $(SCRIPTS_DIR)/taskfleet.mjs --groups entity-enrichment,content-indexing,curriculum-linking,quality-assurance,index-search,curricula-didaktik --concurrency $(CONCURRENCY)


.PHONY: kg-extend-quick
kg-extend-quick: vendor-core kg-guard ## Run quick KG update (fast tasks only)
	@echo "Running quick KG update pipeline..."
	@node $(SCRIPTS_DIR)/taskfleet.mjs --tasks $(KG_QUICK_TASKS) --concurrency $(CONCURRENCY)


.PHONY: kg-quality
kg-quality: vendor-core kg-guard ## Run quality assurance pipeline
	@echo "Running QA pipeline..."
	@node $(SCRIPTS_DIR)/taskfleet.mjs --tasks $(KG_QUALITY_TASKS) --concurrency $(CONCURRENCY)


.PHONY: kg-content
kg-content: vendor-core kg-guard ## Generate content from knowledge graph
	@echo "Generating content from KG..."
	@node $(SCRIPTS_DIR)/taskfleet.mjs --tasks $(KG_CONTENT_TASKS) --concurrency $(CONCURRENCY)


.PHONY: kg-entities
kg-entities: vendor-core kg-guard ## Run entity enrichment pipeline
	@echo "Enriching entities..."
	@node $(SCRIPTS_DIR)/taskfleet.mjs --groups entity-enrichment --concurrency $(CONCURRENCY)


.PHONY: kg-curriculum
kg-curriculum: vendor-core kg-guard ## Run curriculum linking pipeline
	@echo "Linking curriculum..."
	@node $(SCRIPTS_DIR)/taskfleet.mjs --tasks $(KG_CURRICULUM_TASKS) --concurrency $(CONCURRENCY)


.PHONY: kg-import
kg-import: vendor-core kg-guard ## Run data import pipeline
	@echo "Importing data..."
	@node $(SCRIPTS_DIR)/taskfleet.mjs --tasks $(KG_IMPORT_TASKS) --concurrency $(CONCURRENCY)


.PHONY: kg-index
kg-index: vendor-core kg-guard ## Run index and search pipeline
	@echo "Building indexes..."
	@node $(SCRIPTS_DIR)/taskfleet.mjs --tasks $(KG_INDEX_TASKS) --concurrency $(CONCURRENCY)


.PHONY: kg-dry-run
kg-dry-run: ## Show KG extension plan without executing
	@echo "Dry run - showing execution plan..."
	@node $(SCRIPTS_DIR)/taskfleet.mjs --dry-run --concurrency $(CONCURRENCY)


.PHONY: kg-dry-run-full
kg-dry-run-full: ## Show full KG extension plan
	@echo "Dry run - full pipeline..."
	@node $(SCRIPTS_DIR)/taskfleet.mjs --dry-run --groups entity-enrichment,content-indexing,curriculum-linking,quality-assurance,index-search,curricula-didaktik --concurrency $(CONCURRENCY)


# =============================================================================
# DOCKER TARGETS
# =============================================================================

.PHONY: docker-up
docker-up: ## Start all Docker services
	$(DOCKER_COMPOSE) up -d


.PHONY: docker-down
docker-down: ## Stop all Docker services
	$(DOCKER_COMPOSE) down


.PHONY: docker-restart
docker-restart: docker-down docker-up ## Restart all Docker services


.PHONY: docker-logs
docker-logs: ## Show Docker service logs
	$(DOCKER_COMPOSE) logs -f


.PHONY: docker-ps
docker-ps: ## Show running Docker containers
	$(DOCKER_COMPOSE) ps


.PHONY: docker-build
docker-build: ## Build Docker images
	$(DOCKER_COMPOSE) build


.PHONY: vendor-core
vendor-core: ## Clone and sync the private chemie-core repository
	bash $(SCRIPTS_DIR)/vendor-core.sh


# =============================================================================
# TESTING TARGETS
# =============================================================================

.PHONY: test
test: vendor-core ## Run all tests
	NODE_OPTIONS="--experimental-vm-modules" npm test


.PHONY: test-unit
test-unit: vendor-core ## Run unit tests only
	NODE_OPTIONS="--experimental-vm-modules" npm run test:unit


.PHONY: test-coverage
test-coverage: vendor-core ## Run tests with coverage
	NODE_OPTIONS="--experimental-vm-modules" npm run test:coverage


.PHONY: test-watch
test-watch: vendor-core ## Run tests in watch mode
	NODE_OPTIONS="--experimental-vm-modules" npm run test:watch


.PHONY: lint
lint: ## Run linter
	npm run lint


.PHONY: lint-fix
lint-fix: ## Fix linting issues
	npm run lint:fix


.PHONY: format
format: ## Format all code
	npm run format


.PHONY: format-check
format-check: ## Check code formatting
	npm run format:check


.PHONY: validate
validate: lint format-check test-unit ## Run full validation


.PHONY: e2e
e2e: ## Run end-to-end tests
	npx playwright test


.PHONY: e2e-ui
e2e-ui: ## Run end-to-end tests with UI
	npx playwright test --ui


.PHONY: lighthouse
lighthouse: ## Run Lighthouse audit
	npm run lighthouse


# =============================================================================
# UTILITY TARGETS
# =============================================================================

.PHONY: clean
clean: ## Clean build artifacts
	rm -rf $(MYHUGOAPP_DIR)/public
	rm -rf node_modules


.PHONY: clean-all
clean-all: clean ## Clean all (including logs and temp files)
	rm -rf $(MYHUGOAPP_DIR)/public
	rm -rf node_modules
	rm -rf logs
	rm -rf tmp
	rm -rf .core


.PHONY: install
install: ## Install dependencies
	npm install


.PHONY: update
update: ## Update dependencies
	npm update


.PHONY: audit
audit: ## Check for security vulnerabilities
	npm audit


.PHONY: audit-fix
audit-fix: ## Fix security vulnerabilities
	npm audit fix


# =============================================================================
# KNOWLEDGE GRAPH SPECIFIC TARGETS
# =============================================================================

.PHONY: kg-backup
kg-backup: ## Create backup of knowledge graph
	node $(SCRIPTS_DIR)/export-graph-backup.mjs


.PHONY: kg-export
kg-export: ## Export KG data for Hugo
	node $(SCRIPTS_DIR)/export-kg-data.mjs


.PHONY: kg-stats
kg-stats: ## Show knowledge graph statistics
	@node scripts/kg-stats.mjs


.PHONY: kg-verify
kg-verify: vendor-core ## Verify KG data integrity
	node $(SCRIPTS_DIR)/kg-quality-audit.mjs


.PHONY: kg-curricula-import
kg-curricula-import: vendor-core ## Import all curricula
	node $(SCRIPTS_DIR)/import-curricula-all.mjs


.PHONY: kg-modulhandbuch-import
kg-modulhandbuch-import: vendor-core ## Import modulhandbuch data
	bash $(SCRIPTS_DIR)/vendor-core.sh
	node $(SCRIPTS_DIR)/import-modulhandbuch.mjs


.PHONY: kg-didaktik-import
kg-didaktik-import: vendor-core ## Import didaktik data
	node $(SCRIPTS_DIR)/import-didaktik.mjs


# =============================================================================
# PREDEFINED WORKFLOWS
# =============================================================================

.PHONY: workflow-full-rebuild
workflow-full-rebuild: clean-all install vendor-core kg-backup kg-extend build ## Full rebuild: clean, update KG, rebuild site


.PHONY: workflow-quick-update
workflow-quick-update: vendor-core kg-extend-quick build ## Quick update: update KG and rebuild site


.PHONY: workflow-deploy
workflow-deploy: workflow-full-rebuild docker-up ## Deploy: full rebuild and start services


.PHONY: workflow-develop
workflow-develop: install vendor-core hugo-dev ## Start development environment


.PHONY: workflow-test
workflow-test: validate e2e ## Run full test suite


# =============================================================================
# CLUSTER TARGETS (for haeuser cluster)
# =============================================================================

.PHONY: cluster-kg-extend
cluster-kg-extend: ## Run KG extension on cluster
	@echo "Running KG extension on cluster..."
	@bash $(SCRIPTS_DIR)/taskfleet-docker.sh --groups entity-enrichment,content-indexing,curriculum-linking --concurrency 8


.PHONY: cluster-kg-full
cluster-kg-full: ## Run full KG pipeline on cluster
	@echo "Running full KG pipeline on cluster..."
	@bash $(SCRIPTS_DIR)/taskfleet-docker.sh --concurrency 12


.PHONY: cluster-setup
cluster-setup: ## Setup cluster environment
	@echo "Setting up cluster environment..."
	# Add cluster-specific setup here


# =============================================================================
# CLEANUP TARGETS
# =============================================================================

.PHONY: reset-kg
reset-kg: ## CAUTION: Reset the entire knowledge graph
	@echo "⚠️  WARNING: This will delete ALL data from the knowledge graph!"
	@echo "To proceed, run: make reset-kg-confirm"


.PHONY: reset-kg-confirm
reset-kg-confirm: ## Actually reset the knowledge graph
	@echo "💥 Resetting knowledge graph..."
	# This is intentionally left empty for safety
	# Uncomment the following line if you really want to enable this:
	# node -e "const { getDriver } = require('@graphwiz/neo4j'); const driver = getDriver({ uri: '$(NEO4J_URI)', username: '$(NEO4J_USER)', password: '$(NEO4J_PASSWORD)', database: '$(NEO4J_DATABASE)' }); const session = driver.session({ database: '$(NEO4J_DATABASE)' }); session.run('MATCH (n) DETACH DELETE n').then(() => { console.log('✅ KG reset complete'); }).finally(() => { session.close(); driver.close(); });"
