'use client';

import * as React from 'react';
import type { ActionStep, CommonAction } from '@arc-workflows/core';
import { Input } from '@/components/ui/input';

interface Props {
  step: ActionStep;
  commonActions: readonly CommonAction[];
  onChange: (step: ActionStep) => void;
}

export function ActionStepForm({ step, commonActions, onChange }: Props): React.JSX.Element {
  const baseRef = step.uses.split('@')[0] ?? '';
  const knownAction = commonActions.find((a) => a.name === baseRef);

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
        <label className="text-sm font-medium">uses</label>
        <Input
          list="common-actions"
          value={step.uses}
          onChange={(e) => onChange({ ...step, uses: e.target.value })}
        />
        <datalist id="common-actions">
          {commonActions.map((a) => (
            <option key={a.name} value={`${a.name}@${a.version}`}>
              {a.description}
            </option>
          ))}
        </datalist>
      </div>
      {knownAction && knownAction.inputs.length > 0 && (
        <div>
          <label className="text-sm font-medium">with</label>
          <div className="space-y-2 mt-2">
            {knownAction.inputs.map((input) => (
              <div key={input.name}>
                <label className="text-xs text-zinc-500">
                  {input.name}
                  {input.required ? ' *' : ''}
                </label>
                <Input
                  value={String(step.with?.[input.name] ?? input.default ?? '')}
                  placeholder={input.description}
                  onChange={(e) =>
                    onChange({
                      ...step,
                      with: { ...step.with, [input.name]: e.target.value },
                    })
                  }
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
