import { describe, expect, it } from 'vitest';

import type { Workflow } from '../../schema/index.js';
import { runnersRule } from './runners.js';

function withRunsOn(runsOn: unknown): Workflow {
  return {
    on: { push: { branches: ['main'] } },
    jobs: {
      a: {
        'runs-on': runsOn as Workflow['jobs'][string] extends { 'runs-on': infer R } ? R : never,
        steps: [{ run: 'echo hi' }],
      } as Workflow['jobs'][string],
    },
  };
}

describe('runnersRule', () => {
  it('returns no warnings for a known label', () => {
    expect(runnersRule(withRunsOn('ubuntu-latest'))).toEqual([]);
  });

  it("returns no warnings for 'self-hosted'", () => {
    expect(runnersRule(withRunsOn('self-hosted'))).toEqual([]);
  });

  it('warns on an unknown label', () => {
    const errors = runnersRule(withRunsOn('unknown-label'));
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatchObject({
      path: ['jobs', 'a', 'runs-on'],
      severity: 'warning',
      rule: 'runners',
    });
    expect(errors[0]?.message).toContain("'unknown-label'");
  });

  it('returns no warnings for a self-hosted array', () => {
    expect(runnersRule(withRunsOn(['self-hosted', 'linux', 'x64']))).toEqual([]);
  });

  it('returns no warnings when one array element is known', () => {
    expect(runnersRule(withRunsOn(['ubuntu-latest', 'extra-label']))).toEqual([]);
  });

  it('warns when no array element is known', () => {
    const errors = runnersRule(withRunsOn(['custom-1', 'custom-2']));
    expect(errors).toHaveLength(1);
    expect(errors[0]?.path).toEqual(['jobs', 'a', 'runs-on']);
  });

  it('skips expression-driven labels', () => {
    expect(runnersRule(withRunsOn('ubuntu-${{ matrix.os }}'))).toEqual([]);
  });

  it('skips runner-group object form', () => {
    expect(runnersRule(withRunsOn({ group: 'my-group', labels: ['x'] }))).toEqual([]);
  });

  it('skips reusable jobs', () => {
    const wf: Workflow = {
      on: { push: { branches: ['main'] } },
      jobs: {
        r: { uses: './.github/workflows/reusable.yml' },
      },
    };
    expect(runnersRule(wf)).toEqual([]);
  });
});
