import { describe, expect, it } from 'vitest';

import { generate } from '../generate/index.js';
import type { WorkflowDispatchInput } from '../schema/index.js';
import { validate } from '../validation/index.js';

import { manualDispatch } from './manual-dispatch.js';

describe('manual-dispatch template', () => {
  it('returns a Workflow', () => {
    const wf = manualDispatch();
    expect(wf.on.workflow_dispatch).toBeDefined();
    expect(wf.jobs.run).toBeDefined();
  });

  it('passes validation with default params', () => {
    const result = validate(manualDispatch());
    expect(result.errors.filter((e) => e.severity === 'error')).toEqual([]);
    expect(result.valid).toBe(true);
  });

  it('generates expected YAML with default params', () => {
    expect(generate(manualDispatch())).toMatchInlineSnapshot(`
      "name: Manual Dispatch
      on:
        workflow_dispatch:
          inputs:
            environment:
              type: choice
              options:
                - staging
                - production
              default: staging
              required: true
              description: Target environment
      jobs:
        run:
          runs-on: ubuntu-latest
          steps:
            - uses: actions/checkout@v4
            - run: echo "Deploying to \${{ inputs.environment }}"
      "
    `);
  });

  it('respects custom inputs override', () => {
    const inputs: Record<string, WorkflowDispatchInput> = {
      version: {
        type: 'string',
        required: true,
        description: 'Version to deploy',
      },
    };
    const yaml = generate(manualDispatch({ inputs }));
    expect(yaml).toContain('version:');
    expect(yaml).toContain('Version to deploy');
  });
});
