# Sprint 2: Semantic RAG

**Goal**: Upgrade the KI-Assistent RAG system from keyword-based Neo4j search to semantic vector search using embeddings, improving relevance and recall.

## Scope

### Embedding Pipeline

- Choose embedding provider (local: sentence-transformers via ONNX, or API: OpenAI/text-embedding-3-small, LiteLLM-compatible)
- Create `scripts/generate-embeddings.mjs` — batch-generate embeddings for all Entity nodes (title + description), Topic nodes, UniversityModule nodes
- Store embeddings in Neo4j as node properties (`embedding: List<Float>`)
- Incremental update script for new/changed content

### Vector Index in Neo4j

- Create Neo4j vector index: `CREATE VECTOR INDEX entity_embeddings IF NOT EXISTS FOR (n:Entity) ON (n.embedding) OPTIONS {indexConfig: {vectorDimension: 384, similarityFunction: 'cosine'}}`
- Same for Topic, UniversityModule, Content labels

### Semantic Query in queryNeo4jRAG()

- New function `semanticSearch(query, labels, limit=5)` — embeds user query, runs `CALL db.index.vector.queryNodes`
- Combine with existing keyword search via weighted scoring (semantic 0.6, keyword 0.4)
- Fallback to pure keyword search if embeddings unavailable

### Calculator RAG Enhancement

- Extend `calc-rag-index.json` with embedding vectors for calculator titles/descriptions
- Semantic matching instead of strict keyword match

### Performance

- Embedding generation runs as background job (not blocking chat requests)
- Cache embedding model in-memory (lazy load, 100MB RAM budget)
- Vector queries timeout after 2s, fallback to keyword

## Dependencies

- Neo4j 5.x vector index support (confirmed running 5.26)
- Embedding model (recommended: all-MiniLM-L6-v2 via ONNX, ~384d, 80MB)
- Or LiteLLM-hosted embedding model

## Success Criteria

- "Wie berechnet man den pH-Wert einer Säure?" returns pH-relevant results even when keywords "pH" or "Säure" don't match exactly
- Vector query latency < 500ms for top-5
- Combined (semantic + keyword) score outperforms pure keyword on 10 test queries
- All existing RAG tests pass
