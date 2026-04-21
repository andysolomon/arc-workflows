import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'ink-testing-library';
import { NumberField } from './number-field.js';

describe('NumberField', () => {
  it('renders label and initial value', () => {
    const { lastFrame } = render(
      <NumberField label="Count" value={42} onChange={() => {}} />,
    );
    const frame = lastFrame() ?? '';
    expect(frame).toContain('Count');
    expect(frame).toContain('42');
  });

  it('renders empty placeholder when value is null', () => {
    const { lastFrame } = render(
      <NumberField label="Count" value={null} onChange={() => {}} />,
    );
    expect(lastFrame() ?? '').toContain('(empty)');
  });

  it('ignores non-numeric input', () => {
    const onChange = vi.fn();
    const { stdin } = render(
      <NumberField label="Count" value={null} onChange={onChange} />,
    );
    stdin.write('x');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('does not capture input when inactive', () => {
    const onChange = vi.fn();
    const { stdin } = render(
      <NumberField
        label="Count"
        value={null}
        onChange={onChange}
        active={false}
      />,
    );
    stdin.write('5');
    expect(onChange).not.toHaveBeenCalled();
  });
});
