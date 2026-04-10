import dagre from '@dagrejs/dagre';
import type { Node, Edge } from '@xyflow/react';
import type { Workflow } from '@arc-workflows/core';

const NODE_WIDTH = 240;
const NODE_HEIGHT = 140;

export function workflowToFlow(workflow: Workflow): { nodes: Node[]; edges: Edge[] } {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'TB', nodesep: 80, ranksep: 100 });

  for (const id of Object.keys(workflow.jobs)) {
    g.setNode(id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  }

  const edges: Edge[] = [];
  for (const [id, job] of Object.entries(workflow.jobs)) {
    const needs = Array.isArray(job.needs) ? job.needs : job.needs ? [job.needs] : [];
    for (const dep of needs) {
      if (!workflow.jobs[dep]) continue;
      g.setEdge(dep, id);
      edges.push({
        id: `${dep}->${id}`,
        source: dep,
        target: id,
        type: 'smoothstep',
      });
    }
  }

  dagre.layout(g);

  const nodes: Node[] = Object.entries(workflow.jobs).map(([id, job]) => {
    const pos = g.node(id);
    return {
      id,
      type: 'jobNode',
      position: { x: pos.x - NODE_WIDTH / 2, y: pos.y - NODE_HEIGHT / 2 },
      data: { id, job } as Record<string, unknown>,
    };
  });

  return { nodes, edges };
}
