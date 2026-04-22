import React from 'react';
import { describe, expect, it } from 'vitest';
import { render } from 'ink-testing-library';
import { ActionStepForm } from './action-step-form.js';

describe('ActionStepForm', () => {
  it('renders all action-step fields', () => {
    const { lastFrame } = render(
      <ActionStepForm initial={{ uses: '' }} onCommit={() => undefined} onBack={() => undefined} />,
    );
    const frame = lastFrame() ?? '';
    expect(frame).toContain('Configure action step');
    expect(frame).toContain('name');
    expect(frame).toContain('id');
    expect(frame).toContain('if');
    expect(frame).toContain('uses');
    expect(frame).toContain('with');
    expect(frame).toContain('env');
    expect(frame).toContain('continue-on-error');
    expect(frame).toContain('timeout-minutes');
    expect(frame).toContain('working-directory');
    expect(frame).toContain('[Done]');
  });

  it('pre-fills fields from the initial step', () => {
    const { lastFrame } = render(
      <ActionStepForm
        initial={{
          uses: 'actions/checkout@v4',
          name: 'Checkout',
          with: { 'fetch-depth': 0 },
        }}
        onCommit={() => undefined}
        onBack={() => undefined}
      />,
    );
    const frame = lastFrame() ?? '';
    expect(frame).toContain('actions/checkout@v4');
    expect(frame).toContain('Checkout');
    expect(frame).toContain('fetch-depth=0');
  });
});
