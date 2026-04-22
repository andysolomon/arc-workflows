import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import type { ActionStep, Job, NormalJob, RunStep, Step } from '@arc-workflows/core';
import { useWizard } from '../context.js';
import { ActionStepForm } from './action-step-form.js';
import { RunStepForm } from './run-step-form.js';

type StepKind = 'action' | 'run';

function isActionStep(step: Step): step is ActionStep {
  return 'uses' in step && typeof step.uses === 'string';
}

function hasContent(step: Step): boolean {
  if (isActionStep(step)) return step.uses !== '';
  return 'run' in step && typeof step.run === 'string' && step.run !== '';
}

/**
 * Top-level page for editing a single step. Reads the current job and
 * step index from wizard context. If the step already has `uses`/`run`
 * content, we dispatch directly to the matching sub-form. Otherwise we
 * show a kind picker (action vs run) first.
 */
export function StepConfigPage(): React.JSX.Element {
  const [state, send] = useWizard();
  const jobId = state.context.currentJobId ?? '';
  const stepIndex = state.context.currentStepIndex;
  const jobs = state.context.workflow.jobs ?? {};
  const job: Job | undefined = jobs[jobId];
  const step: Step | undefined =
    job && 'steps' in job && stepIndex !== null ? (job as NormalJob).steps[stepIndex] : undefined;

  const initialKind: StepKind | null = step ? (isActionStep(step) ? 'action' : 'run') : null;

  const [kind, setKind] = useState<StepKind | null>(() => {
    if (!step) return null;
    if (hasContent(step)) return initialKind;
    // Placeholder (empty uses/run) — let user pick.
    return null;
  });

  // Kind picker state (only used while kind is null)
  const [pickerCursor, setPickerCursor] = useState<StepKind>('action');

  useInput(
    (_input, key) => {
      if (kind !== null) return;
      if (key.leftArrow || key.rightArrow) {
        setPickerCursor((c) => (c === 'action' ? 'run' : 'action'));
      } else if (key.return) {
        setKind(pickerCursor);
      } else if (key.escape) {
        send({ type: 'BACK' });
      }
    },
    { isActive: kind === null },
  );

  function onCommit(newStep: Step): void {
    if (stepIndex === null) return;
    send({ type: 'UPDATE_STEP', jobId, stepIndex, step: newStep });
    send({ type: 'NEXT' });
  }

  function onBack(): void {
    send({ type: 'BACK' });
  }

  if (step === undefined || stepIndex === null) {
    return (
      <Box flexDirection="column">
        <Text color="red">No step selected.</Text>
        <Text dimColor>Press Esc to go back.</Text>
      </Box>
    );
  }

  if (kind === null) {
    return (
      <Box flexDirection="column">
        <Text bold>Is this an Action step or a Run step?</Text>
        <Text dimColor>Left/Right to choose, Enter to confirm, Esc to go back</Text>
        <Box marginTop={1}>
          {pickerCursor === 'action' ? (
            <Text color="cyan" bold>
              {'> [Action (uses)]'}
            </Text>
          ) : (
            <Text>{'  [Action (uses)]'}</Text>
          )}
          <Text> </Text>
          {pickerCursor === 'run' ? (
            <Text color="cyan" bold>
              {'> [Run (shell)]'}
            </Text>
          ) : (
            <Text>{'  [Run (shell)]'}</Text>
          )}
        </Box>
      </Box>
    );
  }

  if (kind === 'action') {
    const actionInitial: ActionStep = isActionStep(step) ? step : { uses: '' };
    return <ActionStepForm initial={actionInitial} onCommit={onCommit} onBack={onBack} />;
  }

  // kind === 'run'
  const runInitial: RunStep = !isActionStep(step) ? step : { run: '' };
  return <RunStepForm initial={runInitial} onCommit={onCommit} onBack={onBack} />;
}
