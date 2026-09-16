/**
 * tool-router.js — ZPD-aware technology tool registry + resolver (public).
 *
 * Static registry mapping Bloom level + objective-type tags to existing
 * interactive tools (3D visualizations, calculators, KI-Assistent). Pure
 * functions, no DB round-trip — the tool set is small and changes rarely.
 *
 * Spec: REQ-TTR-1 (registry), REQ-TTR-2 (resolver), REQ-TTR-3
 * (toolRecommendation), REQ-TTR-4 (strategy activator).
 */

const REMEMBER = 1;
const UNDERSTAND = 2;
const APPLY = 3;
const ANALYZE = 4;
const EVALUATE = 5;
const CREATE = 6;

/**
 * Canonical tool registry. Static, exported for testability.
 * bloomRange: [min, max] inclusive Bloom indices the tool fits.
 */
export const TOOL_REGISTRY = [
  {
    toolId: 'molekuel-studio',
    toolType: 'visualization',
    bloomRange: [UNDERSTAND, ANALYZE], // 2–4
    objectiveTags: ['spatial', 'structural'],
    launchUrl: '/molekuel-studio/',
    description: '3D molecule viewer for spatial understanding of molecular structures',
  },
  {
    toolId: 'perioden-system',
    toolType: 'visualization',
    bloomRange: [REMEMBER, UNDERSTAND], // 1–2
    objectiveTags: ['spatial', 'structural'],
    launchUrl: '/perioden-system-der-elemente/',
    description: 'Interactive periodic table for element exploration and classification',
  },
  {
    toolId: 'stoichiometry-calculator',
    toolType: 'calculator',
    bloomRange: [APPLY, EVALUATE], // 3–5
    objectiveTags: ['quantitative', 'reaction'],
    launchUrl: '/stoichiometrie-rechner/',
    description: 'Stoichiometry calculator for quantitative reaction analysis',
  },
  {
    toolId: 'ki-assistent',
    toolType: 'ai-assistant',
    bloomRange: [ANALYZE, CREATE], // 4–6
    objectiveTags: ['conceptual', 'synthesis', 'evaluation'],
    launchUrl: '/ki-assistent/',
    description: 'AI chat assistant for open-ended chemistry reasoning and synthesis',
  },
];

const TOOL_TYPE_ORDER = {
  visualization: 0,
  calculator: 1,
  'ai-assistant': 2,
};

// toolType preference per objective-type signature (REQ-TTR-2 step 2).
const TYPE_PREFERENCE = {
  spatial: ['visualization', 'calculator', 'ai-assistant'],
  quantitative: ['calculator', 'visualization', 'ai-assistant'],
  default: ['ai-assistant', 'visualization', 'calculator'],
};

/**
 * Normalize a Bloom index to a valid integer.
 */
function normalizeBloom(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 1 || n > 6) return null;
  return Math.trunc(n);
}

/**
 * Build a type-preference comparison key from the objective tags.
 * @param {string[]|undefined} tags
 * @returns {number[]} index into TOOL_TYPE_ORDER per rank slot
 */
function preferenceRanks(tags) {
  if (!Array.isArray(tags) || tags.length === 0) return null;
  if (tags.includes('spatial')) return TYPE_PREFERENCE.spatial.map((t) => TOOL_TYPE_ORDER[t]);
  if (tags.includes('quantitative'))
    return TYPE_PREFERENCE.quantitative.map((t) => TOOL_TYPE_ORDER[t]);
  return TYPE_PREFERENCE.default.map((t) => TOOL_TYPE_ORDER[t]);
}

/**
 * Resolve the best-matching tool for a Bloom index + optional objective tags.
 *
 * Selection:
 *  1. Filter entries where bloom ∈ bloomRange AND (no tags OR tag overlap).
 *  2. Rank by toolType preference (spatial→viz, quantitative→calc, else→ai).
 *  3. Within a type, prefer the higher Bloom ceiling; fall back to registry order.
 *
 * @param {number|string|undefined} bloomsIndex
 * @param {string[]|undefined} [objectiveTags]
 * @returns {{toolId:string, toolType:string, launchUrl:string, rationale:string}|null}
 */
export function resolveTool(bloomsIndex, objectiveTags) {
  const bloom = normalizeBloom(bloomsIndex);
  if (bloom === null) return null;

  const tags = Array.isArray(objectiveTags)
    ? objectiveTags.filter((t) => typeof t === 'string' && t.trim() !== '')
    : [];

  const matched = TOOL_REGISTRY.filter((tool) => {
    const [min, max] = tool.bloomRange;
    if (bloom < min || bloom > max) return false;
    if (tags.length === 0) return true;
    return tool.objectiveTags.some((t) => tags.includes(t));
  });

  if (matched.length === 0) return null;

  const ranks = preferenceRanks(tags);

  const scored = matched.map((tool) => {
    const rank =
      ranks === null
        ? TOOL_TYPE_ORDER[tool.toolType]
        : ranks.indexOf(TOOL_TYPE_ORDER[tool.toolType]);
    return {
      tool,
      rank: rank === -1 ? Number.POSITIVE_INFINITY : rank,
      ceiling: tool.bloomRange[1],
    };
  });

  scored.sort((a, b) => {
    if (a.rank !== b.rank) return a.rank - b.rank;
    if (b.ceiling !== a.ceiling) return b.ceiling - a.ceiling;
    return 0; // stable: registry order preserved for identical score
  });

  const best = scored[0].tool;
  return {
    toolId: best.toolId,
    toolType: best.toolType,
    launchUrl: best.launchUrl,
    rationale: `${best.description} — supports ${best.toolType} learning at Bloom ${bloom}`,
  };
}

/**
 * Editorial listing of all matching tools (or the full registry when no
 * filters are given).
 *
 * @param {number|string|undefined} [bloomsIndex]
 * @param {string[]|undefined} [tags]
 * @returns {Array<object>} full registry entries
 */
export function getAllTools(bloomsIndex, tags) {
  const bloom =
    bloomsIndex === undefined || bloomsIndex === null || bloomsIndex === ''
      ? null
      : normalizeBloom(bloomsIndex);
  const tagArr = Array.isArray(tags)
    ? tags.filter((t) => typeof t === 'string' && t.trim() !== '')
    : [];

  if (bloom === null && tagArr.length === 0) return TOOL_REGISTRY;

  return TOOL_REGISTRY.filter((tool) => {
    if (bloom !== null) {
      const [min, max] = tool.bloomRange;
      if (bloom < min || bloom > max) return false;
    }
    if (tagArr.length === 0) return true;
    return tool.objectiveTags.some((t) => tagArr.includes(t));
  });
}

// Keyword → objective-type tag cues (German objective descriptions/slugs).
const TAG_KEYWORDS = [
  {
    tag: 'spatial',
    re: /molekul|struktur|aufbau|geometrie|atommodell|orbital|teilchen|baustein|ligand|kristall|bindung/i,
  },
  {
    tag: 'quantitative',
    re: /stöchiometrie|stoichiometri|mol|konzentration|masse|volumen|ausbeute|umsatz|mengenverhältnis|verhältnis|anteil|dichte|rechnung|rechnen|berechn/i,
  },
  {
    tag: 'conceptual',
    re: /konzept|prinzip|modell|theorie|begriff|vorstellung|erklär|verstehen|zusammenhang/i,
  },
  { tag: 'synthesis', re: /synthese|entwerfen|planen|konstruieren|entwickeln|gestalten|erfinden/i },
  {
    tag: 'evaluation',
    re: /bewerte|beurteile|entscheide|stellungnahme|kritisch|abwägen|argument/i,
  },
  {
    tag: 'reaction',
    re: /reaktion|oxid|redox|säure|base|neutralis|elektrolyse|verbrennung|katalys/i,
  },
  { tag: 'structural', re: /aufbau|anordnung|schicht|gitter|verbindungs|isomer/i },
];

/**
 * Infer objective-type tags from an objective's description/slug text using
 * lightweight German keyword cues. Returns the ordered list of inferred tags
 * (empty when no cues match). Designed to be called by the API route before
 * strategy activation; tags remain optional so absence only degrades the
 * ranking to Bloom-based resolution (design Decision 2/4).
 *
 * @param {string|undefined} description
 * @param {string|undefined} [slug]
 * @param {string|undefined} [subtopic]
 * @returns {string[]}
 */
export function inferObjectiveTags(description, slug, subtopic) {
  const haystack = [description, slug, subtopic].filter((s) => typeof s === 'string').join(' ');
  if (!haystack) return [];
  const tags = [];
  for (const { tag, re } of TAG_KEYWORDS) {
    if (re.test(haystack)) tags.push(tag);
  }
  return tags;
}
