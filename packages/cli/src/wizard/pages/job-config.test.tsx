import React from 'react';
import { describe, expect, it } from 'vitest';
import { render } from 'ink-testing-library';
import { JobConfigPage } from './job-config.js';
import { WizardProvider, useWizard } from '../context.js';

/**
 * Helper component that primes wizard context with a current job before
 * rendering JobConfigPage. Keeps tests rendering-only (no stdin).
 */
function PrimedJobConfig({
  jobId,
  extras = false,
}: {
  jobId: string;
  extras?: boolean;
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
      job: { 'runs-on': 'ubuntu-latest', steps: [] },
    });
    if (extras) {
      send({
        type: 'ADD_JOB',
        id: 'other',
        job: { 'runs-on': 'ubuntu-latest', steps: [] },
      });
    }
    send({ type: 'EDIT_JOB', id: jobId });
    // run once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  if (state.value !== 'jobConfig') return <></>;
  return <JobConfigPage />;
}

async function tick(): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, 10));
}

describe('JobConfigPage', () => {
  it('renders header with the current job id', async () => {
    const { lastFrame } = render(
      <WizardProvider>
        <PrimedJobConfig jobId="build" />
      </WizardProvider>,
    );
    await tick();
    const frame = lastFrame() ?? '';
    expect(frame).toContain('Configure job');
    expect(frame).toContain('build');
  });

  it('renders all Tier 1 & 2 fields', async () => {
    const { lastFrame } = render(
      <WizardProvider>
        <PrimedJobConfig jobId="build" />
      </WizardProvider>,
    );
    await tick();
    const frame = lastFrame() ?? '';
    expect(frame).toContain('name');
    expect(frame).toContain('runs-on');
    expect(frame).toContain('if');
    expect(frame).toContain('permissions');
    expect(frame).toContain('env');
    expect(frame).toContain('timeout-minutes');
    expect(frame).toContain('[Done]');
  });

  it('shows runner hint below runs-on', async () => {
    const { lastFrame } = render(
      <WizardProvider>
        <PrimedJobConfig jobId="build" />
      </WizardProvider>,
    );
    await tick();
    const frame = lastFrame() ?? '';
    expect(frame).toContain('ubuntu-latest');
    expect(frame).toContain('macos-latest');
  });

  it('renders permissions picker options', async () => {
    const { lastFrame } = render(
      <WizardProvider>
        <PrimedJobConfig jobId="build" />
      </WizardProvider>,
    );
    await tick();
    const frame = lastFrame() ?? '';
    expect(frame).toContain('read-all');
    expect(frame).toContain('write-all');
    expect(frame).toContain('custom');
  });

  it('shows needs only when more than one job exists', async () => {
    const solo = render(
      <WizardProvider>
        <PrimedJobConfig jobId="build" />
      </WizardProvider>,
    );
    await tick();
    const soloFrame = solo.lastFrame() ?? '';
    expect(soloFrame).not.toContain('needs (other job ids)');

    const multi = render(
      <WizardProvider>
        <PrimedJobConfig jobId="build" extras />
      </WizardProvider>,
    );
    await tick();
    const multiFrame = multi.lastFrame() ?? '';
    expect(multiFrame).toContain('needs');
  });
});
