import React from 'react';
import { describe, expect, it } from 'vitest';
import { render } from 'ink-testing-library';
import { JobsPage } from './jobs.js';
import { WizardProvider } from '../context.js';

describe('JobsPage', () => {
  it('renders the page header and empty state', () => {
    const { lastFrame } = render(
      <WizardProvider>
        <JobsPage />
      </WizardProvider>,
    );
    const frame = lastFrame() ?? '';
    expect(frame).toContain('Jobs');
    expect(frame).toContain('(no jobs yet)');
    expect(frame).toContain('[+ Add new job]');
    expect(frame).toContain('[Done]');
  });

  it('renders keyboard hints', () => {
    const { lastFrame } = render(
      <WizardProvider>
        <JobsPage />
      </WizardProvider>,
    );
    const frame = lastFrame() ?? '';
    expect(frame).toContain('Up/Down');
    expect(frame).toContain('Enter');
    expect(frame).toContain('Esc');
  });
});
