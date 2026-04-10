'use client';

import * as React from 'react';
import type { RunStep } from '@arc-workflows/core';
import { Input } from '@/components/ui/input';

interface Props {
  step: RunStep;
  onChange: (step: RunStep) => void;
}

export function RunStepForm({ step, onChange }: Props): React.JSX.Element {
  return (
    <div className="space-y-4 mt-4">
      <div>
        <label className="text-sm font-medium">name</label>
        <Input
          value={step.name ?? ''}
          onChange={(e) => onChange({ ...step, name: e.target.value })}
        />
      </div>
      <div>
        <label className="text-sm font-medium">run</label>
        <textarea
          className="w-full h-40 p-2 border rounded font-mono text-sm bg-background"
          value={step.run}
          onChange={(e) => onChange({ ...step, run: e.target.value })}
        />
      </div>
      <div>
        <label className="text-sm font-medium">shell</label>
        <Input
          value={step.shell ?? ''}
          placeholder="bash"
          onChange={(e) => onChange({ ...step, shell: e.target.value })}
        />
      </div>
    </div>
  );
}
