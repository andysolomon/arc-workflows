import React from 'react';
import { describe, expect, it } from 'vitest';
import { render } from 'ink-testing-library';
import { StepsPage } from './steps.js';
import { WizardProvider, useWizard } from '../context.js';
import type { Step } from '@arc-workflows/core';

function PrimedSteps({ jobId, steps }: { jobId: string; steps: Step[] }): React.JSX.Element {
  const [state, send] = useWizard();
  const sendRef = React.useRef(send);
  sendRef.current = send;
  React.useEffect(() => {
    const s = sendRef.current;
    s({ type: 'SELECT_CREATE' });
    s({ type: 'SELECT_BLANK' });
    s({ type: 'NEXT' }); // -> triggers
    s({ type: 'NEXT' }); // -> jobs
    s({
      type: 'ADD_JOB',
      id: jobId,
      job: { 'runs-on': 'ubuntu-latest', steps },
    });
    s({ type: 'EDIT_JOB', id: jobId }); // -> jobConfig
    s({ type: 'NEXT' }); // -> steps
  }, [jobId, steps]);

  if (state.value !== 'steps') return <></>;
  return <StepsPage />;
}

async function tick(): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, 10));
}

describe('StepsPage', () => {
  it('renders header with the current job id and empty state', async () => {
    const { lastFrame } = render(
      <WizardProvider>
        <PrimedSteps jobId="build" steps={[]} />
      </WizardProvider>,
    );
    await tick();
    const frame = lastFrame() ?? '';
    expect(frame).toContain('Steps for');
    expect(frame).toContain('build');
    expect(frame).toContain('(no steps yet)');
    expect(frame).toContain('[+ Add new step]');
    expect(frame).toContain('[Done]');
  });

  it('renders step summaries for existing steps', async () => {
    const { lastFrame } = render(
      <WizardProvider>
        <PrimedSteps jobId="build" steps={[{ uses: 'actions/checkout@v4' }, { run: 'npm test' }]} />
      </WizardProvider>,
    );
    await tick();
    const frame = lastFrame() ?? '';
    expect(frame).toContain('actions/checkout@v4');
    expect(frame).toContain('npm test');
    expect(frame).toContain('1.');
    expect(frame).toContain('2.');
  });

  it('renders keyboard hints', async () => {
    const { lastFrame } = render(
      <WizardProvider>
        <PrimedSteps jobId="build" steps={[]} />
      </WizardProvider>,
    );
    await tick();
    const frame = lastFrame() ?? '';
    expect(frame).toContain('Up/Down');
    expect(frame).toContain('Enter');
    expect(frame).toContain('Esc');
  });
});
