# AI Article Pipeline for chemie-lernen.org

**Date:** 2026-05-23
**Status:** Draft

## Overview

Automated daily pipeline that fetches chemistry research/news from RSS feeds, uses litellm (local LLM) to generate German-language articles, and publishes them to the Hugo site.

## Data Sources

Config file: `scripts/feeds.json`

| Feed | Lang | Category |
|------|------|----------|
| arXiv Chemistry (cs.CE) | en | research |
| Chemistry World (RSC) | en | news |
| Spektrum.de Chemie | de | news |
| Phys.org Chemistry News | en | news |
| C&EN (ACS) | en | news |
| Nature Chemistry | en | research |
| GDCh News | de | news |

Feed config is extensible — add/remove entries via the JSON array.

## Pipeline Architecture

### Trigger: systemd timer
- `chemie-article-pipeline.timer`: daily at 04:42 UTC
- `chemie-article-pipeline.service`: executes the script

### Script: `scripts/article-pipeline.mjs`

1. **Fetch** — HTTPS GET all RSS feeds, parse with fast-xml-parser
2. **Filter** — deduplicate by URL, skip <2 sentence bodies, skip if URL already in `content/posts/`, pick top 3 by recency + relevance
3. **Generate** — POST to litellm (http://localhost:4000) with system prompt:

```
Du bist ein Chemie-Redakteur für chemie-lernen.org.
Fasse den folgenden Artikel auf Deutsch zusammen (max. 300 Wörter).
Ergänze Hintergrundwissen wenn relevant.
Formatiere chemische Formeln mit KaTeX ($...$ oder $$...$$).
Titel: max. 80 Zeichen, aussagekräftig.
Füge 3-5 relevante Tags hinzu (z.B. chemie, forschung, [spezifisches Thema]).
```

4. **Write** — save to `content/posts/YYYY-MM-DD-kebab-slug.md` with frontmatter:

```yaml
---
title: "Titel"
date: "2026-05-23T04:42:00+02:00"
tags: ["chemie", "forschung", "tag3"]
categories: ["forschung"]
draft: false
---
```

5. **Commit & Push** — `git add`, `git commit -m "articles: YYYY-MM-DD"`, `git push`

### Deploy
- Existing deploy systemd timer picks up the push and rebuilds automatically (nginx serves `public/`)

## Site Integration

Minimal Hugo changes:
- No new template needed — posts use the default `_default/single.html`
- The `/posts/` section listing works automatically via Hugo's default section list
- Existing KaTeX setup already renders any formulas in articles

## KG Integration (Future)

The script can query the Neo4j Knowledge Graph (http://knowledge-neo4j:7687) during generation to:
- Check if an entity or topic already exists in the KG
- Retrieve related context for richer articles
- Store generated articles back into the KG as Document nodes

This is deferred to a later phase when the KG has more chemistry content.

## File Structure

```
scripts/
  article-pipeline.mjs    # Main pipeline script
  feeds.json              # RSS feed configuration
```

No changes to existing Hugo templates or infrastructure beyond what's listed.
