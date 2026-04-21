import React from 'react';
import { describe, expect, it } from 'vitest';
import { render } from 'ink-testing-library';
import { App } from '../app.js';

describe('Layout', () => {
  it('renders full-width on welcome (no split-pane)', () => {
    // ink-testing-library uses a default column width (~80)
    const { lastFrame } = render(<App />);
    const frame = lastFrame() ?? '';
    // On welcome, no "│" divider should appear
    expect(frame).not.toContain('│');
  });

  it('still renders the welcome text through the layout wrapper', () => {
    const { lastFrame } = render(<App />);
    expect(lastFrame()).toContain('arc-workflows');
  });

  // Additional tests may need to mock useStdout or dispatch events to
  // transition the machine past welcome. Use createActor + send to test
  // the machine independently, and rely on App integration tests for layout.
});
