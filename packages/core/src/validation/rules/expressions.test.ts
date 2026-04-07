import { describe, expect, it } from 'vitest';

import type { Workflow } from '../../schema/index.js';
import { expressionsRule } from './expressions.js';

describe('expressionsRule', () => {
  it('returns no warnings for a known namespace', () => {
    const wf: Workflow = {
      on: { push: { branches: ['main'] } },
      jobs: {
        a: {
          'runs-on': 'ubuntu-latest',
          steps: [{ run: 'echo ${{ github.event_name }}' }],
        },
      },
    };
    expect(expressionsRule(wf)).toEqual([]);
  });

  it('warns on a misspelled namespace (secret instead of secrets)', () => {
    const wf: Workflow = {
      on: { push: { branches: ['main'] } },
      jobs: {
        a: {
          'runs-on': 'ubuntu-latest',
          steps: [{ run: 'echo ${{ secret.X }}' }],
        },
      },
    };
    const errors = expressionsRule(wf);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatchObject({
      severity: 'warning',
      rule: 'expressions',
    });
    expect(errors[0]?.message).toContain("Unknown expression context 'secret'");
  });

  it("accepts 'inputs' namespace", () => {
    const wf: Workflow = {
      on: { workflow_dispatch: {} },
      jobs: {
        a: {
          'runs-on': 'ubuntu-latest',
          steps: [{ run: 'echo ${{ inputs.environment }}' }],
        },
      },
    };
    expect(expressionsRule(wf)).toEqual([]);
  });

  it('produces multiple warnings for multiple bad namespaces in one string', () => {
    const wf: Workflow = {
      on: { push: { branches: ['main'] } },
      jobs: {
        a: {
          'runs-on': 'ubuntu-latest',
          steps: [{ run: 'foo ${{ unknown.x }} bar ${{ also_bad.y }}' }],
        },
      },
    };
    const errors = expressionsRule(wf);
    expect(errors).toHaveLength(2);
    expect(errors[0]?.message).toContain("'unknown'");
    expect(errors[1]?.message).toContain("'also_bad'");
  });

  it('walks nested string leaves', () => {
    const wf: Workflow = {
      on: { push: { branches: ['main'] } },
      env: { TOKEN: '${{ secrets.X }}' },
      jobs: {
        a: { 'runs-on': 'ubuntu-latest', steps: [{ run: 'echo hi' }] },
      },
    };
    expect(expressionsRule(wf)).toEqual([]);
  });

  it('returns no warnings when there are no expressions', () => {
    const wf: Workflow = {
      on: { push: { branches: ['main'] } },
      jobs: {
        a: { 'runs-on': 'ubuntu-latest', steps: [{ run: 'echo hi' }] },
      },
    };
    expect(expressionsRule(wf)).toEqual([]);
  });
});
