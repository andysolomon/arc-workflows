import { describe, expect, it } from 'vitest';

import { generate } from '../generate/index.js';
import type { WorkflowCallInput } from '../schema/index.js';
import { validate } from '../validation/index.js';

import { reusable } from './reusable.js';

describe('reusable template', () => {
  it('returns a Workflow', () => {
    const wf = reusable();
    expect(wf.on.workflow_call).toBeDefined();
    expect(wf.jobs.run).toBeDefined();
  });

  it('passes validation with default params', () => {
    const result = validate(reusable());
    expect(result.errors.filter((e) => e.severity === 'error')).toEqual([]);
    expect(result.valid).toBe(true);
  });

  it('generates expected YAML with default params', () => {
    expect(generate(reusable())).toMatchInlineSnapshot(`
      "name: Reusable Workflow
      on:
        workflow_call:
          inputs:
            config-path:
              type: string
              required: true
              description: Path to config file
          secrets:
            api-token:
              required: true
              description: API token for the service
      jobs:
        run:
          runs-on: ubuntu-latest
          steps:
            - uses: actions/checkout@v4
            - run: echo "Running with config \${{ inputs.config-path }}"
      "
    `);
  });

  it('respects callableInputs override', () => {
    const callableInputs: Record<string, WorkflowCallInput> = {
      target: { type: 'string', required: true, description: 'Target name' },
    };
    const yaml = generate(reusable({ callableInputs }));
    expect(yaml).toContain('target:');
    expect(yaml).toContain('Target name');
  });
});
