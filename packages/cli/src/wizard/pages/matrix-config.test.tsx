import React from 'react';
import { describe, expect, it } from 'vitest';
import { render } from 'ink-testing-library';
import { MatrixConfigPage } from './matrix-config.js';

describe('MatrixConfigPage', () => {
  it('renders the title and empty initial state', () => {
    const { lastFrame } = render(
      <MatrixConfigPage initial={undefined} onCommit={() => undefined} onBack={() => undefined} />,
    );
    const frame = lastFrame() ?? '';
    expect(frame).toContain('Configure matrix');
    expect(frame).toContain('dimension 1 name');
    expect(frame).toContain('[+ Add dimension]');
    expect(frame).toContain('[Done]');
  });

  it('renders initial dimensions', () => {
    const { lastFrame } = render(
      <MatrixConfigPage
        initial={{ 'node-version': [18, 20, 22], os: ['ubuntu-latest', 'macos-latest'] }}
        onCommit={() => undefined}
        onBack={() => undefined}
      />,
    );
    const frame = lastFrame() ?? '';
    expect(frame).toContain('node-version');
    expect(frame).toContain('18');
    expect(frame).toContain('20');
    expect(frame).toContain('22');
    expect(frame).toContain('os');
    expect(frame).toContain('ubuntu-latest');
  });

  it('skips include and exclude in the initial matrix', () => {
    const { lastFrame } = render(
      <MatrixConfigPage
        initial={{
          'node-version': [20],
          include: [{ 'node-version': 18, experimental: true }],
          exclude: [{ 'node-version': 22 }],
        }}
        onCommit={() => undefined}
        onBack={() => undefined}
      />,
    );
    const frame = lastFrame() ?? '';
    expect(frame).toContain('node-version');
    // include/exclude labels should not be dimension names in the UI
    expect(frame).not.toContain('dimension 2 name');
  });
});
