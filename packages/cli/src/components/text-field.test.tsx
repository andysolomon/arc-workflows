import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'ink-testing-library';
import { TextField } from './text-field.js';

describe('TextField', () => {
  it('renders the label', () => {
    const { lastFrame } = render(
      <TextField label="Name" value="" onChange={() => {}} placeholder="e.g. CI" />,
    );
    const frame = lastFrame() ?? '';
    expect(frame).toContain('Name');
    expect(frame).toContain('e.g. CI');
  });

  it('renders the current value when non-empty', () => {
    const { lastFrame } = render(
      <TextField label="Name" value="hello" onChange={() => {}} />,
    );
    expect(lastFrame() ?? '').toContain('hello');
  });

  it('renders an error when provided', () => {
    const { lastFrame } = render(
      <TextField label="Name" value="" onChange={() => {}} error="Required" />,
    );
    expect(lastFrame() ?? '').toContain('Required');
  });

  it('does not capture input when inactive', () => {
    const onChange = vi.fn();
    const { stdin } = render(
      <TextField label="Name" value="foo" onChange={onChange} active={false} />,
    );
    stdin.write('x');
    expect(onChange).not.toHaveBeenCalled();
  });
});