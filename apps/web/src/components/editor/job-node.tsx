'use client';

import * as React from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { Job, Step } from '@arc-workflows/core';

interface JobNodeData extends Record<string, unknown> {
  id: string;
  job: Job;
  onStepClick?: (stepIndex: number) => void;
}

export function JobNode({ data }: NodeProps): React.JSX.Element {
  const { id, job, onStepClick } = data as JobNodeData;
  const steps: Step[] = 'steps' in job && job.steps ? job.steps : [];
  const runsOn =
    'runs-on' in job && typeof job['runs-on'] === 'string' ? job['runs-on'] : 'reusable';

  return (
    <div className="bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-700 rounded-lg shadow-md min-w-[240px]">
      <Handle type="target" position={Position.Top} />
      <div className="border-b border-zinc-200 dark:border-zinc-700 px-3 py-2">
        <div className="font-semibold text-sm">{id}</div>
        <div className="text-xs text-zinc-500">{runsOn}</div>
      </div>
      <ul className="text-xs px-3 py-2 max-h-32 overflow-auto">
        {steps.map((step, idx) => (
          <li
            key={idx}
            className="py-0.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer truncate"
            onClick={() => onStepClick?.(idx)}
          >
            {step.name ?? ('uses' in step && step.uses ? step.uses : 'run: ...')}
          </li>
        ))}
      </ul>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
