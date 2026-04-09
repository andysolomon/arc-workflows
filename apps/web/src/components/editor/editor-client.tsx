'use client';

import * as React from 'react';
import { useReducer, useState, useMemo, useCallback } from 'react';
import { ReactFlow, Background, Controls, type Connection } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { SessionProvider } from 'next-auth/react';
import type { CommonAction, Workflow, Step } from '@arc-workflows/core';
import { workflowReducer } from './workflow-reducer';
import { workflowToFlow } from './workflow-to-flow';
import { JobNode } from './job-node';
import { YamlPreview } from './yaml-preview';
import { StepConfigurator } from './step-configurator';
import { SaveButton } from './save-button';

const nodeTypes = { jobNode: JobNode };

interface Props {
  initialWorkflow: Workflow;
  commonActions: readonly CommonAction[];
}

export function EditorClient({ initialWorkflow, commonActions }: Props): React.JSX.Element {
  return (
    <SessionProvider>
      <EditorInner initialWorkflow={initialWorkflow} commonActions={commonActions} />
    </SessionProvider>
  );
}

function EditorInner({ initialWorkflow, commonActions }: Props): React.JSX.Element {
  const [workflow, dispatch] = useReducer(workflowReducer, initialWorkflow);
  const [selected, setSelected] = useState<{ jobId: string; stepIndex: number } | null>(null);

  const { nodes, edges } = useMemo(() => workflowToFlow(workflow), [workflow]);

  const onConnect = useCallback((conn: Connection) => {
    if (conn.source && conn.target) {
      dispatch({ type: 'add-edge', source: conn.source, target: conn.target });
    }
  }, []);

  const selectedStep: Step | null = (() => {
    if (!selected) return null;
    const job = workflow.jobs[selected.jobId];
    if (!job || !('steps' in job) || !job.steps) return null;
    return job.steps[selected.stepIndex] ?? null;
  })();

  return (
    <div className="h-screen flex flex-col">
      <header className="border-b px-4 py-2 flex justify-between items-center">
        <div>
          <h1 className="text-lg font-semibold">{workflow.name ?? 'workflow'}</h1>
        </div>
        <SaveButton workflow={workflow} />
      </header>
      <div className="flex-1 grid grid-cols-2">
        <div className="border-r">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onConnect={onConnect}
            fitView
          >
            <Background />
            <Controls />
          </ReactFlow>
        </div>
        <div className="flex flex-col">
          <YamlPreview workflow={workflow} />
        </div>
      </div>
      <StepConfigurator
        step={selectedStep}
        commonActions={commonActions}
        onClose={() => setSelected(null)}
        onChange={(step) => {
          if (selected) {
            dispatch({
              type: 'update-step',
              jobId: selected.jobId,
              stepIndex: selected.stepIndex,
              step,
            });
          }
        }}
      />
    </div>
  );
}
