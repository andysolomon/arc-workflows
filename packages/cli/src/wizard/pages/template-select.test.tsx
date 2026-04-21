import React from 'react';
import { describe, expect, it } from 'vitest';
import { render } from 'ink-testing-library';
import { TemplateSelectPage } from './template-select.js';
import { WizardProvider } from '../context.js';

describe('TemplateSelectPage', () => {
  it('renders the title', () => {
    const { lastFrame } = render(
      <WizardProvider>
        <TemplateSelectPage />
      </WizardProvider>,
    );
    const frame = lastFrame() ?? '';
    expect(frame).toContain('Select a template');
  });

  it('renders a Blank workflow option', () => {
    const { lastFrame } = render(
      <WizardProvider>
        <TemplateSelectPage />
      </WizardProvider>,
    );
    const frame = lastFrame() ?? '';
    expect(frame).toContain('Blank workflow');
  });
});
