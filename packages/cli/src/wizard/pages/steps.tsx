import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import type { Job, NormalJob, Step } from '@arc-workflows/core';
import { useWizard } from '../context.js';

/**
 * List view of the current job's steps. Works the same way as the jobs
 * list: cursor navigation, Enter edits, `d` removes, an "Add new step"
 * row creates a blank placeholder and transitions to step-config, and
 * `[Done]` returns to the jobs list via `NEXT`.
 */
export function StepsPage(): React.JSX.Element {
  const [state, send] = useWizard();
  const jobId = state.context.currentJobId ?? '';
  const jobs = state.context.workflow.jobs ?? {};
  const job: Job | undefined = jobs[jobId];
  const steps: Step[] = job && 'steps' in job ? ((job as NormalJob).steps ?? []) : [];

  const addIndex = steps.length;
  const doneIndex = steps.length + 1;
  const lastIndex = doneIndex;

  const [cursor, setCursor] = useState(0);

  useInput((input, key) => {
    if (key.upArrow) {
      setCursor((c) => Math.max(0, c - 1));
      return;
    }
    if (key.downArrow) {
      setCursor((c) => Math.min(lastIndex, c + 1));
      return;
    }
    if (key.return) {
      if (cursor < steps.length) {
        send({ type: 'EDIT_STEP', index: cursor });
      } else if (cursor === addIndex) {
        // Add a blank ActionStep placeholder (user picks action/run
        // inside step-config). We need `uses` defined to satisfy the
        // discriminated union; empty string signals "not yet chosen".
        const placeholder: Step = { uses: '' };
        send({ type: 'ADD_STEP', step: placeholder });
        send({ type: 'EDIT_STEP', index: steps.length });
      } else if (cursor === doneIndex) {
        send({ type: 'NEXT' });
      }
      return;
    }
    if ((input === 'd' || key.delete) && cursor < steps.length) {
      send({ type: 'REMOVE_STEP', jobId, stepIndex: cursor });
      setCursor((c) => Math.max(0, c - 1));
      return;
    }
    if (key.escape) {
      send({ type: 'BACK' });
    }
  });

  return (
    <Box flexDirection="column">
      <Text bold>Steps for {jobId === '' ? '(no job)' : jobId}</Text>
      <Text dimColor>Up/Down navigate, Enter to edit/add, d to delete, Esc back</Text>
      <Box marginTop={1} flexDirection="column">
        {steps.length === 0 && (
          <Box>
            <Text dimColor>(no steps yet)</Text>
          </Box>
        )}
        {steps.map((step, i) => {
          const isCursor = i === cursor;
          return (
            <Box key={i}>
              {isCursor ? <Text color="cyan">{'> '}</Text> : <Text>{'  '}</Text>}
              {isCursor ? (
                <Text bold>{`${i + 1}. ${summarizeStep(step)}`}</Text>
              ) : (
                <Text>{`${i + 1}. ${summarizeStep(step)}`}</Text>
              )}
            </Box>
          );
        })}
      </Box>
      <Box marginTop={1}>
        {cursor === addIndex ? (
          <Text color="cyan">{'> [+ Add new step]'}</Text>
        ) : (
          <Text>{'  [+ Add new step]'}</Text>
        )}
      </Box>
      <Box>
        {cursor === doneIndex ? <Text color="cyan">{'> [Done]'}</Text> : <Text>{'  [Done]'}</Text>}
      </Box>
    </Box>
  );
}

function summarizeStep(step: Step): string {
  if ('uses' in step && typeof step.uses === 'string' && step.uses !== '') {
    const name = step.name !== undefined ? `${step.name} — ` : '';
    return `${name}uses: ${step.uses}`;
  }
  if ('run' in step && typeof step.run === 'string' && step.run !== '') {
    const name = step.name !== undefined ? `${step.name} — ` : '';
    const firstLine = step.run.split('\n', 1)[0] ?? '';
    const truncated = firstLine.length > 40 ? `${firstLine.slice(0, 40)}…` : firstLine;
    return `${name}run: ${truncated}`;
  }
  return '(empty step — configure it)';
}
