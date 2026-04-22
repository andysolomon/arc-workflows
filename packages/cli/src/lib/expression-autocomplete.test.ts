import { describe, expect, it } from 'vitest';
import {
  EXPRESSION_CONTEXTS,
  matchExpressionContexts,
} from './expression-autocomplete.js';

describe('EXPRESSION_CONTEXTS', () => {
  it('includes the 12 GitHub Actions contexts', () => {
    expect(EXPRESSION_CONTEXTS).toHaveLength(12);
    expect(EXPRESSION_CONTEXTS).toContain('github');
    expect(EXPRESSION_CONTEXTS).toContain('secrets');
    expect(EXPRESSION_CONTEXTS).toContain('matrix');
    expect(EXPRESSION_CONTEXTS).toContain('jobs');
  });
});

describe('matchExpressionContexts', () => {
  it('returns empty array when no ${{ is present', () => {
    expect(matchExpressionContexts('')).toEqual([]);
    expect(matchExpressionContexts('FOO=bar')).toEqual([]);
  });

  it('returns empty array when ${{ is already closed', () => {
    expect(matchExpressionContexts('FOO=${{ github.actor }}')).toEqual([]);
  });

  it('returns all contexts for an empty fragment', () => {
    const matches = matchExpressionContexts('FOO=${{ ');
    expect(matches).toEqual([...EXPRESSION_CONTEXTS]);
  });

  it('filters by startsWith on the fragment', () => {
    expect(matchExpressionContexts('X=${{ sec')).toEqual(['secrets']);
    expect(matchExpressionContexts('X=${{ g')).toEqual(['github']);
    expect(matchExpressionContexts('X=${{ j')).toEqual(['job', 'jobs']);
  });

  it('is case-insensitive on the fragment', () => {
    expect(matchExpressionContexts('X=${{ SEC')).toEqual(['secrets']);
  });

  it('uses the most recent ${{ when multiple appear', () => {
    // First is closed, second opens a new fragment.
    const row = 'X=${{ github.actor }}-${{ sec';
    expect(matchExpressionContexts(row)).toEqual(['secrets']);
  });

  it('returns empty array when fragment matches nothing', () => {
    expect(matchExpressionContexts('X=${{ zzz')).toEqual([]);
  });
});
