import { describe, expect, it } from 'vitest';

import type { Workflow } from '../../schema/index.js';
import { matrixRule } from './matrix.js';

describe('matrixRule', () => {
  it('returns no errors for a non-empty matrix dimension', () => {
    const wf: Workflow = {
      on: { push: { branches: ['main'] } },
      jobs: {
        a: {
          'runs-on': 'ubuntu-latest',
          strategy: { matrix: { 'node-version': [18, 20] } },
          steps: [{ run: 'echo hi' }],
        },
      },
    };
    expect(matrixRule(wf)).toEqual([]);
  });

  it('flags an empty dimension', () => {
    const wf: Workflow = {
      on: { push: { branches: ['main'] } },
      jobs: {
        a: {
          'runs-on': 'ubuntu-latest',
          strategy: { matrix: { 'node-version': [] } },
          steps: [{ run: 'echo hi' }],
        },
      },
    };
    const errors = matrixRule(wf);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toEqual({
      path: ['jobs', 'a', 'strategy', 'matrix', 'node-version'],
      message: "Matrix dimension 'node-version' is empty",
      severity: 'error',
      rule: 'matrix',
    });
  });

  it('returns no errors when the job has no strategy', () => {
    const wf: Workflow = {
      on: { push: { branches: ['main'] } },
      jobs: {
        a: { 'runs-on': 'ubuntu-latest', steps: [{ run: 'echo hi' }] },
      },
    };
    expect(matrixRule(wf)).toEqual([]);
  });

  it('skips reusable jobs', () => {
    const wf: Workflow = {
      on: { push: { branches: ['main'] } },
      jobs: {
        a: {
          uses: './.github/workflows/reusable.yml',
          strategy: { matrix: { x: [] } },
        },
      },
    };
    expect(matrixRule(wf)).toEqual([]);
  });

  it('skips include/exclude keys', () => {
    const wf: Workflow = {
      on: { push: { branches: ['main'] } },
      jobs: {
        a: {
          'runs-on': 'ubuntu-latest',
          strategy: {
            matrix: {
              'node-version': [18],
              include: [],
              exclude: [],
            },
          },
          steps: [{ run: 'echo hi' }],
        },
      },
    };
    expect(matrixRule(wf)).toEqual([]);
  });
});
