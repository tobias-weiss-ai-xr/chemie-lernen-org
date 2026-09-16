/**
 * Unit tests for the ZPD-aware tool router (pure logic — no DB).
 */

import { describe, it, expect, test } from 'vitest';
import {
  TOOL_REGISTRY,
  resolveTool,
  getAllTools,
  inferObjectiveTags,
} from '../api/services/tool-router.js';

describe('TOOL_REGISTRY (REQ-TTR-1)', () => {
  it('covers all three tool categories', () => {
    const types = new Set(TOOL_REGISTRY.map((t) => t.toolType));
    expect(types.has('visualization')).toBe(true);
    expect(types.has('calculator')).toBe(true);
    expect(types.has('ai-assistant')).toBe(true);
  });

  it('every entry has all required fields', () => {
    for (const t of TOOL_REGISTRY) {
      expect(t.toolId).toEqual(expect.any(String));
      expect(['visualization', 'calculator', 'ai-assistant']).toContain(t.toolType);
      expect(Array.isArray(t.bloomRange)).toBe(true);
      expect(t.bloomRange).toHaveLength(2);
      expect(Array.isArray(t.objectiveTags)).toBe(true);
      expect(t.launchUrl).toMatch(/^\//);
      expect(t.description).toEqual(expect.any(String));
    }
  });
});

describe('resolveTool (REQ-TTR-2)', () => {
  it('spatial objective at Bloom 2 → visualization', () => {
    const tool = resolveTool(2, ['spatial']);
    expect(tool).not.toBeNull();
    expect(tool.toolType).toBe('visualization');
    expect(tool).toHaveProperty('toolId', 'molekuel-studio');
    expect(tool).toHaveProperty('launchUrl');
    expect(tool).toHaveProperty('rationale');
  });

  it('quantitative objective at Bloom 4 → calculator', () => {
    const tool = resolveTool(4, ['quantitative']);
    expect(tool).not.toBeNull();
    expect(tool.toolType).toBe('calculator');
    expect(tool).toHaveProperty('toolId', 'stoichiometry-calculator');
  });

  it('quantitative at Bloom 2 → null (no calculator below Bloom 3)', () => {
    expect(resolveTool(2, ['quantitative'])).toBeNull();
  });

  it('quantitative at Bloom 3 → calculator (edge of range)', () => {
    const tool = resolveTool(3, ['quantitative']);
    expect(tool).not.toBeNull();
    expect(tool.toolType).toBe('calculator');
    expect(tool.toolId).toBe('stoichiometry-calculator');
  });

  it('high Bloom with no specific tag → ai-assistant', () => {
    const tool = resolveTool(6, []);
    expect(tool).not.toBeNull();
    expect(tool.toolType).toBe('ai-assistant');
    expect(tool.toolId).toBe('ki-assistent');
  });

  it('no match returns null (calculator inappropriate at Bloom 1)', () => {
    expect(resolveTool(1, ['quantitative'])).toBeNull();
  });

  it('returns null for invalid / out-of-range Bloom', () => {
    expect(resolveTool(0, ['spatial'])).toBeNull();
    expect(resolveTool(7, ['spatial'])).toBeNull();
    expect(resolveTool('zzz', ['spatial'])).toBeNull();
    expect(resolveTool(undefined, ['spatial'])).toBeNull();
  });

  it('matches by Bloom alone when no tags provided', () => {
    const tool = resolveTool(3, []);
    expect(tool).not.toBeNull();
    expect(tool.toolId).toBeTruthy();
  });

  it('ignores tags that do not overlap with registry entries', () => {
    // Bloom 3 + only 'conceptual' (no entry covers 3 with that tag) → null
    expect(resolveTool(3, ['conceptual'])).toBeNull();
  });
});

describe('getAllTools (REQ-TTR-5)', () => {
  test('returns full registry with no filters', () => {
    expect(getAllTools()).toEqual(TOOL_REGISTRY);
    expect(getAllTools(undefined, undefined)).toEqual(TOOL_REGISTRY);
  });

  test('filters by Bloom level', () => {
    const tools = getAllTools(2, []);
    expect(tools.every((t) => t.bloomRange[0] <= 2 && t.bloomRange[1] >= 2)).toBe(true);
  });

  test('filters by tags', () => {
    const tools = getAllTools(undefined, ['quantitative']);
    expect(tools.every((t) => t.objectiveTags.includes('quantitative'))).toBe(true);
  });

  test('no matches → empty array', () => {
    expect(getAllTools(1, ['quantitative'])).toEqual([]);
  });
});

describe('inferObjectiveTags (REQ-TTR-6)', () => {
  test('infers quantitative from German calculation cues', () => {
    expect(
      inferObjectiveTags('Stoffmenge und Konzentration berechnen')
    ).toContain('quantitative');
  });

  test('infers spatial from structural cues (description + slug)', () => {
    const tags = inferObjectiveTags('Molekülstruktur verstehen', 'molekuel-geometrie');
    expect(tags).toContain('spatial');
  });

  test('infers conceptual + synthesis cues', () => {
    const tags = inferObjectiveTags('Ein Modell zum Sauerstoff-Konzept entwerfen');
    expect(tags).toContain('conceptual');
    expect(tags).toContain('synthesis');
  });

  test('returns [] for empty / non-string input', () => {
    expect(inferObjectiveTags()).toEqual([]);
    expect(inferObjectiveTags(undefined, undefined)).toEqual([]);
  });
});