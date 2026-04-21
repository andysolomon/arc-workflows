import React from 'react';
import { describe, expect, it } from 'vitest';
import { render } from 'ink-testing-library';
import { TriggersPage } from './triggers.js';
import { WizardProvider } from '../context.js';

describe('TriggersPage', () => {
  it('starts at the trigger-select checklist', () => {
    const { lastFrame } = render(
      <WizardProvider>
        <TriggersPage />
      </WizardProvider>,
    );
    const frame = lastFrame() ?? '';
    expect(frame).toContain('Select triggers');
    expect(frame).toContain('push');
    expect(frame).toContain('pull_request');
    expect(frame).toContain('schedule');
    expect(frame).toContain('workflow_dispatch');
    expect(frame).toContain('workflow_call');
  });
});
