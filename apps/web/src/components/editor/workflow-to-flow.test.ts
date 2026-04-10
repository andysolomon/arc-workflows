import { describe, expect, it } from 'vitest';
import type { NormalJob, Workflow } from '@arc-workflows/core';
import { workflowToFlow } from './workflow-to-flow';

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

describe('workflowToFlow', () => {
  it('produces 3 nodes + 0 edges for 3 jobs without needs', () => {
    const wf = makeWorkflow({ a: makeJob(), b: makeJob(), c: makeJob() });
    const { nodes, edges } = workflowToFlow(wf);
    expect(nodes).toHaveLength(3);
    expect(edges).toHaveLength(0);
  });

  it('produces edge a→b for needs: ["a"]', () => {
    const wf = makeWorkflow({ a: makeJob(), b: makeJob({ needs: ['a'] }) });
    const { edges } = workflowToFlow(wf);
    expect(edges).toHaveLength(1);
    expect(edges[0]).toMatchObject({ source: 'a', target: 'b' });
  });

  it('normalizes needs: "a" (string form) to a single edge', () => {
    const wf = makeWorkflow({ a: makeJob(), b: makeJob({ needs: 'a' }) });
    const { edges } = workflowToFlow(wf);
    expect(edges).toHaveLength(1);
    expect(edges[0]).toMatchObject({ source: 'a', target: 'b' });
  });

  it('dagre positions are deterministic for the same input', () => {
    const wf = makeWorkflow({ a: makeJob(), b: makeJob({ needs: ['a'] }) });
    const a = workflowToFlow(wf);
    const b = workflowToFlow(wf);
    expect(a.nodes.map((n) => n.position)).toEqual(b.nodes.map((n) => n.position));
  });

  it('every node has type "jobNode" and id+job in data', () => {
    const wf = makeWorkflow({ a: makeJob(), b: makeJob({ needs: ['a'] }) });
    const { nodes } = workflowToFlow(wf);
    for (const node of nodes) {
      expect(node.type).toBe('jobNode');
      expect(node.data).toHaveProperty('id');
      expect(node.data).toHaveProperty('job');
    }
  });
});
