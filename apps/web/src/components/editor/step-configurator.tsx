'use client';

import * as React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import type { CommonAction, Step } from '@arc-workflows/core';
import { ActionStepForm } from './action-step-form';
import { RunStepForm } from './run-step-form';

interface Props {
  step: Step | null;
  commonActions: readonly CommonAction[];
  onClose: () => void;
  onChange: (step: Step) => void;
}

export function StepConfigurator({
  step,
  commonActions,
  onClose,
  onChange,
}: Props): React.JSX.Element {
  return (
    <Sheet
      open={step !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent className="w-[500px] sm:max-w-[500px]">
        <SheetHeader>
          <SheetTitle>Edit step</SheetTitle>
        </SheetHeader>
        {step && 'uses' in step && step.uses ? (
          <ActionStepForm step={step} commonActions={commonActions} onChange={onChange} />
        ) : step && 'run' in step && step.run ? (
          <RunStepForm step={step} onChange={onChange} />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
