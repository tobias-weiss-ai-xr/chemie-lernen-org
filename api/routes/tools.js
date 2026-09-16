/**
 * Tool route handlers — ZPD-aware technology tool routing (public).
 *
 * Routes:
 *   GET /api/tools              → full tool registry (optional ?bloom= & tags=)
 *   GET /api/tools/resolve      → best-matching tool for a Bloom level + tags
 */

import { Router } from 'express';
import { requireAuth } from '../auth.js';
import { getAllTools, resolveTool, inferObjectiveTags } from '../services/tool-router.js';

const router = Router();

function parseBloomsIndex(raw) {
  if (raw === undefined || raw === null || raw === '') return null;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1 || n > 6) return null;
  return n;
}

/**
 * GET /api/tools?bloom=&tags=comma,sep
 * Editorial listing of tools. Auth required.
 */
router.get('/api/tools', requireAuth, (req, res) => {
  const bloom = parseBloomsIndex(req.query.bloom);
  const tags =
    typeof req.query.tags === 'string'
      ? req.query.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
      : [];
  const tools = getAllTools(bloom, tags);
  res.json({ tools, count: tools.length });
});

/**
 * GET /api/tools/resolve?bloom=&tags=&description=&slug=
 * Best-match tool for a Bloom level + inference (REQ-TTR-2).
 */
router.get('/api/tools/resolve', requireAuth, (req, res) => {
  const { bloom, tags: tagsRaw, description, slug } = req.query;
  if (bloom === undefined || bloom === null || bloom === '') {
    return res.status(400).json({ error: 'bloom query parameter is required' });
  }
  const bloomsIndex = parseBloomsIndex(bloom);
  if (bloomsIndex === null) {
    return res.status(400).json({ error: 'bloom must be an integer between 1 and 6' });
  }
  const explicitTags =
    typeof tagsRaw === 'string'
      ? tagsRaw
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
      : [];
  const inferred = inferObjectiveTags(description, slug);
  const tags = [...new Set([...(Array.isArray(explicitTags) ? explicitTags : []), ...inferred])];
  const tool = resolveTool(bloomsIndex, tags);
  res.json({ resolved: tool !== null, tool, bloom: bloomsIndex, tags });
});

export default router;
