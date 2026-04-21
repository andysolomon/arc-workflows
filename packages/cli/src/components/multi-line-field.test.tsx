import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'ink-testing-library';
import { MultiLineField } from './multi-line-field.js';

describe('MultiLineField', () => {
  it('renders the label and placeholder when empty', () => {
    const { lastFrame } = render(
      <MultiLineField
        label="Description"
        value=""
        onChange={() => undefined}
        placeholder="Enter text"
      />,
    );
    const frame = lastFrame() ?? '';
    expect(frame).toContain('Description');
    expect(frame).toContain('Enter text');
  });

  it('renders multi-line values across multiple rows', () => {
    const { lastFrame } = render(
      <MultiLineField label="Body" value={'first\nsecond'} onChange={() => undefined} />,
    );
    const frame = lastFrame() ?? '';
    expect(frame).toContain('first');
    expect(frame).toContain('second');
  });

  it('does not capture input when inactive', () => {
    const onChange = vi.fn();
    const { stdin } = render(
      <MultiLineField label="Body" value="foo" onChange={onChange} active={false} />,
    );
    stdin.write('x');
    expect(onChange).not.toHaveBeenCalled();
  });
});
