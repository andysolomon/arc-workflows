import { describe, expect, it } from 'vitest';

import type { Workflow } from '../../schema/index.js';
import { cronRule } from './cron.js';

function wf(schedule: { cron: string }[]): Workflow {
  return {
    on: { schedule },
    jobs: {
      a: { 'runs-on': 'ubuntu-latest', steps: [{ run: 'echo hi' }] },
    },
  };
}

describe('cronRule', () => {
  it('returns no errors for a valid 5-field expression', () => {
    expect(cronRule(wf([{ cron: '0 0 * * *' }]))).toEqual([]);
  });

  it('flags a malformed expression', () => {
    const errors = cronRule(wf([{ cron: 'not a cron at all' }]));
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatchObject({
      path: ['on', 'schedule', 0, 'cron'],
      severity: 'error',
      rule: 'cron',
    });
    expect(errors[0]?.message).toMatch(/Invalid cron expression/);
  });

  it('flags an out-of-range hour', () => {
    const errors = cronRule(wf([{ cron: '0 25 * * *' }]));
    expect(errors).toHaveLength(1);
    expect(errors[0]?.path).toEqual(['on', 'schedule', 0, 'cron']);
  });

  it('returns no errors when the workflow has no schedule', () => {
    const workflow: Workflow = {
      on: { push: { branches: ['main'] } },
      jobs: {
        a: { 'runs-on': 'ubuntu-latest', steps: [{ run: 'echo hi' }] },
      },
    };
    expect(cronRule(workflow)).toEqual([]);
  });

  it('reports independent errors for each invalid entry', () => {
    const errors = cronRule(wf([{ cron: '0 0 * * *' }, { cron: 'not-a-cron' }]));
    expect(errors).toHaveLength(1);
    expect(errors[0]?.path).toEqual(['on', 'schedule', 1, 'cron']);
  });
});
