import React from 'react';
import { describe, expect, it } from 'vitest';
import { render } from 'ink-testing-library';
import { App } from '../../app.js';

describe('welcome page', () => {
  it('renders the welcome text', () => {
    const { lastFrame } = render(<App />);
    expect(lastFrame()).toContain('arc-workflows');
  });

  it('renders the tagline', () => {
    const { lastFrame } = render(<App />);
    expect(lastFrame()).toContain('Build GitHub Actions workflows with confidence');
  });
});
