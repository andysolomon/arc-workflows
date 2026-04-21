import React from 'react';
import { describe, expect, it } from 'vitest';
import { render } from 'ink-testing-library';
import { YamlPreview } from './yaml-preview.js';
import { WizardProvider } from '../wizard/context.js';

describe('YamlPreview', () => {
  it('renders YAML from the wizard context', () => {
    const { lastFrame } = render(
      <WizardProvider>
        <YamlPreview />
      </WizardProvider>,
    );
    // Initial context has `jobs: {}` only. The preview may render just
    // `on: {}\njobs: {}` or similar.
    const frame = lastFrame() ?? '';
    expect(typeof frame).toBe('string');
    expect(frame.length).toBeGreaterThan(0);
  });
});
