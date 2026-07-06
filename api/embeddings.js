'use strict';

// Embeddings module — lazy-loaded singleton pipeline via @xenova/transformers
// Pure WASM, no native deps. Works on Alpine.

const MODEL_NAME = 'Xenova/all-MiniLM-L6-v2'; // 384-dim, ~23MB quantized

let pipeline = null;
let pipelinePromise = null;

/**
 * Lazy-load the embedding pipeline (called once, cached forever).
 * Returns a function: (texts: string[]) => Promise<number[][]>
 */
async function getPipeline() {
  if (pipeline) return pipeline;
  if (pipelinePromise) return pipelinePromise;

  pipelinePromise = (async () => {
    const { pipeline: loadPipeline } = await import('@xenova/transformers');
    // pipe returns a function: pipe(inputs, { pooling: 'mean', normalize: true })
    const pipe = await loadPipeline('feature-extraction', MODEL_NAME, {
      quantized: true,
    });
    pipeline = pipe;
    pipelinePromise = null; // resolved
    return pipe;
  })();

  return pipelinePromise;
}

/**
 * Embed a single text string into a 384-dim Float32Array.
 * @param {string} text
 * @returns {Promise<Float32Array>}
 */
async function embed(text) {
  const pipe = await getPipeline();
  const result = await pipe(text, { pooling: 'mean', normalize: true });
  // result is a Tensor — extract data as Float32Array
  return Float32Array.from(result.data);
}

/**
 * Embed multiple texts (batched — more efficient for bulk).
 * @param {string[]} texts
 * @returns {Promise<Float32Array[]>}
 */
async function embedBatch(texts) {
  if (texts.length === 0) return [];
  const pipe = await getPipeline();
  const result = await pipe(texts, { pooling: 'mean', normalize: true });
  // result.data is flat — reshape into per-text arrays
  const dim = result.dims[result.dims.length - 1]; // last dim = 384
  const flat = result.data;
  const out = [];
  for (let i = 0; i < texts.length; i++) {
    out.push(Float32Array.from(flat.subarray(i * dim, (i + 1) * dim)));
  }
  return out;
}

/**
 * Cosine similarity between two Float32Arrays.
 * Returns -1..1
 */
function cosineSimilarity(a, b) {
  let dot = 0,
    na = 0,
    nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
}

module.exports = { embed, embedBatch, cosineSimilarity, getPipeline, MODEL_NAME };
