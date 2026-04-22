import React from 'react';
import { describe, expect, it } from 'vitest';
import { render } from 'ink-testing-library';
import { CallConfigPage } from './call.js';

describe('CallConfigPage', () => {
  it('renders the inputs builder', () => {
    const { lastFrame } = render(
      <CallConfigPage initial={{}} onCommit={() => undefined} onBack={() => undefined} />,
    );
    const frame = lastFrame() ?? '';
    expect(frame).toContain('workflow_call');
    expect(frame).toContain('inputs');
  });

  it('renders initial inputs', () => {
    const { lastFrame } = render(
      <CallConfigPage
        initial={{
          inputs: {
            'artifact-name': { type: 'string', description: 'Artifact to download' },
          },
        }}
        onCommit={() => undefined}
        onBack={() => undefined}
      />,
    );
    expect(lastFrame() ?? '').toContain('artifact-name: Artifact to download');
  });
});
