import { describe, expect, it } from 'vitest';

import type { Job, Workflow } from '../../schema/index.js';
import { jobDepsRule } from './job-deps.js';

function wfWithJobs(jobs: Record<string, Partial<Job>>): Workflow {
  const built: Record<string, Job> = {};
  for (const [id, job] of Object.entries(jobs)) {
    built[id] = {
      'runs-on': 'ubuntu-latest',
      steps: [{ run: 'echo ok' }],
      ...job,
    } as Job;
  }
  return {
    on: { push: { branches: ['main'] } },
    jobs: built,
  };
}

describe('jobDepsRule', () => {
  it('returns no errors for a valid linear chain', () => {
    const wf = wfWithJobs({
      a: {},
      b: { needs: 'a' },
      c: { needs: ['b'] },
    });
    expect(jobDepsRule(wf)).toEqual([]);
  });

  it('returns no errors for a diamond', () => {
    const wf = wfWithJobs({
      a: {},
      b: { needs: 'a' },
      c: { needs: 'a' },
      d: { needs: ['b', 'c'] },
    });
    expect(jobDepsRule(wf)).toEqual([]);
  });

  it('flags a reference to an undefined job', () => {
    const wf = wfWithJobs({
      a: { needs: 'nonexistent' },
    });
    const errors = jobDepsRule(wf);
    expect(errors).toHaveLength(1);
    expect(errors[0]?.path).toEqual(['jobs', 'a', 'needs']);
    expect(errors[0]?.message).toMatch(/undefined job 'nonexistent'/);
    expect(errors[0]?.rule).toBe('job-deps');
  });

  it('flags a self-loop as a cycle', () => {
    const wf = wfWithJobs({
      a: { needs: 'a' },
    });
    const errors = jobDepsRule(wf);
    expect(errors).toHaveLength(1);
    expect(errors[0]?.path).toEqual(['jobs', 'a']);
    expect(errors[0]?.message).toMatch(/cyclic/);
    expect(errors[0]?.message).toMatch(/a → a/);
  });

  it('flags a 3-cycle and names the cycle', () => {
    const wf = wfWithJobs({
      a: { needs: 'c' },
      b: { needs: 'a' },
      c: { needs: 'b' },
    });
    const errors = jobDepsRule(wf);
    expect(errors).toHaveLength(1);
    expect(errors[0]?.rule).toBe('job-deps');
    expect(errors[0]?.message).toMatch(/cyclic dependency/);
    // Cycle should mention all three nodes.
    expect(errors[0]?.message).toMatch(/a/);
    expect(errors[0]?.message).toMatch(/b/);
    expect(errors[0]?.message).toMatch(/c/);
  });

  it('does not double-report the same cycle from multiple entry points', () => {
    const wf = wfWithJobs({
      a: { needs: 'b' },
      b: { needs: 'a' },
    });
    const errors = jobDepsRule(wf);
    expect(errors).toHaveLength(1);
  });

  it('reports separate cycles separately', () => {
    const wf = wfWithJobs({
      a: { needs: 'b' },
      b: { needs: 'a' },
      c: { needs: 'd' },
      d: { needs: 'c' },
    });
    const errors = jobDepsRule(wf);
    expect(errors).toHaveLength(2);
  });
});
