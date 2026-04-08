import { describe, expect, it } from 'vitest';

import { matrix } from './matrix-builder.js';

describe('MatrixBuilder', () => {
  it('adds a dimension', () => {
    const s = matrix().dimension('node-version', [18, 20]).build();
    expect(s.matrix).toEqual({ 'node-version': [18, 20] });
  });

  it('appends to include', () => {
    const s = matrix()
      .dimension('os', ['ubuntu-latest'])
      .include({ os: 'ubuntu-latest', node: '20' })
      .include({ os: 'ubuntu-latest', node: '22' })
      .build();
    expect(s.matrix?.include).toEqual([
      { os: 'ubuntu-latest', node: '20' },
      { os: 'ubuntu-latest', node: '22' },
    ]);
  });

  it('appends to exclude', () => {
    const s = matrix()
      .dimension('os', ['ubuntu-latest', 'macos-latest'])
      .exclude({ os: 'macos-latest' })
      .build();
    expect(s.matrix?.exclude).toEqual([{ os: 'macos-latest' }]);
  });

  it('sets fail-fast and max-parallel', () => {
    const s = matrix().failFast(false).maxParallel(2).build();
    expect(s['fail-fast']).toBe(false);
    expect(s['max-parallel']).toBe(2);
  });
});
