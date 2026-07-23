/**
 * KG Data Cache service — LRU cache for knowledge graph data.
 * Provides caching, parameter parsing, entity filtering, and static curricula loading.
 */

import fs from 'fs';
import path from 'path';
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  ...(process.env.NODE_ENV !== 'production' && {
    transport: { target: 'pino-pretty', options: { colorize: true } },
  }),
});

// LRU cache for /api/kg-data (5 min TTL)
const kgDataCache = new Map();
const KG_CACHE_TTL = 300000; // 5 minutes
const KG_CACHE_MAX = 20;

/**
 * Generate a cache key for kg-data requests.
 * @param {object} req - Express request
 * @returns {string}
 */
export function getKgDataCacheKey(req) {
  var limit = req.query.limit || 'default';
  var search = req.query.search || '';
  var category = req.query.category || '';
  var type = req.query.type || '';
  var offset = req.query.offset || '0';
  var lehrplan = req.query.lehrplan === 'true' ? 'lehrplan' : 'default';
  return 'kg-data-' + lehrplan + '-' + limit + '-' + offset + '-' + search + '-' + category + '-' + type;
}

/**
 * Get cached kg-data if still valid.
 * @param {string} key
 * @returns {object|null}
 */
export function getCachedKgData(key) {
  var entry = kgDataCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > KG_CACHE_TTL) {
    kgDataCache.delete(key);
    return null;
  }
  kgDataCache.delete(key);
  kgDataCache.set(key, entry);
  return entry.data;
}

/**
 * Store data in kg-data cache.
 * @param {string} key
 * @param {object} data
 */
export function setCachedKgData(key, data) {
  if (kgDataCache.size >= KG_CACHE_MAX) {
    var oldest = kgDataCache.keys().next().value;
    if (oldest) kgDataCache.delete(oldest);
  }
  kgDataCache.set(key, { ts: Date.now(), data: data });
}

/**
 * Parse KG query parameters from request.
 * @param {object} req
 * @returns {{ search: string, category: string, type: string, limit: number, offset: number }}
 */
export function parseKGParams(req) {
  const search = (req.query.search || '').toLowerCase().trim();
  const category = (req.query.category || '').toLowerCase().trim();
  const type = (req.query.type || '').toLowerCase().trim();
  const limit = Math.min(parseInt(req.query.limit) || 200, 20000);
  const offset = parseInt(req.query.offset) || 0;
  return { search, category, type, limit, offset };
}

/**
 * Filter entities by search/category/type.
 * @param {Array} entities
 * @param {{ search: string, category: string, type: string }} params
 * @returns {Array}
 */
export function filterEntities(entities, { search, category, type }) {
  let result = entities;
  if (search) {
    result = result.filter((e) => e.name.toLowerCase().includes(search));
  }
  if (category) {
    result = result.filter((e) => (e.category || '').toLowerCase() === category);
  }
  if (type) {
    result = result.filter((e) => (e.type || '').toLowerCase() === type);
  }
  return result;
}

/**
 * Load curricula data from static JSON files as fallback.
 * @returns {Array}
 */
export function loadCurriculaFromStaticFiles() {
  var states = ['bb','be','bw','by','hb','he','hh','mv','ni','nw','rp','sh','sn','st','th'];
  var dataDir = path.join(process.cwd(), 'myhugoapp', 'data', 'curricula');
  var result = [];
  var idCounter = 0;

  for (var si = 0; si < states.length; si++) {
    var abbr = states[si];
    try {
      var filePath = path.join(dataDir, abbr + '.json');
      if (!fs.existsSync(filePath)) continue;
      var content = fs.readFileSync(filePath, 'utf-8');
      var stateData = JSON.parse(content);
      var stateName = stateData.state || '';
      var stateAbbr = stateData.state_abbr || abbr.toUpperCase();

      var schoolCurricula = stateData.school_curricula || [];
      for (var sci = 0; sci < schoolCurricula.length; sci++) {
        var sc = schoolCurricula[sci];
        var gradeLevels = sc.grade_levels || [];
        for (var gli = 0; gli < gradeLevels.length; gli++) {
          var gl = gradeLevels[gli];
          var topics = gl.topics || [];
          for (var ti = 0; ti < topics.length; ti++) {
            var topic = topics[ti];
            result.push({
              id: 'cs' + idCounter++,
              name: topic.title,
              category: 'lehrplan',
              curriculumMeta: {
                state: stateName,
                stateAbbr: stateAbbr,
                grade: gl.grade || '',
                school_type: sc.school_type || '',
                objective_count: (topic.learning_objectives || []).length,
              },
              articles: [],
              relatedEntities: [],
              components: [],
              articleCount: 0,
            });
          }
        }
      }
    } catch (e) {
      logger.warn('[kg-data] Failed to load static curricula for ' + abbr + ': ' + e.message);
    }
  }

  result.sort(function (a, b) {
    var sa = a.curriculumMeta.stateAbbr || '';
    var sb = b.curriculumMeta.stateAbbr || '';
    if (sa !== sb) return sa < sb ? -1 : 1;
    return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
  });
  if (result.length > 500) result.length = 500;
  return result;
}
