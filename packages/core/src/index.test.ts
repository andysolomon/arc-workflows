import { describe, expect, it } from 'vitest';

import { expr, isExpressionString, type Workflow } from './index.js';

describe('@arc-workflows/core public API', () => {
  it('exposes the schema', () => {
    const wf: Workflow = {
      name: 'smoke',
      on: { push: { branches: ['main'] } },
      jobs: {
        build: {
          'runs-on': 'ubuntu-latest',
          steps: [{ uses: 'actions/checkout@v4' }],
        },
      },
    };
    expect(wf.jobs.build).toBeDefined();
  });

  it('expr() returns the input string verbatim', () => {
    expect(expr<string>('${{ secrets.X }}')).toBe('${{ secrets.X }}');
  });

  it('isExpressionString detects ${{ }} expressions', () => {
    expect(isExpressionString('${{ secrets.X }}')).toBe(true);
    expect(isExpressionString('plain string')).toBe(false);
    expect(isExpressionString('embedded ${{ x }} in middle')).toBe(true);
  });
});
