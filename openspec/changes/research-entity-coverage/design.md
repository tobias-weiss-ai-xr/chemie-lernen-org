# Design: research-entity-coverage

## Candidate filtering (`scripts/generate-chemistry-article.ts`)

Nach dem Holen der Top-`N` Entitäten (`getHotChemistryTopics(100)`):

```
if (outArg) {
  const covered = readCoveredEntities(outArg);   // entity: + title(+base)
  const uncovered = topics.filter(t => !isCovered(covered, t.name));
  topics = uncovered.length ? uncovered : topics; // Fallback: alles neu
}
```

`readCoveredEntities` scannt `OUT_DIR/*.md` (außer `_index.md`) und sammelt
Coverage-Keys aus:

- `entity:`-Feld (kanonischer KG-Name, neue Artikel) – exakte Treffer
- `title:` sowie dessen Basis (vor `:`/`,`) – abwärtskompatibel zu alten
  Artikeln, deren Titel LLM-expandiert sind (z. B. „Redox: …“)

`isCovered(keys, name)` = exakte Übereinstimmung **oder** Präfix
(`key.startsWith(name)`), damit ein Basis-Entitätsname eine bereits
existierende, dazu passende Expand-Titel-Artikel erkennt.

`--index` (aus dem Workflow-Loop) greift danach auf die gefilterte Liste –
jeder Schleifendurchlauf trifft eine noch unabgedeckte Entität. Innerhalb
eines Runs sieht jeder Durchlauf die zuvor geschriebenen Artikel, sodass
auch innerhalb eines Batches gestreut wird.

## `entity:`-Feld (`src/lib/article-generator.ts`)

`ChemistryArticle` erhält `name: string` (= `topic.name`). Das Frontmatter
bekommt `entity: ${article.name}` (direkt nach `description:`). Hugo ignoriert
unbekannte Felder; für künftige KG-Verknüpfungen (z. B. learning-research)
ist der kanonische Name schon vorhanden.

## Grenzen

Bestehende (vor dem Change erzeugte) Artikel haben kein `entity:`-Feld. Sind
sie einem _Sub-Konzept_ des KG-Namens gewidmet (z. B. Titel enthält
„Quantenphysik“, KG-Name ist „Quantenphysik“), greift das Präfix-Matching
nicht zuverlässig – solche Entitäten werden einmal neu erzeugt (dann mit
korrektem `entity:`-Feld) und danach ausgeschlossen. Die Abdeckung wächst
also über die Zeit selbstkorrigierend.
