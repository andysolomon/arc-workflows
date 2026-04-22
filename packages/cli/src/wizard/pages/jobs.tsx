import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import type { Job } from '@arc-workflows/core';
import { useWizard } from '../context.js';

/**
 * List view of all jobs in the current workflow. Arrow keys move the
 * cursor between rows. Enter on a job row edits it; Enter on the
 * "Add new job" row creates a blank placeholder and transitions to
 * job-config for editing. Pressing `d` deletes the highlighted job.
 * Enter on `[Done]` transitions to `confirm`.
 */
export function JobsPage(): React.JSX.Element {
  const [state, send] = useWizard();
  const jobs = state.context.workflow.jobs ?? {};
  const jobIds = Object.keys(jobs);

  // Row layout: [0..N-1] = jobs, N = "Add new job", N+1 = "[Done]"
  const addIndex = jobIds.length;
  const doneIndex = jobIds.length + 1;
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
      if (cursor < jobIds.length) {
        const id = jobIds[cursor];
        if (id) send({ type: 'EDIT_JOB', id });
      } else if (cursor === addIndex) {
        const newId = makeUniqueJobId(jobs);
        send({
          type: 'ADD_JOB',
          id: newId,
          job: { 'runs-on': 'ubuntu-latest', steps: [] },
        });
        send({ type: 'EDIT_JOB', id: newId });
      } else if (cursor === doneIndex) {
        send({ type: 'NEXT' });
      }
      return;
    }
    if ((input === 'd' || key.delete) && cursor < jobIds.length) {
      const id = jobIds[cursor];
      if (id) {
        send({ type: 'REMOVE_JOB', id });
        setCursor((c) => Math.max(0, c - 1));
      }
      return;
    }
    if (key.escape) {
      send({ type: 'BACK' });
    }
  });

  return (
    <Box flexDirection="column">
      <Text bold>Jobs</Text>
      <Text dimColor>Up/Down navigate, Enter to edit/add, d to delete, Esc back</Text>
      <Box marginTop={1} flexDirection="column">
        {jobIds.length === 0 && (
          <Box>
            <Text dimColor>(no jobs yet)</Text>
          </Box>
        )}
        {jobIds.map((id, i) => {
          const job = jobs[id];
          const isCursor = i === cursor;
          return (
            <Box key={id}>
              {isCursor ? <Text color="cyan">{'> '}</Text> : <Text>{'  '}</Text>}
              {isCursor ? <Text bold>{id}</Text> : <Text>{id}</Text>}
              <Text dimColor>{`  ${summarizeJob(job)}`}</Text>
            </Box>
          );
        })}
      </Box>
      <Box marginTop={1}>
        {cursor === addIndex ? (
          <Text color="cyan">{'> [+ Add new job]'}</Text>
        ) : (
          <Text>{'  [+ Add new job]'}</Text>
        )}
      </Box>
      <Box>
        {cursor === doneIndex ? <Text color="cyan">{'> [Done]'}</Text> : <Text>{'  [Done]'}</Text>}
      </Box>
    </Box>
  );
}

function summarizeJob(job: Job | undefined): string {
  if (!job) return '';
  if ('uses' in job && typeof job.uses === 'string') {
    return `uses: ${job.uses}`;
  }
  if ('runs-on' in job) {
    const ro = job['runs-on'];
    const runner = typeof ro === 'string' ? ro : Array.isArray(ro) ? ro.join(', ') : 'custom';
    const stepCount = 'steps' in job && Array.isArray(job.steps) ? job.steps.length : 0;
    return `runs-on: ${runner} · ${stepCount} step${stepCount === 1 ? '' : 's'}`;
  }
  return '';
}

function makeUniqueJobId(jobs: Record<string, unknown>): string {
  let i = 1;
  while (`job${i}` in jobs) i++;
  return `job${i}`;
}
