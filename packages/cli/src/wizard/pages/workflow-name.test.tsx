import React from 'react';
import { describe, expect, it } from 'vitest';
import { render } from 'ink-testing-library';
import { WorkflowNamePage } from './workflow-name.js';
import { WizardProvider } from '../context.js';

describe('WorkflowNamePage', () => {
  it('renders the title and prompt', () => {
    const { lastFrame } = render(
      <WizardProvider>
        <WorkflowNamePage />
      </WizardProvider>,
    );
    const frame = lastFrame() ?? '';
    expect(frame).toContain('Name your workflow');
    expect(frame).toContain('Enter');
  });
});
