import { describe, expect, it } from 'vitest';
import React from 'react';
import { render } from 'ink-testing-library';
import { App } from '../../app.js';

describe('welcome page', () => {
  it('renders the welcome message', () => {
    const { lastFrame } = render(React.createElement(App));
    expect(lastFrame()).toContain('arc-workflows');
    expect(lastFrame()).toContain('Create a new workflow');
  });
});
