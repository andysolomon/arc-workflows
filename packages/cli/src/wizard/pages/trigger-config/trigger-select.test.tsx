import React from 'react';
import { describe, expect, it } from 'vitest';
import { render } from 'ink-testing-library';
import { TriggerSelectPage } from './trigger-select.js';

describe('TriggerSelectPage', () => {
  it('renders the title and all 5 events', () => {
    const { lastFrame } = render(
      <TriggerSelectPage
        initial={new Set()}
        onCommit={() => {}}
        onBack={() => {}}
      />,
    );
    const frame = lastFrame() ?? '';
    expect(frame).toContain('Select triggers');
    expect(frame).toContain('push');
    expect(frame).toContain('pull_request');
    expect(frame).toContain('schedule');
    expect(frame).toContain('workflow_dispatch');
    expect(frame).toContain('workflow_call');
  });

  it('shows checked marks for initially selected events', () => {
    const { lastFrame } = render(
      <TriggerSelectPage
        initial={new Set(['push', 'pull_request'])}
        onCommit={() => {}}
        onBack={() => {}}
      />,
    );
    const frame = lastFrame() ?? '';
    // Two checked boxes expected
    expect(frame.match(/\[x\]/g)?.length).toBeGreaterThanOrEqual(2);
  });

  it('renders keyboard hint', () => {
    const { lastFrame } = render(
      <TriggerSelectPage
        initial={new Set()}
        onCommit={() => {}}
        onBack={() => {}}
      />,
    );
    expect(lastFrame() ?? '').toContain('Space toggles');
  });
});
