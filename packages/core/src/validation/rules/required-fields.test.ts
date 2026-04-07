import { describe, expect, it } from 'vitest';

import type { Job, Step, Workflow } from '../../schema/index.js';
import { requiredFieldsRule } from './required-fields.js';

// Helper: lets tests construct deliberately-malformed workflows without
// losing type safety on the rest of the assertion surface.
function asStep(obj: Record<string, unknown>): Step {
  return obj as unknown as Step;
}
function asJob(obj: Record<string, unknown>): Job {
  return obj as unknown as Job;
}

function wf(overrides: Partial<Workflow> = {}): Workflow {
  return {
    on: { push: { branches: ['main'] } },
    jobs: {
      build: {
        'runs-on': 'ubuntu-latest',
        steps: [{ uses: 'actions/checkout@v4' }],
      },
    },
    ...overrides,
  };
}

describe('requiredFieldsRule', () => {
  it('returns no errors for a valid minimal workflow', () => {
    expect(requiredFieldsRule(wf())).toEqual([]);
  });

  it('flags missing `on`', () => {
    const bad = wf();
    const loose = bad as { on?: unknown };
    delete loose.on;
    const errors = requiredFieldsRule(bad);
    expect(errors).toHaveLength(1);
    expect(errors[0]?.path).toEqual(['on']);
    expect(errors[0]?.rule).toBe('required-fields');
  });

  it('flags missing `jobs`', () => {
    const bad = wf();
    const loose = bad as { jobs?: unknown };
    delete loose.jobs;
    const errors = requiredFieldsRule(bad);
    expect(errors).toHaveLength(1);
    expect(errors[0]?.path).toEqual(['jobs']);
  });

  it('flags empty `jobs`', () => {
    const errors = requiredFieldsRule(wf({ jobs: {} }));
    expect(errors).toHaveLength(1);
    expect(errors[0]?.path).toEqual(['jobs']);
  });

  it('flags a NormalJob missing `runs-on`', () => {
    const bad = wf({
      jobs: {
        build: asJob({
          steps: [{ uses: 'actions/checkout@v4' }],
        }),
      },
    });
    const errors = requiredFieldsRule(bad);
    const paths = errors.map((e) => e.path);
    expect(paths).toContainEqual(['jobs', 'build']);
  });

  it('flags a NormalJob with empty `steps`', () => {
    const bad = wf({
      jobs: {
        build: {
          'runs-on': 'ubuntu-latest',
          steps: [],
        },
      },
    });
    const errors = requiredFieldsRule(bad);
    expect(errors).toHaveLength(1);
    expect(errors[0]?.path).toEqual(['jobs', 'build', 'steps']);
  });

  it('flags a step with neither `uses` nor `run`', () => {
    const bad = wf({
      jobs: {
        build: {
          'runs-on': 'ubuntu-latest',
          steps: [asStep({ name: 'no-op' })],
        },
      },
    });
    const errors = requiredFieldsRule(bad);
    expect(errors).toHaveLength(1);
    expect(errors[0]?.path).toEqual(['jobs', 'build', 'steps', 0]);
  });

  it('flags a step with both `uses` and `run`', () => {
    const bad = wf({
      jobs: {
        build: {
          'runs-on': 'ubuntu-latest',
          steps: [asStep({ uses: 'actions/checkout@v4', run: 'echo hi' })],
        },
      },
    });
    const errors = requiredFieldsRule(bad);
    expect(errors).toHaveLength(1);
    expect(errors[0]?.path).toEqual(['jobs', 'build', 'steps', 0]);
    expect(errors[0]?.message).toMatch(/both/);
  });

  it('flags a reusable job missing `uses`', () => {
    const bad = wf({
      jobs: {
        call: asJob({}),
      },
    });
    const errors = requiredFieldsRule(bad);
    expect(errors.length).toBeGreaterThanOrEqual(1);
    expect(errors[0]?.path).toEqual(['jobs', 'call']);
  });

  it('accepts a reusable job with `uses`', () => {
    const good = wf({
      jobs: {
        call: {
          uses: './.github/workflows/reusable.yml',
        },
      },
    });
    expect(requiredFieldsRule(good)).toEqual([]);
  });
});
