import React from 'react';
import { describe, expect, it } from 'vitest';
import { render } from 'ink-testing-library';
import { StepConfigPage } from './step-config.js';
import { WizardProvider, useWizard } from '../context.js';
import type { Step } from '@arc-workflows/core';

function PrimedStepConfig({
  jobId,
  step,
}: {
  jobId: string;
  step: Step;
}): React.JSX.Element {
  const [state, send] = useWizard();
  React.useEffect(() => {
    send({ type: 'SELECT_CREATE' });
    send({ type: 'SELECT_BLANK' });
    send({ type: 'NEXT' }); // -> triggers
    send({ type: 'NEXT' }); // -> jobs
    send({
      type: 'ADD_JOB',
      id: jobId,
      job: { 'runs-on': 'ubuntu-latest', steps: [step] },
    });
    send({ type: 'EDIT_JOB', id: jobId }); // -> jobConfig
    send({ type: 'NEXT' }); // -> steps
    send({ type: 'EDIT_STEP', index: 0 }); // -> stepConfig
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  if (state.value !== 'stepConfig') return <></>;
  return <StepConfigPage />;
}

async function tick(): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, 10));
}

describe('StepConfigPage', () => {
  it('shows the kind picker for a placeholder step', async () => {
    const { lastFrame } = render(
      <WizardProvider>
        <PrimedStepConfig jobId="build" step={{ uses: '' }} />
      </WizardProvider>,
    );
    await tick();
    const frame = lastFrame() ?? '';
    expect(frame).toContain('Action step or a Run step');
    expect(frame).toContain('Action');
    expect(frame).toContain('Run');
  });

  it('renders the action form directly for an existing action step', async () => {
    const { lastFrame } = render(
      <WizardProvider>
        <PrimedStepConfig jobId="build" step={{ uses: 'actions/checkout@v4' }} />
      </WizardProvider>,
    );
    await tick();
    const frame = lastFrame() ?? '';
    expect(frame).toContain('Configure action step');
    expect(frame).toContain('actions/checkout@v4');
  });

  it('renders the run form directly for an existing run step', async () => {
    const { lastFrame } = render(
      <WizardProvider>
        <PrimedStepConfig jobId="build" step={{ run: 'npm test' }} />
      </WizardProvider>,
    );
    await tick();
    const frame = lastFrame() ?? '';
    expect(frame).toContain('Configure run step');
    expect(frame).toContain('npm test');
  });
});
