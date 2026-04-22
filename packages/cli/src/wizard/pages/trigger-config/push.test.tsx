import React from 'react';
import { describe, expect, it } from 'vitest';
import { render } from 'ink-testing-library';
import { PushConfigPage } from './push.js';

describe('PushConfigPage', () => {
  it('renders all 6 filter fields', () => {
    const { lastFrame } = render(
      <PushConfigPage initial={{}} onCommit={() => undefined} onBack={() => undefined} />,
    );
    const frame = lastFrame() ?? '';
    expect(frame).toContain('Configure push trigger');
    expect(frame).toContain('branches');
    expect(frame).toContain('branches-ignore');
    expect(frame).toContain('tags');
    expect(frame).toContain('tags-ignore');
    expect(frame).toContain('paths');
    expect(frame).toContain('paths-ignore');
  });

  it('renders initial filter values', () => {
    const { lastFrame } = render(
      <PushConfigPage
        initial={{ branches: ['main', 'dev'], tags: ['v*'] }}
        onCommit={() => undefined}
        onBack={() => undefined}
      />,
    );
    const frame = lastFrame() ?? '';
    expect(frame).toContain('main');
    expect(frame).toContain('dev');
    expect(frame).toContain('v*');
  });

  it('renders the Done button', () => {
    const { lastFrame } = render(
      <PushConfigPage initial={{}} onCommit={() => undefined} onBack={() => undefined} />,
    );
    expect(lastFrame() ?? '').toContain('[Done]');
  });
});
