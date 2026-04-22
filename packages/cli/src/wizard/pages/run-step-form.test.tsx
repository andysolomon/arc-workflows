import React from 'react';
import { describe, expect, it } from 'vitest';
import { render } from 'ink-testing-library';
import { RunStepForm } from './run-step-form.js';

describe('RunStepForm', () => {
  it('renders all run-step fields', () => {
    const { lastFrame } = render(
      <RunStepForm
        initial={{ run: '' }}
        onCommit={() => undefined}
        onBack={() => undefined}
      />,
    );
    const frame = lastFrame() ?? '';
    expect(frame).toContain('Configure run step');
    expect(frame).toContain('name');
    expect(frame).toContain('id');
    expect(frame).toContain('if');
    expect(frame).toContain('run');
    expect(frame).toContain('shell');
    expect(frame).toContain('env');
    expect(frame).toContain('continue-on-error');
    expect(frame).toContain('timeout-minutes');
    expect(frame).toContain('working-directory');
    expect(frame).toContain('[Done]');
  });

  it('shows the shell hint', () => {
    const { lastFrame } = render(
      <RunStepForm
        initial={{ run: '' }}
        onCommit={() => undefined}
        onBack={() => undefined}
      />,
    );
    const frame = lastFrame() ?? '';
    expect(frame).toContain('bash');
    expect(frame).toContain('pwsh');
  });

  it('pre-fills fields from the initial step', () => {
    const { lastFrame } = render(
      <RunStepForm
        initial={{
          run: 'npm test',
          name: 'Test',
          shell: 'bash',
        }}
        onCommit={() => undefined}
        onBack={() => undefined}
      />,
    );
    const frame = lastFrame() ?? '';
    expect(frame).toContain('npm test');
    expect(frame).toContain('Test');
  });
});
