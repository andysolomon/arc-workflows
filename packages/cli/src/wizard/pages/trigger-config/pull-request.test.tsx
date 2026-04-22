import React from 'react';
import { describe, expect, it } from 'vitest';
import { render } from 'ink-testing-library';
import { PullRequestConfigPage } from './pull-request.js';

describe('PullRequestConfigPage', () => {
  it('renders filter fields and activity types', () => {
    const { lastFrame } = render(
      <PullRequestConfigPage initial={{}} onCommit={() => undefined} onBack={() => undefined} />,
    );
    const frame = lastFrame() ?? '';
    expect(frame).toContain('Configure pull_request trigger');
    expect(frame).toContain('branches');
    expect(frame).toContain('opened');
    expect(frame).toContain('synchronize');
    expect(frame).toContain('review_requested');
  });

  it('renders checked marks for initial activity types', () => {
    const { lastFrame } = render(
      <PullRequestConfigPage
        initial={{ types: ['opened', 'synchronize'] }}
        onCommit={() => undefined}
        onBack={() => undefined}
      />,
    );
    const frame = lastFrame() ?? '';
    expect(frame.match(/\[x\]/g)?.length).toBeGreaterThanOrEqual(2);
  });
});
