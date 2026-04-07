import { describe, expect, it } from 'vitest';

import { generate } from '../generate/index.js';
import { validate } from '../validation/index.js';

import { ciPython } from './ci-python.js';

describe('ci-python template', () => {
  it('returns a Workflow', () => {
    const wf = ciPython();
    expect(wf.on).toBeDefined();
    expect(wf.jobs.test).toBeDefined();
  });

  it('passes validation with default params', () => {
    const result = validate(ciPython());
    expect(result.errors.filter((e) => e.severity === 'error')).toEqual([]);
    expect(result.valid).toBe(true);
  });

  it('generates expected YAML with default params', () => {
    expect(generate(ciPython())).toMatchInlineSnapshot(`
      "name: CI
      on:
        pull_request:
          branches:
            - main
      jobs:
        test:
          runs-on: ubuntu-latest
          steps:
            - uses: actions/checkout@v4
            - uses: actions/setup-python@v5
              with:
                python-version: 3.x
            - run: pip install -r requirements.txt
            - run: pytest
      "
    `);
  });

  it('respects pythonVersion override', () => {
    const yaml = generate(ciPython({ pythonVersion: '3.12' }));
    expect(yaml).toMatch(/python-version: ["']3\.12["']/);
  });

  it('respects branch override', () => {
    const yaml = generate(ciPython({ branch: 'develop' }));
    expect(yaml).toContain('- develop');
  });
});
