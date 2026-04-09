import { describe, expect, it } from 'vitest';
import type { NormalJob, Workflow } from '@arc-workflows/core';
import { workflowReducer } from './workflow-reducer';

function makeJob(overrides: Partial<NormalJob> = {}): NormalJob {
  return {
    'runs-on': 'ubuntu-latest',
    steps: [{ uses: 'actions/checkout@v4' }],
    ...overrides,
  };
}

function makeWorkflow(jobs: Record<string, NormalJob>): Workflow {
  return { on: { push: {} }, jobs };
}

describe('workflowReducer', () => {
  describe('add-job', () => {
    it('adds a new job to the map', () => {
      const state = makeWorkflow({ a: makeJob() });
      const next = workflowReducer(state, { type: 'add-job', id: 'b', job: makeJob() });
      expect(Object.keys(next.jobs)).toEqual(['a', 'b']);
    });
  });

  describe('remove-job', () => {
    it('removes the job from the map', () => {
      const state = makeWorkflow({ a: makeJob(), b: makeJob() });
      const next = workflowReducer(state, { type: 'remove-job', id: 'a' });
      expect(Object.keys(next.jobs)).toEqual(['b']);
    });

    it('strips the removed id from any other jobs needs list', () => {
      const state = makeWorkflow({
        a: makeJob(),
        b: makeJob({ needs: ['a'] }),
        c: makeJob({ needs: ['a', 'b'] }),
      });
      const next = workflowReducer(state, { type: 'remove-job', id: 'a' });
      expect(next.jobs.b?.needs).toBeUndefined();
      expect(next.jobs.c?.needs).toEqual(['b']);
    });
  });

  describe('add-edge', () => {
    it('adds the source to the targets needs list', () => {
      const state = makeWorkflow({ a: makeJob(), b: makeJob() });
      const next = workflowReducer(state, { type: 'add-edge', source: 'a', target: 'b' });
      expect(next.jobs.b?.needs).toEqual(['a']);
    });

    it('is idempotent — adding twice is a no-op', () => {
      const state = makeWorkflow({ a: makeJob(), b: makeJob() });
      const once = workflowReducer(state, { type: 'add-edge', source: 'a', target: 'b' });
      const twice = workflowReducer(once, { type: 'add-edge', source: 'a', target: 'b' });
      expect(twice.jobs.b?.needs).toEqual(['a']);
    });

    it('rejects cycles (A → B exists, refuse B → A)', () => {
      const state = makeWorkflow({
        a: makeJob(),
        b: makeJob({ needs: ['a'] }),
      });
      const next = workflowReducer(state, { type: 'add-edge', source: 'b', target: 'a' });
      // a should still have no needs
      expect(next.jobs.a?.needs).toBeUndefined();
    });

    it('rejects self-edges', () => {
      const state = makeWorkflow({ a: makeJob() });
      const next = workflowReducer(state, { type: 'add-edge', source: 'a', target: 'a' });
      expect(next.jobs.a?.needs).toBeUndefined();
    });
  });

  describe('remove-edge', () => {
    it('strips from needs', () => {
      const state = makeWorkflow({
        a: makeJob(),
        b: makeJob(),
        c: makeJob({ needs: ['a', 'b'] }),
      });
      const next = workflowReducer(state, { type: 'remove-edge', source: 'a', target: 'c' });
      expect(next.jobs.c?.needs).toEqual(['b']);
    });

    it('removes the needs field entirely if it becomes empty', () => {
      const state = makeWorkflow({
        a: makeJob(),
        b: makeJob({ needs: ['a'] }),
      });
      const next = workflowReducer(state, { type: 'remove-edge', source: 'a', target: 'b' });
      expect(next.jobs.b?.needs).toBeUndefined();
    });
  });

  describe('update-step', () => {
    it('replaces the step at the given index', () => {
      const state = makeWorkflow({
        a: makeJob({ steps: [{ uses: 'actions/checkout@v4' }, { run: 'echo hi' }] }),
      });
      const next = workflowReducer(state, {
        type: 'update-step',
        jobId: 'a',
        stepIndex: 1,
        step: { run: 'echo bye' },
      });
      const job = next.jobs.a;
      if (!job || !('steps' in job) || !job.steps) throw new Error('expected steps');
      expect(job.steps[1]).toEqual({ run: 'echo bye' });
    });
  });

  describe('add-step', () => {
    it('appends to the steps array', () => {
      const state = makeWorkflow({ a: makeJob({ steps: [{ uses: 'actions/checkout@v4' }] }) });
      const next = workflowReducer(state, {
        type: 'add-step',
        jobId: 'a',
        step: { run: 'echo hi' },
      });
      const job = next.jobs.a;
      if (!job || !('steps' in job) || !job.steps) throw new Error('expected steps');
      expect(job.steps).toHaveLength(2);
      expect(job.steps[1]).toEqual({ run: 'echo hi' });
    });
  });

  describe('remove-step', () => {
    it('removes by index', () => {
      const state = makeWorkflow({
        a: makeJob({ steps: [{ uses: 'actions/checkout@v4' }, { run: 'echo hi' }] }),
      });
      const next = workflowReducer(state, { type: 'remove-step', jobId: 'a', stepIndex: 0 });
      const job = next.jobs.a;
      if (!job || !('steps' in job) || !job.steps) throw new Error('expected steps');
      expect(job.steps).toEqual([{ run: 'echo hi' }]);
    });
  });

  describe('rename-job', () => {
    it('renames the job and updates references in needs', () => {
      const state = makeWorkflow({
        a: makeJob(),
        b: makeJob({ needs: ['a'] }),
      });
      const next = workflowReducer(state, { type: 'rename-job', oldId: 'a', newId: 'aa' });
      expect(next.jobs.aa).toBeDefined();
      expect(next.jobs.a).toBeUndefined();
      expect(next.jobs.b?.needs).toEqual(['aa']);
    });
  });

  describe('round-trip', () => {
    it('a NormalJob with runs-on and steps survives all actions cleanly', () => {
      let state = makeWorkflow({});
      state = workflowReducer(state, { type: 'add-job', id: 'a', job: makeJob() });
      state = workflowReducer(state, { type: 'add-job', id: 'b', job: makeJob() });
      state = workflowReducer(state, { type: 'add-edge', source: 'a', target: 'b' });
      state = workflowReducer(state, {
        type: 'add-step',
        jobId: 'b',
        step: { run: 'echo bye' },
      });
      state = workflowReducer(state, {
        type: 'update-step',
        jobId: 'b',
        stepIndex: 0,
        step: { uses: 'actions/checkout@v4', name: 'co' },
      });
      const job = state.jobs.b;
      if (!job || !('steps' in job) || !job.steps) throw new Error('expected steps');
      expect(job['runs-on']).toBe('ubuntu-latest');
      expect(job.needs).toEqual(['a']);
      expect(job.steps).toHaveLength(2);
    });
  });
});
