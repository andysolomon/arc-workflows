import React from 'react';
import { describe, expect, it } from 'vitest';
import { render } from 'ink-testing-library';
import { DispatchConfigPage } from './dispatch.js';

describe('DispatchConfigPage', () => {
  it('renders the inputs builder', () => {
    const { lastFrame } = render(
      <DispatchConfigPage initial={{}} onCommit={() => undefined} onBack={() => undefined} />,
    );
    const frame = lastFrame() ?? '';
    expect(frame).toContain('workflow_dispatch');
    expect(frame).toContain('inputs');
    expect(frame).toContain('string');
  });

  it('renders initial inputs as NAME: description rows', () => {
    const { lastFrame } = render(
      <DispatchConfigPage
        initial={{
          inputs: {
            environment: { type: 'string', description: 'Target env' },
          },
        }}
        onCommit={() => undefined}
        onBack={() => undefined}
      />,
    );
    expect(lastFrame() ?? '').toContain('environment: Target env');
  });
});
