import { describe, expect, it } from 'vitest';

import type { Workflow } from '../schema/index.js';
import { validate } from './validate.js';

describe('validate (pipeline)', () => {
  it('returns valid: true and no errors for a good workflow', () => {
    const wf: Workflow = {
      on: { push: { branches: ['main'] } },
      jobs: {
        a: {
          'runs-on': 'ubuntu-latest',
          steps: [{ uses: 'actions/checkout@v4' }, { run: 'echo hi' }],
        },
        b: {
          'runs-on': 'ubuntu-latest',
          needs: 'a',
          steps: [{ run: 'echo done' }],
        },
      },
    };
    const result = validate(wf);
    expect(result).toEqual({ valid: true, errors: [] });
  });

  it('collects errors from multiple rules in one pass', () => {
    const wf: Workflow = {
      on: { push: { branches: ['main'] } },
      jobs: {
        a: {
          'runs-on': 'ubuntu-latest',
          // bad ref → action-refs error
          steps: [{ uses: 'not-a-ref' }],
          // cycle → job-deps error
          needs: 'b',
        },
        b: {
          'runs-on': 'ubuntu-latest',
          needs: 'a',
          // empty steps → required-fields error
          steps: [],
        },
      },
    };
    const result = validate(wf);
    expect(result.valid).toBe(false);

    const rules = new Set(result.errors.map((e) => e.rule));
    expect(rules.has('required-fields')).toBe(true);
    expect(rules.has('action-refs')).toBe(true);
    expect(rules.has('job-deps')).toBe(true);
  });

  it('collects errors from multiple extended rules', () => {
    const wf: Workflow = {
      on: {
        push: { branches: ['main'] },
        schedule: [{ cron: 'not-a-cron' }],
      },
      permissions: { 'bogus-scope': 'read' } as unknown as NonNullable<Workflow['permissions']>,
      jobs: {
        a: {
          'runs-on': 'totally-made-up',
          strategy: { matrix: { 'node-version': [] } },
          steps: [{ run: 'echo ${{ secret.TOKEN }}' }],
        },
      },
    };
    const result = validate(wf);
    const rules = new Set(result.errors.map((e) => e.rule));
    expect(rules.has('cron')).toBe(true);
    expect(rules.has('matrix')).toBe(true);
    expect(rules.has('permissions')).toBe(true);
    expect(rules.has('expressions')).toBe(true);
    expect(rules.has('runners')).toBe(true);
    expect(result.valid).toBe(false);
  });

  it('marks valid: false when any error has severity `error`', () => {
    const wf: Workflow = {
      on: { push: { branches: ['main'] } },
      jobs: {
        a: {
          'runs-on': 'ubuntu-latest',
          steps: [{ uses: 'bogus' }],
        },
      },
    };
    expect(validate(wf).valid).toBe(false);
  });
});
