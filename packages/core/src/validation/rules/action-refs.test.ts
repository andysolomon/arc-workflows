import { describe, expect, it } from 'vitest';

import type { Step, Workflow } from '../../schema/index.js';
import { actionRefsRule } from './action-refs.js';

function wfWithSteps(steps: Step[]): Workflow {
  return {
    on: { push: { branches: ['main'] } },
    jobs: {
      build: {
        'runs-on': 'ubuntu-latest',
        steps,
      },
    },
  };
}

describe('actionRefsRule', () => {
  it('accepts valid references', () => {
    const wf = wfWithSteps([
      { uses: 'actions/checkout@v4' },
      { uses: 'actions/cache/save@v4' },
      { uses: './local' },
      { uses: 'docker://node:20' },
      { uses: 'owner/repo@sha-abc123' },
      { uses: 'actions/setup-node@v4.0.1' },
    ]);
    expect(actionRefsRule(wf)).toEqual([]);
  });

  it('ignores run steps', () => {
    const wf = wfWithSteps([{ run: 'echo hi' }]);
    expect(actionRefsRule(wf)).toEqual([]);
  });

  it('flags a plain invalid string', () => {
    const wf = wfWithSteps([{ uses: 'not-a-ref' }]);
    const errors = actionRefsRule(wf);
    expect(errors).toHaveLength(1);
    expect(errors[0]?.path).toEqual(['jobs', 'build', 'steps', 0, 'uses']);
    expect(errors[0]?.rule).toBe('action-refs');
  });

  it('flags `owner/repo` with no @ref', () => {
    const wf = wfWithSteps([{ uses: 'actions/checkout' }]);
    const errors = actionRefsRule(wf);
    expect(errors).toHaveLength(1);
    expect(errors[0]?.path).toEqual(['jobs', 'build', 'steps', 0, 'uses']);
  });

  it('flags a missing version', () => {
    const wf = wfWithSteps([{ uses: 'actions/checkout@' }]);
    const errors = actionRefsRule(wf);
    expect(errors).toHaveLength(1);
  });

  it('reports the step index correctly for multiple bad refs', () => {
    const wf = wfWithSteps([
      { uses: 'actions/checkout@v4' },
      { uses: 'bogus' },
      { run: 'echo ok' },
      { uses: 'also-bogus' },
    ]);
    const errors = actionRefsRule(wf);
    expect(errors.map((e) => e.path)).toEqual([
      ['jobs', 'build', 'steps', 1, 'uses'],
      ['jobs', 'build', 'steps', 3, 'uses'],
    ]);
  });
});
