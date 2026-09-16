/**
 * ZPD strategy tool-activation tests (REQ-TTR-3/4).
 *
 * These tests mock resolveTool so the match / no-match branches of
 * recommendedStrategy() are fully deterministic and controlled, per
 * task 5.2. The *real* resolver is exercised separately in
 * tool-router.test.mjs. recommendedTool() uses the same mocked resolveTool.
 */

import { vi, describe, test, expect, beforeEach } from 'vitest';

const mockResolveTool = vi.fn();

vi.mock(
  '../api/services/tool-router.js',
  () => ({
    resolveTool: mockResolveTool,
  })
);

const { recommendedStrategy, recommendedTool } = await import(
  '../api/services/zpd-engine.js'
);

describe('recommendedStrategy tool activation (REQ-TTR-4)', () => {
  beforeEach(() => {
    mockResolveTool.mockReset();
  });

  test("returns 'tool' and attaches toolRecommendation when resolver matches", () => {
    mockResolveTool.mockReturnValue({
      toolId: 'molekuel-studio',
      toolType: 'visualization',
      launchUrl: '/molekuel-studio/',
      rationale: '3D molecule viewer — supports visualization learning at Bloom 3',
    });
    const strat = recommendedStrategy(
      { loMastery: 0.3, prereqAvg: 0.9, bloom: 3 },
      { objectiveTags: ['spatial'] }
    );
    expect(strat).toBe('tool');
    expect(mockResolveTool).toHaveBeenCalledWith(3, ['spatial']);

    const rec = recommendedTool({ bloom: 3 }, ['spatial']);
    expect(rec).toEqual({
      toolId: 'molekuel-studio',
      toolType: 'visualization',
      launchUrl: '/molekuel-studio/',
      rationale: '3D molecule viewer — supports visualization learning at Bloom 3',
    });
  });

  test("falls back to 'differentiate' when resolver returns null", () => {
    mockResolveTool.mockReturnValue(null);
    const strat = recommendedStrategy(
      { loMastery: 0.3, prereqAvg: 0.9, bloom: 3 },
      { objectiveTags: ['spatial'] }
    );
    expect(strat).toBe('differentiate');
  });

  test('does not activate tool when objectiveTags is absent (backward compatible)', () => {
    // No resolveTool call should happen without tags.
    const strat = recommendedStrategy({ loMastery: 0.3, prereqAvg: 0.9, bloom: 3 });
    expect(strat).toBe('differentiate');
    expect(mockResolveTool).not.toHaveBeenCalled();
  });

  test('does not activate tool when bloom is missing', () => {
    const strat = recommendedStrategy(
      { loMastery: 0.3, prereqAvg: 0.9 },
      { objectiveTags: ['spatial'] }
    );
    expect(strat).toBe('differentiate');
    expect(mockResolveTool).not.toHaveBeenCalled();
  });

  test('recommendedTool returns null when bloom is missing', () => {
    expect(recommendedTool({ loMastery: 0.3 }, ['spatial'])).toBeNull();
    expect(mockResolveTool).not.toHaveBeenCalled();
  });
});