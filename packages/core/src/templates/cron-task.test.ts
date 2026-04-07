import { describe, expect, it } from 'vitest';

import { generate } from '../generate/index.js';
import { validate } from '../validation/index.js';

import { cronTask } from './cron-task.js';

describe('cron-task template', () => {
  it('returns a Workflow', () => {
    const wf = cronTask();
    expect(wf.on.schedule).toBeDefined();
    expect(wf.jobs.run).toBeDefined();
  });

  it('passes validation with default params', () => {
    const result = validate(cronTask());
    expect(result.errors.filter((e) => e.severity === 'error')).toEqual([]);
    expect(result.valid).toBe(true);
  });

  it('generates expected YAML with default params', () => {
    expect(generate(cronTask())).toMatchInlineSnapshot(`
      "name: Scheduled Task
      on:
        schedule:
          - cron: 0 0 * * *
      jobs:
        run:
          runs-on: ubuntu-latest
          steps:
            - uses: actions/checkout@v4
            - run: echo "Scheduled task running at $(date)"
      "
    `);
  });

  it('respects cron override', () => {
    const yaml = generate(cronTask({ cron: '*/15 * * * *' }));
    expect(yaml).toMatch(/cron: ["']\*\/15 \* \* \* \*["']/);
  });

  it('respects runner override', () => {
    const yaml = generate(cronTask({ runner: 'macos-latest' }));
    expect(yaml).toContain('runs-on: macos-latest');
  });
});
