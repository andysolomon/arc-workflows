import { describe, expect, it } from 'vitest';

import { formatPath } from './path.js';

describe('formatPath', () => {
  it('returns empty string for an empty array', () => {
    expect(formatPath([])).toBe('');
  });

  it('returns a single string segment verbatim', () => {
    expect(formatPath(['jobs'])).toBe('jobs');
  });

  it('joins two string segments with a dot', () => {
    expect(formatPath(['jobs', 'build'])).toBe('jobs.build');
  });

  it('uses bracket notation for numeric segments', () => {
    expect(formatPath(['jobs', 'build', 'steps', 2, 'uses'])).toBe('jobs.build.steps[2].uses');
  });

  it('handles a numeric first segment without a leading dot', () => {
    expect(formatPath([0, 'foo'])).toBe('[0].foo');
  });

  it('handles mixed numeric/string segments', () => {
    expect(formatPath(['a', 0, 'b', 1, 2, 'c'])).toBe('a[0].b[1][2].c');
  });

  it('handles consecutive numeric segments', () => {
    expect(formatPath(['matrix', 0, 1])).toBe('matrix[0][1]');
  });
});
